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
 * Return type for the {@link useKeys} hook.
 */
export interface UseKeysReturn {
  /** Array of LLM API keys for the current entity (empty array while loading or on error) */
  keys: LlmApiKeySafe[];
  /** True while any query or mutation is in progress */
  isLoading: boolean;
  /** Error message string from the most recent failed query or mutation, or null if no error */
  error: Optional<string>;

  /** Trigger a refetch of the keys list from the server */
  refetch: () => void;
  /** Fetch a single key by ID. Returns a BaseResponse (does not throw on error). */
  getKey: (keyId: string) => Promise<BaseResponse<LlmApiKeySafe>>;
  /** Create a new LLM API key. Automatically invalidates the keys list on success. */
  createKey: (
    data: LlmApiKeyCreateRequest
  ) => Promise<BaseResponse<LlmApiKeySafe>>;
  /** Update an existing key. Automatically invalidates the keys list on success. */
  updateKey: (
    keyId: string,
    data: LlmApiKeyUpdateRequest
  ) => Promise<BaseResponse<LlmApiKeySafe>>;
  /** Delete a key. Automatically invalidates the keys list on success. */
  deleteKey: (keyId: string) => Promise<BaseResponse<LlmApiKeySafe>>;

  /** Clear any mutation error state (query errors are cleared on next successful fetch) */
  clearError: () => void;
  /** Remove all cached query data and clear errors. The query will re-fetch if still enabled. */
  reset: () => void;
}

/**
 * Hook for managing LLM API keys.
 * Uses TanStack Query for caching with automatic refresh after mutations.
 *
 * @param networkClient - NetworkClient instance for making HTTP requests
 * @param baseUrl - Base URL of the ShapeShyft API
 * @param entitySlug - Entity slug to scope keys to, or null to disable fetching
 * @param token - Firebase ID token for authentication, or null to disable fetching
 * @param options - Optional configuration
 * @param options.testMode - When true, appends testMode=true to all API requests
 * @param options.enabled - When false, disables automatic fetching (default: true)
 * @returns {@link UseKeysReturn} with keys data, loading/error state, and CRUD methods
 *
 * @example
 * ```tsx
 * const { keys, isLoading, error, createKey, deleteKey } = useKeys(
 *   networkClient,
 *   'https://api.shapeshyft.com',
 *   'my-org',
 *   firebaseToken
 * );
 *
 * // Create a key
 * await createKey({ key_name: 'OpenAI', provider: 'openai', api_key: 'sk-...' });
 *
 * // Delete a key
 * await deleteKey('key-uuid');
 * ```
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
