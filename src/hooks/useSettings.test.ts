import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { NetworkClient } from '@sudobility/shapeshyft_types';
import { useSettings } from './useSettings';

// Mock NetworkClient
function createMockNetworkClient(): NetworkClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

describe('useSettings', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: NetworkClient;

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() =>
      useSettings(mockNetworkClient, baseUrl)
    );

    expect(result.current.settings).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('refresh', () => {
    it('should fetch settings and update state', async () => {
      const mockSettings = {
        uuid: 'settings-1',
        user_id: 'user-123',
        default_organization: 'My Org',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: mockSettings },
      });

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.settings).toEqual(mockSettings);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: false,
        data: { success: false, error: 'Unauthorized' },
      });

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.settings).toBeNull();
      expect(result.current.error).toBeTruthy();
    });

    it('should set isLoading during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      vi.mocked(mockNetworkClient.get).mockReturnValue(promise as never);

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      act(() => {
        result.current.refresh('user-123', 'token');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          data: { success: true, data: null },
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle network errors', async () => {
      vi.mocked(mockNetworkClient.get).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('updateSettings', () => {
    it('should update settings and update state', async () => {
      const updatedSettings = {
        uuid: 'settings-1',
        user_id: 'user-123',
        default_organization: 'Updated Org',
        is_default: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };
      vi.mocked(mockNetworkClient.put).mockResolvedValue({
        ok: true,
        data: { success: true, data: updatedSettings },
      });

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        const response = await result.current.updateSettings(
          'user-123',
          { default_organization: 'Updated Org' },
          'token'
        );
        expect(response.success).toBe(true);
      });

      expect(result.current.settings).toEqual(updatedSettings);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return error response on failed update', async () => {
      vi.mocked(mockNetworkClient.put).mockRejectedValue(
        new Error('Update failed')
      );

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      let response;
      await act(async () => {
        response = await result.current.updateSettings(
          'user-123',
          { default_organization: 'New Org' },
          'token'
        );
      });

      expect(response!.success).toBe(false);
      expect(response!.error).toBe('Update failed');
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      vi.mocked(mockNetworkClient.get).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.error).toBe('Network error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
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
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: mockSettings },
      });

      const { result } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.settings).toEqual(mockSettings);

      act(() => {
        result.current.reset();
      });

      expect(result.current.settings).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('memoization', () => {
    it('should return stable callback references', () => {
      const { result, rerender } = renderHook(() =>
        useSettings(mockNetworkClient, baseUrl)
      );

      const firstRefresh = result.current.refresh;
      const firstUpdateSettings = result.current.updateSettings;
      const firstClearError = result.current.clearError;
      const firstReset = result.current.reset;

      rerender();

      expect(result.current.refresh).toBe(firstRefresh);
      expect(result.current.updateSettings).toBe(firstUpdateSettings);
      expect(result.current.clearError).toBe(firstClearError);
      expect(result.current.reset).toBe(firstReset);
    });
  });
});
