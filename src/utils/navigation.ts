import { writeFiltersToUrl } from './filters';
import type { ItemsFiltersState } from '../types/filters';

export type ItemsCentralNavigationOptions = {
  categoryId?: number | null;
  subcategoryId?: number | null;
  featured?: boolean;
  promoted?: boolean;
  sort?: string;
  q?: string;
};

const baseItemsFilters = (): ItemsFiltersState => ({
  q: '',
  sort: '',
  page: 1,
  per_page: 10,
  city: '',
  state: '',
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
  df: {},
  df_min: {},
  df_max: {},
});

export const buildItemsCentralUrl = (options: ItemsCentralNavigationOptions = {}) => {
  const filters = baseItemsFilters();
  if (options.categoryId) filters.category_id = options.categoryId;
  if (options.subcategoryId) filters.subcategory_id = options.subcategoryId;
  if (options.featured) filters.featured = true;
  if (options.promoted) filters.promoted = true;
  if (options.sort) filters.sort = options.sort;
  if (options.q) filters.q = options.q;

  const params = writeFiltersToUrl(filters);
  const query = params.toString();
  return query ? `/items?${query}` : '/items';
};

export const goToItemsCentral = (
  navigate: (path: string) => void,
  options: ItemsCentralNavigationOptions = {}
) => {
  navigate(buildItemsCentralUrl(options));
};
