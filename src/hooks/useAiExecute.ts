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
 * Return type for the {@link useAiExecute} hook.
 */
export interface UseAiExecuteReturn {
  /** Result from the most recent successful execution, or null */
  result: Optional<AiResult>;
  /** True while an execute or getPrompt call is in progress */
  isLoading: boolean;
  /** Error message from the most recent failed execution, or null */
  error: Optional<string>;

  /**
   * Execute an AI endpoint. Each call is a mutation (not cached).
   * @param organizationPath - Organization slug in the AI URL path
   * @param projectName - Project name (not UUID)
   * @param endpointName - Endpoint name (not UUID)
   * @param input - Input data to pass to the endpoint
   * @param method - HTTP method ("GET" or "POST"); defaults to "POST"
   * @param apiKey - Optional project API key for authentication
   * @param timeout - Optional request timeout in milliseconds
   */
  execute: (
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    method?: HttpMethod,
    apiKey?: string,
    timeout?: number
  ) => Promise<BaseResponse<AiResult>>;

  /**
   * Get the resolved prompt without executing (for debugging/preview).
   * @param organizationPath - Organization slug in the AI URL path
   * @param projectName - Project name (not UUID)
   * @param endpointName - Endpoint name (not UUID)
   * @param input - Input data to pass to the endpoint
   * @param apiKey - Optional project API key for authentication
   * @param timeout - Optional request timeout in milliseconds
   */
  getPrompt: (
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    apiKey?: string,
    timeout?: number
  ) => Promise<BaseResponse<AiPromptResponse>>;

  /** Clear any execution error state */
  clearError: () => void;
  /** Reset all state (result, errors) to initial values */
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
 * Hook for executing AI endpoints.
 * Uses TanStack Query mutations (each execution is unique, not cached).
 *
 * @param networkClient - NetworkClient instance for making HTTP requests
 * @param baseUrl - Base URL of the ShapeShyft API
 * @param testMode - When true, appends testMode=true to all API requests (default: false)
 * @returns {@link UseAiExecuteReturn} with execute/getPrompt methods and result/loading/error state
 *
 * @example
 * ```tsx
 * const { execute, result, isLoading, error } = useAiExecute(
 *   networkClient,
 *   'https://api.shapeshyft.com'
 * );
 *
 * // Execute an AI endpoint
 * const response = await execute(
 *   'my-org',           // organizationPath
 *   'my-project',       // projectName
 *   'summarize',        // endpointName
 *   { text: 'Hello' },  // input
 *   'POST',             // method (default)
 *   'sk_live_...',      // apiKey (optional)
 * );
 *
 * // Preview the prompt without executing
 * const prompt = await getPrompt('my-org', 'my-project', 'summarize', { text: 'Hello' });
 * ```
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
