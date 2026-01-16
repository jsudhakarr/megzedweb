import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchAppSettings, AppSettings } from '../services/appSettings';
import {
  defaultFallbackConfig,
  loadFallbackConfig,
  saveFallbackConfig,
  FallbackConfig,
} from '../config/fallbackSettings';

interface AppSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  fallbackConfig: FallbackConfig;
  updateFallbackConfig: (config: FallbackConfig) => void;
}

const buildFallbackAppSettings = (fallback: FallbackConfig): AppSettings => ({
  id: 0,
  appname: fallback.appName,
  sitename: fallback.siteName,
  description: fallback.description,
  maintenance_mode: 'no',
  force_update: 'no',
  primary_color: fallback.primaryColor,
  secondary_color: fallback.secondaryColor,
  currency: 'USD',
  language: 'en',
  default_language: 'en',
  footer_text: fallback.footerText,
  youtube_url: null,
  facebook_url: null,
  x_url: null,
  instagram_url: null,
  whatsapp_url: null,
  play_store_link: null,
  app_store_link: null,
  contact_email: fallback.contactEmail,
  contact_number: fallback.contactPhone,
  contact_phone: fallback.contactPhone,
  contact_address: 'Offline fallback address',
  map_lat: '0.0000000',
  map_lng: '0.0000000',
  logo: {
    url: fallback.logoUrl,
    thumbnail: fallback.logoUrl,
    preview: fallback.logoUrl,
  },
  placeholder_image: {
    url: fallback.logoUrl,
    thumbnail: fallback.logoUrl,
    preview: fallback.logoUrl,
  },
  footer_logo: fallback.logoUrl,
  favicon: fallback.faviconUrl,
});

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
  const [fallbackConfig, setFallbackConfig] = useState<FallbackConfig>(() => loadFallbackConfig());
  const [settings, setSettings] = useState<AppSettings | null>(() =>
    buildFallbackAppSettings(fallbackConfig)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyFallbackAssets = useCallback(
    (data: AppSettings): AppSettings => ({
      ...data,
      logo: data.logo?.url
        ? data.logo
        : {
            url: fallbackConfig.logoUrl,
            thumbnail: fallbackConfig.logoUrl,
            preview: fallbackConfig.logoUrl,
          },
      favicon: data.favicon || fallbackConfig.faviconUrl,
    }),
    [fallbackConfig]
  );

  const loadSettings = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline mode - using fallback settings.');
      }

      const data = await fetchAppSettings();
      setSettings(applyFallbackAssets(data));
      setError(null);
    } catch (err: any) {
      console.error('Failed to load app settings:', err);
      setError(err.message);
      setSettings(buildFallbackAppSettings(fallbackConfig));
    } finally {
      setLoading(false);
    }
  }, [applyFallbackAssets, fallbackConfig]);

  useEffect(() => {
    if (!settings) return;
    const appName = settings.appname || settings.sitename || 'Megzed';
    document.title = appName;

    const faviconSource = settings.favicon || fallbackConfig.faviconUrl;
    if (faviconSource) {
      let faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = faviconSource;
    }
  }, [settings, fallbackConfig.faviconUrl]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const handleOffline = () => {
      setSettings(buildFallbackAppSettings(loadFallbackConfig()));
    };
    const handleOnline = () => {
      loadSettings();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadSettings]);

  const updateFallbackConfig = (config: FallbackConfig) => {
    const savedConfig = saveFallbackConfig(config);
    setFallbackConfig(savedConfig);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSettings(buildFallbackAppSettings(savedConfig));
    }
    if (settings?.id === 0) {
      setSettings(buildFallbackAppSettings(savedConfig));
    }
  };

  return (
    <AppSettingsContext.Provider
      value={{ settings, loading, error, fallbackConfig, updateFallbackConfig }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};
