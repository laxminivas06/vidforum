---
name: TypeScript Patterns, Safety Invariants, and Anti-Patterns
description: Type coercion traps, async pitfalls, prototype bugs, security vulnerabilities, collection best practices, performance invariants, and resilience patterns for TypeScript/JavaScript. Load before writing any code that handles user input, async operations, or I/O.
---

# TypeScript/JavaScript Patterns, Safety Invariants, and Anti-Patterns

This reference document outlines type coercion traps, async pitfalls, scope and closure bugs, security vulnerabilities, collection best practices, and performance optimizations for TypeScript/JavaScript development.

## Section Index

> Load this file **before** writing code that handles user input, async operations, or I/O.
> Use this index to jump directly to the relevant section.

| Section | What It Covers |
|---|---|
| [1. Type Safety and Coercion Pitfalls](#1-type-safety-and-coercion-pitfalls) | `===`, `NaN`, `null`, parseInt radix, array truthy traps |
| [2. Async and Promise Anti-Patterns](#2-async-and-promise-anti-patterns) | Floating promises, forEach async, return-await, race conditions |
| [3. Scope, Hoisting, and Closure Bugs](#3-scope-hoisting-and-closure-bugs) | `var`, closure over loop var, `this` binding, switch scoping |
| [4. Object and Prototype Pitfalls](#4-object-and-prototype-pitfalls) | `Object.keys`, shallow copy, `for...in`, prototype pollution |
| [5. Security Vulnerabilities](#5-security-vulnerabilities) | XSS, ReDoS, SQL injection, SSRF, timing attacks, path traversal |
| [6. Collection and Iteration Best Practices](#6-collection-and-iteration-best-practices) | `Map`/`Set`, `structuredClone`, immutable methods, `for...of` |
| [7. Performance Invariants](#7-performance-invariants) | Quick-reference table of anti-pattern → recommended alternative |
| [8. Resilience Patterns](#8-resilience-patterns-timeout-retry-circuit-breaker) | Timeout, retry with backoff, circuit breaker, idempotency |

> For ESLint suppression policy (which rules must never be disabled), see `../SKILL.md` §ESLint Suppression Policy.

---

## 1. Type Safety and Coercion Pitfalls

### Always Use Strict Equality (`===` and `!==`)
Loose equality operators (`==` and `!=`) perform implicit type coercion via the Abstract Equality Comparison algorithm, producing counter-intuitive results.
- **Anti-Pattern**: `if (userRole == false)` — matches `0`, `""`, `[]`, `false`
- **Recommended**: `if (userRole === false)`

❌ **Bad:**
```typescript
if (value == 0) {
    // Executes for "", false, 0, []
}
```

✅ **Good:**
```typescript
if (value === 0) {
    // Only executes for the number 0
}
```

### Use `Number.isNaN()` Instead of Global `isNaN()`
Global `isNaN()` coerces its argument to a number first. `Number.isNaN()` only returns true for actual NaN values.
- **Anti-Pattern**: `isNaN('hello')` returns true (coerces string to NaN)
- **Recommended**: `Number.isNaN(value)`

❌ **Bad:**
```typescript
if (isNaN('invalid_number')) {
    // This runs, but 'invalid_number' is a string, not NaN
}
```

✅ **Good:**
```typescript
if (Number.isNaN(value)) {
    // Only runs if value is strictly the IEEE 754 NaN value
}
```

### Always Specify Radix in `parseInt()`
Without a radix, `parseInt` may interpret strings with leading zeros as octal.
- **Anti-Pattern**: `parseInt('08')` → unreliable
- **Recommended**: `parseInt('08', 10)`

❌ **Bad:**
```typescript
const count = parseInt(inputString); // Might be parsed as octal in older environments
```

✅ **Good:**
```typescript
const count = parseInt(inputString, 10);
```

### Beware `typeof null === 'object'`
JavaScript's `typeof` operator returns `'object'` for `null` — a historical bug.
- **Recommended**: Use strict null checks with `value === null`

❌ **Bad:**
```typescript
if (typeof value === 'object') {
    // Fails because value could be null
    console.log(value.name); // Throws TypeError if value is null
}
```

✅ **Good:**
```typescript
if (typeof value === 'object' && value !== null) {
    console.log(value.name);
}
```

### Array Method Callbacks with Implicit Coercion
`['1','2','3'].map(parseInt)` results in `[1, NaN, NaN]` because `map` passes `(element, index, array)` to `parseInt`, which uses the index as the radix.
- **Recommended**: `['1','2','3'].map(Number)` or explicit callback

❌ **Bad:**
```typescript
const numbers = ['1', '2', '3'].map(parseInt); // [1, NaN, NaN]
```

✅ **Good:**
```typescript
const numbers = ['1', '2', '3'].map(str => parseInt(str, 10)); // [1, 2, 3]
```

### Avoid Loose Boolean Checks on Arrays and Objects
Empty arrays `[]` and empty objects `{}` are truthy. Checking `if (arr)` when you mean `if (arr.length > 0)` is a common bug.

❌ **Bad:**
```typescript
if (items) {
    // Executes even if items is []
    renderList(items);
}
```

✅ **Good:**
```typescript
if (items.length > 0) {
    renderList(items);
}
```

### Throw Error Instances, Never Primitives
Throwing strings or plain objects loses the stack trace and breaks `instanceof Error` checks.

❌ **Bad:**
```typescript
throw "Failed to fetch user"; // Stack trace is lost
```

✅ **Good:**
```typescript
throw new Error("Failed to fetch user");
```

### Use `Array.isArray()` Instead of `instanceof Array`
`instanceof` fails across different JavaScript realms (iframes, worker contexts).

❌ **Bad:**
```typescript
if (data instanceof Array) {
    // Fails if data comes from another iframe
}
```

✅ **Good:**
```typescript
if (Array.isArray(data)) {
    // Works reliably across realms
}
```

## 2. Async and Promise Anti-Patterns

### Never Use Floating Promises
A promise that is neither awaited nor caught runs detached from the control flow. Errors become unhandled rejections.

❌ **Bad:**
```typescript
db.users.update(user); // Fire and forget, errors are lost
```

✅ **Good:**
```typescript
await db.users.update(user);
```

### Async Callbacks in Array.forEach Are Silently Broken
`forEach` ignores returned promises. All iterations execute concurrently with no synchronization.

❌ **Bad:**
```typescript
items.forEach(async item => {
    await process(item); // Loops finish instantly, promises run detached
});
```

✅ **Good:**
```typescript
for (const item of items) {
    await process(item); // Sequential execution
}
// OR for parallel:
await Promise.all(items.map(item => process(item)));
```

### Return Await Inside Try-Catch
Returning a promise without `await` inside a try-catch bypasses the catch block entirely.

❌ **Bad:**
```typescript
try {
    return api.get(url); // Catch never fires if promise rejects
} catch (e) {
    handleError(e);
}
```

✅ **Good:**
```typescript
try {
    return await api.get(url);
} catch (e) {
    handleError(e);
}
```

### Promise Constructor Anti-Pattern
Wrapping an existing promise in a new `Promise` constructor is redundant and hides errors.

❌ **Bad:**
```typescript
function getData() {
    return new Promise((resolve, reject) => {
        fetch(url).then(resolve).catch(reject);
    });
}
```

✅ **Good:**
```typescript
function getData() {
    return fetch(url);
}
```

### Race Conditions with await in Loops vs Promise.all
Sequential await in loops when operations are independent causes unnecessary waterfall latency.

❌ **Bad:**
```typescript
const user = await getUser();
const settings = await getSettings(); // Waits for user to finish needlessly
```

✅ **Good:**
```typescript
const [user, settings] = await Promise.all([getUser(), getSettings()]);
```

> For ESLint rules that enforce these patterns (`no-floating-promises`, `no-misused-promises`), see `../SKILL.md` §ESLint Suppression Policy.

### Unhandled Rejection — Global Handler is Mandatory
In Node.js, unhandled promise rejections will terminate the process. Always register a global handler.

✅ **Good:**
```typescript
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Determine if process should exit
});
```

### Async Constructors Are Impossible
Constructors are synchronous. Starting async work in a constructor yields an incomplete instance.

❌ **Bad:**
```typescript
class Database {
    constructor() {
        this.init(); // Async, completes later
    }
    async init() { await connect(); }
}
```

✅ **Good:**
```typescript
class Database {
    private constructor() {} // Prevent direct instantiation
    
    static async create(): Promise<Database> {
        const db = new Database();
        await connect();
        return db;
    }
}
```

## 3. Scope, Hoisting, and Closure Bugs

### Never Use `var` — Always `const` or `let`
`var` is function-scoped and hoisted, causing variable leaking outside blocks.

❌ **Bad:**
```typescript
if (condition) {
    var x = 10;
}
console.log(x); // 10 (Leaks outside block)
```

✅ **Good:**
```typescript
if (condition) {
    const x = 10;
}
```

### Closure Over Mutable Loop Variables
`var` in for-loops shares a single binding across all iterations.

❌ **Bad:**
```typescript
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100); // Prints 3, 3, 3
}
```

✅ **Good:**
```typescript
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100); // Prints 0, 1, 2
}
```

### Implicit Global Variables from Missing Declarations
In non-strict mode, assigning to an undeclared variable creates a global.

❌ **Bad:**
```typescript
function init() {
    config = {}; // Creates window.config
}
```

✅ **Good:**
```typescript
function init() {
    const config = {};
}
```

### Variable Shadowing Creates Ambiguity
Inner scope variables with the same name as outer variables obscure intent.

❌ **Bad:**
```typescript
const id = 1;
function process(id: number) {
    // Difficult to tell which id is intended
    console.log(id); 
}
```

✅ **Good:**
```typescript
const globalId = 1;
function process(localId: number) {
    console.log(localId);
}
```

### `this` Binding in Callbacks — Arrow vs Regular Functions
Passing class methods as callbacks detaches `this` context.

❌ **Bad:**
```typescript
class Manager {
    total = 0;
    add(price: number) { this.total += price; }
}
const m = new Manager();
[1, 2, 3].forEach(m.add); // TypeError: Cannot read properties of undefined (reading 'total')
```

✅ **Good:**
```typescript
[1, 2, 3].forEach(price => m.add(price));
// OR bind: [1, 2, 3].forEach(m.add.bind(m));
```

### Switch Statement Variable Leaks Without Block Scoping
Variables declared in case clauses without braces leak to other cases.

❌ **Bad:**
```typescript
switch (type) {
    case 'a': 
        const x = 1; 
        break; 
    case 'b': 
        const x = 2; // SyntaxError: Identifier 'x' has already been declared
        break;
}
```

✅ **Good:**
```typescript
switch (type) {
    case 'a': {
        const x = 1; 
        break; 
    }
    case 'b': {
        const x = 2;
        break;
    }
}
```

## 4. Object and Prototype Pitfalls

### `Object.keys()` Returns `string[]`, Not `keyof T`
TypeScript deliberately returns `string[]` because objects can have more keys at runtime than the type declares.

❌ **Bad:**
```typescript
const obj: { a: number } = { a: 1 };
Object.keys(obj).forEach(key => {
    // Type error: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ a: number; }'
    console.log(obj[key]); 
});
```

✅ **Good:**
```typescript
Object.keys(obj).forEach(key => {
    console.log(obj[key as keyof typeof obj]);
});
// Better:
Object.entries(obj).forEach(([key, value]) => {
    console.log(value);
});
```

### Shallow Copy with Spread — Nested Mutation
Spread operator creates a shallow copy. Nested objects remain shared references.

❌ **Bad:**
```typescript
const a = { inner: { value: 1 } };
const b = { ...a };
b.inner.value = 2; 
console.log(a.inner.value); // 2 (Mutated original)
```

✅ **Good:**
```typescript
const b = structuredClone(a);
```

### `JSON.parse`/`JSON.stringify` Round-Trip is Lossy
Drops `undefined`, functions, `Symbol`, `BigInt`. Converts `Date` to string. Throws on circular references.

❌ **Bad:**
```typescript
const clone = JSON.parse(JSON.stringify(data));
```

✅ **Good:**
```typescript
const clone = structuredClone(data);
```

### `for...in` Iterates the Prototype Chain
`for...in` includes inherited enumerable properties, not just own properties.

❌ **Bad:**
```typescript
for (const key in obj) {
    console.log(obj[key]); // Might log prototype properties
}
```

✅ **Good:**
```typescript
for (const key of Object.keys(obj)) {
    console.log(obj[key]);
}
```

### `Object.freeze()` is Shallow
Nested objects inside a frozen object remain mutable.

❌ **Bad:**
```typescript
const obj = Object.freeze({ inner: { val: 1 } });
obj.inner.val = 2; // Mutates fine!
```

✅ **Good:**
```typescript
// Use a deep freeze utility or immutable data structures
```

### Prototype Pollution via `__proto__`
Unsafe deep merge functions that don't filter `__proto__`, `constructor`, or `prototype` keys allow attackers to inject properties onto `Object.prototype`.

❌ **Bad:**
```typescript
function unsafeMerge(target: any, source: any) {
    for (const key in source) {
        if (typeof source[key] === 'object') {
            if (!target[key]) target[key] = {};
            unsafeMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
}
```

✅ **Good:**
```typescript
function safeMerge(target: any, source: any) {
    for (const key in source) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key]) target[key] = {};
            safeMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
}
```

### Direct `hasOwnProperty` Calls — Prototype Override Risk
Objects can override `hasOwnProperty`.

❌ **Bad:**
```typescript
if (obj.hasOwnProperty('key')) { ... }
```

✅ **Good:**
```typescript
if (Object.hasOwn(obj, 'key')) { ... }
```

## 5. Security Vulnerabilities

### Never Use `eval()` or `Function()` Constructor
Dynamic code execution enables Remote Code Execution and prevents engine optimization.

❌ **Bad:**
```typescript
eval(userInput);
setTimeout('console.log("hello")', 100);
```

✅ **Good:**
```typescript
// Implement safe parsers or evaluate via isolated sandboxes
setTimeout(() => console.log("hello"), 100);
```

### Prevent XSS — Use `textContent`, Never `innerHTML`
Direct HTML injection from user input enables script execution.

❌ **Bad:**
```typescript
element.innerHTML = userInput; // XSS vulnerability
```

✅ **Good:**
```typescript
element.textContent = userInput;
```

### Prototype Pollution via Unsafe Deep Merge
If an attacker sends `{ "__proto__": { "isAdmin": true } }`, an unsafe deep merge will make `isAdmin: true` accessible on every object in the system.

### Regular Expression Denial of Service (ReDoS)
Nested quantifiers with overlapping patterns cause catastrophic backtracking O(2^N).

❌ **Bad:**
```typescript
const regex = /(a+)+$/; // ReDoS
```

✅ **Good:**
```typescript
const regex = /^a+$/u; // Anchored, no nesting, Unicode flag
```

### Cryptographically Insecure Randomness
`Math.random()` uses a PRNG with predictable state.

❌ **Bad:**
```typescript
const token = Math.random().toString(36).substring(2);
```

✅ **Good:**
```typescript
const token = crypto.randomUUID(); // Node.js and Browser
```

### Timing Attacks in String Comparison
`===` returns early on first mismatch, leaking information via timing.

❌ **Bad:**
```typescript
if (providedSignature === expectedSignature) { ... }
```

✅ **Good:**
```typescript
if (crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) { ... }
```

### SQL/NoSQL Injection via String Interpolation
Template literals or concatenation in queries enable injection.

❌ **Bad:**
```typescript
db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

✅ **Good:**
```typescript
db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### Path Traversal in File System Operations
Unsanitized user paths with `../` escape the intended directory.

❌ **Bad:**
```typescript
fs.readFile(`/var/www/images/${userInput}`);
```

✅ **Good:**
```typescript
const safePath = path.resolve('/var/www/images', userInput);
if (!safePath.startsWith('/var/www/images/')) {
    throw new Error('Invalid path');
}
```

### Server-Side Request Forgery (SSRF)
Unsanitized URL fetch enables access to internal cloud metadata.

❌ **Bad:**
```typescript
fetch(userProvidedUrl);
```

✅ **Good:**
```typescript
// Validate against an allowlist of domains before fetching
```

### Missing Cookie Security Attributes
`HttpOnly`, `Secure`, `SameSite` are mandatory for session cookies.

✅ **Good:**
```typescript
res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
});
```

### Node.js Buffer Memory Disclosure
`new Buffer(size)` allocates uninitialized memory containing previous process data.

❌ **Bad:**
```typescript
const buf = new Buffer(100);
```

✅ **Good:**
```typescript
const buf = Buffer.alloc(100); // zero-filled
```

## 6. Collection and Iteration Best Practices

### Use `Map`/`Set` for Dynamic Key Collections
Use `Map` when keys are dynamic or not strings. Objects should be used for records with known fields.

### Use `Array.isArray()` for Cross-Realm Array Detection
Always prefer `Array.isArray` over `instanceof Array`.

### Use `structuredClone()` Instead of JSON Round-Trip
It's native and retains complex objects like `Date` or `Set`.

### Prefer Immutable Array Methods (ES2023+)
Use `.toSorted()`, `.toReversed()`, `.with()` to avoid mutating original arrays.

### Use `Object.groupBy()` / `Map.groupBy()` (ES2024)
Native grouping instead of using `.reduce()`.

### Prefer `Set.has()` Over `Array.includes()` in Loops
O(1) lookup in Sets vs O(N) lookup in Arrays.

### Avoid `.sort()` Mutation — Use `.toSorted()`

### Use `for...of` Instead of `for...in` for Arrays
Arrays are iterables, `for...of` gets values, `for...in` gets keys (as strings) and includes prototype chain.

## 7. Performance Invariants

| Anti-Pattern | Recommended Alternative | Rationale |
|---|---|---|
| `arr.indexOf(x) !== -1` | `arr.includes(x)` | Clearer intent, handles NaN |
| `JSON.parse(JSON.stringify(obj))` | `structuredClone(obj)` | No lossy conversion |
| `delete obj.key` | `const { key, ...rest } = obj` | `delete` deoptimizes V8 hidden classes |
| `arr.filter(p)[0]` | `arr.find(p)` | Short-circuits on first match |
| `[...arr].sort()` | `arr.toSorted()` | No intermediate copy (ES2023) |
| String concatenation in loop | `Array.join()` | Avoids repeated allocation |
| `arguments` object | Rest parameters `...args` | Proper array, no deoptimization |
| `Array.includes()` in O(N) loop | `Set.has()` | O(1) lookup vs O(N) |
| Inline arrow fn in JSX props | Extract or `useCallback` | Prevents child re-renders |
| `for...in` on arrays | `for...of` or `.forEach()` | Iterates string keys + prototype |
| Import full lodash | Subpath import `lodash/get` | Tree-shaking enabled |
| Sequential await in loop | `Promise.all()` | Parallel execution |

## 8. Resilience Patterns (Timeout, Retry, Circuit Breaker)

> These are **architectural patterns**, not anti-patterns. They belong here for discoverability alongside async pitfalls.
> For the full resilience dependency list (`p-retry`, `opossum`, `bottleneck`), see `references/recommended-dependencies.md` §Resilience & Networking.

### Timeout with AbortController
```typescript
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}
```

### Retry with Exponential Backoff
Generic implementation — not library-specific
```typescript
async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) throw error;
            const backoff = Math.pow(2, attempt) * 100;
            await new Promise(r => setTimeout(r, backoff));
        }
    }
    throw new Error('Unreachable');
}
```

### Circuit Breaker Pattern
Simple state machine implementation
```typescript
class CircuitBreaker {
    private failures = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private nextAttempt = Date.now();

    constructor(private threshold = 3, private resetTimeout = 5000) {}

    async execute<T>(action: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextAttempt) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit Breaker OPEN');
            }
        }

        try {
            const result = await action();
            this.reset();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    private recordFailure() {
        this.failures++;
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.resetTimeout;
        }
    }

    private reset() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
}
```

### Idempotency Requirement
Never retry non-idempotent operations (POST) without an idempotency key.

### When to Retry vs When to Circuit-Break

| Signal | Action |
|---|---|
| Transient error (timeout, 503) | Retry with backoff |
| Persistent error (401, 404, validation) | Do NOT retry |
| Multiple consecutive failures | Circuit breaker trips |
| Non-idempotent request (POST without idempotency key) | Do NOT retry |
