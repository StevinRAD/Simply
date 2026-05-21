"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Package,
  Ticket,
} from "lucide-react";
import { useLanguage } from "@/app/components/language";
import {
  getProfile,
  getSubscriptionHistory,
  type Profile,
  type Subscription,
} from "@/lib/supabase";
import styles from "./page.module.css";

const copy = {
  id: {
    title: "Riwayat Order",
    back: "Kembali ke Dashboard",
    subtitle: "Semua riwayat langganan dan voucher yang telah Anda gunakan",
    plan: "Plan",
    startDate: "Mulai",
    endDate: "Berakhir",
    duration: "Durasi",
    status: "Status",
    active: "Aktif",
    expired: "Kedaluwarsa",
    days: "hari",
    noOrders: "Belum ada riwayat order.",
    noOrdersDesc: "Redeem voucher untuk mulai menggunakan layanan premium.",
    redeemNow: "Redeem Voucher",
    orderDetails: "Detail Order",
    voucherId: "ID Voucher",
  },
  en: {
    title: "Order History",
    back: "Back to Dashboard",
    subtitle: "All your subscription history and redeemed vouchers",
    plan: "Plan",
    startDate: "Start Date",
    endDate: "End Date",
    duration: "Duration",
    status: "Status",
    active: "Active",
    expired: "Expired",
    days: "days",
    noOrders: "No order history yet.",
    noOrdersDesc: "Redeem a voucher to start using premium services.",
    redeemNow: "Redeem Voucher",
    orderDetails: "Order Details",
    voucherId: "Voucher ID",
  },
};

export default function OrdersPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) {
        router.push("/login");
        return;
      }
      setProfile(p);

      const history = await getSubscriptionHistory();
      setOrders(history);
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
              <History size={28} />
              {text.title}
            </h1>
            <p className={styles.subtitle}>{text.subtitle}</p>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Package size={64} />
            </div>
            <h2>{text.noOrders}</h2>
            <p>{text.noOrdersDesc}</p>
            <Link href="/dashboard" className={styles.btnPrimary}>
              <Ticket size={16} />
              {text.redeemNow}
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => {
              const expired = new Date(order.expires_at) < new Date();
              const startDate = new Date(order.starts_at);
              const endDate = new Date(order.expires_at);
              const durationDays = Math.ceil(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={order.id} className={`${styles.orderCard} ${expired ? styles.expired : ""}`}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderPlan}>
                      <span className={`${styles.planBadge} ${styles[order.plan]}`}>
                        {order.plan.toUpperCase()}
                      </span>
                      <span className={`${styles.statusBadge} ${expired ? styles.statusExpired : styles.statusActive}`}>
                        {expired ? (
                          <>
                            <Clock size={14} />
                            {text.expired}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            {text.active}
                          </>
                        )}
                      </span>
                    </div>
                    <span className={styles.orderDate}>
                      <Calendar size={14} />
                      {startDate.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className={styles.orderBody}>
                    <div className={styles.orderRow}>
                      <span className={styles.label}>{text.startDate}</span>
                      <span className={styles.value}>
                        {startDate.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className={styles.orderRow}>
                      <span className={styles.label}>{text.endDate}</span>
                      <span className={styles.value}>
                        {endDate.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className={styles.orderRow}>
                      <span className={styles.label}>{text.duration}</span>
                      <span className={styles.value}>
                        {durationDays} {text.days}
                      </span>
                    </div>
                    {order.voucher_id && (
                      <div className={styles.orderRow}>
                        <span className={styles.label}>{text.voucherId}</span>
                        <code className={styles.voucherCode}>{order.voucher_id.slice(0, 8)}...</code>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
