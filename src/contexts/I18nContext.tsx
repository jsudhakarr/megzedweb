import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getLanguages, getTranslations } from "../services/api";

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

  /* ---------- change language ---------- */
  const setLang = (l: string) => {
    setLangState(l);
    localStorage.setItem("lang", l);
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
    getTranslations(lang)
      .then((keys) => {
        const data = keys || {};
        setTranslations(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
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
