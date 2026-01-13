import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Shop } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import Footer from '../components/Footer';
import ShopsGrid from '../components/ShopsGrid';
import SiteHeader from '../components/SiteHeader';

export default function Shops() {
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = settings?.primary_color || '#0ea5e9';

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  useEffect(() => {
    const loadShops = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiService.getShopsIndex({ perPage: 60 });
        setShops(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load shops:', err);
        setShops([]);
        setError(translate('something_went_wrong', 'Something went wrong. Please try again.'));
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, [t]);

  const browseLabel = translate('browse', 'Browse');
  const title = t('businesses');
  const emptyLabel = translate('no_businesses_found', 'No businesses found.');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
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

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500">{error}</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500">{emptyLabel}</p>
            </div>
          ) : (
            <ShopsGrid primaryColor={primaryColor} shops={shops} limit={shops.length} />
          )}
        </div>
      </div>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
    </div>
  );
}
