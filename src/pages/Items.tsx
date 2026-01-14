import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService, type Item } from '../services/api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useI18n } from '../contexts/I18nContext';
import FilterSidebar from '../components/FilterSidebar';
import ItemsGrid from '../components/ItemsGrid';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';

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
  const { t } = useI18n();
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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const sections = await apiService.getHomeSections();
        const itemsSection = sections.find(
          (section) => section.type === 'items' && section.style?.card_style
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
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== null && value !== '');
  }, [filters]);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);

      try {
        let data: Item[] = [];

        if (isFeatured) {
          data = await apiService.getFeaturedItems();
        } else if (hasActiveFilters) {
          data = await apiService.filterItems({
            categoryId: filters.category,
            subcategoryId: filters.subcategory,
            listingType: filters.listingType,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            verified: filters.verified,
            city: filters.city,
            state: filters.state,
            perPage: 60,
          });
        } else {
          data = await apiService.getItems(undefined, undefined, undefined, undefined, 60);
        }

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load items:', err);
        setItems([]);
        setError(translate('something_went_wrong', 'Something went wrong. Please try again.'));
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [filters, hasActiveFilters, isFeatured, t]);

  const title = isFeatured ? translate('featured_items', 'Featured Items') : t('items');
  const browseLabel = translate('browse', 'Browse');
  const emptyLabel = translate('no_items_found', 'No items found.');

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
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500">{error}</p>
              </div>
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
