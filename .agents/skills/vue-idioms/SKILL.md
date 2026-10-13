---
name: vue-idioms
description: >-
  Vue 3 Composition API patterns: `<script setup>` syntax, reactive state with Pinia stores, reusable composables, and Vitest component testing. Use when developing or refactoring Vue 3 frontend applications.
---

## Vue Idioms and Patterns

### Core Philosophy

Vue 3 Composition API is the default for all new code. `<script setup>` is the canonical syntax. Think in terms of reactive *data flows*, not component lifecycle hooks. Composables (`use*` functions) are the primary unit of logic reuse.

> **Scope:** This file covers Vue 3 *coding idioms* for components, stores, and composables. For TypeScript type system patterns, see `@.agents/skills/typescript-idioms/SKILL.md`. For file and folder layout, see `references/project-structure.md` (and the shared `@.agents/skills/frontend-design/references/frontend-layout.md`). For test naming, see `@.agents/rules/testing-strategy.md`. For logging, see `@.agents/skills/logging-implementation/SKILL.md`.
>
> **Loading guard:** Do NOT load this skill for non-Vue projects. React → `react-idioms`; Angular → `angular-idioms`; Next.js → `nextjs-idioms`. This skill co-loads with `typescript-idioms` (required for any Vue work).

## When to Load References

> **Always load `typescript-idioms` first** — it is required alongside this skill for any Vue work.
> Load these **before** writing code in the matching context — not after.

| Situation | Reference to Load |
|---|---|
| TypeScript type system, async, Zod, error types | `@.agents/skills/typescript-idioms/SKILL.md` (always co-load) |
| Starting a new Vue project or reviewing file layout | `references/project-structure.md` |
| Choosing Vue ecosystem package versions, Vite/Vitest config | `references/recommended-dependencies.md` |
| Defining Zod schemas or validating boundaries | `@.agents/skills/typescript-idioms/references/zod-patterns.md` |
| Writing code that handles user input, async, or I/O | `@.agents/skills/typescript-idioms/references/ts-patterns-and-anti-patterns.md` |

### Toolchain and Version Milestones

> Default to the latest Vue 3 stable. As of July 2026, Vue **3.5+** with Vite 6+.

**Key version milestones that affect this skill:**
- **3.5+** — `useTemplateRef` (type-safe template refs), improved `useId`, Suspense stable
- **3.4+** — `defineModel` (replaces verbose v-model boilerplate), improved `watch` generics
- **3.3+** — `defineOptions`, `defineSlots`, generic components with `<script setup>`
- **3.2+** — `<script setup>` syntax finalized

> For recommended package versions and starter configs, see `references/recommended-dependencies.md`.

---

### `<script setup>` — The Only Style

Always use `<script setup lang="ts">`. Never use the Options API or the class-style component pattern for new code.

```vue
<!-- ✅ Canonical style -->
<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{ title: string; count?: number }>();
const emit = defineEmits<{ 'update:count': [value: number] }>();

const doubled = computed(() => (props.count ?? 0) * 2);
</script>

<!-- ❌ Options API — do not use for new components -->
<script lang="ts">
export default { props: { title: String }, ... }
</script>
```

---

### Reactivity: `ref` vs `reactive`

| Use          | When                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `ref<T>()`   | Primitives, single values, values that may be reassigned                           |
| `reactive()` | Plain objects where you always access properties (never reassign the whole object) |
| `readonly()` | Expose state that must not be mutated outside its owner                            |

```typescript
// ✅ ref for primitives and replaceable objects
const count = ref(0);
const user = ref<User | null>(null);
user.value = fetchedUser; // reassignment is fine

// ✅ reactive for objects where you destructure properties
const form = reactive({ title: '', priority: 'medium' });

// ❌ Never destructure a reactive object — reactivity is lost
const { title } = form; // title is now a plain string, NOT reactive
// ✅ Use toRefs if you must destructure
const { title } = toRefs(form);
```

---

### Computed Properties

1. **Use `computed` for all derived state** — never recompute in the template
   ```typescript
   // ✅ Cached, reactive
   const filteredTasks = computed(() =>
       tasks.value.filter(t => t.status === activeFilter.value)
   );

   // ❌ Recomputes on every render
   // <template>{{ tasks.filter(t => t.status === filter) }}</template>
   ```

2. **Never cause side effects inside `computed`** — computed must be pure
   ```typescript
   // ❌ Side effect in computed
   const count = computed(() => {
       taskStore.logAccess(); // NO — this is a side effect
       return tasks.value.length;
   });
   ```

3. **Use writable computed for two-way bindings**
   ```typescript
   const modelValue = computed({
       get: () => props.modelValue,
       set: (val) => emit('update:modelValue', val),
   });
   ```

---

### Watch Strategy

Use the most precise watcher for the situation — over-watching is a performance and correctness problem.

| Watcher       | Use When                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `watchEffect` | Side effect that should re-run whenever any of its reactive dependencies change; auto-tracks dependencies |
| `watch`       | You need the old value, lazy execution, or want to watch a specific source explicitly                     |
| `computed`    | You need a synchronous derived value (prefer this over `watch` for transformation)                        |

```typescript
// ✅ watchEffect — auto-tracks dependencies
watchEffect(() => {
    document.title = `Tasks (${count.value})`;
});

// ✅ watch — explicit source, has old value
watch(userId, async (newId, oldId) => {
    if (newId !== oldId) await loadUser(newId);
}, { immediate: true });

// ❌ Avoid using watch just for computed values
watch(tasks, () => { filteredCount.value = tasks.value.filter(...).length; });
// ✅ Use computed instead
const filteredCount = computed(() => tasks.value.filter(...).length);
```

---

### Pinia Stores

> The store directory structure is defined in `references/project-structure.md`. This section covers Pinia coding idioms.

1. **Use the Setup Store API** (not Options API) for new stores
   ```typescript
   // task/store/task.store.ts
   export const useTaskStore = defineStore('task', () => {
       // State
       const tasks = ref<Task[]>([]);
       const isLoading = ref(false);

       // Getters (computed)
       const completedTasks = computed(() =>
           tasks.value.filter(t => t.status === 'done')
       );

       // Actions
       async function loadTasks() {
           isLoading.value = true;
           try {
               tasks.value = await taskAPI.getTasks();
           } finally {
               isLoading.value = false;
           }
       }

       return { tasks, isLoading, completedTasks, loadTasks };
   });
   ```

2. **Never mutate store state from outside the store**
   ```typescript
   // ❌ Direct mutation from a component
   const store = useTaskStore();
   store.tasks.push(newTask); // NO

   // ✅ Call an action
   await store.addTask(newTask);
   ```

3. **Inject the API dependency — never import it directly inside the store**
   ```typescript
   // ✅ Receives the API interface — testable with createTestingPinia + mock API
   export const useTaskStore = defineStore('task', () => {
       const api = inject<TaskAPI>(TASK_API_KEY);
       if (!api) throw new Error('[TaskStore] TASK_API_KEY not provided — ensure app.provide() is called before store access');
       // ...
   });
   ```

4. **Use `storeToRefs` when destructuring a store in components**
   ```typescript
   // ✅ Preserves reactivity
   const { tasks, isLoading } = storeToRefs(useTaskStore());
   const { loadTasks } = useTaskStore(); // actions don't need storeToRefs
   ```

---

### Composables (`use*` Functions)

Composables are the Vue equivalent of custom hooks — self-contained, reusable units of reactive logic.

1. **Naming: always prefix with `use`**
   - `useTaskFilters`, `useAuth`, `usePagination`

2. **Return reactive refs, not raw values**
   ```typescript
   // ✅ Caller can use returned values reactively
   function useCounter(initial = 0) {
       const count = ref(initial);
       const increment = () => count.value++;
       return { count, increment };
   }

   // ❌ count is a plain number — not reactive
   function useCounter() {
       let count = 0;
       return { count };
   }
   ```

3. **Always clean up side effects in `onUnmounted`**
   ```typescript
   function useWindowResize() {
       const width = ref(window.innerWidth);
       const handler = () => (width.value = window.innerWidth);

       onMounted(() => window.addEventListener('resize', handler));
       onUnmounted(() => window.removeEventListener('resize', handler)); // ✅ cleanup
       return { width };
   }
   ```

4. **Template refs with `useTemplateRef` (Vue 3.5+)** — type-safe, IDE-friendly replacement for `ref(null)`
   ```typescript
   // ✅ Vue 3.5+ — useTemplateRef provides fully typed access
   const inputEl = useTemplateRef<HTMLInputElement>('myInput');
   // <input ref="myInput" />

   // ❌ Old pattern (before 3.5) — less type-safe
   const inputEl = ref<HTMLInputElement | null>(null);
   ```

5. **Feature-specific composables live inside the feature directory** — global composables go in `src/composables/`. See `references/project-structure.md`.

---

### Component Design

1. **`defineProps` with TypeScript generics — no runtime validators for typed props**
   ```typescript
   const props = defineProps<{
       taskId: string;
       variant?: 'compact' | 'full';
   }>();

   // Defaults via withDefaults
   const props = withDefaults(defineProps<{ variant?: 'compact' | 'full' }>(), {
       variant: 'full',
   });
   ```

2. **`defineEmits` with typed event signatures**
   ```typescript
   const emit = defineEmits<{
       'update:modelValue': [value: string];
       'submit': [task: CreateTaskRequest];
   }>();
   ```

3. **`defineModel` (Vue 3.4+) — preferred v-model pattern**
   ```vue
   <script setup lang="ts">
   // ✅ Vue 3.4+ — one line replaces modelValue prop + emit boilerplate
   const modelValue = defineModel<string>({ required: true });

   // Named models for multi-v-model components
   const title = defineModel<string>('title');
   const priority = defineModel<'low' | 'medium' | 'high'>('priority', { default: 'medium' });
   </script>

   <!-- Usage by parent: <TaskForm v-model="name" v-model:priority="prio" /> -->
   ```

   Pre-3.4 fallback (when `defineModel` is unavailable):
   ```typescript
   // ❌ Verbose — use defineModel instead on Vue 3.4+
   const props = defineProps<{ modelValue: string }>();
   const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
   ```

4. **`defineExpose` to selectively expose methods to parent refs**
   ```typescript
   // Everything in <script setup> is private by default.
   // Use defineExpose only for intentional parent access (e.g., form.reset()).
   defineExpose({ reset, focus });
   // ❌ Without defineExpose: parent ref.value.reset() will be undefined
   ```

5. **`v-bind="$attrs"` and `inheritAttrs: false` for forwarding attributes**
   ```typescript
   // Avoid prop drilling for HTML attributes — forward them to the root element
   defineOptions({ inheritAttrs: false });
   // In template: <input v-bind="$attrs" />
   ```

6. **One concern per component** — if the template exceeds 100 lines (excluding boilerplate), extract a sub-component

7. **Never put business logic in the template** — computed and composables belong in `<script setup>`

---

### Template Patterns

1. **Always bind `:key` with stable, unique IDs in `v-for`** — never use index as key when list order can change
   ```html
   <!-- ✅ Stable key -->
   <TaskCard v-for="task in tasks" :key="task.id" :task="task" />

   <!-- ❌ Index key — causes rerender bugs when list reordered -->
   <TaskCard v-for="(task, i) in tasks" :key="i" :task="task" />
   ```

2. **Never combine `v-if` and `v-for` on the same element** — wrap with `<template>`
   ```html
   <!-- ✅ -->
   <template v-for="task in tasks" :key="task.id">
       <TaskCard v-if="task.visible" :task="task" />
   </template>
   ```

---

### Route Transitions

When using `<Transition>` or `<RouterView>` with transition effects, CSS frameworks that use `@layer` (Tailwind v4, Open Props, UnoCSS) can silently break SPA navigation by overriding transition properties in the cascade. This causes `transitionend` to never fire, permanently blocking the entering component.

1. **Avoid `mode="out-in"` when using `@layer`-based CSS frameworks** — the leaving component's `transitionend` event may never fire, blocking the entering component indefinitely. Use simultaneous transitions instead:
   ```html
   <!-- ❌ Dangerous with @layer CSS frameworks -->
   <Transition name="fade" mode="out-in">
     <component :is="Component" />
   </Transition>

   <!-- ✅ Safe: simultaneous leave/enter, always mounts new component -->
   <Transition name="fade">
     <component :is="Component" :key="$route.path" />
   </Transition>
   ```

2. **Always bind `:key="$route.path"`** on dynamic `<component>` inside `<Transition>` — forces Vue to treat each route as a distinct component instance, ensuring proper enter/leave lifecycle

3. **Use `!important` on route transition CSS classes** — guarantees transition properties win the `@layer` cascade:
   ```css
   .fade-enter-active {
     transition: opacity 0.15s ease-in !important;
   }
   .fade-leave-active {
     transition: opacity 0.15s ease-out !important;
     position: absolute !important;
     width: 100% !important;
     top: 0 !important;
     left: 0 !important;
   }
   .fade-enter-from,
   .fade-leave-to {
     opacity: 0 !important;
   }
   ```

4. **Give the transition parent `position: relative`** — contains the absolutely-positioned leaving element during the simultaneous transition overlap

> For full diagnosis steps when a transition-stuck blank screen occurs, see the Debugging Protocol's Frontend module: `@.agents/skills/debugging-protocol/languages/frontend.md` § CSS × Animation.

---

### Error Handling

> For error type hierarchies, custom error classes, and `Result<T, E>`, see `@.agents/skills/typescript-idioms/SKILL.md` §Error Handling. This section covers Vue-specific error handling only.

1. **Global error handler — register at app startup:**
   ```typescript
   // main.ts — catches all unhandled errors in any component
   app.config.errorHandler = (err, instance, info) => {
     logger.error('Unhandled Vue error', {
       error: err instanceof Error ? err.message : String(err),
       componentInfo: info,
       stack: err instanceof Error ? err.stack : undefined,
     });
   };
   ```

2. **Component-level error capture with `onErrorCaptured`:**
   ```typescript
   // ✅ Catches errors from child component tree — use for error boundary components
   const error = ref<Error | null>(null);
   onErrorCaptured((err) => {
     error.value = err instanceof Error ? err : new Error(String(err));
     return false; // stop propagation to parent
   });
   ```

3. **Async errors in lifecycle hooks — always handle:**
   ```typescript
   // ❌ Floating promise — error silently lost
   onMounted(() => { loadTasks(); });

   // ✅ Catch and surface to reactive error state
   onMounted(async () => {
     try {
       await loadTasks();
     } catch (err) {
       error.value = err instanceof Error ? err : new Error(String(err));
     }
   });
   ```

---

### Form Handling

> For Zod schema patterns, see `@.agents/skills/typescript-idioms/references/zod-patterns.md`. This section covers Vue-specific form binding only.

1. **`defineModel` for simple forms (Vue 3.4+)** — see Component Design §3 above.

2. **VeeValidate + Zod for validated forms:**
   ```vue
   <script setup lang="ts">
   import { useForm, useField } from 'vee-validate';
   import { toTypedSchema } from '@vee-validate/zod';
   import { z } from 'zod';

   const schema = toTypedSchema(z.object({
     title: z.string().min(1, 'Title is required').max(200),
     priority: z.enum(['low', 'medium', 'high']),
   }));

   const { handleSubmit, errors } = useForm({ validationSchema: schema });
   const { value: title } = useField<string>('title');
   const { value: priority } = useField<string>('priority');

   const onSubmit = handleSubmit(async (values) => {
     await taskStore.createTask(values);
   });
   </script>

   <template>
     <form @submit="onSubmit">
       <input v-model="title" />
       <span v-if="errors.title">{{ errors.title }}</span>
       <select v-model="priority">
         <option value="low">Low</option>
         <option value="medium">Medium</option>
         <option value="high">High</option>
       </select>
       <button type="submit">Create</button>
     </form>
   </template>
   ```

3. **Client-side validation is UX, not security** — always validate at the API boundary too. See `@.agents/rules/security-principles.md`.

---

### Performance

> Profile before optimizing — see `@.agents/skills/perf-optimization/SKILL.md` for methodology. This section covers Vue-specific patterns only.

1. **`defineAsyncComponent` for lazy loading heavy components:**
   ```typescript
   import { defineAsyncComponent } from 'vue';
   const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'));
   ```

2. **Lazy route loading with Vue Router:**
   ```typescript
   const routes = [
     { path: '/tasks', component: () => import('../views/TaskView.vue') },
     { path: '/settings', component: () => import('../views/SettingsView.vue') },
   ];
   ```

3. **`<KeepAlive>` for caching expensive component state:**
   ```html
   <!-- Caches up to 10 component instances — avoids teardown/remount cost -->
   <KeepAlive :max="10">
     <component :is="currentTab" />
   </KeepAlive>
   ```

4. **`v-memo` for expensive list rendering (Vue 3.2+):**
   ```html
   <!-- Re-renders item only when its id or selected state changes -->
   <div v-for="item in list" :key="item.id" v-memo="[item.id, item === selected]">
     <ExpensiveComponent :item="item" />
   </div>
   ```

5. **`v-once` for static content that never changes:**
   ```html
   <footer v-once>© 2026 Acme Corp</footer>
   ```

---

### Testing

> For test naming, pyramid ratios, and the AAA pattern, see `@.agents/rules/testing-strategy.md`. This section covers **Vue-specific tooling only**.

1. **Mount wrapper with `@vue/test-utils` + `createTestingPinia`:**
   ```typescript
   import { mount } from '@vue/test-utils';
   import { createTestingPinia } from '@pinia/testing';
   import { vi } from 'vitest';

   function mountComponent(overrides: Record<string, unknown> = {}) {
     return mount(TaskView, {
       global: {
         plugins: [createTestingPinia({ createSpy: vi.fn })],
         stubs: { RouterLink: true },
       },
       ...overrides,
     });
   }
   ```

2. **Component interaction — test behaviour, not implementation:**
   ```typescript
   test('calls createTask when form submitted', async () => {
     const wrapper = mountComponent();
     const store = useTaskStore();

     await wrapper.find('[data-testid="title-input"]').setValue('New Task');
     await wrapper.find('form').trigger('submit');

     expect(store.createTask).toHaveBeenCalledWith(
       expect.objectContaining({ title: 'New Task' }),
     );
   });
   ```

3. **Test composables in isolation:**
   ```typescript
   import { createApp } from 'vue';

   /** Runs a composable inside a throwaway component context. */
   function withSetup<T>(composable: () => T): [T, ReturnType<typeof createApp>] {
     let result!: T;
     const app = createApp({
       setup() { result = composable(); return () => {}; },
     });
     app.mount(document.createElement('div'));
     return [result, app];
   }

   test('useCounter increments', () => {
     const [{ count, increment }] = withSetup(() => useCounter(0));
     expect(count.value).toBe(0);
     increment();
     expect(count.value).toBe(1);
   });
   ```

4. **Test Pinia stores independently:**
   ```typescript
   import { setActivePinia, createPinia } from 'pinia';

   beforeEach(() => { setActivePinia(createPinia()); });

   test('loadTasks populates store', async () => {
     const store = useTaskStore();
     await store.loadTasks();
     expect(store.tasks).toHaveLength(3);
   });
   ```

5. **Snapshot testing for complex output:**
   ```typescript
   test('renders task card correctly', () => {
     const wrapper = mountComponent({ props: { task: mockTask } });
     expect(wrapper.html()).toMatchSnapshot();
   });
   ```

---

### Feedback Loop — Development Workflow

> **Critical:** Use `vue-tsc --noEmit` instead of `tsc --noEmit` for Vue projects.
> `tsc` cannot type-check `.vue` `<template>` blocks — template errors will be **invisible**.

| Phase | Command | Purpose |
|---|---|---|
| TDD / rapid iteration | `vue-tsc --noEmit` | Type-check templates + scripts — fastest loop |
| Pre-commit | `eslint .` | Static analysis (`eslint-plugin-vue` required) — **zero warnings** |
| Pre-commit | `prettier --write .` | Format — non-negotiable |
| Pre-commit | `vitest run` | Unit tests — must all pass |
| Coverage verification | `vitest run --coverage` | Verify before merging |

**Rules:**
- **Never** use `tsc --noEmit` on Vue projects — it skips all `.vue` template checking.
- `eslint-plugin-vue` must be configured with `plugin:vue/vue3-recommended` or stricter.
- `prettier` must handle `.vue` files (it does by default).

---

### Anti-Patterns

> Quick reference — if you're about to do any of these, stop and use the recommended pattern.

- ❌ **Options API in new code** — always use `<script setup lang="ts">`
- ❌ **Destructuring reactive objects** — loses reactivity; use `toRefs()` or `storeToRefs()`
- ❌ **Side effects in `computed`** — computed must be pure; use `watch` or `watchEffect`
- ❌ **`v-if` + `v-for` on the same element** — wrap with `<template>`
- ❌ **`:key="index"` on dynamic lists** — use stable unique IDs
- ❌ **Direct store mutation from components** — use store actions
- ❌ **Business logic in `<template>`** — move to `computed` or composables
- ❌ **`tsc --noEmit` on Vue projects** — use `vue-tsc --noEmit` (template checking)
- ❌ **`ref(null)` for template refs in Vue 3.5+** — use `useTemplateRef()` instead
- ❌ **Verbose `modelValue` + emit in Vue 3.4+** — use `defineModel()` instead
- ❌ **Importing API clients directly in stores** — inject via `inject()` for testability
- ❌ **`watch` for derived state** — use `computed` instead (it's cached and more efficient)

---

### Related Principles
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- TypeScript Idioms and Patterns @.agents/skills/typescript-idioms/SKILL.md
- Project Structure — Vue Frontend @.agents/skills/vue-idioms/references/project-structure.md
- Frontend Layout (framework-neutral, shared with React) @.agents/skills/frontend-design/references/frontend-layout.md
- Frontend Design @.agents/skills/frontend-design/SKILL.md
- Security Principles @.agents/rules/security-principles.md
- Accessibility Principles @.agents/rules/accessibility-principles.md
- Architectural Patterns — Testability-First Design @.agents/rules/architectural-pattern.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Logging and Observability Principles @.agents/skills/logging-implementation/SKILL.md
