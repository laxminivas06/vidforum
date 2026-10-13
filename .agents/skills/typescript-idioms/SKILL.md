---
name: typescript-idioms
description: >-
  TypeScript strict typing: type narrowing, discriminated unions, Zod runtime validation, generic utility types, and Vitest testing. Use when writing or refactoring TypeScript across frontend, backend, or full-stack projects.
---

## Core Philosophy
TypeScript's type system is your documentation, your test, and your specification — all at once. Make the type system encode the invariants of your domain so that invalid states are unrepresentable. Lean into the compiler.

> **Scope:** This file covers TypeScript-specific *type system and language idioms*. For framework-specific patterns, see the respective idiom skill (Vue, React, Angular, Next.js, Hono). For file layout, see `references/project-structure.md`. For detailed safety, SAST patterns, and performance patterns, see `references/ts-patterns-and-anti-patterns.md`. For quality commands, see `@.agents/rules/code-idioms-and-conventions.md`. For logging library, see `@.agents/skills/logging-implementation/SKILL.md`.

> **Loading guards:**
> - **Plain JavaScript (no `tsconfig.json`):** load `@.agents/skills/javascript-idioms/SKILL.md` instead — this skill assumes strict-mode TS.
> - **Hono backend:** `hono` has no repo-level marker file, so it is not auto-detected. If `hono` appears in `package.json` dependencies, **co-load `@.agents/skills/hono-idioms/SKILL.md`** alongside this skill.
> - **Test-file naming diverges by framework:** see `references/project-structure.md` § Test Organization for the reconciliation rule before creating test files.

## When to Load References

> Load these **before** writing code in the matching context — not after.

| Situation | Reference to Load |
|---|---|
| Starting a new project or setting up file layout | `references/project-structure.md` |
| Choosing packages, tsconfig template, or vitest config | `references/recommended-dependencies.md` |
| Writing code that handles user input, async operations, or I/O | `references/ts-patterns-and-anti-patterns.md` |
| Defining Zod schemas or validating API/env boundaries | `references/zod-patterns.md` |

## Toolchain and Runtime
- Default to latest Node.js LTS. As of July 2026, Node.js 24 LTS with TypeScript 5.8+
- ESM over CJS for all new projects
- `tsx` for development execution (replaces ts-node)
- Key version milestones: TS 5.0+ decorators, TS 5.4+ NoInfer, TS 5.5+ inferred type predicates

## Strict Mode — Non-Negotiable
All TypeScript projects MUST have strict mode enabled. If a project does not have these settings, fix `tsconfig.json` before proceeding.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Type System Idioms

1. **Use `unknown` instead of `any`**
   ```typescript
   // ❌ any disables type checking
   function processPayload(payload: any) {
     console.log(payload.id); // No error if id doesn't exist
   }

   // ✅ unknown forces narrowing
   function processPayload(payload: unknown) {
     if (typeof payload === 'object' && payload !== null && 'id' in payload) {
       console.log(payload.id);
     }
   }
   ```

2. **Discriminated Unions for state machines**
   ```typescript
   // ❌ Optional properties lead to impossible states
   type State = {
     status: 'loading' | 'success' | 'error';
     data?: string;
     error?: Error;
   };

   // ✅ Discriminated union makes impossible states unrepresentable
   type State = 
     | { status: 'loading' }
     | { status: 'success'; data: string }
     | { status: 'error'; error: Error };
   ```

3. **Type narrowing with `in` and `typeof`**
   ```typescript
   function handle(val: string | number) {
     if (typeof val === 'string') {
       // val is string
     }
   }
   ```

4. **Satisfies operator for checking without widening**
   ```typescript
   type Colors = 'red' | 'green' | 'blue';
   type RGB = [number, number, number];
   
   // ❌ Record widens the specific keys
   const palette1: Record<Colors, RGB> = { red: [255, 0, 0], green: [0, 255, 0], blue: [0, 0, 255] };
   
   // ✅ satisfies keeps exact type
   const palette2 = { red: [255, 0, 0], green: [0, 255, 0], blue: [0, 0, 255] } satisfies Record<Colors, RGB>;
   ```

5. **`readonly` everywhere**
   ```typescript
   // ❌ Mutable arrays
   function sum(numbers: number[]): number { ... }
   
   // ✅ Readonly arrays
   function sum(numbers: readonly number[]): number { ... }
   ```

6. **Opaque/Nominal typing for domain primitives**
   ```typescript
   type UserId = string & { readonly __brand: 'UserId' };
   type OrderId = string & { readonly __brand: 'OrderId' };
   
   function getUser(id: UserId): User { ... }
   
   // ❌ Compile error — OrderId is not assignable to UserId
   getUser(orderId);
   
   // ✅ Explicit creation
   const userId = 'u-123' as UserId;
   getUser(userId);
   ```

7. **Template literal types for string patterns**
   ```typescript
   type EventName = `on${Capitalize<string>}`;
   type Route = `/${string}`;
   ```

8. **`NoInfer<T>` to prevent unwanted inference (TS 5.4+)**
   ```typescript
   function createFSM<S extends string>(initial: S, transitions: Record<S, NoInfer<S>[]>) { ... }
   ```

## Null Safety
1. **Enable `strictNullChecks`** (always).
2. **Optional Chaining (`?.`) over explicit checks**
   ```typescript
   // ❌ Verbose
   const city = user && user.address && user.address.city;
   
   // ✅ Concise
   const city = user?.address?.city;
   ```
3. **Nullish Coalescing (`??`) over Logical OR (`||`)**
   ```typescript
   // ❌ Fails on 0 or ''
   const count = input.count || 10;
   
   // ✅ Only falls back on null/undefined
   const count = input.count ?? 10;
   ```
4. **Explicit Resource Management (`using` declarations — TypeScript 5.2+)**
   Requires `lib: ["es2022"]` or higher in `tsconfig.json`. Available in all Node.js 24 LTS projects.
   ```typescript
   // ✅ Automatic cleanup — resource disposed when scope exits
   {
     using file = await openFile('data.csv');
     // file is automatically closed when block exits, even on throw
   }
   ```

## Error Handling
1. **Always throw Error instances, never primitives**
   ```typescript
   // ❌ Loses stack trace, breaks instanceof checks
   throw 'Something went wrong';
   throw { message: 'fail' };
   
   // ✅ Proper error with stack trace
   throw new Error('Something went wrong');
   ```

2. **Custom error classes for domain errors**
   ```typescript
   export class NotFoundError extends Error {
     constructor(public readonly resource: string, public readonly id: string) {
       super(`${resource} not found: ${id}`);
       this.name = 'NotFoundError';
     }
   }
   ```

3. **Type-safe error narrowing**
   ```typescript
   try {
     await api.createUser(data);
   } catch (err) {
     // ❌ unsafe — err is unknown
     console.log(err.message);
     
     // ✅ narrowed
     if (err instanceof NotFoundError) {
       console.log(err.resource, err.id);
     } else if (err instanceof Error) {
       console.log(err.message);
     }
   }
   ```

4. **Exhaustive error handling with `Result<T, E>` discriminated union**

   Use this when you want to make errors part of the return type (no throw/catch required).

   ```typescript
   // Define once, reuse everywhere
   type Ok<T> = { ok: true; value: T };
   type Err<E> = { ok: false; error: E };
   type Result<T, E> = Ok<T> | Err<E>;

   // Helper constructors eliminate boilerplate
   const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
   const err = <E>(error: E): Err<E> => ({ ok: false, error });

   // Usage — no try/catch, caller is forced to handle the error case
   function divide(a: number, b: number): Result<number, string> {
     if (b === 0) return err('Division by zero');
     return ok(a / b);
   }

   const result = divide(10, 0);
   if (!result.ok) {
     console.error(result.error); // 'Division by zero'
   } else {
     console.log(result.value);   // number
   }
   ```

## Async/Await
1. **Always use async/await over raw Promises.**
2. **Use `Promise.all` for parallel operations.**
   ```typescript
   // ❌ Sequential
   const users = await getUsers();
   const posts = await getPosts();
   
   // ✅ Parallel
   const [users, posts] = await Promise.all([getUsers(), getPosts()]);
   ```
3. **Use `Promise.allSettled` when some can fail.**
4. **Avoid `.then().catch()` chains.**
5. **Abort long-running operations with AbortController**
   ```typescript
   const controller = new AbortController();
   const response = await fetch(url, { signal: controller.signal });
   // Cancel if needed
   controller.abort();
   ```

6. **Never use async callbacks in Array.forEach**
   ```typescript
   // ❌ forEach ignores returned promises — operations run detached
   items.forEach(async (item) => {
     await process(item);
   });
   
   // ✅ Use for...of for sequential
   for (const item of items) {
     await process(item);
   }
   
   // ✅ Use Promise.all for concurrent
   await Promise.all(items.map(item => process(item)));
   ```

7. **Handle timeouts with AbortSignal.timeout()**
   ```typescript
   const response = await fetch(url, {
     signal: AbortSignal.timeout(5000),
   });
   ```

## Runtime Validation at Boundaries
TypeScript types do not exist at runtime. Any data crossing an I/O boundary must be validated.
1. **Use Zod for all schema validation.**
   ```typescript
   import { z } from 'zod';
   
   const UserSchema = z.object({
     id: z.string().uuid(),
     name: z.string().min(2),
     age: z.number().int().nonnegative(),
   });
   
   type User = z.infer<typeof UserSchema>;
   
   function parseUser(data: unknown): User {
     return UserSchema.parse(data);
   }
   ```
> For advanced Zod patterns (transforms, discriminated unions, branded types, error formatting), see `references/zod-patterns.md`.

## Iteration and Collections
1. **Use `Map`/`Set` over plain objects for dynamic keys**
   ```typescript
   // ❌ Plain objects as maps — prototype pollution risk, string-only keys
   const cache: Record<string, User> = {};
   
   // ✅ Map — any key type, no prototype chain, O(1) has/get/set
   const cache = new Map<string, User>();
   ```

2. **Use `structuredClone()` for deep copies (not JSON round-trip)**
   ```typescript
   // ❌ Lossy — drops undefined, functions, Date objects, BigInt
   const copy = JSON.parse(JSON.stringify(original));
   
   // ✅ Handles circular refs, Date, RegExp, Map, Set, ArrayBuffer
   const copy = structuredClone(original);
   ```

3. **Prefer immutable array methods (ES2023+)**
   ```typescript
   // ❌ Mutates original array
   const sorted = arr.sort((a, b) => a - b);
   const reversed = arr.reverse();
   
   // ✅ Returns new array, original unchanged
   const sorted = arr.toSorted((a, b) => a - b);
   const reversed = arr.toReversed();
   const withReplacement = arr.with(2, 'new');
   ```

4. **Use `Object.groupBy()` for grouping (ES2024)**
5. **Use `Set` for O(1) lookups instead of Array.includes in loops**

## Centralized HTTP Client
Never use raw `fetch` spread throughout the codebase. Centralize it to handle tokens, retries, and errors.

> **Testability requirement:** Always define an interface first. The concrete class implements it.
> This lets tests inject a `FakeHttpClient` without network calls.

```typescript
// ✅ Define interface first — enables test doubles (architectural rule: I/O isolation)
export interface HttpClient {
  get<T>(path: string, schema: z.ZodType<T>): Promise<T>;
  post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T>;
  delete(path: string): Promise<void>;
}

// ✅ Production implementation
export class ApiClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    const data: unknown = await res.json();
    return schema.parse(data);
  }

  async post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    const data: unknown = await res.json();
    return schema.parse(data);
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
  }
}

// ✅ Test double — use in unit tests, no network required
export class FakeHttpClient implements HttpClient {
  readonly calls: { method: string; path: string }[] = [];
  private responses = new Map<string, unknown>();

  enqueue(path: string, response: unknown): void {
    this.responses.set(path, response);
  }

  async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    this.calls.push({ method: 'GET', path });
    return schema.parse(this.responses.get(path));
  }

  async post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    this.calls.push({ method: 'POST', path });
    return schema.parse(this.responses.get(path));
  }

  async delete(path: string): Promise<void> {
    this.calls.push({ method: 'DELETE', path });
  }
}
```

## Idiomatic Patterns

1. **Parameter object over positional arguments**
   ```typescript
   // ❌ Positional — error-prone, order-sensitive, boolean traps
   function createUser(name: string, email: string, isAdmin: boolean, isActive: boolean) {}

   // ✅ Named parameters — self-documenting, order-independent
   interface CreateUserParams {
     name: string;
     email: string;
     isAdmin: boolean;
     isActive: boolean;
   }
   function createUser(params: CreateUserParams) {}
   ```

2. **Branded/Opaque types for domain primitives** — see Type System Idioms §6. Never pass bare `string` or `number` for domain IDs.

3. **Discriminated unions over inheritance** — prefer union types with a `type` or `kind` discriminant over class hierarchies. Invalid states become compile errors.

4. **Parse, don't validate** — convert raw input into typed, validated domain objects at the boundary. Downstream code works with the typed form and never re-validates.
   ```typescript
   // ❌ Validate at every call site
   function processOrder(orderId: string) {
     if (!isValidUuid(orderId)) throw new Error('Invalid');
     // ...
   }

   // ✅ Parse at boundary, use branded type everywhere else
   const orderId = OrderIdSchema.parse(rawInput); // throws once at entry
   processOrder(orderId); // OrderId is always valid
   ```

5. **Early returns to reduce nesting** — use guard clauses instead of nested `if/else`.
   ```typescript
   // ❌ Deep nesting
   function handle(req: Request) {
     if (req.auth) {
       if (req.auth.isValid) {
         if (req.body) {
           return process(req.body);
         }
       }
     }
   }

   // ✅ Guard clauses
   function handle(req: Request) {
     if (!req.auth) return unauthorized();
     if (!req.auth.isValid) return forbidden();
     if (!req.body) return badRequest();
     return process(req.body);
   }
   ```

6. **Keep function complexity low (cyclomatic complexity < 10)**
   - Functions exceeding this threshold must be decomposed
   - Common signal: if explaining what a function does requires the word "and", split it

## Module and Export Patterns
1. **Avoid `export default`.** Use named exports for better refactoring and intellisense.
2. **Use barrel files (`index.ts`) sparingly.** They can cause circular dependencies.
3. **Use type-only imports.**
   ```typescript
   // ✅ Ensures type is erased at runtime
   import type { User } from './types';
   import { parseUser } from './parser';
   ```

## ESLint Suppression Policy

**NEVER suppress these rules — they signal structural problems that must be fixed:**

| Rule | What It Signals | What To Do Instead |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | Type safety disabled | Use `unknown` and narrow |
| `@typescript-eslint/no-floating-promises` | Unhandled async operation | Add `await` or `void` |
| `@typescript-eslint/no-unsafe-assignment` | Unsafe type flow | Type the source properly |
| `@typescript-eslint/no-unnecessary-condition` | Dead code or logic bug | Remove the condition |
| `complexity` | Function too complex | Decompose into smaller functions |

**Acceptable suppressions (with mandatory `// SUPPRESS:` comment):**

| Rule | When Acceptable |
|---|---|
| `@typescript-eslint/no-non-null-assertion` | After runtime validation proves non-null |
| `@typescript-eslint/ban-ts-comment` | `@ts-expect-error` with explanation (never `@ts-ignore`) |
| `no-console` | In CLI tools or development scripts |

**Rule of thumb:** If you're about to write `// eslint-disable`, stop and ask: "Am I suppressing a real design problem?" If yes, fix the design.

## Testing
1. **Use Vitest over Jest.** It's faster, ESM-native, and requires zero config for TS.
2. **AAA Pattern (Arrange, Act, Assert).**
3. **Test behavior, not implementation.**
4. **Test async errors by type, not message**
5. **Use `vi.spyOn` for interaction verification**
6. **Use `satisfies` for type-checked test fixtures**
   ```typescript
   const mockUser = { id: '1', name: 'Test' } satisfies Partial<User>;
   ```

7. **Test coverage is non-negotiable for new code:**
   - Every new exported function and class method MUST have at least one test
   - Every new branch (`if`/`else`, `switch` arm, error path) MUST be exercised
   - When modifying existing code, add tests for the modified paths if none exist
   - Never leave a function untested with the intent to "add tests later"
   - Use `@vitest/coverage-v8` to verify coverage locally before committing
   ```bash
   # Quick coverage check
   vitest run --coverage
   # Coverage with thresholds
   vitest run --coverage --coverage.thresholds.lines=80
   ```

8. **Test double selection — choose the right tool:**

   | Approach | When to Use |
   |---|---|
   | Hand-written fake (implement interface) | Simple interface, few methods, need stateful behavior |
   | `vi.fn()` / `vi.spyOn()` | Verify call counts, argument matching |
   | `msw` (Mock Service Worker) | HTTP boundary mocking — intercepts at network level |
   | Parameterized `it.each` / `test.each` | Same logic, multiple input/output pairs |
   | Snapshot (`expect().toMatchSnapshot()`) | Large outputs — JSON responses, CLI output |

   > **Prefer hand-written fakes** for repository interfaces — they are simpler to debug and don't couple tests to implementation details. Use `vi.fn()` when you genuinely need interaction verification.

## Feedback Loop — Development Workflow

> `tsc --noEmit` is the TypeScript equivalent of Rust's `cargo check` — type-checks without producing output. It is the fastest possible feedback during TDD cycles.

| Phase | Command | Purpose |
|---|---|---|
| TDD / rapid iteration | `tsc --noEmit` | Type-check only, no emit — fastest loop |
| Pre-commit | `eslint .` | Static analysis — must pass with **zero warnings** |
| Pre-commit | `prettier --write .` | Formatting — non-negotiable, always run |
| Pre-commit | `vitest run` | Unit tests — must all pass |
| Coverage verification | `vitest run --coverage` | Verify before merging |
| Unused dep audit | `knip` | Run before releases |

**Rules:**
- Never run a full `tsc` build during TDD cycles — `tsc --noEmit` is sufficient and significantly faster.
- `eslint .` must pass with **zero warnings** before any commit. Warnings are treated as errors.
- `prettier --write .` is non-negotiable — all code must be formatted before committing.
- If `knip` reports unused exports or dependencies, remove them before the release.

## Documentation

**Document all exported items:**
- Every exported function, class, type, and interface MUST have a JSDoc comment
- At minimum: one-line summary. For complex items: summary + `@param` + `@returns` + `@throws`
- Document the **why** for non-obvious design decisions, not the **what**

```typescript
// ❌ Undocumented exported function
export function parseUserToken(token: string): UserId { ... }

// ✅ Documented
/**
 * Parses and validates a signed user token, returning the extracted UserId.
 *
 * @param token - JWT signed token from the Authorization header
 * @returns Validated UserId branded type
 * @throws {InvalidTokenError} if the token is expired, malformed, or signature invalid
 */
export function parseUserToken(token: string): UserId { ... }
```

## Dependency Management

1. **Minimize dependency count** — each dependency is an attack surface and bundle-size cost
2. **Audit regularly** — run `npm audit` or `pnpm audit` in CI
3. **Pin major versions** in `package.json` with `^` for libraries (`^3.0.0`)
4. **Always commit the lockfile** (`package-lock.json` or `pnpm-lock.yaml`) — for both apps and libraries
5. **Check for unused dependencies** with `knip` before releases
6. **Prefer native APIs** over packages when the native alternative is stable:
   - `crypto.randomUUID()` over `uuid` package
   - `structuredClone()` over lodash deep clone
   - `Array.toSorted()` over lodash sort
   - `Object.groupBy()` over lodash groupBy
7. **Never import entire utility libraries** when only one function is needed — use subpath imports or native alternatives

> For the full curated dependency list with versions, see `references/recommended-dependencies.md`.

## Configuration and Environment
1. **Never scatter `process.env` calls throughout the codebase**
   ```typescript
   // ❌ Scattered, typo-prone, no validation
   const port = process.env.PORT || '3000';
   const dbUrl = process.env.DATABASE_URL;
   
   // ✅ Centralized, validated at startup
   import { z } from 'zod';
   const EnvSchema = z.object({
     PORT: z.coerce.number().default(3000),
     DATABASE_URL: z.string().url(),
     NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
   });
   export const env = EnvSchema.parse(process.env);
   ```

2. **Fail fast on missing required config at boot, not at first use**

## Safety, Security, and Performance
> For type coercion traps, prototype pollution, scope bugs, security vulnerabilities, collection pitfalls, and performance invariants, see `references/ts-patterns-and-anti-patterns.md`. Load it before writing any code handling user input, async operations, or I/O.
>
> For performance patterns, see `perf-optimization` skill.

## Related
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Security Principles @.agents/rules/security-principles.md
- Architectural Patterns — Testability-First Design @.agents/rules/architectural-pattern.md
- Concurrency and Threading Principles @.agents/rules/concurrency-and-threading-principles.md
- Core Design Principles @.agents/rules/core-design-principles.md
- Performance Optimization Principles @.agents/rules/performance-optimization-principles.md
- Resource and Memory Management Principles @.agents/rules/resources-and-memory-management-principles.md
- Security Mandate @.agents/rules/security-mandate.md
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Logging and Observability Mandate @.agents/rules/logging-and-observability-mandate.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
- Logging Implementation @.agents/skills/logging-implementation/SKILL.md
- Vue Idioms @.agents/skills/vue-idioms/SKILL.md
- React Idioms @.agents/skills/react-idioms/SKILL.md
- Hono Idioms @.agents/skills/hono-idioms/SKILL.md
- Next.js Idioms @.agents/skills/nextjs-idioms/SKILL.md
- Angular Idioms @.agents/skills/angular-idioms/SKILL.md
- Testability Patterns @.agents/skills/testability-patterns/SKILL.md
