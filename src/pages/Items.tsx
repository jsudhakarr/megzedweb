import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type Item } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import FilterSidebar from '../components/FilterSidebar';
import ItemsGrid from '../components/ItemsGrid';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import ErrorState from '../components/ui/ErrorState';
import { apiClient } from '../services/apiClient';
import { getUserMessage } from '../services/apiError';
import { useApi } from '../hooks/useApi';

interface FilterState {
  category: number | null;
  subcategory: number | null;
  listingType: string | null;
  minPrice: string;
  maxPrice: string;
  verified: boolean | null;
  city: string | null;
  state: string | null;
}

const parseNumberParam = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function Items() {
  const { settings } = useAppSettings();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const primaryColor = settings?.primary_color || '#0ea5e9';
  const filterParam = searchParams.get('filter');
  const isFeatured = filterParam === 'featured';

  const initialFilters = useMemo<FilterState>(() => {
    const category = parseNumberParam(searchParams.get('category'));
    const subcategory = parseNumberParam(searchParams.get('subcategory'));
    return {
      category,
      subcategory,
      listingType: null,
      minPrice: '',
      maxPrice: '',
      verified: null,
      city: null,
      state: null,
    };
  }, [searchParams]);
  const filterSidebarKey = `${initialFilters.category ?? 'all'}-${initialFilters.subcategory ?? 'all'}`;

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [itemsCardStyle, setItemsCardStyle] = useState<string | undefined>(undefined);

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    let isMounted = true;
    const loadCardStyle = async () => {
      try {
        const response = await apiClient.request<any>('/front-web/sections', {
          params: { lang },
        });
        const sections = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];
        const itemsSection = sections.find(
          (section: { type?: string; style?: { card_style?: string } }) =>
            section.type === 'items' && section.style?.card_style
        );
        if (isMounted) {
          setItemsCardStyle(itemsSection?.style?.card_style ?? undefined);
        }
      } catch (err) {
        console.warn('Failed to load items card style:', err);
      }
    };

    loadCardStyle();
    return () => {
      isMounted = false;
    };
  }, [lang]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== null && value !== '');
  }, [filters]);

  const normalizeItems = useCallback((payload: any): Item[] => {
    if (Array.isArray(payload?.data)) return payload.data as Item[];
    if (Array.isArray(payload?.data?.data)) return payload.data.data as Item[];
    if (Array.isArray(payload)) return payload as Item[];
    return [];
  }, []);

  const fetchItems = useCallback(async () => {
    if (isFeatured) {
      const response = await apiClient.request<any>('/items/featured', {
        params: { lang },
      });
      return normalizeItems(response);
    }

    if (hasActiveFilters) {
      const params: Record<string, string | number | boolean> = {
        per_page: 60,
        lang,
      };

      if (filters.listingType) params.listing_type = filters.listingType;
      if (filters.minPrice !== '') params.min_price = filters.minPrice;
      if (filters.maxPrice !== '') params.max_price = filters.maxPrice;
      if (filters.verified !== null) params.verified = filters.verified;
      if (filters.city) params.city = filters.city;
      if (filters.state) params.state = filters.state;

      let endpoint = '/items';
      if (filters.subcategory) {
        endpoint = `/items/by-subcategory/${filters.subcategory}`;
      } else if (filters.category) {
        endpoint = `/items/by-category/${filters.category}`;
      }

      const response = await apiClient.request<any>(endpoint, { params });
      return normalizeItems(response);
    }

    const response = await apiClient.request<any>('/items', {
      params: {
        per_page: 60,
        lang,
      },
    });
    return normalizeItems(response);
  }, [filters, hasActiveFilters, isFeatured, lang, normalizeItems]);

  const {
    data: itemsData,
    loading,
    error,
    retry,
  } = useApi(fetchItems, [fetchItems]);

  const title = isFeatured ? translate('featured_items', 'Featured Items') : t('items');
  const browseLabel = translate('browse', 'Browse');
  const emptyLabel = translate('no_items_found', 'No items found.');
  const items = itemsData ?? [];

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

        <div className="flex flex-col lg:flex-row gap-6">
          {!isFeatured && (
            <div className="w-full lg:w-72 flex-shrink-0">
              <FilterSidebar
                key={filterSidebarKey}
                primaryColor={primaryColor}
                onFilterChange={(nextFilters) => setFilters(nextFilters)}
                initialFilters={filters}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <ErrorState
                title={translate('something_went_wrong', 'Something went wrong')}
                message={getUserMessage(error)}
                isOffline={error.code === 'OFFLINE'}
                onRetry={retry}
              />
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500">{emptyLabel}</p>
              </div>
            ) : (
              <ItemsGrid
                primaryColor={primaryColor}
                items={items}
                limit={items.length}
                layout="grid"
                gridColumns={3}
                cardStyle={itemsCardStyle}
              />
            )}
          </div>
        </div>
      </div>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />
    </div>
  );
}
