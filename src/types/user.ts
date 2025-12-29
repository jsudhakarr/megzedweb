export interface PublicUser {
  id: number;
  name: string;
  is_verified: boolean | number;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  distance_km?: number | null;
  has_contact: boolean;
  items_count: number;
  shops_count: number;
  profile_photo: string | null;
  profile_photo_url: string | null;
}

export interface PublicUserDetails extends PublicUser {
  about?: string | null;
  followers_count: number;
  following_count: number;
  created_at?: string;
  avg_rating?: number | null;
  reviews_count?: number;
}
