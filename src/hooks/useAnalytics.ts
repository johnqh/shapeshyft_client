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
 * Return type for useAnalytics hook
 */
export interface UseAnalyticsReturn {
  analytics: Optional<AnalyticsResponse>;
  isLoading: boolean;
  error: Optional<string>;

  refetch: () => void;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for fetching usage analytics
 * Uses TanStack Query for caching
 */
export const useAnalytics = (
  networkClient: NetworkClient,
  baseUrl: string,
  userId: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
    params?: UsageAnalyticsQueryParams;
  }
): UseAnalyticsReturn => {
  const testMode = options?.testMode ?? false;
  const enabled = (options?.enabled ?? true) && !!userId && !!token;

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
    queryKey: QUERY_KEYS.analytics(userId ?? ''),
    queryFn: async () => {
      const response = await client.getAnalytics(
        userId!,
        token!,
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
    if (userId) {
      queryClient.resetQueries({ queryKey: QUERY_KEYS.analytics(userId) });
    }
  }, [queryClient, userId]);

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
