---
name: javascript-idioms
description: >-
  Modern JavaScript (ES2024+) idioms: ESM, CJS interoperability, async/await, and runtime safety in projects without TypeScript. Use only when working in pure JavaScript environments; for TypeScript load typescript-idioms.
---

## JavaScript Idioms and Patterns

Modern JavaScript (ES2024+) rewards modules, async/await, and functional patterns. Idiomatic JS = strict mode, modular, well-tested.

> **Scope:** Plain JavaScript only — projects with **no `tsconfig.json`**. This skill is intentionally thin: most JS guidance (coercion traps, async pitfalls, scope bugs, security, collections, performance) is shared with TypeScript and lives in **one place** to avoid divergence.
>
> **Loading guards:**
> - **If `tsconfig.json` exists, do NOT load this skill** — load `@.agents/skills/typescript-idioms/SKILL.md` instead. TypeScript is preferred whenever available.
> - **Coercion / async / scope / security / collection / performance pitfalls:** see `@.agents/skills/typescript-idioms/references/ts-patterns-and-anti-patterns.md` — despite the filename, it is scoped to "TypeScript/JavaScript" and covers runtime pitfalls that apply to plain JS verbatim.
> - **Project layout:** see `@.agents/skills/typescript-idioms/references/project-structure.md` (the generic backend/library/monorepo layouts are language-level, not TS-only).

### Module System

1. **ES modules over CommonJS for all new code:**
   ```javascript
   // ✅ ESM
   import { createTask } from './task-service.js';
   export function handler(req, res) { ... }

   // ❌ CommonJS (legacy only)
   const { createTask } = require('./task-service');
   ```
2. **Always use `.js` extensions in ESM relative imports** — Node.js ESM requires them; bundlers accept them.
3. **`package.json` `"type": "module"`** to enable ESM by default; use `.cjs` for any CommonJS holdouts.
4. **CJS/ESM interop** — `import default from './cjs.cjs'` works; named exports from CJS are not statically analyzable, prefer `module.exports = { named }` + `const { named } = require(...)` or migrate to ESM.

### Declarations and Strict Mode

1. **`const` by default, `let` when reassignment needed, never `var`.** (`var` hoisting/closure bugs: see `ts-patterns-and-anti-patterns.md` §3.)
2. **Enable strict mode** — `'use strict';` at file top in scripts. Strict mode is implicit in ESM modules (`"type": "module"` in `package.json`) and class bodies.
3. **Optional chaining and nullish coalescing** (prefer `??` over `||` to avoid `0`/`''` falsy traps):
   ```javascript
   const title = task?.title ?? 'Untitled';
   const count = config?.scoring?.default ?? 0;
   ```
4. **Destructuring with defaults** for clean parameter handling:
   ```javascript
   function createTask({ title, priority = 'medium', tags = [] }) { ... }
   ```

### Runtime Without Types

Since there is no compiler to catch mistakes, lean harder on:
1. **Runtime validation at boundaries** — use Zod (works in plain JS) or `ajv` to validate external input. Don't trust unvalidated I/O.
2. **Defensive narrowing** — `typeof`, `Array.isArray()`, `Object.hasOwn()` checks before property access. (Coercion traps: see `ts-patterns-and-anti-patterns.md` §1.)
3. **JSDoc for public APIs** — `@param`, `@returns`, `@throws` give editors and tools type hints without a TS toolchain.
4. **`structuredClone()`** for deep copies (not `JSON.parse(JSON.stringify()))` — lossy and throws on cycles).

### Error Handling

> For universal error handling principles, see `@.agents/rules/error-handling-principles.md`. Below: JS-specific only.

1. **Domain error classes** (never throw primitives — loses stack trace):
   ```javascript
   class DomainError extends Error {
       constructor(message) { super(message); this.name = this.constructor.name; }
   }
   class NotFoundError extends DomainError {
       constructor(resource, id) {
           super(`${resource} '${id}' not found`);
           this.resource = resource;
           this.resourceId = id;
       }
   }
   ```
2. **Never `catch` without handling.** Empty catch blocks are forbidden.
3. **Always handle promise rejections** — never floating/unhandled (see `ts-patterns-and-anti-patterns.md` §2 for the full async pitfall catalog).

### Naming

1. **camelCase** for functions, variables. **PascalCase** for classes.
2. **UPPER_SNAKE_CASE** for constants.
3. **Prefix booleans**: `isActive`, `hasPermission`, `canEdit`.

### Testing

**Vitest** (preferred — ESM-native, zero-config) or Jest. Testing Library for DOM. (TypeScript skill mandates Vitest; in plain JS either is acceptable but Vitest is recommended.)

### Toolchain and Formatting

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint | Linting | `npx eslint .` |
| `npm audit` / `pnpm audit` | CVE scanning | `npm audit` |

> **Default package manager: `pnpm`** (matches the TypeScript skill). Use `npm` only if the project already has a `package-lock.json`.

### Related
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md (load this instead if tsconfig.json exists)
- TS/JS Patterns & Anti-Patterns @.agents/skills/typescript-idioms/references/ts-patterns-and-anti-patterns.md (shared coercion/async/scope/security pitfalls)
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
