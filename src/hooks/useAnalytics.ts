import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AnalyticsResponse,
  NetworkClient,
  Optional,
  UsageAnalyticsQueryParams,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';
import { QUERY_KEYS } from '../types';

/**
 * Return type for the {@link useAnalytics} hook.
 */
export interface UseAnalyticsReturn {
  /** Analytics data including summary, by_endpoint, and by_date breakdowns, or null while loading */
  analytics: Optional<AnalyticsResponse>;
  /** True while the analytics query is loading */
  isLoading: boolean;
  /** Error message from the most recent failed fetch, or null */
  error: Optional<string>;

  /** Trigger a refetch of the analytics data from the server */
  refetch: () => void;

  /** Clear error state (query errors are cleared on next successful fetch) */
  clearError: () => void;
  /** Reset the analytics query cache. The query will re-fetch if still enabled. */
  reset: () => void;
}

/**
 * Hook for fetching usage analytics.
 * Uses TanStack Query for caching.
 *
 * @param networkClient - NetworkClient instance for making HTTP requests
 * @param baseUrl - Base URL of the ShapeShyft API
 * @param entitySlug - Entity slug for the organization, or null to disable fetching
 * @param token - Firebase ID token for authentication, or null to disable fetching
 * @param options - Optional configuration
 * @param options.testMode - When true, appends testMode=true to all API requests
 * @param options.enabled - When false, disables automatic fetching (default: true)
 * @param options.params - Query parameters for filtering (e.g., start_date, end_date)
 * @returns {@link UseAnalyticsReturn} with analytics data, loading/error state, and refetch
 *
 * @example
 * ```tsx
 * const { analytics, isLoading } = useAnalytics(
 *   networkClient,
 *   'https://api.shapeshyft.com',
 *   entitySlug,
 *   firebaseToken,
 *   { params: { start_date: '2024-01-01', end_date: '2024-12-31' } }
 * );
 * ```
 */
export const useAnalytics = (
  networkClient: NetworkClient,
  baseUrl: string,
  entitySlug: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
    params?: UsageAnalyticsQueryParams;
  }
): UseAnalyticsReturn => {
  const testMode = options?.testMode ?? false;
  const enabled = (options?.enabled ?? true) && !!entitySlug && !!token;

  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.analytics(entitySlug ?? ''),
    queryFn: async () => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      const response = await client.getAnalytics(
        entitySlug,
        token,
        options?.params
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch analytics');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  const clearError = useCallback(() => {
    // TanStack Query manages error state; reset by refetching
  }, []);

  const reset = useCallback(() => {
    if (entitySlug) {
      queryClient.resetQueries({ queryKey: QUERY_KEYS.analytics(entitySlug) });
    }
  }, [queryClient, entitySlug]);

  return useMemo(
    () => ({
      analytics: data ?? null,
      isLoading,
      error,
      refetch,
      clearError,
      reset,
    }),
    [data, isLoading, error, refetch, clearError, reset]
  );
};
