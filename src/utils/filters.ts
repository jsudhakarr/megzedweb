import type {
  ItemsFiltersState,
  UsersFiltersState,
  ShopsFiltersState,
} from '../types/filters';

const parseNumber = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseString = (value: string | null): string => value ?? '';

const parseBoolean = (value: string | null): boolean => {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true';
};

const parsePage = (value: string | null, fallback: number): number => {
  const parsed = parseNumber(value);
  return parsed && parsed > 0 ? parsed : fallback;
};

const parsePerPage = (value: string | null, fallback: number): number => {
  const parsed = parseNumber(value);
  return parsed && parsed > 0 ? parsed : fallback;
};

export const parseItemsFilters = (searchParams: URLSearchParams): ItemsFiltersState => ({
  q: parseString(searchParams.get('q')),
  sort: parseString(searchParams.get('sort')),
  page: parsePage(searchParams.get('page'), 1),
  per_page: parsePerPage(searchParams.get('per_page'), 20),
  city: parseString(searchParams.get('city')),
  lat: parseString(searchParams.get('lat')),
  lng: parseString(searchParams.get('lng')),
  km: parseString(searchParams.get('km')),
  category_id: parseNumber(searchParams.get('category_id')),
  subcategory_id: parseNumber(searchParams.get('subcategory_id')),
  price_min: parseString(searchParams.get('price_min')),
  price_max: parseString(searchParams.get('price_max')),
  featured: parseBoolean(searchParams.get('featured')),
  promoted: parseBoolean(searchParams.get('promoted')),
  listing_type: parseString(searchParams.get('listing_type')),
  dynamic_fields: {},
});

export const parseUsersFilters = (searchParams: URLSearchParams): UsersFiltersState => ({
  q: parseString(searchParams.get('q')),
  sort: parseString(searchParams.get('sort')),
  page: parsePage(searchParams.get('page'), 1),
  per_page: parsePerPage(searchParams.get('per_page'), 24),
  city: parseString(searchParams.get('city')),
  lat: parseString(searchParams.get('lat')),
  lng: parseString(searchParams.get('lng')),
  km: parseString(searchParams.get('km')),
  verified: parseBoolean(searchParams.get('verified')),
  top_rated: parseBoolean(searchParams.get('top_rated')),
  only_sellers: parseBoolean(searchParams.get('only_sellers')),
});

export const parseShopsFilters = (searchParams: URLSearchParams): ShopsFiltersState => ({
  q: parseString(searchParams.get('q')),
  sort: parseString(searchParams.get('sort')),
  page: parsePage(searchParams.get('page'), 1),
  per_page: parsePerPage(searchParams.get('per_page'), 24),
  city: parseString(searchParams.get('city')),
  lat: parseString(searchParams.get('lat')),
  lng: parseString(searchParams.get('lng')),
  km: parseString(searchParams.get('km')),
  verified: parseBoolean(searchParams.get('verified')),
  top_rated: parseBoolean(searchParams.get('top_rated')),
  has_active_items: parseBoolean(searchParams.get('has_active_items')),
});

export const writeFiltersToUrl = (
  filters: ItemsFiltersState | UsersFiltersState | ShopsFiltersState
) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'boolean') {
      if (value) params.set(key, '1');
      return;
    }
    if (typeof value === 'number') {
      if (key === 'page' && value === 1) return;
      if (key === 'per_page' && (value === 20 || value === 24)) return;
      params.set(key, String(value));
      return;
    }
    if (typeof value === 'string') {
      if (value.trim() === '') return;
      if (key === 'page' && value === '1') return;
      if (key === 'per_page' && (value === '20' || value === '24')) return;
      params.set(key, value);
      return;
    }
    if (typeof value === 'object' && Object.keys(value).length > 0) {
      params.set(key, JSON.stringify(value));
    }
  });

  return params;
};
