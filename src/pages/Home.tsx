import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';

import {
  User as UserIcon,
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
import LanguageButton from '../components/LanguageButton';
import ScanQrModal from '../components/ScanQrModal';
import UsersSlider from '../components/UsersSlider';
import HomeSlider from '../components/HomeSlider';
import HomeAdSection from '../components/HomeAdSection';
import ShopsGrid from '../components/ShopsGrid';
import ShopCard from '../components/ShopCard';
import { apiService, type HomeSectionResolved } from '../services/api';

import type { Subcategory } from '../types/category';

let cachedHomeSections: HomeSectionResolved[] | null = null;

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
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { t } = useI18n();

  const [loginOpen, setLoginOpen] = useState(false);

  // ✅ NEW scan modal state
  const [scanOpen, setScanOpen] = useState(false);

  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [homeSections, setHomeSections] = useState<HomeSectionResolved[]>(
    () => cachedHomeSections ?? []
  );
  const [sectionsLoading, setSectionsLoading] = useState(cachedHomeSections === null);

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
  const resolveRoute = (routeKey?: string | null) => {
    if (!routeKey) return null;
    switch (routeKey) {
      case 'categories':
        return '/categories';
      case 'featured_items':
        return '/items?filter=featured';
      case 'all_items':
        return '/items';
      case 'all_shops':
        return '/shops';
      case 'all_users':
        return '/users';
      default:
        return routeKey.startsWith('/') ? routeKey : `/${routeKey}`;
    }
  };

  const resolveViewAllRoute = (section: HomeSectionResolved) => {
    const explicitRoute = resolveRoute(section.view_all?.route_key || null);
    if (explicitRoute) return explicitRoute;

    switch (section.type) {
      case 'categories':
        return '/categories';
      case 'items': {
        if (section.data_source?.filter === 'featured') return '/items?filter=featured';
        return '/items';
      }
      case 'shops':
        return '/shops';
      case 'users':
        return '/users';
      default:
        return null;
    }
  };

  const headerStyles = (section: HomeSectionResolved) => ({
    title: { color: section.style?.title_color || '#0f172a' },
    subtitle: { color: section.style?.subtitle_color || '#64748b' },
    viewAll: { color: section.style?.view_all_color || '#2563eb' },
  });

  const sectionWrapperClass = (section: HomeSectionResolved) =>
    `${section.style?.show_divider ? 'border-t border-b border-slate-200' : ''} py-6`;
  const sectionHeaderClass = 'flex items-start justify-between gap-4 mb-3';
  const sectionTitleWrapperClass = 'space-y-1';

  useEffect(() => {
    if (cachedHomeSections) {
      setSectionsLoading(false);
      return;
    }

    const loadSections = async () => {
      setSectionsLoading(true);
      try {
        const sections = await apiService.getFrontWebSections();
        const resolvedResults = await Promise.allSettled(
          sections.map((section) => apiService.resolveHomeSection(section))
        );

        const resolvedSections = resolvedResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          return { ...sections[index], resolvedData: {} } as HomeSectionResolved;
        });

        cachedHomeSections = resolvedSections;
        setHomeSections(resolvedSections);
      } catch (error) {
        console.error('Failed to load home sections:', error);
        cachedHomeSections = [];
        setHomeSections([]);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadSections();
  }, []);

  const dynamicSections = useMemo<HomeSectionResolved[]>(() => {
    if (!homeSections.length) return [];
    return homeSections.filter((section) => section.type !== 'slider');
  }, [homeSections]);

  const sliderSection = useMemo(
    () => homeSections.find((section) => section.type === 'slider'),
    [homeSections]
  );

  const hasSlider = Boolean(sliderSection);

  const sliderSlides = useMemo(() => {
    if (!sliderSection) return undefined;
    const data = sliderSection.resolvedData.slides ?? [];
    return data.length > 0 ? data : undefined;
  }, [sliderSection]);

  const shimmerBaseClass =
    'animate-pulse rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200';

  const renderSectionSkeletons = () => (
    <div>
      {Array.from({ length: 3 }).map((_, index) => (
        <section key={`section-skeleton-${index}`} className="py-4">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className={`h-6 w-44 ${shimmerBaseClass}`} />
                <div className={`h-4 w-64 ${shimmerBaseClass}`} />
              </div>
              <div className={`h-4 w-16 ${shimmerBaseClass}`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((__, cardIndex) => (
                <div
                  key={`section-skeleton-${index}-card-${cardIndex}`}
                  className={`h-40 ${shimmerBaseClass}`}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
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
        <div className={`grid gap-6 mb-8 ${hasSlider ? 'lg:grid-cols-2' : ''}`}>
          {hasSlider && <HomeSlider primaryColor={primaryColor} slides={sliderSlides} />}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h2>
            <p className="text-sm text-slate-500 mb-5 text-center">
              Discover fresh listings curated for you and your location.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 mb-5">
              <button
                onClick={() => setScanOpen(true)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 transition-colors"
                title="Scan View details"
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-semibold">Scan View details</span>
              </button>

              <button
                onClick={() => handleAuthNavigation('/dashboard/chat')}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 transition-colors"
                title={t('messages')}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-semibold">{t('messages')}</span>
              </button>

              <button
                onClick={() => handleAuthNavigation('/dashboard/likes')}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 transition-colors"
                title={t('favorites')}
              >
                <Heart className="w-5 h-5" />
                <span className="text-xs font-semibold">{t('favorites')}</span>
              </button>

              <button
                onClick={() => handleAuthNavigation('/dashboard/notifications')}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 transition-colors relative"
                title={t('notifications')}
              >
                <Bell className="w-5 h-5" />
                <span className="text-xs font-semibold">{t('notifications')}</span>
                {user && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>
            </div>
            <SearchBox primaryColor={primaryColor} containerClassName="max-w-none mx-0" />
          </div>
        </div>

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
          <div>
            {sectionsLoading && (
              <div className="py-6">{renderSectionSkeletons()}</div>
            )}

            {!sectionsLoading &&
              dynamicSections.map((section) => {
                const styles = headerStyles(section);
                const viewAllRoute = resolveViewAllRoute(section);
                const backgroundColor = section.style?.background_color || '#ffffff';
                const itemCount = section.item_count || undefined;
                if (section.type === 'categories') {
                  const categories = section.resolvedData.categories ?? [];
                  const categoriesOverride = categories.length ? categories : undefined;
                  return (
                    <section
                      key={section.id}
                      className={sectionWrapperClass(section)}
                      style={{ backgroundColor }}
                    >
                      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={sectionHeaderClass}>
                          <div className={sectionTitleWrapperClass}>
                            <h2
                              className="text-xl sm:text-2xl font-bold leading-tight"
                              style={styles.title}
                            >
                              {section.title || t('categories')}
                            </h2>
                            {section.subtitle && (
                              <p className="text-sm" style={styles.subtitle}>
                                {section.subtitle}
                              </p>
                            )}
                          </div>
                          {section.view_all?.enabled && viewAllRoute && (
                            <button
                              type="button"
                              onClick={() => navigate(viewAllRoute)}
                              className="text-sm sm:text-base font-semibold transition"
                              style={styles.viewAll}
                            >
                              {t('view_all')}
                            </button>
                          )}
                        </div>

                        <CategoryGrid
                          primaryColor={primaryColor}
                          categories={categoriesOverride}
                          onSubcategorySelect={handleSubcategorySelect}
                          selectedSubcategoryId={selectedSubcategory?.id}
                        />
                      </div>
                    </section>
                  );
                }

                if (section.type === 'items') {
                  const items = section.resolvedData.items ?? [];
                  const useSliderLayout = section.layout === 'list' || items.length > 5;
                  return (
                    <section
                      key={section.id}
                      className={sectionWrapperClass(section)}
                      style={{ backgroundColor }}
                    >
                      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={sectionHeaderClass}>
                          <div className={sectionTitleWrapperClass}>
                            <h2
                              className="text-xl sm:text-2xl font-bold leading-tight"
                              style={styles.title}
                            >
                              {section.title || t('featured_properties')}
                            </h2>
                            {section.subtitle && (
                              <p className="text-sm" style={styles.subtitle}>
                                {section.subtitle}
                              </p>
                            )}
                          </div>
                          {section.view_all?.enabled && viewAllRoute && (
                            <button
                              type="button"
                              onClick={() => navigate(viewAllRoute)}
                              className="text-sm sm:text-base font-semibold transition"
                              style={styles.viewAll}
                            >
                              {t('view_all')}
                            </button>
                          )}
                        </div>

                        <ItemsGrid
                          primaryColor={primaryColor}
                          items={items}
                          limit={itemCount}
                          layout={useSliderLayout ? 'list' : 'grid'}
                          cardStyle={section.style?.card_style ?? undefined}
                        />
                      </div>
                    </section>
                  );
                }

                if (section.type === 'shops') {
                  const shops = section.resolvedData.shops ?? [];
                  const limitedShops = itemCount ? shops.slice(0, itemCount) : shops;

                  if (!limitedShops.length) return null;

                  return (
                    <section
                      key={section.id}
                      className={sectionWrapperClass(section)}
                      style={{ backgroundColor }}
                    >
                      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={sectionHeaderClass}>
                          <div className={sectionTitleWrapperClass}>
                            <h2
                              className="text-xl sm:text-2xl font-bold leading-tight"
                              style={styles.title}
                            >
                              {section.title || featuredHeading}
                            </h2>
                            {section.subtitle && (
                              <p className="text-sm" style={styles.subtitle}>
                                {section.subtitle}
                              </p>
                            )}
                          </div>
                          {section.view_all?.enabled && viewAllRoute && (
                            <button
                              type="button"
                              onClick={() => navigate(viewAllRoute)}
                              className="text-sm sm:text-base font-semibold transition"
                              style={styles.viewAll}
                            >
                              {t('view_all')}
                            </button>
                          )}
                        </div>

                        {section.layout === 'list' ? (
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {limitedShops.map((shop) => (
                              <ShopCard key={shop.id} shop={shop} accentColor={primaryColor} />
                            ))}
                          </div>
                        ) : (
                          <ShopsGrid primaryColor={primaryColor} shops={limitedShops} />
                        )}
                      </div>
                    </section>
                  );
                }

                if (section.type === 'users') {
                  const users = section.resolvedData.users ?? [];
                  return (
                    <UsersSlider
                      key={section.id}
                      primaryColor={primaryColor}
                      users={itemCount ? users.slice(0, itemCount) : users}
                      title={section.title || t('nearby_users')}
                      subtitle={section.subtitle}
                      viewAllRoute={viewAllRoute || '/users'}
                      styleConfig={{
                        backgroundColor,
                        titleColor: section.style?.title_color,
                        subtitleColor: section.style?.subtitle_color,
                        viewAllColor: section.style?.view_all_color,
                        showDivider: section.style?.show_divider,
                      }}
                    />
                  );
                }

                if (section.type === 'ad') {
                  return (
                    <HomeAdSection
                      key={section.id}
                      ad={section.ad_config || {}}
                      backgroundColor={backgroundColor}
                      showDivider={section.style?.show_divider}
                    />
                  );
                }

                return null;
              })}
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
