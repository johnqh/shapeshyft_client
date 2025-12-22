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
    method?: HttpMethod
  ) => Promise<BaseResponse<AiResult>>;

  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for executing AI endpoints
 * Provides public (no auth) access to AI execution
 */
export const useAiExecute = (
  networkClient: NetworkClient,
  baseUrl: string
): UseAiExecuteReturn => {
  const client = useMemo(
    () => new ShapeshyftClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
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
      method: HttpMethod = 'POST'
    ): Promise<BaseResponse<AiResult>> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.executeAi(
          organizationPath,
          projectName,
          endpointName,
          input,
          method
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
      clearError,
      reset,
    }),
    [result, isLoading, error, execute, clearError, reset]
  );
};
