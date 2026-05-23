"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/app/components/language";
import {
  getProfile,
  getActiveSubscription,
  daysRemaining,
  type Profile,
  type Subscription,
} from "@/lib/supabase";
import styles from "./page.module.css";

const copy = {
  id: {
    title: "Ringkasan Plan",
    back: "Kembali ke Dashboard",
    subtitle: "Pilih plan yang sesuai dengan kebutuhan Anda",
    currentPlan: "Plan Anda Saat Ini",
    daysLeft: "hari tersisa",
    comparePlans: "Bandingkan Plan",
    features: "Fitur",
    redeemVoucher: "Upgrade Plan",
    popular: "Populer",
    current: "Plan Saat Ini",
    subscribed: "Berlangganan",
    notSubscribed: "Belum Berlangganan",
    subscribedDesc: "Anda sedang berlangganan. Nikmati akses ke layanan sesuai plan Anda.",
    notSubscribedDesc: "Anda menggunakan plan gratis. Gunakan voucher di Dashboard untuk mengaktifkan langganan.",
    freeNote: "Plan Free tidak dapat mengakses layanan apapun.",
    paidNote: "Plan berbayar memberikan akses ke layanan sesuai level plan Anda.",
  },
  en: {
    title: "Plan Overview",
    back: "Back to Dashboard",
    subtitle: "Choose the plan that fits your needs",
    currentPlan: "Your Current Plan",
    daysLeft: "days left",
    comparePlans: "Compare Plans",
    features: "Features",
    redeemVoucher: "Upgrade Plan",
    popular: "Popular",
    current: "Current Plan",
    subscribed: "Subscribed",
    notSubscribed: "Not Subscribed",
    subscribedDesc: "You are subscribed. Enjoy access to services based on your plan.",
    notSubscribedDesc: "You are on the free plan. Use a voucher on the Dashboard to activate your subscription.",
    freeNote: "Free plan cannot access any services.",
    paidNote: "Paid plans give you access to services based on your plan level.",
  },
};

const planData = {
  free: {
    name: "Free",
    icon: Zap,
    color: "#718096",
    features: {
      id: ["Akses dashboard", "Redeem voucher", "Layanan terbatas", "Support email"],
      en: ["Dashboard access", "Redeem voucher", "Limited services", "Email support"],
    },
  },
  starter: {
    name: "Starter",
    icon: Sparkles,
    color: "#3182ce",
    features: {
      id: ["Semua fitur Free", "Layanan Starter", "Streaming dasar", "10+ layanan", "Priority support"],
      en: ["All Free features", "Starter services", "Basic streaming", "10+ services", "Priority support"],
    },
  },
  plus: {
    name: "Plus",
    icon: TrendingUp,
    color: "#38a169",
    features: {
      id: ["Semua fitur Starter", "Layanan Plus", "AI & Design tools", "25+ layanan", "Priority support"],
      en: ["All Starter features", "Plus services", "AI & Design tools", "25+ services", "Priority support"],
    },
  },
  max: {
    name: "Max",
    icon: Crown,
    color: "#e53e3e",
    features: {
      id: ["Semua fitur Plus", "Layanan Max", "Akses penuh", "50+ layanan", "24/7 VIP support"],
      en: ["All Plus features", "Max services", "Full access", "50+ services", "24/7 VIP support"],
    },
  },
};

export default function PlanPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) {
        router.push("/login");
        return;
      }
      setProfile(p);

      const sub = await getActiveSubscription();
      setSubscription(sub);
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
  const currentPlan = profile?.plan || "free";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.backLink}>
          <ArrowLeft size={18} />
          {text.back}
        </Link>

        <header className={styles.header}>
          <div>
            <h1>
              <Crown size={28} />
              {text.title}
            </h1>
            <p className={styles.subtitle}>{text.subtitle}</p>
          </div>
        </header>

        {/* Current Plan Summary */}
        <section className={styles.currentPlanCard}>
          <h2>{text.currentPlan}</h2>
          <div className={styles.planSummary}>
            <div className={styles.planInfo}>
              <span className={`${styles.planBadge} ${styles[currentPlan]}`}>
                {planData[currentPlan as keyof typeof planData].name.toUpperCase()}
              </span>
              {/* Status berlangganan */}
              {currentPlan !== "free" ? (
                <span className={styles.subStatusBadge}>
                  ✓ {text.subscribed}
                </span>
              ) : (
                <span className={styles.subStatusBadgeFree}>
                  {text.notSubscribed}
                </span>
              )}
              {subscription && (
                <p className={styles.expiryInfo}>
                  {days} {text.daysLeft}
                </p>
              )}
            </div>
          </div>
          {/* Penjelasan status */}
          <div className={currentPlan !== "free" ? styles.planInfoBoxSubscribed : styles.planInfoBoxFree}>
            {currentPlan !== "free" ? text.subscribedDesc : text.notSubscribedDesc}
          </div>
        </section>

        {/* Plans Comparison */}
        <section className={styles.plansSection}>
          <h2>{text.comparePlans}</h2>
          <div className={styles.plansGrid}>
            {(Object.keys(planData) as Array<keyof typeof planData>).map((planKey) => {
              const plan = planData[planKey];
              const Icon = plan.icon;
              const isCurrent = currentPlan === planKey;
              const isPopular = planKey === "plus";

              return (
                <div
                  key={planKey}
                  className={`${styles.planCard} ${isCurrent ? styles.planCardCurrent : ""}`}
                  style={{ borderColor: plan.color }}
                >
                  {isPopular && !isCurrent && (
                    <div className={styles.popularBadge}>{text.popular}</div>
                  )}
                  {isCurrent && (
                    <div className={styles.currentBadge}>{text.current}</div>
                  )}

                  <div className={styles.planCardHeader}>
                    <div className={styles.planIcon} style={{ background: plan.color }}>
                      <Icon size={24} />
                    </div>
                    <h3>{plan.name}</h3>
                  </div>

                  <ul className={styles.featuresList}>
                    {plan.features[language].map((feature, i) => (
                      <li key={i}>
                        <Check size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
