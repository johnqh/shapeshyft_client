import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { NetworkClient } from '@sudobility/shapeshyft_types';
import { useKeys } from './useKeys';

// Mock NetworkClient
function createMockNetworkClient(): NetworkClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

describe('useKeys', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: NetworkClient;

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

    expect(result.current.keys).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('refresh', () => {
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
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: mockKeys },
      });

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.keys).toEqual(mockKeys);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed request', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: false,
        data: { success: false, error: 'Unauthorized' },
      });

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.keys).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });

    it('should set isLoading during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      vi.mocked(mockNetworkClient.get).mockReturnValue(promise as never);

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

      act(() => {
        result.current.refresh('user-123', 'token');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          data: { success: true, data: [] },
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createKey', () => {
    it('should create key and refresh list', async () => {
      const newKey = {
        uuid: 'new-key',
        key_name: 'New Key',
        provider: 'openai' as const,
      };
      vi.mocked(mockNetworkClient.post).mockResolvedValue({
        ok: true,
        data: { success: true, data: newKey },
      });
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: [newKey] },
      });

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.createKey(
          'user-123',
          { key_name: 'New Key', provider: 'openai', api_key: 'sk-test' },
          'token'
        );
      });

      expect(mockNetworkClient.post).toHaveBeenCalled();
      expect(mockNetworkClient.get).toHaveBeenCalled(); // Should refresh
    });
  });

  describe('updateKey', () => {
    it('should update key and refresh list', async () => {
      vi.mocked(mockNetworkClient.put).mockResolvedValue({
        ok: true,
        data: { success: true, data: { uuid: 'key-1' } },
      });
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: [] },
      });

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.updateKey(
          'user-123',
          'key-1',
          { key_name: 'Updated' },
          'token'
        );
      });

      expect(mockNetworkClient.put).toHaveBeenCalled();
    });
  });

  describe('deleteKey', () => {
    it('should delete key and refresh list', async () => {
      vi.mocked(mockNetworkClient.delete).mockResolvedValue({
        ok: true,
        data: { success: true, data: { uuid: 'key-1' } },
      });
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: [] },
      });

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.deleteKey('user-123', 'key-1', 'token');
      });

      expect(mockNetworkClient.delete).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      vi.mocked(mockNetworkClient.get).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

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
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: {
          success: true,
          data: [{ uuid: 'key-1', key_name: 'Test' }],
        },
      });

      const { result } = renderHook(() => useKeys(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.keys.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.keys).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
