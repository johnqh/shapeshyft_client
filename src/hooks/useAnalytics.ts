import { useCallback, useMemo, useState } from 'react';
import type {
  AnalyticsResponse,
  NetworkClient,
  Optional,
  UsageAnalyticsQueryParams,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';

/**
 * Return type for useAnalytics hook
 */
export interface UseAnalyticsReturn {
  analytics: Optional<AnalyticsResponse>;
  isLoading: boolean;
  error: Optional<string>;

  refresh: (
    userId: string,
    token: FirebaseIdToken,
    params?: UsageAnalyticsQueryParams
  ) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for fetching usage analytics
 * Provides read-only access to analytics data
 */
export const useAnalytics = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseAnalyticsReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const [analytics, setAnalytics] = useState<Optional<AnalyticsResponse>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Refresh analytics data
   */
  const refresh = useCallback(
    async (
      userId: string,
      token: FirebaseIdToken,
      params?: UsageAnalyticsQueryParams
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getAnalytics(userId, token, params);
        if (response.success && response.data) {
          setAnalytics(response.data);
        } else {
          setError(response.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch analytics';
        setError(errorMessage);
        console.error('[useAnalytics] refresh error:', errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setAnalytics(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      analytics,
      isLoading,
      error,
      refresh,
      clearError,
      reset,
    }),
    [analytics, isLoading, error, refresh, clearError, reset]
  );
};
