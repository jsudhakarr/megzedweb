import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';

import { QrCode, Heart, Bell, MessageCircle } from 'lucide-react';

import SearchBox from '../components/SearchBox';
import CategoryGrid from '../components/CategoryGrid';
import { buildItemsCentralUrl } from '../utils/navigation';
import { writeFiltersToUrl } from '../utils/filters';
import type { UsersFiltersState, ShopsFiltersState } from '../types/filters';
import ItemsGrid from '../components/ItemsGrid';
import FilterSidebar from '../components/FilterSidebar';
import LocationPicker from '../components/LocationPicker';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import AppLoader from '../components/AppLoader';

import UsersSlider from '../components/UsersSlider';
import HomeSlider from '../components/HomeSlider';
import HomeAdSection from '../components/HomeAdSection';
import ShopsGrid from '../components/ShopsGrid';
import ShopCard from '../components/ShopCard';
import SiteHeader from '../components/SiteHeader';
import { apiService, type HomeSectionResolved, type Category } from '../services/api';

import type { Subcategory } from '../types/category';

const ScanQrModal = lazy(() => import('../components/ScanQrModal'));

const cachedHomeSectionsByLang: Record<string, HomeSectionResolved[] | undefined> = {};
const cachedHomeSectionsByLocation: Record<string, HomeSectionResolved[] | undefined> = {};

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

const defaultFilters: FilterState = {
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
};

const getLocationKey = (filters: FilterState) =>
  JSON.stringify({
    city: filters.city,
    state: filters.state,
    lat: filters.lat,
    lng: filters.lng,
    distance: filters.distance,
  });

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { t, lang } = useI18n();

  const [loginOpen, setLoginOpen] = useState(false);

  // ✅ NEW scan modal state
  const [scanOpen, setScanOpen] = useState(false);

  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const selectedSubcategoryId = selectedSubcategory?.id ?? null;

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const locationParams = useMemo(
    () => ({
      city: filters.city,
      state: filters.state,
      lat: filters.lat,
      lng: filters.lng,
      distance: filters.distance,
    }),
    [filters.city, filters.state, filters.lat, filters.lng, filters.distance]
  );
  const locationKey = useMemo(
    () => getLocationKey(filters),
    [filters.city, filters.state, filters.lat, filters.lng, filters.distance]
  );
  const homeCacheKey = useMemo(
    () => `${lang || 'en'}:${locationKey}`,
    [lang, locationKey]
  );
  const [homeSections, setHomeSections] = useState<HomeSectionResolved[]>(
    () => cachedHomeSectionsByLocation[homeCacheKey] ?? cachedHomeSectionsByLang[lang] ?? []
  );
  const [sectionsLoading, setSectionsLoading] = useState(
    cachedHomeSectionsByLocation[homeCacheKey] === undefined &&
      cachedHomeSectionsByLang[lang] === undefined
  );
  const [isSearchActive, setIsSearchActive] = useState(false);

  const handleSubcategorySelect = (subcategory: Subcategory, category: Category) => {
    setSelectedSubcategory(subcategory);
    setFilters((prev) => ({
      ...prev,
      category: category.id,
      subcategory: subcategory.id,
    }));
    navigate(
      buildItemsCentralUrl({
        categoryId: category.id,
        subcategoryId: subcategory.id,
      })
    );
  };

  const handleClearFilter = () => {
    setSelectedSubcategory(null);
    setFilters(defaultFilters);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleAuthNavigation = (path: string) => {
    if (!user) setLoginOpen(true);
    else navigate(path);
  };

  const primaryColor = settings?.primary_color || '#0073f0';

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
        return buildItemsCentralUrl({ featured: true });
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
        const filter = section.data_source?.filter ?? 'all';
        if (filter === 'featured') return buildItemsCentralUrl({ featured: true });
        if (filter === 'most_viewed') return buildItemsCentralUrl({ sort: 'most_viewed' });
        if (filter === 'most_favorited') return buildItemsCentralUrl({ sort: 'most_favorited' });
        if (filter === 'most_liked') return buildItemsCentralUrl({ sort: 'most_liked' });
        if (filter === 'category' && section.data_source?.source_id) {
          return buildItemsCentralUrl({ categoryId: Number(section.data_source.source_id) });
        }
        return '/items';
      }
      case 'shops': {
        const filter = section.data_source?.filter ?? 'all';
        const baseFilters: ShopsFiltersState = {
          q: '',
          sort: '',
          page: 1,
          per_page: 24,
          city: '',
          lat: '',
          lng: '',
          km: '',
          verified: filter === 'verified' || filter === 'has_active_items_verified',
          top_rated: filter === 'top_rated' || filter === 'has_active_items_top_rated',
          has_active_items:
            filter === 'has_active_items' ||
            filter === 'has_active_items_verified' ||
            filter === 'has_active_items_top_rated' ||
            filter === 'only_sellers',
        };
        const query = writeFiltersToUrl(baseFilters).toString();
        return query ? `/shops?${query}` : '/shops';
      }
      case 'users': {
        const filter = section.data_source?.filter ?? 'all';
        const baseFilters: UsersFiltersState = {
          q: '',
          sort: '',
          page: 1,
          per_page: 24,
          city: '',
          lat: '',
          lng: '',
          km: '',
          verified: filter === 'verified' || filter === 'only_sellers_verified',
          top_rated: filter === 'top_rated' || filter === 'only_sellers_top_rated',
          only_sellers:
            filter === 'only_sellers' ||
            filter === 'only_sellers_verified' ||
            filter === 'only_sellers_top_rated',
        };
        const query = writeFiltersToUrl(baseFilters).toString();
        return query ? `/users?${query}` : '/users';
      }
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
    const cachedSections = cachedHomeSectionsByLocation[homeCacheKey];
    if (cachedSections) {
      setHomeSections(cachedSections);
      setSectionsLoading(false);
      return;
    }

    const loadSections = async () => {
      setSectionsLoading(true);
      try {
        const sections = await apiService.getFrontWebSections();
        const resolvedResults = await Promise.allSettled(
          sections.map((section) => apiService.resolveHomeSection(section, locationParams))
        );

        const resolvedSections = resolvedResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          return { ...sections[index], resolvedData: {} } as HomeSectionResolved;
        });

        cachedHomeSectionsByLocation[homeCacheKey] = resolvedSections;
        cachedHomeSectionsByLang[lang] = resolvedSections;
        setHomeSections(resolvedSections);
      } catch (error) {
        console.error('Failed to load home sections:', error);
        cachedHomeSectionsByLocation[homeCacheKey] = [];
        cachedHomeSectionsByLang[lang] = [];
        setHomeSections([]);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadSections();
  }, [homeCacheKey, locationParams, lang]);

  useEffect(() => {
    const warmCategoryData = async () => {
      await Promise.allSettled([apiService.getCategories(), apiService.getSubcategories()]);
    };

    warmCategoryData();
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

  const renderHeroSkeleton = () => (
    <div className="grid gap-6 mb-8 lg:grid-cols-2">
      <div className={`h-72 sm:h-80 lg:h-[420px] ${shimmerBaseClass}`} />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
        <div className="space-y-3 mb-5">
          <div className={`h-7 w-2/3 ${shimmerBaseClass}`} />
          <div className={`h-4 w-4/5 ${shimmerBaseClass}`} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((__, index) => (
            <div key={`hero-action-${index}`} className={`h-16 rounded-xl ${shimmerBaseClass}`} />
          ))}
        </div>
        <div className={`h-12 rounded-2xl ${shimmerBaseClass}`} />
      </div>
    </div>
  );

  const normalizeCardStyle = (style?: string) => {
    if (!style) return 'default';
    const normalized = style.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['style1', 'listcard1', 'list_card_1', '1'].includes(normalized)) return 'list_card_1';
    if (['style2', 'listcard2', 'list_card_2', '2'].includes(normalized)) return 'list_card_2';
    if (['gridcard1', 'grid_card_1'].includes(normalized)) return 'grid_card_1';
    if (['gridcard2', 'grid_card_2'].includes(normalized)) return 'grid_card_2';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <SiteHeader
        locationPicker={
          <LocationPicker
            primaryColor={primaryColor}
            city={filters.city}
            state={filters.state}
            onLocationChange={(city, state, lat, lng, distance) => {
              setFilters((prev) => ({ ...prev, city, state, lat, lng, distance }));
            }}
          />
        }
      />

      {/* MAIN CONTENT */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HERO SLIDER + SEARCH */}
        {sectionsLoading ? (
          renderHeroSkeleton()
        ) : (
          <div
            className={`grid gap-6 mb-8 ${
              hasSlider && !isSearchActive ? 'lg:grid-cols-2' : ''
            }`}
          >
            {hasSlider && !isSearchActive && (
              <HomeSlider primaryColor={primaryColor} slides={sliderSlides} />
            )}
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
              <SearchBox
                primaryColor={primaryColor}
                containerClassName="max-w-none mx-0"
                onSearchActiveChange={setIsSearchActive}
              />
            </div>
          </div>
        )}

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
                  onClick={() =>
                    navigate(
                      buildItemsCentralUrl({
                        categoryId: filters.category ?? undefined,
                        subcategoryId: selectedSubcategory.id,
                      })
                    )
                  }
                  className="text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  {t('view_all')}
                </button>
              </div>

              <ItemsGrid
                primaryColor={primaryColor}
                categoryId={filters.category}
                subcategoryId={filters.subcategory ?? selectedSubcategory.id}
                subcategoryName={selectedSubcategory.name}
                onClearFilter={handleClearFilter}
                showFilters
                listingType={filters.listingType}
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                verified={filters.verified}
                city={filters.city}
                state={filters.state}
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
                          selectedSubcategoryId={selectedSubcategoryId}
                        />
                      </div>
                    </section>
                  );
                }

                if (section.type === 'items') {
                  const items = section.resolvedData.items ?? [];
                  const resolvedCardStyle = normalizeCardStyle(section.style?.card_style ?? undefined);
                  const isListCardStyle =
                    resolvedCardStyle === 'list_card_1' || resolvedCardStyle === 'list_card_2';
                  const isGridCardStyle =
                    resolvedCardStyle === 'grid_card_1' || resolvedCardStyle === 'grid_card_2';
                  const forceGridLayout = isListCardStyle || isGridCardStyle;
                  const useSliderLayout =
                    !forceGridLayout &&
                    (section.layout === 'list' || (resolvedCardStyle === 'default' && items.length > 5));
                  const gridColumns = isGridCardStyle ? 4 : isListCardStyle ? 3 : undefined;
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
                          listVariant={forceGridLayout ? 'stacked' : undefined}
                          gridColumns={gridColumns}
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
      <Suspense fallback={<AppLoader label="Loading scanner..." />}>
        <ScanQrModal
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          primaryColor={primaryColor}
        />
      </Suspense>
    </div>
  );
}
