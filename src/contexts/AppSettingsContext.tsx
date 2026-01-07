import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAppSettings, AppSettings } from '../services/appSettings';

interface AppSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
}

const defaultSettings: AppSettings = {
  id: 1,
  appname: 'Megabook',
  sitename: 'Megabook',
  description: 'megabook classifaids',
  maintenance_mode: 'no',
  force_update: 'no',
  primary_color: '#fd9f11',
  secondary_color: '#ffffff',
  currency: 'INR',
  language: 'en',
  default_language: 'en',
  footer_text: '@megabook all rights recived',
  youtube_url: 'https://www.youtube.com/megabook',
  facebook_url: null,
  x_url: null,
  instagram_url: null,
  whatsapp_url: null,
  play_store_link: null,
  app_store_link: null,
  contact_email: 'admin@gmail.com',
  contact_number: '8000000000',
  contact_phone: '8000000000',
  contact_address:
    'MJ Clock Tower, Nizam Shahi Rd, Chandra Vihar, Old Kattal Mandi, Nampally, Hyderabad, Telangana 500001, India',
  map_lat: '55.0020000',
  map_lng: '55.0023000',
  logo: {
    url: 'https://api.megzed.com/storage/1400/695ec60c9f2eb_android-chrome-192x192.png',
    thumbnail:
      'https://api.megzed.com/storage/1400/conversions/695ec60c9f2eb_android-chrome-192x192-thumb.jpg',
    preview:
      'https://api.megzed.com/storage/1400/conversions/695ec60c9f2eb_android-chrome-192x192-preview.jpg',
  },
  placeholder_image: {
    url: 'https://api.megzed.com/storage/1401/695ec5fca9375_android-chrome-512x512.png',
    thumbnail:
      'https://api.megzed.com/storage/1401/conversions/695ec5fca9375_android-chrome-512x512-thumb.jpg',
    preview:
      'https://api.megzed.com/storage/1401/conversions/695ec5fca9375_android-chrome-512x512-preview.jpg',
  },
  footer_logo:
    'https://api.megzed.com/storage/1402/695ec5f97b13c_android-chrome-192x192.png',
  favicon:
    'https://api.megzed.com/storage/1403/695ec5f38bc0b_favicon.ico',
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider = ({ children }: AppSettingsProviderProps) => {
  const [settings, setSettings] = useState<AppSettings | null>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    const appName = settings.appname || settings.sitename || 'Megzed';
    document.title = appName;

    if (settings.favicon) {
      let faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = settings.favicon;
    }
  }, [settings]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchAppSettings();
        setSettings(data);
      } catch (err: any) {
        console.error('Failed to load app settings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </AppSettingsContext.Provider>
  );
};
