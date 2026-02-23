import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { QUERY_KEYS } from '../types';

// Stable empty array to prevent unnecessary re-renders
const EMPTY_ENDPOINTS: Endpoint[] = [];

/**
 * Return type for the {@link useEndpoints} hook.
 */
export interface UseEndpointsReturn {
  /** Array of endpoints for the current project (empty array while loading or on error) */
  endpoints: Endpoint[];
  /** True while any query or mutation is in progress */
  isLoading: boolean;
  /** Error message from the most recent failed query or mutation, or null */
  error: Optional<string>;

  /** Trigger a refetch of the endpoints list from the server */
  refetch: () => void;
  /** Fetch a single endpoint by ID. Returns a BaseResponse (does not throw on error). */
  getEndpoint: (endpointId: string) => Promise<BaseResponse<Endpoint>>;
  /** Create a new endpoint. Automatically invalidates the endpoints list on success. */
  createEndpoint: (
    data: EndpointCreateRequest
  ) => Promise<BaseResponse<Endpoint>>;
  /** Update an existing endpoint. Automatically invalidates the endpoints list on success. */
  updateEndpoint: (
    endpointId: string,
    data: EndpointUpdateRequest
  ) => Promise<BaseResponse<Endpoint>>;
  /** Delete an endpoint. Automatically invalidates the endpoints list on success. */
  deleteEndpoint: (endpointId: string) => Promise<BaseResponse<Endpoint>>;

  /** Clear any mutation error state */
  clearError: () => void;
  /** Remove all cached query data and clear errors */
  reset: () => void;
}

/**
 * Hook for managing endpoints within a project.
 * Uses TanStack Query for caching with automatic refresh after mutations.
 *
 * @param networkClient - NetworkClient instance for making HTTP requests
 * @param baseUrl - Base URL of the ShapeShyft API
 * @param entitySlug - Entity slug, or null to disable fetching
 * @param projectId - Project UUID to scope endpoints to, or null to disable fetching
 * @param token - Firebase ID token for authentication, or null to disable fetching
 * @param options - Optional configuration
 * @param options.testMode - When true, appends testMode=true to all API requests
 * @param options.enabled - When false, disables automatic fetching (default: true)
 * @param options.params - Query parameters for filtering endpoints (e.g., is_active)
 * @returns {@link UseEndpointsReturn} with endpoints data, loading/error state, and CRUD methods
 *
 * @example
 * ```tsx
 * const { endpoints, createEndpoint } = useEndpoints(
 *   networkClient,
 *   'https://api.shapeshyft.com',
 *   'my-org',
 *   'project-uuid',
 *   firebaseToken
 * );
 *
 * await createEndpoint({
 *   endpoint_name: 'summarize',
 *   display_name: 'Summarize',
 *   llm_key_id: 'key-uuid',
 * });
 * ```
 */
export const useEndpoints = (
  networkClient: NetworkClient,
  baseUrl: string,
  entitySlug: string | null,
  projectId: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
    params?: EndpointQueryParams;
  }
): UseEndpointsReturn => {
  const testMode = options?.testMode ?? false;
  const enabled =
    (options?.enabled ?? true) && !!entitySlug && !!projectId && !!token;

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
    queryKey: QUERY_KEYS.endpoints(entitySlug ?? '', projectId ?? ''),
    queryFn: async () => {
      if (!entitySlug || !projectId || !token)
        throw new Error('Missing required params');
      const response = await client.getEndpoints(
        entitySlug,
        projectId,
        token,
        options?.params
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch endpoints');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidateEndpoints = useCallback(() => {
    if (entitySlug && projectId) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.endpoints(entitySlug, projectId),
      });
    }
  }, [queryClient, entitySlug, projectId]);

  const createMutation = useMutation({
    mutationFn: async (data: EndpointCreateRequest) => {
      if (!entitySlug || !projectId || !token)
        throw new Error('Missing required params');
      return client.createEndpoint(entitySlug, projectId, data, token);
    },
    onSuccess: response => {
      if (response.success) invalidateEndpoints();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      endpointId,
      data,
    }: {
      endpointId: string;
      data: EndpointUpdateRequest;
    }) => {
      if (!entitySlug || !projectId || !token)
        throw new Error('Missing required params');
      return client.updateEndpoint(
        entitySlug,
        projectId,
        endpointId,
        data,
        token
      );
    },
    onSuccess: response => {
      if (response.success) invalidateEndpoints();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (endpointId: string) => {
      if (!entitySlug || !projectId || !token)
        throw new Error('Missing required params');
      return client.deleteEndpoint(entitySlug, projectId, endpointId, token);
    },
    onSuccess: response => {
      if (response.success) invalidateEndpoints();
    },
  });

  const getEndpoint = useCallback(
    async (endpointId: string): Promise<BaseResponse<Endpoint>> => {
      if (!entitySlug || !projectId || !token)
        throw new Error('Missing required params');
      try {
        return await client.getEndpoint(
          entitySlug,
          projectId,
          endpointId,
          token
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get endpoint';
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    },
    [client, entitySlug, projectId, token]
  );

  const createEndpoint = useCallback(
    (data: EndpointCreateRequest) => createMutation.mutateAsync(data),
    [createMutation]
  );

  const updateEndpoint = useCallback(
    (endpointId: string, data: EndpointUpdateRequest) =>
      updateMutation.mutateAsync({ endpointId, data }),
    [updateMutation]
  );

  const deleteEndpoint = useCallback(
    (endpointId: string) => deleteMutation.mutateAsync(endpointId),
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
    if (entitySlug && projectId) {
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.endpoints(entitySlug, projectId),
      });
    }
    clearError();
  }, [queryClient, entitySlug, projectId, clearError]);

  return useMemo(
    () => ({
      endpoints: data ?? EMPTY_ENDPOINTS,
      isLoading:
        isLoading ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending,
      error,
      refetch,
      getEndpoint,
      createEndpoint,
      updateEndpoint,
      deleteEndpoint,
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
      getEndpoint,
      createEndpoint,
      updateEndpoint,
      deleteEndpoint,
      clearError,
      reset,
    ]
  );
};
