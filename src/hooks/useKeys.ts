import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  LlmApiKeyCreateRequest,
  LlmApiKeySafe,
  LlmApiKeyUpdateRequest,
  NetworkClient,
  Optional,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';
import { QUERY_KEYS } from '../types';

// Stable empty array to prevent unnecessary re-renders
const EMPTY_KEYS: LlmApiKeySafe[] = [];

/**
 * Return type for useKeys hook
 */
export interface UseKeysReturn {
  keys: LlmApiKeySafe[];
  isLoading: boolean;
  error: Optional<string>;

  refetch: () => void;
  getKey: (keyId: string) => Promise<BaseResponse<LlmApiKeySafe>>;
  createKey: (
    data: LlmApiKeyCreateRequest
  ) => Promise<BaseResponse<LlmApiKeySafe>>;
  updateKey: (
    keyId: string,
    data: LlmApiKeyUpdateRequest
  ) => Promise<BaseResponse<LlmApiKeySafe>>;
  deleteKey: (keyId: string) => Promise<BaseResponse<LlmApiKeySafe>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing LLM API keys
 * Uses TanStack Query for caching with automatic refresh after mutations
 */
export const useKeys = (
  networkClient: NetworkClient,
  baseUrl: string,
  entitySlug: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
  }
): UseKeysReturn => {
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
    queryKey: QUERY_KEYS.keys(entitySlug ?? ''),
    queryFn: async () => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      const response = await client.getKeys(entitySlug, token);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch keys');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidateKeys = useCallback(() => {
    if (entitySlug) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.keys(entitySlug) });
    }
  }, [queryClient, entitySlug]);

  const createMutation = useMutation({
    mutationFn: async (data: LlmApiKeyCreateRequest) => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      return client.createKey(entitySlug, data, token);
    },
    onSuccess: response => {
      if (response.success) invalidateKeys();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      keyId,
      data,
    }: {
      keyId: string;
      data: LlmApiKeyUpdateRequest;
    }) => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      return client.updateKey(entitySlug, keyId, data, token);
    },
    onSuccess: response => {
      if (response.success) invalidateKeys();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      return client.deleteKey(entitySlug, keyId, token);
    },
    onSuccess: response => {
      if (response.success) invalidateKeys();
    },
  });

  const getKey = useCallback(
    async (keyId: string): Promise<BaseResponse<LlmApiKeySafe>> => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      try {
        return await client.getKey(entitySlug, keyId, token);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get key';
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    },
    [client, entitySlug, token]
  );

  const createKey = useCallback(
    (data: LlmApiKeyCreateRequest) => createMutation.mutateAsync(data),
    [createMutation]
  );

  const updateKey = useCallback(
    (keyId: string, data: LlmApiKeyUpdateRequest) =>
      updateMutation.mutateAsync({ keyId, data }),
    [updateMutation]
  );

  const deleteKey = useCallback(
    (keyId: string) => deleteMutation.mutateAsync(keyId),
    [deleteMutation]
  );

  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;
  const error =
    queryError instanceof Error
      ? queryError.message
      : mutationError instanceof Error
        ? mutationError.message
        : null;

  const clearError = useCallback(() => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  }, [createMutation, updateMutation, deleteMutation]);

  const reset = useCallback(() => {
    if (entitySlug) {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.keys(entitySlug) });
    }
    clearError();
  }, [queryClient, entitySlug, clearError]);

  return useMemo(
    () => ({
      keys: data ?? EMPTY_KEYS,
      isLoading:
        isLoading ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending,
      error,
      refetch,
      getKey,
      createKey,
      updateKey,
      deleteKey,
      clearError,
      reset,
    }),
    [
      data,
      isLoading,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      error,
      refetch,
      getKey,
      createKey,
      updateKey,
      deleteKey,
      clearError,
      reset,
    ]
  );
};
