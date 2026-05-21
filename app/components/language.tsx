"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";

export type Language = "id" | "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("simply_language");
    if (saved === "en") setLanguage("en");
    else if (saved === "id") setLanguage("id");
    else if (window.navigator.language.toLowerCase().startsWith("en")) setLanguage("en");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) window.localStorage.setItem("simply_language", language);
  }, [language, mounted]);

  const value = useMemo(() => ({ language, setLanguage, mounted }), [language, mounted]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage, mounted } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mounted) return;
    const activeBtn = container.querySelector(`[data-lang="${language}"]`) as HTMLButtonElement;
    if (activeBtn) {
      setIndicatorStyle({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth });
    }
  }, [language, mounted]);

  if (!mounted) return null;

  return (
    <div className="lang-switcher" ref={containerRef} role="group" aria-label="Language switcher">
      <span
        className="lang-indicator"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
      <button type="button" data-lang="id" className={language === "id" ? "active" : ""} onClick={() => setLanguage("id")}>
        🇮🇩 ID
      </button>
      <button type="button" data-lang="en" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
        🇬🇧 EN
      </button>
    </div>
  );
}
