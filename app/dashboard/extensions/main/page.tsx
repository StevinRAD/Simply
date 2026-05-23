"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  Layers,
  Loader2,
  Lock,
} from "lucide-react";
import {
  LanguageSwitcher,
  useLanguage,
  type Language,
} from "../../../components/language";
import {
  getProfile,
  getServices,
  getActiveServiceBundles,
  type Profile,
  type Service,
  type ServiceBundle,
} from "@/lib/supabase";
import styles from "./page.module.css";

const planOrder: Record<string, number> = { free: 0, starter: 1, plus: 2, max: 3 };

const uiCopy: Record<
  Language,
  {
    title: string;
    description: string;
    backToDashboard: string;
    services: string;
    noBundle: string;
    clickToExpand: string;
    accessService: string;
    planRequired: string;
    maintenance: string;
    down: string;
    bundleCount: string;
  }
> = {
  id: {
    title: "Simply Main Extension",
    description: "Akses semua layanan premium Simply melalui extension. Layanan dikelompokkan dalam bundle untuk kemudahan navigasi.",
    backToDashboard: "Kembali ke Dashboard",
    services: "layanan",
    noBundle: "Belum ada bundle layanan tersedia.",
    clickToExpand: "Klik untuk melihat layanan",
    accessService: "Akses",
    planRequired: "Butuh plan",
    maintenance: "Maintenance",
    down: "Down",
    bundleCount: "layanan",
  },
  en: {
    title: "Simply Main Extension",
    description: "Access all Simply premium services through the extension. Services are grouped into bundles for easy navigation.",
    backToDashboard: "Back to Dashboard",
    services: "services",
    noBundle: "No service bundles available yet.",
    clickToExpand: "Click to view services",
    accessService: "Access",
    planRequired: "Requires plan",
    maintenance: "Maintenance",
    down: "Down",
    bundleCount: "services",
  },
};

export default function ExtensionMainPage() {
  const { language, mounted } = useLanguage();
  const text = uiCopy[language];

  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const [p, s, b] = await Promise.all([
        getProfile(),
        getServices(),
        getActiveServiceBundles(),
      ]);
      setProfile(p);
      setServices(s || []);
      setBundles(b || []);
      setLoading(false);
    }
    load();
  }, []);

  function toggleBundle(id: string) {
    setExpandedBundles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canAccess = (required: string) =>
    planOrder[profile?.plan || "free"] >= planOrder[required];

  if (!mounted || loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className="spin" />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/dashboard" className={styles.backButton}>
            <ArrowLeft size={16} aria-hidden="true" />
            {text.backToDashboard}
          </Link>
          <div className={styles.headerRight}>
            <p>Simply Extension</p>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Hero section */}
        <section className={styles.hero}>
          <div className={styles.heroIcon}>
            <Download size={28} />
          </div>
          <h1>{text.title}</h1>
          <p className={styles.heroDesc}>{text.description}</p>
        </section>

        {/* Bundles */}
        {bundles.length === 0 ? (
          <div className={styles.emptyState}>
            <Layers size={32} />
            <p>{text.noBundle}</p>
          </div>
        ) : (
          <div className={styles.bundleList}>
            {bundles.map((bundle) => {
              const isExpanded = expandedBundles.has(bundle.id);
              const bundleServices = services.filter((s) =>
                bundle.service_ids.includes(s.id)
              );

              return (
                <div key={bundle.id} className={styles.bundleItem}>
                  {/* Bundle header - clickable */}
                  <button
                    className={`${styles.bundleHeader} ${isExpanded ? styles.bundleHeaderActive : ""}`}
                    onClick={() => toggleBundle(bundle.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className={styles.bundleEmoji}>{bundle.icon_emoji}</span>
                    <div className={styles.bundleInfo}>
                      <strong className={styles.bundleName}>{bundle.name}</strong>
                      {bundle.description && (
                        <span className={styles.bundleDesc}>{bundle.description}</span>
                      )}
                      <span className={styles.bundleMeta}>
                        {bundleServices.length} {text.bundleCount}
                      </span>
                    </div>
                    <span className={styles.bundleChevron}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </button>

                  {/* Expanded services */}
                  {isExpanded && (
                    <div className={styles.bundleServices}>
                      {bundleServices.length === 0 ? (
                        <p className={styles.bundleEmpty}>
                          {language === "id" ? "Tidak ada layanan dalam bundle ini." : "No services in this bundle."}
                        </p>
                      ) : (
                        bundleServices.map((s) => {
                          const accessible = canAccess(s.plan_required);
                          return (
                            <div
                              key={s.id}
                              className={`${styles.serviceCard} ${s.status !== "active" ? styles.serviceCardDisabled : ""}`}
                            >
                              <div className={styles.serviceInfo}>
                                {s.icon_url ? (
                                  <Image
                                    src={s.icon_url}
                                    alt={s.name}
                                    width={32}
                                    height={32}
                                    className={styles.serviceIcon}
                                  />
                                ) : (
                                  <div className={styles.serviceIconFallback}>
                                    <Globe size={16} />
                                  </div>
                                )}
                                <div className={styles.serviceText}>
                                  <strong>{s.name}</strong>
                                  <span className={styles.serviceDomain}>{s.domain}</span>
                                </div>
                              </div>
                              <div className={styles.serviceAction}>
                                {s.status === "active" && accessible ? (
                                  <Link
                                    href={`/dashboard/service/${s.slug}`}
                                    className={styles.accessBtn}
                                  >
                                    {text.accessService}
                                  </Link>
                                ) : s.status === "maintenance" ? (
                                  <span className={styles.statusTag}>{text.maintenance}</span>
                                ) : s.status === "down" ? (
                                  <span className={`${styles.statusTag} ${styles.statusDown}`}>{text.down}</span>
                                ) : (
                                  <span className={styles.lockedTag}>
                                    <Lock size={12} />
                                    {s.plan_required.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
