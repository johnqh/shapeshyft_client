import { useCallback, useMemo, useState } from 'react';
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
    apiKey?: string
  ) => Promise<BaseResponse<AiResult>>;

  getPrompt: (
    organizationPath: string,
    projectName: string,
    endpointName: string,
    input: unknown,
    apiKey?: string
  ) => Promise<BaseResponse<AiPromptResponse>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for executing AI endpoints
 * Provides public (no auth) access to AI execution
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

  const [result, setResult] = useState<Optional<AiResult>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Execute an AI endpoint
   */
  const execute = useCallback(
    async (
      organizationPath: string,
      projectName: string,
      endpointName: string,
      input: unknown,
      method: HttpMethod = 'POST',
      apiKey?: string
    ): Promise<BaseResponse<AiResult>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.executeAi(
          organizationPath,
          projectName,
          endpointName,
          input,
          method,
          apiKey
        );
        if (response.success && response.data) {
          setResult(response.data);
        } else {
          setError(response.error || 'AI execution failed');
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'AI execution failed';
        setError(errorMessage);
        console.error('[useAiExecute] execute error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get the generated prompt without executing
   */
  const getPrompt = useCallback(
    async (
      organizationPath: string,
      projectName: string,
      endpointName: string,
      input: unknown,
      apiKey?: string
    ): Promise<BaseResponse<AiPromptResponse>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getAiPrompt(
          organizationPath,
          projectName,
          endpointName,
          input,
          apiKey
        );
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get prompt';
        setError(errorMessage);
        console.error('[useAiExecute] getPrompt error:', errorMessage, err);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      result,
      isLoading,
      error,
      execute,
      getPrompt,
      clearError,
      reset,
    }),
    [result, isLoading, error, execute, getPrompt, clearError, reset]
  );
};
