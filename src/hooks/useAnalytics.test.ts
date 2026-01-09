import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { NetworkClient, AnalyticsResponse } from '@sudobility/shapeshyft_types';
import { useAnalytics } from './useAnalytics';

// Mock NetworkClient
function createMockNetworkClient(): NetworkClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

describe('useAnalytics', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: NetworkClient;

  const mockAnalyticsData: AnalyticsResponse = {
    summary: {
      total_requests: 1000,
      total_tokens_input: 50000,
      total_tokens_output: 25000,
      total_cost_usd: 10.5,
      average_latency_ms: 250,
    },
    by_endpoint: [
      {
        endpoint_id: 'endpoint-1',
        endpoint_name: 'Sentiment Analyzer',
        request_count: 500,
        tokens_input: 25000,
        tokens_output: 12500,
        cost_usd: 5.25,
      },
    ],
    by_date: [
      {
        date: '2024-01-01',
        request_count: 100,
        tokens_input: 5000,
        tokens_output: 2500,
        cost_usd: 1.05,
      },
    ],
  };

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

    expect(result.current.analytics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('refresh', () => {
    it('should fetch analytics and update state', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: mockAnalyticsData },
      });

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.analytics).toEqual(mockAnalyticsData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch analytics with query params', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: mockAnalyticsData },
      });

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token', {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        });
      });

      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2024-01-01'),
        expect.any(Object)
      );
    });

    it('should set error on failed request', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: false,
        data: { success: false, error: 'Unauthorized' },
      });

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.analytics).toBeNull();
      expect(result.current.error).toBeTruthy();
    });

    it('should set isLoading during request', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      vi.mocked(mockNetworkClient.get).mockReturnValue(promise as never);

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

      act(() => {
        result.current.refresh('user-123', 'token');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          data: { success: true, data: mockAnalyticsData },
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle network errors', async () => {
      vi.mocked(mockNetworkClient.get).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should handle response without data', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true },
      });

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.error).toBe('Failed to fetch analytics');
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      vi.mocked(mockNetworkClient.get).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

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
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        data: { success: true, data: mockAnalyticsData },
      });

      const { result } = renderHook(() => useAnalytics(mockNetworkClient, baseUrl));

      await act(async () => {
        await result.current.refresh('user-123', 'token');
      });

      expect(result.current.analytics).toEqual(mockAnalyticsData);

      act(() => {
        result.current.reset();
      });

      expect(result.current.analytics).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('memoization', () => {
    it('should return stable callback references', () => {
      const { result, rerender } = renderHook(() =>
        useAnalytics(mockNetworkClient, baseUrl)
      );

      const firstRefresh = result.current.refresh;
      const firstClearError = result.current.clearError;
      const firstReset = result.current.reset;

      rerender();

      expect(result.current.refresh).toBe(firstRefresh);
      expect(result.current.clearError).toBe(firstClearError);
      expect(result.current.reset).toBe(firstReset);
    });
  });
});
