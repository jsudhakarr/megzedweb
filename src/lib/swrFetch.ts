import {
  clearInFlight,
  getCacheEntry,
  getInFlight,
  isFresh,
  notify,
  setCacheEntry,
  setInFlight,
} from './cache';

export type SwrFetchOptions = {
  ttlMs: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  force?: boolean;
};

const DEFAULT_REVALIDATE_COOLDOWN_MS = 10_000;
const BACKGROUND_REVALIDATE_FRACTION = 0.8;

const activeKeys = new Map<
  string,
  {
    fetcher: () => Promise<any>;
    ttlMs: number;
    options: SwrFetchOptions;
  }
>();

const lastRevalidateAt = new Map<string, number>();

const shouldRevalidateInBackground = (entry: { ts: number; ttlMs: number } | null) => {
  if (!entry) return true;
  const age = Date.now() - entry.ts;
  return age >= entry.ttlMs * BACKGROUND_REVALIDATE_FRACTION;
};

const shouldRevalidateNow = (key: string) => {
  const last = lastRevalidateAt.get(key) ?? 0;
  return Date.now() - last >= DEFAULT_REVALIDATE_COOLDOWN_MS;
};

const executeFetcher = async <T>(key: string, fetcher: () => Promise<T>, ttlMs: number) => {
  const existing = getInFlight<T>(key);
  if (existing) return existing;

  const promise = fetcher()
    .then((data) => {
      setCacheEntry(key, data, ttlMs);
      notify(key, data);
      return data;
    })
    .finally(() => {
      clearInFlight(key);
    });

  setInFlight(key, promise);
  return promise;
};

const revalidateKey = async (key: string) => {
  const entry = activeKeys.get(key);
  if (!entry) return;
  if (!shouldRevalidateNow(key)) return;
  lastRevalidateAt.set(key, Date.now());
  try {
    await executeFetcher(key, entry.fetcher, entry.ttlMs);
  } catch {
    // keep stale data on revalidate failure
  }
};

const registerActiveKey = (key: string, fetcher: () => Promise<any>, ttlMs: number, options: SwrFetchOptions) => {
  if (!options.revalidateOnFocus && !options.revalidateOnReconnect) return;
  activeKeys.set(key, { fetcher, ttlMs, options });
};

let listenersInitialized = false;
const initListeners = () => {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  window.addEventListener('focus', () => {
    activeKeys.forEach((_, key) => {
      const entry = activeKeys.get(key);
      if (entry?.options.revalidateOnFocus) {
        void revalidateKey(key);
      }
    });
  });

  window.addEventListener('online', () => {
    activeKeys.forEach((_, key) => {
      const entry = activeKeys.get(key);
      if (entry?.options.revalidateOnReconnect) {
        void revalidateKey(key);
      }
    });
  });
};

export const swrFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SwrFetchOptions
): Promise<T> => {
  initListeners();
  registerActiveKey(key, fetcher, options.ttlMs, options);

  if (options.force) {
    return executeFetcher(key, fetcher, options.ttlMs);
  }

  const entry = getCacheEntry<T>(key);
  if (entry) {
    if (isFresh(key)) {
      if (shouldRevalidateInBackground(entry)) {
        void revalidateKey(key);
      }
      return entry.data;
    }

    void revalidateKey(key);
    return entry.data;
  }

  return executeFetcher(key, fetcher, options.ttlMs);
};

export const shouldBackgroundRevalidate = (key: string, ttlMs: number) => {
  const entry = getCacheEntry(key);
  if (!entry) return true;
  const nowAge = Date.now() - entry.ts;
  return nowAge >= ttlMs * BACKGROUND_REVALIDATE_FRACTION;
};
