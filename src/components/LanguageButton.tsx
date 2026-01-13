import { Globe, ChevronDown } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

export default function LanguageButton() {
  const { lang, languages, setLang, loading } = useI18n();

  const current = languages.find((l) => l.code === lang);

  return (
    <div className="relative flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition">
      <Globe className="w-5 h-5 text-slate-600" />

      {/* Current language code */}
      <span className="text-sm font-semibold text-slate-700 uppercase">
        {current?.code || lang}
      </span>

      <ChevronDown className="w-4 h-4 text-slate-500" />

      {/* Invisible select on top */}
      <select
        value={lang}
        disabled={loading}
        onChange={(e) => setLang(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Select language"
      >
        {(languages || []).map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}
