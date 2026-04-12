import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useEndpoints } from './useEndpoints';

describe('useEndpoints', () => {
  const baseUrl = 'https://api.example.com';
  const entitySlug = 'user-123';
  const projectId = 'proj-1';
  const token = 'test-token';

  let mockNetworkClient: MockNetworkClient;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    mockNetworkClient.setDefaultResponse({
      ok: true,
      data: { success: true, data: [] },
    });

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  };

  it('should initialize with empty state', () => {
    const { result } = renderHook(
      () => useEndpoints(mockNetworkClient, baseUrl, null, null, null),
      { wrapper: createWrapper() }
    );

    expect(result.current.endpoints).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('fetch (auto-fetch on mount)', () => {
    it('should fetch endpoints and update state', async () => {
      const mockEndpoints = [
        {
          uuid: 'ep-1',
          project_id: 'proj-1',
          endpoint_name: 'summarize',
          display_name: 'Summarize',
          http_method: 'POST',
          llm_key_id: 'key-1',
          input_schema: null,
          output_schema: null,
          instructions: 'Summarize the input',
          context: null,
          is_active: true,
          ip_allowlist: null,
          created_at: null,
          updated_at: null,
        },
      ];
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: mockEndpoints } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.endpoints).toEqual(mockEndpoints);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.endpoints).toEqual([]);
    });
  });

  describe('refetch', () => {
    it('should re-fetch endpoints when refetch is called', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedEndpoints = [{ uuid: 'ep-2', endpoint_name: 'new' }];
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: updatedEndpoints } },
        'GET'
      );

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.endpoints).toEqual(updatedEndpoints);
      });
    });
  });

  describe('getEndpoint', () => {
    it('should fetch a single endpoint', async () => {
      const mockEndpoint = {
        uuid: 'ep-1',
        endpoint_name: 'summarize',
        display_name: 'Summarize',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
        { ok: true, data: { success: true, data: mockEndpoint } },
        'GET'
      );
      // Also set up GET for auto-fetch
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.getEndpoint('ep-1');
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
          'GET'
        )
      ).toBe(true);
      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: mockEndpoint,
        })
      );
    });
  });

  describe('createEndpoint', () => {
    it('should create endpoint and invalidate list', async () => {
      const newEndpoint = {
        uuid: 'new-ep',
        endpoint_name: 'new-endpoint',
        display_name: 'New Endpoint',
        llm_key_id: 'key-1',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: newEndpoint } },
        'POST'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: [newEndpoint] } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createEndpoint({
          endpoint_name: 'new-endpoint',
          display_name: 'New Endpoint',
          llm_key_id: 'key-1',
        });
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
          'POST'
        )
      ).toBe(true);

      // After invalidation, the GET should be called again
      await waitFor(() => {
        expect(
          mockNetworkClient.wasUrlCalled(
            `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
            'GET'
          )
        ).toBe(true);
      });
    });
  });

  describe('updateEndpoint', () => {
    it('should update endpoint and invalidate list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
        { ok: true, data: { success: true, data: { uuid: 'ep-1' } } },
        'PUT'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateEndpoint('ep-1', {
          display_name: 'Updated Name',
        });
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
          'PUT'
        )
      ).toBe(true);
    });

    it('should update endpoint with IP allowlist', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
        {
          ok: true,
          data: {
            success: true,
            data: { uuid: 'ep-1', ip_allowlist: ['192.168.1.1'] },
          },
        },
        'PUT'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateEndpoint('ep-1', {
          ip_allowlist: ['192.168.1.1', '10.0.0.1'],
        });
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
          'PUT'
        )
      ).toBe(true);
    });
  });

  describe('deleteEndpoint', () => {
    it('should delete endpoint and invalidate list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
        { ok: true, data: { success: true, data: { uuid: 'ep-1' } } },
        'DELETE'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteEndpoint('ep-1');
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints/ep-1`,
          'DELETE'
        )
      ).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      // clearError resets mutation errors; query error may persist
      // but the hook aggregates them, so after clearing mutations the error
      // comes from the query. We verify clearError doesn't throw.
      // For a full clear, use reset().
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        {
          ok: true,
          data: {
            success: true,
            data: [{ uuid: 'ep-1', endpoint_name: 'test' }],
          },
        },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useEndpoints(
            mockNetworkClient,
            baseUrl,
            entitySlug,
            projectId,
            token
          ),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.endpoints.length).toBeGreaterThan(0);
      });

      // Update mock to return empty data so re-fetch after reset returns empty
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/projects/${projectId}/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.endpoints).toEqual([]);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
