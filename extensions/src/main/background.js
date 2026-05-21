// Simply Main - Background Service Worker
// Komunikasi dengan Supabase dan manage cookies
// Enkripsi AES-GCM 256-bit via crypto.js (importScripts)

// ── Import crypto module ──
importScripts("crypto.js");

// Supabase configuration
const SUPABASE_URL = "https://iezahoirodrlcaxfxxtw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bmr9JMZ47X1gGhVgWabM6Q_ZEjCN0Ki";
const DASHBOARD_URL = "https://simply-tau.vercel.app";

// State
let userSession = null;
let userProfile = null;
let services = [];
let isGuardActive = false;

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Simply Main installed");
  await checkGuardExtension();
  await loadUserSession();
});

// Check on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("Simply Main started");
  await checkGuardExtension();
  await loadUserSession();
});

// Check if Guard extension is installed and active
async function checkGuardExtension() {
  try {
    const allExtensions = await chrome.management.getAll();
    const guardExtension = allExtensions.find(ext =>
      ext.name.includes("Simply Guard") && ext.enabled
    );

    isGuardActive = !!guardExtension;

    if (!isGuardActive) {
      console.warn("Simply Guard not active - some features may not work properly");
    }

    await setEncrypted("isGuardActive", isGuardActive);
    return isGuardActive;
  } catch (error) {
    console.error("Error checking Guard extension:", error);
    return false;
  }
}

// Load user session from encrypted storage
async function loadUserSession() {
  try {
    const storedSession  = await getEncrypted("userSession");
    const storedProfile  = await getEncrypted("userProfile");
    const storedServices = await getEncrypted("services");

    if (storedSession) {
      userSession  = storedSession;
      userProfile  = storedProfile;
      services     = storedServices || [];

      // Verify session is still valid
      const isValid = await verifySession(userSession);
      if (!isValid) {
        await clearSession();
      }
    }
  } catch (error) {
    console.error("Error loading session:", error);
  }
}

// Verify session with Supabase
async function verifySession(session) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": SUPABASE_ANON_KEY
      }
    });

    return response.ok;
  } catch (error) {
    console.error("Error verifying session:", error);
    return false;
  }
}

// Fetch user profile from Supabase — filtered by authenticated user ID
async function fetchUserProfile(accessToken, userId) {
  try {
    let uid = userId;
    if (!uid) {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "apikey": SUPABASE_ANON_KEY
        }
      });
      if (!authRes.ok) throw new Error("Failed to get auth user");
      const authUser = await authRes.json();
      uid = authUser.id;
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${uid}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "apikey": SUPABASE_ANON_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) throw new Error("Failed to fetch profile");

    const profiles = await response.json();
    const profile = profiles[0] || null;

    if (!profile) {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "apikey": SUPABASE_ANON_KEY
        }
      });
      if (authRes.ok) {
        const authUser = await authRes.json();
        return {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || null,
          plan: "free",
          role: "user",
        };
      }
    }

    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

// Fetch services from Supabase
async function fetchServices(accessToken) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/services?select=*&status=eq.active&order=name`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error("Failed to fetch services");

    return await response.json();
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

// Login user - open dashboard login page
async function loginUser() {
  await chrome.tabs.create({ url: `${DASHBOARD_URL}/login` });
}

// Clear session — hapus semua data terenkripsi dari storage
async function clearSession() {
  userSession = null;
  userProfile = null;
  services = [];
  await chrome.storage.local.remove([
    "userSession",
    "userProfile",
    "services",
    "isGuardActive"
  ]);
}

// Hapus semua cookies yang ada pada domain tertentu sebelum inject baru
async function clearCookiesForDomain(domain) {
  try {
    const baseDomain = domain.startsWith(".") ? domain : `.${domain}`;
    const urls = [`https://${domain}`, `https://www.${domain}`];
    let removed = 0;

    for (const url of urls) {
      const existing = await chrome.cookies.getAll({ url });
      for (const cookie of existing) {
        await chrome.cookies.remove({ url, name: cookie.name });
        removed++;
      }
    }

    const byDomain = await chrome.cookies.getAll({ domain: baseDomain });
    for (const cookie of byDomain) {
      const cookieUrl = `https://${cookie.domain.replace(/^\./, "")}${cookie.path}`;
      try {
        await chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
        removed++;
      } catch (_) {}
    }

    console.log(`[Simply] Cleared ${removed} cookies for domain: ${domain}`);
    return removed;
  } catch (error) {
    console.error("Error clearing cookies:", error);
    return 0;
  }
}

// Inject cookies to service domain
async function injectCookies(service, tabId) {
  try {
    if (!service.cookies_json && !service.cookies_netscape) {
      throw new Error("No cookies available for this service");
    }

    const domain = service.domain;
    console.log(`[Simply] Injecting cookies for service: ${service.name} (${service.id}) → domain: ${domain}`);

    await clearCookiesForDomain(domain);

    let cookies = [];

    // Dekripsi cookies_json jika terenkripsi
    let cookiesJson = service.cookies_json;
    if (cookiesJson && isEncrypted(cookiesJson)) {
      try {
        cookiesJson = await decryptData(cookiesJson);
      } catch (_) {}
    }

    // Dekripsi cookies_netscape jika terenkripsi
    let cookiesNetscape = service.cookies_netscape;
    if (cookiesNetscape && isEncrypted(cookiesNetscape)) {
      try {
        cookiesNetscape = await decryptData(cookiesNetscape);
      } catch (_) {}
    }

    if (service.cookie_format === "json" && cookiesJson) {
      cookies = parseCookiesFromJSON(cookiesJson, domain);
    } else if (service.cookie_format === "netscape" && cookiesNetscape) {
      cookies = parseCookiesFromNetscape(cookiesNetscape, domain);
    } else if (cookiesJson) {
      cookies = parseCookiesFromJSON(cookiesJson, domain);
    } else if (cookiesNetscape) {
      cookies = parseCookiesFromNetscape(cookiesNetscape, domain);
    }

    if (cookies.length === 0) {
      throw new Error("Tidak ada cookies yang berhasil di-parse untuk service ini");
    }

    let successCount = 0;
    const errors = [];
    for (const cookie of cookies) {
      try {
        await chrome.cookies.set(cookie);
        successCount++;
      } catch (err) {
        errors.push(`${cookie.name}: ${err.message}`);
        console.warn(`[Simply] Gagal set cookie "${cookie.name}":`, err.message);
      }
    }

    console.log(`[Simply] Injected ${successCount}/${cookies.length} cookies untuk ${service.name}`);
    if (errors.length > 0) {
      console.warn(`[Simply] Cookie errors:`, errors);
    }

    return { success: true, count: successCount, total: cookies.length };
  } catch (error) {
    console.error("Error injecting cookies:", error);
    return { success: false, error: error.message };
  }
}

// Parse cookies dari format JSON
function parseCookiesFromJSON(cookiesJson, domain) {
  const cookies = [];
  const baseUrl = `https://${domain}`;
  const baseDomain = domain.startsWith(".") ? domain : `.${domain}`;

  let parsed = cookiesJson;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      console.error("[Simply] Gagal parse cookies_json sebagai JSON:", e.message);
      return cookies;
    }
  }

  if (Array.isArray(parsed)) {
    for (const c of parsed) {
      if (!c.name) continue;

      const cookieDomain = c.domain
        ? (c.domain.startsWith(".") ? c.domain : `.${c.domain}`)
        : baseDomain;

      const cookieUrl = `https://${cookieDomain.replace(/^\./, "")}${c.path || "/"}`;

      const cookieObj = {
        url: cookieUrl,
        name: c.name,
        value: String(c.value ?? ""),
        domain: cookieDomain,
        path: c.path || "/",
        secure: c.secure !== undefined ? Boolean(c.secure) : true,
        httpOnly: c.httpOnly !== undefined ? Boolean(c.httpOnly) : false,
        sameSite: c.sameSite
          ? c.sameSite.toLowerCase().replace("_", "")
          : "no_restriction",
      };

      const exp = c.expirationDate || c.expires || c.expiry;
      if (exp && Number.isFinite(Number(exp)) && Number(exp) > 0) {
        cookieObj.expirationDate = Number(exp);
      }

      cookies.push(cookieObj);
    }
    console.log(`[Simply] Parsed ${cookies.length} cookies dari format JSON array`);
    return cookies;
  }

  if (typeof parsed === "object" && parsed !== null) {
    for (const [name, value] of Object.entries(parsed)) {
      cookies.push({
        url: baseUrl,
        name: name,
        value: String(value ?? ""),
        domain: baseDomain,
        path: "/",
        secure: true,
        httpOnly: false,
        sameSite: "no_restriction",
      });
    }
    console.log(`[Simply] Parsed ${cookies.length} cookies dari format JSON object`);
    return cookies;
  }

  console.warn("[Simply] Format cookies_json tidak dikenali");
  return cookies;
}

// Parse cookies dari format Netscape
function parseCookiesFromNetscape(netscapeText, domain) {
  const cookies = [];

  if (typeof netscapeText !== "string") {
    console.warn("[Simply] cookies_netscape bukan string");
    return cookies;
  }

  const lines = netscapeText.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split("\t");
    if (parts.length < 7) {
      console.warn(`[Simply] Baris Netscape tidak valid (${parts.length} kolom):`, line);
      continue;
    }

    const [cookieDomain, , path, secureStr, expiryStr, name, ...valueParts] = parts;
    const value = valueParts.join("\t");

    if (!name) continue;

    const normalizedDomain = cookieDomain.startsWith(".")
      ? cookieDomain
      : `.${cookieDomain}`;

    const cookieUrl = `https://${normalizedDomain.replace(/^\./, "")}${path || "/"}`;
    const expiry = parseInt(expiryStr, 10);

    const cookieObj = {
      url: cookieUrl,
      name: name.trim(),
      value: value.trim(),
      domain: normalizedDomain,
      path: path || "/",
      secure: secureStr === "TRUE",
      httpOnly: false,
      sameSite: "no_restriction",
    };

    if (Number.isFinite(expiry) && expiry > 0) {
      cookieObj.expirationDate = expiry;
    }

    cookies.push(cookieObj);
  }

  console.log(`[Simply] Parsed ${cookies.length} cookies dari format Netscape`);
  return cookies;
}

// Buka service di tab baru dengan inject cookies
async function openService(service) {
  try {
    const serviceUrl = `https://${service.domain}`;
    console.log(`[Simply] Opening service: ${service.name} → ${serviceUrl}`);

    const injectResult = await injectCookies(service, null);

    if (!injectResult.success) {
      return { success: false, error: injectResult.error };
    }

    const tab = await chrome.tabs.create({ url: serviceUrl, active: true });

    console.log(`[Simply] Tab dibuka (id: ${tab.id}), cookies: ${injectResult.count}/${injectResult.total}`);
    return {
      success: true,
      message: `Cookies injected (${injectResult.count}/${injectResult.total})`,
      tabId: tab.id
    };
  } catch (error) {
    console.error("Error opening service:", error);
    return { success: false, error: error.message };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.type === "CHECK_GUARD") {
        const guardActive = await checkGuardExtension();
        sendResponse({ installed: guardActive });

      } else if (request.type === "GET_SESSION") {
        sendResponse({ user: userProfile, session: userSession });

      } else if (request.type === "GET_SERVICES") {
        sendResponse({ services });

      } else if (request.type === "OPEN_SERVICE") {
        const service = services.find(s => s.id === request.data.serviceId);
        if (service) {
          const result = await openService(service);
          sendResponse(result);
        } else {
          sendResponse({ success: false, error: "Service not found" });
        }

      } else if (request.type === "LOGOUT") {
        await clearSession();
        sendResponse({ success: true });

      } else if (request.action === "getStatus") {
        sendResponse({
          isLoggedIn: !!userSession,
          isGuardActive,
          userProfile,
          services
        });

      } else if (request.action === "login") {
        await loginUser();
        sendResponse({ success: true });

      } else if (request.action === "logout") {
        await clearSession();
        sendResponse({ success: true });

      } else if (request.action === "refreshData") {
        if (userSession) {
          const uid = userSession.user?.id || null;
          userProfile = await fetchUserProfile(userSession.access_token, uid);
          services = await fetchServices(userSession.access_token);
          await setEncrypted("userProfile", userProfile);
          await setEncrypted("services", services);
        }
        sendResponse({ success: true, userProfile, services });

      } else if (request.action === "openService") {
        const result = await openService(request.service);
        sendResponse(result);

      } else if (request.action === "setSession") {
        userSession = request.session;
        const userId = userSession.user?.id || null;
        userProfile = await fetchUserProfile(userSession.access_token, userId);
        services = await fetchServices(userSession.access_token);
        await setEncrypted("userSession", userSession);
        await setEncrypted("userProfile", userProfile);
        await setEncrypted("services", services);
        sendResponse({ success: true });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true;
});

// Periodic session check (every 5 minutes)
setInterval(async () => {
  if (userSession) {
    const isValid = await verifySession(userSession);
    if (!isValid) {
      await clearSession();
    }
  }
}, 5 * 60 * 1000);

// Initial load
loadUserSession();
