# ShapeShyft Client

React client library for ShapeShyft API with TanStack Query hooks.

**npm**: `@sudobility/shapeshyft_client`

## Tech Stack

- **Language**: TypeScript
- **Data Fetching**: TanStack Query v5
- **Build**: TypeScript compiler (tsc)
- **Test**: Vitest

## Project Structure

```
src/
├── index.ts          # Public exports
├── types.ts          # Client-specific types
├── hooks/            # TanStack Query hooks
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
bun run test         # Run Vitest
bun run test:run     # Run tests once
bun run lint         # Run ESLint
bun run typecheck    # TypeScript check
bun run format       # Format with Prettier
```

## Usage

```typescript
import { useKeys, useProjects, useEndpoints, useAiExecute } from '@sudobility/shapeshyft_client';

// In a React component
const { data: keys, isLoading } = useKeys(userId);
const { mutate: createProject } = useProjects(userId).create;
const { mutate: executeAi } = useAiExecute();
```

## Hooks

| Hook | Purpose |
|------|---------|
| `useKeys` | CRUD for LLM API keys |
| `useProjects` | CRUD for projects |
| `useEndpoints` | CRUD for endpoints |
| `useAiExecute` | Invoke LLM endpoints |
| `useAnalytics` | Fetch usage analytics |
| `useSettings` | User settings management |

## Peer Dependencies

Required in consuming app:
- `@sudobility/shapeshyft_types`
- `@sudobility/types`
- `@tanstack/react-query` >= 5.0.0
- `react` >= 18.0.0

## Publishing

```bash
bun run prepublishOnly  # Clean + build
npm publish             # Publish to npm (restricted)
```

## Testing

Uses Vitest with React Testing Library:

```bash
bun run test           # Watch mode
bun run test:run       # Single run
```
