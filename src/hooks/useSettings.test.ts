import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useSettings } from './useSettings';

describe('useSettings', () => {
  const baseUrl = 'https://api.example.com';
  const userId = 'user-123';
  const token = 'test-token';
  let mockNetworkClient: MockNetworkClient;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    mockNetworkClient.setDefaultResponse({
      ok: true,
      data: { success: true, data: null },
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
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it('should initialize with empty state', () => {
    const { result } = renderHook(
      () => useSettings(mockNetworkClient, baseUrl, null, null),
      { wrapper: createWrapper() }
    );

    expect(result.current.settings).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('auto-fetch', () => {
    it('should fetch settings and update state', async () => {
      const mockSettings = {
        uuid: 'settings-1',
        user_id: 'user-123',
        default_organization: 'My Org',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: mockSettings } },
        'GET'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.settings).toBeNull();
    });

    it('should set isLoading during request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: null }, delay: 100 },
        'GET'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle network errors', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { error: new Error('Network error') },
        'GET'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('updateSettings', () => {
    it('should update settings and update state', async () => {
      const mockSettings = {
        uuid: 'settings-1',
        user_id: 'user-123',
        default_organization: 'My Org',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const updatedSettings = {
        ...mockSettings,
        default_organization: 'Updated Org',
        updated_at: '2024-01-02T00:00:00Z',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: mockSettings } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: updatedSettings } },
        'PUT'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      await act(async () => {
        const response = await result.current.updateSettings({
          default_organization: 'Updated Org',
        });
        expect(response.success).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.settings).toEqual(updatedSettings);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error on failed update', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: { uuid: 'settings-1' } } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { error: new Error('Update failed') },
        'PUT'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateSettings({
            default_organization: 'New Org',
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

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: { uuid: 'settings-1' } } },
        'GET'
      );
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { error: new Error('Network error') },
        'PUT'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateSettings({
            default_organization: 'Test',
          });
        } catch {
          // expected
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
    it('should reset all state', async () => {
      const mockSettings = {
        uuid: 'settings-1',
        user_id: 'user-123',
        default_organization: 'My Org',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: mockSettings } },
        'GET'
      );

      const { result } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      // Update mock to return different data so re-fetch after reset gets new data
      const resetSettings = {
        ...mockSettings,
        default_organization: 'Reset Org',
        updated_at: '2024-02-01T00:00:00Z',
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/settings`,
        { ok: true, data: { success: true, data: resetSettings } },
        'GET'
      );

      act(() => {
        result.current.reset();
      });

      // After reset + re-fetch, data is replaced with new response
      await waitFor(() => {
        expect(result.current.settings).toEqual(resetSettings);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('memoization', () => {
    it('should return stable refetch reference', () => {
      const { result, rerender } = renderHook(
        () => useSettings(mockNetworkClient, baseUrl, null, null),
        { wrapper: createWrapper() }
      );

      const firstRefetch = result.current.refetch;

      rerender();

      expect(result.current.refetch).toBe(firstRefetch);
    });
  });
});
