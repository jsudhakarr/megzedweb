import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import CategoryGrid from '../components/CategoryGrid';

export default function Categories() {
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const navigate = useNavigate();

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const browseLabel = translate('browse', 'Browse');
  const title = translate('categories', 'Categories');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white shadow hover:shadow-md border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <p className="text-sm text-slate-500">{browseLabel}</p>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          </div>
        </div>

        <CategoryGrid
          primaryColor={primaryColor}
          onSubcategorySelect={(subcategory, category) =>
            navigate(`/items?category=${category.id}&subcategory=${subcategory.id}`)
          }
        />
      </div>
    </div>
  );
}
