import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SerializableError = {
  message: string;
  code?: string | number;
  details?: string | null;
  hint?: string | null;
  status?: number;
  name?: string;
};

export function serializeError(error: unknown): SerializableError {
  if (typeof error === "string") {
    return { message: error };
  }

  if (error instanceof Error) {
    const errObj = error as Error & Record<string, unknown>;
    return {
      message: error.message || "Unknown error",
      code: typeof errObj.code === "string" || typeof errObj.code === "number" ? errObj.code : undefined,
      details: typeof errObj.details === "string" ? errObj.details : null,
      hint: typeof errObj.hint === "string" ? errObj.hint : null,
      status: typeof errObj.status === "number" ? errObj.status : undefined,
      name: error.name,
    };
  }

  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;
    return {
      message: typeof errObj.message === "string" ? errObj.message : "Unknown error",
      code: typeof errObj.code === "string" || typeof errObj.code === "number" ? errObj.code : undefined,
      details: typeof errObj.details === "string" ? errObj.details : null,
      hint: typeof errObj.hint === "string" ? errObj.hint : null,
      status: typeof errObj.status === "number" ? errObj.status : undefined,
      name: typeof errObj.name === "string" ? errObj.name : undefined,
    };
  }

  return { message: "Unknown error" };
}

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  plan: "free" | "starter" | "plus" | "max";
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  group_name: "streaming" | "ai" | "design" | "productivity" | "education" | "social" | "other";
  domain: string;
  description: string | null;
  icon_url: string | null;
  cookies_json: Record<string, unknown> | null;
  cookies_netscape: string | null;
  cookie_format: "json" | "netscape";
  status: "active" | "maintenance" | "down";
  plan_required: "starter" | "plus" | "max";
  created_at: string;
  updated_at: string;
};

export type Voucher = {
  id: string;
  code: string;
  plan: "starter" | "plus" | "max";
  duration_days: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: "starter" | "plus" | "max";
  voucher_id: string | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
};

export async function signUp(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  });
}

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Query tabel profiles (RLS sudah diperbaiki — tidak ada infinite recursion)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!error && data) {
    return data as Profile;
  }

  // Fallback ke auth metadata jika row belum ada (misal: user baru)
  console.warn("getProfile fallback to auth metadata:", error?.message);
  return {
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name || null,
    role: "user",
    plan: "free",
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at,
  };
}

export async function getServices() {
  const { data } = await supabase.from("services").select("*").order("name");
  return data as Service[] | null;
}

export async function generateVoucher(plan: "starter" | "plus" | "max", durationDays: number) {
  try {
    const code = `SIMPLY-${plan.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log("Generating voucher:", { code, plan, durationDays, userId: user?.id });
    
    const { data, error } = await supabase.from("vouchers").insert({
      code,
      plan,
      duration_days: durationDays,
      created_by: user?.id,
    }).select().single();
    
    if (error) {
      console.error("Supabase error in generateVoucher:", error);
      throw error;
    }
    
    console.log("Voucher generated successfully:", data);
    return { data, error: null };
  } catch (err) {
    console.error("Error in generateVoucher:", err);
    throw err;
  }
}

export async function redeemVoucher(code: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: "Not authenticated" } };

  const { data: voucher } = await supabase
    .from("vouchers")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!voucher) return { error: { message: "Voucher not found" } };
  if (voucher.is_used) return { error: { message: "Voucher already used" } };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + voucher.duration_days);

  await supabase.from("vouchers").update({
    is_used: true,
    used_by: user.id,
    used_at: new Date().toISOString(),
  }).eq("id", voucher.id);

  await supabase.from("subscriptions").insert({
    user_id: user.id,
    plan: voucher.plan,
    voucher_id: voucher.id,
    expires_at: expiresAt.toISOString(),
  });

  await supabase.from("profiles").update({ plan: voucher.plan }).eq("id", user.id);

  return { data: voucher };
}

export async function updateService(id: string, updates: Partial<Service>) {
  const { data, error } = await supabase
    .from("services")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createService(service: Omit<Service, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

export async function deleteService(id: string) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Profile[] | null;
}

export async function updateUserPlan(userId: string, plan: "free" | "starter" | "plus" | "max") {
  const { data, error } = await supabase
    .from("profiles")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getAllVouchers() {
  try {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      const normalizedError = serializeError(error);
      console.error("Supabase error in getAllVouchers:", normalizedError);
      throw new Error(normalizedError.message);
    }
    
    console.log("Vouchers fetched successfully:", data?.length || 0, "items");
    return data as Voucher[] | null;
  } catch (err) {
    const normalizedError = serializeError(err);
    console.error("Error in getAllVouchers:", normalizedError);
    throw new Error(normalizedError.message);
  }
}

export async function getAdminStats() {
  const [profilesResult, vouchersResult, servicesResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("vouchers").select("*", { count: "exact", head: true }),
    supabase.from("services").select("status", { count: "exact" }).eq("status", "active")
  ]);

  return {
    users: profilesResult.count || 0,
    vouchers: vouchersResult.count || 0,
    services: servicesResult.count || 0
  };
}

// ── User-facing helpers ──────────────────────────────────────

/** Ambil subscription aktif milik user yang sedang login */
export async function getActiveSubscription(): Promise<Subscription | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("getActiveSubscription error:", error.message);
    return null;
  }
  return data as Subscription | null;
}

/** Ambil semua riwayat subscription milik user */
export async function getSubscriptionHistory(): Promise<Subscription[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("getSubscriptionHistory error:", error.message);
    return [];
  }
  return (data as Subscription[]) || [];
}

/** Update nama lengkap user di tabel profiles */
export async function updateProfileName(fullName: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  return { error: error?.message || null };
}

/** Ganti sandi user — verifikasi sandi lama dulu sebelum update */
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Tidak terautentikasi" };

  // Verifikasi sandi lama dengan re-authenticate
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) return { error: "Sandi lama tidak benar" };

  // Update ke sandi baru
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message || null };
}

/** Hitung sisa hari subscription aktif */
export function daysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Admin monitoring types & helpers ────────────────────────

export type UserActivity = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  plan: string;
  last_sign_in_at: string | null;
  registered_at: string;
  updated_at: string | null;
  auth_provider: string | null;
  meta_name: string | null;
  banned_until: string | null;
  email_confirmed_at: string | null;
};

export type AuditLog = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  event_type: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/** Ambil data aktivitas semua user (admin only — via SECURITY DEFINER function) */
export async function getUserActivity(): Promise<UserActivity[]> {
  const { data, error } = await supabase.rpc("get_user_activity");
  if (error) {
    console.error("getUserActivity error:", error.message);
    return [];
  }
  return (data as UserActivity[]) || [];
}

/** Ambil audit logs (admin only) */
export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  eventType?: string;
}): Promise<AuditLog[]> {
  const { data, error } = await supabase.rpc("get_audit_logs", {
    p_limit: options?.limit ?? 50,
    p_offset: options?.offset ?? 0,
    p_user_id: options?.userId ?? null,
    p_event_type: options?.eventType ?? null,
  });
  if (error) {
    console.error("getAuditLogs error:", error.message);
    return [];
  }
  return (data as AuditLog[]) || [];
}

/** Catat event audit dari client */
export async function logEvent(
  eventType: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
  await supabase.rpc("log_event", {
    p_event_type: eventType,
    p_description: description ?? null,
    p_ip_address: null, // IP tidak bisa diambil dari client-side
    p_user_agent: userAgent,
    p_metadata: metadata ?? {},
  });
}

/** Format user agent menjadi label singkat */
export function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

/** Format browser dari user agent */
export function parseBrowser(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  return "Other";
}
