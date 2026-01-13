import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useEndpoints } from './useEndpoints';

describe('useEndpoints', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: MockNetworkClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    // Set default response to prevent unmatched URL errors
    mockNetworkClient.setDefaultResponse({
      ok: true,
      data: { success: true, data: [] },
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() =>
      useEndpoints(mockNetworkClient, baseUrl)
    );

    expect(result.current.endpoints).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('refresh', () => {
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
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        { ok: true, data: { success: true, data: mockEndpoints } },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'proj-1', 'token');
      });

      expect(result.current.endpoints).toEqual(mockEndpoints);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'proj-1', 'token');
      });

      expect(result.current.endpoints).toEqual([]);
      expect(result.current.error).toBeTruthy();
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
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
        { ok: true, data: { success: true, data: mockEndpoint } },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      let response;
      await act(async () => {
        response = await result.current.getEndpoint(
          'user-123',
          'proj-1',
          'ep-1',
          'token'
        );
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
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
    it('should create endpoint and refresh list', async () => {
      const newEndpoint = {
        uuid: 'new-ep',
        endpoint_name: 'new-endpoint',
        display_name: 'New Endpoint',
        llm_key_id: 'key-1',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        { ok: true, data: { success: true, data: newEndpoint } },
        'POST'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        { ok: true, data: { success: true, data: [newEndpoint] } },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.createEndpoint(
          'user-123',
          'proj-1',
          {
            endpoint_name: 'new-endpoint',
            display_name: 'New Endpoint',
            llm_key_id: 'key-1',
          },
          'token'
        );
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
          'POST'
        )
      ).toBe(true);
      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
          'GET'
        )
      ).toBe(true);
    });
  });

  describe('updateEndpoint', () => {
    it('should update endpoint and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
        { ok: true, data: { success: true, data: { uuid: 'ep-1' } } },
        'PUT'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.updateEndpoint(
          'user-123',
          'proj-1',
          'ep-1',
          { display_name: 'Updated Name' },
          'token'
        );
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
          'PUT'
        )
      ).toBe(true);
    });

    it('should update endpoint with IP allowlist', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
        {
          ok: true,
          data: {
            success: true,
            data: { uuid: 'ep-1', ip_allowlist: ['192.168.1.1'] },
          },
        },
        'PUT'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.updateEndpoint(
          'user-123',
          'proj-1',
          'ep-1',
          { ip_allowlist: ['192.168.1.1', '10.0.0.1'] },
          'token'
        );
      });

      // Verify the PUT request was made
      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
          'PUT'
        )
      ).toBe(true);
    });
  });

  describe('deleteEndpoint', () => {
    it('should delete endpoint and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
        { ok: true, data: { success: true, data: { uuid: 'ep-1' } } },
        'DELETE'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.deleteEndpoint(
          'user-123',
          'proj-1',
          'ep-1',
          'token'
        );
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints/ep-1`,
          'DELETE'
        )
      ).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'proj-1', 'token');
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
        `${baseUrl}/api/v1/entities/user-123/projects/proj-1/endpoints`,
        {
          ok: true,
          data: {
            success: true,
            data: [{ uuid: 'ep-1', endpoint_name: 'test' }],
          },
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useEndpoints(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'proj-1', 'token');
      });

      expect(result.current.endpoints.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.endpoints).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
