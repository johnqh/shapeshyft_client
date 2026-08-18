import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  NetworkClient,
  Optional,
} from '@sudobility/shapeshyft_types';
import type {
  FirebaseIdToken,
  UserApiKey,
  UserApiKeyCreated,
  UserApiKeyCreateRequest,
  UserApiKeyUpdateRequest,
} from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';
import { QUERY_KEYS } from '../types';

/**
 * Return type for the {@link useUserApiKeys} hook.
 */
export interface UseUserApiKeysReturn {
  /** The user's personal API keys, newest first; empty while loading */
  apiKeys: UserApiKey[];
  /** True while any query or mutation is in progress */
  isLoading: boolean;
  /** Error message from the most recent failed query or mutation, or null */
  error: Optional<string>;

  /** Trigger a refetch of the key list */
  refetch: () => void;

  /**
   * Create a key. The response is the ONLY place the full `shyft_...` secret
   * appears without asking -- surface it to the user immediately.
   */
  createApiKey: (
    data: UserApiKeyCreateRequest
  ) => Promise<BaseResponse<UserApiKeyCreated>>;
  /** Reveal an existing key's secret so it can be copied again */
  revealApiKey: (keyId: string) => Promise<string>;
  /** Rename a key or toggle whether it is accepted */
  updateApiKey: (
    keyId: string,
    data: UserApiKeyUpdateRequest
  ) => Promise<BaseResponse<UserApiKey>>;
  /** Permanently revoke a key */
  deleteApiKey: (keyId: string) => Promise<BaseResponse<UserApiKey>>;

  /** Clear any mutation error state */
  clearError: () => void;
}

/**
 * Hook for managing a user's personal ShapeShyft API keys (`shyft_...`).
 *
 * These keys authenticate their owner against the admin routes as an
 * alternative to a Firebase ID token, which is what makes non-browser clients
 * (CLIs, MCP servers, scripts) practical -- a token expires in about an hour,
 * a key does not.
 *
 * Creating and revealing keys require a Firebase ID token, so pass a real token
 * here rather than an API key.
 *
 * @param networkClient - NetworkClient instance for making HTTP requests
 * @param baseUrl - Base URL of the ShapeShyft API
 * @param userId - Firebase UID of the user, or null to disable fetching
 * @param token - Firebase ID token, or null to disable fetching
 * @param options - Optional configuration
 * @param options.testMode - When true, appends testMode=true to all API requests
 * @param options.enabled - When false, disables automatic fetching (default: true)
 * @returns {@link UseUserApiKeysReturn} with the key list, state, and mutations
 *
 * @example
 * ```tsx
 * const { apiKeys, createApiKey, deleteApiKey } = useUserApiKeys(
 *   networkClient,
 *   'https://api.shapeshyft.ai',
 *   userId,
 *   firebaseToken
 * );
 *
 * const response = await createApiKey({ key_name: 'CLI on my laptop' });
 * showOnce(response.data.api_key); // never retrievable from the list
 * ```
 */
export const useUserApiKeys = (
  networkClient: NetworkClient,
  baseUrl: string,
  userId: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
  }
): UseUserApiKeysReturn => {
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
    queryKey: QUERY_KEYS.userApiKeys(userId ?? ''),
    queryFn: async () => {
      if (!userId || !token) throw new Error('Missing required params');
      const response = await client.getUserApiKeys(userId, token);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch API keys');
      }
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userApiKeys(userId),
      });
    }
  }, [queryClient, userId]);

  const createMutation = useMutation({
    mutationFn: async (createData: UserApiKeyCreateRequest) => {
      if (!userId || !token) throw new Error('Missing required params');
      return client.createUserApiKey(userId, createData, token);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      keyId,
      data: updateData,
    }: {
      keyId: string;
      data: UserApiKeyUpdateRequest;
    }) => {
      if (!userId || !token) throw new Error('Missing required params');
      return client.updateUserApiKey(userId, keyId, updateData, token);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      if (!userId || !token) throw new Error('Missing required params');
      return client.deleteUserApiKey(userId, keyId, token);
    },
    onSuccess: invalidate,
  });

  const createApiKey = useCallback(
    (createData: UserApiKeyCreateRequest) =>
      createMutation.mutateAsync(createData),
    [createMutation]
  );

  const updateApiKey = useCallback(
    (keyId: string, updateData: UserApiKeyUpdateRequest) =>
      updateMutation.mutateAsync({ keyId, data: updateData }),
    [updateMutation]
  );

  const deleteApiKey = useCallback(
    (keyId: string) => deleteMutation.mutateAsync(keyId),
    [deleteMutation]
  );

  const revealApiKey = useCallback(
    async (keyId: string) => {
      if (!userId || !token) throw new Error('Missing required params');
      const response = await client.revealUserApiKey(userId, keyId, token);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to reveal API key');
      }
      return response.data.api_key;
    },
    [client, userId, token]
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

  return useMemo(
    () => ({
      apiKeys: data ?? [],
      isLoading:
        isLoading ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending,
      error,
      refetch: () => void refetch(),
      createApiKey,
      revealApiKey,
      updateApiKey,
      deleteApiKey,
      clearError,
    }),
    [
      data,
      isLoading,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      error,
      refetch,
      createApiKey,
      revealApiKey,
      updateApiKey,
      deleteApiKey,
      clearError,
    ]
  );
};
