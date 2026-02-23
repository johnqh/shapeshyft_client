import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  NetworkClient,
  Optional,
  UserSettings,
  UserSettingsUpdateRequest,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';
import { QUERY_KEYS } from '../types';

/**
 * Return type for the {@link useSettings} hook.
 */
export interface UseSettingsReturn {
  /** Current user settings, or null while loading */
  settings: Optional<UserSettings>;
  /** True while any query or mutation is in progress */
  isLoading: boolean;
  /** Error message from the most recent failed query or mutation, or null */
  error: Optional<string>;

  /** Trigger a refetch of the settings from the server */
  refetch: () => void;
  /** Update user settings (upsert). Directly updates the cache on success. */
  updateSettings: (
    data: UserSettingsUpdateRequest
  ) => Promise<BaseResponse<UserSettings>>;

  /** Clear any mutation error state */
  clearError: () => void;
  /** Remove all cached settings data and clear errors */
  reset: () => void;
}

/**
 * Hook for managing user settings.
 * Uses TanStack Query for caching. Update mutations directly write to the cache on success.
 *
 * @param networkClient - NetworkClient instance for making HTTP requests
 * @param baseUrl - Base URL of the ShapeShyft API
 * @param userId - Firebase UID of the user, or null to disable fetching
 * @param token - Firebase ID token for authentication, or null to disable fetching
 * @param options - Optional configuration
 * @param options.testMode - When true, appends testMode=true to all API requests
 * @param options.enabled - When false, disables automatic fetching (default: true)
 * @returns {@link UseSettingsReturn} with settings data, loading/error state, and update method
 *
 * @example
 * ```tsx
 * const { settings, updateSettings } = useSettings(
 *   networkClient,
 *   'https://api.shapeshyft.com',
 *   userId,
 *   firebaseToken
 * );
 *
 * await updateSettings({ default_organization: 'my-org' });
 * ```
 */
export const useSettings = (
  networkClient: NetworkClient,
  baseUrl: string,
  userId: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
  }
): UseSettingsReturn => {
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
    queryKey: QUERY_KEYS.settings(userId ?? ''),
    queryFn: async () => {
      if (!userId || !token) throw new Error('Missing required params');
      const response = await client.getSettings(userId, token);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch settings');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updateData: UserSettingsUpdateRequest) => {
      if (!userId || !token) throw new Error('Missing required params');
      return client.updateSettings(userId, updateData, token);
    },
    onSuccess: response => {
      if (response.success && response.data && userId) {
        // Directly update the cache with the response data
        queryClient.setQueryData(QUERY_KEYS.settings(userId), response.data);
      }
    },
  });

  const updateSettings = useCallback(
    (data: UserSettingsUpdateRequest) => updateMutation.mutateAsync(data),
    [updateMutation]
  );

  const mutationError = updateMutation.error;
  const error =
    queryError instanceof Error
      ? queryError.message
      : mutationError instanceof Error
        ? mutationError.message
        : null;

  const clearError = useCallback(() => {
    updateMutation.reset();
  }, [updateMutation]);

  const reset = useCallback(() => {
    if (userId) {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.settings(userId) });
    }
    clearError();
  }, [queryClient, userId, clearError]);

  return useMemo(
    () => ({
      settings: data ?? null,
      isLoading: isLoading || updateMutation.isPending,
      error,
      refetch,
      updateSettings,
      clearError,
      reset,
    }),
    [
      data,
      isLoading,
      updateMutation.isPending,
      error,
      refetch,
      updateSettings,
      clearError,
      reset,
    ]
  );
};
