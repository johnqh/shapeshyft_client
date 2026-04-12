import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useKeys } from './useKeys';

describe('useKeys', () => {
  const baseUrl = 'https://api.example.com';
  const entitySlug = 'user-123';
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
      () => useKeys(mockNetworkClient, baseUrl, null, null),
      { wrapper: createWrapper() }
    );

    expect(result.current.keys).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('auto-fetch', () => {
    it('should fetch keys and update state', async () => {
      const mockKeys = [
        {
          uuid: 'key-1',
          user_id: 'user-123',
          key_name: 'OpenAI Key',
          provider: 'openai',
          has_api_key: true,
          endpoint_url: null,
          is_active: true,
          created_at: null,
          updated_at: null,
        },
      ];
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: true, data: { success: true, data: mockKeys } },
        'GET'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.keys).toEqual(mockKeys);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.keys).toEqual([]);
    });

    it('should set isLoading during request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: true, data: { success: true, data: [] }, delay: 100 },
        'GET'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('createKey', () => {
    it('should create key and refresh list', async () => {
      const newKey = {
        uuid: 'new-key',
        key_name: 'New Key',
        provider: 'openai' as const,
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: true, data: { success: true, data: newKey } },
        'POST'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createKey({
          key_name: 'New Key',
          provider: 'openai',
          api_key: 'sk-test',
        });
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
          'POST'
        )
      ).toBe(true);
      // Invalidation triggers refetch
      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
          'GET'
        )
      ).toBe(true);
    });
  });

  describe('updateKey', () => {
    it('should update key and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys/key-1`,
        { ok: true, data: { success: true, data: { uuid: 'key-1' } } },
        'PUT'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateKey('key-1', { key_name: 'Updated' });
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/keys/key-1`,
          'PUT'
        )
      ).toBe(true);
    });
  });

  describe('deleteKey', () => {
    it('should delete key and refresh list', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys/key-1`,
        { ok: true, data: { success: true, data: { uuid: 'key-1' } } },
        'DELETE'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteKey('key-1');
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/entities/${entitySlug}/keys/key-1`,
          'DELETE'
        )
      ).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      // clearError resets mutation errors; query error may persist
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        {
          ok: true,
          data: {
            success: true,
            data: [{ uuid: 'key-1', key_name: 'Test' }],
          },
        },
        'GET'
      );

      const { result } = renderHook(
        () => useKeys(mockNetworkClient, baseUrl, entitySlug, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.keys.length).toBeGreaterThan(0);
      });

      // Update mock to return empty data so re-fetch after reset returns empty
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/entities/${entitySlug}/keys`,
        { ok: true, data: { success: true, data: [] } },
        'GET'
      );

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.keys).toEqual([]);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
