import type { FirebaseIdToken } from '../types';

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
 * Helper method to build full URL from base URL and path
 */
export function buildUrl(baseUrl: string, path: string): string {
  // Remove trailing slash from baseUrl if present
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}${path}`;
}

/**
 * Helper method to handle API errors
 */
export function handleApiError(response: unknown, operation: string): Error {
  const resp = response as { data?: { error?: string; message?: string } };
  const errorMessage =
    resp?.data?.error || resp?.data?.message || 'Unknown error';
  return new Error(`Failed to ${operation}: ${errorMessage}`);
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
