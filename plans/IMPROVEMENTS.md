# Improvement Plans for @sudobility/shapeshyft_client

## Priority 1 - High Impact

### 1. Add JSDoc to ShapeshyftClient Methods and Hook Parameters -- COMPLETED
- Added `@param` and `@returns` documentation to all ShapeshyftClient methods (getKeys, getKey, createKey, updateKey, deleteKey, getStorageConfig, createStorageConfig, updateStorageConfig, deleteStorageConfig, getProjects, getProject, createProject, updateProject, deleteProject, getProjectApiKey, refreshProjectApiKey, getEndpoints, getEndpoint, createEndpoint, updateEndpoint, deleteEndpoint, getAnalytics, getSettings, updateSettings, executeAiGet, executeAiPost, executeAi, getAiPrompt, getEntities, getEntity, createEntity, updateEntity, deleteEntity, getEntityMembers, updateEntityMemberRole, removeEntityMember, getEntityInvitations, createEntityInvitation, cancelEntityInvitation, getMyInvitations, acceptInvitation, declineInvitation, getRateLimitsConfig, getRateLimitHistory, getProviders, getProvider, getProviderModels).
- Added `@param`, `@returns`, and `@example` JSDoc to all hook functions (useKeys, useProjects, useEndpoints, useAiExecute, useAnalytics, useSettings).
- Added JSDoc comments to all properties and methods in return type interfaces (UseKeysReturn, UseProjectsReturn, UseEndpointsReturn, UseAiExecuteReturn, UseAnalyticsReturn, UseSettingsReturn).
- Added class-level `@example` JSDoc to ShapeshyftClient.

### 2. Add Test Coverage for ShapeshyftClient Class -- COMPLETED
- Added test sections for: Storage Config (CRUD), Entities (CRUD), Entity Members (get, update role, remove), Entity Invitations (get, create, cancel, getMyInvitations, accept, decline), Rate Limits (config, history), Providers (getProviders, getProvider, getProviderModels).
- Added URL Encoding tests verifying correct `encodeURIComponent` behavior with special characters (spaces, slashes, ampersands) in entitySlug, projectId, and AI path segments.
- Added Test Mode tests verifying `testMode=true` parameter injection, absence when disabled, and merging with existing query params.
- Added API Key Headers tests verifying auth header construction and timeout forwarding for AI endpoints.
- Added error handling tests verifying ShapeshyftApiError instance and status code extraction.
- Test count increased from 112 to 148 (36 new tests).

### 3. Improve Error Handling Granularity -- COMPLETED
- Created `ShapeshyftApiError extends Error` class in `shapeshyft-helpers.ts` with `statusCode`, `errorCode`, and `details` fields.
- Updated `handleApiError` to return `ShapeshyftApiError` instances that extract `status`, `code`, and `details` from API responses.
- Exported `ShapeshyftApiError` from the package's public API (`utils/index.ts`).
- Added tests for status code extraction, error code and details, and name property.
- Note: Hooks still surface errors as `Optional<string>` for backward compatibility. Consumers can catch `ShapeshyftApiError` from client method calls for typed error handling.

## Priority 2 - Medium Impact

### 3. Add a `verify` Script for Pre-Commit Checks -- COMPLETED
- Added `"verify": "bun run typecheck && bun run lint && bun run test && bun run build"` to `package.json` scripts.
- Updated CLAUDE.md to document the `verify` script and remove "No verify script" notes.

### 4. Add Optimistic Updates to Mutation Hooks -- SKIPPED
- Requires significant architectural changes to all mutation hooks (onMutate, onError rollback, cache snapshots).
- Would change the hook behavior contract that shapeshyft_lib depends on.
- Recommended as a future enhancement with careful downstream coordination.

### 5. Add Retry Configuration for Network Failures -- SKIPPED
- Requires adding new options to all hook parameter signatures.
- Default TanStack Query retry behavior is reasonable for most use cases.
- Recommended as a future enhancement if specific retry needs arise.

## Priority 3 - Nice to Have

### 6. Export ShapeshyftClient Configuration Type -- COMPLETED
- Created and exported `ShapeshyftClientConfig` interface with documented properties (baseUrl, networkClient, testMode).
- Updated `ShapeshyftClient` constructor to accept `ShapeshyftClientConfig`.
- Exported the type from `network/index.ts` and the package's public API.

### 7. Add Hook Usage Examples to Hook Files -- COMPLETED
- Added `@example` JSDoc blocks with TypeScript code examples to: useKeys, useProjects, useEndpoints, useAiExecute, useAnalytics, useSettings.
- Each example shows the most common usage patterns (instantiation, data access, CRUD operations).

### 8. Consider Deduplicating ShapeshyftClient Instantiation in Hooks -- SKIPPED
- Requires major architectural change (React context provider or breaking the hook parameter signature).
- Would change the public API that shapeshyft_lib depends on.
- The useMemo approach is lightweight and the per-hook client instances have negligible memory overhead.
