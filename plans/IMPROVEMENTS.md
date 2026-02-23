# Improvement Plans for @sudobility/shapeshyft_client

## Priority 1 - High Impact

### 1. Add JSDoc to ShapeshyftClient Methods and Hook Parameters
- The `ShapeshyftClient` class methods have JSDoc with HTTP method and path (e.g., `GET /api/v1/entities/:entitySlug/keys`), which is good. However, the individual parameters lack `@param` and `@returns` documentation. For example, `getKeys(entitySlug, token)` does not explain what `entitySlug` is or what the response shape contains.
- The hook functions (`useKeys`, `useProjects`, `useEndpoints`, `useAiExecute`, `useAnalytics`, `useSettings`) have return type interfaces documented, but the hook parameters themselves are undocumented. The `options` parameter objects (e.g., `testMode`, `enabled`, `params`) need `@param` tags explaining their behavior.
- The `UseKeysReturn`, `UseProjectsReturn`, etc. interfaces should document each method (e.g., what `refetch` vs `reset` does, when to use `clearError`).

### 2. Add Test Coverage for ShapeshyftClient Class
- The `ShapeshyftClient.test.ts` file exists but should verify all client methods including entity, member, invitation, rate limit, provider, and storage config operations. Currently, the test files for hooks (`useKeys.test.ts`, `useProjects.test.ts`, etc.) test the hooks with mock network clients, but the `ShapeshyftClient` class itself -- which handles URL construction, header creation, and error handling -- needs dedicated unit tests.
- Key scenarios to test: correct URL encoding of `entitySlug` and `projectId` with special characters, test mode parameter injection, error response handling for different HTTP status codes, and correct header construction for auth vs. API key vs. no-auth endpoints.

### 3. Improve Error Handling Granularity
- The `handleApiError` function in `shapeshyft-helpers.ts` extracts error messages from responses but always wraps them in a generic `Error`. There is no distinction between network errors, authentication errors (401), authorization errors (403), not-found errors (404), validation errors (422), and server errors (500).
- Consider creating typed error classes (e.g., `ShapeshyftApiError extends Error` with `statusCode`, `errorCode`, and `details` fields) so consumers can handle different error types programmatically.
- The hooks currently surface errors as `Optional<string>` -- a typed error object would allow the app to show more specific error messages and take appropriate recovery actions (e.g., redirect to login on 401).

## Priority 2 - Medium Impact

### 3. Add a `verify` Script for Pre-Commit Checks
- The CLAUDE.md notes "No `verify` script. Run checks manually: `bun run typecheck && bun run lint && bun run test:run && bun run build`". This is inconsistent with `shapeshyft_types` which has `bun run verify`.
- Adding a `verify` script to `package.json` would standardize the pre-commit workflow across all ShapeShyft projects and reduce the chance of publishing with failing checks.

### 4. Add Optimistic Updates to Mutation Hooks
- The CRUD hooks (`useKeys`, `useProjects`, `useEndpoints`) use `onSuccess: () => invalidateQueries()` to refresh data after mutations. This means the UI shows stale data until the refetch completes.
- TanStack Query supports optimistic updates via `onMutate` that update the cache immediately and roll back on error. This would significantly improve perceived performance for create/update/delete operations.
- This is especially impactful for the endpoint and project management UIs where users expect instant feedback.

### 5. Add Retry Configuration for Network Failures
- The hooks use TanStack Query's default retry behavior but do not explicitly configure retry counts or backoff strategies. Network failures during AI execution (which can take several seconds) could benefit from configurable retry logic.
- Consider exposing retry options in the hook `options` parameter, with sensible defaults: queries retry 3 times with exponential backoff, mutations do not retry (to avoid duplicate side effects).
- The `useAiExecute` hook's `execute` function is particularly important -- AI execution can fail transiently and should have user-controllable retry behavior.

## Priority 3 - Nice to Have

### 6. Export ShapeshyftClient Configuration Type
- The `ShapeshyftClient` constructor takes an inline `config` object `{ baseUrl, networkClient, testMode? }`. This type is not exported, so consumers who need to pass around client configuration must reconstruct the type.
- Consider exporting a `ShapeshyftClientConfig` interface.

### 7. Add Hook Usage Examples to Hook Files
- Each hook file has a return type interface but lacks inline usage examples. Adding `@example` JSDoc blocks showing how to use the hook in a component would improve developer onboarding.
- This is especially valuable for `useAiExecute` which has a more complex parameter signature with `organizationPath`, `projectName`, `endpointName`, etc.

### 8. Consider Deduplicating ShapeshyftClient Instantiation in Hooks
- Each hook (`useKeys`, `useProjects`, `useEndpoints`, etc.) independently creates a `ShapeshyftClient` via `useMemo`. When multiple hooks are used in the same component, multiple client instances are created with the same configuration.
- Consider accepting a `ShapeshyftClient` instance directly (or providing a React context) to allow sharing a single client instance across hooks, reducing memory overhead and improving consistency.
