import { apiService, type Item, type Shop } from './api';
import type { PublicUser } from '../types/user';
import type {
  ItemsFiltersState,
  UsersFiltersState,
  ShopsFiltersState,
} from '../types/filters';

const toNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const withLocationParams = (
  filters: {
    city: string;
    lat: string;
    lng: string;
    km: string;
  },
  options?: { radiusKey?: 'radius' | 'radius_km' }
) => {
  const radiusKey = options?.radiusKey ?? 'radius';
  const params: Record<string, string | number | boolean> = {};
  if (filters.city) params.city = filters.city;
  const lat = toNumber(filters.lat);
  const lng = toNumber(filters.lng);
  const km = toNumber(filters.km);
  if (lat !== undefined && lng !== undefined) {
    params.lat = lat;
    params.lng = lng;
  }
  if (km !== undefined) {
    params[radiusKey] = km;
  }
  return params;
};

export const buildItemsParams = (filters: ItemsFiltersState) => {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    per_page: filters.per_page,
    ...withLocationParams(filters, { radiusKey: 'radius' }),
  };

  if (filters.sort) params.sort = filters.sort;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.subcategory_id) params.subcategory_id = filters.subcategory_id;
  if (filters.price_min) params.min_price = filters.price_min;
  if (filters.price_max) params.max_price = filters.price_max;
  if (filters.featured) params.featured = 1;
  if (filters.promoted) params.promoted = 1;
  if (filters.listing_type) params.listing_type = filters.listing_type;

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

export const fetchItemsCentral = async (filters: ItemsFiltersState): Promise<Item[]> => {
  const params = buildItemsParams(filters);
  if (filters.q.trim()) {
    return apiService.searchItemsIndex({ ...params, q: filters.q.trim() });
  }
  return apiService.getItemsIndex(params);
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
