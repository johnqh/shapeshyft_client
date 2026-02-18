import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useProjects } from './useProjects';

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useProjects', () => {
  const baseUrl = 'https://api.example.com';
  const entitySlug = 'user-123';
  const token = 'token';
  let mockNetworkClient: MockNetworkClient;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    // Set default response to prevent unmatched URL errors
    mockNetworkClient.setDefaultResponse({
      ok: true,
      data: { success: true, data: [] },
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(
      () => useProjects(mockNetworkClient, baseUrl, null, null),
      { wrapper: createWrapper(queryClient) }
    );

    expect(result.current.projects).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('auto-fetch', () => {
    it('should fetch projects and update state', async () => {
      const mockProjects = [
        {
          uuid: 'proj-1',
          user_id: 'user-123',
          project_name: 'my-project',
          display_name: 'My Project',
          description: null,
          is_active: true,
          api_key_prefix: 'sk_live_abc...',
          api_key_created_at: null,
          created_at: null,
          updated_at: null,
        },
      ];
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: mockProjects } },
        'GET'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.projects).toEqual(mockProjects);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.projects).toEqual([]);
    });

    it('should handle loading state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      // Initially loading (auto-fetch triggered)
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('refetch', () => {
    it('should refetch projects on demand', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedProjects = [
        {
          uuid: 'proj-1',
          project_name: 'my-project',
          display_name: 'My Project',
        },
      ];
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: updatedProjects } },
        'GET'
      );

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.projects).toEqual(updatedProjects);
      });
    });
  });

  describe('createProject', () => {
    it('should create project and refresh list', async () => {
      const newProject = {
        uuid: 'new-proj',
        project_name: 'new-project',
        display_name: 'New Project',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: newProject } },
        'POST'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createProject({
          project_name: 'new-project',
          display_name: 'New Project',
        });
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
          'POST'
        )
      ).toBe(true);
      // Invalidation triggers refetch
      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
          'GET'
        )
      ).toBe(true);
    });

    it('should rethrow on create failure', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: false, data: { success: false, error: 'Validation error' } },
        'POST'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.createProject({
            project_name: 'bad-project',
            display_name: 'Bad Project',
          });
        } catch {
          // expected - mutateAsync rethrows
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('updateProject', () => {
    it('should update project and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1`,
        { ok: true, data: { success: true, data: { uuid: 'proj-1' } } },
        'PUT'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateProject('proj-1', {
          display_name: 'Updated Name',
        });
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1`,
          'PUT'
        )
      ).toBe(true);
    });
  });

  describe('deleteProject', () => {
    it('should delete project and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1`,
        { ok: true, data: { success: true, data: { uuid: 'proj-1' } } },
        'DELETE'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteProject('proj-1');
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1`,
          'DELETE'
        )
      ).toBe(true);
    });
  });

  describe('getProjectApiKey', () => {
    it('should fetch project API key', async () => {
      const mockApiKey = { api_key: 'sk_live_abc123def456' };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1/api-key`,
        { ok: true, data: { success: true, data: mockApiKey } },
        'GET'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.getProjectApiKey('proj-1');
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1/api-key`,
          'GET'
        )
      ).toBe(true);
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: mockApiKey,
        })
      );
    });

    it('should handle error when fetching API key', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1/api-key`,
        {
          ok: false,
          data: { success: false, error: 'Failed to get API key' },
        },
        'GET'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.getProjectApiKey('proj-1');
      });

      expect(response).toEqual(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('refreshProjectApiKey', () => {
    it('should refresh project API key and update list', async () => {
      const mockNewApiKey = {
        api_key: 'sk_live_newkey123',
        api_key_prefix: 'sk_live_new...',
        api_key_created_at: '2025-01-15T10:00:00Z',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1/api-key/refresh`,
        { ok: true, data: { success: true, data: mockNewApiKey } },
        'POST'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.refreshProjectApiKey('proj-1');
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/proj-1/api-key/refresh`,
          'POST'
        )
      ).toBe(true);
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: mockNewApiKey,
        })
      );
      // Should also refresh the projects list via invalidation
      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
          'GET'
        )
      ).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: false, data: { success: false, error: 'Validation error' } },
        'POST'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.createProject({
            project_name: 'bad-project',
            display_name: 'Bad Project',
          });
        } catch {
          // expected - mutateAsync rethrows
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        {
          ok: true,
          data: {
            success: true,
            data: [{ uuid: 'proj-1', project_name: 'test' }],
          },
        },
        'GET'
      );

      const { result } = renderHook(
        () => useProjects(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.projects.length).toBeGreaterThan(0);
      });

      // Update mock to return empty data so re-fetch after reset returns empty
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.projects).toEqual([]);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
