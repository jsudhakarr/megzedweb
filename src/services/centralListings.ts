import { API_BASE_URL, apiService, type Item, type Shop } from './api';
import type { PublicUser } from '../types/user';
import type {
  ItemsFiltersState,
  UsersFiltersState,
  ShopsFiltersState,
} from '../types/filters';

const toNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const appendQueryValue = (query: URLSearchParams, key: string, value: unknown) => {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => appendQueryValue(query, `${key}[]`, entry));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      appendQueryValue(query, `${key}[${childKey}]`, childValue);
    });
    return;
  }
  query.append(key, String(value));
};

const withLocationParams = (
  filters: {
    city: string;
    state?: string;
    lat: string;
    lng: string;
    km: string;
  },
  options?: { radiusKey?: 'radius' | 'radius_km' }
) => {
  const radiusKey = options?.radiusKey ?? 'radius';
  const params: Record<string, string | number | boolean> = {};
  if (filters.city) params.city = filters.city;
  if (filters.state) params.state = filters.state;
  const lat = toNumber(filters.lat);
  const lng = toNumber(filters.lng);
  const km = toNumber(filters.km);
  if (lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0) {
    params.lat = lat;
    params.lng = lng;
  }
  if (km !== undefined && km !== 0) {
    params[radiusKey] = km;
  }
  return params;
};

const buildItemsLocationParams = (filters: {
  city: string;
  state?: string;
  lat: string;
  lng: string;
  km: string;
}) => {
  const params: Record<string, string | number | boolean> = {};
  const city = filters.city.trim();
  const state = filters.state?.trim() ?? '';
  if (city) {
    params.city = city;
  }
  if (state) params.state = state;

  const lat = toNumber(filters.lat);
  const lng = toNumber(filters.lng);
  const km = toNumber(filters.km);
  if (lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0) {
    params.lat = lat;
    params.lng = lng;
    if (km !== undefined && km !== 0) {
      params.radius = km;
    }
  }
  return params;
};

export const buildItemsParams = (filters: ItemsFiltersState) => {
  const q = filters.q.trim();
  const params: Record<string, string | number | boolean | Record<string, unknown> | Array<unknown>> =
    {
    page: filters.page,
    per_page: filters.per_page,
    ...buildItemsLocationParams(filters),
  };

  if (q) params.q = q;
  if (filters.sort) params.sort = filters.sort;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.subcategory_id) params.subcategory_id = filters.subcategory_id;
  if (filters.price_min) params.min_price = filters.price_min;
  if (filters.price_max) params.max_price = filters.price_max;
  if (filters.featured) params.featured = 1;
  if (filters.promoted) params.promoted = 1;
  if (filters.listing_type) params.listing_type = filters.listing_type;
  if (Object.keys(filters.df).length > 0) params.df = filters.df;
  if (Object.keys(filters.df_min).length > 0) params.df_min = filters.df_min;
  if (Object.keys(filters.df_max).length > 0) params.df_max = filters.df_max;

  return params;
};

export const buildUsersParams = (filters: UsersFiltersState) => {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    per_page: filters.per_page,
    ...withLocationParams(filters, { radiusKey: 'radius_km' }),
  };

  if (filters.sort) params.sort = filters.sort;
  if (filters.only_sellers) params.only_sellers = 1;
  if (filters.q) params.q = filters.q;

  return params;
};

export const buildShopsParams = (filters: ShopsFiltersState) => {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    per_page: filters.per_page,
    ...withLocationParams(filters, { radiusKey: 'radius' }),
  };

  if (filters.sort) params.sort = filters.sort;
  if (filters.has_active_items) params.has_active_items = 1;
  if (filters.q) params.q = filters.q;

  return params;
};

export const fetchItemsCentral = async (
  filters: ItemsFiltersState,
  options?: { signal?: AbortSignal }
): Promise<Item[]> => {
  const params = buildItemsParams(filters);
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      if (value) query.append(key, '1');
      return;
    }
    appendQueryValue(query, key, value);
  });
  const queryString = query.toString();
  const url = queryString ? `${API_BASE_URL}/items?${queryString}` : `${API_BASE_URL}/items`;
  console.log('Items request:', { url, params: Object.fromEntries(query.entries()) });
  return apiService.getItemsIndex(params, options);
};

export const fetchUsersCentral = async (filters: UsersFiltersState): Promise<PublicUser[]> => {
  const params = buildUsersParams(filters);
  if (filters.top_rated) return apiService.getPublicUsersTopRated(params);
  if (filters.verified) return apiService.getPublicUsersVerified(params);
  return apiService.getPublicUsersIndex(params);
};

export const fetchShopsCentral = async (filters: ShopsFiltersState): Promise<Shop[]> => {
  const params = buildShopsParams(filters);
  if (filters.top_rated) return apiService.getShopsTopRated(params);
  if (filters.verified) return apiService.getShopsVerified(params);
  return apiService.getShopsIndex(params);
};
