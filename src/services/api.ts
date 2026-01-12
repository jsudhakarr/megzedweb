// src/services/api.ts

import type {
  Category,
  Subcategory,
  Item,
  Shop,
  ContentPage,
  CategoriesResponse,
  ItemsResponse,
  SearchResponse,
  ShopsResponse,
  PagesResponse,
} from '../types/category';
import type { PublicUser, PublicUserDetails } from '../types/user';
import type { ActionSubmission, ActionSubmissionPayload } from '../types/action';

export const API_BASE_URL = 'https://api.megzed.com/api/v1';

// --- Interfaces ---

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  mobile?: string;
  country_code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface SocialLoginData {
  provider: 'google' | 'phone';
  access_token: string;
  email?: string;
  mobile?: string;
  name?: string;
  avatar?: string;
  provider_id?: string;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string | null;
    mobile?: string;
    about?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    profile_photo?: string | null;
    profile_photo_url?: string | null;
    notification?: string | null;
    is_verified: boolean;
    kyc_status: string;
  };
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  about?: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingPayloadVisit {
  item_id: number;
  visit_date?: string;
  visit_time?: string;
  note?: string;
}

export interface BookingPayloadStay {
  item_id: number;
  check_in?: string;
  check_out?: string;
  guests?: number;
  note?: string;
}

// ✅ Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  profile_photo_url?: string;
}

export interface Slider {
  id: number;
  title: string;
  subtitle?: string | null;
  image: string;
  target_type?: string | null;
  item_id?: number | null;
  shop_id?: number | null;
  link_url?: string | null;
  sort_order?: number | null;
}

// ✅ Chat Types
export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  other_user: User;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  
}

export type Language = {
  code: string;
  name: string;
};

export type HomeSectionDataSource = {
  filter?: string | null;
  source_id?: string | number | null;
};

export type HomeSection = {
  id: number;
  title?: string | null;
  subtitle?: string | null;
  type?: string | null;
  layout?: string | null;
  item_count?: number | null;
  view_all?: { enabled?: boolean; route_key?: string | null } | null;
  style?: {
    background_color?: string;
    title_color?: string;
    subtitle_color?: string;
    view_all_color?: string;
    show_divider?: boolean;
    card_style?: string;
  } | null;
  data_source?: HomeSectionDataSource | null;
  ad_config?: {
    type?: string | null;
    target_type?: string | null;
    link?: string | null;
    item_id?: string | number | null;
    shop_id?: string | number | null;
    screen_key?: string | null;
    unit_id?: string | null;
    image?: string | null;
    title?: string | null;
    description?: string | null;
  } | null;
};

export type HomeSectionResolved = HomeSection & {
  resolvedData: {
    items?: Item[];
    shops?: Shop[];
    users?: PublicUser[];
    categories?: Category[];
    slides?: Slider[];
    ad?: HomeSection['ad_config'] | null;
  };
};

// --- Service Class ---

class ApiService {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private getPublicHeaders() {
    return {
      Accept: 'application/json',
    };
  }

  private async readError(response: Response): Promise<string> {
    const text = await response.text();
    if (!text) return 'Request failed';

    try {
      const json = JSON.parse(text);
      return (
        json.message ||
        json.error ||
        (typeof json === 'string' ? json : '') ||
        'Request failed'
      );
    } catch {
      return text || 'Request failed';
    }
  }

  private parseResponse(data: any): any {
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[data.length - 1] === 'object') {
        return data[data.length - 1];
      }
      throw new Error('Invalid response format: empty array');
    }
    return data;
  }

  private extractToken(response: any): string | null {
    const token = response.token || response.access_token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  private normalizeApiRoute(route: string): string {
    if (route.startsWith('http')) return route;
    return `${API_BASE_URL}${route.startsWith('/') ? '' : '/'}${route}`;
  }

  private buildQuery(params?: Record<string, string | number | boolean | null | undefined>) {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private buildLocationParams(location?: {
    city?: string | null;
    state?: string | null;
    lat?: number;
    lng?: number;
    distance?: number;
  }): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    if (location?.city) params.city = location.city;
    if (location?.state) params.state = location.state;
    if (location?.lat !== undefined) params.lat = location.lat;
    if (location?.lng !== undefined) params.lng = location.lng;
    if (location?.distance !== undefined) params.distance = location.distance;
    return params;
  }

  private normalizeListResponse<T>(data: any): T[] {
    if (Array.isArray(data?.data)) return data.data as T[];
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.data?.data)) return data.data.data as T[];
    return [];
  }

  // --- 🔥 NEW GENERIC METHODS (Fixes "get does not exist" error) ---

  async get(endpoint: string): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async post(endpoint: string, data: any): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async put(endpoint: string, data: any): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async delete(endpoint: string): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // ---------------- AUTH ----------------

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    const rawData = await response.json();
    const data = this.parseResponse(rawData);

    const token = this.extractToken(data);
    if (!token) throw new Error('No token received from server');

    const user = data.user || data;

    return {
      token,
      token_type: data.token_type || 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        about: user.about,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        profile_photo: user.profile_photo,
        profile_photo_url: user.profile_photo_url || user.avatar_url,
        notification: user.notification,
        is_verified: !!user.is_verified,
        kyc_status: user.kyc_status || 'pending',
      },
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    const rawData = await response.json();
    const parsedData = this.parseResponse(rawData);

    const token = this.extractToken(parsedData);
    if (!token) throw new Error('No token received from server');

    const user = parsedData.user || parsedData;

    return {
      token,
      token_type: parsedData.token_type || 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        about: user.about,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        profile_photo: user.profile_photo,
        profile_photo_url: user.profile_photo_url || user.avatar_url,
        notification: user.notification,
        is_verified: !!user.is_verified,
        kyc_status: user.kyc_status || 'pending',
      },
    };
  }

  async socialLogin(data: SocialLoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/social-login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    const rawData = await response.json();
    const parsedData = this.parseResponse(rawData);

    const token = this.extractToken(parsedData);
    if (!token) throw new Error('No token received from server');

    const user = parsedData.user || parsedData;

    return {
      token,
      token_type: parsedData.token_type || 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        about: user.about,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        profile_photo: user.profile_photo,
        profile_photo_url: user.profile_photo_url || user.avatar_url,
        notification: user.notification,
        is_verified: !!user.is_verified,
        kyc_status: user.kyc_status || 'pending',
      },
    };
  }

  
  // ---------------- PROFILE ----------------

  async getProfile(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    return response.json();
  }

  async updateProfile(data: UpdateProfileData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    return response.json();
  }

  async uploadProfilePhoto(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('profile_photo', file);

    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not logged in');

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    return response.json();
  }

  // ---------------- PUBLIC ----------------

  async getCategories(params?: Record<string, string | number | boolean>): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories${this.buildQuery(params)}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data: CategoriesResponse = await response.json();
    return this.normalizeListResponse<Category>(data);
  }

  async getSubcategories(categoryId?: string | number): Promise<Subcategory[]> {
    const url = categoryId
      ? `${API_BASE_URL}/subcategories?category_id=${encodeURIComponent(String(categoryId))}`
      : `${API_BASE_URL}/subcategories`;

    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) throw new Error(await this.readError(response));

    const data: any = await response.json();
    // keep compatible with your existing response style
    return data?.data ?? [];
  }


  async getSubcategoryFields(subcategoryId: string | number): Promise<any> {
    const id = encodeURIComponent(String(subcategoryId));

    const response = await fetch(`${API_BASE_URL}/subcategories/${id}/fields`, {
      method: "GET",
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async deleteItem(itemId: number): Promise<any> {
    return this.deleteMyItem(itemId);
  }

  async getItems(
    subcategoryId?: number,
    lat?: number,
    lng?: number,
    distance?: number,
    perPage: number = 10
  ): Promise<Item[]> {
    const params = new URLSearchParams();
    if (subcategoryId) params.append('subcategory_id', subcategoryId.toString());
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lng !== undefined) params.append('lng', lng.toString());
    if (distance !== undefined) params.append('distance', distance.toString());
    params.append('per_page', perPage.toString());

    const url = `${API_BASE_URL}/items?${params.toString()}`;
    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) throw new Error(await this.readError(response));

    const data: ItemsResponse = await response.json();
    return data.data;
  }

  async getItem(id: number): Promise<Item> {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return data.data;
  }

  async searchItems(
    query: string,
    categoryId?: number,
    subcategoryId?: number
  ): Promise<Item[]> {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (categoryId) params.append('category_id', categoryId.toString());
    if (subcategoryId) params.append('subcategory_id', subcategoryId.toString());

    const response = await fetch(
      `${API_BASE_URL}/items/search?${params.toString()}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) throw new Error(await this.readError(response));
    const data: SearchResponse = await response.json();
    return data.data;
  }

  async filterItems(filters: {
    categoryId?: number | null;
    subcategoryId?: number | null;
    listingType?: string | null;
    minPrice?: string;
    maxPrice?: string;
    verified?: boolean | null;
    city?: string | null;
    state?: string | null;
    lat?: number;
    lng?: number;
    distance?: number;
    perPage?: number;
  }): Promise<Item[]> {
    const params = new URLSearchParams();
    const categoryId = filters.categoryId ?? undefined;
    const subcategoryId = filters.subcategoryId ?? undefined;
    if (filters.perPage !== undefined) {
      params.append('per_page', String(filters.perPage));
    }
    if (filters.listingType) params.append('listing_type', filters.listingType);
    if (filters.minPrice !== undefined && filters.minPrice !== '')
      params.append('min_price', filters.minPrice);
    if (filters.maxPrice !== undefined && filters.maxPrice !== '')
      params.append('max_price', filters.maxPrice);
    if (filters.verified !== null && filters.verified !== undefined)
      params.append('verified', String(filters.verified));
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.lat !== undefined) params.append('lat', String(filters.lat));
    if (filters.lng !== undefined) params.append('lng', String(filters.lng));
    if (filters.distance !== undefined) params.append('distance', String(filters.distance));

    let endpoint = `${API_BASE_URL}/items`;
    if (subcategoryId) {
      endpoint = `${API_BASE_URL}/items/by-subcategory/${subcategoryId}`;
    } else if (categoryId) {
      endpoint = `${API_BASE_URL}/items/by-category/${categoryId}`;
    } else {
      if (categoryId) params.append('category_id', String(categoryId));
      if (subcategoryId) params.append('subcategory_id', String(subcategoryId));
    }

    const queryString = params.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data: ItemsResponse = await response.json();
    return data.data;
  }

  async getFeaturedItems(): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/items/featured`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data: ItemsResponse = await response.json();
    return data.data;
  }

  async scanItemByUid(uid: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/items/scan/${encodeURIComponent(uid)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getNearbyItems(lat: number, lng: number, distance?: number): Promise<Item[]> {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    if (distance !== undefined) params.append('distance', String(distance));

    const response = await fetch(
      `${API_BASE_URL}/items/nearby?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data: ItemsResponse = await response.json();
    return data.data;
  }

  async getItemsBySubcategory(subcategoryId: number): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/items/by-subcategory/${subcategoryId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data: ItemsResponse = await response.json();
    return data.data;
  }

  async getItemsByUser(userId: number): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/items/by-user/${userId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data: ItemsResponse = await response.json();
    return data.data;
  }

  async getShops(): Promise<Shop[]> {
    const response = await fetch(`${API_BASE_URL}/shops`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data: ShopsResponse = await response.json();
    return data.data;
  }

  async getShop(id: number): Promise<Shop> {
    const response = await fetch(`${API_BASE_URL}/shops/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return data.data;
  }

  

  async searchShops(query: string): Promise<Shop[]> {
    const params = new URLSearchParams();
    if (query) params.append('search', query);

    const response = await fetch(
      `${API_BASE_URL}/shops/search?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data: ShopsResponse = await response.json();
    return data.data;
  }

  async getShopItems(shopId: number): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/shops/${shopId}/items`, {
      headers: this.getPublicHeaders(),
    });

    if (!response.ok) throw new Error(await this.readError(response));

    const json = await response.json();
    if (Array.isArray(json?.items)) return json.items;
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.data?.data)) return json.data.data;
    return [];
  }

  async scanShopByUid(uid: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/shop/scan/${encodeURIComponent(uid)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getShopReviewsPublic(shopId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/shops/${shopId}/reviews`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getPages(): Promise<ContentPage[]> {
    const response = await fetch(`${API_BASE_URL}/pages`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data: PagesResponse = await response.json();
    return data.data;
  }

  async getPageBySlug(slug: string): Promise<ContentPage> {
    const response = await fetch(`${API_BASE_URL}/pages/${slug}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return data.data;
  }

  async getSystemPage(
    type: 'terms' | 'privacy' | 'about' | 'faq' | 'refund' | 'safety' | 'contact'
  ): Promise<ContentPage> {
    const response = await fetch(`${API_BASE_URL}/pages/${type}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return data.data;
  }

  async getFrontWebSections(): Promise<HomeSection[]> {
    const response = await fetch(`${API_BASE_URL}/front-web/sections`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<HomeSection>(data);
  }

  async getHomeSections(): Promise<HomeSection[]> {
    return this.getFrontWebSections();
  }

  async getSliders(params?: Record<string, string | number | boolean>): Promise<Slider[]> {
    const response = await fetch(
      `${API_BASE_URL}/sliders${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Slider>(data);
  }

  async getPublicUsersHighlights(
    params?: Record<string, string | number | boolean>
  ): Promise<PublicUser[]> {
    const response = await fetch(
      `${API_BASE_URL}/users/highlights${this.buildQuery(params)}`,
      {
        headers: this.getHeaders(),
      }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<PublicUser>(data);
  }

  async getPublicUsersVerified(
    params?: Record<string, string | number | boolean>
  ): Promise<PublicUser[]> {
    const response = await fetch(
      `${API_BASE_URL}/users/public/verified${this.buildQuery(params)}`,
      {
        headers: this.getHeaders(),
      }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<PublicUser>(data);
  }

  async getPublicUsersTopRated(
    params?: Record<string, string | number | boolean>
  ): Promise<PublicUser[]> {
    const response = await fetch(
      `${API_BASE_URL}/users/public/top-rated${this.buildQuery(params)}`,
      {
        headers: this.getHeaders(),
      }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<PublicUser>(data);
  }

  async getPublicUsersIndex(
    params?: Record<string, string | number | boolean>
  ): Promise<PublicUser[]> {
    const response = await fetch(
      `${API_BASE_URL}/users/public${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<PublicUser>(data);
  }

  async getShopsVerified(params?: Record<string, string | number | boolean>): Promise<Shop[]> {
    const response = await fetch(
      `${API_BASE_URL}/shops/verified${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Shop>(data);
  }

  async getShopsTopRated(params?: Record<string, string | number | boolean>): Promise<Shop[]> {
    const response = await fetch(
      `${API_BASE_URL}/shops/top-rated${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Shop>(data);
  }

  async getShopsIndex(params?: Record<string, string | number | boolean>): Promise<Shop[]> {
    const response = await fetch(`${API_BASE_URL}/shops${this.buildQuery(params)}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Shop>(data);
  }

  async getItemsIndex(params?: Record<string, string | number | boolean>): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/items${this.buildQuery(params)}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Item>(data);
  }

  async getItemsFeatured(params?: Record<string, string | number | boolean>): Promise<Item[]> {
    const response = await fetch(
      `${API_BASE_URL}/items/featured${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Item>(data);
  }

  async getItemsMostViewed(params?: Record<string, string | number | boolean>): Promise<Item[]> {
    const response = await fetch(
      `${API_BASE_URL}/items/most-viewed${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Item>(data);
  }

  async getItemsMostFavorited(
    params?: Record<string, string | number | boolean>
  ): Promise<Item[]> {
    const response = await fetch(
      `${API_BASE_URL}/items/most-favorited${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Item>(data);
  }

  async getItemsMostLiked(params?: Record<string, string | number | boolean>): Promise<Item[]> {
    const response = await fetch(
      `${API_BASE_URL}/items/most-liked${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Item>(data);
  }

  async getItemsByCategory(
    categoryId: string | number,
    params?: Record<string, string | number | boolean>
  ): Promise<Item[]> {
    const response = await fetch(
      `${API_BASE_URL}/items/by-category/${encodeURIComponent(
        String(categoryId)
      )}${this.buildQuery(params)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return this.normalizeListResponse<Item>(data);
  }

  async resolveHomeSection(
    section: HomeSection,
    locationParams?: {
      city?: string | null;
      state?: string | null;
      lat?: number;
      lng?: number;
      distance?: number;
    }
  ): Promise<HomeSectionResolved> {
    const itemCount = section.item_count ?? undefined;
    const limitParams =
      typeof itemCount === 'number' && itemCount > 0 ? { per_page: itemCount } : undefined;
    const locationQuery = this.buildLocationParams(locationParams);
    const queryParams = { ...locationQuery, ...(limitParams ?? {}) };

    if (section.type === 'slider') {
      const slides = await this.getSliders(limitParams);
      return { ...section, resolvedData: { slides: itemCount ? slides.slice(0, itemCount) : slides } };
    }

    if (section.type === 'categories') {
      const categories = await this.getCategories();
      return {
        ...section,
        resolvedData: {
          categories,
        },
      };
    }

    if (section.type === 'items') {
      const filter = section.data_source?.filter ?? 'all';
      const sourceId = section.data_source?.source_id;
      let items: Item[] = [];

      switch (filter) {
        case 'featured':
          items = await this.getItemsFeatured(queryParams);
          break;
        case 'most_viewed':
          items = await this.getItemsMostViewed(queryParams);
          break;
        case 'most_favorited':
          items = await this.getItemsMostFavorited(queryParams);
          break;
        case 'most_liked':
          items = await this.getItemsMostLiked(queryParams);
          break;
        case 'category':
          if (sourceId !== null && sourceId !== undefined) {
            items = await this.getItemsByCategory(sourceId, queryParams);
          } else {
            items = await this.getItemsIndex(queryParams);
          }
          break;
        default:
          items = await this.getItemsIndex(queryParams);
          break;
      }

      return { ...section, resolvedData: { items: itemCount ? items.slice(0, itemCount) : items } };
    }

    if (section.type === 'shops') {
      const filter = section.data_source?.filter ?? 'all';
      let shops: Shop[] = [];

      switch (filter) {
        case 'verified':
          shops = await this.getShopsVerified(queryParams);
          break;
        case 'top_rated':
          shops = await this.getShopsTopRated(queryParams);
          break;
        default:
          shops = await this.getShopsIndex(queryParams);
          break;
      }

      return { ...section, resolvedData: { shops: itemCount ? shops.slice(0, itemCount) : shops } };
    }

    if (section.type === 'users') {
      const filter = section.data_source?.filter ?? 'all';
      let users: PublicUser[] = [];

      switch (filter) {
        case 'highlights':
          users = await this.getPublicUsersHighlights(queryParams);
          break;
        case 'verified':
          users = await this.getPublicUsersVerified(queryParams);
          break;
        case 'top_rated':
          users = await this.getPublicUsersTopRated(queryParams);
          break;
        default:
          users = await this.getPublicUsersIndex(queryParams);
          break;
      }

      return { ...section, resolvedData: { users: itemCount ? users.slice(0, itemCount) : users } };
    }

    if (section.type === 'ad') {
      return { ...section, resolvedData: { ad: section.ad_config ?? null } };
    }

    return { ...section, resolvedData: {} };
  }

  async getPublicUsers(): Promise<PublicUser[]> {
    return this.getPublicUsersIndex();
  }

  async getPublicUser(userId: number): Promise<PublicUserDetails> {
    const response = await fetch(`${API_BASE_URL}/users/public/${userId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return (data?.data as PublicUserDetails) ?? (data as PublicUserDetails);
  }

  async getPublicUserShops(userId: number): Promise<Shop[]> {
    const response = await fetch(`${API_BASE_URL}/shops/by-user/${userId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data: any = await response.json();
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.shops)) return data.shops;
    if (Array.isArray(data)) return data;
    return [];
  }

  async getAppSettings(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/front-web`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getLanguages(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/languages`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getTranslations(lang?: string): Promise<any> {
    const url = lang
      ? `${API_BASE_URL}/front-web/translations?lang=${encodeURIComponent(lang)}`
      : `${API_BASE_URL}/front-web/translations`;

    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }


  async getPromotionPlans(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/promotion-plans`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getPromotionPlansGrouped(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/promotion-plans/grouped`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getPromotionPlan(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/promotion-plans/${id}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getCoinPackages(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/coin-packages`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // ---------------- PROTECTED ----------------

  async getUserItems(): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/my-items`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data: ItemsResponse = await response.json();
    return data.data;
  }


  // ✅ EDIT LOAD: GET /api/v1/my-items/{id}
  async getItemDetails(itemId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
      method: "GET",
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }



  async getUserShops(): Promise<Shop[]> {
    const response = await fetch(`${API_BASE_URL}/my-shops`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data: ShopsResponse = await response.json();
    return data.data;
  }

  async getUserFavorites(): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/my/saved-items`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data: ItemsResponse = await response.json();
    return data.data;
  }

  async toggleSaveItem(itemId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/save`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getFavoriteShops(): Promise<Shop[]> {
    const response = await fetch(`${API_BASE_URL}/shops/favorites`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data: ShopsResponse = await response.json();
    return data.data;
  }

  async toggleShopFavorite(shopId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/shops/${shopId}/favorite`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getUserBookings(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/bookings/my`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return data.data || [];
  }

  async getMyActionSubmissions(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/my/action-submissions`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return data.data || data || [];
  }

  async getReceivedActionSubmissions(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/seller/action-submissions`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    const data = await response.json();
    return data.data?.submissions || data.submissions || data.data || data || [];
  }

  async createVisitBooking(payload: BookingPayloadVisit): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bookings/visit`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getVisitStatus(params: { item_id?: number; booking_id?: number } = {}): Promise<any> {
    const sp = new URLSearchParams();
    if (params.item_id) sp.append('item_id', String(params.item_id));
    if (params.booking_id) sp.append('booking_id', String(params.booking_id));

    const response = await fetch(`${API_BASE_URL}/bookings/visit-status?${sp.toString()}`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async createStayBooking(payload: BookingPayloadStay): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bookings/stay`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getStayStatus(params: { item_id?: number; booking_id?: number } = {}): Promise<any> {
    const sp = new URLSearchParams();
    if (params.item_id) sp.append('item_id', String(params.item_id));
    if (params.booking_id) sp.append('booking_id', String(params.booking_id));

    const response = await fetch(`${API_BASE_URL}/bookings/stay-status?${sp.toString()}`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getBookingsForMyItems(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bookings/for-my-items`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async bookingAccept(bookingId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/accept`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async bookingReject(bookingId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reject`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async bookingCancel(bookingId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async bookingComplete(bookingId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/complete`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async createReview(payload: {
    transaction_id: number;
    transaction_type: string;
    rating: number;
    comment?: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async reportItem(itemId: number, payload: { reason?: string; message?: string } = {}): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/report`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getItemActions(itemId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/actions`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getActionSubmission(
    submissionId: number,
    variant?: 'sent' | 'received'
  ): Promise<ActionSubmission> {
    const getSubmission = async (path: string) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: this.getHeaders(true),
      });
      if (!response.ok) throw new Error(await this.readError(response));
      const data = await response.json();
      return data.data ?? data;
    };

    if (variant === 'received') {
      return getSubmission(`/seller/action-submissions/${submissionId}`);
    }

    if (variant === 'sent') {
      return getSubmission(`/my/action-submissions/${submissionId}`);
    }

    try {
      return await getSubmission(`/my/action-submissions/${submissionId}`);
    } catch (error) {
      return getSubmission(`/seller/action-submissions/${submissionId}`);
    }
  }

  async createActionSubmission(payload: ActionSubmissionPayload): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/action-submissions`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async cancelActionSubmission(submissionId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my/action-submissions/${submissionId}/cancel`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async updateActionSubmissionStatus(
    submissionId: number,
    payload: { status: 'accepted' | 'rejected'; reason?: string }
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/seller/action-submissions/${submissionId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async createJobApplication(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/job-applications`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getMyJobApplications(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/job-applications/my`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getJobApplicationsForMyItems(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/job-applications/for-my-items`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async createOrderRequest(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/order-requests`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getMyOrderRequests(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/order-requests/my`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getOrderRequestsForMyItems(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/order-requests/for-my-items`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // --- CHAT ENDPOINTS ---
  
  async getConversations(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async startConversation(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/conversations/start`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getConversation(conversationId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async sendMessage(conversationId: number, payload: any): Promise<any> {
    const isFormData = payload instanceof FormData;
    const headers = this.getHeaders(true) as Record<string, string>;
    if (isFormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: isFormData ? payload : JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async markConversationRead(conversationId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async blockUser(userId: number, action: 'block' | 'unblock' = 'block'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/block`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ action }),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getBlockStatus(userId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/block-status`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getBlockedUsers(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/me/blocked-users`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // --- WALLET ENDPOINTS ---

  async getWallet(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getWalletTransactions(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet/transactions`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async walletPurchase(payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/wallet/purchase`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // --- PROMOTION ENDPOINTS ---

  async promoteMyItem(itemId: number, payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-items/${itemId}/promote`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async promoteMyShop(shopId: number, payload: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-shops/${shopId}/promote`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // --- NOTIFICATION ENDPOINTS ---

  async getUnreadNotificationCount(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getNotifications(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async markNotificationRead(id: number | string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async markAllNotificationsRead(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async saveDeviceToken(payload: { token: string; platform?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/save-device-token`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async verifyGooglePlayPurchase(payload: { productId: string; purchaseToken: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/google-play/verify`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // --- VERIFICATION (KYC) ---

  async getUserVerificationFields(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/verification/user/fields`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async submitUserVerification(formData: FormData): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not logged in');

    const response = await fetch(`${API_BASE_URL}/verification/user/submit`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async getShopVerificationFields(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/verification/shop/fields`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async submitShopVerification(formData: FormData): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not logged in');

    const response = await fetch(`${API_BASE_URL}/verification/shop/submit`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  // --- MY ITEMS/SHOPS CRUD ---

  async createItem(payload: any): Promise<any> {
    const headers = this.getHeaders(true) as Record<string, string>;

    if (payload instanceof FormData) {
      delete headers['Content-Type'];
    }

    // ✅ FIXED: Changed endpoint from '/items' to '/additem' to match Laravel
    const response = await fetch(`${API_BASE_URL}/additem`, { 
      method: 'POST',
      headers: headers,
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async updateItem(itemId: string | number, payload: any): Promise<any> {
    const headers = this.getHeaders(true) as Record<string, string>;
    let method = 'PATCH'; // Default to real PATCH for JSON

    if (payload instanceof FormData) {
      delete headers['Content-Type'];
      // Laravel Fix: PHP cannot parse multipart/form-data on PATCH requests.
      // We must use POST and spoof the method using _method field.
      payload.append('_method', 'PATCH');
      method = 'POST'; 
    }

    // ✅ FIXED: Endpoint changed to '/my-items/' to match your Laravel route
    const response = await fetch(`${API_BASE_URL}/my-items/${itemId}`, {
      method: method, 
      headers: headers,
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async deleteMyItem(itemId: number): Promise<any> {
    // This looks correct based on your route: Route::delete('my-items/{item}')
    const response = await fetch(`${API_BASE_URL}/my-items/${itemId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async createShop(payload: any): Promise<any> {
    // FIX: Add 'as Record<string, string>' to tell TypeScript this is a plain object
    const headers = this.getHeaders(true) as Record<string, string>;

    // Now TypeScript allows this deletion
    if (payload instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}/addshop`, {
      method: 'POST',
      headers: headers,
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async updateShop(shopId: number, payload: any): Promise<any> {
    const headers = this.getHeaders(true) as Record<string, string>;

    // 1. If sending files (FormData), remove 'Content-Type' header
    // The browser will automatically set 'multipart/form-data; boundary=...'
    if (payload instanceof FormData) {
      delete headers['Content-Type'];
      
      // NOTE: If your backend is Laravel/PHP, file uploads via PATCH often fail.
      // If images don't update, change the method below to 'POST' and uncomment this line:
      // payload.append('_method', 'PATCH'); 
    }

    const response = await fetch(`${API_BASE_URL}/my-shops/${shopId}`, {
      method: 'PATCH', // Or 'POST' if using the _method trick above
      headers: headers,
      // 2. Send FormData raw, otherwise stringify JSON
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }

  async deleteShop(shopId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-shops/${shopId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    
    if (!response.ok) throw new Error(await this.readError(response));
    return response.json();
  }
}

export const apiService = new ApiService();

export const getTranslations = async (lang: string) => {
  const res = await apiService.getTranslations(lang);
  return res?.keys || {};
};

export const getLanguages = async () => {
  const res = await apiService.getLanguages();
  return res?.data || [];
};

// --- Shortcut Exports for Components (Shortcuts to ApiService methods) ---
export const getNotifications = () => apiService.getNotifications();
export const markAllNotificationsRead = () => apiService.markAllNotificationsRead();
export const markNotificationRead = (id: string | number) => apiService.markNotificationRead(id);
export const getConversations = () => apiService.getConversations();
export const startConversation = (payload: any) => apiService.startConversation(payload);
export const getMessages = (id: number) => apiService.getConversation(id); // Maps "messages" to "conversation details"
export const sendMessage = (id: number, payload: string | FormData | Record<string, any>) => {
  if (payload instanceof FormData) return apiService.sendMessage(id, payload);
  if (typeof payload === 'string') return apiService.sendMessage(id, { message: payload });
  return apiService.sendMessage(id, payload);
};
export const markConversationRead = (id: number) => apiService.markConversationRead(id);
export const blockUser = (id: number, action: 'block' | 'unblock' = 'block') => apiService.blockUser(id, action);
export const getBlockStatus = (id: number) => apiService.getBlockStatus(id);
export const getBlockedUsers = () => apiService.getBlockedUsers();

export type { Category, Subcategory, Item, Shop, ContentPage } from '../types/category';
export type { PublicUser, PublicUserDetails } from '../types/user';

export type ApiError = Error & {
  status?: number;
  fieldErrors?: Record<string, string[]>;
};

export type ApiRequestOptions = {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: BodyInit | Record<string, unknown> | null;
  headers?: HeadersInit;
  auth?: boolean;
};

const parseApiError = async (response: Response): Promise<ApiError> => {
  const text = await response.text();
  let message = 'Request failed';
  let fieldErrors: Record<string, string[]> | undefined;

  if (text) {
    try {
      const json = JSON.parse(text);
      message =
        json.message ||
        json.error ||
        (typeof json === 'string' ? json : '') ||
        message;
      if (json.errors && typeof json.errors === 'object') {
        fieldErrors = json.errors;
      }
    } catch {
      if (!text.trim().startsWith('<')) {
        message = text;
      }
    }
  }

  const error = new Error(message) as ApiError;
  error.status = response.status;
  if (fieldErrors) error.fieldErrors = fieldErrors;
  return error;
};

export const apiRequest = async <T>({
  endpoint,
  method = 'GET',
  body = null,
  headers,
  auth = true,
}: ApiRequestOptions): Promise<T> => {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const requestHeaders: HeadersInit = {
    Accept: 'application/json',
    ...headers,
  };

  const token = auth ? localStorage.getItem('auth_token') : null;
  if (token) {
    (requestHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body && method !== 'GET') {
    (requestHeaders as Record<string, string>)['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
};
