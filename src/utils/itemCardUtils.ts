import type { Item } from '../services/api';

type ListingTag = {
  name: string;
  icon: string | null;
  color: string | null;
};

export const formatPrice = (price: Item['price'] | number | null | undefined) => {
  const n = Number(price);
  if (Number.isNaN(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
};

export const isPromoted = (item: Item | null | undefined) => item?.is_promoted === true;

export const isVerified = (item: Item | null | undefined) =>
  item?.shop?.user?.verified === true ||
  item?.shop?.is_verified === true ||
  item?.is_verified === true;

export const getDynamicFields = (item: Item | null | undefined) => {
  if (!Array.isArray(item?.dynamic_fields)) return [];
  return item.dynamic_fields
    .filter(
      (field) =>
        field &&
        typeof field?.image === 'string' &&
        field.image.length > 0 &&
        field?.value !== null &&
        field?.value !== undefined &&
        String(field.value).trim() !== ''
    )
    .slice(0, 2);
};

export const formatDuration = (item: Item | null | undefined) =>
  item?.duration_detail?.name || item?.rent_duration || '';

export const getListingTag = (item: Item | null | undefined): ListingTag => {
  const detail = item?.listing_type_detail || {};
  const name = detail?.name || (item?.listing_type === 'rent' ? 'Rent' : 'Sale');
  return {
    name,
    icon: detail?.icon || null,
    color: detail?.tag_color || null,
  };
};

export const formatCount = (value: unknown) => {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
};
