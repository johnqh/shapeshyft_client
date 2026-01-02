import { useCallback, useMemo, useState } from 'react';
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

/**
 * Return type for useProjects hook
 */
export interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: Optional<string>;

  refresh: (
    entitySlug: string,
    token: FirebaseIdToken,
    params?: ProjectQueryParams
  ) => Promise<void>;
  getProject: (
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Project>>;
  createProject: (
    entitySlug: string,
    data: ProjectCreateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Project>>;
  updateProject: (
    entitySlug: string,
    projectId: string,
    data: ProjectUpdateRequest,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Project>>;
  deleteProject: (
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<Project>>;
  getProjectApiKey: (
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<GetApiKeyResponse>>;
  refreshProjectApiKey: (
    entitySlug: string,
    projectId: string,
    token: FirebaseIdToken
  ) => Promise<BaseResponse<RefreshApiKeyResponse>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing projects
 * Provides CRUD operations with automatic refresh after mutations
 */
export const useProjects = (
  networkClient: NetworkClient,
  baseUrl: string
): UseProjectsReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Store last params for refresh after mutations
  const [lastParams, setLastParams] =
    useState<Optional<ProjectQueryParams>>(null);

  /**
   * Refresh projects list
   */
  const refresh = useCallback(
    async (
      entitySlug: string,
      token: FirebaseIdToken,
      params?: ProjectQueryParams
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setLastParams(params);

      try {
        const response = await client.getProjects(entitySlug, token, params);
        if (response.success && response.data) {
          setProjects(response.data);
        } else {
          setError(response.error || 'Failed to fetch projects');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch projects';
        setError(errorMessage);
        console.error('[useProjects] refresh error:', errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get a single project
   */
  const getProject = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Project>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getProject(entitySlug, projectId, token);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get project';
        setError(errorMessage);
        console.error('[useProjects] getProject error:', errorMessage, err);
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
   * Create a new project and refresh the list
   */
  const createProject = useCallback(
    async (
      entitySlug: string,
      data: ProjectCreateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Project>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createProject(entitySlug, data, token);
        if (response.success) {
          await refresh(entitySlug, token, lastParams ?? undefined);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create project';
        setError(errorMessage);
        console.error('[useProjects] createProject error:', errorMessage, err);
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
   * Update a project and refresh the list
   */
  const updateProject = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      data: ProjectUpdateRequest,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Project>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateProject(
          entitySlug,
          projectId,
          data,
          token
        );
        if (response.success) {
          await refresh(entitySlug, token, lastParams ?? undefined);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update project';
        setError(errorMessage);
        console.error('[useProjects] updateProject error:', errorMessage, err);
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
   * Delete a project and refresh the list
   */
  const deleteProject = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<Project>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.deleteProject(
          entitySlug,
          projectId,
          token
        );
        if (response.success) {
          await refresh(entitySlug, token, lastParams ?? undefined);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete project';
        setError(errorMessage);
        console.error('[useProjects] deleteProject error:', errorMessage, err);
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
   * Get project API key (full key)
   */
  const getProjectApiKey = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<GetApiKeyResponse>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getProjectApiKey(
          entitySlug,
          projectId,
          token
        );
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get API key';
        setError(errorMessage);
        console.error(
          '[useProjects] getProjectApiKey error:',
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
   * Refresh project API key (generates new key)
   */
  const refreshProjectApiKey = useCallback(
    async (
      entitySlug: string,
      projectId: string,
      token: FirebaseIdToken
    ): Promise<BaseResponse<RefreshApiKeyResponse>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.refreshProjectApiKey(
          entitySlug,
          projectId,
          token
        );
        if (response.success) {
          // Refresh projects list to get updated api_key_prefix
          await refresh(entitySlug, token, lastParams ?? undefined);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to refresh API key';
        setError(errorMessage);
        console.error(
          '[useProjects] refreshProjectApiKey error:',
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
    setProjects([]);
    setError(null);
    setIsLoading(false);
    setLastParams(null);
  }, []);

  return useMemo(
    () => ({
      projects,
      isLoading,
      error,
      refresh,
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
      projects,
      isLoading,
      error,
      refresh,
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
