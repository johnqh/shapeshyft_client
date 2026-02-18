import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  EntityStorageConfig,
  NetworkClient,
  Optional,
  StorageConfigCreateRequest,
  StorageConfigUpdateRequest,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';
import { QUERY_KEYS } from '../types';

/**
 * Return type for useStorageConfig hook
 */
export interface UseStorageConfigReturn {
  storageConfig: EntityStorageConfig | null;
  isLoading: boolean;
  error: Optional<string>;
  hasConfig: boolean;

  refetch: () => void;
  createOrUpdate: (
    data: StorageConfigCreateRequest
  ) => Promise<BaseResponse<EntityStorageConfig>>;
  update: (
    data: StorageConfigUpdateRequest
  ) => Promise<BaseResponse<EntityStorageConfig>>;
  deleteConfig: () => Promise<BaseResponse<EntityStorageConfig>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing entity storage configuration
 * Uses TanStack Query for caching. Handles 404 gracefully (no config = null).
 */
export const useStorageConfig = (
  networkClient: NetworkClient,
  baseUrl: string,
  entitySlug: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
  }
): UseStorageConfigReturn => {
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
    queryKey: QUERY_KEYS.storageConfig(entitySlug ?? ''),
    queryFn: async (): Promise<EntityStorageConfig | null> => {
      try {
        const response = await client.getStorageConfig(entitySlug!, token!);
        if (response.success && response.data) {
          return response.data;
        }
        // 404 is expected if no config exists
        if (response.error?.includes('not found')) {
          return null;
        }
        if (response.error) {
          throw new Error(response.error);
        }
        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '';
        // 404 is expected if no config exists
        if (
          errorMessage.includes('not found') ||
          errorMessage.includes('404')
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (createData: StorageConfigCreateRequest) => {
      return client.createStorageConfig(entitySlug!, createData, token!);
    },
    onSuccess: response => {
      if (response.success && response.data && entitySlug) {
        queryClient.setQueryData(
          QUERY_KEYS.storageConfig(entitySlug),
          response.data
        );
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updateData: StorageConfigUpdateRequest) => {
      return client.updateStorageConfig(entitySlug!, updateData, token!);
    },
    onSuccess: response => {
      if (response.success && response.data && entitySlug) {
        queryClient.setQueryData(
          QUERY_KEYS.storageConfig(entitySlug),
          response.data
        );
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return client.deleteStorageConfig(entitySlug!, token!);
    },
    onSuccess: response => {
      if (response.success && entitySlug) {
        queryClient.setQueryData(QUERY_KEYS.storageConfig(entitySlug), null);
      }
    },
  });

  const createOrUpdate = useCallback(
    (createData: StorageConfigCreateRequest) =>
      createOrUpdateMutation.mutateAsync(createData),
    [createOrUpdateMutation]
  );

  const update = useCallback(
    (updateData: StorageConfigUpdateRequest) =>
      updateMutation.mutateAsync(updateData),
    [updateMutation]
  );

  const deleteConfig = useCallback(
    () => deleteMutation.mutateAsync(),
    [deleteMutation]
  );

  const storageConfig = data ?? null;

  const mutationError =
    createOrUpdateMutation.error ??
    updateMutation.error ??
    deleteMutation.error;
  const error =
    queryError instanceof Error
      ? queryError.message
      : mutationError instanceof Error
        ? mutationError.message
        : null;

  const clearError = useCallback(() => {
    createOrUpdateMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  }, [createOrUpdateMutation, updateMutation, deleteMutation]);

  const reset = useCallback(() => {
    if (entitySlug) {
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.storageConfig(entitySlug),
      });
    }
    clearError();
  }, [queryClient, entitySlug, clearError]);

  return useMemo(
    () => ({
      storageConfig,
      isLoading:
        isLoading ||
        createOrUpdateMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending,
      error,
      hasConfig: storageConfig !== null,
      refetch,
      createOrUpdate,
      update,
      deleteConfig,
      clearError,
      reset,
    }),
    [
      storageConfig,
      isLoading,
      createOrUpdateMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      error,
      refetch,
      createOrUpdate,
      update,
      deleteConfig,
      clearError,
      reset,
    ]
  );
};
