export type ItemsFiltersState = {
  q: string;
  sort: string;
  page: number;
  per_page: number;
  city: string;
  state: string;
  lat: string;
  lng: string;
  km: string;
  category_id: number | null;
  subcategory_id: number | null;
  price_min: string;
  price_max: string;
  featured: boolean;
  promoted: boolean;
  listing_type: string;
  df: Record<string, string | string[]>;
  df_min: Record<string, string>;
  df_max: Record<string, string>;
};

export type UsersFiltersState = {
  q: string;
  sort: string;
  page: number;
  per_page: number;
  city: string;
  lat: string;
  lng: string;
  km: string;
  verified: boolean;
  top_rated: boolean;
  only_sellers: boolean;
};

export type ShopsFiltersState = {
  q: string;
  sort: string;
  page: number;
  per_page: number;
  city: string;
  lat: string;
  lng: string;
  km: string;
  verified: boolean;
  top_rated: boolean;
  has_active_items: boolean;
};
