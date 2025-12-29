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
  appname: string;

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

  logo: AppSettingsLogo | null;
  placeholder_image?: string | null;
}




// 2. The Fixed Fetch Function
export async function fetchAppSettings(): Promise<AppSettings> {
  const response = await fetch(`${API_BASE_URL}/appsettings`);

  if (!response.ok) {
    throw new Error('Failed to fetch app settings');
  }

  const data = await response.json();

  // CRITICAL FIX: The API returns a single object { ... }, not an array [ ... ]
  // We check if it's an array just in case, but prioritize the object.
  if (Array.isArray(data)) {
    return data[0]; 
  } else {
    return data; // This handles the current API response correctly
  }
}