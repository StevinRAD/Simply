"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  Layers3,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { LanguageSwitcher, useLanguage, type Language } from "./components/language";
import serviceData from "../simply_services.json";

type ServiceTab = "premium" | "pro" | "phantom";
type BillingCycle = "monthly" | "yearly";

type Localized = {
  id: string;
  en: string;
};

type ServiceItem = {
  src: string;
  alt: string;
  name: string;
};

type Plan = {
  key: string;
  badge: Localized;
  title: Localized;
  subtitle: Localized;
  monthly: string;
  yearly: string;
  yearlyNote: Localized;
  recommended?: boolean;
  points: Localized[];
};

const services = serviceData as Record<ServiceTab, ServiceItem[]>;

const navLinks: Array<{ href: string; label: Localized }> = [
  { href: "#home", label: { id: "Beranda", en: "Home" } },
  { href: "#features", label: { id: "Fitur", en: "Features" } },
  { href: "#pricing", label: { id: "Harga", en: "Pricing" } },
  { href: "#services", label: { id: "Layanan", en: "Services" } },
  { href: "#faq", label: { id: "FAQ", en: "FAQ" } },
];

const featureItems = [
  {
    icon: Zap,
    title: {
      id: "Akses Satu Klik",
      en: "One-Click Access",
    },
    description: {
      id: "Masuk ke layanan premium langsung dari ekstensi Simply tanpa alur yang rumit.",
      en: "Access premium services instantly from the Simply extension without a complex flow.",
    },
  },
  {
    icon: LifeBuoy,
    title: {
      id: "Support 24/7",
      en: "24/7 Human Support",
    },
    description: {
      id: "Tim support selalu siap membantu kendala akun, akses, atau request kapan pun.",
      en: "Our support team is always available to help with account, access, or service issues.",
    },
  },
  {
    icon: ShieldCheck,
    title: {
      id: "Akses Stabil",
      en: "Reliable Access",
    },
    description: {
      id: "Monitoring aktif dan fallback pool agar layanan tetap stabil saat trafik tinggi.",
      en: "Active monitoring and fallback pools keep services stable during peak traffic.",
    },
  },
  {
    icon: CircleDollarSign,
    title: {
      id: "Lebih Hemat",
      en: "Cost Efficient",
    },
    description: {
      id: "Nikmati banyak layanan premium dengan biaya jauh lebih efisien dari langganan satuan.",
      en: "Access many premium services at a fraction of the cost of individual subscriptions.",
    },
  },
];

const serviceTabs: Array<{ key: ServiceTab; label: Localized; hint: Localized }> = [
  {
    key: "premium",
    label: { id: "Starter Pool", en: "Starter Pool" },
    hint: {
      id: "Katalog utama untuk kebutuhan harian.",
      en: "Main catalog for daily needs.",
    },
  },
  {
    key: "pro",
    label: { id: "Pro Pool", en: "Pro Pool" },
    hint: {
      id: "Akses tambahan untuk creator dan power user.",
      en: "Additional access for creators and power users.",
    },
  },
  {
    key: "phantom",
    label: { id: "Max Pool", en: "Max Pool" },
    hint: {
      id: "Koleksi eksklusif dengan jangkauan paling luas.",
      en: "Exclusive catalog with the widest coverage.",
    },
  },
];

const plans: Plan[] = [
  {
    key: "starter",
    badge: { id: "STARTER", en: "STARTER" },
    title: { id: "Simply Starter", en: "Simply Starter" },
    subtitle: {
      id: "Cocok untuk penggunaan personal.",
      en: "Great for personal usage.",
    },
    monthly: "Rp 49.999 / 30 hari",
    yearly: "Rp 479.999 / 360 hari",
    yearlyNote: { id: "Hemat sekitar 20%", en: "Save around 20%" },
    points: [
      { id: "1 user aktif", en: "1 active user" },
      { id: "Akses Starter Pool", en: "Starter Pool access" },
      { id: "Akses ekstensi one-click", en: "One-click extension access" },
      { id: "Support prioritas standar", en: "Standard priority support" },
      { id: "Update katalog berkala", en: "Regular catalog updates" },
    ],
  },
  {
    key: "plus",
    badge: { id: "POPULER", en: "POPULAR" },
    title: { id: "Simply Plus", en: "Simply Plus" },
    subtitle: {
      id: "Paket paling seimbang untuk produktivitas.",
      en: "The most balanced plan for productivity.",
    },
    monthly: "Rp 99.999 / 30 hari",
    yearly: "Rp 959.999 / 360 hari",
    yearlyNote: { id: "Hemat sekitar 20%", en: "Save around 20%" },
    recommended: true,
    points: [
      { id: "1 user aktif", en: "1 active user" },
      { id: "Akses Starter + Pro Pool", en: "Starter + Pro Pool access" },
      { id: "Akses ekstensi one-click", en: "One-click extension access" },
      { id: "Support prioritas cepat", en: "Faster priority support" },
      { id: "Uptime SLA lebih tinggi", en: "Higher uptime SLA" },
    ],
  },
  {
    key: "max",
    badge: { id: "AKSES PENUH", en: "ALL ACCESS" },
    title: { id: "Simply Max", en: "Simply Max" },
    subtitle: {
      id: "Untuk pengguna intensif dengan kebutuhan penuh.",
      en: "For intensive users with full access needs.",
    },
    monthly: "Rp 499.999 / 30 hari",
    yearly: "Rp 4.799.999 / 360 hari",
    yearlyNote: { id: "Hemat sekitar 20%", en: "Save around 20%" },
    points: [
      { id: "1 user aktif", en: "1 active user" },
      { id: "Akses Starter + Pro + Max Pool", en: "Starter + Pro + Max Pool access" },
      { id: "Akses ekstensi one-click", en: "One-click extension access" },
      { id: "Support prioritas tertinggi", en: "Highest priority support" },
      { id: "Akses rilis katalog lebih awal", en: "Early catalog release access" },
    ],
  },
];

const faqItems: Array<{ question: Localized; answer: Localized }> = [
  {
    question: {
      id: "Bagaimana cara pakai Simply?",
      en: "How do I use Simply?",
    },
    answer: {
      id: "Install ekstensi Simply, login ke akun kamu, lalu buka layanan yang tersedia dari dashboard.",
      en: "Install the Simply extension, sign in to your account, then access available services from the dashboard.",
    },
  },
  {
    question: {
      id: "Apakah akun Simply bisa dipakai bersama?",
      en: "Can a Simply account be shared?",
    },
    answer: {
      id: "Tidak. 1 akun ditujukan untuk 1 pengguna aktif agar stabilitas akses tetap terjaga.",
      en: "No. One account is intended for one active user to keep access stable.",
    },
  },
  {
    question: {
      id: "Kalau ada layanan error, bisa lapor?",
      en: "Can I report issues when a service has problems?",
    },
    answer: {
      id: "Bisa. Kamu bisa kirim laporan lewat form kontak atau Discord agar tim support segera cek.",
      en: "Yes. You can submit a report through the contact form or Discord so support can investigate quickly.",
    },
  },
  {
    question: {
      id: "Apakah Simply support mobile?",
      en: "Does Simply support mobile devices?",
    },
    answer: {
      id: "Untuk saat ini pengalaman terbaik tetap di desktop/laptop karena akses utama lewat ekstensi browser.",
      en: "For now, the best experience is on desktop/laptop because core access relies on a browser extension.",
    },
  },
  {
    question: {
      id: "Apakah pembayaran bisa refund?",
      en: "Are payments refundable?",
    },
    answer: {
      id: "Pembayaran bersifat final. Pastikan plan dan durasi sudah sesuai sebelum checkout.",
      en: "Payments are final. Please ensure your selected plan and duration are correct before checkout.",
    },
  },
  {
    question: {
      id: "Kapan layanan baru ditambahkan?",
      en: "When are new services added?",
    },
    answer: {
      id: "Update katalog dilakukan rutin berdasarkan kebutuhan user dan stabilitas layanan.",
      en: "Catalog updates are rolled out regularly based on user demand and service stability.",
    },
  },
];

const copy: Record<
  Language,
  {
    topBanner: string;
    login: string;
    startNow: string;
    trustedLabel: string;
    heroTitle: string;
    heroDesc: string;
    getStarted: string;
    exploreServices: string;
    servicesCount: string;
    supportMetric: string;
    uptimeMetric: string;
    servicesLabel: string;
    supportLabel: string;
    uptimeLabel: string;
    activePlan: string;
    renewalText: string;
    catalogAccess: string;
    averageResponse: string;
    status: string;
    allSystemsStable: string;
    featuresTag: string;
    featuresTitle: string;
    featuresDesc: string;
    pricingTag: string;
    pricingTitle: string;
    pricingDesc: string;
    monthly: string;
    yearly: string;
    monthlyBilling: string;
    choosePlan: string;
    servicesTag: string;
    servicesTitle: string;
    servicesDesc: string;
    servicesRealtimeNote: string;
    searchPlaceholder: string;
    faqTag: string;
    faqTitle: string;
    faqDesc: string;
    contactTag: string;
    contactTitle: string;
    contactDesc: string;
    sendMessage: string;
    fullName: string;
    email: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    footerDesc: string;
    navigate: string;
    account: string;
    dashboard: string;
    support: string;
    privacy: string;
    terms: string;
    billingPer30Days: string;
  }
> = {
  id: {
    topBanner:
      "Simply sudah live. Akses premium lebih ringkas, lebih stabil, dan lebih hemat.",
    login: "Login",
    startNow: "Mulai Sekarang",
    trustedLabel: "Platform Akses Premium Terpercaya",
    heroTitle: "Buka akses layanan premium bersama Simply.",
    heroDesc:
      "Semua kebutuhan streaming, AI, desain, dan belajar ada dalam satu dashboard. Lebih cepat diakses, lebih simpel dipakai.",
    getStarted: "Mulai",
    exploreServices: "Lihat Layanan",
    servicesCount: "120+",
    supportMetric: "24/7",
    uptimeMetric: "99%",
    servicesLabel: "Layanan",
    supportLabel: "Support",
    uptimeLabel: "Target Uptime",
    activePlan: "Plan Aktif",
    renewalText: "Perpanjangan dalam 28 hari",
    catalogAccess: "Akses Katalog",
    averageResponse: "Rata-rata Respons",
    status: "Status",
    allSystemsStable: "Semua Sistem Stabil",
    featuresTag: "Fitur",
    featuresTitle: "Dibangun untuk akses cepat dan stabil setiap hari.",
    featuresDesc:
      "UX fokus ke 3 hal: cepat dipahami, minim klik, dan minim gangguan.",
    pricingTag: "Harga",
    pricingTitle: "Pilih plan sesuai kebutuhan kamu.",
    pricingDesc: "Semua plan termasuk akses ekstensi dan support tim.",
    monthly: "Bulanan",
    yearly: "Tahunan",
    monthlyBilling: "Tagihan per 30 hari",
    choosePlan: "Pilih Plan",
    servicesTag: "Layanan",
    servicesTitle: "Jelajahi katalog premium di Simply.",
    servicesDesc:
      "Jumlah layanan bisa berubah real-time mengikuti update pool dan maintenance.",
    servicesRealtimeNote:
      "Update real-time: jumlah layanan dan akun dapat bertambah atau berkurang kapan saja.",
    searchPlaceholder: "Cari layanan...",
    faqTag: "FAQ",
    faqTitle: "Hal penting yang sering ditanyakan.",
    faqDesc: "Kalau masih ada pertanyaan, langsung hubungi tim Simply.",
    contactTag: "Kontak",
    contactTitle: "Butuh bantuan? Hubungi support Simply.",
    contactDesc:
      "Respons cepat lewat Discord, atau kirim detail kendala lewat email.",
    sendMessage: "Kirim Pesan",
    fullName: "Nama Lengkap",
    email: "Email",
    message: "Pesan",
    messagePlaceholder: "Ceritakan kendala yang kamu alami",
    submit: "Kirim",
    footerDesc:
      "Platform akses premium untuk alur kerja belajar, hiburan, dan produktivitas.",
    navigate: "Navigasi",
    account: "Akun",
    dashboard: "Dashboard",
    support: "Support",
    privacy: "Privasi",
    terms: "Syarat",
    billingPer30Days: "Tagihan per 30 hari",
  },
  en: {
    topBanner:
      "Simply is now live. Premium access is now faster, more stable, and more affordable.",
    login: "Login",
    startNow: "Start Now",
    trustedLabel: "Trusted Premium Access Platform",
    heroTitle: "Unlock premium services with Simply.",
    heroDesc:
      "All your streaming, AI, design, and learning needs in one dashboard. Faster to access, simpler to use.",
    getStarted: "Get Started",
    exploreServices: "Explore Services",
    servicesCount: "120+",
    supportMetric: "24/7",
    uptimeMetric: "99%",
    servicesLabel: "Services",
    supportLabel: "Support",
    uptimeLabel: "Uptime Target",
    activePlan: "Active Plan",
    renewalText: "Renewal in 28 days",
    catalogAccess: "Catalog Access",
    averageResponse: "Average Response",
    status: "Status",
    allSystemsStable: "All Systems Stable",
    featuresTag: "Features",
    featuresTitle: "Built for fast access and daily reliability.",
    featuresDesc:
      "The UX focuses on three things: clarity, fewer clicks, and fewer interruptions.",
    pricingTag: "Pricing",
    pricingTitle: "Choose the plan that fits your needs.",
    pricingDesc: "All plans include extension access and support.",
    monthly: "Monthly",
    yearly: "Yearly",
    monthlyBilling: "Billed every 30 days",
    choosePlan: "Choose Plan",
    servicesTag: "Services",
    servicesTitle: "Discover premium catalogs inside Simply.",
    servicesDesc:
      "Service availability can change in real-time based on pool updates and maintenance.",
    servicesRealtimeNote:
      "Real-time updates: number of services and accounts can increase or decrease at any time.",
    searchPlaceholder: "Search service...",
    faqTag: "FAQ",
    faqTitle: "Frequently asked questions.",
    faqDesc: "If you still have questions, contact the Simply team directly.",
    contactTag: "Contact",
    contactTitle: "Need help? Talk to Simply support.",
    contactDesc:
      "Get quick responses on Discord, or send issue details by email.",
    sendMessage: "Send Message",
    fullName: "Full Name",
    email: "Email",
    message: "Message",
    messagePlaceholder: "Tell us what issue you are experiencing",
    submit: "Submit",
    footerDesc:
      "Premium access platform for learning, entertainment, and productivity workflows.",
    navigate: "Navigate",
    account: "Account",
    dashboard: "Dashboard",
    support: "Support",
    privacy: "Privacy",
    terms: "Terms",
    billingPer30Days: "Billed every 30 days",
  },
};

export default function Home() {
  const { language, mounted } = useLanguage();
  const text = copy[language];

  const [activeTab, setActiveTab] = useState<ServiceTab>("premium");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [query, setQuery] = useState("");

  const filteredServices = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return services[activeTab];
    return services[activeTab].filter((item) =>
      item.name.toLowerCase().includes(keyword),
    );
  }, [activeTab, query]);

  if (!mounted) return null;

  return (
    <div className="simply-page">
      <div className="top-banner">
        <Sparkles size={15} aria-hidden="true" />
        <p>{text.topBanner}</p>
      </div>

      <header className="simply-header">
        <div className="simply-container nav-shell">
          <a href="#home" className="brand">
            <Image
              src="/logo/logo_simply.png"
              alt="Simply logo"
              width={36}
              height={36}
              className="brand-mark"
            />
            <span className="brand-word">Simply</span>
          </a>

          <nav className="nav-links" aria-label="Main navigation">
            {navLinks.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label[language]}
              </a>
            ))}
          </nav>

          <div className="nav-cta">
            <LanguageSwitcher />
            <a href="/login" className="btn btn-ghost">
              {text.login}
            </a>
            <a href="/register" className="btn btn-primary">
              {text.startNow}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="simply-container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">
                <BadgeCheck size={16} aria-hidden="true" />
                {text.trustedLabel}
              </p>
              <h1>{text.heroTitle}</h1>
              <p className="lead">{text.heroDesc}</p>
              <div className="hero-buttons">
                <a href="/register" className="btn btn-primary">
                  {text.getStarted}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a href="#services" className="btn btn-ghost">
                  {text.exploreServices}
                </a>
              </div>
              <div className="hero-metrics">
                <div>
                  <strong>{text.servicesCount}</strong>
                  <span>{text.servicesLabel}</span>
                </div>
                <div>
                  <strong>{text.supportMetric}</strong>
                  <span>{text.supportLabel}</span>
                </div>
                <div>
                  <strong>{text.uptimeMetric}</strong>
                  <span>{text.uptimeLabel}</span>
                </div>
              </div>
            </div>

            <div className="hero-panel" aria-label="Simply dashboard preview">
              <div className="panel-head">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <div className="panel-content">
                <div className="panel-card panel-card-accent">
                  <p>{text.activePlan}</p>
                  <h3>Simply Plus</h3>
                  <small>{text.renewalText}</small>
                </div>
                <div className="panel-stats">
                  <div>
                    <Layers3 size={16} aria-hidden="true" />
                    <span>{text.catalogAccess}</span>
                    <strong>Starter + Pro</strong>
                  </div>
                  <div>
                    <Clock3 size={16} aria-hidden="true" />
                    <span>{text.averageResponse}</span>
                    <strong>{"< 10 mins"}</strong>
                  </div>
                  <div>
                    <Activity size={16} aria-hidden="true" />
                    <span>{text.status}</span>
                    <strong>{text.allSystemsStable}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="simply-container">
            <div className="section-head">
              <p>{text.featuresTag}</p>
              <h2>{text.featuresTitle}</h2>
              <span>{text.featuresDesc}</span>
            </div>
            <div className="feature-grid">
              {featureItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title.id} className="feature-card">
                    <span className="feature-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3>{item.title[language]}</h3>
                    <p>{item.description[language]}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="section section-muted">
          <div className="simply-container">
            <div className="section-head centered">
              <p>{text.pricingTag}</p>
              <h2>{text.pricingTitle}</h2>
              <span>{text.pricingDesc}</span>
            </div>

            <div className="billing-switch" role="tablist" aria-label="Billing">
              <button
                type="button"
                className={billing === "monthly" ? "active" : ""}
                onClick={() => setBilling("monthly")}
              >
                {text.monthly}
              </button>
              <button
                type="button"
                className={billing === "yearly" ? "active" : ""}
                onClick={() => setBilling("yearly")}
              >
                {text.yearly}
              </button>
            </div>

            <div className="pricing-grid">
              {plans.map((plan) => (
                <article
                  key={plan.key}
                  className={`pricing-card${plan.recommended ? " recommended" : ""}`}
                >
                  <p className="plan-badge">{plan.badge[language]}</p>
                  <h3>{plan.title[language]}</h3>
                  <span className="plan-subtitle">{plan.subtitle[language]}</span>
                  <p className="plan-price">
                    {billing === "monthly" ? plan.monthly : plan.yearly}
                  </p>
                  <small className="plan-note">
                    {billing === "yearly"
                      ? plan.yearlyNote[language]
                      : text.billingPer30Days}
                  </small>
                  <ul>
                    {plan.points.map((point) => (
                      <li key={`${plan.key}-${point.id}`}>{point[language]}</li>
                    ))}
                  </ul>
                  <a href="/register" className="btn btn-primary plan-cta">
                    {text.choosePlan}
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="section">
          <div className="simply-container">
            <div className="section-head">
              <p>{text.servicesTag}</p>
              <h2>{text.servicesTitle}</h2>
              <span>{text.servicesDesc}</span>
              <span>{text.servicesRealtimeNote}</span>
            </div>

            <div className="service-toolbar">
              <div className="service-tabs" role="tablist" aria-label="Service pool">
                {serviceTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={activeTab === tab.key ? "active" : ""}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span>{tab.label[language]}</span>
                    <small>{tab.hint[language]}</small>
                  </button>
                ))}
              </div>

              <label className="search-field">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  placeholder={text.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            <div className="service-grid">
              {filteredServices.map((service) => (
                <article key={`${activeTab}-${service.name}`} className="service-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={service.src}
                    alt={service.alt}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <p>{service.name}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="section section-muted">
          <div className="simply-container">
            <div className="section-head centered">
              <p>{text.faqTag}</p>
              <h2>{text.faqTitle}</h2>
              <span>{text.faqDesc}</span>
            </div>
            <div className="faq-grid">
              {faqItems.map((faq) => (
                <details key={faq.question.id} className="faq-item">
                  <summary>{faq.question[language]}</summary>
                  <p>{faq.answer[language]}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="simply-container contact-shell">
            <div className="contact-info">
              <p>{text.contactTag}</p>
              <h2>{text.contactTitle}</h2>
              <span>{text.contactDesc}</span>
              <div className="contact-list">
                <a href="mailto:support@simply.app">
                  <Mail size={16} aria-hidden="true" />
                  support@simply.app
                </a>
                <a href="https://discord.gg/simply" target="_blank" rel="noreferrer">
                  <MessageCircle size={16} aria-hidden="true" />
                  discord.gg/simply
                </a>
              </div>
            </div>
            <form className="contact-form">
              <h3>{text.sendMessage}</h3>
              <label>
                {text.fullName}
                <input type="text" placeholder="John Doe" />
              </label>
              <label>
                {text.email}
                <input type="email" placeholder="john@example.com" />
              </label>
              <label>
                {text.message}
                <textarea rows={4} placeholder={text.messagePlaceholder} />
              </label>
              <button type="button" className="btn btn-primary">
                {text.submit}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="simply-footer">
        <div className="simply-container footer-shell">
          <div className="footer-brand">
            <a href="#home" className="brand">
              <Image
                src="/logo/logo_simply.png"
                alt="Simply logo"
                width={36}
                height={36}
                className="brand-mark"
              />
              <span className="brand-word">Simply</span>
            </a>
            <p>{text.footerDesc}</p>
          </div>

          <div className="footer-links">
            <h4>{text.navigate}</h4>
            <a href="#features">{navLinks[1].label[language]}</a>
            <a href="#pricing">{navLinks[2].label[language]}</a>
            <a href="#services">{navLinks[3].label[language]}</a>
            <a href="#faq">{navLinks[4].label[language]}</a>
          </div>

          <div className="footer-links">
            <h4>{text.account}</h4>
            <a href="/login">{text.login}</a>
            <Link href="/dashboard">{text.dashboard}</Link>
            <a href="#contact">{text.support}</a>
          </div>
        </div>

        <div className="simply-container footer-bottom">
          <span>Simply (c) 2026</span>
          <div>
            <a href="#">{text.privacy}</a>
            <a href="#">{text.terms}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
