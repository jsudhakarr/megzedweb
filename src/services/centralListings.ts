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

const withLocationParams = (filters: {
  city: string;
  lat: string;
  lng: string;
  km: string;
}) => {
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
    params.distance = km;
  }
  return params;
};

export const buildItemsParams = (filters: ItemsFiltersState) => {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    per_page: filters.per_page,
    ...withLocationParams(filters),
  };

  if (filters.sort) params.sort = filters.sort;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.subcategory_id) params.subcategory_id = filters.subcategory_id;
  if (filters.price_min) params.price_min = filters.price_min;
  if (filters.price_max) params.price_max = filters.price_max;
  if (filters.featured) params.featured = 1;
  if (filters.promoted) params.promoted = 1;
  if (filters.listing_type) params.listing_type = filters.listing_type;

  return params;
};

export const buildUsersParams = (filters: UsersFiltersState) => {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    per_page: filters.per_page,
    ...withLocationParams(filters),
  };

  if (filters.sort) params.sort = filters.sort;
  if (filters.verified) params.verified = 1;
  if (filters.top_rated) params.top_rated = 1;
  if (filters.only_sellers) params.only_sellers = 1;
  if (filters.q) params.search = filters.q;

  return params;
};

export const buildShopsParams = (filters: ShopsFiltersState) => {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    per_page: filters.per_page,
    ...withLocationParams(filters),
  };

  if (filters.sort) params.sort = filters.sort;
  if (filters.verified) params.verified = 1;
  if (filters.top_rated) params.top_rated = 1;
  if (filters.has_active_items) params.has_active_items = 1;
  if (filters.q) params.search = filters.q;

  return params;
};

export const fetchItemsCentral = async (filters: ItemsFiltersState): Promise<Item[]> => {
  const params = buildItemsParams(filters);
  if (filters.q.trim()) {
    return apiService.searchItemsIndex({ ...params, search: filters.q.trim() });
  }
  return apiService.getItemsIndex(params);
};

export const fetchUsersCentral = async (filters: UsersFiltersState): Promise<PublicUser[]> =>
  apiService.getPublicUsersIndex(buildUsersParams(filters));

export const fetchShopsCentral = async (filters: ShopsFiltersState): Promise<Shop[]> =>
  apiService.getShopsIndex(buildShopsParams(filters));
