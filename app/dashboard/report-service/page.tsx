"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { useLanguage } from "@/app/components/language";
import {
  getProfile,
  getServices,
  type Profile,
  type Service,
} from "@/lib/supabase";
import styles from "./page.module.css";

const copy = {
  id: {
    title: "Laporkan Masalah Layanan",
    back: "Kembali ke Dashboard",
    subtitle: "Bantu kami meningkatkan layanan dengan melaporkan masalah yang Anda alami",
    selectService: "Pilih Layanan",
    selectServicePlaceholder: "-- Pilih layanan yang bermasalah --",
    issueType: "Jenis Masalah",
    issueTypePlaceholder: "-- Pilih jenis masalah --",
    description: "Deskripsi Masalah",
    descriptionPlaceholder: "Jelaskan masalah yang Anda alami secara detail...",
    submit: "Kirim Laporan",
    submitting: "Mengirim...",
    success: "Laporan Berhasil Dikirim!",
    successDesc: "Terima kasih atas laporan Anda. Tim kami akan segera menindaklanjuti.",
    backToDashboard: "Kembali ke Dashboard",
    issueTypes: {
      down: "Layanan Down / Tidak Bisa Diakses",
      slow: "Layanan Lambat",
      login: "Masalah Login / Autentikasi",
      cookies: "Cookies Tidak Valid",
      other: "Masalah Lainnya",
    },
  },
  en: {
    title: "Report Service Issue",
    back: "Back to Dashboard",
    subtitle: "Help us improve our services by reporting issues you encounter",
    selectService: "Select Service",
    selectServicePlaceholder: "-- Select the problematic service --",
    issueType: "Issue Type",
    issueTypePlaceholder: "-- Select issue type --",
    description: "Issue Description",
    descriptionPlaceholder: "Describe the issue you're experiencing in detail...",
    submit: "Submit Report",
    submitting: "Submitting...",
    success: "Report Submitted Successfully!",
    successDesc: "Thank you for your report. Our team will follow up soon.",
    backToDashboard: "Back to Dashboard",
    issueTypes: {
      down: "Service Down / Inaccessible",
      slow: "Service Slow",
      login: "Login / Authentication Issue",
      cookies: "Invalid Cookies",
      other: "Other Issue",
    },
  },
};

export default function ReportServicePage() {
  const { language } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) {
        router.push("/login");
        return;
      }
      setProfile(p);

      const s = await getServices();
      setServices(s || []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedService || !issueType || !description.trim()) return;

    setSubmitting(true);

    // Simulate API call (in real app, this would send to backend)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, you would send this data to your backend:
    // const reportData = {
    //   user_id: profile?.id,
    //   service_id: selectedService,
    //   issue_type: issueType,
    //   description: description.trim(),
    //   timestamp: new Date().toISOString(),
    // };
    // await supabase.from('service_reports').insert(reportData);

    setSubmitting(false);
    setSubmitted(true);
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

  if (submitted) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={64} />
            </div>
            <h2>{text.success}</h2>
            <p>{text.successDesc}</p>
            <Link href="/dashboard" className={styles.btnPrimary}>
              {text.backToDashboard}
            </Link>
          </div>
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
              <AlertCircle size={28} />
              {text.title}
            </h1>
            <p className={styles.subtitle}>{text.subtitle}</p>
          </div>
        </header>

        <section className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="service">{text.selectService}</label>
              <select
                id="service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={styles.select}
                required
              >
                <option value="">{text.selectServicePlaceholder}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.domain})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="issueType">{text.issueType}</label>
              <select
                id="issueType"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className={styles.select}
                required
              >
                <option value="">{text.issueTypePlaceholder}</option>
                <option value="down">{text.issueTypes.down}</option>
                <option value="slow">{text.issueTypes.slow}</option>
                <option value="login">{text.issueTypes.login}</option>
                <option value="cookies">{text.issueTypes.cookies}</option>
                <option value="other">{text.issueTypes.other}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">{text.description}</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={text.descriptionPlaceholder}
                className={styles.textarea}
                rows={6}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting || !selectedService || !issueType || !description.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  {text.submitting}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {text.submit}
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
