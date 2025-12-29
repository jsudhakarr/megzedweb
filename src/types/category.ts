export interface CategoryIcon {
  url: string;
  thumbnail: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: CategoryIcon;
}

export interface SubcategoryIcon {
  id: number;
  url: string;
  thumbnail: string;
  preview?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  category_id: string;
  icon: SubcategoryIcon | null;
  created_at: string;
  updated_at: string;
}

/** ✅ UPDATED (API shop.user can be missing fields, and mobile may be needed) */
export interface ItemUser {
  id: number;
  name: string;
  profile_photo: string;
  verified: boolean;
  member_since: string;
  city: string | null;

  // ✅ add (ItemDetail uses mobile sometimes)
  mobile?: string | null;
}

export interface ItemPhoto {
  url: string;
  thumbnail: string;
  preview?: string;
}

export interface ItemCategory {
  id: number;
  name: string;
}

/** ✅ icon can be null (your API shows subcategory.icon = null) */
export interface ItemSubcategory {
  id: number;
  name: string;
  icon: CategoryIcon | null;
}

/** ✅ options is array in API (sometimes [null]) */
export interface DynamicField {
  field_id: number;
  label: string;
  image: string | null;
  value: string;
  type_of_parameter: string;
  is_required: boolean;

  // ✅ API example: ["1 Bedrooms", ...] or [null]
  options: Array<string | null>;
}

/** ✅ NEW: item.shop object type (your API returns full shop object) */
export interface ItemShopPhoto {
  url: string;
  thumbnail: string;
  preview?: string;
}

export interface ItemShop {
  id: number;
  shop_name: string;
  description?: string;
  address: string;

  latitude: string;
  longitude: string;

  shop_type: string;
  is_verified: boolean;
  kyc_status?: string;

  user?: ItemUser | null;
  photo?: ItemShopPhoto | null;

  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: number;
  uid: string;
  unique_code: string;
  shop_id: string | null;
  category_id: string;
  subcategory_id: string;
  name: string;
  price: string;
  description: string;
  listing_type: string;
  rent_duration: string | null;
  status: string;
  approval_status: string;
  address: string;
  state: string;
  city: string;
  country: string;

  // ✅ keep (item coords)
  latitude: string;
  longitude: string;

  total_view: string;
  is_verified: boolean;
  qr_code: string;
  qr_url: string;
  is_promoted: boolean;
  promoted_until: string | null;
  created_at: string;
  updated_at: string;
  category: ItemCategory;

  // ✅ updated
  subcategory: ItemSubcategory;

  feature_photo: ItemPhoto | null;
  item_photos: ItemPhoto[];

  // ✅ FIX: was null, must be object or null
  shop: ItemShop | null;

  // ✅ FIX: API can return null (your JSON shows "user": null)
  user: ItemUser | null;

  dynamic_fields: DynamicField[];
}

export interface CategoriesResponse {
  data: Category[];
}

export interface SubcategoriesResponse {
  success: boolean;
  data: Subcategory[];
}

export interface ItemsResponse {
  data: Item[];
}

export interface SearchResponse {
  success: boolean;
  count: number;
  data: Item[];
}

export interface ShopPhoto {
  url: string;
  thumbnail: string;
  preview: string;
}

export interface ShopUser {
  id: number;
  name: string;
  profile_photo: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string | null;
  is_active: boolean;
  approved: boolean;
  mobile_verified: boolean;
  is_verified: boolean;
}

export interface Shop {
  id: number;
  uid: string | null;
  shop_name: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  shop_type: string;
  country: string | null;
  state: string | null;
  city: string | null;
  is_active: boolean;
  is_approved: boolean;
  is_verified: boolean;
  qr_code: string | null;
  qr_url: string | null;
  items_count: number;
  avg_rating: number | null;
  reviews_count: number;
  is_promoted: boolean;
  photo: ShopPhoto | null;
  gallery: ShopPhoto[];
  user: ShopUser;
  created_at: string;
  updated_at: string;
}

export interface ShopsResponse {
  success: boolean;
  data: Shop[];
}

export interface MediaFile {
  id: number;
  url: string;
  thumbnail: string;
  preview: string;
  original_url: string;
  preview_url: string;
}

export interface ContentPage {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  featured_image: MediaFile | null;
  media: MediaFile[];
  created_at?: string;
  updated_at?: string;
}

export interface PagesResponse {
  success: boolean;
  data: ContentPage[];
}
