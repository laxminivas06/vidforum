---
name: Vue Frontend Project Structure
description: Vue-specific deltas on the framework-neutral frontend layout — Pinia placement, composables, .spec.ts naming.
---

## Vue Frontend Project Structure

> **The base layout is framework-neutral and shared with React.** See `@.agents/skills/frontend-design/references/frontend-layout.md` for the canonical `apps/frontend/src` tree, `features/` vertical slices, `components/ui/` + `components/layout/` split, and `views/` conventions.
>
> This file lists **Vue-specific deltas only**. Apply these on top of the neutral layout.

### Vue-Specific Deltas

| Concern | Vue convention |
|---|---|
| Component file | `.vue` with `<script setup lang="ts">` |
| Reusable logic | `composables/` (`use*.ts`) — global at root, feature-specific inside `features/*/composables/` |
| State management | Pinia **Setup Store API** in `features/*/store/*.store.ts` (not Options API stores, not Vuex) |
| Root component | `App.vue` hosting `<RouterView>` |
| Test file naming | `*.spec.ts` co-located next to source (Vue CLI / community convention) |
| Test runner | Vitest with `@vue/test-utils` + `createTestingPinia`; `environment: 'jsdom'` |

### Vue Feature Slice (concrete)

```
features/task/
  components/
    TaskForm.vue
    TaskListItem.vue
    TaskFilters.vue
    TaskForm.spec.ts          # co-located component test
  store/
    task.store.ts             # Pinia setup store
    task.store.spec.ts        # co-located store test
  api/
    task.api.ts               # interface TaskAPI
    task.api.backend.ts       # production impl
    task.api.mock.ts          # test double
  services/
    task.service.ts
    task.service.spec.ts
  types/                      # TS interfaces (CreateTaskDTO, etc.)
  composables/                # feature-specific hooks (e.g. useTaskFilters.ts)
  index.ts                    # public exports — only what views/ needs
```

> **Pinia wiring:** stores inject their API dependency via `inject<TaskAPI>(TASK_API_KEY)` — never import the API client directly inside the store (testability: I/O isolation). See `../SKILL.md` §Pinia Stores.

### Test Organization

> Test-file naming: `*.spec.ts` co-located. For the cross-framework reconciliation rule (why Vue uses `.spec.ts` while Hono/generic-TS use `.test.ts`), see `@.agents/skills/typescript-idioms/references/project-structure.md` §Test Organization.

Unit tests co-locate next to source (`.spec.ts`). Integration tests in `tests/integration/`; E2E in `tests/e2e/` (or `apps/e2e/` for monorepos). See the neutral layout file for the shared test-directory structure.

### Related Principles
- Frontend Layout (framework-neutral) @.agents/skills/frontend-design/references/frontend-layout.md
- Project Structure @.agents/rules/project-structure.md (core philosophy)
- Vue Idioms and Patterns @../SKILL.md (Composition API, Pinia, composables)
- TypeScript Idioms and Patterns @.agents/skills/typescript-idioms/SKILL.md (type system, async patterns)
