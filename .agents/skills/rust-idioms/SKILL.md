---
name: rust-idioms
description: >-
  Rust idioms: ownership and borrow checker patterns, error handling with thiserror/anyhow, Tokio async concurrency, lifetime management, and Clippy pedantic compliance. Use when writing, optimizing, or reviewing Rust crates.
---

## Rust Idioms and Patterns

### Core Philosophy

Rust's type system and ownership model are your primary tools for correctness. Lean into the compiler — it is your strongest ally. Write code that is idiomatic, safe, and expressive.

> **Scope:** This file covers Rust-specific *coding idioms*. For file layout, see `references/project-structure.md` (in this skill). For detailed safety, SAST security invariants, and performance anti-patterns, see `references/rust-patterns-and-anti-patterns.md` (in this skill). For Rust test naming and conventions, see §Testing below; for universal testing principles, see `@.agents/rules/testing-strategy.md`. For logging library choice and setup, see `@.agents/skills/logging-implementation/SKILL.md`.

### Toolchain and Minimum Supported Rust Version

> **Default to the latest stable Rust.** As of July 2026, this is Rust **1.97**. All guidance in this skill assumes latest stable features. When creating new projects, set `rust-version` in `Cargo.toml` to prevent builds on outdated toolchains.

```toml
[package]
edition = "2024"
rust-version = "1.97"
```

**Key version milestones that affect this skill:**
- **1.75+** — Native `async fn` in traits (no `async_trait` crate needed for static dispatch). This milestone is the **single source of truth** for the `async-trait` crate policy:
  - **Prefer static dispatch** — `impl MyTrait` return params or generic `T: MyTrait` bounds use native `async fn` in traits; no crate required and zero dispatch overhead.
  - **Use the `async-trait` crate only when** dynamic dispatch via `dyn Trait` is explicitly required — e.g. `Box<dyn MyTrait>`, `Arc<dyn MyTrait>` for runtime polymorphism, object-safe trait objects, or storing heterogeneous trait impls in a collection.
  - **Never add `async-trait` as a default dependency** just for ergonomics — it adds a heap allocation and dynamic dispatch cost. Add it only for the specific crates/traits that need `dyn` dispatch.
- **1.74+** — Workspace lint inheritance (`[workspace.lints]`)
- **1.63+** — `Mutex::new()` in `const` context (no `OnceCell` wrapper needed)

> For recommended crate versions and starter `Cargo.toml`, see `references/recommended-dependencies.md`.

### Ownership and Borrowing

1. **Prefer borrowing (`&T`, `&mut T`) over cloning**
   - Never `.clone()` to silence the borrow checker without a `// CLONE:` comment explaining why
   - Use `Cow<'_, T>` when a function may or may not need ownership
   - Prefer `&str` over `String` in function parameters, `&[T]` over `Vec<T>`

2. **Minimize owned data in structs**
   - Use references with explicit lifetimes when the struct is short-lived
   - Use owned types (`String`, `Vec<T>`) when the struct must outlive its inputs

3. **Avoid unnecessary `Arc<Mutex<T>>`**
   - If data flows one direction, use channels (`tokio::sync::mpsc`)
   - If data is read-heavy, consider `RwLock` over `Mutex`
   - If data is immutable after init, use `Arc<T>` without a lock

4. **Respect the `Copy` / `Clone` boundary:**
   - Never call `.clone()` on types that implement `Copy` (e.g., `i32`, `f64`, `bool`, `char`, `usize`, `Option<CopyType>`)
   - Copy types are implicitly copied on assignment — `.clone()` is misleading and suggests heap allocation
   - When unsure, check: `Copy` = bitwise copy (stack only); `Clone` = potentially expensive deep copy

   ```rust
   // ❌ Misleading — usize implements Copy
   let count = other_count.clone();

   // ✅ Implicit copy — clear and correct
   let count = other_count;
   ```

### Error Handling

1. **Use the `?` operator for propagation — never `unwrap()` in production code**
   - `unwrap()` and `expect()` are acceptable only in:
     - Tests (`#[test]`, `#[tokio::test]`)
     - Infallible operations where the invariant is proven (document with `// SAFETY:` comment)
     - CLI `main()` function with clear error messages via `expect("reason")`

2. **Choose error crates by context:**

   | Context | Crate | Reason |
   |---|---|---|
   | Library crates | `thiserror` | Typed, matchable errors. Callers need to handle specific variants. |
   | Web service HTTP errors | `thiserror` | `AppError` enum must implement `IntoResponse` — typed variants required. |
   | Service/domain layer errors | `thiserror` | Domain errors need structured variants for logging and client responses. |
   | Application glue / scripts / CLI | `anyhow` | Error type doesn't matter; ergonomic propagation is all you need. |

   > **Web service rule:** Use `thiserror` for `AppError` (HTTP handler errors) and domain errors. `anyhow::Error` does NOT implement `IntoResponse` and cannot be returned from Axum handlers. Use `anyhow` only in non-HTTP utility code (scripts, migration runners, CLI entrypoints) where errors are printed, not sent over the wire.
   >
   > The idiomatic pattern is `thiserror` for typed variants + `#[from] anyhow::Error` as the catch-all `Internal` variant in `AppError`. See `axum-idioms/SKILL.md` §Error Handling for the complete pattern.
   >
   > **Never** add `anyhow` as a dependency to library crates — it leaks a concrete error type into your public API.

3. **Error type design:**

```rust
// ✅ Good — typed, matchable errors
#[derive(Debug, thiserror::Error)]
pub enum PathfinderError {
    #[error("file not found: {path}")]
    FileNotFound { path: PathBuf },
    #[error("AST parse failed: {0}")]
    ParseError(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// ❌ Bad — stringly-typed, unmatchable
fn do_thing() -> Result<(), String> { ... }

// ✅ Use #[must_use] on functions returning non-Result types that callers must handle
#[must_use]
pub fn compute_checksum(data: &[u8]) -> u64 { ... }

// ℹ️ Result<T, E> already has #[must_use] in std — adding it to Result-returning
// functions is redundant. The compiler warns on unused Result values automatically.
pub fn create_task(req: CreateTaskRequest) -> Result<Task, TaskError> { ... }
```

4. **Use lazy evaluation for fallback values:**
   - `unwrap_or_else(|| expr)` instead of `unwrap_or(expr)` when the fallback involves a function call
   - `expect` messages should be string literals, not `format!()` calls
   - `map_or_else` instead of `map_or` when either branch involves computation

   ```rust
   // ❌ Eager — default_value() is called even when result is Ok
   let val = result.unwrap_or(default_value());
   let msg = result.expect(&format!("failed for {id}"));

   // ✅ Lazy — default_value() only called when needed
   let val = result.unwrap_or_else(|_| default_value());
   let msg = result.unwrap_or_else(|e| panic!("failed for {id}: {e}"));
   ```

### Async and Concurrency

1. **Use `tokio` as the async runtime**
   - Mark async entry points with `#[tokio::main]` or `#[tokio::test]`
   - Prefer `tokio::spawn` for concurrent tasks, not `std::thread::spawn`
   - Use `tokio::select!` for racing futures, not manual polling

2. **Cancellation safety:**
   - Prefer `tokio::sync::mpsc` over `tokio::sync::broadcast` unless fan-out is needed
   - Document cancellation behavior on any `async fn` that holds resources across `.await`
   - Use `tokio_util::sync::CancellationToken` for graceful shutdown

3. **Blocking operations:**
   - Never call blocking I/O inside async context
   - Use `tokio::task::spawn_blocking` for CPU-heavy or blocking work
   - Use `tokio::fs` instead of `std::fs` inside async functions

4. **Use `tracing` instead of `log`** for all structured diagnostics in async applications:
   - `tracing` is span-aware — log entries inherit context from parent spans (correlation IDs, request metadata)
   - `log` is fire-and-forget with no span concept — unsuitable for async where context flows across `.await` boundaries
   - Use `#[tracing::instrument]` on async functions to automatically create spans with function arguments
   - See `@.agents/skills/logging-implementation/SKILL.md` §Rust for the full setup

### Unsafe Code

1. **Zero `unsafe` blocks unless in FFI boundaries**
   - Tree-sitter C bindings and similar FFI are the only valid use case
   - Every `unsafe` block must have a `// SAFETY:` comment explaining the invariant

2. **Minimize unsafe surface area:**
   - Encapsulate `unsafe` in a safe wrapper function
   - The wrapper's public API must be safe to call from any context
   - Write tests that exercise the boundary conditions of `unsafe` wrappers

3. **Never use `unsafe` to bypass the borrow checker** — restructure the code instead

### Lifetimes and Generics

1. **Prefer `'_` lifetime elision when possible**
   - Only introduce named lifetimes when the compiler requires them or when they clarify intent
   - Use `'a` for single lifetime parameters, descriptive names (`'input`, `'query`) for multiple

2. **Keep generic bounds simple:**
   - Prefer concrete types for prototyping, introduce generics when the pattern stabilizes
   - Use `impl Trait` in argument position for simple cases
   - Use `where` clauses for complex bounds — never inline complex bounds in `<...>`

3. **Avoid lifetime gymnastics:**
   - If lifetime annotations become complex, restructure to use owned data or `Arc`
   - Consider the "split borrow" pattern to avoid borrow checker issues in struct methods

### Idiomatic Patterns

1. **Builder pattern** for types with many optional fields:
   - Return `Self` from builder methods for chaining
   - `build()` returns `Result<T, BuildError>`, not `T`

2. **Newtype pattern** for domain types:
   - Wrap primitives: `struct UserId(u64)`, not bare `u64`
   - Implement `Deref` only when the newtype truly "is-a" the inner type

3. **Typestate pattern** for state machines:
   - Different states = different types — invalid transitions are compile errors
   - Use this for protocol implementations and lifecycle management

4. **`From`/`Into` conversions:**
   - Implement `From<A> for B` (never `Into` directly)
   - Use `impl From<X> for Error` with `thiserror`'s `#[from]` attribute

5. **Prefer `T::new()` over `Default::default()` for known types:**
   - Use `Vec::new()`, `String::new()`, `HashMap::new()` — explicit, readable, idiomatic
   - Use `Default::default()` in generic contexts where `T: Default` bounds are needed
   - Use `Default::default()` in struct update syntax: `MyStruct { field: value, ..Default::default() }`

   ```rust
   // ✅ Idiomatic — explicit constructor for known types
   let items: Vec<String> = Vec::new();
   let name = String::new();
   let map: HashMap<String, i32> = HashMap::new();

   // ✅ Also good — capacity hint is valuable
   let items = Vec::with_capacity(100);

   // ✅ Default::default() in generic code — correct usage
   fn create_collection<T: Default>() -> T {
       T::default()
   }

   // ✅ Default::default() in struct update syntax
   let config = ServerConfig {
       port: 8080,
       ..Default::default()
   };
   ```

6. **Use stdlib convenience methods — avoid manual reimplementations:**
   - `str.split_once(pat)` instead of manual `splitn(2, pat)` + indexing
   - `a.min(b)` / `a.max(b)` / `a.clamp(lo, hi)` instead of `match a.cmp(&b) { ... }`
   - Return expressions directly — don't bind to a variable and immediately return it
   - Use `Ordering::then()` / `Ordering::then_with()` for multi-field comparisons

   ```rust
   // ❌ Manual reimplementation
   let parts: Vec<&str> = s.splitn(2, ':').collect();
   let key = parts[0];
   let value = parts.get(1).unwrap_or(&"");

   // ✅ Idiomatic — clearer intent, less code
   let (key, value) = s.split_once(':').unwrap_or((s, ""));

   // ❌ Redundant match over Ordering
   match a.cmp(&b) {
       Ordering::Less | Ordering::Equal => a,
       Ordering::Greater => b,
   }

   // ✅ Direct
   a.min(b)

   // ❌ Redundant let-binding
   let result = compute_something();
   result

   // ✅ Return directly
   compute_something()
   ```

7. **Keep function complexity low (cyclomatic complexity < 10):**
   - Functions exceeding this threshold must be decomposed
   - Common decomposition patterns for complex Rust functions:
     - Extract `match` arms into named helper functions
     - Use early returns (`if !condition { return Err(...) }`) to flatten nesting
     - Extract iterator chains with complex closures into named functions
     - Use the "parse, don't validate" pattern — convert unstructured data into typed structs early

   ```rust
   // ❌ High complexity — nested match + conditionals
   fn process(input: &Input) -> Result<Output> {
       match input.kind {
           Kind::A => {
               if input.flag {
                   // 20 lines...
               } else {
                   // 20 lines...
               }
           }
           Kind::B => { /* another 30 lines */ }
       }
   }

   // ✅ Decomposed — each function has single responsibility
   fn process(input: &Input) -> Result<Output> {
       match input.kind {
           Kind::A => process_kind_a(input),
           Kind::B => process_kind_b(input),
       }
   }
   ```

### Testing

1. **Test organization (Rust-specific — differs from Go/TS):**

   > For the authoritative test layout rules (unit vs integration vs e2e placement, `#[cfg(test)]` conventions, `tests/common/mod.rs` pattern, `#[tokio::test]` usage), see `references/project-structure.md` §Testing Layout. The rules are co-located there to stay in sync with the directory layout they describe.

2. **Test naming:** `fn test_<function>_<scenario>_<expected>()` (snake_case)

3. **Assertions:**
   - Use `assert_eq!` / `assert_ne!` over `assert!(a == b)` — better error messages
   - Use `assert!(matches!(result, Ok(_)))` for enum variant checking
   - Never use `assert!(true)` or `assert!(false)`:
     - `assert!(false)` / `debug_assert!(false)` → use `unreachable!("reason")` or `panic!("reason")`
     - `assert!(true)` → remove entirely (it tests nothing)
     - These are dead-code signals that should use proper constructs

4. **Property testing:** Use `proptest` (preferred) or `quickcheck` for functions with wide input spaces. `proptest` is preferred for its superior strategy composability, automatic shrinking, and more expressive generators.

5. **Test coverage is non-negotiable for new code:**
   - Every new `pub fn`, `pub struct` method, and `impl` block MUST have at least one test
   - Every new branch (`if`/`else`, `match` arm, error path) MUST be exercised by a test
   - When modifying existing code, add tests for the modified paths if none exist
   - Never leave a function untested with the intent to "add tests later"
   - Use `cargo tarpaulin` or `cargo llvm-cov` to verify coverage locally before committing

   ```bash
   # Quick coverage check during development
   cargo tarpaulin --workspace --skip-clean --out stdout

   # Generate detailed report
   cargo llvm-cov --workspace --lcov --output-path lcov.info
   ```

6. **Test double selection — choose the right tool:**

   | Approach | When to Use | Crate |
   |---|---|---|
   | Hand-written fake | Simple trait, few methods, test needs custom stateful behavior | None (implement trait directly) |
   | `mockall` | Complex trait, need to verify call counts, argument matching, or call ordering | `mockall` |
   | Parameterized tests | Same logic, multiple input/output pairs (like Go table-driven tests) | `rstest` |
   | Snapshot testing | Large outputs (JSON responses, CLI output, error messages) | `insta` |

   ```rust
   // ✅ Hand-written fake — simple, debuggable, no macro magic
   struct FakeTaskStorage {
       tasks: HashMap<String, Task>,
   }
   impl TaskStorage for FakeTaskStorage {
       async fn get_by_id(&self, id: &str) -> Result<Task, StorageError> {
           self.tasks.get(id).cloned().ok_or(StorageError::NotFound)
       }
   }

   // ✅ mockall — when you need interaction verification
   #[cfg(test)]
   mock! {
       pub TaskStore {}
       impl TaskStorage for TaskStore {
           async fn get_by_id(&self, id: &str) -> Result<Task, StorageError>;
           async fn create(&self, task: &Task) -> Result<(), StorageError>;
       }
   }

   #[tokio::test]
   async fn test_service_calls_storage_once() {
       let mut mock = MockTaskStore::new();
       mock.expect_create()
           .times(1)
           .returning(|_| Ok(()));
       let service = TaskService::new(mock);
       service.create_task(request).await.unwrap();
   }

   // ✅ rstest — parameterized test cases
   use rstest::rstest;

   #[rstest]
   #[case("valid@email.com", true)]
   #[case("no-at-sign", false)]
   #[case("", false)]
   fn test_email_validation(#[case] input: &str, #[case] expected: bool) {
       assert_eq!(is_valid_email(input), expected);
   }

   // ✅ insta — snapshot testing for complex outputs
   use insta::assert_json_snapshot;

   #[test]
   fn test_task_response_shape() {
       let response = TaskResponse::from(sample_task());
       assert_json_snapshot!(response);
   }
   ```

   > **Prefer hand-written fakes** for core domain traits — they are easier to debug and don't couple tests to implementation details. Use `mockall` only when the trait has many methods or you genuinely need interaction verification (call counts, argument matching, call ordering). Over-mocking with `mockall` leads to brittle tests that break on implementation changes.

### Clippy and Formatting

1. **`cargo check` for fast iteration during development**
   - `cargo check`: type-checks without producing a binary — fastest feedback loop
   - `cargo clippy`: includes `cargo check` plus lint rules — use before committing
   - `cargo build`: only when you need the actual binary/library artifact
   - Never run `cargo build` during TDD cycles — it is significantly slower than `cargo check`

2. **`cargo clippy` must pass with zero warnings** before any commit

3. **Clippy suppression policy — fix the code, don't silence the lint:**

   **NEVER suppress these lints — they signal structural problems that must be fixed:**

   | Lint | What It Signals | What To Do Instead |
   |---|---|---|
   | `too_many_lines` | Function is monolithic | Decompose into smaller functions (see Idiomatic Patterns §7) |
   | `cognitive_complexity` | Too many branches/nesting | Flatten with early returns, extract match arms |
   | `too_many_arguments` | Function has too many params | Introduce a params/config struct or builder |
   | `type_complexity` | Nested generics are unreadable | Create a type alias or newtype wrapper |
   | `struct_excessive_bools` | Struct has too many boolean fields | Replace with an enum, bitflags, or config sub-struct |
   | `large_enum_variant` | Enum variant is disproportionately large | Box the large variant's payload |

   **Decomposition strategies (use INSTEAD of `#[allow]`):**

   ```rust
   // ❌ FORBIDDEN — agent took the lazy path
   #[allow(clippy::too_many_lines)]
   fn process_request(req: &Request) -> Result<Response> {
       // 200 lines of code...
   }

   // ✅ REQUIRED — decompose the function
   fn process_request(req: &Request) -> Result<Response> {
       let validated = validate_request(req)?;
       let enriched = enrich_with_context(&validated)?;
       build_response(&enriched)
   }

   // ❌ FORBIDDEN — too many arguments
   #[allow(clippy::too_many_arguments)]
   fn create_server(host: &str, port: u16, tls: bool, timeout: u64,
                    max_conn: usize, log_level: &str, cert: &Path) -> Server { ... }

   // ✅ REQUIRED — params struct
   struct ServerConfig {
       host: String,
       port: u16,
       tls: bool,
       timeout: Duration,
       max_connections: usize,
       log_level: Level,
       cert_path: PathBuf,
   }
   fn create_server(config: ServerConfig) -> Server { ... }

   // ❌ FORBIDDEN — hiding type complexity
   #[allow(clippy::type_complexity)]
   fn get_handlers() -> HashMap<String, Box<dyn Fn(&Request) -> Pin<Box<dyn Future<Output = Response>>>>> { ... }

   // ✅ REQUIRED — type alias
   type HandlerFn = Box<dyn Fn(&Request) -> Pin<Box<dyn Future<Output = Response>>>>;
   fn get_handlers() -> HashMap<String, HandlerFn> { ... }
   ```

   **Acceptable suppressions (with mandatory `// ALLOW:` comment):**

   | Lint | When Acceptable |
   |---|---|
   | `unwrap_used` | In `#[cfg(test)]` modules only |
   | `expect_used` | In `#[cfg(test)]` modules, OR with a `// SAFETY:` comment proving infallibility, OR in a CLI `main()` that owns the process exit (clear message + exit code). This reconciles with the `expect_used = "warn"` lint level in `recommended-dependencies.md` — `warn` permits these uses while still surfacing every other `expect()` for review. |
   | `module_name_repetitions` | When the repetition is intentional API design |
   | `must_use_candidate` | On internal functions where the caller pattern is known |
   | `missing_errors_doc` | Temporarily during development (must be resolved before merge) |
   | `needless_pass_by_value` | When API stability requires it (with comment explaining why) |
   | `items_after_statements` | When locality of helper functions improves readability |
   | `cast_possible_truncation` | With bounds check or range validation immediately preceding the cast |

   **Rule of thumb:** If you're about to write `#[allow(clippy::...)]`, stop and ask: "Am I suppressing a real design problem?" If yes, fix the design. If the lint is genuinely a false positive for this specific context, suppress with a `// ALLOW:` comment explaining the rationale.

4. **`cargo fmt` is non-negotiable** — all code must be formatted

5. **Recommended project-level Clippy configuration:**

   > For the standard `[lints.clippy]` and `[lints.rust]` blocks (single-crate and workspace variants), and the version pinning policy, see `references/recommended-dependencies.md` §Workspace Lint Configuration and §Starter Cargo.toml Template. Do not duplicate those blocks here — treat `recommended-dependencies.md` as the single source of truth.

6. **Document all public items:**
   - Every `pub fn`, `pub struct`, `pub enum`, `pub trait`, and `pub type` MUST have a `///` doc comment
   - At minimum: one-line summary. For complex items: summary + parameters + errors + examples
   - Enable the `missing_docs` lint in library crates:

   ```toml
   # In Cargo.toml
   [lints.rust]
   missing_docs = "warn"
   ```

   ```rust
   // ❌ Undocumented public item
   pub fn resolve_symbols(path: &Path) -> Result<Vec<Symbol>> { ... }

   // ✅ Documented
   /// Resolves all exported symbols from the file at `path`.
   ///
   /// Returns parsed symbol definitions including their span information.
   ///
   /// # Errors
   /// Returns `ParseError` if the file cannot be parsed by tree-sitter.
   pub fn resolve_symbols(path: &Path) -> Result<Vec<Symbol>> { ... }
   ```

### Dependency Management

1. **Minimize dependency count** — each dependency is an attack surface and compile-time cost
2. **Pin major versions** in `Cargo.toml` — use `dep = "1"` not `dep = "*"`
3. **Audit regularly** — run `cargo audit` to check for known vulnerabilities
4. **Prefer well-maintained crates** — check download count, last commit date, and issue tracker

### Cargo Features

1. **Features must be additive** — enabling a feature must only add functionality, never change or remove existing behavior
2. **Use `dep:` syntax** for optional dependencies to keep the feature namespace clean:

   ```toml
   [features]
   default = ["json"]
   json = ["dep:serde_json"]    # ✅ Uses dep: prefix
   grpc = ["dep:tonic"]         # ✅ Feature doesn't auto-expose dep as feature
   ```

3. **Guard feature-gated code with `#[cfg(feature = "...")]`:**

   ```rust
   #[cfg(feature = "grpc")]
   pub mod grpc_handler;
   ```

4. **Test feature combinations in CI** using `cargo-hack`:

   ```bash
   cargo hack test --feature-powerset --depth 2
   ```

5. **Never use features for mutually exclusive backends** — use traits and runtime selection instead

### Configuration and Environment

1. **Never use string literals directly in `std::env::var()`:**
   - Define all environment variable names as constants in a central module
   - This prevents typos (caught at compile time) and enables grep-ability

   ```rust
   // ❌ Bug-prone — typos are silent, scattered across codebase
   let port = std::env::var("PATHFINDER_PORT").unwrap_or("3000".into());
   let host = std::env::var("PATHFNDER_HOST").unwrap_or("localhost".into()); // typo!

   // ✅ Safe — constants catch typos at compile time, single source of truth
   mod env_keys {
       pub const PORT: &str = "PATHFINDER_PORT";
       pub const HOST: &str = "PATHFINDER_HOST";
   }
   let port = std::env::var(env_keys::PORT).unwrap_or_else(|_| "3000".into());
   let host = std::env::var(env_keys::HOST).unwrap_or_else(|_| "localhost".into());
   ```

2. **Prefer structured config parsing over scattered `env::var` calls:**
   - Parse all config at startup into a typed struct
   - Validate required values fail-fast at boot, not at first use

### Safety, Security, and Performance

**Key safety rules (non-negotiable):**
- Never use `unsafe` without a `// SAFETY:` comment documenting the invariant
- Never `transmute` across types of different sizes or with different validity invariants
- Validate all `as` casts with explicit bounds checks — `as` silently truncates
- Never block the async runtime — use `tokio::task::spawn_blocking` for CPU-heavy or synchronous I/O work inside async contexts

> For the full catalog of safety invariants, SAST patterns, concurrency rules (lock guards, atomics, async), memory safety (double indirection, transmute, pointer casts), collection best practices (retain, deterministic iteration), and security (TOCTOU, path traversal, cookie flags, CSP), see `references/rust-patterns-and-anti-patterns.md`. Load it before writing any unsafe code, concurrent code, or I/O handling code.
>
> For performance patterns (arena allocation, SmallVec, zero-copy parsing, Cow, pre-sized collections, benchmarking), see `perf-optimization/languages/rust.md`.

### Related
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
- Axum Idioms @.agents/skills/axum-idioms/SKILL.md
- Testability Patterns @.agents/skills/testability-patterns/SKILL.md
- Performance (Rust) @.agents/skills/perf-optimization/languages/rust.md
