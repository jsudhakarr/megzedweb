export interface ShopLite {
  id: number;
  shop_name: string;
  photo?: { thumbnail: string };
}

export interface Category {
  id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
}

export interface DynamicFieldConfig {
  id: number;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
}

export type CreateItemForm = {
  selectedShopId: string;
  categoryId: string;
  subcategoryId: string;

  title: string;
  price: string;
  description: string;
  listingType: string;
  rentDuration: string;
  dynamicValues: Record<string, any>;

  featurePhoto: File | null;
  galleryPhotos: File[];

  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;

  editId?: string | null;
  existingFeatureUrl?: string | null;
  existingGalleryUrls?: string[];
  lockedCategoryName?: string;
  lockedSubcategoryName?: string;
};
