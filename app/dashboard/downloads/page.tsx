"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import styles from "./page.module.css";

// URL GitHub repository Simply
const GITHUB_REPO = "https://github.com/StevinRAD/Simply";

// URL download langsung file ZIP extension dari GitHub (raw)
const EXTENSION_DOWNLOAD_URLS = {
  guard: `${GITHUB_REPO}/raw/refs/heads/master/extensions/guard.zip`,
  main: `${GITHUB_REPO}/raw/refs/heads/master/extensions/main.zip`,
};

export default function DownloadsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) {
        router.push("/login");
        return;
      }
      setProfile(p);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Memuat...</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Kembali ke Dashboard
          </Link>
          <h1 className={styles.title}>Download Extension</h1>
          <p className={styles.subtitle}>
            Install Simply Extension untuk akses mudah ke semua service Anda
          </p>
        </header>

        {/* Extension Cards */}
        <div className={styles.extensionsGrid}>
          {/* Guard Extension */}
          <section className={`${styles.card} ${styles.guardCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🛡️</div>
              <div>
                <h2 className={styles.cardTitle}>Simply Guard</h2>
                <p className={styles.cardBadge}>Wajib Install Pertama</p>
              </div>
            </div>

            <p className={styles.cardDescription}>
              Extension keamanan yang melindungi akun Anda dari akses tidak sah dan memblokir extension berbahaya.
            </p>

            <div className={styles.features}>
              <h3 className={styles.featuresTitle}>Fitur:</h3>
              <ul className={styles.featuresList}>
                <li>🔒 Blokir halaman account & billing Netflix</li>
                <li>🚫 Deteksi & disable cookie editor extension</li>
                <li>🛡️ Proteksi otomatis saat browsing</li>
                <li>⚡ Ringan & tidak mengganggu</li>
                <li>🔐 Data terenkripsi AES-GCM 256-bit</li>
              </ul>
            </div>

            <div className={styles.cardActions}>
              <a
                href={EXTENSION_DOWNLOAD_URLS.guard}
                className={`${styles.btn} ${styles.btnPrimary}`}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                📥 Download Guard
              </a>
              <span className={styles.version}>v1.0.0</span>
            </div>
          </section>

          {/* Main Extension */}
          <section className={`${styles.card} ${styles.mainCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🚀</div>
              <div>
                <h2 className={styles.cardTitle}>Simply Main</h2>
                <p className={styles.cardBadge}>Extension Utama</p>
              </div>
            </div>

            <p className={styles.cardDescription}>
              Extension utama untuk mengakses semua service dengan satu klik. Auto-login tanpa perlu input password.
            </p>

            <div className={styles.features}>
              <h3 className={styles.featuresTitle}>Fitur:</h3>
              <ul className={styles.featuresList}>
                <li>⚡ Akses service dengan 1 klik</li>
                <li>🔐 Auto-login dengan cookie injection</li>
                <li>📱 Popup UI yang modern & mudah</li>
                <li>🔄 Sync otomatis dengan dashboard</li>
                <li>🔒 Data terenkripsi AES-GCM 256-bit</li>
              </ul>
            </div>

            <div className={styles.cardActions}>
              <a
                href={EXTENSION_DOWNLOAD_URLS.main}
                className={`${styles.btn} ${styles.btnPrimary}`}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                📥 Download Main
              </a>
              <span className={styles.version}>v1.0.0</span>
            </div>
          </section>
        </div>


        {/* Installation Instructions */}
        <section className={styles.instructions}>
          <h2 className={styles.sectionTitle}>📖 Cara Instalasi</h2>

          <div className={styles.stepsContainer}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Download Extension</h3>
                <p>Klik tombol download di atas. File ZIP berisi seluruh source code Simply akan terunduh.</p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Extract File ZIP</h3>
                <p>Extract file ZIP yang sudah didownload. Di dalamnya terdapat folder <code>extensions/guard</code> dan <code>extensions/main</code>.</p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Buka Chrome Extensions</h3>
                <p>Buka Chrome/Edge, ketik <code>chrome://extensions</code> di address bar</p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>Aktifkan Developer Mode</h3>
                <p>Toggle "Developer mode" di pojok kanan atas</p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>5</div>
              <div className={styles.stepContent}>
                <h3>Load Extension Guard</h3>
                <p>Klik "Load unpacked" → Pilih folder <code>extensions/guard</code> → Aktifkan extension</p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>6</div>
              <div className={styles.stepContent}>
                <h3>Load Extension Main</h3>
                <p>Klik "Load unpacked" lagi → Pilih folder <code>extensions/main</code> → Aktifkan extension</p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>7</div>
              <div className={styles.stepContent}>
                <h3>Pin Extension</h3>
                <p>Klik icon puzzle di toolbar → Pin "Simply Main" untuk akses cepat</p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>8</div>
              <div className={styles.stepContent}>
                <h3>Selesai!</h3>
                <p>Klik icon Simply Main di toolbar untuk mulai menggunakan</p>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className={styles.troubleshooting}>
          <h2 className={styles.sectionTitle}>🔧 Troubleshooting</h2>

          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary>Extension tidak muncul setelah diinstall</summary>
              <p>Pastikan Anda sudah mengaktifkan extension di halaman chrome://extensions. Cek toggle switch di card extension.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Popup menampilkan "Guard extension required"</summary>
              <p>Anda harus menginstall dan mengaktifkan Simply Guard terlebih dahulu sebelum menggunakan Simply Main.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Popup menampilkan "Not logged in"</summary>
              <p>Pastikan Anda sudah login di dashboard Simply. Extension akan otomatis sync dengan session Anda.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Service tidak bisa dibuka</summary>
              <p>Cek apakah plan Anda sudah mencukupi untuk mengakses service tersebut. Beberapa service memerlukan plan Starter atau lebih tinggi.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Cookies tidak terinjeksi</summary>
              <p>Pastikan service memiliki cookies yang valid di database. Hubungi admin jika masalah berlanjut.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Extension error setelah update Chrome</summary>
              <p>Reload extension dengan klik tombol refresh di chrome://extensions atau disable/enable kembali extension.</p>
            </details>
          </div>
        </section>

        {/* Support */}
        <section className={styles.support}>
          <div className={styles.supportCard}>
            <h3>Butuh Bantuan?</h3>
            <p>Jika Anda mengalami masalah yang tidak tercantum di atas, silakan hubungi support kami.</p>
            <div className={styles.supportActions}>
              <Link href="/dashboard/report-service" className={styles.btn}>
                📝 Laporkan Masalah
              </Link>
              <Link href="/dashboard" className={styles.btn}>
                🏠 Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
