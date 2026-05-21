"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { LanguageSwitcher, useLanguage, type Language } from "../components/language";
import { resetPassword } from "@/lib/supabase";
import styles from "./page.module.css";

const copy: Record<Language, Record<string, string>> = {
  id: {
    backToLogin: "Kembali ke Login",
    title: "Lupa Password?",
    description: "Masukkan email kamu dan kami akan mengirim link untuk reset password.",
    email: "Alamat Email",
    submit: "Kirim Link Reset",
    successTitle: "Email terkirim!",
    successDesc: "Cek inbox kamu untuk link reset password. Jika tidak ada, cek folder spam.",
    backToLoginBtn: "Kembali ke Login",
    errorGeneric: "Gagal mengirim email. Coba lagi.",
  },
  en: {
    backToLogin: "Back to Login",
    title: "Forgot Password?",
    description: "Enter your email and we'll send you a link to reset your password.",
    email: "Email Address",
    submit: "Send Reset Link",
    successTitle: "Email sent!",
    successDesc: "Check your inbox for the password reset link. If not found, check spam folder.",
    backToLoginBtn: "Back to Login",
    errorGeneric: "Failed to send email. Try again.",
  },
};

export default function ForgotPasswordPage() {
  const { language, mounted } = useLanguage();
  const text = copy[language];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!mounted) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;

    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message || text.errorGeneric);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className={styles.page}>
        <div className={`${styles.card} fade-in`}>
          <CheckCircle2 size={48} className={styles.successIcon} />
          <h2>{text.successTitle}</h2>
          <p>{text.successDesc}</p>
          <Link href="/login" className={styles.primaryLink}>{text.backToLoginBtn}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={`${styles.card} fade-in`}>
        <div className={styles.topRow}>
          <Link href="/login" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            {text.backToLogin}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className={styles.brandBadge}>
          <Image src="/logo/logo_simply.png" alt="Simply logo" width={24} height={24} style={{ borderRadius: 6 }} />
          <strong>Simply</strong>
        </div>

        <h1>{text.title}</h1>
        <p className={styles.desc}>{text.description}</p>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            {text.email}
            <span className={styles.inputShell}>
              <Mail size={16} aria-hidden="true" />
              <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
            </span>
          </label>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : text.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
