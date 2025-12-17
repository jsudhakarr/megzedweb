import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAppSettings, AppSettings } from '../services/appSettings';

interface AppSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
}

const defaultSettings: AppSettings = {
  id: 1,
  appname: 'MEGZED - Classified Ads',
  maintenance_mode: 'no',
  force_update: 'no',
  primary_color: '#0073f0',
  secondary_color: '#ffffff',
  currency: 'USD',
  language: 'en',
  logo: null,
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
