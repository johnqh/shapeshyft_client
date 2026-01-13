import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  LlmProvider,
  ModelInfo,
  NetworkClient,
  ProviderConfig,
  ProviderModelsResponse,
} from '@sudobility/shapeshyft_types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';
import { QUERY_KEYS } from '../types';

/**
 * Return type for useProviders hook
 */
export interface UseProvidersReturn {
  /** List of all available providers */
  providers: ProviderConfig[];
  /** Loading state for providers list */
  isLoadingProviders: boolean;
  /** Error message for providers list fetch */
  providersError: string | null;
  /** Refetch providers list */
  refetchProviders: () => void;
}

/**
 * Return type for useProviderModels hook
 */
export interface UseProviderModelsReturn {
  /** Provider configuration */
  provider: ProviderConfig | null;
  /** List of models for the provider */
  models: ModelInfo[];
  /** Loading state for models */
  isLoading: boolean;
  /** Error message for models fetch */
  error: string | null;
  /** Refetch models */
  refetch: () => void;
}

/**
 * Hook for fetching the list of available LLM providers
 * Uses TanStack Query for caching
 */
export const useProviders = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseProvidersReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const {
    data,
    isLoading: isLoadingProviders,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.providers(),
    queryFn: async () => {
      const response = await client.getProviders();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch providers');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return {
    providers: data ?? [],
    isLoadingProviders,
    providersError: error instanceof Error ? error.message : null,
    refetchProviders: refetch,
  };
};

/**
 * Hook for fetching models for a specific provider
 * Uses TanStack Query for caching
 */
export const useProviderModels = (
  networkClient: NetworkClient,
  baseUrl: string,
  provider: LlmProvider | null,
  testMode: boolean = false
): UseProviderModelsReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.providerModels(provider ?? ''),
    queryFn: async (): Promise<ProviderModelsResponse> => {
      if (!provider) {
        throw new Error('Provider is required');
      }
      const response = await client.getProviderModels(provider);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch provider models');
      }
      return response.data;
    },
    enabled: !!provider, // Only fetch when provider is provided
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return {
    provider: data?.provider ?? null,
    models: data?.models ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
