import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type CookieObj = {
  name?: string;
  value?: string;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  expires?: number;
  // Netscape / generic fallback
  [key: string]: unknown;
};

/**
 * Convert JSON cookie array to Cookie header string.
 * Supports both standard format [{name, value}] and
 * flat object {key: value} formats.
 */
function jsonToCookieHeader(json: unknown): string {
  if (Array.isArray(json)) {
    return (json as CookieObj[])
      .filter((c) => c.name && c.value !== undefined)
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
  }
  if (typeof json === "object" && json !== null) {
    return Object.entries(json as Record<string, unknown>)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
  return "";
}

/**
 * Parse Netscape cookie file format to Cookie header string.
 * Format: domain  httpOnly  path  secure  expiry  name  value
 */
function netscapeToCookieHeader(netscape: string): string {
  const lines = netscape.split("\n");
  const cookies: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length >= 7) {
      const name = parts[5];
      const value = parts[6];
      if (name) cookies.push(`${name}=${value}`);
    }
  }
  return cookies.join("; ");
}

/**
 * Detect if a response URL indicates a login redirect.
 * Returns true if cookies appear invalid/expired.
 */
function isLoginRedirect(finalUrl: string, domain: string): boolean {
  const loginPatterns = [
    "/login", "/signin", "/sign-in", "/auth", "/account/login",
    "/users/sign_in", "/session/new", "/sso", "/oauth",
    "/authenticate", "/connect", "/authorize", "/member/login",
    "/user/login", "/portal/login"
  ];
  try {
    const url = new URL(finalUrl);
    const path = url.pathname.toLowerCase();
    return loginPatterns.some((p) => path.includes(p));
  } catch {
    return false;
  }
}

/**
 * Detect if response body contains a login form.
 * Checks for common login form elements and patterns.
 */
function containsLoginForm(html: string): boolean {
  const htmlLower = html.toLowerCase();
  
  // Cek form login elements
  const loginFormIndicators = [
    'type="password"',
    "type='password'",
    'name="password"',
    "name='password'",
    'id="password"',
    "id='password'",
    'action="/login"',
    "action='/login'",
    'action="/signin"',
    "action='/signin'",
    'class="login-form"',
    "class='login-form'",
    'id="login-form"',
    "id='login-form'",
    'placeholder="password"',
    "placeholder='password'"
  ];
  
  // Harus ada minimal 2 indikator untuk menghindari false positive
  const matchCount = loginFormIndicators.filter(indicator => 
    htmlLower.includes(indicator)
  ).length;
  
  return matchCount >= 2;
}

/**
 * Detect if response body contains authentication error messages.
 */
function containsAuthError(html: string): boolean {
  const htmlLower = html.toLowerCase();
  
  // Cek auth error messages
  const authErrorPatterns = [
    'unauthorized',
    'not authorized',
    'please login',
    'please log in',
    'please sign in',
    'session expired',
    'session has expired',
    'login required',
    'authentication required',
    'access denied',
    'invalid session',
    'token expired',
    'please authenticate',
    'you must be logged in',
    'your session has timed out',
    'redirecting to login',
    'redirect to login',
    'authentication failed',
    'login to continue',
    'sign in to continue'
  ];
  
  return authErrorPatterns.some(pattern => htmlLower.includes(pattern));
}

/**
 * Detect if response body contains authenticated content indicators.
 * Returns true if content appears to be from an authenticated session.
 */
function containsAuthenticatedContent(html: string): boolean {
  const htmlLower = html.toLowerCase();
  
  // Cek indikator konten authenticated
  const authenticatedIndicators = [
    'logout',
    'log out',
    'sign out',
    'signout',
    'my account',
    'my profile',
    'account settings',
    'user settings',
    'welcome back',
    'dashboard'
  ];
  
  // Harus ada minimal 2 indikator untuk lebih yakin
  const matchCount = authenticatedIndicators.filter(indicator => 
    htmlLower.includes(indicator)
  ).length;
  
  return matchCount >= 2;
}

/**
 * Check response headers for authentication failure indicators.
 */
function hasAuthFailureHeaders(headers: Headers): boolean {
  // Cek WWW-Authenticate header (menunjukkan auth required)
  if (headers.has('www-authenticate')) {
    return true;
  }
  
  // Cek Set-Cookie dengan expired cookies
  const setCookie = headers.get('set-cookie');
  if (setCookie) {
    const cookieLower = setCookie.toLowerCase();
    if (cookieLower.includes('max-age=0') || 
        cookieLower.includes('expires=thu, 01 jan 1970')) {
      return true;
    }
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      domain,
      cookies_json,
      cookies_netscape,
      cookie_format,
      check_url,
    } = body as {
      domain: string;
      cookies_json?: unknown;
      cookies_netscape?: string;
      cookie_format: "json" | "netscape";
      check_url?: string;
    };

    if (!domain) {
      return NextResponse.json({ ok: false, error: "Domain is required" }, { status: 400 });
    }

    // Build cookie header string
    let cookieHeader = "";
    if (cookie_format === "json" && cookies_json) {
      cookieHeader = jsonToCookieHeader(cookies_json);
    } else if (cookie_format === "netscape" && cookies_netscape) {
      cookieHeader = netscapeToCookieHeader(cookies_netscape);
    }

    if (!cookieHeader) {
      return NextResponse.json({
        ok: false,
        status: null,
        error: "No cookies to test",
        detail: "Cookies belum diisi atau format tidak valid.",
      });
    }

    // Determine URL to check
    const targetUrl = check_url || `https://${domain}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // Increase to 15s

    let finalUrl = targetUrl;
    let httpStatus = 0;
    let redirectedToLogin = false;
    let responseOk = false;
    let errorMsg: string | null = null;
    let responseBody = "";

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Cookie: cookieHeader,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/json,*/*;q=0.9",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      httpStatus = response.status;
      finalUrl = response.url || targetUrl;
      redirectedToLogin = isLoginRedirect(finalUrl, domain);

      // Cek auth failure headers
      if (hasAuthFailureHeaders(response.headers)) {
        clearTimeout(timeout);
        return NextResponse.json({
          ok: false,
          status: httpStatus,
          final_url: finalUrl,
          redirected_to_login: false,
          error: "Cookies tidak valid — server mengirim auth failure headers.",
          detail: "Response headers menunjukkan autentikasi gagal (WWW-Authenticate atau expired cookies).",
        });
      }

      // Jika status 401 atau 403, langsung invalid
      if (httpStatus === 401 || httpStatus === 403) {
        clearTimeout(timeout);
        return NextResponse.json({
          ok: false,
          status: httpStatus,
          final_url: finalUrl,
          redirected_to_login: false,
          error: `Cookies tidak valid — HTTP ${httpStatus} (Unauthorized/Forbidden).`,
          detail: `Server menolak akses dengan status ${httpStatus}.`,
        });
      }

      // Ambil response body untuk analisis lebih lanjut (hanya untuk HTML)
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        try {
          responseBody = await response.text();
        } catch {
          // Jika gagal baca body, lanjutkan dengan validasi basic
          responseBody = "";
        }
      }

      // Analisis response body jika ada
      if (responseBody) {
        // Cek apakah ada login form
        if (containsLoginForm(responseBody)) {
          clearTimeout(timeout);
          return NextResponse.json({
            ok: false,
            status: httpStatus,
            final_url: finalUrl,
            redirected_to_login: false,
            error: "Cookies tidak valid — halaman berisi login form.",
            detail: "Response body mengandung form login (password field detected).",
          });
        }

        // Cek apakah ada auth error messages
        if (containsAuthError(responseBody)) {
          clearTimeout(timeout);
          return NextResponse.json({
            ok: false,
            status: httpStatus,
            final_url: finalUrl,
            redirected_to_login: false,
            error: "Cookies tidak valid — ditemukan pesan auth error.",
            detail: "Response body mengandung pesan error autentikasi (session expired, please login, dll).",
          });
        }

        // Jika tidak ada indikator authenticated content, berikan warning
        if (!containsAuthenticatedContent(responseBody) && !redirectedToLogin) {
          // Tapi jangan langsung invalid, karena bisa false positive
          // Hanya berikan warning
          clearTimeout(timeout);
          return NextResponse.json({
            ok: true,
            status: httpStatus,
            final_url: finalUrl,
            redirected_to_login: false,
            error: null,
            detail: `Cookies mungkin valid (HTTP ${httpStatus}), tapi tidak ditemukan indikator konten authenticated yang jelas. Silakan verifikasi manual.`,
            warning: "No clear authenticated content indicators found",
          });
        }
      }

      // 200-299 and not redirected to login = valid
      responseOk = response.ok && !redirectedToLogin;
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        errorMsg = "Request timeout (15s). Domain mungkin lambat atau memblokir request.";
      } else if (fetchErr instanceof Error) {
        errorMsg = fetchErr.message;
      } else {
        errorMsg = "Fetch failed";
      }
    } finally {
      clearTimeout(timeout);
    }

    if (errorMsg) {
      return NextResponse.json({
        ok: false,
        status: httpStatus || null,
        error: errorMsg,
        final_url: finalUrl,
        redirected_to_login: false,
      });
    }

    return NextResponse.json({
      ok: responseOk,
      status: httpStatus,
      final_url: finalUrl,
      redirected_to_login: redirectedToLogin,
      error: redirectedToLogin
        ? "Cookies tidak valid — diarahkan ke halaman login."
        : httpStatus >= 400
        ? `HTTP ${httpStatus} — server menolak request.`
        : null,
      detail: responseOk
        ? `Cookies valid. Server merespons ${httpStatus} dari ${finalUrl}${responseBody && containsAuthenticatedContent(responseBody) ? ' dengan konten authenticated.' : '.'}`
        : redirectedToLogin
        ? `Diarahkan ke: ${finalUrl}`
        : `HTTP ${httpStatus} dari ${finalUrl}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
