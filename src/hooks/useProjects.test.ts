import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useProjects } from './useProjects';

describe('useProjects', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: MockNetworkClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    // Set default response to prevent unmatched URL errors
    mockNetworkClient.setDefaultResponse({ ok: true, data: { success: true, data: [] } });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

    expect(result.current.projects).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('refresh', () => {
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
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: mockProjects } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });

    it('should handle loading state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      // Initially not loading
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      // After completion, not loading
      expect(result.current.isLoading).toBe(false);
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
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: newProject } },
        'POST'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: [newProject] } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.createProject(
          'user-123',
          { project_name: 'new-project', display_name: 'New Project' },
          'token'
        );
      });

      expect(mockNetworkClient.wasUrlCalled(`${baseUrl}/api/v1/users/user-123/projects`, 'POST')).toBe(true);
      expect(mockNetworkClient.wasUrlCalled(`${baseUrl}/api/v1/users/user-123/projects`, 'GET')).toBe(true);
    });
  });

  describe('updateProject', () => {
    it('should update project and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects/proj-1`,
        { ok: true, data: { success: true, data: { uuid: 'proj-1' } } },
        'PUT'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.updateProject(
          'user-123',
          'proj-1',
          { display_name: 'Updated Name' },
          'token'
        );
      });

      expect(mockNetworkClient.wasUrlCalled(`${baseUrl}/api/v1/users/user-123/projects/proj-1`, 'PUT')).toBe(true);
    });
  });

  describe('deleteProject', () => {
    it('should delete project and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects/proj-1`,
        { ok: true, data: { success: true, data: { uuid: 'proj-1' } } },
        'DELETE'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.deleteProject('user-123', 'proj-1', 'token');
      });

      expect(mockNetworkClient.wasUrlCalled(`${baseUrl}/api/v1/users/user-123/projects/proj-1`, 'DELETE')).toBe(true);
    });
  });

  describe('getProjectApiKey', () => {
    it('should fetch project API key', async () => {
      const mockApiKey = { api_key: 'sk_live_abc123def456' };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects/proj-1/api-key`,
        { ok: true, data: { success: true, data: mockApiKey } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      let response;
      await act(async () => {
        response = await result.current.getProjectApiKey('user-123', 'proj-1', 'token');
      });

      expect(mockNetworkClient.wasUrlCalled(`${baseUrl}/api/v1/users/user-123/projects/proj-1/api-key`, 'GET')).toBe(true);
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: mockApiKey,
        })
      );
    });

    it('should handle error when fetching API key', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects/proj-1/api-key`,
        { ok: false, data: { success: false, error: 'Failed to get API key' } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      let response;
      await act(async () => {
        response = await result.current.getProjectApiKey('user-123', 'proj-1', 'token');
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
        `${baseUrl}/api/v1/users/user-123/projects/proj-1/api-key/refresh`,
        { ok: true, data: { success: true, data: mockNewApiKey } },
        'POST'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      let response;
      await act(async () => {
        response = await result.current.refreshProjectApiKey('user-123', 'proj-1', 'token');
      });

      expect(mockNetworkClient.wasUrlCalled(`${baseUrl}/api/v1/users/user-123/projects/proj-1/api-key/refresh`, 'POST')).toBe(true);
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: mockNewApiKey,
        })
      );
      // Should also refresh the projects list
      expect(mockNetworkClient.wasUrlCalled(`${baseUrl}/api/v1/users/user-123/projects`, 'GET')).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/user-123/projects`,
        { ok: true, data: { success: true, data: [{ uuid: 'proj-1', project_name: 'test' }] } },
        'GET'
      );

      const { result } = renderHook(() => useProjects(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.projects.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
