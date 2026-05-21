"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  History,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  Zap,
  Lock,
  Globe,
  Clock,
  TrendingUp,
} from "lucide-react";
import { LanguageSwitcher, useLanguage, type Language } from "../components/language";
import {
  supabase,
  getProfile,
  getServices,
  redeemVoucher,
  signOut,
  getActiveSubscription,
  getSubscriptionHistory,
  daysRemaining,
  type Profile,
  type Service,
  type Subscription,
} from "@/lib/supabase";
import styles from "./page.module.css";

// ── i18n ────────────────────────────────────────────────────
const copy: Record<Language, Record<string, string>> = {
  id: {
    dashboard: "Dashboard",
    billing: "Billing",
    orders: "Riwayat",
    report: "Laporan",
    settings: "Pengaturan",
    profile: "Profil",
    logout: "Keluar",
    welcome: "Halo,",
    plan: "Plan",
    active: "Aktif",
    free: "Gratis",
    expired: "Kedaluwarsa",
    noSub: "Belum berlangganan",
    subExpires: "Berakhir",
    daysLeft: "hari tersisa",
    subHistory: "Riwayat Langganan",
    noHistory: "Belum ada riwayat langganan.",
    voucherTitle: "Redeem Voucher",
    voucherPlaceholder: "Masukkan kode voucher",
    voucherBtn: "Redeem",
    voucherSuccess: "Voucher berhasil digunakan! Plan kamu sudah diperbarui.",
    voucherError: "Voucher tidak valid atau sudah digunakan.",
    services: "Layanan Tersedia",
    noServices: "Belum ada layanan tersedia.",
    accessService: "Akses",
    planRequired: "Butuh plan",
    maintenance: "Maintenance",
    down: "Down",
    quickLinks: "Akses Cepat",
    upgradeTitle: "Upgrade Plan",
    upgradeDesc: "Dapatkan akses ke lebih banyak layanan premium.",
    upgradeBtn: "Lihat Plan",
    streaming: "Streaming",
    ai: "AI & Asisten",
    design: "Desain",
    productivity: "Produktivitas",
    education: "Edukasi",
    social: "Sosial",
    other: "Lainnya",
    all: "Semua",
    filterGroup: "Filter:",
    planFree: "Free",
    planStarter: "Starter",
    planPlus: "Plus",
    planMax: "Max",
    subActive: "Aktif",
    subInactive: "Tidak Aktif",
    adminPanel: "Panel Admin",
  },
  en: {
    dashboard: "Dashboard",
    billing: "Billing",
    orders: "History",
    report: "Report",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    welcome: "Hello,",
    plan: "Plan",
    active: "Active",
    free: "Free",
    expired: "Expired",
    noSub: "No active subscription",
    subExpires: "Expires",
    daysLeft: "days left",
    subHistory: "Subscription History",
    noHistory: "No subscription history yet.",
    voucherTitle: "Redeem Voucher",
    voucherPlaceholder: "Enter voucher code",
    voucherBtn: "Redeem",
    voucherSuccess: "Voucher redeemed! Your plan has been updated.",
    voucherError: "Invalid or already used voucher.",
    services: "Available Services",
    noServices: "No services available yet.",
    accessService: "Access",
    planRequired: "Requires plan",
    maintenance: "Maintenance",
    down: "Down",
    quickLinks: "Quick Access",
    upgradeTitle: "Upgrade Plan",
    upgradeDesc: "Get access to more premium services.",
    upgradeBtn: "View Plans",
    streaming: "Streaming",
    ai: "AI & Assistant",
    design: "Design",
    productivity: "Productivity",
    education: "Education",
    social: "Social",
    other: "Other",
    all: "All",
    filterGroup: "Filter:",
    planFree: "Free",
    planStarter: "Starter",
    planPlus: "Plus",
    planMax: "Max",
    subActive: "Active",
    subInactive: "Inactive",
    adminPanel: "Admin Panel",
  },
};

// ── Constants ────────────────────────────────────────────────
const planOrder: Record<string, number> = { free: 0, starter: 1, plus: 2, max: 3 };

const planColors: Record<string, string> = {
  free: styles.planFree,
  starter: styles.planStarter,
  plus: styles.planPlus,
  max: styles.planMax,
};

const groupLabels: Record<string, Record<Language, string>> = {
  all:          { id: "Semua",        en: "All" },
  streaming:    { id: "Streaming",    en: "Streaming" },
  ai:           { id: "AI & Asisten", en: "AI & Assistant" },
  design:       { id: "Desain",       en: "Design" },
  productivity: { id: "Produktivitas",en: "Productivity" },
  education:    { id: "Edukasi",      en: "Education" },
  social:       { id: "Sosial",       en: "Social" },
  other:        { id: "Lainnya",      en: "Other" },
};

const groupEmoji: Record<string, string> = {
  streaming: "🎬", ai: "🤖", design: "🎨",
  productivity: "⚡", education: "📚", social: "📱", other: "📦",
};

// ── Quick links config ───────────────────────────────────────
const quickLinks = [
  { href: "/dashboard/billing", icon: CreditCard,  labelId: "Billing",         labelEn: "Billing" },
  { href: "/dashboard/orders",  icon: History,     labelId: "Riwayat",         labelEn: "History" },
  { href: "/dashboard/plan",    icon: TrendingUp,  labelId: "Ringkasan Plan",  labelEn: "Plan Overview" },
  { href: "/dashboard/notifications", icon: Bell,  labelId: "Notifikasi",      labelEn: "Notifications" },
  { href: "/dashboard/settings",icon: Settings,    labelId: "Pengaturan",      labelEn: "Settings" },
  { href: "/dashboard/report-service", icon: ListChecks, labelId: "Lapor Layanan", labelEn: "Report Service" },
];

// ── Component ────────────────────────────────────────────────
export default function DashboardPage() {
  const { language, mounted } = useLanguage();
  const text = copy[language];
  const router = useRouter();

  const [profile, setProfile]           = useState<Profile | null>(null);
  const [services, setServices]         = useState<Service[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subHistory, setSubHistory]     = useState<Subscription[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<"overview" | "services" | "subscription">("overview");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [voucherCode, setVoucherCode]   = useState("");
  const [voucherMsg, setVoucherMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [redeeming, setRedeeming]       = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) { router.push("/login"); return; }
      setProfile(p);

      const [s, sub, hist] = await Promise.all([
        getServices(),
        getActiveSubscription(),
        getSubscriptionHistory(),
      ]);
      setServices(s || []);
      setSubscription(sub);
      setSubHistory(hist);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleRedeem(e: FormEvent) {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    setVoucherMsg(null);
    const { error } = await redeemVoucher(voucherCode);
    if (error) {
      setVoucherMsg({ type: "error", text: text.voucherError });
    } else {
      setVoucherMsg({ type: "success", text: text.voucherSuccess });
      // Refresh profile & subscription
      const [p, sub, hist] = await Promise.all([
        getProfile(),
        getActiveSubscription(),
        getSubscriptionHistory(),
      ]);
      if (p) setProfile(p);
      setSubscription(sub);
      setSubHistory(hist);
    }
    setVoucherCode("");
    setRedeeming(false);
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  const canAccess = (required: string) =>
    planOrder[profile?.plan || "free"] >= planOrder[required];

  // Filter services by group
  const filteredServices = selectedGroup === "all"
    ? services
    : services.filter(s => s.group_name === selectedGroup);

  // Unique groups that have services
  const availableGroups = ["all", ...Array.from(new Set(services.map(s => s.group_name)))];

  if (!mounted || loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className="spin" />
        </div>
      </main>
    );
  }

  const days = subscription ? daysRemaining(subscription.expires_at) : 0;

  return (
    <main className={styles.page}>
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} slide-in-left`}>
        <div className={styles.sidebarLogo}>
          <Image src="/logo/logo_simply.png" alt="Simply" width={28} height={28} style={{ borderRadius: 8 }} />
          <strong>Simply</strong>
        </div>

        {/* User info */}
        <div className={styles.sidebarUser}>
          <div className={styles.avatarCircle}>
            <UserRound size={20} />
          </div>
          <div className={styles.sidebarUserInfo}>
            <span className={styles.sidebarUserName}>{profile?.full_name || profile?.email?.split("@")[0]}</span>
            <span className={`${styles.sidebarPlanBadge} ${planColors[profile?.plan || "free"]}`}>
              {profile?.plan?.toUpperCase()}
            </span>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeTab === "overview" ? styles.active : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={18} />{text.dashboard}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "services" ? styles.active : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <Sparkles size={18} />{text.services}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "subscription" ? styles.active : ""}`}
            onClick={() => setActiveTab("subscription")}
          >
            <CreditCard size={18} />{text.billing}
          </button>
        </nav>

        <div className={styles.sidebarBottom}>
          <Link href="/dashboard/downloads" className={styles.adminLink}>
            <Download size={16} />Download Extension
          </Link>
          {profile?.role === "admin" && (
            <Link href="/admin" className={styles.adminLink}>
              <ShieldCheck size={16} />{text.adminPanel}
            </Link>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />{text.logout}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className={`${styles.content} fade-in`}>
        <header className={styles.header}>
          <div>
            <h1>{text.welcome} <span className={styles.headerName}>{profile?.full_name || profile?.email?.split("@")[0]}</span></h1>
            <div className={styles.badges}>
              <span className={`${styles.planBadge} ${planColors[profile?.plan || "free"]}`}>
                {text.plan}: {profile?.plan?.toUpperCase()}
              </span>
              {subscription ? (
                <span className={styles.statusBadge}>
                  <ShieldCheck size={14} />{text.active} · {days} {text.daysLeft}
                </span>
              ) : (
                <span className={styles.statusBadgeFree}>
                  <Zap size={14} />{text.noSub}
                </span>
              )}
            </div>
          </div>
          <LanguageSwitcher />
        </header>

        {/* ══ TAB: OVERVIEW ══ */}
        {activeTab === "overview" && (
          <>
            {/* Subscription status card */}
            <section className={`${styles.subCard} stagger-1`}>
              {subscription ? (
                <div className={styles.subActive}>
                  <div className={styles.subIcon}><ShieldCheck size={24} /></div>
                  <div className={styles.subInfo}>
                    <span className={styles.subPlan}>{subscription.plan.toUpperCase()}</span>
                    <span className={styles.subExpiry}>
                      <CalendarDays size={14} />
                      {text.subExpires}: {new Date(subscription.expires_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.daysLeft}>{days} {text.daysLeft}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.subEmpty}>
                  <div className={styles.subEmptyIcon}><Ticket size={28} /></div>
                  <div>
                    <p className={styles.subEmptyTitle}>{text.noSub}</p>
                    <p className={styles.subEmptyDesc}>{text.upgradeDesc}</p>
                  </div>
                  <button className={styles.upgradeBtn} onClick={() => setActiveTab("subscription")}>
                    {text.upgradeBtn} <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </section>

            {/* Voucher redeem */}
            <section className={`${styles.card} stagger-2`}>
              <h2><Ticket size={20} />{text.voucherTitle}</h2>
              <form className={styles.voucherForm} onSubmit={handleRedeem}>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder={text.voucherPlaceholder}
                  className={styles.voucherInput}
                  aria-label={text.voucherPlaceholder}
                />
                <button type="submit" className={styles.voucherBtn} disabled={redeeming || !voucherCode.trim()}>
                  {redeeming ? <Loader2 size={16} className="spin" /> : text.voucherBtn}
                </button>
              </form>
              {voucherMsg && (
                <div className={`${styles.voucherMsg} ${styles[voucherMsg.type]}`} role="alert">
                  {voucherMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {voucherMsg.text}
                </div>
              )}
            </section>

            {/* Quick links */}
            <section className={`${styles.card} stagger-3`}>
              <h2><Zap size={20} />{text.quickLinks}</h2>
              <div className={styles.quickGrid}>
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={styles.quickItem}>
                    <link.icon size={20} />
                    <span>{language === "id" ? link.labelId : link.labelEn}</span>
                    <ChevronRight size={14} className={styles.quickArrow} />
                  </Link>
                ))}
              </div>
            </section>

            {/* Services preview (top 6) */}
            <section className={`${styles.card} stagger-4`}>
              <div className={styles.sectionHeader}>
                <h2><Sparkles size={20} />{text.services}</h2>
                <button className={styles.seeAllBtn} onClick={() => setActiveTab("services")}>
                  {language === "id" ? "Lihat semua" : "See all"} <ChevronRight size={14} />
                </button>
              </div>
              {services.length === 0 ? (
                <p className={styles.empty}>{text.noServices}</p>
              ) : (
                <div className={styles.serviceGrid}>
                  {services.slice(0, 6).map((s) => (
                    <ServiceCard key={s.id} service={s} canAccess={canAccess(s.plan_required)} text={text} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ══ TAB: SERVICES ══ */}
        {activeTab === "services" && (
          <section className={`${styles.card} stagger-1`}>
            <h2><Sparkles size={20} />{text.services}</h2>

            {/* Group filter tabs */}
            <div className={styles.groupTabs}>
              {availableGroups.map((g) => (
                <button
                  key={g}
                  className={`${styles.groupTab} ${selectedGroup === g ? styles.groupTabActive : ""}`}
                  onClick={() => setSelectedGroup(g)}
                >
                  {g !== "all" && <span>{groupEmoji[g]}</span>}
                  {groupLabels[g]?.[language] ?? g}
                </button>
              ))}
            </div>

            {filteredServices.length === 0 ? (
              <p className={styles.empty}>{text.noServices}</p>
            ) : (
              <div className={styles.serviceGrid}>
                {filteredServices.map((s) => (
                  <ServiceCard key={s.id} service={s} canAccess={canAccess(s.plan_required)} text={text} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══ TAB: SUBSCRIPTION ══ */}
        {activeTab === "subscription" && (
          <>
            {/* Current plan */}
            <section className={`${styles.card} stagger-1`}>
              <h2><CreditCard size={20} />{text.billing}</h2>

              <div className={styles.planGrid}>
                {(["free", "starter", "plus", "max"] as const).map((p) => {
                  const isCurrent = profile?.plan === p;
                  const isLower = planOrder[p] < planOrder[profile?.plan || "free"];
                  return (
                    <div key={p} className={`${styles.planCard} ${isCurrent ? styles.planCardActive : ""}`}>
                      <div className={styles.planCardHeader}>
                        <span className={`${styles.planLabel} ${planColors[p]}`}>{p.toUpperCase()}</span>
                        {isCurrent && <span className={styles.currentBadge}>✓ Current</span>}
                      </div>
                      <ul className={styles.planFeatures}>
                        {p === "free"    && [
                          <li key="free-1">Akses dashboard</li>,
                          <li key="free-2">Redeem voucher</li>
                        ]}
                        {p === "starter" && [
                          <li key="starter-1">Semua layanan Starter</li>,
                          <li key="starter-2">Streaming dasar</li>
                        ]}
                        {p === "plus"    && [
                          <li key="plus-1">Semua layanan Plus</li>,
                          <li key="plus-2">AI & Design tools</li>
                        ]}
                        {p === "max"     && [
                          <li key="max-1">Semua layanan Max</li>,
                          <li key="max-2">Akses penuh</li>
                        ]}
                      </ul>
                      {!isCurrent && !isLower && (
                        <button
                          className={styles.upgradeCardBtn}
                          onClick={() => setActiveTab("overview")}
                        >
                          {language === "id" ? "Redeem Voucher" : "Redeem Voucher"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Active subscription detail */}
            {subscription && (
              <section className={`${styles.card} stagger-2`}>
                <h2><ShieldCheck size={20} />{text.active}</h2>
                <div className={styles.subDetail}>
                  <div className={styles.subDetailRow}>
                    <span className={styles.subDetailLabel}>{language === "id" ? "Plan" : "Plan"}</span>
                    <span className={`${styles.subDetailValue} ${planColors[subscription.plan]}`}>{subscription.plan.toUpperCase()}</span>
                  </div>
                  <div className={styles.subDetailRow}>
                    <span className={styles.subDetailLabel}>{language === "id" ? "Mulai" : "Started"}</span>
                    <span className={styles.subDetailValue}>{new Date(subscription.starts_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}</span>
                  </div>
                  <div className={styles.subDetailRow}>
                    <span className={styles.subDetailLabel}>{text.subExpires}</span>
                    <span className={styles.subDetailValue}>{new Date(subscription.expires_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}</span>
                  </div>
                  <div className={styles.subDetailRow}>
                    <span className={styles.subDetailLabel}>{language === "id" ? "Sisa" : "Remaining"}</span>
                    <span className={`${styles.subDetailValue} ${days <= 7 ? styles.urgentDays : ""}`}>{days} {text.daysLeft}</span>
                  </div>
                  <div className={styles.progressBarLarge}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (days / 30) * 100)}%` }} />
                  </div>
                </div>
              </section>
            )}

            {/* Subscription history */}
            <section className={`${styles.card} stagger-3`}>
              <h2><History size={20} />{text.subHistory}</h2>
              {subHistory.length === 0 ? (
                <p className={styles.empty}>{text.noHistory}</p>
              ) : (
                <div className={styles.historyList}>
                  {subHistory.map((s) => {
                    const expired = new Date(s.expires_at) < new Date();
                    return (
                      <div key={s.id} className={`${styles.historyRow} ${expired ? styles.historyExpired : ""}`}>
                        <div className={styles.historyIcon}>
                          <Clock size={16} />
                        </div>
                        <div className={styles.historyInfo}>
                          <span className={`${styles.historyPlan} ${planColors[s.plan]}`}>{s.plan.toUpperCase()}</span>
                          <span className={styles.historyDate}>
                            {new Date(s.starts_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                            {" → "}
                            {new Date(s.expires_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                          </span>
                        </div>
                        <span className={`${styles.historyStatus} ${expired ? styles.historyStatusExpired : styles.historyStatusActive}`}>
                          {expired ? text.expired : text.subActive}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ── ServiceCard sub-component ────────────────────────────────
function ServiceCard({
  service: s,
  canAccess,
  text,
}: {
  service: Service;
  canAccess: boolean;
  text: Record<string, string>;
}) {
  return (
    <div className={`${styles.serviceCard} ${styles[`status_${s.status}`]}`}>
      <div className={styles.serviceHeader}>
        {s.icon_url ? (
          <Image src={s.icon_url} alt={s.name} width={36} height={36} className={styles.serviceIcon} />
        ) : (
          <div className={styles.serviceIconFallback}>
            <Globe size={18} />
          </div>
        )}
        <div className={styles.serviceHeaderText}>
          <strong>{s.name}</strong>
          {s.domain && <span className={styles.serviceDomain}>{s.domain}</span>}
        </div>
        <span className={`${styles.statusDot} ${styles[`dot_${s.status}`]}`} aria-label={s.status} />
      </div>

      {s.description && <p className={styles.serviceDesc}>{s.description}</p>}

      <div className={styles.serviceFooter}>
        <span className={`${styles.servicePlanTag} ${s.status !== "active" ? styles.servicePlanTagDim : ""}`}>
          {s.plan_required.toUpperCase()}
        </span>
        {s.status === "active" && canAccess ? (
          <Link href={`/dashboard/service/${s.slug}`} className={styles.serviceBtn}>
            {text.accessService}
          </Link>
        ) : s.status === "maintenance" ? (
          <span className={styles.serviceStatusTag}>{text.maintenance}</span>
        ) : s.status === "down" ? (
          <span className={`${styles.serviceStatusTag} ${styles.serviceStatusDown}`}>{text.down}</span>
        ) : (
          <span className={styles.serviceLocked}>
            <Lock size={12} /> {text.planRequired}: {s.plan_required.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
