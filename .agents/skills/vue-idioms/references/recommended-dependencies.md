---
name: Recommended Dependencies (Vue)
description: Curated Vue ecosystem packages with versions, starter configs (Vite, Vitest), and integration guidance. For shared TypeScript tooling, see typescript-idioms/references/recommended-dependencies.md.
---

# Recommended Dependencies (Vue — July 2026)

> **For shared tooling** (TypeScript, ESLint, Prettier, Vitest, Zod, pnpm), see `@.agents/skills/typescript-idioms/references/recommended-dependencies.md`.
> This file covers **Vue ecosystem packages only** — no duplication with the TypeScript reference.

## Core Stack
| Category | Package | Version | Notes |
|---|---|---|---|
| Framework | vue | 3.5+ | Composition API, `<script setup>`, `defineModel` |
| Build Tool | vite | 6+ | `@vitejs/plugin-vue` required |
| Vite Plugin | @vitejs/plugin-vue | 5+ | SFC compilation |
| Router | vue-router | 4.5+ | `<RouterView>`, `<RouterLink>`, route guards |
| State | pinia | 3+ | Setup Store API (not Options API) |
| Composables | @vueuse/core | 12+ | Collection of essential composables |
| Type Checking | vue-tsc | 2+ | **Required** — `tsc` cannot check `.vue` templates |
| Form Validation | vee-validate | 4.x | With `@vee-validate/zod` for Zod integration |
| Internationalization | vue-i18n | 10+ | `useI18n()` Composition API |

## Testing
| Category | Package | Version | Notes |
|---|---|---|---|
| Component Testing | @vue/test-utils | 2.x | `mount`, `shallowMount`, `flushPromises` |
| Store Testing | @pinia/testing | 0.1+ | `createTestingPinia` with spy factory |
| DOM Environment | jsdom | | Required `environment` for component tests |
| Test Runner | vitest | 3.x | Shared with TS stack — see TS recommended-dependencies |
| API Mocking | msw | 2.x | Shared with TS stack — see TS recommended-dependencies |

## Development Tooling
| Category | Package | Version | Notes |
|---|---|---|---|
| ESLint Plugin | eslint-plugin-vue | 9.x+ | `plugin:vue/vue3-recommended` minimum |
| Devtools | @vue/devtools | | Browser extension for debugging reactivity and state |

## Starter vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

## Starter vitest.config.ts (Vue)

> For the base vitest config shape, see `@.agents/skills/typescript-idioms/references/recommended-dependencies.md` §Starter vitest.config.ts. This config adds Vue-specific settings.

```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: false,
    environment: 'jsdom',         // Required for @vue/test-utils
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
        '**/vite.config.ts',
      ],
    },
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

## Starter test-setup.ts

```typescript
// src/test-setup.ts — global test setup for Vue component tests
import { config } from '@vue/test-utils';

// Stub global components that appear in many tests
config.global.stubs = {
  // RouterLink: true,   // Uncomment if vue-router causes test issues
  // Transition: true,   // Uncomment to skip transition animations in tests
};
```

## ESLint Flat Config Extension for Vue

> Extends the base ESLint flat config from `@.agents/skills/typescript-idioms/references/recommended-dependencies.md`.

```typescript
// eslint.config.ts
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        extraFileExtensions: ['.vue'],
      },
    },
  },
);
```

## Anti-Patterns
- ❌ Using `tsc --noEmit` instead of `vue-tsc --noEmit` — template errors invisible
- ❌ Mixing Vue 2 and Vue 3 dependencies (e.g., `vuex` with `pinia`)
- ❌ Using `@vue/composition-api` — Vue 2 backport, not needed in Vue 3
- ❌ Using `vuex` in new Vue 3 projects — use Pinia instead
- ❌ Using `axios` when native `fetch` (Node 24) or project `HttpClient` interface exists
- ❌ Installing `@types/node` manually with TypeScript 5.x+ and modern module resolution

### Related
- TypeScript Recommended Dependencies @.agents/skills/typescript-idioms/references/recommended-dependencies.md
- Vue Idioms @.agents/skills/vue-idioms/SKILL.md
- Vue Project Structure @.agents/skills/vue-idioms/references/project-structure.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
