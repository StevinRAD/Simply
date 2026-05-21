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
  Loader2,
} from "lucide-react";
import { LanguageSwitcher, useLanguage, type Language } from "../components/language";
import { signIn, signInWithGoogle, getProfile } from "@/lib/supabase";
import styles from "./page.module.css";

const copy: Record<Language, Record<string, string>> = {
  id: {
    backToHome: "Kembali ke Beranda",
    title: "Selamat datang kembali di Simply.",
    description: "Login untuk akses dashboard premium, kelola subscription, dan cek status layanan.",
    secureSession: "Sesi akun aman",
    quickAccess: "Akses dashboard satu klik",
    signIn: "Masuk",
    signInDesc: "Gunakan kredensial akun kamu untuk melanjutkan.",
    email: "Alamat Email",
    password: "Password",
    remember: "Ingat perangkat ini",
    forgotPassword: "Lupa password?",
    loginButton: "Masuk ke Simply",
    newToSimply: "Belum punya akun Simply?",
    createAccount: "Buat akun",
    orContinueWith: "atau lanjutkan dengan",
    googleLogin: "Masuk dengan Google",
    errorInvalid: "Email atau password salah",
  },
  en: {
    backToHome: "Back to Home",
    title: "Welcome back to Simply.",
    description: "Sign in to access your premium dashboard, manage subscriptions, and track service status.",
    secureSession: "Secure account session",
    quickAccess: "Fast one-click dashboard access",
    signIn: "Sign in",
    signInDesc: "Use your account credentials to continue.",
    email: "Email Address",
    password: "Password",
    remember: "Remember this device",
    forgotPassword: "Forgot password?",
    loginButton: "Login to Simply",
    newToSimply: "New to Simply?",
    createAccount: "Create account",
    orContinueWith: "or continue with",
    googleLogin: "Sign in with Google",
    errorInvalid: "Invalid email or password",
  },
};

export default function LoginPage() {
  const { language, mounted } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!mounted) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(text.errorInvalid);
      setLoading(false);
      return;
    }

    const profile = await getProfile();
    console.log("Profile:", profile);
    setLoading(false);
    
    const redirectPath = profile?.role === "admin" ? "/admin" : "/dashboard";
    console.log("Redirecting to:", redirectPath);
    window.location.href = redirectPath;
  }

  async function handleGoogleLogin() {
    setLoading(true);
    await signInWithGoogle();
  }

  return (
    <main className={styles.loginPage}>
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
            <div><ShieldCheck size={16} aria-hidden="true" /><span>{text.secureSession}</span></div>
            <div><Sparkles size={16} aria-hidden="true" /><span>{text.quickAccess}</span></div>
          </div>
        </section>

        <section className={styles.formPanel}>
          <header className={styles.formHead}>
            <h2>{text.signIn}</h2>
            <p>{text.signInDesc}</p>
          </header>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
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
                <input type="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
              </span>
            </label>

            <div className={styles.formMeta}>
              <label className={styles.checkLabel}>
                <input type="checkbox" name="remember" />
                {text.remember}
              </label>
              <Link href="/forgot-password">{text.forgotPassword}</Link>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : text.loginButton}
            </button>
          </form>

          <div className={styles.divider}><span>{text.orContinueWith}</span></div>

          <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {text.googleLogin}
          </button>

          <p className={styles.switchLink}>
            {text.newToSimply} <Link href="/register">{text.createAccount}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
