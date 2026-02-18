import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useAiExecute } from './useAiExecute';

describe('useAiExecute', () => {
  const baseUrl = 'https://api.example.com';
  let mockNetworkClient: MockNetworkClient;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    mockNetworkClient.setDefaultResponse({
      ok: true,
      data: { success: true, data: {} },
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
      () => useAiExecute(mockNetworkClient, baseUrl),
      { wrapper: createWrapper() }
    );

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
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/ai/my-org/my-project/summarize`,
        { ok: true, data: { success: true, data: mockResponse } },
        'POST'
      );

      const { result } = renderHook(
        () => useAiExecute(mockNetworkClient, baseUrl),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.execute('my-org', 'my-project', 'summarize', {
          text: 'test',
        });
      });

      await waitFor(() => {
        expect(result.current.result).toEqual(mockResponse);
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/ai/my-org/my-project/summarize`,
          'POST'
        )
      ).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should execute AI endpoint via GET when specified', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/ai/my-org/my-project/endpoint?input=%7B%7D`,
        { ok: true, data: { success: true, data: { output: {} } } },
        'GET'
      );

      const { result } = renderHook(
        () => useAiExecute(mockNetworkClient, baseUrl),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.execute(
          'my-org',
          'my-project',
          'endpoint',
          {},
          'GET'
        );
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/ai/my-org/my-project/endpoint?input=%7B%7D`,
          'GET'
        )
      ).toBe(true);
      expect(
        mockNetworkClient.wasUrlCalled(
          `${baseUrl}/api/v1/ai/my-org/my-project/endpoint`,
          'POST'
        )
      ).toBe(false);
    });

    it('should set error on failed execution', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/ai/org/project/endpoint`,
        { ok: false, data: { success: false, error: 'Endpoint not found' } },
        'POST'
      );

      const { result } = renderHook(
        () => useAiExecute(mockNetworkClient, baseUrl),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        try {
          await result.current.execute('org', 'project', 'endpoint', {});
        } catch {
          // expected - mutateAsync rethrows
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.result).toBeNull();
    });

    it('should handle network errors', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/ai/org/project/endpoint`,
        { error: new Error('Network error') },
        'POST'
      );

      const { result } = renderHook(
        () => useAiExecute(mockNetworkClient, baseUrl),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        try {
          await result.current.execute('org', 'project', 'endpoint', {});
        } catch {
          // expected - mutateAsync rethrows
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should set isLoading during execution', async () => {
      // Use a delayed response to observe loading state
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/ai/org/project/endpoint`,
        { ok: true, data: { success: true, data: {} }, delay: 100 },
        'POST'
      );

      const { result } = renderHook(
        () => useAiExecute(mockNetworkClient, baseUrl),
        { wrapper: createWrapper() }
      );

      let executePromise: Promise<unknown>;
      act(() => {
        executePromise = result.current.execute('org', 'project', 'endpoint', {});
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await executePromise!;
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/ai/org/project/endpoint`,
        { error: new Error('Test error') },
        'POST'
      );

      const { result } = renderHook(
        () => useAiExecute(mockNetworkClient, baseUrl),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        try {
          await result.current.execute('org', 'project', 'endpoint', {});
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
    it('should reset all state to initial values', async () => {
      mockNetworkClient.setMockResponse(
        `${baseUrl}/api/v1/ai/org/project/endpoint`,
        { ok: true, data: { success: true, data: { output: 'test' } } },
        'POST'
      );

      const { result } = renderHook(
        () => useAiExecute(mockNetworkClient, baseUrl),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.execute('org', 'project', 'endpoint', {});
      });

      await waitFor(() => {
        expect(result.current.result).not.toBeNull();
      });

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.result).toBeNull();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
