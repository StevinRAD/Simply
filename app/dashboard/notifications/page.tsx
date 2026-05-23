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
  Megaphone,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useLanguage } from "@/app/components/language";
import {
  getProfile,
  getActiveSubscription,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  daysRemaining,
  type Profile,
  type Subscription,
  type AppNotification,
} from "@/lib/supabase";
import styles from "./page.module.css";

const copy = {
  id: {
    title: "Notifikasi",
    back: "Kembali ke Dashboard",
    subtitle: "Semua notifikasi dan pembaruan penting",
    markAllRead: "Tandai Semua Dibaca",
    noNotifications: "Tidak ada notifikasi",
    noNotificationsDesc: "Anda akan menerima notifikasi di sini ketika ada pembaruan layanan, maintenance, atau pengumuman.",
    today: "Hari Ini",
    earlier: "Sebelumnya",
    newService: "Layanan Baru",
    maintenance: "Maintenance",
    announcement: "Pengumuman",
    unread: "Belum dibaca",
    read: "Sudah dibaca",
    subExpiring: "Langganan Akan Berakhir",
    subExpiringMsg: "Langganan Anda akan berakhir dalam",
    days: "hari",
    subExpired: "Langganan Berakhir Hari Ini",
    subExpiredMsg: "Langganan Anda berakhir hari ini. Redeem voucher untuk memperpanjang.",
    welcome: "Selamat Datang di Simply!",
    welcomeMsg: "Redeem voucher untuk mengaktifkan langganan dan akses semua layanan premium.",
  },
  en: {
    title: "Notifications",
    back: "Back to Dashboard",
    subtitle: "All your important notifications and updates",
    markAllRead: "Mark All as Read",
    noNotifications: "No notifications",
    noNotificationsDesc: "You'll receive notifications here when there are service updates, maintenance, or announcements.",
    today: "Today",
    earlier: "Earlier",
    newService: "New Service",
    maintenance: "Maintenance",
    announcement: "Announcement",
    unread: "Unread",
    read: "Read",
    subExpiring: "Subscription Expiring Soon",
    subExpiringMsg: "Your subscription will expire in",
    days: "days",
    subExpired: "Subscription Expires Today",
    subExpiredMsg: "Your subscription expires today. Redeem a voucher to extend.",
    welcome: "Welcome to Simply!",
    welcomeMsg: "Redeem a voucher to activate your subscription and access all premium services.",
  },
};

export default function NotificationsPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [localNotifs, setLocalNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) {
        router.push("/login");
        return;
      }
      setProfile(p);

      const [sub, dbNotifs] = await Promise.all([
        getActiveSubscription(),
        getNotifications(),
      ]);
      setSubscription(sub);
      setNotifications(dbNotifs);

      // Notifikasi lokal berdasarkan status subscription
      const local: AppNotification[] = [];

      if (sub) {
        const days = daysRemaining(sub.expires_at);
        if (days <= 7 && days > 0) {
          local.push({
            id: "sub-expiring",
            type: "warning",
            title: text.subExpiring,
            message: `${text.subExpiringMsg} ${days} ${text.days}.`,
            target: "subscribed",
            created_by: null,
            created_at: new Date().toISOString(),
            is_read: false,
          });
        } else if (days === 0) {
          local.push({
            id: "sub-expired-today",
            type: "error",
            title: text.subExpired,
            message: text.subExpiredMsg,
            target: "subscribed",
            created_by: null,
            created_at: new Date().toISOString(),
            is_read: false,
          });
        }
      }

      if (p.plan === "free") {
        local.push({
          id: "welcome",
          type: "info",
          title: text.welcome,
          message: text.welcomeMsg,
          target: "free",
          created_by: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          is_read: false,
        });
      }

      setLocalNotifs(local);
      setLoading(false);
    }
    load();
  }, [router, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const allNotifs = [...localNotifs, ...notifications];
  const unreadCount = allNotifs.filter((n) => !n.is_read).length;

  async function handleMarkAllRead() {
    // Tandai semua DB notifs sebagai dibaca
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleMarkRead(id: string) {
    // Cek apakah ini notif lokal atau DB
    const isLocal = localNotifs.some((n) => n.id === id);
    if (isLocal) {
      setLocalNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } else {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <Loader2 size={32} className="spin" />
        </div>
      </main>
    );
  }

  const getIcon = (type: AppNotification["type"], title: string) => {
    if (title.toLowerCase().includes("maintenance") || title.toLowerCase().includes("perbaikan")) {
      return <Wrench size={20} />;
    }
    if (title.toLowerCase().includes("baru") || title.toLowerCase().includes("new")) {
      return <Sparkles size={20} />;
    }
    if (title.toLowerCase().includes("pengumuman") || title.toLowerCase().includes("announcement")) {
      return <Megaphone size={20} />;
    }
    if (title.toLowerCase().includes("pengaturan") || title.toLowerCase().includes("settings")) {
      return <Settings size={20} />;
    }
    switch (type) {
      case "success": return <CheckCircle2 size={20} />;
      case "warning": return <AlertCircle size={20} />;
      case "error":   return <AlertCircle size={20} />;
      default:        return <Info size={20} />;
    }
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  };

  const todayNotifs   = allNotifs.filter((n) => isToday(n.created_at));
  const earlierNotifs = allNotifs.filter((n) => !isToday(n.created_at));

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
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount}</span>
              )}
            </h1>
            <p className={styles.subtitle}>{text.subtitle}</p>
          </div>
          {allNotifs.length > 0 && unreadCount > 0 && (
            <div className={styles.actions}>
              <button onClick={handleMarkAllRead} className={styles.btnSecondary}>
                <CheckCircle2 size={16} />
                {text.markAllRead}
              </button>
            </div>
          )}
        </header>

        {allNotifs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bell size={64} />
            </div>
            <h2>{text.noNotifications}</h2>
            <p>{text.noNotificationsDesc}</p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {todayNotifs.length > 0 && (
              <>
                <div className={styles.sectionLabel}>{text.today}</div>
                {todayNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    className={`${styles.notificationCard} ${styles[notif.type]} ${notif.is_read ? styles.read : ""}`}
                    onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && !notif.is_read && handleMarkRead(notif.id)}
                  >
                    <div className={styles.notifIcon}>{getIcon(notif.type, notif.title)}</div>
                    <div className={styles.notifContent}>
                      <div className={styles.notifTitleRow}>
                        <h3>{notif.title}</h3>
                        {!notif.is_read && <span className={styles.unreadDot} />}
                      </div>
                      <p>{notif.message}</p>
                      <span className={styles.timestamp}>
                        <Clock size={12} />
                        {new Date(notif.created_at).toLocaleString(language === "id" ? "id-ID" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {earlierNotifs.length > 0 && (
              <>
                <div className={styles.sectionLabel}>{text.earlier}</div>
                {earlierNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    className={`${styles.notificationCard} ${styles[notif.type]} ${notif.is_read ? styles.read : ""}`}
                    onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && !notif.is_read && handleMarkRead(notif.id)}
                  >
                    <div className={styles.notifIcon}>{getIcon(notif.type, notif.title)}</div>
                    <div className={styles.notifContent}>
                      <div className={styles.notifTitleRow}>
                        <h3>{notif.title}</h3>
                        {!notif.is_read && <span className={styles.unreadDot} />}
                      </div>
                      <p>{notif.message}</p>
                      <span className={styles.timestamp}>
                        <Clock size={12} />
                        {new Date(notif.created_at).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
