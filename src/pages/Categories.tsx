import { useState } from 'react';
import { ArrowLeft, PlusCircle, Store, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import CategoryGrid from '../components/CategoryGrid';
import Footer from '../components/Footer';
import LanguageButton from '../components/LanguageButton';
import LoginModal from '../components/LoginModal';

export default function Categories() {
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const appName = settings?.name || 'Megzed';
  const appLogoUrl = settings?.logo?.url || null;
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const browseLabel = translate('browse', 'Browse');
  const title = translate('categories', 'Categories');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddProperty = () => {
    if (!user) setLoginOpen(true);
    else navigate('/dashboard/items/create');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ backgroundColor: settings?.secondary_color || '#ffffff' }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {appLogoUrl ? (
                  <img src={appLogoUrl} alt={appName} className="h-10 w-auto object-contain" />
                ) : (
                  <Store className="w-8 h-8" style={{ color: primaryColor }} />
                )}
                <h1 className="text-2xl font-bold text-slate-900 hidden sm:block">{appName}</h1>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <LanguageButton />
              </div>

              <button
                onClick={handleAddProperty}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white shadow-sm hover:shadow-md transition-all transform active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                <PlusCircle className="w-5 h-5" />
                <span>Post now</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2 pl-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors"
                    title={t('my_dashboard')}
                  >
                    {user.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-slate-200 object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <UserIcon className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-600 font-medium px-2"
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-2">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="px-4 py-2 text-slate-700 font-bold hover:text-slate-900 transition-colors"
                  >
                    {t('login')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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

        <CategoryGrid
          primaryColor={primaryColor}
          onSubcategorySelect={(subcategory, category) =>
            navigate(`/items?category=${category.id}&subcategory=${subcategory.id}`)
          }
        />
      </div>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
