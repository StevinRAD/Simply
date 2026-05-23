"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  History,
  Loader2,
  ShieldCheck,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/app/components/language";
import {
  getProfile,
  getActiveSubscription,
  getSubscriptionHistory,
  daysRemaining,
  type Profile,
  type Subscription,
} from "@/lib/supabase";
import styles from "./page.module.css";

const copy = {
  id: {
    title: "Billing & Langganan",
    back: "Kembali ke Dashboard",
    currentPlan: "Plan Saat Ini",
    active: "Aktif",
    subscribed: "Berlangganan",
    expires: "Berakhir",
    daysLeft: "hari tersisa",
    noSub: "Belum berlangganan",
    subscribedDesc: "Anda sedang berlangganan. Nikmati akses ke layanan sesuai plan Anda.",
    freeDesc: "Anda menggunakan plan gratis. Redeem voucher untuk upgrade dan akses semua layanan.",
    history: "Riwayat Langganan",
    noHistory: "Belum ada riwayat langganan.",
    plan: "Plan",
    startDate: "Mulai",
    endDate: "Berakhir",
    status: "Status",
    expired: "Kedaluwarsa",
    upgrade: "Upgrade Plan",
    upgradeDesc: "Tingkatkan plan Anda untuk akses lebih banyak layanan premium.",
    redeemVoucher: "Redeem Voucher",
    planFeatures: "Fitur Plan",
  },
  en: {
    title: "Billing & Subscription",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    active: "Active",
    subscribed: "Subscribed",
    expires: "Expires",
    daysLeft: "days left",
    noSub: "Not subscribed",
    subscribedDesc: "You are subscribed. Enjoy access to services based on your plan.",
    freeDesc: "You are on the free plan. Redeem a voucher to upgrade and access all services.",
    history: "Subscription History",
    noHistory: "No subscription history yet.",
    plan: "Plan",
    startDate: "Start Date",
    endDate: "End Date",
    status: "Status",
    expired: "Expired",
    upgrade: "Upgrade Plan",
    upgradeDesc: "Upgrade your plan to access more premium services.",
    redeemVoucher: "Redeem Voucher",
    planFeatures: "Plan Features",
  },
};

const planFeatures = {
  free: {
    id: ["Akses dashboard", "Redeem voucher", "Layanan terbatas"],
    en: ["Dashboard access", "Redeem voucher", "Limited services"],
  },
  starter: {
    id: ["Semua fitur Free", "Layanan Starter", "Streaming dasar", "Support email"],
    en: ["All Free features", "Starter services", "Basic streaming", "Email support"],
  },
  plus: {
    id: ["Semua fitur Starter", "Layanan Plus", "AI & Design tools", "Priority support"],
    en: ["All Starter features", "Plus services", "AI & Design tools", "Priority support"],
  },
  max: {
    id: ["Semua fitur Plus", "Layanan Max", "Akses penuh semua layanan", "24/7 support"],
    en: ["All Plus features", "Max services", "Full access to all services", "24/7 support"],
  },
};

export default function BillingPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) {
        router.push("/login");
        return;
      }
      setProfile(p);

      const [sub, hist] = await Promise.all([
        getActiveSubscription(),
        getSubscriptionHistory(),
      ]);
      setSubscription(sub);
      setHistory(hist);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <Loader2 size={32} className="spin" />
        </div>
      </main>
    );
  }

  const days = subscription ? daysRemaining(subscription.expires_at) : 0;
  const features = profile ? planFeatures[profile.plan][language] : [];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={18} />
          {text.back}
        </Link>

        <header className={styles.header}>
          <h1>
            <CreditCard size={28} />
            {text.title}
          </h1>
        </header>

        {/* Current Plan Card */}
        <section className={styles.card}>
          <h2>
            <ShieldCheck size={20} />
            {text.currentPlan}
          </h2>

          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <span className={`${styles.planBadge} ${styles[profile?.plan || "free"]}`}>
                {profile?.plan?.toUpperCase()}
              </span>
              {profile?.plan && profile.plan !== "free" ? (
                <span className={styles.statusBadge}>
                  <CheckCircle2 size={14} />
                  {text.subscribed}
                </span>
              ) : (
                <span className={styles.statusBadgeFree}>
                  {text.noSub}
                </span>
              )}
            </div>

            {profile?.plan && profile.plan !== "free" ? (
              /* User berlangganan (starter/plus/max) */
              <div className={styles.subInfo}>
                <p className={styles.subDesc}>{text.subscribedDesc}</p>
                {subscription && (
                  <>
                    <div className={styles.subRow}>
                      <span className={styles.label}>
                        <Calendar size={14} />
                        {text.expires}
                      </span>
                      <span className={styles.value}>
                        {new Date(subscription.expires_at).toLocaleDateString(
                          language === "id" ? "id-ID" : "en-US",
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
                      />
                    </div>
                    <p className={styles.daysLeft}>
                      {days} {text.daysLeft}
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* User FREE */
              <div className={styles.subInfo}>
                <p className={styles.noSub}>{text.freeDesc}</p>
              </div>
            )}

            <div className={styles.features}>
              <h3>{text.planFeatures}</h3>
              <ul>
                {features.map((feature, i) => (
                  <li key={i}>
                    <CheckCircle2 size={14} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.actions}>
              <Link href="/dashboard" className={styles.btnPrimary}>
                <Ticket size={16} />
                {text.redeemVoucher}
              </Link>
              {profile?.plan !== "max" && (
                <button className={styles.btnSecondary}>
                  <TrendingUp size={16} />
                  {text.upgrade}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Subscription History */}
        <section className={styles.card}>
          <h2>
            <History size={20} />
            {text.history}
          </h2>

          {history.length === 0 ? (
            <p className={styles.empty}>{text.noHistory}</p>
          ) : (
            <div className={styles.historyList}>
              {history.map((sub) => {
                const expired = new Date(sub.expires_at) < new Date();
                return (
                  <div key={sub.id} className={`${styles.historyRow} ${expired ? styles.expired : ""}`}>
                    <span className={`${styles.historyPlan} ${styles[sub.plan]}`}>
                      {sub.plan.toUpperCase()}
                    </span>
                    <div className={styles.historyDates}>
                      <span>
                        {new Date(sub.starts_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                      </span>
                      <span>→</span>
                      <span>
                        {new Date(sub.expires_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US")}
                      </span>
                    </div>
                    <span className={`${styles.historyStatus} ${expired ? styles.statusExpired : styles.statusActive}`}>
                      {expired ? text.expired : text.active}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
