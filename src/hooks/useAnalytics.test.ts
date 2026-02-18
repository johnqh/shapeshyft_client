import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockNetworkClient } from '@sudobility/di/mocks';
import type { AnalyticsResponse } from '@sudobility/shapeshyft_types';
import { useAnalytics } from './useAnalytics';

describe('useAnalytics', () => {
  const baseUrl = 'https://api.example.com';
  const userId = 'user-123';
  const token = 'test-token';
  let mockNetworkClient: MockNetworkClient;
  let queryClient: QueryClient;

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
      () => useAnalytics(mockNetworkClient, baseUrl, null, null),
      { wrapper: createWrapper() }
    );

    expect(result.current.analytics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('auto-fetch', () => {
    it('should fetch analytics and update state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics`,
        { ok: true, data: { success: true, data: mockAnalyticsData } },
        'GET'
      );

      const { result } = renderHook(
        () => useAnalytics(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.analytics).toEqual(mockAnalyticsData);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch analytics with query params', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics?start_date=2024-01-01&end_date=2024-01-31`,
        { ok: true, data: { success: true, data: mockAnalyticsData } },
        'GET'
      );

      const { result } = renderHook(
        () =>
          useAnalytics(mockNetworkClient, baseUrl, userId, token, {
            params: {
              start_date: '2024-01-01',
              end_date: '2024-01-31',
            },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.analytics).toEqual(mockAnalyticsData);
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/users/${userId}/analytics?start_date=2024-01-01&end_date=2024-01-31`,
          'GET'
        )
      ).toBe(true);
    });

    it('should set error on failed request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics`,
        { ok: false, data: { success: false, error: 'Unauthorized' } },
        'GET'
      );

      const { result } = renderHook(
        () => useAnalytics(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.analytics).toBeNull();
    });

    it('should set isLoading during request', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics`,
        { ok: true, data: { success: true, data: mockAnalyticsData }, delay: 100 },
        'GET'
      );

      const { result } = renderHook(
        () => useAnalytics(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle network errors', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics`,
        { error: new Error('Network error') },
        'GET'
      );

      const { result } = renderHook(
        () => useAnalytics(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should handle response without data', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics`,
        { ok: true, data: { success: true } },
        'GET'
      );

      const { result } = renderHook(
        () => useAnalytics(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch analytics');
      });
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics`,
        { ok: true, data: { success: true, data: mockAnalyticsData } },
        'GET'
      );

      const { result } = renderHook(
        () => useAnalytics(mockNetworkClient, baseUrl, userId, token),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.analytics).toEqual(mockAnalyticsData);
      });

      // Update mock to return different data so re-fetch after reset gets new data
      const emptyAnalytics: AnalyticsResponse = {
        summary: {
          total_requests: 0,
          total_tokens_input: 0,
          total_tokens_output: 0,
          total_cost_usd: 0,
          average_latency_ms: 0,
        },
        by_endpoint: [],
        by_date: [],
      };
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/users/${userId}/analytics`,
        { ok: true, data: { success: true, data: emptyAnalytics } },
        'GET'
      );

      act(() => {
        result.current.reset();
      });

      // After reset + re-fetch, data is replaced with new response
      await waitFor(() => {
        expect(result.current.analytics).toEqual(emptyAnalytics);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('memoization', () => {
    it('should return stable callback references', () => {
      const { result, rerender } = renderHook(
        () => useAnalytics(mockNetworkClient, baseUrl, null, null),
        { wrapper: createWrapper() }
      );

      const firstRefetch = result.current.refetch;
      const firstClearError = result.current.clearError;
      const firstReset = result.current.reset;

      rerender();

      expect(result.current.refetch).toBe(firstRefetch);
      expect(result.current.clearError).toBe(firstClearError);
      expect(result.current.reset).toBe(firstReset);
    });
  });
});
