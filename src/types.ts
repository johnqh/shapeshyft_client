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
  keys: (entitySlug: string) => ['shapeshyft', 'keys', entitySlug] as const,
  key: (entitySlug: string, keyId: string) =>
    ['shapeshyft', 'keys', entitySlug, keyId] as const,
  projects: (entitySlug: string) =>
    ['shapeshyft', 'projects', entitySlug] as const,
  project: (entitySlug: string, projectId: string) =>
    ['shapeshyft', 'projects', entitySlug, projectId] as const,
  endpoints: (entitySlug: string, projectId: string) =>
    ['shapeshyft', 'endpoints', entitySlug, projectId] as const,
  endpoint: (entitySlug: string, projectId: string, endpointId: string) =>
    ['shapeshyft', 'endpoints', entitySlug, projectId, endpointId] as const,
  analytics: (entitySlug: string) =>
    ['shapeshyft', 'analytics', entitySlug] as const,
  settings: (userId: string) => ['shapeshyft', 'settings', userId] as const,
  storageConfig: (entitySlug: string) =>
    ['shapeshyft', 'storageConfig', entitySlug] as const,
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
