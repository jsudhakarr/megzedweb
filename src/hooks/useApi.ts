import { useCallback, useEffect, useState } from 'react';
import type { DependencyList } from 'react';
import type { ApiError } from '../services/apiError';

export const useApi = <T,>(fetcher: () => Promise<T>, deps: DependencyList = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!isActive) return;
        setData(result);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err as ApiError);
        setData(null);
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [fetcher, retryCount, ...deps]);

  return { data, loading, error, retry };
};
