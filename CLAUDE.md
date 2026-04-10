# ShapeShyft Client

React client library for ShapeShyft API with TanStack Query hooks (v0.0.74).

**npm**: `@sudobility/shapeshyft_client`

## Tech Stack

- **Language**: TypeScript (strict mode, ES2020 target)
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Build**: TypeScript compiler (tsc)
- **Server State**: TanStack React Query 5
- **Testing**: Vitest with React Testing Library
- **Module**: ESM (ES2020 ESNext)

## Project Structure

```
src/
├── index.ts                    # Public exports (hooks, network, utils, types)
├── types.ts                    # QUERY_KEYS constant + FirebaseIdToken type
├── hooks/
│   ├── index.ts               # Exports all hooks
│   ├── useKeys.ts             # LLM API key CRUD
│   ├── useKeys.test.ts
│   ├── useProjects.ts         # Project CRUD + API key operations
│   ├── useProjects.test.ts
│   ├── useEndpoints.ts        # Endpoint CRUD within a project
│   ├── useEndpoints.test.ts
│   ├── useAnalytics.ts        # Usage analytics (query only)
│   ├── useAnalytics.test.ts
│   ├── useSettings.ts         # User settings (upsert, optimistic update)
│   ├── useSettings.test.ts
│   ├── useAiExecute.ts        # AI endpoint execution (mutation only, no caching)
│   ├── useAiExecute.test.ts
│   ├── useEntities.ts         # Entity/org CRUD + members + invitations
│   ├── useProviders.ts        # Public provider list + provider models
│   └── useStorageConfig.ts    # Entity storage config CRUD
├── network/
│   ├── index.ts               # Exports ShapeshyftClient
│   ├── ShapeshyftClient.ts    # API client class (~1670 lines, ~50 methods)
│   └── ShapeshyftClient.test.ts
└── utils/
    ├── index.ts               # Exports all utilities
    ├── shapeshyft-helpers.ts  # Headers, URLs, errors, query strings
    └── shapeshyft-helpers.test.ts
```

## Commands

```bash
bun run build        # Build to dist/ (tsc)
bun run build:watch  # Watch mode build
bun run clean        # Remove dist/
bun run test         # Run tests once (vitest run)
bun run test:watch   # Watch mode (vitest)
bun run lint         # Run ESLint
bun run lint:fix     # Fix ESLint issues
bun run typecheck    # TypeScript check (--noEmit)
bun run format       # Format with Prettier
bun run format:check # Check formatting
bun run verify       # Full pre-commit: typecheck + lint + test + build
```

## Hooks

| Hook | Purpose | Scope | Methods |
| ---- | ------- | ----- | ------- |
| `useKeys` | LLM API key management | entitySlug | create, update, delete |
| `useProjects` | Project CRUD + API key | entitySlug | create, update, delete, getProjectApiKey, refreshProjectApiKey |
| `useEndpoints` | Endpoint CRUD | entitySlug + projectId | create, update, delete |
| `useAnalytics` | Usage analytics | entitySlug | (query only) |
| `useSettings` | User settings | userId | update (optimistic) |
| `useAiExecute` | AI inference | - | execute, getPrompt |
| `useEntities` | Entity/org management | - | create, update, delete + members + invitations |
| `useProviders` | Public provider list | - | (query only) |
| `useProviderModels` | Models for a provider | providerId | (query only, keepPreviousData) |
| `useStorageConfig` | Cloud storage config | entitySlug | update (handles 404 gracefully) |

### Hook Signature Pattern

All hooks take the same base parameters:

```typescript
const result = useKeys(
  networkClient,   // NetworkClient from @sudobility/di
  baseUrl,         // API base URL string
  entitySlug,      // null disables fetching
  token,           // FirebaseIdToken | null - null disables fetching
  testMode?,       // Appends ?testMode=true to requests
  autoFetch?       // Default true; set false to skip initial fetch
);
```

### Hook Return Shape

Every hook returns a consistent interface:

```typescript
interface UseKeysReturn {
  keys: LlmApiKeySafe[];      // Data (empty array while loading, not null)
  isLoading: boolean;          // True during query OR mutation
  error: string | null;        // Coalesced from query or mutation error
  refetch: () => void;         // Manual cache refresh
  clearError: () => void;      // Clear mutation errors
  reset: () => void;           // Remove cache + clear errors
  createKey: (data) => Promise<BaseResponse<LlmApiKeySafe>>;
  updateKey: (id, data) => Promise<BaseResponse<LlmApiKeySafe>>;
  deleteKey: (id) => Promise<BaseResponse<void>>;
}
```

## QUERY_KEYS

Defined in `src/types.ts`. Used for TanStack Query cache management:

```typescript
QUERY_KEYS = {
  keys: (entitySlug) => ['shapeshyft', 'keys', entitySlug],
  key: (entitySlug, keyId) => ['shapeshyft', 'keys', entitySlug, keyId],
  projects: (entitySlug) => ['shapeshyft', 'projects', entitySlug],
  project: (entitySlug, projectId) => ['shapeshyft', 'projects', entitySlug, projectId],
  endpoints: (entitySlug, projectId) => ['shapeshyft', 'endpoints', entitySlug, projectId],
  endpoint: (...) => ['shapeshyft', 'endpoints', entitySlug, projectId, endpointId],
  analytics: (entitySlug) => ['shapeshyft', 'analytics', entitySlug],
  settings: (userId) => ['shapeshyft', 'settings', userId],
  storageConfig: (entitySlug) => ['shapeshyft', 'storageConfig', entitySlug],
  entities: () => ['shapeshyft', 'entities'],
  entity: (entitySlug) => ['shapeshyft', 'entities', entitySlug],
  entityMembers: (entitySlug) => ['shapeshyft', 'entities', entitySlug, 'members'],
  entityInvitations: (entitySlug) => ['shapeshyft', 'entities', entitySlug, 'invitations'],
  myInvitations: () => ['shapeshyft', 'invitations', 'mine'],
  rateLimitsConfig: (userId) => ['shapeshyft', 'rateLimits', userId, 'config'],
  rateLimitsHistory: (userId) => ['shapeshyft', 'rateLimits', userId, 'history'],
  providers: () => ['shapeshyft', 'providers'],
  provider: (providerId) => ['shapeshyft', 'providers', providerId],
  providerModels: (providerId) => ['shapeshyft', 'providers', providerId, 'models'],
}
```

## ShapeshyftClient

The `ShapeshyftClient` class (~1670 lines) provides all API methods. Hooks delegate to this class internally. Direct usage is rare but possible:

```typescript
import { ShapeshyftClient } from '@sudobility/shapeshyft_client';

const client = new ShapeshyftClient(networkClient, baseUrl);
const response = await client.getProjects(entitySlug, token);
```

## Code Patterns

### TanStack Query Configuration

- `staleTime`: 5 minutes (data stays fresh)
- `gcTime`: 30 minutes (keep in garbage-collectable cache)
- `enabled`: Auto-disabled when params are null (`!!entitySlug && !!token`)
- `retry: false` in tests

### Null-Gated Parameters

Hooks accept `null` for `entitySlug`, `token`, and `projectId` to conditionally disable fetching:

```typescript
// Won't fetch until both are non-null
const { keys } = useKeys(networkClient, baseUrl, entitySlug, token);
```

### Stable Empty Arrays

Each hook defines module-level constants to prevent unnecessary re-renders:

```typescript
const EMPTY_KEYS: LlmApiKeySafe[] = [];
// Used as: keys = queryData ?? EMPTY_KEYS
```

### Error Handling

```typescript
import { ShapeshyftApiError } from '@sudobility/shapeshyft_client';

// Thrown by network calls
class ShapeshyftApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;
}

// In hooks: error is coalesced from query or mutation
const error = queryError?.message ?? mutationError?.message ?? null;
```

### Mutation Cache Invalidation

CRUD mutations auto-invalidate relevant query caches on success:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.keys(entitySlug) });
}
```

Exception: `useSettings` uses `queryClient.setQueryData()` for optimistic updates instead.

## Exports

From `@sudobility/shapeshyft_client`:

```typescript
// Network
export { ShapeshyftClient }

// Hooks + return types
export { useKeys, UseKeysReturn }
export { useProjects, UseProjectsReturn }
export { useEndpoints, UseEndpointsReturn }
export { useAnalytics, UseAnalyticsReturn }
export { useSettings, UseSettingsReturn }
export { useAiExecute, UseAiExecuteReturn, AiResult }
export { useEntities, UseEntitiesReturn }
export { useProviders, UseProvidersReturn }
export { useProviderModels, UseProviderModelsReturn }
export { useStorageConfig, UseStorageConfigReturn }

// Utils
export { ShapeshyftApiError, createAuthHeaders, createHeaders,
         buildUrl, handleApiError, buildQueryString }

// Types
export { FirebaseIdToken, QUERY_KEYS }
```

## Testing

### Test Setup

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockNetworkClient } from '@sudobility/di/mocks';

const mockNetworkClient = new MockNetworkClient();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
```

### Test Pattern

```typescript
describe("useKeys", () => {
  beforeEach(() => {
    queryClient.clear();
    mockNetworkClient.reset();
  });

  it("should fetch keys", async () => {
    mockNetworkClient.setMockResponse(
      `${baseUrl}/api/v1/entities/my-org/keys`,
      { ok: true, data: { success: true, data: mockKeys } },
      "GET"
    );

    const { result } = renderHook(
      () => useKeys(mockNetworkClient, baseUrl, "my-org", mockToken),
      { wrapper }
    );

    await waitFor(() => expect(result.current.keys).toEqual(mockKeys));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

## Task Recipes

### Adding a New Hook

1. Create `src/hooks/useMyThing.ts`
2. Follow the hook signature pattern: `(networkClient, baseUrl, scopeParam, token, testMode?, autoFetch?)`
3. Return the standard shape: `{ data, isLoading, error, refetch, clearError, reset, ...mutations }`
4. Add query key(s) to `QUERY_KEYS` in `src/types.ts`
5. Add corresponding methods to `ShapeshyftClient` in `src/network/ShapeshyftClient.ts`
6. Export from `src/hooks/index.ts` and `src/index.ts`
7. Create `src/hooks/useMyThing.test.ts` following the test pattern above
8. Use `EMPTY_X` constant for stable empty array default

### Adding a Method to ShapeshyftClient

1. Add the method to `src/network/ShapeshyftClient.ts`
2. Use `this.networkClient.request()` for HTTP calls
3. Use `createAuthHeaders(token)` for authenticated endpoints
4. Return `BaseResponse<T>` for consistency
5. Add test cases in `ShapeshyftClient.test.ts`

## Peer Dependencies

Required in consuming app:

- `react` >= 18.0.0
- `@tanstack/react-query` >= 5.0.0
- `@sudobility/shapeshyft_types` - Type definitions
- `@sudobility/types` - Common types
- `@sudobility/di` - NetworkClient interface

## Architecture

```
shapeshyft_client (this package)
    ^
shapeshyft_lib (business logic, Zustand stores)
    ^
shapeshyft_app (frontend)
```

## Workspace Context

This project is part of the **ShapeShyft** multi-project workspace at the parent directory. See `../CLAUDE.md` for the full architecture, dependency graph, and build order.

## Downstream Impact

| Downstream Consumer | Relationship |
| ------------------- | ------------ |
| `shapeshyft_lib` | Direct peer dependency - wraps these hooks with Zustand stores |
| `shapeshyft_app` | Transitive via shapeshyft_lib |

After making changes:

1. `bun run verify`
2. `npm publish`
3. In `shapeshyft_lib`: `bun update @sudobility/shapeshyft_client` -> rebuild
4. In `shapeshyft_app`: `bun update @sudobility/shapeshyft_client` -> rebuild

## Local Dev Workflow

```bash
# In this project:
bun link

# In shapeshyft_lib:
bun link @sudobility/shapeshyft_client

# Rebuild after changes:
bun run build

# When done, unlink:
bun unlink @sudobility/shapeshyft_client && bun install
```

## Pre-Commit Checklist

```bash
bun run verify
```

This runs: `typecheck && lint && test && build`.

## Publishing

```bash
bun run prepublishOnly  # Clean + build
npm publish             # Publish to npm (must use npm, not bun)
```

## Gotchas

- **`publishConfig.access` is `"restricted"`** -- this is intentionally a private npm package.
- **Hooks use `networkClient`, not direct fetch** -- all HTTP goes through a `NetworkClient` interface from `@sudobility/di`. This enables mocking in tests.
- **Hooks return consistent `{ data, isLoading, error, refetch, clearError, reset }` pattern** -- `shapeshyft_lib` manager hooks depend on this exact shape. Do not change it.
- **`bun run test` runs tests once** -- use `bun run test:watch` for watch mode during development.
- **Null params disable fetching** -- passing `null` for `entitySlug` or `token` sets `enabled: false` on the query. This is intentional for conditional fetching.
- **`useAiExecute` does NOT cache** -- each call is a fresh mutation. Parameters are path-based (`organizationPath`, `projectName`, `endpointName`), not UUIDs.
- **`useSettings` uses optimistic updates** -- `setQueryData()` instead of `invalidateQueries()` for faster UX.
- **`useStorageConfig` handles 404 gracefully** -- returns null instead of throwing when no config exists.
- **`useProviderModels` uses `keepPreviousData`** -- prevents content flash when switching between providers.
- **Stable empty arrays prevent re-renders** -- each hook has a module-level `EMPTY_X` constant. Do not inline `[]` as a default.
- **Entity vs user scoping** -- keys/projects/endpoints/storage are entity-scoped; analytics/settings are user-scoped; providers are global.
