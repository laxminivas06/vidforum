---
name: Recommended Dependencies (TypeScript)
description: Curated packages, starter configs (tsconfig, vitest, eslint), and version guidance for Node.js/TypeScript projects (July 2026).
---

# Recommended Dependencies (TypeScript — July 2026)

> **Target:** Node.js 24 LTS, TypeScript 5.8+. All packages below are actively maintained and represent community-recommended choices.
>
> **Default package manager: `pnpm`.** Use `npm` only if the project already has a `package-lock.json`. For monorepos, `pnpm` workspaces are the default. All commands in this file use `pnpm` unless noted.

## Core Stack
| Category | Package | Version | Notes |
| :--- | :--- | :--- | :--- |
| Runtime | Node.js | 24 LTS | |
| Language | TypeScript | 5.8+ | |
| Dev Execution | tsx | | replaces ts-node |
| Validation | zod | **4.x** (default for new projects) | v3 still widely deployed; check `package.json` and see `references/zod-patterns.md` §Version Compatibility before writing schemas |
| HTTP Framework | Depends on project | | Hono, Express, Fastify (see framework skills) |
| Serialization | superjson | | preserves Date, Map, Set, BigInt |
| Date/Time | date-fns | 4.x | or Temporal API (when stable) |
| UUID | `crypto.randomUUID()` | | built-in, no package needed |
| CLI | commander | 12.x | |
| Config | zod | | parse process.env at startup |

## Testing
| Category | Package | Version | Notes |
| :--- | :--- | :--- | :--- |
| Test Runner | vitest | 3.x | Vite-native, ESM-first, compatible with Jest API |
| DOM Testing | @testing-library/* | | user-centric DOM queries |
| API Mocking | msw | 2.x | intercepts at network level |
| Fixtures | @faker-js/faker | 9.x | |
| Coverage | @vitest/coverage-v8 | | |
| E2E | Playwright | | see browser-automation skill |
| Containers | testcontainers | 10.x | real databases/services in tests |
| Parameterized | `it.each` / `test.each` | built-in vitest | table-driven tests |
| Snapshot | `expect().toMatchSnapshot()` | built-in vitest | golden-file testing |

## Resilience & Networking

| Category | Package | Version | Notes |
| :--- | :--- | :--- | :--- |
| HTTP Client | node fetch / undici | built-in Node 24 | No package needed for server-side fetch |
| HTTP Client (advanced) | got | 14.x | Retries, timeouts, hooks — when native fetch is insufficient |
| Retry / Backoff | p-retry | 6.x | Promise retry with exponential backoff |
| Timeout | `AbortSignal.timeout()` | built-in | No package needed |
| Circuit Breaker | opossum | 8.x | Node.js circuit breaker library |
| Rate Limiting | bottleneck | 2.x | Job scheduler and rate limiter |


## Development Tooling
| Category | Package | Version | Notes |
| :--- | :--- | :--- | :--- |
| Linting | eslint | 9.x | flat config + @typescript-eslint 8.x |
| Formatting | prettier | 3.x | non-negotiable |
| Type Checking | tsc | | `--noEmit` (or vue-tsc for Vue projects) |
| Bundle Analysis | knip | | find unused exports and dependencies |
| Audit | npm audit | | or pnpm audit |

## Starter tsconfig.json Template
```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Starter vitest.config.ts Template
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,          // Prefer explicit imports: import { describe, it, expect } from 'vitest'
    environment: 'node',     // Use 'jsdom' for browser/DOM-heavy code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.mock.ts',
        '**/*.d.ts',
        '**/vitest.config.ts',
      ],
    },
  },
});
```

## Starter ESLint Flat Config Template
```typescript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
```

## Version Pinning Policy
- Use exact versions in lockfile (pnpm-lock.yaml / package-lock.json)
- Commit the lockfile for all projects (apps AND libraries)
- Use `^` ranges in package.json for libraries
- Run `npm audit` / `pnpm audit` in CI
- Use `knip` to detect unused dependencies

## Monorepo Configuration (pnpm Workspaces)

For multi-package projects:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

Shared `tsconfig.base.json` at the root, extended by each package:
```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Each package's `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

Shared ESLint config at workspace root, extended by packages:
```typescript
// eslint.config.base.ts
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
);
```

> Every workspace package MUST have its own `tsconfig.json` extending the base. Use CI to enforce this.


## Anti-Patterns
- ❌ Using ts-node in production — use tsx or compile to JS
- ❌ Mixing Jest and Vitest in the same project
- ❌ Using moment.js for new projects — use date-fns or Temporal
- ❌ Installing @types/node manually when using TypeScript 5.x+ with modern module resolution
- ❌ Using lodash when native alternatives exist (Object.groupBy, structuredClone, Array.toSorted)
- ❌ Using uuid package when crypto.randomUUID() is available natively

### Related
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
