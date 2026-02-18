import { useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import type {
  AiExecutionResponse,
  AiPromptResponse,
  BaseResponse,
  HttpMethod,
  NetworkClient,
  Optional,
} from '@sudobility/shapeshyft_types';
import { ShapeshyftClient } from '../network/ShapeshyftClient';

/**
 * AI execution result type
 */
export type AiResult = AiExecutionResponse | AiPromptResponse;

/**
 * Return type for useAiExecute hook
 */
export interface UseAiExecuteReturn {
  result: Optional<AiResult>;
  isLoading: boolean;
  error: Optional<string>;

  execute: (
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    method?: HttpMethod,
    apiKey?: string,
    timeout?: number
  ) => Promise<BaseResponse<AiResult>>;

  getPrompt: (
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    apiKey?: string,
    timeout?: number
  ) => Promise<BaseResponse<AiPromptResponse>>;

  clearError: () => void;
  reset: () => void;
}

interface ExecuteParams {
  organizationPath: string;
  projectName: string;
  endpointName: string;
  input: unknown;
  method: HttpMethod;
  apiKey?: string;
  timeout?: number;
}

interface PromptParams {
  organizationPath: string;
  projectName: string;
  endpointName: string;
  input: unknown;
  apiKey?: string;
  timeout?: number;
}

/**
 * Hook for executing AI endpoints
 * Uses TanStack Query mutations (each execution is unique, not cached)
 */
export const useAiExecute = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseAiExecuteReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const executeMutation = useMutation({
    mutationFn: async (params: ExecuteParams) => {
      return client.executeAi(
        params.organizationPath,
        params.projectName,
        params.endpointName,
        params.input,
        params.method,
        params.apiKey,
        params.timeout
      );
    },
  });

  const promptMutation = useMutation({
    mutationFn: async (params: PromptParams) => {
      return client.getAiPrompt(
        params.organizationPath,
        params.projectName,
        params.endpointName,
        params.input,
        params.apiKey,
        params.timeout
      );
    },
  });

  const execute = useCallback(
    (
      organizationPath: string,
      projectName: string,
      endpointName: string,
      input: unknown,
      method: HttpMethod = 'POST',
      apiKey?: string,
      timeout?: number
    ) =>
      executeMutation.mutateAsync({
        organizationPath,
        projectName,
        endpointName,
        input,
        method,
        apiKey,
        timeout,
      }),
    [executeMutation]
  );

  const getPrompt = useCallback(
    (
      organizationPath: string,
      projectName: string,
      endpointName: string,
      input: unknown,
      apiKey?: string,
      timeout?: number
    ) =>
      promptMutation.mutateAsync({
        organizationPath,
        projectName,
        endpointName,
        input,
        apiKey,
        timeout,
      }),
    [promptMutation]
  );

  // Derive result from last successful execution
  const executeData = executeMutation.data;
  const result: Optional<AiResult> =
    executeData?.success && executeData.data ? executeData.data : null;

  const mutationError = executeMutation.error ?? promptMutation.error;
  // Also check for API-level errors in the response
  const apiError =
    executeData && !executeData.success ? executeData.error : null;
  const error =
    mutationError instanceof Error ? mutationError.message : (apiError ?? null);

  const clearError = useCallback(() => {
    executeMutation.reset();
    promptMutation.reset();
  }, [executeMutation, promptMutation]);

  const reset = useCallback(() => {
    executeMutation.reset();
    promptMutation.reset();
  }, [executeMutation, promptMutation]);

  return useMemo(
    () => ({
      result,
      isLoading: executeMutation.isPending || promptMutation.isPending,
      error,
      execute,
      getPrompt,
      clearError,
      reset,
    }),
    [
      result,
      executeMutation.isPending,
      promptMutation.isPending,
      error,
      execute,
      getPrompt,
      clearError,
      reset,
    ]
  );
};
