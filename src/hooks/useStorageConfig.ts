import { useCallback, useMemo, useState } from 'react';
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

/**
 * Return type for useStorageConfig hook
 */
export interface UseStorageConfigReturn {
  storageConfig: EntityStorageConfig | null;
  isLoading: boolean;
  error: Optional<string>;
  /** Whether storage is configured for the entity */
  hasConfig: boolean;

  refresh: (entitySlug: string, token: FirebaseIdToken) => Promise<void>;
  createOrUpdate: (
    entitySlug: string,
    data: StorageConfigCreateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<EntityStorageConfig>>;
  update: (
    entitySlug: string,
    data: StorageConfigUpdateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<EntityStorageConfig>>;
  deleteConfig: (
    entitySlug: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<EntityStorageConfig>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing entity storage configuration
 * Provides CRUD operations for cloud storage settings (GCS/S3)
 */
export const useStorageConfig = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseStorageConfigReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const [storageConfig, setStorageConfig] =
    useState<EntityStorageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Refresh storage config
   */
  const refresh = useCallback(
    async (entitySlug: string, token: FirebaseIdToken): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getStorageConfig(entitySlug, token);
        if (response.success && response.data) {
          setStorageConfig(response.data);
        } else {
          // 404 is expected if no config exists
          setStorageConfig(null);
          if (response.error && !response.error.includes('not found')) {
            setError(response.error);
          }
        }
      } catch (err) {
        // 404 is expected if no config exists
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch storage config';
        if (
          errorMessage.includes('not found') ||
          errorMessage.includes('404')
        ) {
          setStorageConfig(null);
        } else {
          setError(errorMessage);
          console.error('[useStorageConfig] refresh error:', errorMessage, err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Create or update storage config (upsert)
   */
  const createOrUpdate = useCallback(
    async (
      entitySlug: string,
      data: StorageConfigCreateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<EntityStorageConfig>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createStorageConfig(
          entitySlug,
          data,
          token
        );
        if (response.success && response.data) {
          setStorageConfig(response.data);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to create/update storage config';
        setError(errorMessage);
        console.error(
          '[useStorageConfig] createOrUpdate error:',
          errorMessage,
          err
        );
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
   * Update storage config (partial update)
   */
  const update = useCallback(
    async (
      entitySlug: string,
      data: StorageConfigUpdateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<EntityStorageConfig>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateStorageConfig(
          entitySlug,
          data,
          token
        );
        if (response.success && response.data) {
          setStorageConfig(response.data);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update storage config';
        setError(errorMessage);
        console.error('[useStorageConfig] update error:', errorMessage, err);
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
   * Delete storage config
   */
  const deleteConfig = useCallback(
    async (
      entitySlug: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<EntityStorageConfig>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.deleteStorageConfig(entitySlug, token);
        if (response.success) {
          setStorageConfig(null);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to delete storage config';
        setError(errorMessage);
        console.error(
          '[useStorageConfig] deleteConfig error:',
          errorMessage,
          err
        );
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
    setStorageConfig(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const hasConfig = storageConfig !== null;

  return useMemo(
    () => ({
      storageConfig,
      isLoading,
      error,
      hasConfig,
      refresh,
      createOrUpdate,
      update,
      deleteConfig,
      clearError,
      reset,
    }),
    [
      storageConfig,
      isLoading,
      error,
      hasConfig,
      refresh,
      createOrUpdate,
      update,
      deleteConfig,
      clearError,
      reset,
    ]
  );
};
