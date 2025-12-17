import { useCallback, useMemo, useState } from 'react';
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

/**
 * Return type for useKeys hook
 */
export interface UseKeysReturn {
  keys: LlmApiKeySafe[];
  isLoading: boolean;
  error: Optional<string>;

  refresh: (userId: string, token: FirebaseIdToken) => Promise<void>;
  getKey: (
    userId: string,
    keyId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<LlmApiKeySafe>>;
  createKey: (
    userId: string,
    data: LlmApiKeyCreateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<LlmApiKeySafe>>;
  updateKey: (
    userId: string,
    keyId: string,
    data: LlmApiKeyUpdateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<LlmApiKeySafe>>;
  deleteKey: (
    userId: string,
    keyId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<LlmApiKeySafe>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing LLM API keys
 * Provides CRUD operations with automatic refresh after mutations
 */
export const useKeys = (
  networkClient: NetworkClient,
  baseUrl: string
): UseKeysReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const [keys, setKeys] = useState<LlmApiKeySafe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Refresh keys list
   */
  const refresh = useCallback(
    async (userId: string, token: FirebaseIdToken): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getKeys(userId, token);
        if (response.success && response.data) {
          setKeys(response.data);
        } else {
          setError(response.error || 'Failed to fetch keys');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch keys';
        setError(errorMessage);
        console.error('[useKeys] refresh error:', errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get a single key
   */
  const getKey = useCallback(
    async (
      userId: string,
      keyId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<LlmApiKeySafe>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getKey(userId, keyId, token);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get key';
        setError(errorMessage);
        console.error('[useKeys] getKey error:', errorMessage, err);
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

  /**
   * Create a new key and refresh the list
   */
  const createKey = useCallback(
    async (
      userId: string,
      data: LlmApiKeyCreateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<LlmApiKeySafe>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createKey(userId, data, token);
        if (response.success) {
          // Refresh the list after successful creation
          await refresh(userId, token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create key';
        setError(errorMessage);
        console.error('[useKeys] createKey error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refresh]
  );

  /**
   * Update a key and refresh the list
   */
  const updateKey = useCallback(
    async (
      userId: string,
      keyId: string,
      data: LlmApiKeyUpdateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<LlmApiKeySafe>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateKey(userId, keyId, data, token);
        if (response.success) {
          // Refresh the list after successful update
          await refresh(userId, token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update key';
        setError(errorMessage);
        console.error('[useKeys] updateKey error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refresh]
  );

  /**
   * Delete a key and refresh the list
   */
  const deleteKey = useCallback(
    async (
      userId: string,
      keyId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<LlmApiKeySafe>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.deleteKey(userId, keyId, token);
        if (response.success) {
          // Refresh the list after successful deletion
          await refresh(userId, token);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete key';
        setError(errorMessage);
        console.error('[useKeys] deleteKey error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client, refresh]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setKeys([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      keys,
      isLoading,
      error,
      refresh,
      getKey,
      createKey,
      updateKey,
      deleteKey,
      clearError,
      reset,
    }),
    [
      keys,
      isLoading,
      error,
      refresh,
      getKey,
      createKey,
      updateKey,
      deleteKey,
      clearError,
      reset,
    ]
  );
};
