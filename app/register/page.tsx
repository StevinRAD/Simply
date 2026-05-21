"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { LanguageSwitcher, useLanguage, type Language } from "../components/language";
import { signUp, signInWithGoogle } from "@/lib/supabase";
import styles from "./page.module.css";

const copy: Record<Language, Record<string, string>> = {
  id: {
    backToHome: "Kembali ke Beranda",
    title: "Buat akun Simply kamu.",
    description: "Daftar untuk akses dashboard, pilih plan, dan mulai gunakan layanan premium.",
    secureFlow: "Alur registrasi aman",
    supabaseReady: "Terintegrasi Google & Supabase",
    createAccount: "Buat Akun",
    createAccountDesc: "Isi data kamu untuk mulai menggunakan Simply.",
    fullName: "Nama Lengkap",
    fullNamePlaceholder: "Nama Kamu",
    email: "Alamat Email",
    password: "Password",
    passwordPlaceholder: "Min. 6 karakter",
    confirmPassword: "Konfirmasi Password",
    confirmPasswordPlaceholder: "Ulangi password",
    agreeTerms: "Saya setuju dengan syarat dan kebijakan privasi Simply.",
    submit: "Buat Akun Simply",
    alreadyHaveAccount: "Sudah punya akun?",
    signIn: "Masuk",
    orContinueWith: "atau daftar dengan",
    googleSignup: "Daftar dengan Google",
    errorMismatch: "Password tidak cocok",
    errorGeneric: "Gagal membuat akun. Coba lagi.",
    successTitle: "Akun berhasil dibuat!",
    successDesc: "Cek email kamu untuk verifikasi, lalu login.",
  },
  en: {
    backToHome: "Back to Home",
    title: "Create your Simply account.",
    description: "Sign up to access the dashboard, choose a plan, and start using premium services.",
    secureFlow: "Secure registration flow",
    supabaseReady: "Google & Supabase integrated",
    createAccount: "Create Account",
    createAccountDesc: "Fill in your details to start using Simply.",
    fullName: "Full Name",
    fullNamePlaceholder: "Your Name",
    email: "Email Address",
    password: "Password",
    passwordPlaceholder: "Min. 6 characters",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Repeat password",
    agreeTerms: "I agree with Simply terms and privacy policy.",
    submit: "Create Simply Account",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    orContinueWith: "or sign up with",
    googleSignup: "Sign up with Google",
    errorMismatch: "Passwords do not match",
    errorGeneric: "Failed to create account. Try again.",
    successTitle: "Account created!",
    successDesc: "Check your email for verification, then sign in.",
  },
};

export default function RegisterPage() {
  const { language, mounted } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!mounted) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const confirm = form.get("confirmPassword") as string;

    if (password !== confirm) {
      setError(text.errorMismatch);
      setLoading(false);
      return;
    }

    const { error: authError } = await signUp(email, password, name);
    if (authError) {
      setError(authError.message || text.errorGeneric);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className={styles.registerPage}>
        <div className={`${styles.successCard} fade-in`}>
          <CheckCircle2 size={48} className={styles.successIcon} />
          <h2>{text.successTitle}</h2>
          <p>{text.successDesc}</p>
          <Link href="/login" className={styles.successLink}>{text.signIn}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.registerPage}>
      <div className={`${styles.wrapper} fade-in`}>
        <section className={styles.brandPanel}>
          <div className={styles.topRow}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              {text.backToHome}
            </Link>
            <LanguageSwitcher />
          </div>

          <div className={styles.brandBadge}>
            <Image src="/logo/logo_simply.png" alt="Simply logo" width={24} height={24} className={styles.brandBadgeLogo} />
            <strong>Simply</strong>
          </div>

          <h1>{text.title}</h1>
          <p>{text.description}</p>

          <div className={styles.trustList}>
            <div><ShieldCheck size={16} aria-hidden="true" /><span>{text.secureFlow}</span></div>
            <div><Sparkles size={16} aria-hidden="true" /><span>{text.supabaseReady}</span></div>
          </div>
        </section>

        <section className={styles.formPanel}>
          <header className={styles.formHead}>
            <h2>{text.createAccount}</h2>
            <p>{text.createAccountDesc}</p>
          </header>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              {text.fullName}
              <span className={styles.inputShell}>
                <UserRound size={16} aria-hidden="true" />
                <input type="text" name="name" placeholder={text.fullNamePlaceholder} autoComplete="name" required />
              </span>
            </label>

            <label>
              {text.email}
              <span className={styles.inputShell}>
                <Mail size={16} aria-hidden="true" />
                <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
              </span>
            </label>

            <label>
              {text.password}
              <span className={styles.inputShell}>
                <LockKeyhole size={16} aria-hidden="true" />
                <input type="password" name="password" placeholder={text.passwordPlaceholder} autoComplete="new-password" required minLength={6} />
              </span>
            </label>

            <label>
              {text.confirmPassword}
              <span className={styles.inputShell}>
                <LockKeyhole size={16} aria-hidden="true" />
                <input type="password" name="confirmPassword" placeholder={text.confirmPasswordPlaceholder} autoComplete="new-password" required minLength={6} />
              </span>
            </label>

            <label className={styles.checkbox}>
              <input type="checkbox" name="terms" required />
              <span>{text.agreeTerms}</span>
            </label>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : text.submit}
            </button>
          </form>

          <div className={styles.divider}><span>{text.orContinueWith}</span></div>

          <button type="button" className={styles.googleBtn} onClick={() => signInWithGoogle()} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {text.googleSignup}
          </button>

          <footer className={styles.formFooter}>
            <p>{text.alreadyHaveAccount} <Link href="/login">{text.signIn}</Link></p>
          </footer>
        </section>
      </div>
    </main>
  );
}
