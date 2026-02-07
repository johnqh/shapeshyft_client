# ShapeShyft Client

React client library for ShapeShyft API with state management hooks.

**npm**: `@sudobility/shapeshyft_client`

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Build**: TypeScript compiler (tsc)
- **Test**: Vitest

## Project Structure

```
src/
├── index.ts          # Public exports
├── types.ts          # Client-specific types
├── hooks/            # React hooks
│   ├── index.ts      # Hook exports
│   ├── useKeys.ts    # LLM API key management
│   ├── useProjects.ts # Project CRUD
│   ├── useEndpoints.ts # Endpoint configuration
│   ├── useAiExecute.ts # LLM inference
│   ├── useAnalytics.ts # Usage analytics
│   └── useSettings.ts  # User settings
├── network/          # HTTP client utilities
│   ├── index.ts
│   ├── client.ts     # Fetch wrapper with auth
│   └── errors.ts     # Error handling
└── utils/            # Utility functions
```

## Commands

```bash
bun run build        # Build to dist/
bun run build:watch  # Watch mode build
bun run clean        # Remove dist/
bun run test         # Run Vitest (watch mode)
bun run test:run     # Run tests once
bun run lint         # Run ESLint
bun run typecheck    # TypeScript check
bun run format       # Format with Prettier
```

## Hooks

| Hook | Purpose | Methods |
|------|---------|---------|
| `useKeys` | LLM API key management | refresh, create, update, delete |
| `useProjects` | Project CRUD | refresh, create, update, delete |
| `useEndpoints` | Endpoint configuration | refresh, create, update, delete |
| `useAiExecute` | LLM inference | execute, getPrompt |
| `useAnalytics` | Usage analytics | refresh |
| `useSettings` | User settings | refresh, update |

## Usage

```typescript
import {
  useKeys,
  useProjects,
  useEndpoints,
  useAiExecute,
  useAnalytics,
  useSettings,
} from '@sudobility/shapeshyft_client';

// In a React component
const { keys, isLoading, refresh, createKey } = useKeys(networkClient, baseUrl);

// Fetch keys for a user
await refresh(userId, token);

// Create a new key
await createKey(userId, { key_name: 'My Key', provider: 'openai', api_key: 'sk-...' }, token);
```

### useProjects Example
```typescript
const { projects, refresh, createProject } = useProjects(networkClient, baseUrl);

await refresh(entitySlug, token);
await createProject(entitySlug, { project_name: 'my-project', display_name: 'My Project' }, token);
```

### useAiExecute Example
```typescript
const { execute, isLoading } = useAiExecute(networkClient, baseUrl);

const result = await execute(
  entitySlug,
  projectId,
  endpointId,
  { text: 'Hello world' },
  token
);
```

## State Pattern

Each hook follows a consistent pattern:
- `data` - The current data (null initially)
- `isLoading` - Loading state
- `error` - Error message (null if no error)
- `refresh()` - Fetch/refresh data
- `clearError()` - Clear error state
- `reset()` - Reset all state
- CRUD methods where applicable

## Peer Dependencies

Required in consuming app:
- `react` >= 18.0.0
- `@sudobility/shapeshyft_types` - Type definitions
- `@sudobility/types` - Common types

## Publishing

```bash
bun run prepublishOnly  # Clean + build
npm publish             # Publish to npm
```

## Architecture

```
shapeshyft_client (this package)
    ↑
shapeshyft_lib (business logic, stores)
    ↑
shapeshyft_app (frontend)
```

## Testing

Uses Vitest with mock network client:

```bash
bun run test         # Watch mode
bun run test:run     # Single run
```

Test coverage includes:
- Initial state verification
- Data fetching and state updates
- Error handling
- Loading states
- Callback memoization
