import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import SiteHeader from '../components/SiteHeader';
import Footer from '../components/Footer';
import ShopsFilters from '../components/ShopsFilters';
import ShopsResults from '../components/ShopsResults';
import FilterDrawer from '../components/FilterDrawer';
import FilterChips from '../components/FilterChips';
import type { ShopsFiltersState } from '../types/filters';
import { parseShopsFilters, writeFiltersToUrl } from '../utils/filters';
import { fetchShopsCentral } from '../services/centralListings';
import type { Shop } from '../services/api';

const defaultFilters: ShopsFiltersState = {
  q: '',
  sort: '',
  page: 1,
  per_page: 24,
  city: '',
  lat: '',
  lng: '',
  km: '',
  verified: false,
  top_rated: false,
  has_active_items: false,
};

export default function ShopsCentralScreen() {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0ea5e9';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ShopsFiltersState>(() =>
    parseShopsFilters(searchParams)
  );
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setFilters(parseShopsFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const params = writeFiltersToUrl(filters);
    const nextQuery = params.toString();
    if (nextQuery !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  useEffect(() => {
    let isActive = true;
    const loadShops = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchShopsCentral(filters);
        if (isActive) {
          setShops(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load shops:', err);
        if (isActive) {
          setShops([]);
          setError('Something went wrong. Please try again.');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadShops();
    return () => {
      isActive = false;
    };
  }, [filters]);

  const updateFilters = useCallback((next: Partial<ShopsFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
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
    if (filters.verified) {
      nextChips.push({
        key: 'verified',
        label: 'Verified',
        onRemove: () => updateFilters({ verified: false, page: 1 }),
      });
    }
    if (filters.top_rated) {
      nextChips.push({
        key: 'top_rated',
        label: 'Top rated',
        onRemove: () => updateFilters({ top_rated: false, page: 1 }),
      });
    }
    if (filters.has_active_items) {
      nextChips.push({
        key: 'has_active_items',
        label: 'Has active items',
        onRemove: () => updateFilters({ has_active_items: false, page: 1 }),
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

  const canGoNext = shops.length >= filters.per_page;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <nav className="text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-slate-700">
            Home
          </Link>{' '}
          <span className="mx-2">/</span>
          <span className="text-slate-800 font-semibold">Shops</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <ShopsFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">Browse shops</h1>
                  <span className="text-sm text-slate-500">({shops.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="flex-1">
                  <input
                    value={filters.q}
                    onChange={(event) => updateFilters({ q: event.target.value, page: 1 })}
                    placeholder="Search shops"
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
                    <option value="">Newest</option>
                    <option value="top_rated">Top rated</option>
                  </select>
                </div>
              </div>

              <FilterChips chips={chips} onClearAll={resetFilters} />
            </div>

            <ShopsResults
              shops={shops}
              loading={loading}
              error={error}
              primaryColor={primaryColor}
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
        <ShopsFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />
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
