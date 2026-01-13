import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import SiteHeader from '../components/SiteHeader';
import Footer from '../components/Footer';
import ItemsFilters from '../components/ItemsFilters';
import ItemsResults from '../components/ItemsResults';
import FilterDrawer from '../components/FilterDrawer';
import FilterChips from '../components/FilterChips';
import type { ItemsFiltersState } from '../types/filters';
import { parseItemsFilters, writeFiltersToUrl } from '../utils/filters';
import { buildItemsParams, fetchItemsCentral } from '../services/centralListings';
import { apiService, type Item } from '../services/api';

const defaultFilters: ItemsFiltersState = {
  q: '',
  sort: 'newest',
  page: 1,
  per_page: 10,
  city: '',
  lat: '',
  lng: '',
  km: '',
  category_id: null,
  subcategory_id: null,
  price_min: '',
  price_max: '',
  featured: false,
  promoted: false,
  listing_type: '',
  dynamic_fields: {},
};

export default function ItemsCentralScreen() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0ea5e9';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ItemsFiltersState>(() => {
    const parsedFilters = parseItemsFilters(searchParams);
    return {
      ...defaultFilters,
      ...parsedFilters,
      sort: parsedFilters.sort || defaultFilters.sort,
    };
  });
  const [searchInput, setSearchInput] = useState(filters.q);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [itemsCardStyle, setItemsCardStyle] = useState<string | undefined>(undefined);

  const updateFilters = useCallback((next: Partial<ItemsFiltersState>) => {
    setFilters((prev) => {
      const nextFilters = { ...prev, ...next };
      const updatesKeys = Object.keys(next);
      const onlyPageUpdate = updatesKeys.length === 1 && updatesKeys[0] === 'page';
      if (!onlyPageUpdate && next.page === undefined) {
        nextFilters.page = 1;
      }
      return nextFilters;
    });
  }, []);

  useEffect(() => {
    const parsedFilters = parseItemsFilters(searchParams);
    const nextFilters = {
      ...defaultFilters,
      ...parsedFilters,
      sort: parsedFilters.sort || defaultFilters.sort,
    };
    if (JSON.stringify(nextFilters) !== JSON.stringify(filters)) {
      setFilters(nextFilters);
    }
  }, [filters, searchParams]);

  useEffect(() => {
    const params = writeFiltersToUrl(filters);
    const nextQuery = params.toString();
    if (nextQuery !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  useEffect(() => {
    if (filters.q !== searchInput) {
      setSearchInput(filters.q);
    }
  }, [filters.q, searchInput]);

  useEffect(() => {
    if (searchInput === filters.q) return;
    const timeout = window.setTimeout(() => {
      updateFilters({ q: searchInput });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [filters.q, searchInput, updateFilters]);

  const requestParams = useMemo(() => buildItemsParams(filters), [filters]);
  const queryKey = useMemo(() => JSON.stringify(requestParams), [requestParams]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchItemsCentral(filters, { signal: controller.signal });
        if (isActive) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Failed to load items:', err);
        if (isActive) {
          setItems([]);
          setError('Something went wrong. Please try again.');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadItems();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [queryKey]);

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

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const chips = useMemo(() => {
    const nextChips = [] as { key: string; label: string; onRemove: () => void }[];
    if (filters.q) {
      nextChips.push({
        key: 'q',
        label: `Search: ${filters.q}`,
        onRemove: () => updateFilters({ q: '', page: 1 }),
      });
    }
    if (filters.sort) {
      nextChips.push({
        key: 'sort',
        label: `Sort: ${filters.sort.replace(/_/g, ' ')}`,
        onRemove: () => updateFilters({ sort: '', page: 1 }),
      });
    }
    if (filters.category_id) {
      nextChips.push({
        key: 'category',
        label: `Category #${filters.category_id}`,
        onRemove: () => updateFilters({ category_id: null, subcategory_id: null, page: 1 }),
      });
    }
    if (filters.subcategory_id) {
      nextChips.push({
        key: 'subcategory',
        label: `Subcategory #${filters.subcategory_id}`,
        onRemove: () => updateFilters({ subcategory_id: null, page: 1 }),
      });
    }
    if (filters.price_min || filters.price_max) {
      nextChips.push({
        key: 'price',
        label: `Price ${filters.price_min || '0'} - ${filters.price_max || '∞'}`,
        onRemove: () => updateFilters({ price_min: '', price_max: '', page: 1 }),
      });
    }
    if (filters.featured) {
      nextChips.push({
        key: 'featured',
        label: 'Featured',
        onRemove: () => updateFilters({ featured: false, page: 1 }),
      });
    }
    if (filters.promoted) {
      nextChips.push({
        key: 'promoted',
        label: 'Promoted',
        onRemove: () => updateFilters({ promoted: false, page: 1 }),
      });
    }
    if (filters.listing_type) {
      nextChips.push({
        key: 'listing_type',
        label: `Type: ${filters.listing_type}`,
        onRemove: () => updateFilters({ listing_type: '', page: 1 }),
      });
    }
    if (filters.city) {
      nextChips.push({
        key: 'city',
        label: `City: ${filters.city}`,
        onRemove: () => updateFilters({ city: '', page: 1 }),
      });
    }
    if (filters.lat || filters.lng || filters.km) {
      nextChips.push({
        key: 'coords',
        label: `Coords: ${filters.lat || '—'}, ${filters.lng || '—'} (${filters.km || '—'} km)`,
        onRemove: () => updateFilters({ lat: '', lng: '', km: '', page: 1 }),
      });
    }
    return nextChips;
  }, [filters, updateFilters]);

  const canGoNext = items.length >= filters.per_page;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <nav className="text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-slate-700">
            Home
          </Link>{' '}
          <span className="mx-2">/</span>
          <span className="text-slate-800 font-semibold">Items</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <ItemsFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">Browse items</h1>
                  <span className="text-sm text-slate-500">({items.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="lg:hidden inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                  </button>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                    <button
                      type="button"
                      onClick={() => setLayout('grid')}
                      className={`p-1 rounded-full ${
                        layout === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayout('list')}
                      className={`p-1 rounded-full ${
                        layout === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="flex-1">
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search items"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-500">Sort</label>
                  <select
                    value={filters.sort}
                    onChange={(event) => updateFilters({ sort: event.target.value, page: 1 })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="most_viewed">Most viewed</option>
                    <option value="most_favorited">Most favorited</option>
                  </select>
                </div>
              </div>

              <FilterChips chips={chips} onClearAll={resetFilters} />
            </div>

            <ItemsResults
              items={items}
              loading={loading}
              error={error}
              primaryColor={primaryColor}
              layout={layout}
              cardStyle={itemsCardStyle}
            />

            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
              <button
                type="button"
                onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {filters.page}</span>
              <button
                type="button"
                onClick={() => updateFilters({ page: filters.page + 1 })}
                disabled={!canGoNext}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer settings={settings ?? undefined} primaryColor={primaryColor} />

      <FilterDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Filters">
        <ItemsFilters
          filters={filters}
          onChange={(next) => updateFilters(next)}
          onReset={resetFilters}
        />
      </FilterDrawer>

      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden rounded-full bg-slate-900 text-white px-5 py-3 shadow-lg flex items-center gap-2"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </button>
    </div>
  );
}
