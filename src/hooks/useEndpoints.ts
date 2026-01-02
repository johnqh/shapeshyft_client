import { useCallback, useMemo, useState } from 'react';
import type {
  BaseResponse,
  Endpoint,
  EndpointCreateRequest,
  EndpointQueryParams,
  EndpointUpdateRequest,
  NetworkClient,
  Optional,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';

/**
 * Return type for useEndpoints hook
 */
export interface UseEndpointsReturn {
  endpoints: Endpoint[];
  isLoading: boolean;
  error: Optional<string>;

  refresh: (
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken,
    params?: EndpointQueryParams
  ) => Promise<void>;
  getEndpoint: (
    entitySlug: string,
    projectId: string,
    endpointId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Endpoint>>;
  createEndpoint: (
    entitySlug: string,
    projectId: string,
    data: EndpointCreateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Endpoint>>;
  updateEndpoint: (
    entitySlug: string,
    projectId: string,
    endpointId: string,
    data: EndpointUpdateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Endpoint>>;
  deleteEndpoint: (
    entitySlug: string,
    projectId: string,
    endpointId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Endpoint>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing endpoints
 * Provides CRUD operations with automatic refresh after mutations
 */
export const useEndpoints = (
  networkClient: NetworkClient,
  baseUrl: string
): UseEndpointsReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Store last params for refresh after mutations
  const [lastParams, setLastParams] =
    useState<Optional<EndpointQueryParams>>(null);

  /**
   * Refresh endpoints list
   */
  const refresh = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      token: FirebaseIdToken,
      params?: EndpointQueryParams
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setLastParams(params);

      try {
        const response = await client.getEndpoints(
          entitySlug,
          projectId,
          token,
          params
        );
        if (response.success && response.data) {
          setEndpoints(response.data);
        } else {
          setError(response.error || 'Failed to fetch endpoints');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch endpoints';
        setError(errorMessage);
        console.error('[useEndpoints] refresh error:', errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get a single endpoint
   */
  const getEndpoint = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      endpointId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Endpoint>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getEndpoint(
          entitySlug,
          projectId,
          endpointId,
          token
        );
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get endpoint';
        setError(errorMessage);
        console.error('[useEndpoints] getEndpoint error:', errorMessage, err);
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
   * Create a new endpoint and refresh the list
   */
  const createEndpoint = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      data: EndpointCreateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Endpoint>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createEndpoint(
          entitySlug,
          projectId,
          data,
          token
        );
        if (response.success) {
          await refresh(entitySlug, projectId, token, lastParams ?? undefined);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create endpoint';
        setError(errorMessage);
        console.error(
          '[useEndpoints] createEndpoint error:',
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
    [client, refresh, lastParams]
  );

  /**
   * Update an endpoint and refresh the list
   */
  const updateEndpoint = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      endpointId: string,
      data: EndpointUpdateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Endpoint>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateEndpoint(
          entitySlug,
          projectId,
          endpointId,
          data,
          token
        );
        if (response.success) {
          await refresh(entitySlug, projectId, token, lastParams ?? undefined);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update endpoint';
        setError(errorMessage);
        console.error(
          '[useEndpoints] updateEndpoint error:',
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
    [client, refresh, lastParams]
  );

  /**
   * Delete an endpoint and refresh the list
   */
  const deleteEndpoint = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      endpointId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Endpoint>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.deleteEndpoint(
          entitySlug,
          projectId,
          endpointId,
          token
        );
        if (response.success) {
          await refresh(entitySlug, projectId, token, lastParams ?? undefined);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete endpoint';
        setError(errorMessage);
        console.error(
          '[useEndpoints] deleteEndpoint error:',
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
    [client, refresh, lastParams]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setEndpoints([]);
    setError(null);
    setIsLoading(false);
    setLastParams(null);
  }, []);

  return useMemo(
    () => ({
      endpoints,
      isLoading,
      error,
      refresh,
      getEndpoint,
      createEndpoint,
      updateEndpoint,
      deleteEndpoint,
      clearError,
      reset,
    }),
    [
      endpoints,
      isLoading,
      error,
      refresh,
      getEndpoint,
      createEndpoint,
      updateEndpoint,
      deleteEndpoint,
      clearError,
      reset,
    ]
  );
};
