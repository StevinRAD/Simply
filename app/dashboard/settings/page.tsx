"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { useLanguage } from "@/app/components/language";
import {
  getProfile,
  updateProfileName,
  updatePassword,
  signOut,
  type Profile,
} from "@/lib/supabase";
import styles from "./page.module.css";

const copy = {
  id: {
    title: "Pengaturan",
    back: "Kembali ke Dashboard",
    subtitle: "Kelola profil dan preferensi akun Anda",
    accountInfo: "Informasi Akun",
    fullName: "Nama Lengkap",
    email: "Email",
    role: "Role",
    plan: "Plan",
    language: "Bahasa",
    indonesian: "Bahasa Indonesia",
    english: "English",
    saveChanges: "Simpan Perubahan",
    saving: "Menyimpan...",
    saved: "Tersimpan!",
    logout: "Keluar",
    logoutConfirm: "Apakah Anda yakin ingin keluar?",
    cancel: "Batal",
    confirm: "Ya, Keluar",
    changePassword: "Ganti Sandi",
    currentPassword: "Sandi Lama",
    newPassword: "Sandi Baru",
    confirmPassword: "Konfirmasi Sandi Baru",
    passwordPlaceholder: "Masukkan sandi...",
    passwordSave: "Perbarui Sandi",
    passwordSaving: "Memperbarui...",
    passwordSaved: "Sandi Diperbarui!",
    passwordMismatch: "Sandi baru tidak cocok",
    passwordTooShort: "Sandi minimal 8 karakter",
    passwordSameAsOld: "Sandi baru tidak boleh sama dengan sandi lama",
  },
  en: {
    title: "Settings",
    back: "Back to Dashboard",
    subtitle: "Manage your profile and account preferences",
    accountInfo: "Account Information",
    fullName: "Full Name",
    email: "Email",
    role: "Role",
    plan: "Plan",
    language: "Language",
    indonesian: "Bahasa Indonesia",
    english: "English",
    saveChanges: "Save Changes",
    saving: "Saving...",
    saved: "Saved!",
    logout: "Logout",
    logoutConfirm: "Are you sure you want to logout?",
    cancel: "Cancel",
    confirm: "Yes, Logout",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    passwordPlaceholder: "Enter password...",
    passwordSave: "Update Password",
    passwordSaving: "Updating...",
    passwordSaved: "Password Updated!",
    passwordMismatch: "New passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",
    passwordSameAsOld: "New password must be different from current password",
  },
};

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      if (!p) {
        router.push("/login");
        return;
      }
      setProfile(p);
      setFullName(p.full_name || "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    setSaved(false);

    const { error } = await updateProfileName(fullName.trim());

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, full_name: fullName.trim() } : null));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError(text.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(text.passwordMismatch);
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(text.passwordSameAsOld);
      return;
    }

    setPasswordSaving(true);
    const { error } = await updatePassword(currentPassword, newPassword);
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error);
    } else {
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
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
              <SettingsIcon size={28} />
              {text.title}
            </h1>
            <p className={styles.subtitle}>{text.subtitle}</p>
          </div>
        </header>

        {/* Account Information */}
        <section className={styles.card}>
          <h2>
            <User size={20} />
            {text.accountInfo}
          </h2>

          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName">
                <User size={16} />
                {text.fullName}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={text.fullName}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <Mail size={16} />
                {text.email}
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className={`${styles.input} ${styles.disabled}`}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>
                  <Shield size={16} />
                  {text.role}
                </label>
                <input
                  type="text"
                  value={profile?.role || "user"}
                  disabled
                  className={`${styles.input} ${styles.disabled}`}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <CheckCircle2 size={16} />
                  {text.plan}
                </label>
                <input
                  type="text"
                  value={profile?.plan?.toUpperCase() || "FREE"}
                  disabled
                  className={`${styles.input} ${styles.disabled}`}
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={saving || !fullName.trim() || fullName === profile?.full_name}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  {text.saving}
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={16} />
                  {text.saved}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {text.saveChanges}
                </>
              )}
            </button>
          </form>
        </section>

        {/* Language Preference */}
        <section className={styles.card}>
          <h2>
            <Globe size={20} />
            {text.language}
          </h2>

          <div className={styles.languageOptions}>
            <button
              className={`${styles.langBtn} ${language === "id" ? styles.active : ""}`}
              onClick={() => setLanguage("id")}
            >
              🇮🇩 {text.indonesian}
            </button>
            <button
              className={`${styles.langBtn} ${language === "en" ? styles.active : ""}`}
              onClick={() => setLanguage("en")}
            >
              🇬🇧 {text.english}
            </button>
          </div>
        </section>

        {/* Change Password */}
        <section className={styles.card}>
          <h2>
            <KeyRound size={20} />
            {text.changePassword}
          </h2>

          <form onSubmit={handlePasswordChange} className={styles.form}>
            {/* Current Password */}
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword">
                <Shield size={16} />
                {text.currentPassword}
              </label>
              <div className={styles.passwordWrap}>
                <input
                  id="currentPassword"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={text.passwordPlaceholder}
                  className={styles.input}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowCurrentPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">
                <KeyRound size={16} />
                {text.newPassword}
              </label>
              <div className={styles.passwordWrap}>
                <input
                  id="newPassword"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={text.passwordPlaceholder}
                  className={styles.input}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNewPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">
                <CheckCircle2 size={16} />
                {text.confirmPassword}
              </label>
              <div className={styles.passwordWrap}>
                <input
                  id="confirmPassword"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={text.passwordPlaceholder}
                  className={`${styles.input} ${
                    confirmPassword && confirmPassword !== newPassword
                      ? styles.inputError
                      : ""
                  }`}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {passwordError && (
              <p className={styles.errorMsg}>{passwordError}</p>
            )}

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={
                passwordSaving ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {passwordSaving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  {text.passwordSaving}
                </>
              ) : passwordSaved ? (
                <>
                  <CheckCircle2 size={16} />
                  {text.passwordSaved}
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  {text.passwordSave}
                </>
              )}
            </button>
          </form>
        </section>

        {/* Logout Section */}
        <section className={styles.card}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={styles.btnDanger}
          >
            <LogOut size={18} />
            {text.logout}
          </button>
        </section>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className={styles.modal} onClick={() => setShowLogoutConfirm(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3>{text.logoutConfirm}</h3>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={styles.btnSecondary}
                >
                  {text.cancel}
                </button>
                <button onClick={handleLogout} className={styles.btnDanger}>
                  {text.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
