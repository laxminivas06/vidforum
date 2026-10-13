## React Project Structure

> **The base layout is framework-neutral and shared with Vue.** See `@.agents/skills/frontend-design/references/frontend-layout.md` for the canonical `apps/frontend/src` tree, `features/` vertical slices, `components/ui/` + `components/layout/` split, and `views/` conventions.
>
> This file lists **React-specific deltas only**. Apply these on top of the neutral layout.

### React-Specific Deltas

| Concern | React convention |
|---|---|
| Component file | `.tsx` (typed) or `.jsx` |
| Reusable logic | `hooks/` (`use*.ts`) — global at root, feature-specific inside `features/*/hooks/` |
| State management | Zustand / Context for client UI state; TanStack Query for server state (never global store for server data) |
| Root component | `App.tsx` hosting `<Routes>` (React Router) or router-provided root |
| Test file naming | `*.test.tsx` / `*.test.ts` co-located next to source |
| Test runner | Vitest + React Testing Library; MSW for API mocking |

### React Feature Slice (concrete)

```
features/task/
  components/
    TaskBoard.tsx            # 'use client' when needed
    TaskCard.tsx
    TaskForm.tsx
    TaskCard.test.tsx        # co-located component test
  hooks/
    useTask.ts               # feature-specific hook (wraps TanStack Query)
    useTaskFilters.ts
  store/
    task.ui.store.ts         # Zustand — UI-only state (selectedId, filter)
  api/
    task.api.ts              # interface TaskAPI
    task.api.backend.ts      # production impl (fetch)
    task.api.mock.ts         # test double (in-memory)
  services/
    task.service.ts
    task.service.test.ts
  types/
    task.types.ts            # Domain types / DTOs
  index.ts                   # public exports — only what views/ needs
```

> **Server state stays in TanStack Query, client UI state in Zustand/Context.** Never mirror server data into a global store. See `../SKILL.md` §State Management.

> **Next.js uses a different layout** (App Router `app/` dir, not this Vite SPA layout). See `@.agents/skills/nextjs-idioms/references/project-structure.md`.

### Test Organization

> Test-file naming: `*.test.tsx` co-located. For the cross-framework reconciliation rule (why React uses `.test.tsx` while Vue/Angular use `.spec.ts`), see `@.agents/skills/typescript-idioms/references/project-structure.md` §Test Organization.

### Related Principles
- Frontend Layout (framework-neutral) @.agents/skills/frontend-design/references/frontend-layout.md
- Project Structure @.agents/rules/project-structure.md (core philosophy)
- React Idioms and Patterns @../SKILL.md
- Next.js Project Structure (for Next.js apps) @.agents/skills/nextjs-idioms/references/project-structure.md
