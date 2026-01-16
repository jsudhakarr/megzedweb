import applogo from '../assets/applogo/applogo.png';
import favicon from '../assets/favcon/favicon.ico';

export interface FallbackDemoData {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  highlights: string[];
  categories: string[];
}

export interface FallbackConfig {
  appName: string;
  siteName: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string;
  faviconUrl: string;
  demoData: FallbackDemoData;
}

const STORAGE_KEY = 'megzed_fallback_config';

export const defaultFallbackConfig: FallbackConfig = {
  appName: 'Megzed Offline',
  siteName: 'Megzed',
  description: 'Browse local listings even when you are offline.',
  primaryColor: '#2563eb',
  secondaryColor: '#ffffff',
  footerText: 'Megzed offline mode - demo content',
  contactEmail: 'support@megzed.com',
  contactPhone: '+1 (234) 567-890',
  logoUrl: applogo,
  faviconUrl: favicon,
  demoData: {
    heroTitle: 'Discover listings even when the network is down',
    heroSubtitle: 'Fallback data keeps the experience smooth while the API recovers.',
    ctaLabel: 'Explore demo listings',
    highlights: ['Trusted sellers', 'Curated categories', 'Instant messaging'],
    categories: ['Electronics', 'Fashion', 'Home & Garden', 'Vehicles'],
  },
};

const mergeConfig = (stored?: Partial<FallbackConfig>): FallbackConfig => {
  if (!stored) {
    return defaultFallbackConfig;
  }

  return {
    ...defaultFallbackConfig,
    ...stored,
    demoData: {
      ...defaultFallbackConfig.demoData,
      ...stored.demoData,
    },
  };
};

export const loadFallbackConfig = (): FallbackConfig => {
  if (typeof window === 'undefined') {
    return defaultFallbackConfig;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultFallbackConfig;
    }

    const parsed = JSON.parse(raw) as Partial<FallbackConfig>;
    return mergeConfig(parsed);
  } catch (error) {
    console.warn('Failed to load fallback config, using defaults.', error);
    return defaultFallbackConfig;
  }
};

export const saveFallbackConfig = (config: FallbackConfig): FallbackConfig => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save fallback config.', error);
    }
  }

  return config;
};
