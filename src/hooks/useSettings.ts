import { useCallback, useMemo, useState } from 'react';
import type {
  BaseResponse,
  NetworkClient,
  Optional,
  UserSettings,
  UserSettingsUpdateRequest,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';

/**
 * Return type for useSettings hook
 */
export interface UseSettingsReturn {
  settings: Optional<UserSettings>;
  isLoading: boolean;
  error: Optional<string>;

  refresh: (userId: string, token: FirebaseIdToken) => Promise<void>;
  updateSettings: (
    userId: string,
    data: UserSettingsUpdateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<UserSettings>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing user settings
 * Provides get and update operations
 */
export const useSettings = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseSettingsReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const [settings, setSettings] = useState<Optional<UserSettings>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Refresh settings
   */
  const refresh = useCallback(
    async (userId: string, token: FirebaseIdToken): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getSettings(userId, token);
        if (response.success && response.data) {
          setSettings(response.data);
        } else {
          setError(response.error || 'Failed to fetch settings');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch settings';
        setError(errorMessage);
        console.error('[useSettings] refresh error:', errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Update settings
   */
  const updateSettings = useCallback(
    async (
      userId: string,
      data: UserSettingsUpdateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<UserSettings>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateSettings(userId, data, token);
        if (response.success && response.data) {
          setSettings(response.data);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update settings';
        setError(errorMessage);
        console.error('[useSettings] updateSettings error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
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
    setSettings(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      settings,
      isLoading,
      error,
      refresh,
      updateSettings,
      clearError,
      reset,
    }),
    [settings, isLoading, error, refresh, updateSettings, clearError, reset]
  );
};
