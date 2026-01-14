export type CacheEntry<T> = {
  data: T;
  ts: number;
  ttlMs: number;
};

export type CacheSubscriber<T> = (data: T) => void;

export const CACHE_TTL_MS = {
  categories: 24 * 60 * 60 * 1000,
  subcategories: 24 * 60 * 60 * 1000,
  listingTypes: 24 * 60 * 60 * 1000,
  dynamicFields: 24 * 60 * 60 * 1000,
  homeSections: 10 * 60 * 1000,
  frontWebSections: 10 * 60 * 1000,
  itemsList: 60 * 1000,
  itemDetails: 2 * 60 * 1000,
  shopDetails: 5 * 60 * 1000,
  shopItems: 60 * 1000,
};

const cacheMap = new Map<string, CacheEntry<any>>();
const subscribers = new Map<string, Set<CacheSubscriber<any>>>();
const inFlightRequests = new Map<string, Promise<any>>();

const DEFAULT_STORAGE_KEY = 'megzed_cache_v1';
let persistenceEnabled = false;
let storageKey = DEFAULT_STORAGE_KEY;
let hasLoadedStorage = false;

const loadFromStorage = () => {
  if (typeof window === 'undefined' || !persistenceEnabled || hasLoadedStorage) return;
  hasLoadedStorage = true;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { entries?: Record<string, CacheEntry<any>> };
    if (!parsed?.entries) return;
    Object.entries(parsed.entries).forEach(([key, entry]) => {
      if (entry && typeof entry.ts === 'number' && typeof entry.ttlMs === 'number') {
        cacheMap.set(key, entry);
      }
    });
  } catch {
    // ignore storage errors
  }
};

const persistToStorage = () => {
  if (typeof window === 'undefined' || !persistenceEnabled) return;
  const entries: Record<string, CacheEntry<any>> = {};
  cacheMap.forEach((value, key) => {
    entries[key] = value;
  });
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ entries }));
  } catch {
    // ignore storage errors
  }
};

export const configureCachePersistence = (enabled: boolean, options?: { storageKey?: string }) => {
  persistenceEnabled = enabled;
  if (options?.storageKey) {
    storageKey = options.storageKey;
  }
  if (enabled) {
    loadFromStorage();
    persistToStorage();
  }
};

export const getCacheEntry = <T>(key: string): CacheEntry<T> | null => {
  if (!hasLoadedStorage) loadFromStorage();
  return (cacheMap.get(key) as CacheEntry<T>) ?? null;
};

export const getCacheValue = <T>(key: string): { data: T; ts: number } | null => {
  const entry = getCacheEntry<T>(key);
  if (!entry) return null;
  return { data: entry.data, ts: entry.ts };
};

export const setCacheEntry = <T>(key: string, data: T, ttlMs: number) => {
  const entry: CacheEntry<T> = {
    data,
    ts: Date.now(),
    ttlMs,
  };
  cacheMap.set(key, entry);
  persistToStorage();
};

export const updateCacheEntry = <T>(key: string, updater: (data: T) => T) => {
  const entry = getCacheEntry<T>(key);
  if (!entry) return;
  const updated: CacheEntry<T> = {
    data: updater(entry.data),
    ts: entry.ts,
    ttlMs: entry.ttlMs,
  };
  cacheMap.set(key, updated);
  persistToStorage();
};

export const isFresh = (key: string): boolean => {
  const entry = getCacheEntry(key);
  if (!entry) return false;
  return Date.now() - entry.ts < entry.ttlMs;
};

export const subscribe = <T>(key: string, cb: CacheSubscriber<T>) => {
  const existing = subscribers.get(key) ?? new Set();
  existing.add(cb as CacheSubscriber<any>);
  subscribers.set(key, existing);
  return () => {
    const list = subscribers.get(key);
    if (!list) return;
    list.delete(cb as CacheSubscriber<any>);
    if (list.size === 0) {
      subscribers.delete(key);
    }
  };
};

export const notify = <T>(key: string, data: T) => {
  const list = subscribers.get(key);
  if (!list) return;
  list.forEach((cb) => cb(data));
};

export const invalidate = (keyPrefix: string) => {
  Array.from(cacheMap.keys()).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      cacheMap.delete(key);
    }
  });
  persistToStorage();
};

export const invalidateExact = (key: string) => {
  cacheMap.delete(key);
  persistToStorage();
};

export const getCacheKeys = () => Array.from(cacheMap.keys());

export const getInFlight = <T>(key: string): Promise<T> | undefined =>
  inFlightRequests.get(key) as Promise<T> | undefined;

export const setInFlight = <T>(key: string, promise: Promise<T>) => {
  inFlightRequests.set(key, promise as Promise<any>);
};

export const clearInFlight = (key: string) => {
  inFlightRequests.delete(key);
};
