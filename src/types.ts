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
  // Entity query keys
  entities: () => ['shapeshyft', 'entities'] as const,
  entity: (entitySlug: string) =>
    ['shapeshyft', 'entities', entitySlug] as const,
  entityMembers: (entitySlug: string) =>
    ['shapeshyft', 'entities', entitySlug, 'members'] as const,
  entityInvitations: (entitySlug: string) =>
    ['shapeshyft', 'entities', entitySlug, 'invitations'] as const,
  myInvitations: () => ['shapeshyft', 'invitations', 'mine'] as const,
  // Rate limit query keys
  rateLimitsConfig: () => ['shapeshyft', 'ratelimits', 'config'] as const,
  rateLimitsHistory: (periodType: string) =>
    ['shapeshyft', 'ratelimits', 'history', periodType] as const,
  // Provider query keys (public, no auth needed)
  providers: () => ['shapeshyft', 'providers'] as const,
  provider: (providerId: string) =>
    ['shapeshyft', 'providers', providerId] as const,
  providerModels: (providerId: string) =>
    ['shapeshyft', 'providers', providerId, 'models'] as const,
} as const;
