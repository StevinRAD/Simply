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
  max_uses: number;
  usage_count: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type VoucherRedemption = {
  id: string;
  voucher_id: string;
  user_id: string;
  redeemed_at: string;
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

export async function generateVoucher(
  plan: "starter" | "plus" | "max",
  durationDays: number,
  maxUses: number = 1,
  expiresAt?: string | null
) {
  try {
    const code = `SIMPLY-${plan.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { data: { user } } = await supabase.auth.getUser();

    console.log("Generating voucher:", { code, plan, durationDays, maxUses, userId: user?.id });

    const { data, error } = await supabase.from("vouchers").insert({
      code,
      plan,
      duration_days: durationDays,
      max_uses: maxUses,
      usage_count: 0,
      is_used: false,
      expires_at: expiresAt ?? null,
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

export type RedeemResult =
  | { success: true; voucher: Voucher; plan: string; expiresAt: string }
  | { success: false; error: string };

export async function redeemVoucher(code: string): Promise<RedeemResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  // Ambil voucher berdasarkan kode
  const { data: voucher, error: fetchError } = await supabase
    .from("vouchers")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (fetchError) return { success: false, error: "fetch_error" };
  if (!voucher) return { success: false, error: "not_found" };

  // Cek apakah voucher sudah habis (usage_count >= max_uses)
  if (voucher.usage_count >= voucher.max_uses) {
    return { success: false, error: "quota_exceeded" };
  }

  // Cek apakah voucher sudah expired (berdasarkan expires_at jika ada)
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
    return { success: false, error: "expired" };
  }

  // Cek apakah user ini sudah pernah redeem voucher yang sama
  const { data: existingRedemption } = await supabase
    .from("voucher_redemptions")
    .select("id")
    .eq("voucher_id", voucher.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRedemption) {
    return { success: false, error: "already_redeemed" };
  }

  // Hitung tanggal berakhir subscription
  const subExpiresAt = new Date();
  subExpiresAt.setDate(subExpiresAt.getDate() + voucher.duration_days);

  // Insert ke voucher_redemptions (trigger akan update usage_count & is_used otomatis)
  const { error: redemptionError } = await supabase
    .from("voucher_redemptions")
    .insert({
      voucher_id: voucher.id,
      user_id: user.id,
    });

  if (redemptionError) {
    console.error("Error inserting voucher_redemption:", redemptionError);
    return { success: false, error: "redemption_failed" };
  }

  // Update used_by & used_at pada voucher (untuk backward compat, simpan user terakhir)
  await supabase.from("vouchers").update({
    used_by: user.id,
    used_at: new Date().toISOString(),
  }).eq("id", voucher.id);

  // Buat subscription baru
  const { error: subError } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    plan: voucher.plan,
    voucher_id: voucher.id,
    starts_at: new Date().toISOString(),
    expires_at: subExpiresAt.toISOString(),
    is_active: true,
  });

  if (subError) {
    console.error("Error creating subscription:", subError);
    return { success: false, error: "subscription_failed" };
  }

  // Update plan di profiles
  await supabase.from("profiles").update({ plan: voucher.plan }).eq("id", user.id);

  return {
    success: true,
    voucher: voucher as Voucher,
    plan: voucher.plan,
    expiresAt: subExpiresAt.toISOString(),
  };
}

/** Ambil daftar redemptions untuk voucher tertentu (admin) */
export async function getVoucherRedemptions(voucherId: string): Promise<VoucherRedemption[]> {
  const { data, error } = await supabase
    .from("voucher_redemptions")
    .select("*")
    .eq("voucher_id", voucherId)
    .order("redeemed_at", { ascending: false });

  if (error) {
    console.error("getVoucherRedemptions error:", error.message);
    return [];
  }
  return (data as VoucherRedemption[]) || [];
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

export async function deleteVoucher(id: string) {
  try {
    // Lepaskan referensi foreign key di tabel subscriptions terlebih dahulu
    // agar constraint "subscriptions_voucher_id_fkey" tidak dilanggar
    const { error: unlinkError } = await supabase
      .from("subscriptions")
      .update({ voucher_id: null })
      .eq("voucher_id", id);

    if (unlinkError) {
      const normalizedError = serializeError(unlinkError);
      console.error("Supabase error unlinking voucher from subscriptions:", normalizedError);
      throw new Error(normalizedError.message);
    }

    // Sekarang aman untuk menghapus voucher
    const { error } = await supabase
      .from("vouchers")
      .delete()
      .eq("id", id);

    if (error) {
      const normalizedError = serializeError(error);
      console.error("Supabase error in deleteVoucher:", normalizedError);
      throw new Error(normalizedError.message);
    }

    console.log("Voucher deleted successfully:", id);
    return { success: true };
  } catch (err) {
    const normalizedError = serializeError(err);
    console.error("Error in deleteVoucher:", normalizedError);
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

// ── Activity Logs (enhanced) ────────────────────────────────

/** Kategori aktivitas yang tersedia */
export const ACTIVITY_CATEGORIES = {
  auth: "Autentikasi",
  subscription: "Langganan",
  service: "Layanan",
  profile: "Profil",
  admin: "Admin",
  other: "Lainnya",
} as const;

export type ActivityCategory = keyof typeof ACTIVITY_CATEGORIES;

/** Event types per kategori */
export const ACTIVITY_EVENTS: Record<ActivityCategory, Record<string, string>> = {
  auth: {
    login: "Login",
    logout: "Logout",
    register: "Registrasi",
    password_reset: "Reset Password",
    password_change: "Ganti Password",
  },
  subscription: {
    redeem_voucher: "Redeem Voucher",
    plan_upgrade: "Upgrade Plan",
    plan_downgrade: "Downgrade Plan",
    subscription_expired: "Langganan Expired",
  },
  service: {
    access_service: "Akses Layanan",
    copy_cookies: "Copy Cookies",
    view_service: "Lihat Layanan",
  },
  profile: {
    update_name: "Update Nama",
    update_settings: "Update Pengaturan",
  },
  admin: {
    create_service: "Buat Layanan",
    update_service: "Update Layanan",
    delete_service: "Hapus Layanan",
    generate_voucher: "Generate Voucher",
    delete_voucher: "Hapus Voucher",
    update_user_plan: "Update Plan User",
  },
  other: {
    other: "Lainnya",
  },
};

export type ActivityLog = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  event_type: string;
  category: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ActivityUser = {
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  total_activities: number;
  last_activity: string;
};

export type ActivityStat = {
  category: string;
  total_count: number;
  last_activity: string;
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

/** Ambil audit logs (admin only) — legacy */
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

/** Ambil activity logs dengan filter lengkap (admin only) */
export async function getActivityLogs(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  category?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActivityLog[]> {
  const { data, error } = await supabase.rpc("get_activity_logs", {
    p_limit: options?.limit ?? 50,
    p_offset: options?.offset ?? 0,
    p_user_id: options?.userId ?? null,
    p_category: options?.category ?? null,
    p_event_type: options?.eventType ?? null,
    p_date_from: options?.dateFrom ?? null,
    p_date_to: options?.dateTo ?? null,
  });
  if (error) {
    console.error("getActivityLogs error:", error.message);
    return [];
  }
  return (data as ActivityLog[]) || [];
}

/** Ambil statistik aktivitas per kategori (admin only) */
export async function getActivityStats(userId?: string): Promise<ActivityStat[]> {
  const { data, error } = await supabase.rpc("get_activity_stats", {
    p_user_id: userId ?? null,
  });
  if (error) {
    console.error("getActivityStats error:", error.message);
    return [];
  }
  return (data as ActivityStat[]) || [];
}

/** Ambil daftar user yang punya activity logs (admin only) */
export async function getActivityUsers(): Promise<ActivityUser[]> {
  const { data, error } = await supabase.rpc("get_activity_users");
  if (error) {
    console.error("getActivityUsers error:", error.message);
    return [];
  }
  return (data as ActivityUser[]) || [];
}

/** Catat event audit dari client — legacy (backward compatible) */
export async function logEvent(
  eventType: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
  await supabase.rpc("log_event", {
    p_event_type: eventType,
    p_description: description ?? null,
    p_ip_address: null,
    p_user_agent: userAgent,
    p_metadata: metadata ?? {},
  });
}

/** Catat aktivitas user dengan kategori (enhanced) */
export async function logActivity(
  eventType: string,
  category: ActivityCategory = "other",
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
  await supabase.rpc("log_activity", {
    p_event_type: eventType,
    p_category: category,
    p_description: description ?? null,
    p_ip_address: null,
    p_user_agent: userAgent,
    p_metadata: metadata ?? {},
  });
}

// ── Notifications ────────────────────────────────────────────

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  target: "all" | "subscribed" | "free";
  created_by: string | null;
  created_at: string;
  is_read?: boolean; // dari join tabel notification_reads
};

/** Ambil notifikasi untuk user yang sedang login */
export async function getNotifications(): Promise<AppNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("getNotifications error:", error.message);
    return [];
  }

  // Ambil daftar notif yang sudah dibaca user ini
  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", user.id);

  const readIds = new Set((reads || []).map((r: { notification_id: string }) => r.notification_id));

  return ((data as AppNotification[]) || []).map((n) => ({
    ...n,
    is_read: readIds.has(n.id),
  }));
}

/** Tandai notifikasi sebagai sudah dibaca */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notification_reads").upsert({
    user_id: user.id,
    notification_id: notificationId,
    read_at: new Date().toISOString(),
  }, { onConflict: "user_id,notification_id" });
}

/** Tandai semua notifikasi sebagai sudah dibaca */
export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const notifs = await getNotifications();
  const unread = notifs.filter((n) => !n.is_read);
  if (unread.length === 0) return;

  await supabase.from("notification_reads").upsert(
    unread.map((n) => ({
      user_id: user.id,
      notification_id: n.id,
      read_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,notification_id" }
  );
}

/** Buat notifikasi baru (admin only) */
export async function createNotification(payload: {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  target: "all" | "subscribed" | "free";
}): Promise<{ data: AppNotification | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Tidak terautentikasi" };

  const { data, error } = await supabase
    .from("notifications")
    .insert({ ...payload, created_by: user.id })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as AppNotification, error: null };
}

/** Hapus notifikasi (admin only) */
export async function deleteNotification(id: string): Promise<void> {
  await supabase.from("notifications").delete().eq("id", id);
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

// ── Single-Device Session Management ────────────────────────

export type UserSession = {
  id: string;
  user_id: string;
  session_token: string;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  last_seen_at: string;
  invalidated_at: string | null;
};

/** Key untuk menyimpan session token di localStorage */
export const SESSION_TOKEN_KEY = "simply_session_token";

/** Generate session token yang unik */
export function generateSessionToken(): string {
  const arr = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Daftarkan session baru setelah login — invalidate session lama otomatis */
export async function registerSession(deviceInfo?: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const token = generateSessionToken();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;

  // Insert session baru
  const { error } = await supabase.from("user_sessions").insert({
    user_id: user.id,
    session_token: token,
    device_info: deviceInfo ?? (ua ? parseUserAgent(ua) + " / " + parseBrowser(ua) : "Unknown"),
    user_agent: ua,
    is_active: true,
  });

  if (error) {
    console.error("registerSession error:", error.message);
    return null;
  }

  // Invalidate semua session lain milik user ini
  await supabase.rpc("invalidate_other_sessions", {
    p_user_id: user.id,
    p_current_session_token: token,
  });

  // Simpan token di localStorage
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }

  return token;
}

/** Ambil session token dari localStorage */
export function getStoredSessionToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/** Hapus session token dari localStorage */
export function clearStoredSessionToken(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

/** Cek apakah session token masih valid (belum di-kick) */
export async function checkSessionValid(token: string): Promise<{ valid: boolean; userId?: string }> {
  const { data, error } = await supabase.rpc("check_session_valid", {
    p_session_token: token,
  });

  if (error || !data || data.length === 0) {
    return { valid: false };
  }

  const row = data[0] as { is_valid: boolean; user_id: string };
  return { valid: row.is_valid === true, userId: row.user_id };
}

/** Kirim heartbeat untuk update last_seen_at */
export async function sendSessionHeartbeat(token: string): Promise<void> {
  await supabase.rpc("update_session_heartbeat", {
    p_session_token: token,
  });
}

/** Invalidate session saat logout */
export async function invalidateSession(token: string): Promise<void> {
  await supabase
    .from("user_sessions")
    .update({ is_active: false, invalidated_at: new Date().toISOString() })
    .eq("session_token", token);

  clearStoredSessionToken();
}

/** Ambil semua session aktif user (untuk admin atau info user) */
export async function getActiveSessions(): Promise<UserSession[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("getActiveSessions error:", error.message);
    return [];
  }
  return (data as UserSession[]) || [];
}

// ── Service Bundles (Penyatuan Layanan) ─────────────────────

export type ServiceBundle = {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  service_ids: string[];
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Ambil semua service bundles */
export async function getServiceBundles(): Promise<ServiceBundle[]> {
  const { data, error } = await supabase
    .from("service_bundles")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("getServiceBundles error:", error.message);
    return [];
  }
  return (data as ServiceBundle[]) || [];
}

/** Ambil service bundles yang aktif saja (untuk user) */
export async function getActiveServiceBundles(): Promise<ServiceBundle[]> {
  const { data, error } = await supabase
    .from("service_bundles")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("getActiveServiceBundles error:", error.message);
    return [];
  }
  return (data as ServiceBundle[]) || [];
}

/** Buat service bundle baru (admin only) */
export async function createServiceBundle(bundle: {
  name: string;
  description?: string | null;
  icon_emoji: string;
  service_ids: string[];
  is_active?: boolean;
  sort_order?: number;
}): Promise<ServiceBundle> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("service_bundles")
    .insert({
      name: bundle.name,
      description: bundle.description ?? null,
      icon_emoji: bundle.icon_emoji,
      service_ids: bundle.service_ids,
      is_active: bundle.is_active ?? true,
      sort_order: bundle.sort_order ?? 0,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ServiceBundle;
}

/** Update service bundle (admin only) */
export async function updateServiceBundle(
  id: string,
  updates: Partial<Omit<ServiceBundle, "id" | "created_at" | "created_by">>
): Promise<ServiceBundle> {
  const { data, error } = await supabase
    .from("service_bundles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ServiceBundle;
}

/** Hapus service bundle (admin only) */
export async function deleteServiceBundle(id: string): Promise<void> {
  const { error } = await supabase.from("service_bundles").delete().eq("id", id);
  if (error) throw error;
}
