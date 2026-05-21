"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Gauge,
  Loader2,
  LogOut,
  Monitor,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Ticket,
  Users,
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
  getAdminStats,
  getUserActivity,
  getAuditLogs,
  parseUserAgent,
  parseBrowser,
  serializeError,
  signOut,
  type Profile,
  type Service,
  type Voucher,
  type UserActivity,
  type AuditLog,
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
    generate: "Generate Voucher",
    generated: "Voucher Tergenerate",
    code: "Kode",
    copied: "Tersalin!",
    noVouchers: "Belum ada voucher.",
    cookiesJson: "Cookies JSON",
    updateCookies: "Update Cookies",
    totalUsers: "Total Users",
    totalVouchers: "Total Vouchers",
    activeServices: "Layanan Aktif",
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
    generate: "Generate Voucher",
    generated: "Generated Vouchers",
    code: "Code",
    copied: "Copied!",
    noVouchers: "No vouchers yet.",
    cookiesJson: "Cookies JSON",
    updateCookies: "Update Cookies",
    totalUsers: "Total Users",
    totalVouchers: "Total Vouchers",
    activeServices: "Active Services",
  },
};

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
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "vouchers" | "users" | "activity">("overview");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState("");
  const [voucherPlan, setVoucherPlan] = useState<"starter" | "plus" | "max">("starter");
  const [voucherDays, setVoucherDays] = useState(30);
  const [voucherMode, setVoucherMode] = useState<"duration" | "date">("duration");
  const [voucherExpiryDate, setVoucherExpiryDate] = useState("");
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

      setLoading(false);
    }
    load();
  }, [router]);

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
      
      const result = await generateVoucher(voucherPlan, durationDays);
      if (result.data) {
        setVouchers((prev) => [result.data as Voucher, ...prev]);
        setStats(prev => ({ ...prev, vouchers: prev.vouchers + 1 }));
        console.log("Voucher generated successfully:", result.data);
      }
    } catch (error) {
      console.error("Voucher generation failed:", error);
      alert("Gagal membuat voucher. Silakan coba lagi.");
    }
    setGenerating(false);
  }

  async function handleUserPlanChange(userId: string, newPlan: "free" | "starter" | "plus" | "max") {
    try {
      await updateUserPlan(userId, newPlan);
      setUsers(prev => prev.map(u => u.id === userId ? {...u, plan: newPlan} : u));
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
      setStats(prev => ({ ...prev, services: prev.services + 1 }));
      setServiceSuccess(language === "id" ? "Layanan berhasil ditambahkan!" : "Service added successfully!");
      setTimeout(() => setServiceSuccess(null), 3000);
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
          setStats(prev => ({ ...prev, services: prev.services + 1 }));
          setServiceSuccess(language === "id" ? "Layanan berhasil ditambahkan!" : "Service added successfully!");
          setTimeout(() => setServiceSuccess(null), 3000);
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
    
    setChangedServices(new Set());
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
            onClick={() => { setActiveTab("activity"); if (userActivity.length === 0) loadActivity(); }}
          >
            <Activity size={18} />Monitoring
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
        )}

        {/* Services Management */}
        {activeTab === "services" && (
          <section className={`${styles.card} stagger-2`}>
            <div className={styles.sectionHeader}>
              <h2><Settings size={20} />{text.services}</h2>
              {changedServices.size > 0 && (
                <button onClick={saveChanges} className={styles.saveBtn}>
                  <CheckCircle2 size={16} />
                  {text.save} ({changedServices.size})
                </button>
              )}
            </div>

            {/* Error / Success feedback */}
            {serviceError && (
              <div className={styles.alertError} role="alert">
                <span>⚠ {serviceError}</span>
                <button onClick={() => setServiceError(null)} className={styles.alertClose}>×</button>
              </div>
            )}
            {serviceSuccess && (
              <div className={styles.alertSuccess} role="status">
                <CheckCircle2 size={14} /> {serviceSuccess}
              </div>
            )}
            
            {/* Group Filter */}
            <div className={styles.groupFilter}>
              <label>Filter Group:</label>
              <select 
                value={selectedGroup} 
                onChange={(e) => setSelectedGroup(e.target.value)}
                className={styles.groupSelect}
              >
                <option value="all">Semua Group</option>
                <option value="streaming">Streaming</option>
                <option value="ai">AI & Assistant</option>
                <option value="design">Design & Creative</option>
                <option value="productivity">Productivity</option>
                <option value="education">Education</option>
                <option value="social">Social Media</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
            
            {/* Add Service Form */}
            <div className={styles.addServiceForm}>
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Nama layanan (contoh: Netflix Premium)"
                className={styles.serviceInput}
              />
              <input
                type="text"
                value={newServiceDomain}
                onChange={(e) => setNewServiceDomain(e.target.value)}
                placeholder="Domain (contoh: netflix.com)"
                className={styles.domainInput}
              />
              <select
                value={newServiceGroup}
                onChange={(e) => setNewServiceGroup(e.target.value as any)}
                className={styles.groupSelectForm}
              >
                <option value="streaming">Streaming</option>
                <option value="ai">AI & Assistant</option>
                <option value="design">Design & Creative</option>
                <option value="productivity">Productivity</option>
                <option value="education">Education</option>
                <option value="social">Social Media</option>
                <option value="other">Lainnya</option>
              </select>
              <select
                value={newServicePlan}
                onChange={(e) => setNewServicePlan(e.target.value as "starter" | "plus" | "max")}
                className={styles.groupSelectForm}
              >
                <option value="starter">Plan: Starter</option>
                <option value="plus">Plan: Plus</option>
                <option value="max">Plan: Max</option>
              </select>
              <input
                type="text"
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                placeholder={language === "id" ? "Deskripsi (opsional)" : "Description (optional)"}
                className={styles.serviceInput}
              />
              <button
                onClick={addService}
                className={styles.addBtn}
                disabled={addingService || !newServiceName.trim() || !newServiceDomain.trim()}
              >
                {addingService ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                {language === "id" ? "Tambah" : "Add"}
              </button>
            </div>

            {/* Services by Group */}
            {["streaming", "ai", "design", "productivity", "education", "social", "other"].map(group => {
              const groupServices = services.filter(s => 
                s.group_name === group && (selectedGroup === "all" || selectedGroup === group)
              );
              
              if (groupServices.length === 0) return null;
              
              const groupNames = {
                streaming: "🎬 Streaming",
                ai: "🤖 AI & Assistant", 
                design: "🎨 Design & Creative",
                productivity: "⚡ Productivity",
                education: "📚 Education",
                social: "📱 Social Media",
                other: "📦 Lainnya"
              };
              
              return (
                <div key={group} className={styles.serviceGroup}>
                  <h3 className={styles.groupTitle}>{groupNames[group as keyof typeof groupNames]}</h3>
                  <div className={styles.serviceList}>
                    {groupServices.map((s) => (
                      <div key={s.id} className={`${styles.serviceRow} ${changedServices.has(s.id) ? styles.changed : ""}`}>
                        <div className={styles.serviceInfo}>
                          <div>
                            <strong>{s.name}</strong>
                            <span className={styles.serviceDomain}>{s.domain}</span>
                          </div>
                          <span className={`${styles.statusDot} ${styles[s.status]}`} />
                        </div>
                        <div className={styles.serviceControls}>
                          <select
                            value={s.status}
                            onChange={(e) => handleStatusChange(s.id, e.target.value as "active" | "maintenance" | "down")}
                            className={styles.statusSelect}
                          >
                            <option value="active">{text.active}</option>
                            <option value="maintenance">{text.maintenance}</option>
                            <option value="down">{text.down}</option>
                          </select>
                          <button
                            onClick={() => removeService(s.id)}
                            className={styles.removeBtn}
                            disabled={deletingServiceId === s.id}
                            title={language === "id" ? "Hapus layanan" : "Delete service"}
                          >
                            {deletingServiceId === s.id ? <Loader2 size={12} className="spin" /> : "×"}
                          </button>
                        </div>
                        <div className={styles.cookiesSection}>
                          <div className={styles.cookieHeader}>
                            <label className={styles.cookieLabel}>Format Cookies:</label>
                            <select
                              value={cookieFormats[s.id] || s.cookie_format}
                              onChange={(e) => handleFormatChange(s.id, e.target.value as "json" | "netscape")}
                              className={styles.formatSelect}
                            >
                              <option value="json">JSON</option>
                              <option value="netscape">Netscape</option>
                            </select>
                          </div>
                          
                          {(cookieFormats[s.id] || s.cookie_format) === "json" ? (
                            <textarea
                              className={styles.cookiesInput}
                              placeholder='{"session_id": "abc123", "auth_token": "xyz789"}'
                              defaultValue={s.cookies_json ? JSON.stringify(s.cookies_json, null, 2) : ""}
                              onBlur={(e) => handleCookiesUpdate(s.id, e.target.value, "json")}
                              rows={4}
                            />
                          ) : (
                            <textarea
                              className={styles.cookiesInput}
                              placeholder={`# Netscape HTTP Cookie File
.${s.domain}	TRUE	/	FALSE	1735689600	session_id	abc123`}
                              defaultValue={s.cookies_netscape || ""}
                              onBlur={(e) => handleCookiesUpdate(s.id, e.target.value, "netscape")}
                              rows={4}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* User Management */}
        {activeTab === "users" && (
          <section className={`${styles.card} stagger-2`}>
            <h2><Users size={20} />{text.users}</h2>
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
            
            {/* Mode Toggle */}
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
                <span>{language === "id" ? "Tanggal Kedaluwarsa" : "Expiration Date"}</span>
              </label>
            </div>
            
            <div className={styles.voucherGenForm}>
              <select value={voucherPlan} onChange={(e) => setVoucherPlan(e.target.value as "starter" | "plus" | "max")} className={styles.select}>
                <option value="starter">Starter</option>
                <option value="plus">Plus</option>
                <option value="max">Max</option>
              </select>
              
              {voucherMode === "duration" ? (
                <input
                  type="number"
                  value={voucherDays}
                  onChange={(e) => setVoucherDays(Number(e.target.value))}
                  min={1}
                  className={styles.daysInput}
                  placeholder={text.duration}
                />
              ) : (
                <input
                  type="date"
                  value={voucherExpiryDate}
                  onChange={(e) => setVoucherExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={styles.dateInput}
                  placeholder={language === "id" ? "Pilih tanggal" : "Select date"}
                />
              )}
              
              <button onClick={handleGenerate} className={styles.generateBtn} disabled={generating || (voucherMode === "date" && !voucherExpiryDate)}>
                {generating ? <Loader2 size={16} className="spin" /> : <><Plus size={16} />{text.generate}</>}
              </button>
            </div>

            <div className={styles.voucherList}>
              <h3>{text.generated}</h3>
              {vouchers.length === 0 ? (
                <p className={styles.empty}>{text.noVouchers}</p>
              ) : (
                vouchers.slice(0, 20).map((v) => (
                  <div key={v.id} className={`${styles.voucherRow} ${v.is_used ? styles.used : ""}`}>
                    <code>{v.code}</code>
                    <span className={styles.voucherPlan}>{v.plan.toUpperCase()}</span>
                    <span className={styles.voucherDays}>{v.duration_days}d</span>
                    {v.is_used && <span className={styles.usedBadge}>Used</span>}
                    <button className={styles.copyBtn} onClick={() => copyCode(v.code)} title="Copy">
                      {copied === v.code ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ── Activity Monitoring Tab ── */}
        {activeTab === "activity" && (
          <div className={styles.activityWrap}>
            <div className={styles.activityHeader}>
              <h2><Activity size={20} />User Monitoring</h2>
              <button
                className={styles.refreshBtn}
                onClick={loadActivity}
                disabled={activityLoading}
                title="Refresh"
              >
                {activityLoading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                {language === "id" ? "Refresh" : "Refresh"}
              </button>
            </div>

            {activityLoading ? (
              <div className={styles.activityLoading}><Loader2 size={24} className="spin" /></div>
            ) : (
              <>
                {/* User activity table */}
                <section className={`${styles.card} stagger-1`}>
                  <h3 className={styles.activitySubtitle}>
                    <Users size={16} />
                    {language === "id" ? "Status Login User" : "User Login Status"}
                    <span className={styles.activityCount}>{userActivity.length}</span>
                  </h3>
                  <div className={styles.activityTableWrap}>
                    <table className={styles.activityTable}>
                      <thead>
                        <tr>
                          <th>{language === "id" ? "Pengguna" : "User"}</th>
                          <th>Plan</th>
                          <th>Role</th>
                          <th>{language === "id" ? "Provider" : "Provider"}</th>
                          <th>{language === "id" ? "Login Terakhir" : "Last Login"}</th>
                          <th>{language === "id" ? "Terdaftar" : "Registered"}</th>
                          <th>{language === "id" ? "Email Verified" : "Email Verified"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userActivity.length === 0 ? (
                          <tr><td colSpan={7} className={styles.activityEmpty}>
                            {language === "id" ? "Belum ada data aktivitas." : "No activity data yet."}
                          </td></tr>
                        ) : userActivity.map((u) => (
                          <tr key={u.id} className={styles.activityRow}>
                            <td>
                              <div className={styles.activityUser}>
                                <span className={styles.activityEmail}>{u.email}</span>
                                {u.full_name && <span className={styles.activityName}>{u.full_name}</span>}
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.activityPlan} ${styles[`plan_${u.plan}`]}`}>
                                {u.plan?.toUpperCase() || "FREE"}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.activityRole} ${u.role === "admin" ? styles.roleAdmin : styles.roleUser}`}>
                                {u.role || "user"}
                              </span>
                            </td>
                            <td>
                              <span className={styles.activityProvider}>{u.auth_provider || "email"}</span>
                            </td>
                            <td>
                              {u.last_sign_in_at ? (
                                <div className={styles.activityTime}>
                                  <Clock size={12} />
                                  <span>{new Date(u.last_sign_in_at).toLocaleString(language === "id" ? "id-ID" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                                </div>
                              ) : (
                                <span className={styles.activityNever}>{language === "id" ? "Belum pernah" : "Never"}</span>
                              )}
                            </td>
                            <td>
                              <span className={styles.activityDate}>
                                {new Date(u.registered_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                              </span>
                            </td>
                            <td>
                              {u.email_confirmed_at ? (
                                <span className={styles.verified}>✓ Verified</span>
                              ) : (
                                <span className={styles.unverified}>✗ Unverified</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Audit logs */}
                <section className={`${styles.card} stagger-2`}>
                  <h3 className={styles.activitySubtitle}>
                    <Activity size={16} />
                    {language === "id" ? "Log Aktivitas Terbaru" : "Recent Activity Logs"}
                    <span className={styles.activityCount}>{auditLogs.length}</span>
                  </h3>
                  {auditLogs.length === 0 ? (
                    <p className={styles.empty}>
                      {language === "id"
                        ? "Belum ada log. Log akan muncul setelah user melakukan aktivitas (login, redeem voucher, dll)."
                        : "No logs yet. Logs will appear after users perform activities (login, redeem voucher, etc)."}
                    </p>
                  ) : (
                    <div className={styles.auditList}>
                      {auditLogs.map((log) => (
                        <div key={log.id} className={styles.auditRow}>
                          <div className={styles.auditIcon}>
                            {log.event_type === "login" ? <Monitor size={14} /> : <Activity size={14} />}
                          </div>
                          <div className={styles.auditInfo}>
                            <div className={styles.auditTop}>
                              <span className={`${styles.auditEvent} ${styles[`event_${log.event_type}`]}`}>
                                {log.event_type}
                              </span>
                              <span className={styles.auditUserEmail}>{log.user_email || log.user_id}</span>
                            </div>
                            {log.description && <p className={styles.auditDesc}>{log.description}</p>}
                            <div className={styles.auditMeta}>
                              {log.user_agent && (
                                <span className={styles.auditDevice}>
                                  <Smartphone size={11} />
                                  {parseUserAgent(log.user_agent)} · {parseBrowser(log.user_agent)}
                                </span>
                              )}
                              {log.ip_address && (
                                <span className={styles.auditIp}>IP: {log.ip_address}</span>
                              )}
                            </div>
                          </div>
                          <span className={styles.auditTime}>
                            {new Date(log.created_at).toLocaleString(language === "id" ? "id-ID" : "en-US", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
