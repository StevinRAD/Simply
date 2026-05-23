"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  FlaskConical,
  Gauge,
  Globe,
  Layers,
  Loader2,
  LogOut,
  Megaphone,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  SortAsc,
  SortDesc,
  Tag,
  Ticket,
  Trash2,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { LanguageSwitcher, useLanguage, type Language } from "../components/language";
import {
  supabase,
  getProfile,
  getServices,
  createService,
  updateService,
  deleteService,
  getAllProfiles,
  updateUserPlan,
  generateVoucher,
  getAllVouchers,
  deleteVoucher,
  getVoucherRedemptions,
  getAdminStats,
  getUserActivity,
  getAuditLogs,
  getActivityLogs,
  getActivityStats,
  getActivityUsers,
  logActivity,
  parseUserAgent,
  parseBrowser,
  serializeError,
  signOut,
  createNotification,
  deleteNotification,
  getNotifications,
  getServiceBundles,
  createServiceBundle,
  updateServiceBundle,
  deleteServiceBundle,
  ACTIVITY_CATEGORIES,
  type Profile,
  type Service,
  type ServiceBundle,
  type Voucher,
  type VoucherRedemption,
  type UserActivity,
  type AuditLog,
  type ActivityLog,
  type ActivityUser,
  type ActivityStat,
  type AppNotification,
} from "@/lib/supabase";
import styles from "./page.module.css";

const copy: Record<Language, Record<string, string>> = {
  id: {
    title: "Admin Dashboard",
    services: "Kelola Layanan",
    vouchers: "Generate Voucher",
    users: "Pengguna",
    logout: "Keluar",
    serviceName: "Nama",
    serviceStatus: "Status",
    serviceAction: "Aksi",
    active: "Aktif",
    maintenance: "Maintenance",
    down: "Down",
    save: "Simpan",
    plan: "Plan",
    duration: "Durasi (hari)",
    maxUses: "Maks. Pengguna",
    maxUsesHint: "Berapa orang yang bisa pakai voucher ini",
    generate: "Generate Voucher",
    generated: "Voucher Tergenerate",
    code: "Kode",
    copied: "Tersalin!",
    noVouchers: "Belum ada voucher.",
    deleteVoucher: "Hapus voucher",
    deleteConfirm: "Yakin ingin menghapus voucher ini?",
    deleteSuccess: "Voucher berhasil dihapus.",
    deleteFail: "Gagal menghapus voucher. Coba lagi.",
    cookiesJson: "Cookies JSON",
    updateCookies: "Update Cookies",
    totalUsers: "Total Users",
    totalVouchers: "Total Vouchers",
    activeServices: "Layanan Aktif",
    usageOf: "dari",
    usedBadge: "Habis",
    partialBadge: "Terpakai",
    viewRedemptions: "Lihat Pemakai",
    redemptionsTitle: "Daftar Pemakai Voucher",
    noRedemptions: "Belum ada yang memakai voucher ini.",
    voucherExpiry: "Kedaluwarsa Voucher",
    voucherExpiryHint: "Tanggal voucher tidak bisa dipakai lagi (opsional)",
  },
  en: {
    title: "Admin Dashboard",
    services: "Manage Services",
    vouchers: "Generate Voucher",
    users: "Users",
    logout: "Logout",
    serviceName: "Name",
    serviceStatus: "Status",
    serviceAction: "Action",
    active: "Active",
    maintenance: "Maintenance",
    down: "Down",
    save: "Save",
    plan: "Plan",
    duration: "Duration (days)",
    maxUses: "Max. Users",
    maxUsesHint: "How many people can use this voucher",
    generate: "Generate Voucher",
    generated: "Generated Vouchers",
    code: "Code",
    copied: "Copied!",
    noVouchers: "No vouchers yet.",
    deleteVoucher: "Delete voucher",
    deleteConfirm: "Are you sure you want to delete this voucher?",
    deleteSuccess: "Voucher deleted successfully.",
    deleteFail: "Failed to delete voucher. Please try again.",
    cookiesJson: "Cookies JSON",
    updateCookies: "Update Cookies",
    totalUsers: "Total Users",
    totalVouchers: "Total Vouchers",
    activeServices: "Active Services",
    usageOf: "of",
    usedBadge: "Exhausted",
    partialBadge: "Used",
    viewRedemptions: "View Users",
    redemptionsTitle: "Voucher Redemption List",
    noRedemptions: "No one has used this voucher yet.",
    voucherExpiry: "Voucher Expiry",
    voucherExpiryHint: "Date when voucher can no longer be used (optional)",
  },
};

/**
 * Get recommended check URL for common services based on domain.
 * Returns null if no specific recommendation.
 */
function getRecommendedCheckUrl(domain: string): string | null {
  // Strip protocol, www prefix, trailing slashes, and paths to extract bare domain
  const domainLower = domain.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim();
  
  const recommendations: Record<string, string> = {
    // Streaming Services
    'netflix.com': 'https://www.netflix.com/browse',
    'disneyplus.com': 'https://www.disneyplus.com/home',
    'disney.com': 'https://www.disneyplus.com/home',
    'hulu.com': 'https://www.hulu.com/hub/home',
    'primevideo.com': 'https://www.primevideo.com/',
    'amazon.com': 'https://www.primevideo.com/',
    'hbomax.com': 'https://www.max.com/',
    'max.com': 'https://www.max.com/',
    'spotify.com': 'https://open.spotify.com/',
    'youtube.com': 'https://www.youtube.com/feed/subscriptions',
    'crunchyroll.com': 'https://www.crunchyroll.com/home',
    'viu.com': 'https://www.viu.com/ott/id/home',
    'vidio.com': 'https://www.vidio.com/users/dashboard',
    
    // AI & Productivity
    'openai.com': 'https://chat.openai.com/',
    'chatgpt.com': 'https://chat.openai.com/',
    'claude.ai': 'https://claude.ai/chats',
    'anthropic.com': 'https://claude.ai/chats',
    'notion.so': 'https://www.notion.so/',
    'notion.com': 'https://www.notion.so/',
    'canva.com': 'https://www.canva.com/',
    'figma.com': 'https://www.figma.com/files/recent',
    'adobe.com': 'https://www.adobe.com/account.html',
    'grammarly.com': 'https://app.grammarly.com/',
    
    // Social & Communication
    'linkedin.com': 'https://www.linkedin.com/feed/',
    'twitter.com': 'https://twitter.com/home',
    'x.com': 'https://x.com/home',
    'instagram.com': 'https://www.instagram.com/',
    'facebook.com': 'https://www.facebook.com/',
    'discord.com': 'https://discord.com/channels/@me',
    'slack.com': 'https://app.slack.com/client/',
    
    // Education & Learning
    'udemy.com': 'https://www.udemy.com/home/my-courses/',
    'coursera.org': 'https://www.coursera.org/programs/',
    'skillshare.com': 'https://www.skillshare.com/home',
    'duolingo.com': 'https://www.duolingo.com/learn',
    
    // Cloud & Storage
    'dropbox.com': 'https://www.dropbox.com/home',
    'drive.google.com': 'https://drive.google.com/drive/my-drive',
    'google.com': 'https://drive.google.com/drive/my-drive',
    'onedrive.com': 'https://onedrive.live.com/',
    'microsoft.com': 'https://onedrive.live.com/',
  };
  
  return recommendations[domainLower] || null;
}

export default function AdminPage() {
  const { language, mounted } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "vouchers" | "users" | "activity" | "notifications" | "bundles">("overview");

  // ── Service Bundles state ──
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [bundleSuccess, setBundleSuccess] = useState<string | null>(null);
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null);
  const [deletingBundleId, setDeletingBundleId] = useState<string | null>(null);
  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    icon_emoji: "📦",
    service_ids: [] as string[],
    is_active: true,
    sort_order: 0,
  });
  const [savingBundle, setSavingBundle] = useState(false);

  // ── Notifications state ──
  const [adminNotifs, setAdminNotifs] = useState<AppNotification[]>([]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "success" | "warning" | "error">("info");
  const [notifTarget, setNotifTarget] = useState<"all" | "subscribed" | "free">("all");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  // ── Activity Logs state ──
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityUsers, setActivityUsers] = useState<ActivityUser[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityView, setActivityView] = useState<"logs" | "users" | "stats">("logs");
  // Filter state
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterEventType, setFilterEventType] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 50;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null);
  const [voucherDeleteMsg, setVoucherDeleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState("");
  const [voucherPlan, setVoucherPlan] = useState<"starter" | "plus" | "max">("starter");
  const [voucherDays, setVoucherDays] = useState(30);
  const [voucherMaxUses, setVoucherMaxUses] = useState(1);
  const [voucherMode, setVoucherMode] = useState<"duration" | "date">("duration");
  const [voucherExpiryDate, setVoucherExpiryDate] = useState("");
  const [voucherVoucherExpiry, setVoucherVoucherExpiry] = useState("");
  const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>(null);
  const [voucherRedemptions, setVoucherRedemptions] = useState<Record<string, VoucherRedemption[]>>({});
  const [loadingRedemptions, setLoadingRedemptions] = useState<string | null>(null);
  const [stats, setStats] = useState({ users: 0, vouchers: 0, services: 0 });
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDomain, setNewServiceDomain] = useState("");
  const [newServiceGroup, setNewServiceGroup] = useState<"streaming" | "ai" | "design" | "productivity" | "education" | "social" | "other">("streaming");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [changedServices, setChangedServices] = useState<Set<string>>(new Set());
  const [cookieFormats, setCookieFormats] = useState<Record<string, "json" | "netscape">>({}); // serviceId -> format
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [serviceSuccess, setServiceSuccess] = useState<string | null>(null);
  const [addingService, setAddingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [newServicePlan, setNewServicePlan] = useState<"starter" | "plus" | "max">("starter");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServiceCheckUrl, setNewServiceCheckUrl] = useState("");

  // ── Fitur baru: pencarian, sorting, expand, bulk, form toggle ──
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "group">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"active" | "maintenance" | "down">("active");
  const [savingCookieId, setSavingCookieId] = useState<string | null>(null);
  const cookieTextRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // ── Test cookies state ──
  type CookieTestResult = {
    ok: boolean;
    status: number | null;
    final_url?: string;
    redirected_to_login?: boolean;
    error?: string | null;
    detail?: string;
  };
  const [testingCookieId, setTestingCookieId] = useState<string | null>(null);
  const [cookieTestResults, setCookieTestResults] = useState<Record<string, CookieTestResult>>({});

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p || p.role !== "admin") { 
        console.log("Not admin, redirecting to dashboard. Profile:", p);
        router.push("/dashboard"); 
        return; 
      }
      console.log("Admin access granted. Profile:", p);
      setProfile(p);

      // Load services from Supabase
      try {
        const s = await getServices();
        setServices(s || []);
      } catch (error) {
        console.log("Failed to load services:", error);
        setServices([]);
      }

      // Load vouchers from Supabase
      try {
        const v = await getAllVouchers();
        setVouchers(v || []);
        console.log("Vouchers loaded:", v?.length || 0);
      } catch (error) {
        console.error("Failed to load vouchers:", serializeError(error));
        setVouchers([]);
        // Jangan tampilkan alert di sini karena bisa mengganggu UX
      }

      // Load users from Supabase
      try {
        const u = await getAllProfiles();
        setUsers(u || []);
      } catch (error) {
        console.log("Failed to load users:", error);
        setUsers([]);
      }

      // Load statistics from Supabase
      try {
        const stats = await getAdminStats();
        setStats(stats);
      } catch (error) {
        console.log("Failed to load stats:", error);
        setStats({ users: 0, vouchers: 0, services: 0 });
      }

      // Load service bundles
      try {
        const b = await getServiceBundles();
        setBundles(b || []);
      } catch (error) {
        console.log("Failed to load bundles:", error);
        setBundles([]);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  // ── Bundle handlers ──
  async function loadBundles() {
    setBundlesLoading(true);
    try {
      const b = await getServiceBundles();
      setBundles(b || []);
    } catch (error) {
      console.log("Failed to load bundles:", error);
    }
    setBundlesLoading(false);
  }

  function resetBundleForm() {
    setBundleForm({ name: "", description: "", icon_emoji: "📦", service_ids: [], is_active: true, sort_order: 0 });
    setEditingBundle(null);
    setShowBundleForm(false);
  }

  function startEditBundle(bundle: ServiceBundle) {
    setEditingBundle(bundle);
    setBundleForm({
      name: bundle.name,
      description: bundle.description || "",
      icon_emoji: bundle.icon_emoji,
      service_ids: bundle.service_ids,
      is_active: bundle.is_active,
      sort_order: bundle.sort_order,
    });
    setShowBundleForm(true);
  }

  async function handleSaveBundle() {
    if (!bundleForm.name.trim() || bundleForm.service_ids.length === 0) {
      setBundleError(language === "id" ? "Nama dan minimal 1 layanan harus diisi." : "Name and at least 1 service are required.");
      return;
    }
    setSavingBundle(true);
    setBundleError(null);
    try {
      if (editingBundle) {
        const updated = await updateServiceBundle(editingBundle.id, {
          name: bundleForm.name.trim(),
          description: bundleForm.description.trim() || null,
          icon_emoji: bundleForm.icon_emoji,
          service_ids: bundleForm.service_ids,
          is_active: bundleForm.is_active,
          sort_order: bundleForm.sort_order,
        });
        setBundles(prev => prev.map(b => b.id === updated.id ? updated : b));
        setBundleSuccess(language === "id" ? "Bundle berhasil diperbarui!" : "Bundle updated successfully!");
      } else {
        const created = await createServiceBundle({
          name: bundleForm.name.trim(),
          description: bundleForm.description.trim() || null,
          icon_emoji: bundleForm.icon_emoji,
          service_ids: bundleForm.service_ids,
          is_active: bundleForm.is_active,
          sort_order: bundleForm.sort_order,
        });
        setBundles(prev => [...prev, created]);
        setBundleSuccess(language === "id" ? "Bundle berhasil dibuat!" : "Bundle created successfully!");
      }
      resetBundleForm();
      setTimeout(() => setBundleSuccess(null), 3000);
    } catch (error) {
      const err = serializeError(error);
      setBundleError(err.message || (language === "id" ? "Gagal menyimpan bundle." : "Failed to save bundle."));
    }
    setSavingBundle(false);
  }

  async function handleDeleteBundle(id: string) {
    const confirmed = confirm(language === "id" ? "Hapus bundle ini?" : "Delete this bundle?");
    if (!confirmed) return;
    setDeletingBundleId(id);
    try {
      await deleteServiceBundle(id);
      setBundles(prev => prev.filter(b => b.id !== id));
      setBundleSuccess(language === "id" ? "Bundle berhasil dihapus!" : "Bundle deleted successfully!");
      setTimeout(() => setBundleSuccess(null), 3000);
    } catch (error) {
      const err = serializeError(error);
      setBundleError(err.message || (language === "id" ? "Gagal menghapus bundle." : "Failed to delete bundle."));
    }
    setDeletingBundleId(null);
  }

  function toggleBundleService(serviceId: string) {
    setBundleForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }));
  }

  async function loadActivity() {
    setActivityLoading(true);
    const [activity, logs] = await Promise.all([
      getUserActivity(),
      getAuditLogs({ limit: 100 }),
    ]);
    setUserActivity(activity);
    setAuditLogs(logs);
    setActivityLoading(false);
  }

  async function loadActivityLogs(resetPage = false) {
    setActivityLogsLoading(true);
    const page = resetPage ? 0 : activityPage;
    if (resetPage) setActivityPage(0);

    const [logs, users, stats] = await Promise.all([
      getActivityLogs({
        limit: ACTIVITY_PAGE_SIZE,
        offset: page * ACTIVITY_PAGE_SIZE,
        userId: filterUserId || undefined,
        category: filterCategory || undefined,
        eventType: filterEventType || undefined,
        dateFrom: filterDateFrom ? new Date(filterDateFrom).toISOString() : undefined,
        dateTo: filterDateTo ? new Date(filterDateTo + "T23:59:59").toISOString() : undefined,
      }),
      getActivityUsers(),
      getActivityStats(filterUserId || undefined),
    ]);

    setActivityLogs(logs);
    setActivityUsers(users);
    setActivityStats(stats);
    setActivityLogsLoading(false);
  }

  function resetActivityFilters() {
    setFilterUserId("");
    setFilterCategory("");
    setFilterEventType("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSearch("");
    setActivityPage(0);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      let durationDays = voucherDays;

      // Jika mode date, hitung duration dari tanggal yang dipilih
      if (voucherMode === "date" && voucherExpiryDate) {
        const expiryDate = new Date(voucherExpiryDate);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (durationDays <= 0) {
          alert(language === "id" ? "Tanggal kedaluwarsa harus di masa depan!" : "Expiry date must be in the future!");
          setGenerating(false);
          return;
        }
      }

      const maxUses = Math.max(1, voucherMaxUses);
      const expiresAt = voucherVoucherExpiry ? new Date(voucherVoucherExpiry).toISOString() : null;

      const result = await generateVoucher(voucherPlan, durationDays, maxUses, expiresAt);
      if (result.data) {
        setVouchers((prev) => [result.data as Voucher, ...prev]);
        setStats(prev => ({ ...prev, vouchers: prev.vouchers + 1 }));
        console.log("Voucher generated successfully:", result.data);
        await logActivity("generate_voucher", "admin",
          `Generate voucher ${(result.data as Voucher).code} — plan ${voucherPlan} (${durationDays} hari, maks ${maxUses} pengguna)`,
          { voucher_code: (result.data as Voucher).code, plan: voucherPlan, duration_days: durationDays, max_uses: maxUses }
        );
      }
    } catch (error) {
      console.error("Voucher generation failed:", error);
      alert("Gagal membuat voucher. Silakan coba lagi.");
    }
    setGenerating(false);
  }

  async function handleViewRedemptions(voucherId: string) {
    if (expandedVoucherId === voucherId) {
      setExpandedVoucherId(null);
      return;
    }
    setExpandedVoucherId(voucherId);
    if (voucherRedemptions[voucherId]) return; // sudah di-cache
    setLoadingRedemptions(voucherId);
    const redemptions = await getVoucherRedemptions(voucherId);
    setVoucherRedemptions(prev => ({ ...prev, [voucherId]: redemptions }));
    setLoadingRedemptions(null);
  }

  async function handleDeleteVoucher(id: string) {
    if (!confirm(text.deleteConfirm)) return;
    setDeletingVoucherId(id);
    setVoucherDeleteMsg(null);
    try {
      const voucherToDelete = vouchers.find(v => v.id === id);
      await deleteVoucher(id);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
      setStats((prev) => ({ ...prev, vouchers: Math.max(0, prev.vouchers - 1) }));
      setVoucherDeleteMsg({ type: "success", text: text.deleteSuccess });
      await logActivity("delete_voucher", "admin",
        `Hapus voucher ${voucherToDelete?.code || id}`,
        { voucher_id: id, voucher_code: voucherToDelete?.code }
      );
    } catch (error) {
      console.error("Delete voucher failed:", error);
      setVoucherDeleteMsg({ type: "error", text: text.deleteFail });
    }
    setDeletingVoucherId(null);
  }

  async function handleUserPlanChange(userId: string, newPlan: "free" | "starter" | "plus" | "max") {
    try {
      const targetUser = users.find(u => u.id === userId);
      const oldPlan = targetUser?.plan;
      await updateUserPlan(userId, newPlan);
      setUsers(prev => prev.map(u => u.id === userId ? {...u, plan: newPlan} : u));
      await logActivity("update_user_plan", "admin",
        `Update plan user ${targetUser?.email || userId}: ${oldPlan} → ${newPlan}`,
        { target_user_id: userId, target_email: targetUser?.email, old_plan: oldPlan, new_plan: newPlan }
      );
    } catch (error) {
      console.log("Failed to update user plan:", error);
    }
  }

  async function handleStatusChange(id: string, status: "active" | "maintenance" | "down") {
    setServiceError(null);
    // Optimistic update
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await updateService(id, { status });
      setChangedServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      const err = serializeError(error);
      setServiceError(err.message || (language === "id" ? "Gagal mengubah status layanan." : "Failed to update service status."));
      // Revert optimistic update
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s } : s)));
    }
  }

  async function handleCookiesUpdate(id: string, content: string, format: "json" | "netscape") {
    const updates: Partial<Service> = { cookie_format: format };
    setServiceError(null);

    if (format === "json") {
      if (!content.trim()) {
        updates.cookies_json = null;
        updates.cookies_netscape = null;
      } else {
        try {
          const parsed = JSON.parse(content);
          updates.cookies_json = parsed;
          updates.cookies_netscape = null;
        } catch {
          setServiceError(language === "id" ? "Format JSON tidak valid. Periksa kembali isi cookies." : "Invalid JSON format. Please check the cookies content.");
          return;
        }
      }
    } else {
      updates.cookies_netscape = content.trim() || null;
      updates.cookies_json = null;
    }

    try {
      await updateService(id, updates);
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      setChangedServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setServiceSuccess(language === "id" ? "Cookies berhasil diperbarui!" : "Cookies updated successfully!");
      setTimeout(() => setServiceSuccess(null), 3000);
    } catch (error) {
      const err = serializeError(error);
      setServiceError(err.message || (language === "id" ? "Gagal memperbarui cookies." : "Failed to update cookies."));
    }
  }

  function handleFormatChange(id: string, format: "json" | "netscape") {
    setCookieFormats(prev => ({ ...prev, [id]: format }));
    setServices((prev) => prev.map((s) => (s.id === id ? { 
      ...s, 
      cookie_format: format,
      cookies_json: format === "json" ? s.cookies_json : null,
      cookies_netscape: format === "netscape" ? s.cookies_netscape : null
    } : s)));
    setChangedServices(prev => new Set(prev).add(id));
  }

  async function addService() {
    if (!newServiceName.trim() || !newServiceDomain.trim()) return;
    setAddingService(true);
    setServiceError(null);

    const baseSlug = newServiceName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const buildService = (slug: string) => ({
      name: newServiceName.trim(),
      slug,
      group_name: newServiceGroup,
      domain: newServiceDomain.trim(),
      check_url: newServiceCheckUrl.trim() || null,
      description: newServiceDescription.trim() || null,
      icon_url: null,
      cookies_json: null,
      cookies_netscape: null,
      cookie_format: "json" as const,
      status: "active" as const,
      plan_required: newServicePlan,
    });

    try {
      // Coba dengan slug asli dulu
      const created = await createService(buildService(baseSlug));
      setServices(prev => [...prev, created]);
      setNewServiceName("");
      setNewServiceDomain("");
      setNewServiceDescription("");
      setNewServiceCheckUrl("");
      setShowAddForm(false);
      setStats(prev => ({ ...prev, services: prev.services + 1 }));
      setServiceSuccess(language === "id" ? "Layanan berhasil ditambahkan!" : "Service added successfully!");
      setTimeout(() => setServiceSuccess(null), 3000);
      await logActivity("create_service", "admin",
        `Tambah layanan: ${created.name} (${created.domain})`,
        { service_id: created.id, service_name: created.name, domain: created.domain }
      );
    } catch (error) {
      const err = serializeError(error);
      const isDuplicateSlug = err.message?.includes("duplicate key") && err.message?.includes("slug");

      if (isDuplicateSlug) {
        // Slug sudah ada — cari nomor urut berikutnya (-2, -3, dst)
        const existingSlugs = new Set(services.map(s => s.slug));
        let counter = 2;
        let uniqueSlug = `${baseSlug}-${counter}`;
        while (existingSlugs.has(uniqueSlug)) {
          counter++;
          uniqueSlug = `${baseSlug}-${counter}`;
        }
        try {
          const created = await createService(buildService(uniqueSlug));
          setServices(prev => [...prev, created]);
          setNewServiceName("");
          setNewServiceDomain("");
          setNewServiceDescription("");
          setNewServiceCheckUrl("");
          setShowAddForm(false);
          setStats(prev => ({ ...prev, services: prev.services + 1 }));
          setServiceSuccess(language === "id" ? "Layanan berhasil ditambahkan!" : "Service added successfully!");
          setTimeout(() => setServiceSuccess(null), 3000);
          await logActivity("create_service", "admin",
            `Tambah layanan: ${created.name} (${created.domain})`,
            { service_id: created.id, service_name: created.name, domain: created.domain }
          );
        } catch (retryError) {
          const retryErr = serializeError(retryError);
          setServiceError(retryErr.message || (language === "id" ? "Gagal menambahkan layanan." : "Failed to add service."));
        }
      } else {
        // Error lain (misal: RLS policy belum dijalankan)
        const isRlsError = err.message?.includes("row-level security") || err.message?.includes("permission") || err.message?.includes("policy");
        if (isRlsError) {
          setServiceError(language === "id"
            ? "Akses ditolak. Jalankan file fix-services-admin.sql di Supabase SQL Editor terlebih dahulu."
            : "Access denied. Please run fix-services-admin.sql in Supabase SQL Editor first.");
        } else {
          setServiceError(err.message || (language === "id" ? "Gagal menambahkan layanan." : "Failed to add service."));
        }
      }
    }
    setAddingService(false);
  }

  async function removeService(id: string) {
    const confirmed = confirm(language === "id" ? "Hapus layanan ini? Tindakan ini tidak bisa dibatalkan." : "Delete this service? This action cannot be undone.");
    if (!confirmed) return;
    const serviceToDelete = services.find(s => s.id === id);
    setDeletingServiceId(id);
    setServiceError(null);
    try {
      await deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      setChangedServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setStats(prev => ({ ...prev, services: Math.max(0, prev.services - 1) }));
      setServiceSuccess(language === "id" ? "Layanan berhasil dihapus!" : "Service deleted successfully!");
      setTimeout(() => setServiceSuccess(null), 3000);
      await logActivity("delete_service", "admin",
        `Hapus layanan: ${serviceToDelete?.name || id} (${serviceToDelete?.domain || ""})`,
        { service_id: id, service_name: serviceToDelete?.name, domain: serviceToDelete?.domain }
      );
    } catch (error) {
      const err = serializeError(error);
      setServiceError(err.message || (language === "id" ? "Gagal menghapus layanan." : "Failed to delete service."));
    }
    setDeletingServiceId(null);
  }

  async function saveChanges() {
    console.log("Saving changes for services:", Array.from(changedServices));
    
    for (const serviceId of changedServices) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        try {
          await updateService(serviceId, {
            status: service.status,
            cookies_json: service.cookies_json,
            cookies_netscape: service.cookies_netscape,
            cookie_format: service.cookie_format
          });
        } catch (error) {
          console.log("Save failed for service:", serviceId, error);
        }
      }
    }
    
    // Auto-collapse all saved services
    setExpandedServices(prev => {
      const next = new Set(prev);
      for (const serviceId of changedServices) {
        next.delete(serviceId);
      }
      return next;
    });
    setChangedServices(new Set());
  }

  // ── Helper: toggle expand service card ──
  function toggleExpand(id: string) {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Helper: toggle select service for bulk ──
  function toggleSelect(id: string) {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Helper: select all visible services ──
  function selectAllVisible() {
    const visible = getFilteredServices();
    if (selectedServices.size === visible.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(visible.map(s => s.id)));
    }
  }

  // ── Helper: bulk status change ──
  async function handleBulkStatusChange() {
    if (selectedServices.size === 0) return;
    setServiceError(null);
    for (const id of selectedServices) {
      try {
        await updateService(id, { status: bulkStatus });
        setServices(prev => prev.map(s => s.id === id ? { ...s, status: bulkStatus } : s));
      } catch (error) {
        console.log("Bulk update failed for:", id, error);
      }
    }
    setSelectedServices(new Set());
    setServiceSuccess(language === "id" ? `${selectedServices.size} layanan berhasil diperbarui!` : `${selectedServices.size} services updated!`);
    setTimeout(() => setServiceSuccess(null), 3000);
  }

  // ── Helper: save cookies explicitly ──
  async function handleSaveCookies(id: string) {
    const textarea = cookieTextRefs.current[id];
    if (!textarea) return;
    const content = textarea.value;
    const format = cookieFormats[id] || services.find(s => s.id === id)?.cookie_format || "json";
    setSavingCookieId(id);
    await handleCookiesUpdate(id, content, format);
    setSavingCookieId(null);
    // Auto-collapse service card after saving
    setExpandedServices(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // ── Helper: test cookies validity via API route ──
  async function handleTestCookies(id: string) {
    const service = services.find(s => s.id === id);
    if (!service) return;

    // Ambil nilai terbaru dari textarea jika ada (belum disimpan)
    const textarea = cookieTextRefs.current[id];
    const currentFormat = cookieFormats[id] || service.cookie_format || "json";

    let cookies_json = service.cookies_json;
    let cookies_netscape = service.cookies_netscape;

    // Jika textarea ada dan berisi konten, gunakan nilai textarea
    if (textarea && textarea.value.trim()) {
      if (currentFormat === "json") {
        try { cookies_json = JSON.parse(textarea.value); } catch { /* pakai yang tersimpan */ }
      } else {
        cookies_netscape = textarea.value;
      }
    }

    setTestingCookieId(id);
    // Hapus hasil lama
    setCookieTestResults(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const res = await fetch("/api/check-cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: service.domain,
          cookies_json,
          cookies_netscape,
          cookie_format: currentFormat,
        }),
      });
      const data = await res.json();
      setCookieTestResults(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      setCookieTestResults(prev => ({
        ...prev,
        [id]: { ok: false, status: null, error: "Gagal menghubungi server pengecekan." },
      }));
    }
    setTestingCookieId(null);
  }

  // ── Helper: get filtered & sorted services ──
  function getFilteredServices(): Service[] {
    let filtered = services;

    // Filter by group
    if (selectedGroup !== "all") {
      filtered = filtered.filter(s => s.group_name === selectedGroup);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.domain?.toLowerCase().includes(q) ||
        s.slug?.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "status") cmp = a.status.localeCompare(b.status);
      else if (sortBy === "group") cmp = (a.group_name || "").localeCompare(b.group_name || "");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }

  // ── Helper: group names ──
  const groupNames: Record<string, string> = {
    streaming: "🎬 Streaming",
    ai: "🤖 AI & Assistant",
    design: "🎨 Design & Creative",
    productivity: "⚡ Productivity",
    education: "📚 Education",
    social: "📱 Social Media",
    other: "📦 Lainnya"
  };

  // ── Helper: status badge color class ──
  function getStatusInfo(status: string) {
    switch (status) {
      case "active": return { label: text.active, color: styles.statusActive };
      case "maintenance": return { label: text.maintenance, color: styles.statusMaintenance };
      case "down": return { label: text.down, color: styles.statusDown };
      default: return { label: status, color: "" };
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}><Loader2 size={32} className="spin" /></div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <aside className={`${styles.sidebar} slide-in-left`}>
        <div className={styles.sidebarLogo}>
          <Image src="/logo/logo_simply.png" alt="Simply" width={28} height={28} style={{ borderRadius: 8 }} />
          <strong>Simply</strong>
        </div>
        <span className={styles.adminBadge}><ShieldCheck size={14} />Admin</span>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeTab === "overview" ? styles.active : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Gauge size={18} />Overview
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "services" ? styles.active : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <Settings size={18} />{text.services}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "vouchers" ? styles.active : ""}`}
            onClick={() => setActiveTab("vouchers")}
          >
            <Ticket size={18} />{text.vouchers}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "users" ? styles.active : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={18} />{text.users}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "activity" ? styles.active : ""}`}
            onClick={() => {
              setActiveTab("activity");
              if (activityLogs.length === 0) loadActivityLogs(true);
            }}
          >
            <Activity size={18} />Monitoring
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "notifications" ? styles.active : ""}`}
            onClick={async () => {
              setActiveTab("notifications");
              if (adminNotifs.length === 0) {
                const notifs = await getNotifications();
                setAdminNotifs(notifs);
              }
            }}
          >
            <Bell size={18} />{language === "id" ? "Notifikasi" : "Notifications"}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "bundles" ? styles.active : ""}`}
            onClick={() => {
              setActiveTab("bundles");
              if (bundles.length === 0) loadBundles();
            }}
          >
            <Layers size={18} />{language === "id" ? "Penyatuan" : "Bundles"}
          </button>
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />{text.logout}
        </button>
      </aside>

      <div className={`${styles.content} fade-in`}>
        <header className={styles.header}>
          <h1>{text.title}</h1>
          <LanguageSwitcher />
        </header>

        {/* Stats - Always visible */}
        {activeTab === "overview" && (
          <>
            <div className={`${styles.statsGrid} stagger-1`}>
              <div className={styles.statCard}>
                <Users size={20} />
                <div><span className={styles.statNum}>{stats.users}</span><span className={styles.statLabel}>{text.totalUsers}</span></div>
              </div>
              <div className={styles.statCard}>
                <Ticket size={20} />
                <div><span className={styles.statNum}>{stats.vouchers}</span><span className={styles.statLabel}>{text.totalVouchers}</span></div>
              </div>
              <div className={styles.statCard}>
                <Settings size={20} />
                <div><span className={styles.statNum}>{stats.services}</span><span className={styles.statLabel}>{text.activeServices}</span></div>
              </div>
            </div>

            {/* Info box penjelasan plan */}
            <div className={`${styles.card} stagger-2`}>
              <h2><ShieldCheck size={20} />{language === "id" ? "Keterangan Plan & Langganan" : "Plan & Subscription Info"}</h2>
              <div className={styles.planExplanation}>
                <div className={styles.planExplanationTitle}>
                  {language === "id" ? "Bagaimana sistem plan bekerja:" : "How the plan system works:"}
                </div>
                <div className={styles.planExplanationGrid}>
                  <div className={styles.planExplanationItem}>
                    <span className={`${styles.planBadge} ${styles.free}`}>free</span>
                    <span>{language === "id"
                      ? "Belum berlangganan — user hanya bisa akses dashboard dan redeem voucher. Tidak bisa mengakses layanan apapun."
                      : "Not subscribed — user can only access dashboard and redeem voucher. Cannot access any services."}</span>
                  </div>
                  <div className={styles.planExplanationItem}>
                    <span className={`${styles.planBadge} ${styles.starter}`}>starter</span>
                    <span>{language === "id"
                      ? "Berlangganan — user bisa mengakses layanan yang membutuhkan plan Starter."
                      : "Subscribed — user can access services requiring Starter plan."}</span>
                  </div>
                  <div className={styles.planExplanationItem}>
                    <span className={`${styles.planBadge} ${styles.plus}`}>plus</span>
                    <span>{language === "id"
                      ? "Berlangganan — user bisa mengakses layanan Starter + Plus."
                      : "Subscribed — user can access Starter + Plus services."}</span>
                  </div>
                  <div className={styles.planExplanationItem}>
                    <span className={`${styles.planBadge} ${styles.max}`}>max</span>
                    <span>{language === "id"
                      ? "Berlangganan — user bisa mengakses semua layanan tanpa batasan."
                      : "Subscribed — user can access all services without restrictions."}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Services Management ── */}
        {activeTab === "services" && (
          <div className={styles.servicesWrap}>

            {/* ── Top Bar: title + add button ── */}
            <div className={styles.servicesTopBar}>
              <div className={styles.servicesTitleRow}>
                <h2 className={styles.servicesTitle}>
                  <Settings size={20} />
                  {text.services}
                  <span className={styles.servicesBadge}>{services.length}</span>
                </h2>
                <button
                  className={`${styles.addToggleBtn} ${showAddForm ? styles.addToggleActive : ""}`}
                  onClick={() => setShowAddForm(v => !v)}
                >
                  {showAddForm ? <X size={16} /> : <Plus size={16} />}
                  {showAddForm
                    ? (language === "id" ? "Batal" : "Cancel")
                    : (language === "id" ? "Tambah Layanan" : "Add Service")}
                </button>
              </div>

              {/* ── Feedback alerts ── */}
              {serviceError && (
                <div className={styles.alertError} role="alert">
                  <AlertTriangle size={14} />
                  <span>{serviceError}</span>
                  <button onClick={() => setServiceError(null)} className={styles.alertClose}><X size={14} /></button>
                </div>
              )}
              {serviceSuccess && (
                <div className={styles.alertSuccess} role="status">
                  <CheckCircle2 size={14} /> {serviceSuccess}
                </div>
              )}
            </div>

            {/* ── Add Service Form (collapsible) ── */}
            {showAddForm && (
              <div className={styles.addServiceCard}>
                <h3 className={styles.addServiceTitle}>
                  <Plus size={16} />
                  {language === "id" ? "Tambah Layanan Baru" : "Add New Service"}
                </h3>
                <div className={styles.addServiceGrid}>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>
                      {language === "id" ? "Nama Layanan" : "Service Name"} <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder={language === "id" ? "contoh: Netflix Premium" : "e.g. Netflix Premium"}
                      className={styles.fieldInput}
                    />
                  </div>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>
                      Domain <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.fieldInputIcon}>
                      <Globe size={14} className={styles.fieldIcon} />
                      <input
                        type="text"
                        value={newServiceDomain}
                        onChange={(e) => setNewServiceDomain(e.target.value)}
                        placeholder="netflix.com"
                        className={styles.fieldInputWithIcon}
                      />
                    </div>
                  </div>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>Group</label>
                    <select
                      value={newServiceGroup}
                      onChange={(e) => setNewServiceGroup(e.target.value as any)}
                      className={styles.fieldSelect}
                    >
                      <option value="streaming">🎬 Streaming</option>
                      <option value="ai">🤖 AI & Assistant</option>
                      <option value="design">🎨 Design & Creative</option>
                      <option value="productivity">⚡ Productivity</option>
                      <option value="education">📚 Education</option>
                      <option value="social">📱 Social Media</option>
                      <option value="other">📦 Lainnya</option>
                    </select>
                  </div>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>Plan</label>
                    <select
                      value={newServicePlan}
                      onChange={(e) => setNewServicePlan(e.target.value as "starter" | "plus" | "max")}
                      className={styles.fieldSelect}
                    >
                      <option value="starter">⭐ Starter</option>
                      <option value="plus">💎 Plus</option>
                      <option value="max">🚀 Max</option>
                    </select>
                  </div>
                  <div className={`${styles.addServiceField} ${styles.addServiceFieldFull}`}>
                    <label className={styles.fieldLabel}>
                      {language === "id" ? "Deskripsi" : "Description"}
                      <span className={styles.optional}> ({language === "id" ? "opsional" : "optional"})</span>
                    </label>
                    <input
                      type="text"
                      value={newServiceDescription}
                      onChange={(e) => setNewServiceDescription(e.target.value)}
                      placeholder={language === "id" ? "Deskripsi singkat layanan..." : "Short service description..."}
                      className={styles.fieldInput}
                    />
                  </div>
                  <div className={`${styles.addServiceField} ${styles.addServiceFieldFull}`}>
                    <label className={styles.fieldLabel}>
                      Check URL
                      <span className={styles.optional}> ({language === "id" ? "opsional - untuk validasi cookies" : "optional - for cookie validation"})</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newServiceCheckUrl}
                        onChange={(e) => setNewServiceCheckUrl(e.target.value)}
                        placeholder="https://www.netflix.com/browse"
                        className={styles.fieldInput}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const recommended = getRecommendedCheckUrl(newServiceDomain);
                          if (recommended) {
                            setNewServiceCheckUrl(recommended);
                          }
                        }}
                        className={styles.cancelBtn}
                        style={{ whiteSpace: 'nowrap', padding: '8px 12px' }}
                        disabled={!newServiceDomain.trim()}
                        title={language === "id" ? "Auto-isi URL yang direkomendasikan" : "Auto-fill recommended URL"}
                      >
                        <Zap size={14} />
                        {language === "id" ? "Auto" : "Auto"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.addServiceActions}>
                  <button
                    onClick={() => { setShowAddForm(false); setNewServiceName(""); setNewServiceDomain(""); setNewServiceDescription(""); setNewServiceCheckUrl(""); }}
                    className={styles.cancelBtn}
                  >
                    <X size={14} />
                    {language === "id" ? "Batal" : "Cancel"}
                  </button>
                  <button
                    onClick={addService}
                    className={styles.submitBtn}
                    disabled={addingService || !newServiceName.trim() || !newServiceDomain.trim()}
                  >
                    {addingService ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                    {language === "id" ? "Tambah Layanan" : "Add Service"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Toolbar: search + filter chips + sort ── */}
            <div className={styles.servicesToolbar}>
              {/* Search */}
              <div className={styles.searchBox}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === "id" ? "Cari layanan..." : "Search services..."}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button className={styles.searchClear} onClick={() => setSearchQuery("")}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className={styles.sortBox}>
                <button
                  className={styles.sortBtn}
                  onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                  title={sortDir === "asc" ? "A→Z" : "Z→A"}
                >
                  {sortDir === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />}
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "status" | "group")}
                  className={styles.sortSelect}
                >
                  <option value="name">{language === "id" ? "Nama" : "Name"}</option>
                  <option value="status">Status</option>
                  <option value="group">Group</option>
                </select>
              </div>
            </div>

            {/* ── Group Filter Chips ── */}
            <div className={styles.groupChips}>
              {[
                { key: "all", label: language === "id" ? "Semua" : "All", count: services.length },
                { key: "streaming", label: "🎬 Streaming", count: services.filter(s => s.group_name === "streaming").length },
                { key: "ai", label: "🤖 AI", count: services.filter(s => s.group_name === "ai").length },
                { key: "design", label: "🎨 Design", count: services.filter(s => s.group_name === "design").length },
                { key: "productivity", label: "⚡ Productivity", count: services.filter(s => s.group_name === "productivity").length },
                { key: "education", label: "📚 Education", count: services.filter(s => s.group_name === "education").length },
                { key: "social", label: "📱 Social", count: services.filter(s => s.group_name === "social").length },
                { key: "other", label: "📦 Lainnya", count: services.filter(s => s.group_name === "other").length },
              ].filter(g => g.count > 0 || g.key === "all").map(g => (
                <button
                  key={g.key}
                  className={`${styles.groupChip} ${selectedGroup === g.key ? styles.groupChipActive : ""}`}
                  onClick={() => setSelectedGroup(g.key)}
                >
                  {g.label}
                  <span className={styles.chipCount}>{g.count}</span>
                </button>
              ))}
            </div>

            {/* ── Bulk Actions Bar ── */}
            {selectedServices.size > 0 && (
              <div className={styles.bulkBar}>
                <span className={styles.bulkCount}>
                  <CheckCircle2 size={14} />
                  {selectedServices.size} {language === "id" ? "dipilih" : "selected"}
                </span>
                <div className={styles.bulkActions}>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as "active" | "maintenance" | "down")}
                    className={styles.bulkSelect}
                  >
                    <option value="active">{text.active}</option>
                    <option value="maintenance">{text.maintenance}</option>
                    <option value="down">{text.down}</option>
                  </select>
                  <button onClick={handleBulkStatusChange} className={styles.bulkApplyBtn}>
                    <Zap size={13} />
                    {language === "id" ? "Terapkan" : "Apply"}
                  </button>
                  <button onClick={() => setSelectedServices(new Set())} className={styles.bulkClearBtn}>
                    <X size={13} />
                    {language === "id" ? "Batal Pilih" : "Deselect"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Service List ── */}
            {(() => {
              const filtered = getFilteredServices();
              if (filtered.length === 0) {
                return (
                  <div className={styles.emptyState}>
                    <Search size={32} />
                    <p>{language === "id" ? "Tidak ada layanan ditemukan." : "No services found."}</p>
                    {searchQuery && (
                      <button className={styles.emptyResetBtn} onClick={() => setSearchQuery("")}>
                        {language === "id" ? "Reset pencarian" : "Reset search"}
                      </button>
                    )}
                  </div>
                );
              }

              // Group the filtered results
              const groups = ["streaming", "ai", "design", "productivity", "education", "social", "other"];
              return groups.map(group => {
                const groupItems = filtered.filter(s => s.group_name === group);
                if (groupItems.length === 0) return null;
                return (
                  <div key={group} className={styles.serviceGroup}>
                    <div className={styles.groupHeader}>
                      <h3 className={styles.groupTitle}>{groupNames[group]}</h3>
                      <span className={styles.groupCount}>{groupItems.length}</span>
                      <button
                        className={styles.groupSelectAll}
                        onClick={() => {
                          const allSelected = groupItems.every(s => selectedServices.has(s.id));
                          setSelectedServices(prev => {
                            const next = new Set(prev);
                            groupItems.forEach(s => allSelected ? next.delete(s.id) : next.add(s.id));
                            return next;
                          });
                        }}
                      >
                        {groupItems.every(s => selectedServices.has(s.id))
                          ? (language === "id" ? "Batal Pilih Semua" : "Deselect All")
                          : (language === "id" ? "Pilih Semua" : "Select All")}
                      </button>
                    </div>

                    <div className={styles.serviceCards}>
                      {groupItems.map((s) => {
                        const isExpanded = expandedServices.has(s.id);
                        const isSelected = selectedServices.has(s.id);
                        const currentFormat = cookieFormats[s.id] || s.cookie_format || "json";
                        const hasCookies = currentFormat === "json"
                          ? !!s.cookies_json
                          : !!s.cookies_netscape;
                        const statusInfo = getStatusInfo(s.status);

                        return (
                          <div
                            key={s.id}
                            className={`${styles.serviceCard} ${isSelected ? styles.serviceCardSelected : ""} ${changedServices.has(s.id) ? styles.serviceCardChanged : ""}`}
                          >
                            {/* Card Header */}
                            <div className={styles.cardHeader}>
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(s.id)}
                                className={styles.cardCheckbox}
                                aria-label={`Select ${s.name}`}
                              />

                              {/* Service Info */}
                              <div className={styles.cardInfo}>
                                <div className={styles.cardName}>
                                  <strong>{s.name}</strong>
                                  {hasCookies && (
                                    <span className={styles.cookieBadge} title={language === "id" ? "Cookies tersedia" : "Cookies available"}>
                                      🍪
                                    </span>
                                  )}
                                </div>
                                <div className={styles.cardMeta}>
                                  <Globe size={11} />
                                  <span className={styles.cardDomain}>{s.domain}</span>
                                  <span className={styles.cardPlan}>{s.plan_required}</span>
                                </div>
                              </div>

                              {/* Status Badge + Select */}
                              <div className={styles.cardStatusWrap}>
                                <span className={`${styles.statusBadge} ${statusInfo.color}`}>
                                  <span className={styles.statusDotSmall} />
                                  {statusInfo.label}
                                </span>
                                <select
                                  value={s.status}
                                  onChange={(e) => handleStatusChange(s.id, e.target.value as "active" | "maintenance" | "down")}
                                  className={styles.statusSelectInline}
                                  aria-label="Change status"
                                >
                                  <option value="active">{text.active}</option>
                                  <option value="maintenance">{text.maintenance}</option>
                                  <option value="down">{text.down}</option>
                                </select>
                              </div>

                              {/* Actions */}
                              <div className={styles.cardActions}>
                                {/* Tombol Buka Layanan — selalu terlihat */}
                                <a
                                  href={`https://${s.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.cardOpenBtn}
                                  title={language === "id" ? "Buka layanan di tab baru" : "Open service in new tab"}
                                >
                                  <ExternalLink size={13} />
                                </a>

                                {/* Tombol Test Cookies — selalu terlihat, aktif jika ada cookies */}
                                <button
                                  className={`${styles.cardTestBtn} ${cookieTestResults[s.id] ? (cookieTestResults[s.id].ok ? styles.cardTestOk : styles.cardTestFail) : ""}`}
                                  onClick={() => handleTestCookies(s.id)}
                                  disabled={testingCookieId === s.id}
                                  title={language === "id" ? "Test cookies — cek apakah masih valid" : "Test cookies — check if still valid"}
                                >
                                  {testingCookieId === s.id
                                    ? <Loader2 size={13} className="spin" />
                                    : <FlaskConical size={13} />}
                                </button>

                                {/* Tombol expand cookies panel */}
                                <button
                                  className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnActive : ""}`}
                                  onClick={() => toggleExpand(s.id)}
                                  title={isExpanded ? (language === "id" ? "Tutup cookies" : "Close cookies") : (language === "id" ? "Edit cookies" : "Edit cookies")}
                                >
                                  🍪
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>

                                <button
                                  onClick={() => removeService(s.id)}
                                  className={styles.deleteBtn}
                                  disabled={deletingServiceId === s.id}
                                  title={language === "id" ? "Hapus layanan" : "Delete service"}
                                >
                                  {deletingServiceId === s.id
                                    ? <Loader2 size={13} className="spin" />
                                    : <Trash2 size={13} />}
                                </button>
                              </div>
                            </div>

                            {/* Cookies Panel (expandable) */}
                            {isExpanded && (
                              <div className={styles.cookiesPanel}>
                                <div className={styles.cookiesPanelHeader}>
                                  <span className={styles.cookiesPanelTitle}>
                                    🍪 {language === "id" ? "Kelola Cookies" : "Manage Cookies"}
                                  </span>
                                  <div className={styles.formatToggle}>
                                    <button
                                      className={`${styles.formatBtn} ${currentFormat === "json" ? styles.formatBtnActive : ""}`}
                                      onClick={() => handleFormatChange(s.id, "json")}
                                    >
                                      JSON
                                    </button>
                                    <button
                                      className={`${styles.formatBtn} ${currentFormat === "netscape" ? styles.formatBtnActive : ""}`}
                                      onClick={() => handleFormatChange(s.id, "netscape")}
                                    >
                                      Netscape
                                    </button>
                                  </div>
                                </div>

                                <div className={styles.cookiesHint}>
                                  {currentFormat === "json" ? (
                                    <span>Format: <code>{"[{\"name\":\"session\",\"value\":\"abc\",\"domain\":\"."+s.domain+"\"}]"}</code></span>
                                  ) : (
                                    <span>Format: <code>{"# Netscape HTTP Cookie File"}</code></span>
                                  )}
                                </div>

                                <textarea
                                  ref={(el) => { cookieTextRefs.current[s.id] = el; }}
                                  className={styles.cookiesTextarea}
                                  placeholder={
                                    currentFormat === "json"
                                      ? `[{"name":"session_id","value":"abc123","domain":".${s.domain}","path":"/","httpOnly":true}]`
                                      : `# Netscape HTTP Cookie File\n.${s.domain}\tTRUE\t/\tFALSE\t1735689600\tsession_id\tabc123`
                                  }
                                  defaultValue={
                                    currentFormat === "json"
                                      ? (s.cookies_json ? JSON.stringify(s.cookies_json, null, 2) : "")
                                      : (s.cookies_netscape || "")
                                  }
                                  rows={6}
                                  spellCheck={false}
                                />

                                <div className={styles.cookiesPanelFooter}>
                                  <span className={styles.cookiesStatus}>
                                    {hasCookies
                                      ? <><CheckCircle2 size={12} className={styles.cookiesOk} />{language === "id" ? "Cookies tersimpan" : "Cookies saved"}</>
                                      : <><AlertTriangle size={12} className={styles.cookiesWarn} />{language === "id" ? "Belum ada cookies" : "No cookies yet"}</>
                                    }
                                  </span>
                                  <div className={styles.cookiesBtnGroup}>
                                    {/* Test Cookies Button */}
                                    <button
                                      className={styles.testCookiesBtn}
                                      onClick={() => handleTestCookies(s.id)}
                                      disabled={testingCookieId === s.id || (!hasCookies && !cookieTextRefs.current[s.id]?.value.trim())}
                                      title={language === "id" ? "Cek apakah cookies masih valid" : "Check if cookies are still valid"}
                                    >
                                      {testingCookieId === s.id
                                        ? <><Loader2 size={13} className="spin" />{language === "id" ? "Mengecek..." : "Checking..."}</>
                                        : <><FlaskConical size={13} />{language === "id" ? "Test Cookies" : "Test Cookies"}</>
                                      }
                                    </button>
                                    {/* Save Cookies Button */}
                                    <button
                                      className={styles.saveCookiesBtn}
                                      onClick={() => handleSaveCookies(s.id)}
                                      disabled={savingCookieId === s.id}
                                    >
                                      {savingCookieId === s.id
                                        ? <><Loader2 size={13} className="spin" />{language === "id" ? "Menyimpan..." : "Saving..."}</>
                                        : <><CheckCircle2 size={13} />{language === "id" ? "Simpan" : "Save"}</>
                                      }
                                    </button>
                                  </div>
                                </div>

                                {/* ── Test Result Panel ── */}
                                {cookieTestResults[s.id] && (() => {
                                  const result = cookieTestResults[s.id];
                                  return (
                                    <div className={`${styles.testResultPanel} ${result.ok ? styles.testResultOk : styles.testResultFail}`}>
                                      <div className={styles.testResultHeader}>
                                        <span className={styles.testResultIcon}>
                                          {result.ok ? "✅" : "❌"}
                                        </span>
                                        <span className={styles.testResultTitle}>
                                          {result.ok
                                            ? (language === "id" ? "Cookies Valid!" : "Cookies Valid!")
                                            : (language === "id" ? "Cookies Tidak Valid" : "Cookies Invalid")
                                          }
                                        </span>
                                        {result.status && (
                                          <span className={styles.testResultStatus}>
                                            HTTP {result.status}
                                          </span>
                                        )}
                                        <button
                                          className={styles.testResultClose}
                                          onClick={() => setCookieTestResults(prev => {
                                            const next = { ...prev };
                                            delete next[s.id];
                                            return next;
                                          })}
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                      {result.detail && (
                                        <p className={styles.testResultDetail}>{result.detail}</p>
                                      )}
                                      {result.error && (
                                        <p className={styles.testResultError}>{result.error}</p>
                                      )}
                                      {result.final_url && result.final_url !== `https://${s.domain}` && (
                                        <div className={styles.testResultUrl}>
                                          <Globe size={11} />
                                          <span>{language === "id" ? "Diarahkan ke:" : "Redirected to:"}</span>
                                          <a
                                            href={result.final_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.testResultLink}
                                          >
                                            {result.final_url.length > 60
                                              ? result.final_url.slice(0, 60) + "..."
                                              : result.final_url}
                                            <ExternalLink size={10} />
                                          </a>
                                        </div>
                                      )}
                                      <div className={styles.testResultActions}>
                                        <a
                                          href={`https://${s.domain}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={styles.visitServiceBtn}
                                        >
                                          <ExternalLink size={12} />
                                          {language === "id" ? "Buka Layanan" : "Open Service"}
                                        </a>
                                        <button
                                          className={styles.retestBtn}
                                          onClick={() => handleTestCookies(s.id)}
                                          disabled={testingCookieId === s.id}
                                        >
                                          <RefreshCw size={12} />
                                          {language === "id" ? "Cek Ulang" : "Recheck"}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* User Management */}
        {activeTab === "users" && (
          <section className={`${styles.card} stagger-2`}>
            <h2><Users size={20} />{text.users}</h2>

            {/* Penjelasan status plan untuk admin */}
            <div className={styles.planExplanation}>
              <div className={styles.planExplanationTitle}>
                {language === "id" ? "📋 Keterangan Status Plan:" : "📋 Plan Status Guide:"}
              </div>
              <div className={styles.planExplanationGrid}>
                <div className={styles.planExplanationItem}>
                  <span className={`${styles.planBadge} ${styles.free}`}>free</span>
                  <span>{language === "id" ? "Belum berlangganan — tidak bisa mengakses layanan apapun" : "Not subscribed — cannot access any services"}</span>
                </div>
                <div className={styles.planExplanationItem}>
                  <span className={`${styles.planBadge} ${styles.starter}`}>starter</span>
                  <span>{language === "id" ? "Berlangganan — akses layanan level Starter" : "Subscribed — access to Starter level services"}</span>
                </div>
                <div className={styles.planExplanationItem}>
                  <span className={`${styles.planBadge} ${styles.plus}`}>plus</span>
                  <span>{language === "id" ? "Berlangganan — akses layanan level Plus + Starter" : "Subscribed — access to Plus + Starter services"}</span>
                </div>
                <div className={styles.planExplanationItem}>
                  <span className={`${styles.planBadge} ${styles.max}`}>max</span>
                  <span>{language === "id" ? "Berlangganan — akses penuh ke semua layanan" : "Subscribed — full access to all services"}</span>
                </div>
              </div>
            </div>

            <div className={styles.userList}>
              {users.map((user) => (
                <div key={user.id} className={styles.userRow}>
                  <div className={styles.userInfo}>
                    <strong>{user.full_name || user.email}</strong>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                  <div className={styles.userMeta}>
                    <span className={`${styles.roleBadge} ${styles[user.role]}`}>{user.role}</span>
                    <span className={`${styles.planBadge} ${styles[user.plan]}`}>{user.plan}</span>
                    <span className={user.plan === "free" ? styles.subStatusNotSubscribed : styles.subStatusSubscribed}>
                      {user.plan === "free"
                        ? (language === "id" ? "Belum berlangganan" : "Not subscribed")
                        : (language === "id" ? "Berlangganan" : "Subscribed")}
                    </span>
                  </div>
                  <div className={styles.userActions}>
                    <select
                      defaultValue={user.plan}
                      className={styles.planSelect}
                      onChange={(e) => {
                        const newPlan = e.target.value as "free" | "starter" | "plus" | "max";
                        handleUserPlanChange(user.id, newPlan);
                      }}
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="plus">Plus</option>
                      <option value="max">Max</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Voucher Generation */}
        {activeTab === "vouchers" && (
          <section className={`${styles.card} stagger-3`}>
            <h2><Ticket size={20} />{text.vouchers}</h2>

            {/* Mode Toggle: durasi subscription */}
            <div className={styles.voucherModeToggle}>
              <label>
                <input
                  type="radio"
                  value="duration"
                  checked={voucherMode === "duration"}
                  onChange={(e) => setVoucherMode(e.target.value as "duration" | "date")}
                />
                <span>{language === "id" ? "Durasi (hari)" : "Duration (days)"}</span>
              </label>
              <label>
                <input
                  type="radio"
                  value="date"
                  checked={voucherMode === "date"}
                  onChange={(e) => setVoucherMode(e.target.value as "duration" | "date")}
                />
                <span>{language === "id" ? "Tanggal Akhir Langganan" : "Subscription End Date"}</span>
              </label>
            </div>

            <div className={styles.voucherGenForm}>
              {/* Plan */}
              <select
                value={voucherPlan}
                onChange={(e) => setVoucherPlan(e.target.value as "starter" | "plus" | "max")}
                className={styles.select}
              >
                <option value="starter">Starter</option>
                <option value="plus">Plus</option>
                <option value="max">Max</option>
              </select>

              {/* Durasi / Tanggal akhir langganan */}
              {voucherMode === "duration" ? (
                <input
                  type="number"
                  value={voucherDays}
                  onChange={(e) => setVoucherDays(Number(e.target.value))}
                  min={1}
                  className={styles.daysInput}
                  placeholder={text.duration}
                  title={text.duration}
                />
              ) : (
                <input
                  type="date"
                  value={voucherExpiryDate}
                  onChange={(e) => setVoucherExpiryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className={styles.dateInput}
                  title={language === "id" ? "Tanggal akhir langganan" : "Subscription end date"}
                />
              )}

              {/* Maks. pengguna */}
              <input
                type="number"
                value={voucherMaxUses}
                onChange={(e) => setVoucherMaxUses(Math.max(1, Number(e.target.value)))}
                min={1}
                className={styles.daysInput}
                placeholder={text.maxUses}
                title={text.maxUsesHint}
              />

              <button
                onClick={handleGenerate}
                className={styles.generateBtn}
                disabled={generating || (voucherMode === "date" && !voucherExpiryDate)}
              >
                {generating ? <Loader2 size={16} className="spin" /> : <><Plus size={16} />{text.generate}</>}
              </button>
            </div>

            {/* Kedaluwarsa voucher (opsional) */}
            <div className={styles.voucherExpiryRow}>
              <label className={styles.voucherExpiryLabel}>
                <Calendar size={14} />
                <span>{text.voucherExpiry}</span>
              </label>
              <input
                type="date"
                value={voucherVoucherExpiry}
                onChange={(e) => setVoucherVoucherExpiry(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={styles.dateInput}
                title={text.voucherExpiryHint}
              />
              {voucherVoucherExpiry && (
                <button
                  className={styles.copyBtn}
                  onClick={() => setVoucherVoucherExpiry("")}
                  title={language === "id" ? "Hapus tanggal" : "Clear date"}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Voucher List */}
            <div className={styles.voucherList}>
              <h3>{text.generated}</h3>
              {voucherDeleteMsg && (
                <div className={voucherDeleteMsg.type === "success" ? styles.successMsg : styles.errorMsg}>
                  {voucherDeleteMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  {voucherDeleteMsg.text}
                </div>
              )}
              {vouchers.length === 0 ? (
                <p className={styles.empty}>{text.noVouchers}</p>
              ) : (
                vouchers.slice(0, 50).map((v) => {
                  const isExpanded = expandedVoucherId === v.id;
                  const usagePercent = v.max_uses > 0 ? Math.round((v.usage_count / v.max_uses) * 100) : 0;
                  const isExhausted = v.usage_count >= v.max_uses;
                  const isVoucherExpired = v.expires_at ? new Date(v.expires_at) < new Date() : false;
                  return (
                    <div key={v.id} className={styles.voucherCard}>
                      {/* Baris utama */}
                      <div className={`${styles.voucherRow} ${isExhausted || isVoucherExpired ? styles.used : ""}`}>
                        <code className={styles.voucherCode}>{v.code}</code>
                        <span className={styles.voucherPlan}>{v.plan.toUpperCase()}</span>
                        <span className={styles.voucherDays}>{v.duration_days}d</span>

                        {/* Usage counter */}
                        <span className={styles.voucherUsage} title={`${v.usage_count} / ${v.max_uses} ${text.usageOf} ${v.max_uses}`}>
                          <Users size={12} />
                          {v.usage_count}/{v.max_uses}
                        </span>

                        {/* Progress bar */}
                        <span className={styles.voucherProgressWrap} title={`${usagePercent}%`}>
                          <span
                            className={styles.voucherProgressBar}
                            style={{ width: `${usagePercent}%`, background: isExhausted ? "#e53e3e" : "#38a169" }}
                          />
                        </span>

                        {/* Status badge */}
                        {isVoucherExpired ? (
                          <span className={`${styles.usedBadge} ${styles.expiredBadge}`}>
                            {language === "id" ? "Expired" : "Expired"}
                          </span>
                        ) : isExhausted ? (
                          <span className={styles.usedBadge}>{text.usedBadge}</span>
                        ) : v.usage_count > 0 ? (
                          <span className={`${styles.usedBadge} ${styles.partialBadge}`}>{text.partialBadge}</span>
                        ) : null}

                        {/* Tanggal kedaluwarsa voucher */}
                        {v.expires_at && (
                          <span className={styles.voucherExpiry} title={language === "id" ? "Kedaluwarsa voucher" : "Voucher expiry"}>
                            <Clock size={11} />
                            {new Date(v.expires_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        )}

                        {/* Tombol lihat pemakai */}
                        {v.usage_count > 0 && (
                          <button
                            className={styles.copyBtn}
                            onClick={() => handleViewRedemptions(v.id)}
                            title={text.viewRedemptions}
                          >
                            {loadingRedemptions === v.id
                              ? <Loader2 size={13} className="spin" />
                              : isExpanded
                                ? <ChevronUp size={13} />
                                : <ChevronDown size={13} />
                            }
                          </button>
                        )}

                        <button className={styles.copyBtn} onClick={() => copyCode(v.code)} title="Copy">
                          {copied === v.code ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          className={styles.deleteVoucherBtn}
                          onClick={() => handleDeleteVoucher(v.id)}
                          disabled={deletingVoucherId === v.id}
                          title={text.deleteVoucher}
                        >
                          {deletingVoucherId === v.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>

                      {/* Panel redemptions */}
                      {isExpanded && (
                        <div className={styles.redemptionPanel}>
                          <p className={styles.redemptionTitle}><Users size={13} />{text.redemptionsTitle}</p>
                          {loadingRedemptions === v.id ? (
                            <Loader2 size={16} className="spin" />
                          ) : (voucherRedemptions[v.id] || []).length === 0 ? (
                            <p className={styles.empty}>{text.noRedemptions}</p>
                          ) : (
                            <ul className={styles.redemptionList}>
                              {(voucherRedemptions[v.id] || []).map((r) => (
                                <li key={r.id} className={styles.redemptionItem}>
                                  <User size={12} />
                                  <span className={styles.redemptionUserId}>{r.user_id.slice(0, 8)}…</span>
                                  <span className={styles.redemptionDate}>
                                    {new Date(r.redeemed_at).toLocaleString(language === "id" ? "id-ID" : "en-US", {
                                      day: "2-digit", month: "short", year: "numeric",
                                      hour: "2-digit", minute: "2-digit",
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ── Activity Monitoring Tab ── */}
        {activeTab === "activity" && (
          <div className={styles.activityWrap}>

            {/* ── Header ── */}
            <div className={styles.activityHeader}>
              <h2><Activity size={20} />{language === "id" ? "Log Aktivitas User" : "User Activity Logs"}</h2>
              <div className={styles.activityHeaderActions}>
                <button
                  className={styles.refreshBtn}
                  onClick={() => loadActivityLogs(true)}
                  disabled={activityLogsLoading}
                  title="Refresh"
                >
                  {activityLogsLoading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                  {language === "id" ? "Refresh" : "Refresh"}
                </button>
              </div>
            </div>

            {/* ── View Tabs ── */}
            <div className={styles.activityViewTabs}>
              <button
                className={`${styles.activityViewTab} ${activityView === "logs" ? styles.activityViewTabActive : ""}`}
                onClick={() => setActivityView("logs")}
              >
                <Activity size={14} />
                {language === "id" ? "Log Aktivitas" : "Activity Logs"}
                {activityLogs.length > 0 && <span className={styles.activityTabBadge}>{activityLogs.length}</span>}
              </button>
              <button
                className={`${styles.activityViewTab} ${activityView === "users" ? styles.activityViewTabActive : ""}`}
                onClick={() => setActivityView("users")}
              >
                <Users size={14} />
                {language === "id" ? "Per User" : "Per User"}
                {activityUsers.length > 0 && <span className={styles.activityTabBadge}>{activityUsers.length}</span>}
              </button>
              <button
                className={`${styles.activityViewTab} ${activityView === "stats" ? styles.activityViewTabActive : ""}`}
                onClick={() => setActivityView("stats")}
              >
                <BarChart2 size={14} />
                {language === "id" ? "Statistik" : "Statistics"}
              </button>
            </div>

            {/* ── Filter Panel ── */}
            <div className={styles.activityFilterPanel}>
              <div className={styles.activityFilterRow}>
                {/* Filter by User */}
                <div className={styles.activityFilterField}>
                  <label className={styles.activityFilterLabel}>
                    <User size={12} />
                    {language === "id" ? "Filter User" : "Filter User"}
                  </label>
                  <select
                    className={styles.activityFilterSelect}
                    value={filterUserId}
                    onChange={(e) => setFilterUserId(e.target.value)}
                  >
                    <option value="">{language === "id" ? "Semua User" : "All Users"}</option>
                    {activityUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.user_email || u.user_name || u.user_id.slice(0, 8)}
                        {" "}({u.total_activities} aktivitas)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Category */}
                <div className={styles.activityFilterField}>
                  <label className={styles.activityFilterLabel}>
                    <Tag size={12} />
                    {language === "id" ? "Kategori" : "Category"}
                  </label>
                  <select
                    className={styles.activityFilterSelect}
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setFilterEventType(""); }}
                  >
                    <option value="">{language === "id" ? "Semua Kategori" : "All Categories"}</option>
                    {Object.entries(ACTIVITY_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Date From */}
                <div className={styles.activityFilterField}>
                  <label className={styles.activityFilterLabel}>
                    <Calendar size={12} />
                    {language === "id" ? "Dari Tanggal" : "Date From"}
                  </label>
                  <input
                    type="date"
                    className={styles.activityFilterInput}
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>

                {/* Filter by Date To */}
                <div className={styles.activityFilterField}>
                  <label className={styles.activityFilterLabel}>
                    <Calendar size={12} />
                    {language === "id" ? "Sampai Tanggal" : "Date To"}
                  </label>
                  <input
                    type="date"
                    className={styles.activityFilterInput}
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Search + Action Buttons */}
              <div className={styles.activityFilterActions}>
                <div className={styles.activitySearchBox}>
                  <Search size={13} className={styles.activitySearchIcon} />
                  <input
                    type="text"
                    className={styles.activitySearchInput}
                    placeholder={language === "id" ? "Cari email, deskripsi..." : "Search email, description..."}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                  {filterSearch && (
                    <button className={styles.activitySearchClear} onClick={() => setFilterSearch("")}>
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  className={styles.activityApplyBtn}
                  onClick={() => loadActivityLogs(true)}
                  disabled={activityLogsLoading}
                >
                  <Filter size={13} />
                  {language === "id" ? "Terapkan Filter" : "Apply Filter"}
                </button>
                <button
                  className={styles.activityResetBtn}
                  onClick={() => { resetActivityFilters(); }}
                  disabled={activityLogsLoading}
                >
                  <X size={13} />
                  {language === "id" ? "Reset" : "Reset"}
                </button>
              </div>

              {/* Active filter chips */}
              {(filterUserId || filterCategory || filterDateFrom || filterDateTo) && (
                <div className={styles.activityActiveFilters}>
                  <span className={styles.activityActiveFiltersLabel}>
                    <Filter size={11} />
                    {language === "id" ? "Filter aktif:" : "Active filters:"}
                  </span>
                  {filterUserId && (
                    <span className={styles.activityFilterChip}>
                      <User size={10} />
                      {activityUsers.find(u => u.user_id === filterUserId)?.user_email || filterUserId.slice(0, 8)}
                      <button onClick={() => setFilterUserId("")}><X size={10} /></button>
                    </span>
                  )}
                  {filterCategory && (
                    <span className={styles.activityFilterChip}>
                      <Tag size={10} />
                      {ACTIVITY_CATEGORIES[filterCategory as keyof typeof ACTIVITY_CATEGORIES] || filterCategory}
                      <button onClick={() => setFilterCategory("")}><X size={10} /></button>
                    </span>
                  )}
                  {filterDateFrom && (
                    <span className={styles.activityFilterChip}>
                      <Calendar size={10} />
                      {language === "id" ? "Dari" : "From"}: {filterDateFrom}
                      <button onClick={() => setFilterDateFrom("")}><X size={10} /></button>
                    </span>
                  )}
                  {filterDateTo && (
                    <span className={styles.activityFilterChip}>
                      <Calendar size={10} />
                      {language === "id" ? "Sampai" : "To"}: {filterDateTo}
                      <button onClick={() => setFilterDateTo("")}><X size={10} /></button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {activityLogsLoading ? (
              <div className={styles.activityLoading}><Loader2 size={24} className="spin" /></div>
            ) : (
              <>
                {/* ── VIEW: Log Aktivitas ── */}
                {activityView === "logs" && (
                  <section className={styles.card}>
                    <div className={styles.activityLogHeader}>
                      <h3 className={styles.activitySubtitle}>
                        <Activity size={16} />
                        {language === "id" ? "Log Aktivitas" : "Activity Logs"}
                        <span className={styles.activityCount}>{activityLogs.length}</span>
                      </h3>
                    </div>

                    {activityLogs.length === 0 ? (
                      <div className={styles.activityEmptyState}>
                        <Activity size={32} />
                        <p>
                          {language === "id"
                            ? "Belum ada log aktivitas. Log akan muncul setelah user melakukan aktivitas."
                            : "No activity logs yet. Logs will appear after users perform activities."}
                        </p>
                        <p className={styles.activityEmptyHint}>
                          {language === "id"
                            ? "Pastikan sudah menjalankan migration SQL di Supabase."
                            : "Make sure you have run the SQL migration in Supabase."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className={styles.activityTableWrap}>
                          <table className={styles.activityTable}>
                            <thead>
                              <tr>
                                <th>{language === "id" ? "Waktu" : "Time"}</th>
                                <th>{language === "id" ? "Pengguna" : "User"}</th>
                                <th>{language === "id" ? "Kategori" : "Category"}</th>
                                <th>{language === "id" ? "Aktivitas" : "Activity"}</th>
                                <th>{language === "id" ? "Deskripsi" : "Description"}</th>
                                <th>{language === "id" ? "Perangkat" : "Device"}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activityLogs
                                .filter(log => {
                                  if (!filterSearch.trim()) return true;
                                  const q = filterSearch.toLowerCase();
                                  return (
                                    log.user_email?.toLowerCase().includes(q) ||
                                    log.user_name?.toLowerCase().includes(q) ||
                                    log.description?.toLowerCase().includes(q) ||
                                    log.event_type?.toLowerCase().includes(q)
                                  );
                                })
                                .map((log) => (
                                  <tr key={log.id} className={styles.activityRow}>
                                    <td className={styles.activityTimeCell}>
                                      <div className={styles.activityTime}>
                                        <Clock size={11} />
                                        <span>{new Date(log.created_at).toLocaleString(language === "id" ? "id-ID" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <div className={styles.activityUser}>
                                        <span className={styles.activityEmail}>{log.user_email || log.user_id.slice(0, 8)}</span>
                                        {log.user_name && <span className={styles.activityName}>{log.user_name}</span>}
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`${styles.activityCategoryBadge} ${styles[`cat_${log.category}`]}`}>
                                        {ACTIVITY_CATEGORIES[log.category as keyof typeof ACTIVITY_CATEGORIES] || log.category}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`${styles.activityEventBadge} ${styles[`event_${log.event_type}`]}`}>
                                        {log.event_type}
                                      </span>
                                    </td>
                                    <td className={styles.activityDescCell}>
                                      {log.description || <span className={styles.activityNoDesc}>—</span>}
                                    </td>
                                    <td>
                                      {log.user_agent ? (
                                        <div className={styles.activityDevice}>
                                          <Smartphone size={11} />
                                          <span>{parseUserAgent(log.user_agent)}</span>
                                          <span className={styles.activityBrowser}>· {parseBrowser(log.user_agent)}</span>
                                        </div>
                                      ) : (
                                        <span className={styles.activityNoDesc}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        <div className={styles.activityPagination}>
                          <button
                            className={styles.activityPageBtn}
                            onClick={() => { setActivityPage(p => Math.max(0, p - 1)); loadActivityLogs(); }}
                            disabled={activityPage === 0 || activityLogsLoading}
                          >
                            ← {language === "id" ? "Sebelumnya" : "Previous"}
                          </button>
                          <span className={styles.activityPageInfo}>
                            {language === "id" ? "Halaman" : "Page"} {activityPage + 1}
                          </span>
                          <button
                            className={styles.activityPageBtn}
                            onClick={() => { setActivityPage(p => p + 1); loadActivityLogs(); }}
                            disabled={activityLogs.length < ACTIVITY_PAGE_SIZE || activityLogsLoading}
                          >
                            {language === "id" ? "Berikutnya" : "Next"} →
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {/* ── VIEW: Per User ── */}
                {activityView === "users" && (
                  <section className={styles.card}>
                    <h3 className={styles.activitySubtitle}>
                      <Users size={16} />
                      {language === "id" ? "Aktivitas Per User" : "Activity Per User"}
                      <span className={styles.activityCount}>{activityUsers.length}</span>
                    </h3>

                    {activityUsers.length === 0 ? (
                      <div className={styles.activityEmptyState}>
                        <Users size={32} />
                        <p>{language === "id" ? "Belum ada data aktivitas user." : "No user activity data yet."}</p>
                      </div>
                    ) : (
                      <div className={styles.activityTableWrap}>
                        <table className={styles.activityTable}>
                          <thead>
                            <tr>
                              <th>{language === "id" ? "Pengguna" : "User"}</th>
                              <th>{language === "id" ? "Total Aktivitas" : "Total Activities"}</th>
                              <th>{language === "id" ? "Aktivitas Terakhir" : "Last Activity"}</th>
                              <th>{language === "id" ? "Aksi" : "Action"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activityUsers
                              .filter(u => {
                                if (!filterSearch.trim()) return true;
                                const q = filterSearch.toLowerCase();
                                return (
                                  u.user_email?.toLowerCase().includes(q) ||
                                  u.user_name?.toLowerCase().includes(q)
                                );
                              })
                              .map((u) => (
                                <tr key={u.user_id} className={styles.activityRow}>
                                  <td>
                                    <div className={styles.activityUser}>
                                      <span className={styles.activityEmail}>{u.user_email || u.user_id.slice(0, 8)}</span>
                                      {u.user_name && <span className={styles.activityName}>{u.user_name}</span>}
                                    </div>
                                  </td>
                                  <td>
                                    <span className={styles.activityTotalBadge}>{u.total_activities}</span>
                                  </td>
                                  <td>
                                    <div className={styles.activityTime}>
                                      <Clock size={11} />
                                      <span>{new Date(u.last_activity).toLocaleString(language === "id" ? "id-ID" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <button
                                      className={styles.activityViewUserBtn}
                                      onClick={() => {
                                        setFilterUserId(u.user_id);
                                        setActivityView("logs");
                                        loadActivityLogs(true);
                                      }}
                                    >
                                      <Filter size={12} />
                                      {language === "id" ? "Lihat Log" : "View Logs"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}

                {/* ── VIEW: Statistik ── */}
                {activityView === "stats" && (
                  <section className={styles.card}>
                    <h3 className={styles.activitySubtitle}>
                      <BarChart2 size={16} />
                      {language === "id" ? "Statistik Aktivitas per Kategori" : "Activity Statistics by Category"}
                      {filterUserId && (
                        <span className={styles.activityStatsUserLabel}>
                          — {activityUsers.find(u => u.user_id === filterUserId)?.user_email || filterUserId.slice(0, 8)}
                        </span>
                      )}
                    </h3>

                    {activityStats.length === 0 ? (
                      <div className={styles.activityEmptyState}>
                        <BarChart2 size={32} />
                        <p>{language === "id" ? "Belum ada data statistik." : "No statistics data yet."}</p>
                      </div>
                    ) : (
                      <div className={styles.activityStatsGrid}>
                        {activityStats.map((stat) => {
                          const maxCount = Math.max(...activityStats.map(s => s.total_count));
                          const pct = maxCount > 0 ? (stat.total_count / maxCount) * 100 : 0;
                          return (
                            <div key={stat.category} className={styles.activityStatCard}>
                              <div className={styles.activityStatHeader}>
                                <span className={`${styles.activityCategoryBadge} ${styles[`cat_${stat.category}`]}`}>
                                  {ACTIVITY_CATEGORIES[stat.category as keyof typeof ACTIVITY_CATEGORIES] || stat.category}
                                </span>
                                <span className={styles.activityStatCount}>{stat.total_count}</span>
                              </div>
                              <div className={styles.activityStatBar}>
                                <div
                                  className={`${styles.activityStatBarFill} ${styles[`catBar_${stat.category}`]}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className={styles.activityStatFooter}>
                                <Clock size={10} />
                                <span>
                                  {language === "id" ? "Terakhir:" : "Last:"}
                                  {" "}{new Date(stat.last_activity).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                                </span>
                                <button
                                  className={styles.activityStatFilterBtn}
                                  onClick={() => {
                                    setFilterCategory(stat.category);
                                    setActivityView("logs");
                                    loadActivityLogs(true);
                                  }}
                                >
                                  <Filter size={10} />
                                  {language === "id" ? "Filter" : "Filter"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === "notifications" && (
          <section className={`${styles.card} stagger-1`}>
            <h2><Bell size={20} />{language === "id" ? "Kirim Notifikasi" : "Send Notification"}</h2>
            <p className={styles.empty} style={{ opacity: 0.7, marginBottom: "1rem" }}>
              {language === "id"
                ? "Kirim notifikasi ke semua user. Notifikasi akan muncul di halaman Notifikasi user."
                : "Send notifications to all users. Notifications will appear on the user's Notifications page."}
            </p>

            {notifSuccess && (
              <div className={styles.alertSuccess} role="status">
                <CheckCircle2 size={14} /> {notifSuccess}
              </div>
            )}

            <div className={styles.voucherGenForm}>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder={language === "id" ? "Judul notifikasi..." : "Notification title..."}
                className={styles.fieldInput}
                style={{ flex: 2 }}
              />
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as "info" | "success" | "warning" | "error")}
                className={styles.select}
              >
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="error">🚨 Error</option>
              </select>
              <select
                value={notifTarget}
                onChange={(e) => setNotifTarget(e.target.value as "all" | "subscribed" | "free")}
                className={styles.select}
              >
                <option value="all">{language === "id" ? "Semua User" : "All Users"}</option>
                <option value="subscribed">{language === "id" ? "Berlangganan" : "Subscribed"}</option>
                <option value="free">{language === "id" ? "Free" : "Free"}</option>
              </select>
            </div>

            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder={language === "id" ? "Isi pesan notifikasi..." : "Notification message..."}
              className={styles.fieldInput}
              rows={3}
              style={{ width: "100%", marginTop: "0.75rem", resize: "vertical" }}
            />

            <button
              className={styles.generateBtn}
              style={{ marginTop: "0.75rem" }}
              disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()}
              onClick={async () => {
                setSendingNotif(true);
                setNotifSuccess(null);
                const { data, error } = await createNotification({
                  title: notifTitle.trim(),
                  message: notifMessage.trim(),
                  type: notifType,
                  target: notifTarget,
                });
                if (data) {
                  setAdminNotifs((prev) => [data, ...prev]);
                  setNotifTitle("");
                  setNotifMessage("");
                  setNotifSuccess(language === "id" ? "Notifikasi berhasil dikirim!" : "Notification sent successfully!");
                  setTimeout(() => setNotifSuccess(null), 3000);
                  await logActivity("send_notification", "admin",
                    `Kirim notifikasi: ${data.title}`,
                    { notification_id: data.id, title: data.title, type: data.type, target: data.target }
                  );
                } else if (error) {
                  alert(error);
                }
                setSendingNotif(false);
              }}
            >
              {sendingNotif ? <Loader2 size={16} className="spin" /> : <><Send size={16} />{language === "id" ? "Kirim Notifikasi" : "Send Notification"}</>}
            </button>

            {/* Daftar notifikasi yang sudah dikirim */}
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                <Megaphone size={16} style={{ marginRight: "0.4rem" }} />
                {language === "id" ? "Notifikasi Terkirim" : "Sent Notifications"}
              </h3>
              {adminNotifs.length === 0 ? (
                <p className={styles.empty}>{language === "id" ? "Belum ada notifikasi." : "No notifications yet."}</p>
              ) : (
                <div className={styles.voucherList} style={{ marginTop: 0 }}>
                  {adminNotifs.slice(0, 20).map((n) => (
                    <div key={n.id} className={styles.voucherRow}>
                      <span style={{ fontSize: "0.8rem", color: "#fff", flex: 1 }}>{n.title}</span>
                      <span style={{ fontSize: "0.7rem", color: "#888" }}>
                        {n.type} · {n.target}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#666" }}>
                        {new Date(n.created_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                      </span>
                      <button
                        className={styles.deleteVoucherBtn}
                        onClick={async () => {
                          if (!confirm(language === "id" ? "Hapus notifikasi ini?" : "Delete this notification?")) return;
                          await deleteNotification(n.id);
                          setAdminNotifs((prev) => prev.filter((x) => x.id !== n.id));
                        }}
                        title={language === "id" ? "Hapus" : "Delete"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Service Bundles (Penyatuan Layanan) ── */}
        {activeTab === "bundles" && (
          <section className={styles.servicesWrap}>
            <div className={styles.servicesTopBar}>
              <div className={styles.servicesTitleRow}>
                <h2 className={styles.servicesTitle}>
                  <Layers size={20} />
                  {language === "id" ? "Penyatuan Layanan" : "Service Bundles"}
                  <span className={styles.servicesBadge}>{bundles.length}</span>
                </h2>
                <button
                  className={`${styles.addToggleBtn} ${showBundleForm ? styles.addToggleActive : ""}`}
                  onClick={() => {
                    if (showBundleForm) resetBundleForm();
                    else setShowBundleForm(true);
                  }}
                >
                  {showBundleForm ? <X size={16} /> : <Plus size={16} />}
                  {showBundleForm
                    ? (language === "id" ? "Batal" : "Cancel")
                    : (language === "id" ? "Buat Bundle" : "Create Bundle")}
                </button>
              </div>

              {bundleError && (
                <div className={styles.alertError} role="alert">
                  <AlertTriangle size={14} />
                  <span>{bundleError}</span>
                  <button onClick={() => setBundleError(null)} className={styles.alertClose}><X size={14} /></button>
                </div>
              )}
              {bundleSuccess && (
                <div className={styles.alertSuccess} role="status">
                  <CheckCircle2 size={14} /> {bundleSuccess}
                </div>
              )}
            </div>

            {/* Info penjelasan */}
            <div className={styles.card} style={{ padding: "1rem", marginBottom: "0.5rem" }}>
              <p style={{ color: "#888", fontSize: "0.82rem", margin: 0 }}>
                {language === "id"
                  ? "Bundle menyatukan beberapa layanan menjadi satu grup. Di extension main, user akan melihat bundle sebagai satu item — ketika diklik, layanan di dalamnya akan muncul."
                  : "Bundles group multiple services into one item. In the main extension, users see the bundle as a single item — clicking it reveals the services inside."}
              </p>
            </div>

            {/* ── Bundle Form ── */}
            {showBundleForm && (
              <div className={styles.addServiceCard}>
                <h3 className={styles.addServiceTitle}>
                  {editingBundle ? <Pencil size={16} /> : <Plus size={16} />}
                  {editingBundle
                    ? (language === "id" ? "Edit Bundle" : "Edit Bundle")
                    : (language === "id" ? "Buat Bundle Baru" : "Create New Bundle")}
                </h3>
                <div className={styles.addServiceGrid}>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>
                      {language === "id" ? "Nama Bundle" : "Bundle Name"} <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={bundleForm.name}
                      onChange={(e) => setBundleForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={language === "id" ? "contoh: Paket Streaming" : "e.g. Streaming Pack"}
                      className={styles.fieldInput}
                    />
                  </div>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>
                      Emoji Icon
                    </label>
                    <input
                      type="text"
                      value={bundleForm.icon_emoji}
                      onChange={(e) => setBundleForm(prev => ({ ...prev, icon_emoji: e.target.value }))}
                      placeholder="📦"
                      className={styles.fieldInput}
                      style={{ maxWidth: "80px" }}
                    />
                  </div>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>
                      {language === "id" ? "Urutan" : "Sort Order"}
                    </label>
                    <input
                      type="number"
                      value={bundleForm.sort_order}
                      onChange={(e) => setBundleForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className={styles.fieldInput}
                      style={{ maxWidth: "80px" }}
                    />
                  </div>
                  <div className={styles.addServiceField}>
                    <label className={styles.fieldLabel}>Status</label>
                    <select
                      value={bundleForm.is_active ? "active" : "inactive"}
                      onChange={(e) => setBundleForm(prev => ({ ...prev, is_active: e.target.value === "active" }))}
                      className={styles.fieldSelect}
                    >
                      <option value="active">{language === "id" ? "Aktif" : "Active"}</option>
                      <option value="inactive">{language === "id" ? "Nonaktif" : "Inactive"}</option>
                    </select>
                  </div>
                  <div className={`${styles.addServiceField} ${styles.addServiceFieldFull}`}>
                    <label className={styles.fieldLabel}>
                      {language === "id" ? "Deskripsi" : "Description"}
                      <span className={styles.optional}> ({language === "id" ? "opsional" : "optional"})</span>
                    </label>
                    <input
                      type="text"
                      value={bundleForm.description}
                      onChange={(e) => setBundleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={language === "id" ? "Deskripsi singkat bundle..." : "Short bundle description..."}
                      className={styles.fieldInput}
                    />
                  </div>
                  <div className={`${styles.addServiceField} ${styles.addServiceFieldFull}`}>
                    <label className={styles.fieldLabel}>
                      {language === "id" ? "Pilih Layanan" : "Select Services"} <span className={styles.required}>*</span>
                      <span className={styles.optional}> ({bundleForm.service_ids.length} {language === "id" ? "dipilih" : "selected"})</span>
                    </label>
                    <div className={styles.bundleServicePicker}>
                      {services.map((s) => (
                        <label key={s.id} className={`${styles.bundleServiceItem} ${bundleForm.service_ids.includes(s.id) ? styles.bundleServiceItemActive : ""}`}>
                          <input
                            type="checkbox"
                            checked={bundleForm.service_ids.includes(s.id)}
                            onChange={() => toggleBundleService(s.id)}
                            style={{ display: "none" }}
                          />
                          <span className={styles.bundleServiceCheck}>
                            {bundleForm.service_ids.includes(s.id) ? <CheckCircle2 size={14} /> : <span className={styles.bundleServiceUncheck} />}
                          </span>
                          <span className={styles.bundleServiceName}>{s.name}</span>
                          <span className={styles.bundleServiceDomain}>{s.domain}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.addServiceActions}>
                  <button onClick={resetBundleForm} className={styles.cancelBtn}>
                    <X size={14} />
                    {language === "id" ? "Batal" : "Cancel"}
                  </button>
                  <button
                    onClick={handleSaveBundle}
                    className={styles.submitBtn}
                    disabled={savingBundle || !bundleForm.name.trim() || bundleForm.service_ids.length === 0}
                  >
                    {savingBundle ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                    {editingBundle
                      ? (language === "id" ? "Simpan Perubahan" : "Save Changes")
                      : (language === "id" ? "Buat Bundle" : "Create Bundle")}
                  </button>
                </div>
              </div>
            )}

            {/* ── Bundle List ── */}
            {bundlesLoading ? (
              <div className={styles.loadingState}><Loader2 size={24} className="spin" /></div>
            ) : bundles.length === 0 ? (
              <div className={styles.card} style={{ textAlign: "center", padding: "2rem" }}>
                <Layers size={32} style={{ color: "#555", marginBottom: "0.5rem" }} />
                <p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>
                  {language === "id" ? "Belum ada bundle. Buat bundle pertama untuk menyatukan layanan." : "No bundles yet. Create your first bundle to group services."}
                </p>
              </div>
            ) : (
              <div className={styles.bundleList}>
                {bundles.map((bundle) => {
                  const bundleServices = services.filter(s => bundle.service_ids.includes(s.id));
                  return (
                    <div key={bundle.id} className={`${styles.bundleCard} ${!bundle.is_active ? styles.bundleCardInactive : ""}`}>
                      <div className={styles.bundleCardHeader}>
                        <span className={styles.bundleEmoji}>{bundle.icon_emoji}</span>
                        <div className={styles.bundleCardInfo}>
                          <strong className={styles.bundleCardName}>{bundle.name}</strong>
                          {bundle.description && <span className={styles.bundleCardDesc}>{bundle.description}</span>}
                          <span className={styles.bundleCardMeta}>
                            {bundleServices.length} {language === "id" ? "layanan" : "services"}
                            {!bundle.is_active && <span className={styles.bundleInactiveBadge}>{language === "id" ? "Nonaktif" : "Inactive"}</span>}
                          </span>
                        </div>
                        <div className={styles.bundleCardActions}>
                          <button
                            className={styles.bundleEditBtn}
                            onClick={() => startEditBundle(bundle)}
                            title={language === "id" ? "Edit" : "Edit"}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteBundle(bundle.id)}
                            disabled={deletingBundleId === bundle.id}
                            title={language === "id" ? "Hapus" : "Delete"}
                          >
                            {deletingBundleId === bundle.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className={styles.bundleServicesList}>
                        {bundleServices.map((s) => (
                          <span key={s.id} className={styles.bundleServiceTag}>
                            <Globe size={11} />
                            {s.name}
                          </span>
                        ))}
                        {bundleServices.length === 0 && (
                          <span style={{ color: "#666", fontSize: "0.75rem" }}>
                            {language === "id" ? "Tidak ada layanan (mungkin sudah dihapus)" : "No services (may have been deleted)"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
