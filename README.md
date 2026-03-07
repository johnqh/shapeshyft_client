# @sudobility/shapeshyft_client

React client library for the ShapeShyft API with state management hooks.

## Installation

```bash
bun add @sudobility/shapeshyft_client
```

## Usage

```typescript
import { useKeys, useProjects, useAiExecute } from '@sudobility/shapeshyft_client';

const { keys, isLoading, refresh, createKey } = useKeys(networkClient, baseUrl);
await refresh(userId, token);
```

## Hooks

| Hook | Purpose |
|------|---------|
| `useKeys` | LLM API key management |
| `useProjects` | Project CRUD |
| `useEndpoints` | Endpoint configuration |
| `useAiExecute` | LLM inference |
| `useAnalytics` | Usage analytics |
| `useSettings` | User settings |

Each hook returns `{ data, isLoading, error, refresh, clearError, reset }` plus CRUD methods.

## Development

```bash
bun run build        # Build to dist/
bun run test         # Run Vitest
bun run typecheck    # TypeScript check
bun run lint         # ESLint
bun run verify       # Typecheck + lint + test + build
```

## Related Packages

- `@sudobility/shapeshyft_types` -- Shared type definitions
- `@sudobility/shapeshyft_lib` -- Zustand stores wrapping these hooks
- `shapeshyft_app` -- Frontend consumer

## License

BUSL-1.1
