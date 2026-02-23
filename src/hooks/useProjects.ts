import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BaseResponse,
  GetApiKeyResponse,
  NetworkClient,
  Optional,
  Project,
  ProjectCreateRequest,
  ProjectQueryParams,
  ProjectUpdateRequest,
  RefreshApiKeyResponse,
} from '@sudobility/shapeshyft_types';
import type { FirebaseIdToken } from '../types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';
import { QUERY_KEYS } from '../types';

// Stable empty array to prevent unnecessary re-renders
const EMPTY_PROJECTS: Project[] = [];

/**
 * Return type for useProjects hook
 */
export interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: Optional<string>;

  refetch: () => void;
  getProject: (projectId: string) => Promise<BaseResponse<Project>>;
  createProject: (data: ProjectCreateRequest) => Promise<BaseResponse<Project>>;
  updateProject: (
    projectId: string,
    data: ProjectUpdateRequest
  ) => Promise<BaseResponse<Project>>;
  deleteProject: (projectId: string) => Promise<BaseResponse<Project>>;
  getProjectApiKey: (
    projectId: string
  ) => Promise<BaseResponse<GetApiKeyResponse>>;
  refreshProjectApiKey: (
    projectId: string
  ) => Promise<BaseResponse<RefreshApiKeyResponse>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing projects
 * Uses TanStack Query for caching with automatic refresh after mutations
 */
export const useProjects = (
  networkClient: NetworkClient,
  baseUrl: string,
  entitySlug: string | null,
  token: FirebaseIdToken | null,
  options?: {
    testMode?: boolean;
    enabled?: boolean;
    params?: ProjectQueryParams;
  }
): UseProjectsReturn => {
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
    queryKey: QUERY_KEYS.projects(entitySlug ?? ''),
    queryFn: async () => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      const response = await client.getProjects(
        entitySlug,
        token,
        options?.params
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch projects');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidateProjects = useCallback(() => {
    if (entitySlug) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projects(entitySlug),
      });
    }
  }, [queryClient, entitySlug]);

  const createMutation = useMutation({
    mutationFn: async (data: ProjectCreateRequest) => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      return client.createProject(entitySlug, data, token);
    },
    onSuccess: response => {
      if (response.success) invalidateProjects();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: ProjectUpdateRequest;
    }) => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      return client.updateProject(entitySlug, projectId, data, token);
    },
    onSuccess: response => {
      if (response.success) invalidateProjects();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      return client.deleteProject(entitySlug, projectId, token);
    },
    onSuccess: response => {
      if (response.success) invalidateProjects();
    },
  });

  const refreshApiKeyMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      return client.refreshProjectApiKey(entitySlug, projectId, token);
    },
    onSuccess: response => {
      if (response.success) invalidateProjects();
    },
  });

  const getProject = useCallback(
    async (projectId: string): Promise<BaseResponse<Project>> => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      try {
        return await client.getProject(entitySlug, projectId, token);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get project';
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    },
    [client, entitySlug, token]
  );

  const getProjectApiKey = useCallback(
    async (projectId: string): Promise<BaseResponse<GetApiKeyResponse>> => {
      if (!entitySlug || !token) throw new Error('Missing required params');
      try {
        return await client.getProjectApiKey(entitySlug, projectId, token);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get API key';
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    },
    [client, entitySlug, token]
  );

  const createProject = useCallback(
    (data: ProjectCreateRequest) => createMutation.mutateAsync(data),
    [createMutation]
  );

  const updateProject = useCallback(
    (projectId: string, data: ProjectUpdateRequest) =>
      updateMutation.mutateAsync({ projectId, data }),
    [updateMutation]
  );

  const deleteProject = useCallback(
    (projectId: string) => deleteMutation.mutateAsync(projectId),
    [deleteMutation]
  );

  const refreshProjectApiKey = useCallback(
    (projectId: string) => refreshApiKeyMutation.mutateAsync(projectId),
    [refreshApiKeyMutation]
  );

  // Derive error from query or mutation state
  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error ??
    refreshApiKeyMutation.error;
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
    refreshApiKeyMutation.reset();
  }, [createMutation, updateMutation, deleteMutation, refreshApiKeyMutation]);

  const reset = useCallback(() => {
    if (entitySlug) {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projects(entitySlug) });
    }
    clearError();
  }, [queryClient, entitySlug, clearError]);

  return useMemo(
    () => ({
      projects: data ?? EMPTY_PROJECTS,
      isLoading:
        isLoading ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending,
      error,
      refetch,
      getProject,
      createProject,
      updateProject,
      deleteProject,
      getProjectApiKey,
      refreshProjectApiKey,
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
      getProject,
      createProject,
      updateProject,
      deleteProject,
      getProjectApiKey,
      refreshProjectApiKey,
      clearError,
      reset,
    ]
  );
};
