import { useEffect, useState } from "react";
import { apiService, type DashboardSummary } from "../services/api";

const staleTimeMs = 30_000;
const cacheTimeMs = 5 * 60_000;

let cachedSummary: DashboardSummary | null = null;
let cacheTimestamp = 0;
let cacheTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<DashboardSummary> | null = null;
const listeners = new Set<(data: DashboardSummary | null) => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(cachedSummary));
};

const setCache = (data: DashboardSummary) => {
  cachedSummary = data;
  cacheTimestamp = Date.now();
  notifyListeners();

  if (cacheTimer) clearTimeout(cacheTimer);
  cacheTimer = setTimeout(() => {
    cachedSummary = null;
    cacheTimestamp = 0;
    notifyListeners();
  }, cacheTimeMs);
};

const isStale = () => !cachedSummary || Date.now() - cacheTimestamp > staleTimeMs;

const fetchSummary = async (force = false) => {
  if (!force && cachedSummary && !isStale()) return cachedSummary;
  if (inFlight) return inFlight;

  inFlight = apiService
    .getDashboardSummary()
    .then((data) => {
      setCache(data);
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

export const useDashboardSummary = () => {
  const [data, setData] = useState<DashboardSummary | null>(cachedSummary);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedSummary);

  useEffect(() => {
    const listener = (next: DashboardSummary | null) => {
      setData(next);
      setIsLoading(false);
    };

    listeners.add(listener);

    if (isStale()) {
      setIsLoading(true);
      setError(null);
      fetchSummary().catch((err) => {
        setError(err as Error);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const refetch = () => {
    setIsLoading(true);
    setError(null);
    return fetchSummary(true).catch((err) => {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    });
  };

  return { data, error, isLoading, refetch };
};
