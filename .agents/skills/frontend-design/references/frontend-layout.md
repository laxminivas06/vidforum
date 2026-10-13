---
name: Frontend Project Layout (Framework-Neutral)
description: Directory layout for SPA/CSR frontend apps (Vite-based) using vertical feature slices. Shared by React and Vue skills — apply framework deltas from the relevant skill.
---

## Frontend Project Layout (Framework-Neutral)

This is the canonical vertical-slice layout for **client-rendered** frontend apps built with Vite (React, Vue). The vertical slice principle applies — features are self-contained modules, not scattered across global folders.

> Framework-specific deltas (file extensions, state management, hooks vs composables, test-file naming) live in the respective skill. See the bottom of this file.

> **Note:** File extensions are omitted in the tree below for framework neutrality. Use the **Framework Deltas** table at the bottom for concrete extensions (e.g., `.vue`, `.tsx`, `.component.ts`). Test files shown as `.spec` should be read as `.spec.ts`, `.test.tsx`, etc. per the framework convention.

```
apps/
  frontend/                         # Frontend application source code
    src/
      assets/                       # Fonts, images
      features/                     # Business features organized as vertical slices. Each feature is SELF-CONTAINED.
        task/                       # Task management
          components/               # Feature-specific components go HERE, NOT in top-level components/
            TaskForm                # Extension per framework: .vue / .tsx / .component.ts
            TaskListItem
            TaskFilters
            TaskFilters.spec        # Test naming per framework: .spec.ts (Vue/Angular) or .test.tsx (React)
          store/                    # State management (Pinia / Zustand / Context)
            task.store
          api/                      # Data access — interface + impl + mock
            task.api                # interface TaskAPI
            task.api.backend        # Production implementation
            task.api.mock           # Test implementation
          services/                 # Business logic
            task.service
            task.service.spec       # Logic unit tests
          types/                    # Domain types / DTOs
          [composables|hooks]/      # Feature-specific reusable logic (use* functions)
          index.ts                  # Public exports. Export ONLY what's needed by views/
        order/
          ...
      [composables|hooks]/          # Global reusable logic (useAuth, useTheme) — naming per framework
      components/                   # Shared components — dumb UI, NO domain logic
        ui/                         # UI primitives (atoms & molecules) — pure, reusable, NO feature knowledge
          BaseButton
          BaseButton.spec
          types.ts
          index.ts
        layout/                     # Layout components (organisms) — composite UI structures
          AppHeader
          AppSidebar
          ErrorBoundary
          EmptyState
      layouts/                      # App shells (navbar/sidebar wrappers)
        MainLayout
        AuthLayout
      views/                        # Route entry points (the "glue") — compose features, don't implement them
        HomeView
        TaskView
      utils/                        # Pure, stateless helpers. No domain knowledge, no framework reactivity
      router/                       # Route definitions
      plugins/                      # Library configs (i18n, etc.)
      App                           # Root component (hosts <router-view> / <Routes>)
      main.ts                       # Entry point (bootstraps plugins & mounts app)
```

**Key conventions (apply to all frameworks):**
- `features/` for vertical slices — each feature exports only what `views/` needs via `index.ts`
- `components/ui/` for **shared** dumb UI (buttons, inputs) — NO domain logic, NO feature knowledge
- `components/layout/` for composite UI structures (headers, sidebars)
- `views/` are route entry points — they compose features, not implement them
- Feature components live **inside** the feature, NOT in top-level `components/`
- Global reusable logic (`use*` functions) at root; feature-specific hooks/composables inside the feature
- `api/` inside each feature — interface, production impl, test double. Services never call `fetch`/HTTP clients directly (testability: I/O isolation)

### Test Organization

> For test naming conventions and pyramid ratios, see `@.agents/rules/testing-strategy.md`. This section covers file placement only. Test-file extension/naming follows the framework default — see the deltas table below.

**Unit Tests — Co-located (next to source)**
```
features/task/
  components/
    TaskForm
    TaskForm.spec           # co-located component test
  store/
    task.store
    task.store.spec         # co-located store test
  services/
    task.service
    task.service.spec       # co-located logic test
  api/
    task.api                # interface (no test needed)
    task.api.mock           # test double
```

**Integration Tests — Separate `tests/` directory**
```
tests/
  helpers/
    test-server.ts          # Shared setup/teardown
    factories.ts            # Test data factories
  integration/
    task-api.integration.spec
```

**E2E Tests — Isolated**
```
tests/
  e2e/
    task-flow.e2e.spec      # Full browser tests (Playwright)
```

> For monorepos: E2E tests go in `apps/e2e/`. For single apps: `tests/e2e/`.

---

## Framework Deltas

Apply these on top of the neutral tree above.

| Concern | React | Vue | Angular |
|---|---|---|---|
| Component file | `.tsx` | `.vue` (`<script setup lang="ts">`) | `.component.ts` + `.component.html` |
| Reusable logic | `hooks/` (`use*.ts`) | `composables/` (`use*.ts`) | services + RxJS |
| State management | Zustand / Context (see react-idioms) | Pinia setup stores (see vue-idioms) | NgRx Signal Store / signals (see angular-idioms) |
| Root component | `App.tsx` + `<Routes>` | `App.vue` + `<RouterView>` | `app.component.ts` + `<router-outlet>` |
| Test file naming | `*.test.tsx` co-located | `*.spec.ts` co-located | `*.spec.ts` co-located (Angular CLI default) |
| Test runner | Vitest | Vitest | Vitest |
| Component testing | React Testing Library | `@vue/test-utils` | `@testing-library/angular` |

> **Angular layout differs more substantially** (uses `app/` not `src/`, `shared/`/`core/` split, `*.routes.ts`). See `@.agents/skills/angular-idioms/references/project-structure.md` for the Angular-specific tree rather than applying this neutral layout.

> **Next.js uses the App Router layout**, not this Vite SPA layout. See `@.agents/skills/nextjs-idioms/references/project-structure.md`.

### Related Principles
- Project Structure @.agents/rules/project-structure.md (core philosophy)
- React Idioms @.agents/skills/react-idioms/SKILL.md
- Vue Idioms @.agents/skills/vue-idioms/SKILL.md
- Angular Idioms @.agents/skills/angular-idioms/SKILL.md
- Frontend Design @../SKILL.md
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md (type system, async patterns)
