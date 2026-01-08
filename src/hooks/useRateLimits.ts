import { useCallback, useMemo, useState } from 'react';
import type {
  NetworkClient,
  Optional,
  RateLimitsConfigData,
  RateLimitHistoryData,
  RateLimitPeriodType,
} from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';

/**
 * Return type for useRateLimits hook
 */
export interface UseRateLimitsReturn {
  config: Optional<RateLimitsConfigData>;
  history: Optional<RateLimitHistoryData>;
  isLoadingConfig: boolean;
  isLoadingHistory: boolean;
  error: Optional<string>;

  refreshConfig: (token: FirebaseIdToken, entitySlug: string) => Promise<void>;
  refreshHistory: (
    periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
    token: FirebaseIdToken,
    entitySlug: string
  ) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing rate limits configuration and history
 */
export const useRateLimits = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseRateLimitsReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const [config, setConfig] = useState<Optional<RateLimitsConfigData>>(null);
  const [history, setHistory] = useState<Optional<RateLimitHistoryData>>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Refresh rate limits configuration and current usage
   * @param token - Firebase ID token
   * @param entitySlug - Entity slug for rate limit lookup
   */
  const refreshConfig = useCallback(
    async (token: FirebaseIdToken, entitySlug: string): Promise<void> => {
      setIsLoadingConfig(true);
      setError(null);

      try {
        const response = await client.getRateLimitsConfig(token, entitySlug);
        if (response.success && response.data) {
          setConfig(response.data);
        } else {
          setError(response.error || 'Failed to fetch rate limits config');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch rate limits config';
        setError(errorMessage);
        console.error('[useRateLimits] refreshConfig error:', errorMessage, err);
      } finally {
        setIsLoadingConfig(false);
      }
    },
    [client]
  );

  /**
   * Refresh rate limit usage history for a specific period type
   * @param periodType - 'hour', 'day', or 'month'
   * @param token - Firebase ID token
   * @param entitySlug - Entity slug for rate limit lookup
   */
  const refreshHistory = useCallback(
    async (
      periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
      token: FirebaseIdToken,
      entitySlug: string
    ): Promise<void> => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const response = await client.getRateLimitHistory(periodType, token, entitySlug);
        if (response.success && response.data) {
          setHistory(response.data);
        } else {
          setError(response.error || 'Failed to fetch rate limit history');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch rate limit history';
        setError(errorMessage);
        console.error('[useRateLimits] refreshHistory error:', errorMessage, err);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setConfig(null);
    setHistory(null);
    setError(null);
    setIsLoadingConfig(false);
    setIsLoadingHistory(false);
  }, []);

  return useMemo(
    () => ({
      config,
      history,
      isLoadingConfig,
      isLoadingHistory,
      error,
      refreshConfig,
      refreshHistory,
      clearError,
      reset,
    }),
    [
      config,
      history,
      isLoadingConfig,
      isLoadingHistory,
      error,
      refreshConfig,
      refreshHistory,
      clearError,
      reset,
    ]
  );
};
