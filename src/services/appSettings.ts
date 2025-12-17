const API_BASE_URL = 'https://api.megzed.com/api/v1';

// 1. Define the Interface here and export it so Context can use it
export interface AppSettings {
  id: number;
  appname: string;
  maintenance_mode: string;
  force_update: string;
  primary_color: string;
  secondary_color: string;
  currency: string;
  language: string;
  logo: {
    url: string;
    thumbnail: string;
    preview: string;
  } | null;
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