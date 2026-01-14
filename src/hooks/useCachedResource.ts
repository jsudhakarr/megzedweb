import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getCacheEntry,
  getCacheValue,
  invalidateExact,
  isFresh,
  notify,
  setCacheEntry,
  subscribe,
} from '../lib/cache';
import { shouldBackgroundRevalidate, swrFetch, type SwrFetchOptions } from '../lib/swrFetch';

type UseCachedResourceOptions = SwrFetchOptions & {
  enabled?: boolean;
};

type UseCachedResourceResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refreshing: boolean;
  mutate: (next: T | ((current: T | null) => T)) => void;
  invalidate: () => void;
};

export const useCachedResource = <T>(
  key: string | null | undefined,
  fetcher: () => Promise<T>,
  options: UseCachedResourceOptions
): UseCachedResourceResult<T> => {
  const { ttlMs, revalidateOnFocus, revalidateOnReconnect, force } = options;
  const enabled = options.enabled ?? true;
  const stableKey = key ?? null;
  const initialCache = useMemo(() => (stableKey ? getCacheValue<T>(stableKey) : null), [stableKey]);
  const [data, setData] = useState<T | null>(initialCache?.data ?? null);
  const [loading, setLoading] = useState(() => (stableKey ? !initialCache : false));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activeFetchRef = useRef(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!stableKey) return;
    const unsubscribe = subscribe<T>(stableKey, (next) => {
      setData(next);
      setLoading(false);
      setRefreshing(false);
      setError(null);
    });
    return () => unsubscribe();
  }, [stableKey]);

  useEffect(() => {
    if (!stableKey || !enabled) return;
    const cacheEntry = getCacheEntry<T>(stableKey);
    const hasCache = Boolean(cacheEntry);
    setLoading(!hasCache);
    setError(null);

    if (hasCache) {
      setData(cacheEntry?.data ?? null);
      const shouldRefresh = !isFresh(stableKey) || shouldBackgroundRevalidate(stableKey, ttlMs);
      setRefreshing(shouldRefresh);
    } else {
      setRefreshing(false);
    }

    const fetchId = activeFetchRef.current + 1;
    activeFetchRef.current = fetchId;

    void swrFetch(stableKey, () => fetcherRef.current(), {
      ttlMs,
      revalidateOnFocus,
      revalidateOnReconnect,
      force,
    })
      .then((result) => {
        if (activeFetchRef.current !== fetchId) return;
        setData(result);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      })
      .catch((err: Error) => {
        if (activeFetchRef.current !== fetchId) return;
        setError(err);
        setLoading(false);
        setRefreshing(false);
      });
  }, [enabled, force, revalidateOnFocus, revalidateOnReconnect, stableKey, ttlMs]);

  const mutate = (next: T | ((current: T | null) => T)) => {
    if (!stableKey) return;
    const resolved = typeof next === 'function' ? (next as (current: T | null) => T)(data) : next;
    setCacheEntry(stableKey, resolved, ttlMs);
    notify(stableKey, resolved);
  };

  const invalidate = () => {
    if (!stableKey) return;
    invalidateExact(stableKey);
  };

  return { data, loading, error, refreshing, mutate, invalidate };
};
