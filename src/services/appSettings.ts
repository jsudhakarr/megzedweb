const API_BASE_URL = 'https://api.megzed.com/api/v1';

export interface AppSettingsLogo {
  url: string;
  thumbnail: string;
  preview: string;
  // optionally keep extra API fields if you want:
  original_url?: string;
  preview_url?: string;
}

export interface AppSettings {
  id: number;
  appname?: string;
  sitename?: string;
  description?: string;

  maintenance_mode: string;
  maintenance_title?: string;
  maintenance_message?: string;

  force_update: string;
  android_min_version_code?: string;
  ios_min_build_number?: string;

  android_store_url?: string;
  ios_store_url?: string | null;

  primary_color: string;
  secondary_color: string;
  currency: string;
  language: string;
  default_language?: string;

  logo: AppSettingsLogo | null;
  placeholder_image?: AppSettingsLogo | null;
  footer_logo?: string | null;
  favicon?: string | null;

  footer_text?: string;
  youtube_url?: string | null;
  facebook_url?: string | null;
  x_url?: string | null;
  instagram_url?: string | null;
  whatsapp_url?: string | null;
  play_store_link?: string | null;
  app_store_link?: string | null;

  contact_email?: string | null;
  contact_phone?: string | null;
  contact_number?: string | null;
  contact_address?: string | null;
  map_lat?: string | null;
  map_lng?: string | null;
}

const normalizeAppSettings = (data: AppSettings): AppSettings => {
  const appname =
    data.appname || data.sitename || data.description || 'Megzed';
  const language = data.language || data.default_language || 'en';
  const currency = data.currency || 'USD';
  const contact_phone = data.contact_phone || data.contact_number;

  return {
    ...data,
    appname,
    language,
    currency,
    contact_phone,
  };
};



// 2. The Fixed Fetch Function
export async function fetchAppSettings(): Promise<AppSettings> {
  const response = await fetch(`${API_BASE_URL}/front-web`);

  if (!response.ok) {
    throw new Error('Failed to fetch app settings');
  }

  const data = await response.json();

  // CRITICAL FIX: The API returns a single object { ... }, not an array [ ... ]
  // We check if it's an array just in case, but prioritize the object.
  if (Array.isArray(data)) {
    return normalizeAppSettings(data[0]);
  }
  return normalizeAppSettings(data as AppSettings);
}
