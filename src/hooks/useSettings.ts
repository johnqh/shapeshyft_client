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
 * Return type for useSettings hook
 */
export interface UseSettingsReturn {
  settings: Optional<UserSettings>;
  isLoading: boolean;
  error: Optional<string>;

  refetch: () => void;
  updateSettings: (
    data: UserSettingsUpdateRequest
  ) => Promise<BaseResponse<UserSettings>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing user settings
 * Uses TanStack Query for caching
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
