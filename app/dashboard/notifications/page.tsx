"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Trash2,
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
    title: "Notifikasi",
    back: "Kembali ke Dashboard",
    subtitle: "Semua notifikasi dan pembaruan penting",
    markAllRead: "Tandai Semua Dibaca",
    clearAll: "Hapus Semua",
    noNotifications: "Tidak ada notifikasi",
    noNotificationsDesc: "Anda akan menerima notifikasi di sini ketika ada pembaruan.",
    today: "Hari Ini",
    earlier: "Sebelumnya",
  },
  en: {
    title: "Notifications",
    back: "Back to Dashboard",
    subtitle: "All your important notifications and updates",
    markAllRead: "Mark All as Read",
    clearAll: "Clear All",
    noNotifications: "No notifications",
    noNotificationsDesc: "You'll receive notifications here when there are updates.",
    today: "Today",
    earlier: "Earlier",
  },
};

type Notification = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

export default function NotificationsPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

      // Generate notifications based on subscription status
      const notifs: Notification[] = [];

      if (sub) {
        const days = daysRemaining(sub.expires_at);
        if (days <= 7 && days > 0) {
          notifs.push({
            id: "sub-expiring",
            type: "warning",
            title: language === "id" ? "Langganan Akan Berakhir" : "Subscription Expiring Soon",
            message:
              language === "id"
                ? `Langganan ${sub.plan.toUpperCase()} Anda akan berakhir dalam ${days} hari.`
                : `Your ${sub.plan.toUpperCase()} subscription will expire in ${days} days.`,
            timestamp: new Date(),
            read: false,
          });
        } else if (days === 0) {
          notifs.push({
            id: "sub-expired",
            type: "error",
            title: language === "id" ? "Langganan Berakhir Hari Ini" : "Subscription Expires Today",
            message:
              language === "id"
                ? "Langganan Anda akan berakhir hari ini. Redeem voucher untuk memperpanjang."
                : "Your subscription expires today. Redeem a voucher to extend.",
            timestamp: new Date(),
            read: false,
          });
        }
      }

      // Welcome notification for new users
      if (p.plan === "free") {
        notifs.push({
          id: "welcome",
          type: "info",
          title: language === "id" ? "Selamat Datang di Simply!" : "Welcome to Simply!",
          message:
            language === "id"
              ? "Redeem voucher untuk mengakses layanan premium."
              : "Redeem a voucher to access premium services.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          read: false,
        });
      }

      setNotifications(notifs);
      setLoading(false);
    }
    load();
  }, [router, language]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <Loader2 size={32} className="spin" />
        </div>
      </main>
    );
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={20} />;
      case "warning":
        return <AlertCircle size={20} />;
      case "error":
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

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
              <Bell size={28} />
              {text.title}
            </h1>
            <p className={styles.subtitle}>{text.subtitle}</p>
          </div>
          {notifications.length > 0 && (
            <div className={styles.actions}>
              <button onClick={markAllRead} className={styles.btnSecondary}>
                <CheckCircle2 size={16} />
                {text.markAllRead}
              </button>
              <button onClick={clearAll} className={styles.btnDanger}>
                <Trash2 size={16} />
                {text.clearAll}
              </button>
            </div>
          )}
        </header>

        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bell size={64} />
            </div>
            <h2>{text.noNotifications}</h2>
            <p>{text.noNotificationsDesc}</p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`${styles.notificationCard} ${styles[notif.type]} ${
                  notif.read ? styles.read : ""
                }`}
              >
                <div className={styles.notifIcon}>{getIcon(notif.type)}</div>
                <div className={styles.notifContent}>
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  <span className={styles.timestamp}>
                    <Clock size={12} />
                    {notif.timestamp.toLocaleString(language === "id" ? "id-ID" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className={styles.deleteBtn}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
