import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';

import {
  User as UserIcon,
  ShoppingBag,
  Store,
  QrCode,
  Heart,
  Bell,
  PlusCircle,
  MessageCircle,
} from 'lucide-react';

import SearchBox from '../components/SearchBox';
import CategoryGrid from '../components/CategoryGrid';
import ItemsGrid from '../components/ItemsGrid';
import FilterSidebar from '../components/FilterSidebar';
import LocationPicker from '../components/LocationPicker';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';

// ✅ NEW
import ShopsSlider from '../components/ShopsSlider';
import LanguageButton from '../components/LanguageButton';
import ScanQrModal from '../components/ScanQrModal';
import UsersSlider from '../components/UsersSlider';
import HomeSlider from '../components/HomeSlider';

import type { Subcategory } from '../types/category';



interface FilterState {
  category: number | null;
  subcategory: number | null;
  listingType: string | null;
  minPrice: string;
  maxPrice: string;
  verified: boolean | null;
  city: string | null;
  state: string | null;
  lat?: number;
  lng?: number;
  distance?: number;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const { t } = useI18n();

  const [loginOpen, setLoginOpen] = useState(false);

  // ✅ NEW scan modal state
  const [scanOpen, setScanOpen] = useState(false);

  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    category: null,
    subcategory: null,
    listingType: null,
    minPrice: '',
    maxPrice: '',
    verified: null,
    city: null,
    state: null,
    lat: undefined,
    lng: undefined,
    distance: undefined,
  });

  const handleSubcategorySelect = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
  };

  const handleClearFilter = () => {
    setSelectedSubcategory(null);
    setFilters({
      category: null,
      subcategory: null,
      listingType: null,
      minPrice: '',
      maxPrice: '',
      verified: null,
      city: null,
      state: null,
      lat: undefined,
      lng: undefined,
      distance: undefined,
    });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAuthNavigation = (path: string) => {
    if (!user) setLoginOpen(true);
    else navigate(path);
  };

  const handleAddProperty = () => {
    if (!user) setLoginOpen(true);
    else navigate('/dashboard/items/create');
  };

  const primaryColor = settings?.primary_color || '#0073f0';
  const appName = settings?.appname ? settings.appname.split(' - ')[0] : 'Megzed';
  const appLogoUrl = settings?.logo?.url || null;

  const replaceShopWithBusiness = (text: string, fallback: string) => {
    if (!text) return fallback;
    if (text.includes('_')) return fallback;
    const replaced = text.replace(/shop/gi, 'business');
    return replaced.trim() || fallback;
  };

  const featuredHeading = replaceShopWithBusiness(t('featured_shops'), 'Featured Businesses');
  const addBusinessAction = replaceShopWithBusiness(t('add_shop'), 'Add Business');
  const createBusinessAction = replaceShopWithBusiness(
    t('create_new_shop'),
    'Create a new business'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* HEADER */}
      <header
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ backgroundColor: settings?.secondary_color || '#ffffff' }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* LEFT */}
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

              <div className="h-8 w-px bg-slate-300 hidden lg:block"></div>

              <LocationPicker
                primaryColor={primaryColor}
                city={filters.city}
                state={filters.state}
                onLocationChange={(city, state, lat, lng, distance) => {
                  setFilters({ ...filters, city, state, lat, lng, distance });
                }}
              />
            </div>

            {/* RIGHT */}
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
                <span>{t('add_property')}</span>
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

      {/* MAIN CONTENT */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HERO SLIDER + SEARCH */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <HomeSlider primaryColor={primaryColor} />
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Search listings</h2>
            <p className="text-sm text-slate-500 mb-5">
              Find the best deals near you in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 mb-5">
              <button
                onClick={() => setScanOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-md hover:shadow-lg transition-all transform active:scale-95"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 4px 10px ${primaryColor}40`,
                }}
                title={t('scan_qr')}
              >
                <QrCode className="w-4 h-4" />
                <span className="font-semibold text-sm">{t('scan')}</span>
              </button>

              <div className="flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-1">
                <button
                  onClick={() => handleAuthNavigation('/dashboard/chat')}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 hover:text-blue-600"
                  title={t('messages')}
                >
                  <MessageCircle className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleAuthNavigation('/dashboard/likes')}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 hover:text-red-500"
                  title={t('favorites')}
                >
                  <Heart className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleAuthNavigation('/dashboard/notifications')}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 relative"
                  title={t('notifications')}
                >
                  <Bell className="w-5 h-5" />
                  {user && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  )}
                </button>
              </div>
            </div>
            <SearchBox primaryColor={primaryColor} containerClassName="max-w-none mx-0" />
          </div>
        </div>

        {/* CATEGORIES HEADER */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {t('categories')}
          </h2>

          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            {t('view_all')}
          </button>
        </div>

        {/* CATEGORIES GRID */}
        <CategoryGrid
          primaryColor={primaryColor}
          onSubcategorySelect={handleSubcategorySelect}
          selectedSubcategoryId={selectedSubcategory?.id}
        />

        {/* ITEMS */}
        {selectedSubcategory ? (
          <div className="flex gap-6 mb-6 mt-5">
            <div className="w-72 flex-shrink-0 hidden lg:block">
              <FilterSidebar
                primaryColor={primaryColor}
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {selectedSubcategory?.name || t('items')}
                </h2>

                <button
                  type="button"
                  onClick={() => navigate(`/items?subcategory=${selectedSubcategory.id}`)}
                  className="text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  {t('view_all')}
                </button>
              </div>

              <ItemsGrid
                primaryColor={primaryColor}
                subcategoryId={selectedSubcategory.id}
                subcategoryName={selectedSubcategory.name}
                onClearFilter={handleClearFilter}
                showFilters
                lat={filters.lat}
                lng={filters.lng}
                distance={filters.distance}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {t('featured_properties')}
              </h2>

              <button
                type="button"
                onClick={() => navigate(`/items`)}
                className="text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                {t('view_all')}
              </button>
            </div>

            <ItemsGrid
              primaryColor={primaryColor}
              subcategoryId={selectedSubcategory?.id}
              subcategoryName={selectedSubcategory?.name}
              onClearFilter={handleClearFilter}
              showFilters={false}
              lat={filters.lat}
              lng={filters.lng}
              distance={filters.distance}
            />
          </div>
        )}
      </main>

      {/* SHOPS SLIDER */}
      <section
        className="w-screen relative left-1/2 right-1/2 -mx-[50vw] py-8 sm:py-10"
        style={{ backgroundColor: '#0f172a' }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {featuredHeading}
            </h2>

            <button
              type="button"
              onClick={() => navigate('/shops')}
              className="text-sm sm:text-base font-semibold text-white/80 hover:text-white transition"
            >
              {t('view_more')} →
            </button>
          </div>

          <ShopsSlider themeColor={primaryColor} />
        </div>
      </section>

      {/* USERS SLIDER */}
      <UsersSlider primaryColor={primaryColor} />

      {/* BACK TO MAIN WIDTH CONTENT */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {user && (
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{t('quick_actions')}</h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-4 border-2 border-slate-200 rounded-lg transition-all text-left hover:shadow-md"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <UserIcon className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <p className="font-semibold text-slate-900">{t('my_dashboard')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('view_your_account')}</p>
              </button>

              <button
                onClick={() => navigate('/dashboard/items')}
                className="p-4 border-2 border-slate-200 rounded-lg transition-all text-left hover:shadow-md"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ShoppingBag className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <p className="font-semibold text-slate-900">{t('add_item')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('list_new_item')}</p>
              </button>

              <button
                onClick={() => navigate('/dashboard/shops')}
                className="p-4 border-2 border-slate-200 rounded-lg transition-all text-left hover:shadow-md"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
              <Store className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <p className="font-semibold text-slate-900">{addBusinessAction}</p>
                <p className="text-sm text-slate-500 mt-1">{createBusinessAction}</p>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="p-4 border-2 border-slate-200 rounded-lg transition-all text-left hover:shadow-md"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <UserIcon className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <p className="font-semibold text-slate-900">{t('edit_profile')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('update_information')}</p>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ✅ NEW: QR scan modal */}
      <ScanQrModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        primaryColor={primaryColor}
      />
    </div>
  );
}
