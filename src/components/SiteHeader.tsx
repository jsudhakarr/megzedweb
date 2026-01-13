import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, PlusCircle, Store, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import LanguageButton from './LanguageButton';
import LoginModal from './LoginModal';
import { apiService, type Category, type Subcategory } from '../services/api';

interface SiteHeaderProps {
  showLogout?: boolean;
}

export default function SiteHeader({ showLogout = true }: SiteHeaderProps) {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<
    Record<number, Subcategory[]>
  >({});
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const appName = settings?.appname
    ? settings.appname.split(' - ')[0]
    : settings?.name || 'Megzed';
  const appLogoUrl = settings?.logo?.url || null;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  const loadSubcategories = async (categoryId: number) => {
    if (subcategoriesByCategory[categoryId]) {
      return;
    }
    setLoadingCategoryId(categoryId);
    try {
      const data = await apiService.getSubcategories(categoryId);
      setSubcategoriesByCategory((prev) => ({ ...prev, [categoryId]: data }));
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    } finally {
      setLoadingCategoryId(null);
    }
  };

  const handleCategoryEnter = (categoryId: number) => {
    setActiveCategoryId(categoryId);
    void loadSubcategories(categoryId);
  };

  const handleAddProperty = () => {
    if (!user) setLoginOpen(true);
    else navigate('/dashboard/items/create');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
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

                  {showLogout && (
                    <button
                      onClick={handleLogout}
                      className="text-slate-500 hover:text-red-600 font-medium px-2"
                    >
                      {t('logout')}
                    </button>
                  )}
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

        {categories.length > 0 && (
          <div
            className="border-t border-slate-200 bg-white/70 backdrop-blur"
            onMouseLeave={() => setActiveCategoryId(null)}
          >
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="relative">
                <ul className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
                  {categories.map((category) => (
                    <li key={category.id} className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => handleCategoryEnter(category.id)}
                        onFocus={() => handleCategoryEnter(category.id)}
                        onClick={() => navigate(`/items?category=${category.id}`)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeCategoryId === category.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span>{category.name}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>

                      {activeCategoryId === category.id && (
                        <div className="absolute left-0 top-full z-40 mt-2 w-[min(620px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white shadow-xl">
                          <div className="flex items-start gap-6 p-5">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-slate-900">
                                {category.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                Browse popular subcategories
                              </p>
                            </div>
                            {category.icon?.url && (
                              <img
                                src={category.icon.url}
                                alt={category.name}
                                className="w-10 h-10 object-contain"
                              />
                            )}
                          </div>
                          <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                            {loadingCategoryId === category.id ? (
                              <div className="text-sm text-slate-500">Loading...</div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(subcategoriesByCategory[category.id] || []).map((sub) => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/items?category=${category.id}&subcategory=${sub.id}`,
                                      )
                                    }
                                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900"
                                  >
                                    {sub.icon?.thumbnail ? (
                                      <img
                                        src={sub.icon.thumbnail}
                                        alt={sub.name}
                                        className="w-6 h-6 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: primaryColor }}
                                      />
                                    )}
                                    <span className="truncate">{sub.name}</span>
                                  </button>
                                ))}
                                {!subcategoriesByCategory[category.id]?.length && (
                                  <div className="text-sm text-slate-500">
                                    No subcategories available.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
