import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getLanguages, getTranslations } from "../services/api";
import enTranslations from "../assets/translations/en.json";
import teTranslations from "../assets/translations/te.json";

/* ---------------- TYPES ---------------- */

type Language = {
  code: string;
  name: string;
};

type I18nContextType = {
  t: (key: string) => string;
  lang: string;
  languages: Language[];
  setLang: (lang: string) => void;
  loading: boolean;
};

/* ---------------- CONTEXT ---------------- */

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<string>(
    () => localStorage.getItem("lang") || "en"
  );
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const localTranslations: Record<string, Record<string, string>> = {
    en: enTranslations,
    te: teTranslations,
  };

  /* ---------- change language ---------- */
  const setLang = (l: string) => {
    const nextLang = l.trim() || "en";
    if (nextLang === lang) return;
    setLangState(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  /* ---------- load available languages ---------- */
  useEffect(() => {
    getLanguages()
      .then((res) => setLanguages(Array.isArray(res) ? res : []))
      .catch(() => setLanguages([]));
  }, []);

  /* ---------- load + cache translations ---------- */
  useEffect(() => {
    const cacheKey = `translations_${lang}`;

    // ✅ 1. Instant load from cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setTranslations(JSON.parse(cached));
      return;
    }

    // ✅ 2. Fetch from API only once
    setLoading(true);
    const fallbackTranslations = localTranslations[lang] ?? {};
    if (Object.keys(fallbackTranslations).length > 0) {
      setTranslations(fallbackTranslations);
    }
    getTranslations(lang)
      .then((keys) => {
        const data = keys?.data ?? keys ?? {};
        const normalized =
          data && typeof data === "object" ? (data as Record<string, string>) : {};
        const finalTranslations =
          Object.keys(normalized).length > 0 ? normalized : fallbackTranslations;
        setTranslations(finalTranslations);
        localStorage.setItem(cacheKey, JSON.stringify(finalTranslations));
      })
      .catch(() => setTranslations({}))
      .finally(() => setLoading(false));
  }, [lang]);

  /* ---------- translate function ---------- */
  const t = useMemo(
    () => (key: string) => translations[key] ?? key,
    [translations]
  );

  return (
    <I18nContext.Provider
      value={{
        t,
        lang,
        languages,
        setLang,
        loading,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return ctx;
};
