---
name: TypeScript Project Structure
description: Directory layout for Node.js/TypeScript backend services, libraries, and monorepos.
---

## TypeScript Project Structure

TypeScript is framework-agnostic. For framework-specific layouts, see the relevant skill:

- **Vite SPA frontend (React / Vue / Svelte)**: See `@.agents/skills/frontend-design/references/frontend-layout.md` (framework-neutral) + the framework's deltas
- **React SPA**: `@.agents/skills/react-idioms/references/project-structure.md`
- **Vue SPA**: `@.agents/skills/vue-idioms/references/project-structure.md`
- **Angular**: See `@.agents/skills/angular-idioms/references/project-structure.md` (uses `app/` not `src/`, different layout)
- **Next.js**: See `@.agents/skills/nextjs-idioms/references/project-structure.md` (App Router, not Vite SPA)
- **Hono / Node.js Backend**: See `@.agents/skills/hono-idioms/references/project-structure.md`

### Generic TypeScript Backend (Single App)

For backend services without a specific framework skill:

```
project-root/
  package.json
  tsconfig.json
  eslint.config.ts

  src/
    main.ts                          # Entry point: server startup, wires dependencies
    config.ts                        # Environment validation (Zod schema)
    error.ts                         # Application-wide error types

    features/
      task/
        task.service.ts              # Business logic orchestration
        task.logic.ts                # Pure business rules (no I/O)
        task.types.ts                # Domain types and Zod schemas
        task.repository.ts           # Storage interface
        task.repository.pg.ts        # Postgres implementation
        task.repository.mock.ts      # Mock for testing
        task.service.test.ts         # Unit tests (co-located)
      auth/
        auth.service.ts
        ...

    handlers/
      task.handler.ts                # HTTP handlers
      auth.handler.ts
    router.ts                        # Route definitions

  tests/
    integration/
      task.integration.test.ts       # Integration tests (real I/O)
    e2e/
      api.e2e.test.ts                # End-to-end tests
```

**Key conventions:**
- `src/config.ts` — validates all env vars with Zod at startup; the rest of the app imports from here
- `error.ts` per feature — typed error classes, composed at handler layer
- No `controllers/` or `services/` at top level — features are the top-level organization

---

### Library / NPM Package

For publishable libraries, SDKs, and shared packages:

```
project-root/
  package.json                       # "main", "exports", "types" fields
  tsconfig.json
  tsconfig.build.json                # Build-only config (excludes test files)
  src/
    index.ts                         # Public API surface — only re-export public symbols
    parser.ts                        # Public module
    types.ts                         # Public types
    error.ts                         # Public error classes
    internal/                        # Private implementation — never imported directly
      utils.ts
      cache.ts
  tests/
    parser.test.ts                   # Tests against public API
  examples/
    basic-usage.ts
```

**Key library conventions:**
- `src/index.ts` is the only public export surface — `internal/` is never exported
- `"exports"` field in `package.json` for subpath exports (enables tree-shaking)
- Do not export internal types that leak implementation details
- Ship both CJS and ESM via `tsup`. Starter config:

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,           // Generate .d.ts declaration files
  clean: true,         // Clean dist/ before each build
  sourcemap: true,
  splitting: false,    // Set true only if using dynamic imports
});
```

> For ESM/CJS dual output, `"exports"` in `package.json` must point to both:
> ```json
> "exports": {
>   ".": {
>     "import": "./dist/index.mjs",
>     "require": "./dist/index.cjs",
>     "types": "./dist/index.d.ts"
>   }
> }
> ```

---

### Monorepo (Multi-Package)

For projects with multiple related packages (equivalent to Rust workspace):

```
project-root/
  package.json                       # Workspace root (pnpm/npm workspaces)
  pnpm-workspace.yaml
  tsconfig.base.json                 # Shared tsconfig extended by packages

  packages/
    core/                            # Shared types and utilities
      package.json
      src/
        index.ts
        types.ts
        error.ts
    api-client/                      # HTTP client package
      package.json
      src/
        index.ts
        client.ts
    ui/                              # React component library
      package.json
      src/
        index.ts

  apps/
    backend/                         # Backend service
      package.json
      src/
        main.ts
        features/
          ...
    frontend/                        # Frontend app
      package.json
      src/
        main.tsx

  tests/
    e2e/                             # Workspace-level E2E tests
      api.e2e.test.ts
```

---

### Test Organization in TypeScript

> **Reconciliation rule (authoritative — framework skills defer to this):** Test-file naming follows the **framework CLI default** when one exists; otherwise co-located `*.test.ts`. Concretely: Vue and Angular use `*.spec.ts` (their CLI conventions); Next.js App Router uses `__tests__/*.test.ts`; Hono and generic TS use co-located `*.test.ts`. In a monorepo mixing frameworks, each package follows its own framework's convention — do not force one across all packages.

TypeScript has a convention-based two-tier test system:

**Unit Tests — Co-located (Not Separate Files)**
- Convention: `*.test.ts` files **next to the implementation file**
- Co-location makes imports trivial and keeps test and implementation in sync
- Can test exported AND internal functions from the same module
- This is the standard TypeScript/Vitest convention

```
features/task/
  task.service.ts
  task.service.test.ts         # ← co-located unit test
  task.logic.ts
  task.logic.test.ts           # ← co-located unit test
  task.repository.ts           # interface (no tests needed)
  task.repository.mock.ts      # mock implementation
```

**Integration Tests — Separate `tests/` Directory**
- Location: `tests/integration/` at project root
- These require real infrastructure (database, message queue, external services)
- Use Testcontainers or Docker Compose for environment setup
- Never import internal/private modules — only the public API

**E2E Tests — Isolated**
- Location: `tests/e2e/` (single app) or `apps/e2e/` (monorepo)
- Use Playwright for browser apps (see `browser-automation` skill)
- Use supertest or native fetch for API-only E2E tests

**Shared test helpers:**
```
tests/
  helpers/
    test-db.ts                 # Shared database setup/teardown
    factories.ts               # Test data factories
    test-server.ts             # HTTP test server wrapper
```

**Full test layout example:**
```
project-root/
  src/
    features/
      task/
        task.service.ts
        task.service.test.ts   # Unit (co-located, mocked I/O)
        task.logic.ts
        task.logic.test.ts     # Unit (co-located, pure functions)
        task.repository.mock.ts
  tests/
    helpers/
      test-db.ts
      factories.ts
    integration/
      task.integration.test.ts # Integration (real Postgres)
    e2e/
      task-api.e2e.test.ts     # E2E (full HTTP stack)
```

---

### Multiple Entry Points

For projects with multiple binaries (server, CLI, worker):

```
src/
  server.ts           # HTTP server entry point
  cli.ts              # CLI tool entry point
  worker.ts           # Background worker entry point
  lib/                # Shared library code
    index.ts
```

Configure separate `tsconfig` targets or `package.json` `exports` paths per entry point.

---

### Microservices

Each service is its own directory under `apps/` with its own `package.json`, `tsconfig.json`, and `Dockerfile`. Each service follows the same internal feature-slice layout. Add `packages/shared/` for cross-service contracts (Zod schemas, shared types) — keep this minimal. Services communicate via HTTP or message queues, never direct imports across service boundaries.

---

### Related Principles
- Project Structure Rule @.agents/rules/project-structure.md
- TypeScript Idioms and Patterns @../SKILL.md
- Testing Strategy @.agents/rules/testing-strategy.md
