import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { NetworkClient } from '@sudobility/shapeshyft_types';
import { useAiExecute } from './useAiExecute';

// Mock NetworkClient
function createMockNetworkClient(): NetworkClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

describe('useAiExecute', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: NetworkClient;

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('execute', () => {
    it('should execute AI endpoint via POST by default', async () => {
      const mockResponse = {
        output: { summary: 'Test summary' },
        usage: {
          tokens_input: 100,
          tokens_output: 50,
          latency_ms: 200,
          estimated_cost_cents: 1,
        },
      };
      vi.mocked(mockNetworkClient.post).mockResolvedValue({
        ok: true,
        data: { success: true, data: mockResponse },
      });

      const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.execute('my-org', 'my-project', 'summarize', {
          text: 'test',
        });
      });

      expect(mockNetworkClient.post).toHaveBeenCalled();
      expect(result.current.result).toEqual(mockResponse);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should execute AI endpoint via GET when specified', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: { output: {} } },
      });

      const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.execute(
          'my-org',
          'my-project',
          'endpoint',
          {},
          'GET'
        );
      });

      expect(mockNetworkClient.get).toHaveBeenCalled();
      expect(mockNetworkClient.post).not.toHaveBeenCalled();
    });

    it('should set error on failed execution', async () => {
      vi.mocked(mockNetworkClient.post).mockResolvedValue({
        ok: false,
        data: { success: false, error: 'Endpoint not found' },
      });

      const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.execute('org', 'project', 'endpoint', {});
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.result).toBeNull();
    });

    it('should handle network errors', async () => {
      vi.mocked(mockNetworkClient.post).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.execute('org', 'project', 'endpoint', {});
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should set isLoading during execution', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      vi.mocked(mockNetworkClient.post).mockReturnValue(promise as never);

      const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

      act(() => {
        result.current.execute('org', 'project', 'endpoint', {});
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          data: { success: true, data: {} },
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      vi.mocked(mockNetworkClient.post).mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.execute('org', 'project', 'endpoint', {});
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
      vi.mocked(mockNetworkClient.post).mockResolvedValue({
        ok: true,
        data: { success: true, data: { output: 'test' } },
      });

      const { result } = renderHook(() => useAiExecute(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.execute('org', 'project', 'endpoint', {});
      });

      expect(result.current.result).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.result).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
