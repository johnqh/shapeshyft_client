import type { FirebaseIdToken } from '../types';

/**
 * Typed error class for ShapeShyft API errors.
 * Provides structured error information including HTTP status code,
 * API error code, and detail message so consumers can handle different
 * error types programmatically (e.g., redirect to login on 401).
 *
 * @example
 * ```typescript
 * try {
 *   await client.getKeys(entitySlug, token);
 * } catch (err) {
 *   if (err instanceof ShapeshyftApiError) {
 *     if (err.statusCode === 401) {
 *       // redirect to login
 *     } else if (err.statusCode === 404) {
 *       // show not found message
 *     }
 *     console.error(`[${err.statusCode}] ${err.errorCode}: ${err.message}`);
 *   }
 * }
 * ```
 */
export class ShapeshyftApiError extends Error {
  /** HTTP status code from the API response (e.g., 401, 403, 404, 422, 500) */
  readonly statusCode: number | undefined;
  /** Machine-readable error code from the API response, if provided */
  readonly errorCode: string | undefined;
  /** Additional error details from the API response */
  readonly details: string | undefined;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      errorCode?: string;
      details?: string;
    }
  ) {
    super(message);
    this.name = 'ShapeshyftApiError';
    this.statusCode = options?.statusCode;
    this.errorCode = options?.errorCode;
    this.details = options?.details;
  }
}

/**
 * Helper method to create authentication headers for Firebase-protected endpoints
 */
export function createAuthHeaders(
  token: FirebaseIdToken
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Helper method to create standard request headers (no auth)
 */
export function createHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Helper method to create headers with API key for AI endpoints
 */
export function createApiKeyHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Helper method to build full URL from base URL and path
 */
export function buildUrl(baseUrl: string, path: string): string {
  // Remove trailing slash from baseUrl if present
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}${path}`;
}

/**
 * Helper method to handle API errors.
 * Extracts error information from the API response and returns a typed
 * {@link ShapeshyftApiError} with status code, error code, and details
 * when available.
 *
 * @param response - The raw response object from the network client
 * @param operation - A human-readable description of the operation that failed (e.g., "get keys")
 * @returns A {@link ShapeshyftApiError} instance with structured error information
 */
export function handleApiError(
  response: unknown,
  operation: string
): ShapeshyftApiError {
  const resp = response as {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      code?: string;
      details?: string;
    };
  };
  const errorMessage =
    resp?.data?.error || resp?.data?.message || 'Unknown error';
  return new ShapeshyftApiError(`Failed to ${operation}: ${errorMessage}`, {
    statusCode: resp?.status,
    errorCode: resp?.data?.code,
    details: resp?.data?.details,
  });
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: object): string {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  }

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}
