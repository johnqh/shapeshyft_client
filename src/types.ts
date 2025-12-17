/**
 * Local types for shapeshyft_client
 */

/**
 * Firebase ID token for authentication
 */
export type FirebaseIdToken = string;

/**
 * Query key types for TanStack Query
 */
export const QUERY_KEYS = {
  keys: (userId: string) => ['shapeshyft', 'keys', userId] as const,
  key: (userId: string, keyId: string) =>
    ['shapeshyft', 'keys', userId, keyId] as const,
  projects: (userId: string) => ['shapeshyft', 'projects', userId] as const,
  project: (userId: string, projectId: string) =>
    ['shapeshyft', 'projects', userId, projectId] as const,
  endpoints: (userId: string, projectId: string) =>
    ['shapeshyft', 'endpoints', userId, projectId] as const,
  endpoint: (userId: string, projectId: string, endpointId: string) =>
    ['shapeshyft', 'endpoints', userId, projectId, endpointId] as const,
  analytics: (userId: string) => ['shapeshyft', 'analytics', userId] as const,
} as const;
