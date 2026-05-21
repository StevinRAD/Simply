"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CreditCard,
  Download,
  Flag,
  History,
  PenSquare,
  Settings,
  UserRound,
} from "lucide-react";
import {
  LanguageSwitcher,
  useLanguage,
  type Language,
} from "../../components/language";
import styles from "./page.module.css";

type Localized = {
  id: string;
  en: string;
};

type ToolPageConfig = {
  title: Localized;
  description: Localized;
  status: Localized;
  tips: Localized[];
  primaryLabel: Localized;
  icon:
    | "billing"
    | "history"
    | "profile"
    | "settings"
    | "flag"
    | "download"
    | "discord"
    | "notifications";
};

const toolPages: Record<string, ToolPageConfig> = {
  billing: {
    title: { id: "Pusat Billing", en: "Billing Center" },
    description: {
      id: "Kelola metode pembayaran, perpanjangan, dan upgrade plan Simply dari satu halaman.",
      en: "Manage payment methods, renewals, and Simply plan upgrades from a single page.",
    },
    status: { id: "Siap untuk integrasi pembayaran", en: "Ready for payment integration" },
    tips: [
      {
        id: "Hubungkan ke payment gateway (misalnya Midtrans/Tripay).",
        en: "Connect to a payment gateway (for example Midtrans/Tripay).",
      },
      {
        id: "Sinkronkan status plan user ke database Supabase.",
        en: "Sync user plan status to your Supabase database.",
      },
      {
        id: "Aktifkan webhook untuk update status transaksi otomatis.",
        en: "Enable webhooks for automatic transaction status updates.",
      },
    ],
    primaryLabel: { id: "Buka Ringkasan Plan", en: "Go to Plan Overview" },
    icon: "billing",
  },
  orders: {
    title: { id: "Riwayat Pesanan", en: "Order History" },
    description: {
      id: "Daftar transaksi premium user akan tampil di sini setelah integrasi backend aktif.",
      en: "User premium transactions will appear here once backend integration is active.",
    },
    status: { id: "Siap untuk daftar transaksi", en: "Ready for transaction list" },
    tips: [
      {
        id: "Tampilkan nomor pesanan, tanggal, nominal, dan status.",
        en: "Display order number, date, amount, and status.",
      },
      {
        id: "Tambahkan filter status dan rentang tanggal.",
        en: "Add filters for status and date range.",
      },
      {
        id: "Sediakan detail invoice untuk setiap transaksi.",
        en: "Provide invoice details for each transaction.",
      },
    ],
    primaryLabel: { id: "Buka Pusat Billing", en: "Open Billing Center" },
    icon: "history",
  },
  "report-service": {
    title: { id: "Lapor Layanan", en: "Report Service" },
    description: {
      id: "Laporkan kendala layanan premium agar tim support bisa langsung menindaklanjuti.",
      en: "Report premium service issues so the support team can follow up immediately.",
    },
    status: { id: "Siap untuk form support", en: "Ready for support form" },
    tips: [
      {
        id: "Tambahkan form: nama layanan, jenis masalah, detail kendala.",
        en: "Add a form with service name, issue type, and issue details.",
      },
      {
        id: "Simpan tiket ke database Supabase.",
        en: "Save tickets to the Supabase database.",
      },
      {
        id: "Kirim notifikasi ke Discord internal support.",
        en: "Send notifications to internal support Discord.",
      },
    ],
    primaryLabel: { id: "Lihat Log Aktivitas", en: "View Activity Logs" },
    icon: "flag",
  },
  settings: {
    title: { id: "Pengaturan Akun", en: "Account Settings" },
    description: {
      id: "Pengaturan akun seperti keamanan, preferensi notifikasi, dan manajemen sesi login.",
      en: "Account settings such as security, notification preferences, and login session management.",
    },
    status: {
      id: "Siap untuk preferensi akun",
      en: "Ready for account preferences",
    },
    tips: [
      {
        id: "Tambahkan update password dan setup 2FA.",
        en: "Add password update and 2FA setup.",
      },
      {
        id: "Sediakan daftar sesi login aktif.",
        en: "Provide a list of active login sessions.",
      },
      {
        id: "Tambahkan opsi notifikasi email.",
        en: "Add email notification options.",
      },
    ],
    primaryLabel: { id: "Edit Profil", en: "Edit Profile" },
    icon: "settings",
  },
  profile: {
    title: { id: "Edit Profil", en: "Edit Profile" },
    description: {
      id: "Perbarui nama, avatar, dan informasi dasar profil akun Simply kamu.",
      en: "Update your Simply account name, avatar, and basic profile information.",
    },
    status: { id: "Siap untuk form profil", en: "Ready for profile form" },
    tips: [
      {
        id: "Hubungkan form ke tabel profiles di Supabase.",
        en: "Connect the form to the `profiles` table in Supabase.",
      },
      {
        id: "Tambahkan upload avatar ke storage bucket.",
        en: "Add avatar uploads to a storage bucket.",
      },
      {
        id: "Validasi username agar tetap unik.",
        en: "Validate usernames to keep them unique.",
      },
    ],
    primaryLabel: { id: "Buka Pengaturan", en: "Open Settings" },
    icon: "profile",
  },
  "activity-logs": {
    title: { id: "Log Aktivitas", en: "Activity Logs" },
    description: {
      id: "Pantau jejak aktivitas penting akun seperti login, logout, dan update data.",
      en: "Track important account activities such as login, logout, and profile updates.",
    },
    status: { id: "Siap untuk timeline audit", en: "Ready for audit timeline" },
    tips: [
      {
        id: "Simpan event auth dan billing secara terstruktur.",
        en: "Store auth and billing events in a structured format.",
      },
      {
        id: "Tampilkan timestamp dan info device.",
        en: "Display timestamps and device information.",
      },
      {
        id: "Tambahkan export ke CSV jika dibutuhkan.",
        en: "Add CSV export if needed.",
      },
    ],
    primaryLabel: { id: "Kembali ke Dashboard", en: "Back to Dashboard" },
    icon: "history",
  },
  discord: {
    title: { id: "Koneksi Discord", en: "Discord Connection" },
    description: {
      id: "Hubungkan akun Discord untuk update status layanan dan support lebih cepat.",
      en: "Connect your Discord account for faster service updates and support.",
    },
    status: { id: "Siap untuk koneksi OAuth", en: "Ready for OAuth connection" },
    tips: [
      {
        id: "Tambahkan callback OAuth Discord.",
        en: "Add a Discord OAuth callback.",
      },
      {
        id: "Simpan Discord ID ke profil user.",
        en: "Save the Discord ID to the user profile.",
      },
      {
        id: "Sediakan tombol unlink account.",
        en: "Provide an unlink account button.",
      },
    ],
    primaryLabel: { id: "Kembali ke Dashboard", en: "Back to Dashboard" },
    icon: "discord",
  },
  plan: {
    title: { id: "Ringkasan Plan", en: "Plan Overview" },
    description: {
      id: "Lihat detail semua plan dan kelola upgrade/downgrade akun premium Simply.",
      en: "View all plan details and manage Simply premium account upgrades/downgrades.",
    },
    status: { id: "Siap untuk manajemen plan", en: "Ready for plan management" },
    tips: [
      {
        id: "Tampilkan perbandingan fitur antar plan.",
        en: "Display feature comparison across plans.",
      },
      {
        id: "Sediakan konfirmasi sebelum upgrade.",
        en: "Provide confirmation before upgrading.",
      },
      {
        id: "Sinkronkan masa aktif setelah pembayaran berhasil.",
        en: "Sync validity period after successful payment.",
      },
    ],
    primaryLabel: { id: "Buka Pusat Billing", en: "Open Billing Center" },
    icon: "billing",
  },
  notifications: {
    title: { id: "Notifikasi", en: "Notifications" },
    description: {
      id: "Pusat notifikasi untuk update perpanjangan plan, status layanan, dan respons support.",
      en: "Notification center for plan renewal updates, service status, and support responses.",
    },
    status: { id: "Siap untuk feed notifikasi", en: "Ready for notification feed" },
    tips: [
      {
        id: "Ambil data notifikasi berdasarkan user.",
        en: "Fetch notifications per user.",
      },
      {
        id: "Tambahkan mark as read/unread.",
        en: "Add mark as read/unread actions.",
      },
      {
        id: "Hubungkan notifikasi penting ke email.",
        en: "Route important notifications to email.",
      },
    ],
    primaryLabel: { id: "Kembali ke Dashboard", en: "Back to Dashboard" },
    icon: "notifications",
  },
  "extensions/guard": {
    title: { id: "Simply Guard Extension", en: "Simply Guard Extension" },
    description: {
      id: "Halaman rilis untuk ekstensi Simply Guard yang saat ini masih dalam antrean rilis.",
      en: "Release page for the Simply Guard extension, currently still in the release queue.",
    },
    status: { id: "Menunggu rilis", en: "Pending release" },
    tips: [
      {
        id: "Tampilkan changelog versi terbaru.",
        en: "Display the latest version changelog.",
      },
      {
        id: "Sediakan tombol download per browser.",
        en: "Provide per-browser download buttons.",
      },
      {
        id: "Tambahkan video instalasi khusus Guard.",
        en: "Add a Guard-specific installation video.",
      },
    ],
    primaryLabel: { id: "Kembali ke Dashboard", en: "Back to Dashboard" },
    icon: "download",
  },
  "extensions/main": {
    title: { id: "Simply Main Extension", en: "Simply Main Extension" },
    description: {
      id: "Halaman rilis untuk ekstensi utama Simply. Saat ini status masih coming soon.",
      en: "Release page for the main Simply extension. Current status is coming soon.",
    },
    status: { id: "Menunggu rilis", en: "Pending release" },
    tips: [
      {
        id: "Sediakan file extension berdasarkan platform.",
        en: "Provide extension files based on platform.",
      },
      {
        id: "Tambahkan panduan instalasi langkah demi langkah.",
        en: "Add step-by-step installation guidance.",
      },
      {
        id: "Hubungkan versi extension dengan status plan akun.",
        en: "Map extension versions to account plan status.",
      },
    ],
    primaryLabel: { id: "Kembali ke Dashboard", en: "Back to Dashboard" },
    icon: "download",
  },
};

const uiCopy: Record<
  Language,
  {
    backToDashboard: string;
    dashboardLabel: string;
    implementationNotes: string;
    dashboardHome: string;
  }
> = {
  id: {
    backToDashboard: "Kembali ke Dashboard",
    dashboardLabel: "Dashboard Simply",
    implementationNotes: "Catatan Implementasi",
    dashboardHome: "Beranda Dashboard",
  },
  en: {
    backToDashboard: "Back to Dashboard",
    dashboardLabel: "Simply Dashboard",
    implementationNotes: "Implementation Notes",
    dashboardHome: "Dashboard Home",
  },
};

function iconFor(name: ToolPageConfig["icon"]) {
  if (name === "billing") return <CreditCard size={18} aria-hidden="true" />;
  if (name === "history") return <History size={18} aria-hidden="true" />;
  if (name === "profile") return <PenSquare size={18} aria-hidden="true" />;
  if (name === "settings") return <Settings size={18} aria-hidden="true" />;
  if (name === "flag") return <Flag size={18} aria-hidden="true" />;
  if (name === "download") return <Download size={18} aria-hidden="true" />;
  if (name === "discord") return <UserRound size={18} aria-hidden="true" />;
  return <Bell size={18} aria-hidden="true" />;
}

function getPrimaryHref(slugKey: string) {
  if (slugKey === "billing" || slugKey === "orders" || slugKey === "plan") {
    return "/dashboard/billing";
  }
  if (slugKey === "settings") return "/dashboard/settings";
  if (slugKey === "profile") return "/dashboard/profile";
  if (slugKey === "report-service") return "/dashboard/activity-logs";
  return "/dashboard";
}

export default function DashboardToolPageClient({ slugKey }: { slugKey: string }) {
  const { language } = useLanguage();
  const config = toolPages[slugKey];
  const text = uiCopy[language];

  if (!config) return null;

  const primaryHref = getPrimaryHref(slugKey);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/dashboard" className={styles.backButton}>
            <ArrowLeft size={16} aria-hidden="true" />
            {text.backToDashboard}
          </Link>
          <div className={styles.headerRight}>
            <p>{text.dashboardLabel}</p>
            <LanguageSwitcher />
          </div>
        </header>

        <section className={styles.card}>
          <div className={styles.iconShell}>{iconFor(config.icon)}</div>
          <h1>{config.title[language]}</h1>
          <p className={styles.description}>{config.description[language]}</p>
          <span className={styles.status}>{config.status[language]}</span>

          <div className={styles.tips}>
            <h2>{text.implementationNotes}</h2>
            <ul>
              {config.tips.map((tip, index) => (
                <li key={`${slugKey}-tip-${index}`}>{tip[language]}</li>
              ))}
            </ul>
          </div>

          <div className={styles.actions}>
            <Link href={primaryHref} className={styles.primaryButton}>
              {config.primaryLabel[language]}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/dashboard" className={styles.secondaryButton}>
              {text.dashboardHome}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
