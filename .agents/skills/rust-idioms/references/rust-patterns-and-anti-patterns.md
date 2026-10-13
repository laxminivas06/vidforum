# Rust Patterns, Safety Invariants, and Anti-Patterns

This reference document outlines core software engineering practices, security invariants, concurrency rules, memory safety guidelines, and performance optimizations for Rust development.

---

## 1. I/O, File System, and Path Handling

### Prefer Full Buffer Operations Over Low-Level `write` / `read`

Methods like `std::io::Write::write` and `std::io::Read::read` are low-level primitives that are not guaranteed to read or write the entire byte buffer in a single invocation. They return the actual number of bytes processed, which may be less than the buffer length.

- **Anti-Pattern:** Ignoring the byte count returned by `write()` or `read()` assumes full completion and causes partial write/read data corruption.
- **Recommended Practice:** Use `write_all()` or `read_exact()` unless you are intentionally implementing custom non-blocking or stream-chunking logic.

```rust
// ❌ Anti-pattern — may write only part of the buffer
use std::io::{self, Write};

fn send_payload<W: Write>(w: &mut W, data: &[u8]) -> io::Result<()> {
    w.write(data)?; // Returns count of written bytes, ignoring remainder!
    Ok(())
}

// ✅ Recommended — guarantees the entire buffer is written
fn send_payload_safe<W: Write>(w: &mut W, data: &[u8]) -> io::Result<()> {
    w.write_all(data)?;
    Ok(())
}
```

### Cross-Platform Line Splitting (`.lines()`)

Splitting strings into lines using `.split("\n")` or `.split("\r\n")` is error-prone when handling cross-platform line endings (Windows CRLF vs Unix LF).

- **Anti-Pattern:** Using `.split("\n")` leaves trailing `\r` characters on CRLF input sources.
- **Recommended Practice:** Use `.lines()` to handle both LF and CRLF sequences transparently.

```rust
// ❌ Anti-pattern — leaves trailing '\r' on Windows CRLF strings
let lines: Vec<&str> = text.split('\n').collect();

// ✅ Recommended — handles LF and CRLF line breaks correctly
let lines: Vec<&str> = text.lines().collect();
```

### Secure File and Directory Operations (TOCTOU & Path Traversal)

Calling filesystem APIs like `fs::remove_dir_all` or opening files directly using unsanitized user paths introduces path traversal vulnerabilities and time-of-check to time-of-use (TOCTOU) race conditions when symlinks are present.

- **Anti-Pattern:** Passing un-sanitized user input directly to file opening functions (e.g., file server handlers) or ignoring symlink checks during recursive deletion.
- **Recommended Practice:** Canonicalize and validate that target paths reside strictly inside the allowed root directory boundary before opening files. Use secure directory deletion APIs where available.

```rust
use std::path::{Path, PathBuf};

// ✅ Recommended — canonicalize path and verify boundary check
fn safe_open_in_dir(base_dir: &Path, user_path: &Path) -> Result<PathBuf, String> {
    let target = base_dir.join(user_path);
    let canonical_target = target.canonicalize().map_err(|e| e.to_string())?;
    let canonical_base = base_dir.canonicalize().map_err(|e| e.to_string())?;

    if canonical_target.starts_with(&canonical_base) {
        Ok(canonical_target)
    } else {
        Err("Access denied: path traversal detected".into())
    }
}
```

---

## 2. Concurrency, Locks, Atomic Invariants, and Async

### Bind Lock Guards to Named Variables

Statements of the form `let _ = mutex.lock()` do **not** hold the lock for the surrounding block scope. The wildcard pattern `_` immediately drops the temporary right-hand side value, releasing the mutex guard on that exact line.

- **Anti-Pattern:** `let _ = mutex.lock()` drops the lock immediately, leaving critical sections unprotected.
- **Recommended Practice:** Bind lock guards to named variables (e.g., `let _guard = mutex.lock()`) so their drop destructor runs at the end of the enclosing block scope.

```rust
use std::sync::Mutex;

// ❌ Anti-pattern — lock is dropped immediately on line 1!
fn update_shared_state(mutex: &Mutex<i32>) {
    let _ = mutex.lock().unwrap();
    // Critical section is NOT protected!
}

// ✅ Recommended — lock lives until _guard goes out of scope
fn update_shared_state_safe(mutex: &Mutex<i32>) {
    let mut guard = mutex.lock().unwrap();
    *guard += 1;
}
```

### Thread Safety in Multi-Threaded Handles: Avoid `Arc<RefCell<T>>`

`RefCell` and `Cell` do not implement `Sync`. Wrapping them in `Arc` (`Arc<RefCell<T>>`) produces a type that cannot be shared safely across threads and fails compile-time checks or leads to design confusion.

- **Anti-Pattern:** `Arc<RefCell<T>>` or `Arc<Cell<T>>` for multi-threaded interior mutability.
- **Recommended Practice:** Use `Arc<Mutex<T>>` or `Arc<RwLock<T>>` for shared mutable state across threads.

```rust
use std::sync::{Arc, Mutex};

// ❌ Anti-pattern — RefCell is not Sync
// struct SharedState { data: Arc<RefCell<u32>> }

// ✅ Recommended — Mutex guarantees thread-safe synchronization
struct SharedState {
    data: Arc<Mutex<u32>>,
}
```

### Atomic Declarations: Use `static` Instead of `const`

Declaring atomic variables as `const` creates a distinct, new atomic memory location every time the constant is referenced in code.

- **Anti-Pattern:** `const COUNTER: AtomicUsize = AtomicUsize::new(0);` creates isolated atomic instances at every usage site.
- **Recommended Practice:** Use `static` so that all threads access the single shared memory address.

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

// ❌ Anti-pattern — creates a new atomic at every reference point!
const BAD_COUNTER: AtomicUsize = AtomicUsize::new(0);

// ✅ Recommended — single static memory location for all access points
static GLOBAL_COUNTER: AtomicUsize = AtomicUsize::new(0);

fn increment() {
    GLOBAL_COUNTER.fetch_add(1, Ordering::SeqCst);
}
```

### Avoid Redundant `OnceCell` Wrappers Around `Mutex`

In modern Rust (1.63+), static `Mutex` instances can be initialized directly with `Mutex::new(...)` at compile time.

- **Anti-Pattern:** `static CELL: OnceCell<Mutex<T>> = ...` adds unnecessary initialization indirection.
- **Recommended Practice:** Initialize global mutexes directly as `static MY_MUTEX: Mutex<T> = Mutex::new(...);`.

### Concurrent Map Scaling: Prefer Concurrent Map Crates Over `Arc<RwLock<HashMap>>`

Using `Arc<RwLock<HashMap<K, V>>>` locks the entire map during access, creating lock contention under high reader/writer concurrency.

- **Recommended Practice:** Use concurrent hashmap data structures (such as `DashMap`) that employ lock-sharding to allow parallel access across distinct key buckets.

### Drive Futures to Completion

Async functions return a `Future` that is a suspended computation unit. Simply calling an `async fn` without `.await` or spawning it onto an async runtime executor produces an unused `Future` whose body never executes.

- **Anti-Pattern:** `let _ = async_op();` discards the future without polling or execution.
- **Recommended Practice:** Always `.await` futures inside async contexts or spawn them explicitly (`tokio::spawn`).

```rust
// ❌ Anti-pattern — un-polled future; operation never runs
async fn log_event(event: &str) { ... }

fn handle_request() {
    let _ = log_event("user_login"); // Does nothing!
}

// ✅ Recommended — await or spawn
async fn handle_request_async() {
    log_event("user_login").await;
}
```

### Empty Busy Loops (`loop {}`) Waste CPU Cycles

Spinning in an empty `loop {}` consumes 100% CPU on a core.

- **Anti-Pattern:** `loop {}` used for blocking or waiting.
- **Recommended Practice:** Use `thread::sleep`, async synchronization primitives (`tokio::sync::notify`), or thread parking (`thread::park()`).

### Blocking the Async Runtime

Performing CPU-heavy computation or synchronous I/O inside an `async` function starves the tokio runtime, blocking all other tasks on that worker thread.

- **Anti-Pattern:** Calling `std::fs::read`, `std::thread::sleep`, or running CPU-intensive computations directly in an `async fn`.
- **Recommended Practice:** Use `tokio::task::spawn_blocking` to move blocking work to a dedicated thread pool.

```rust
// ❌ Anti-pattern — blocks the async runtime thread
async fn process_file(path: &Path) -> Result<Data> {
    let content = std::fs::read_to_string(path)?;  // Synchronous I/O!
    parse_data(&content)  // CPU-heavy parsing
}

// ✅ Recommended — offload to blocking thread pool
async fn process_file(path: PathBuf) -> Result<Data> {
    tokio::task::spawn_blocking(move || {
        let content = std::fs::read_to_string(&path)?;
        parse_data(&content)
    })
    .await?
}
```

> **Rule of thumb:** If an operation takes >10µs or does any synchronous I/O, it must be in `spawn_blocking`. For async file I/O, prefer `tokio::fs` over `std::fs`.

### Abusing `Deref` for Inheritance

Implementing `Deref` on a type to "inherit" methods from an inner type creates confusing APIs and violates the principle of least astonishment.

- **Anti-Pattern:** Using `Deref` to simulate OOP inheritance (e.g., `Deref<Target = InnerType>` to access `InnerType` methods on the outer type).
- **Recommended Practice:** Use explicit delegation, composition, or trait implementations. `Deref` should only be used for smart pointer types (`Box`, `Arc`, `Rc`, `MutexGuard`) where the wrapper truly "is-a" transparent handle to the inner value.

```rust
// ❌ Anti-pattern — Deref as "inheritance"
struct Admin {
    user: User,
}
impl Deref for Admin {
    type Target = User;
    fn deref(&self) -> &User { &self.user }
}
// admin.username() works but hides the delegation — confusing API

// ✅ Recommended — explicit delegation
struct Admin {
    user: User,
}
impl Admin {
    pub fn username(&self) -> &str { self.user.username() }
    pub fn email(&self) -> &str { self.user.email() }
}
```

### `Pin` and Self-Referential Structs

Async Rust relies on `Pin` to prevent moving futures that contain self-referential state (pointers to their own fields).

- **Key rules:**
  - Most async code doesn't need to interact with `Pin` directly — `async`/`.await` handles it
  - When implementing `Stream` or `Future` manually, use `Pin<Box<dyn Future>>` to heap-allocate and pin
  - Never move a value after pinning it — this is the core `Pin` invariant
  - If the compiler says your type is `!Unpin`, it likely contains a self-referential future — use `Box::pin()` to resolve

```rust
// ✅ Pinning a future for storage in a collection
use std::pin::Pin;
use std::future::Future;

type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

struct TaskQueue {
    pending: Vec<BoxFuture<'static, Result<(), Error>>>,
}

impl TaskQueue {
    fn push<F: Future<Output = Result<(), Error>> + Send + 'static>(&mut self, fut: F) {
        self.pending.push(Box::pin(fut));
    }
}
```

> For most application code, you won't need to use `Pin` directly. It becomes relevant when building custom futures, streams, or storing heterogeneous future collections.

---

## 3. Memory Safety, Smart Pointers, and Indirection

### Avoid Double Indirection in Heap Smart Pointers

Smart pointers like `Box`, `Rc`, and `Arc` allocate memory on the heap. Wrapping heap-allocated types (such as `String`, `Vec<T>`, or another `Box`) inside smart pointers introduces redundant heap indirection (pointers to pointers).

- **Anti-Patterns:**
  - `Box<String>` or `Box<Vec<T>>` $\rightarrow$ Use `String`, `Vec<T>`, or `Box<str>`, `Box<[T]>`.
  - `Arc<Box<T>>` or `Rc<Box<T>>` $\rightarrow$ Use `Arc<T>` or `Rc<T>`.
  - `Box<&str>` or `Rc<&str>` $\rightarrow$ Use `Box<str>` or `Rc<str>`.

```rust
use std::sync::Arc;

// ❌ Anti-pattern — double indirection: pointer to pointer on heap
let bad_str: Box<String> = Box::new(String::from("hello"));
let bad_arc: Arc<Box<str>> = Arc::new(Box::from("hello"));

// ✅ Recommended — direct heap allocation
let good_str: String = String::from("hello");
let good_arc: Arc<str> = Arc::from("hello");
```

### Prefer `as` Pointer Casts and Safe Conversions Over `mem::transmute`

`std::mem::transmute` reinterprets raw bits from one type to another. It bypasses type safety and requires manual invariant verification.

- **Anti-Pattern:** Transmuting between pointers (`transmute::<*const T, *const U>`), between integers and floats/booleans, or between integers and arrays.
- **Recommended Practice:**
  - Use `as` for raw pointer casting (`ptr as *const U`).
  - Use byte conversion methods (`0u64.to_le_bytes()`) instead of numeric transmutes.
  - Use safe UTF-8 validation (`str::from_utf8`) instead of unchecked raw transmutes.

```rust
// ❌ Anti-pattern — unsafe transmute for byte conversion
let bytes: [u8; 8] = unsafe { std::mem::transmute(42u64) };

// ✅ Recommended — safe and explicit
let bytes = 42u64.to_le_bytes();

// ❌ Anti-pattern — transmute raw pointers
let p_mut: *mut u32 = unsafe { std::mem::transmute(p_const) };

// ✅ Recommended — explicit pointer cast
let p_mut = p_const as *mut u32;
```

### Avoid `*const` to `*mut` Pointer Mutation Without Soundness Proof

Converting a shared raw pointer (`*const T`) to a mutable raw pointer (`*mut T`) and mutating the underlying value is undefined behavior if the origin was an immutable variable or reference.

- **Recommended Practice:** Never mutate values derived from immutable references (`&T`). Use interior mutability types (`Cell`, `RefCell`, `Mutex`, `RwLock`, `AtomicT`) when mutation through shared handles is required.

### Avoid `mem::drop` or `mem::forget` on References and `Copy` Types

Calling `std::mem::drop` or `std::mem::forget` on a reference (`&T`) drops/forgets the reference pointer itself, not the underlying data. Calling them on a `Copy` type is a no-op because `Copy` types implement no destructors.

- **Anti-Pattern:** `mem::drop(&mut resource)` or `mem::drop(42_u32)`.
- **Recommended Practice:** Pass owned non-`Copy` values to `drop()` when explicit resource release is required.

```rust
let mut data = vec![1, 2, 3];

// ❌ Anti-pattern — drops the reference &mut Vec, NOT the vector!
std::mem::drop(&mut data);

// ✅ Recommended — drops the actual owned vector
std::mem::drop(data);
```

### Prefer `mem::take` and `Option::take` Over `mem::replace` with Defaults

When taking ownership of a value stored inside a mutable reference or `Option`, prefer clear intent methods:

- **`std::mem::take(&mut var)`**: Acquires `var` and replaces it with `T::default()`.
- **`option.take()`**: Acquires `Some(v)` and leaves `None`.

```rust
// ❌ Anti-pattern — verbose mem::replace with default
let old = std::mem::replace(&mut my_string, String::default());
let opt_val = std::mem::replace(&mut my_option, None);

// ✅ Recommended — idiomatic intent
let old = std::mem::take(&mut my_string);
let opt_val = my_option.take();
```

---

## 4. Security, Access Control, and Input Validation

### Explicit Octal Unix File Permissions

Unix permissions are bitmasks represented in octal (base 8). Writing decimal integer literals like `755` instead of `0o755` results in decimal `755` being converted to octal `0o1363`, assigning unexpected permission bits.

- **Anti-Pattern:** `builder.mode(755)` or `permissions.set_readonly(false)` (which sets world-writable mode `0o777`).
- **Recommended Practice:** Always use explicit octal literals (`0o755`, `0o644`) with `DirBuilderExt` or `PermissionsExt`.

```rust
use std::fs::File;
use std::os::unix::fs::PermissionsExt;

// ❌ Anti-pattern — decimal literal 755 != octal 0o755; set_readonly(false) makes world-writable!
permissions.set_readonly(false);

// ✅ Recommended — explicit octal mode for owner write, group/world read
permissions.set_mode(0o644);
```

### Cookie Security: `HttpOnly` and `Secure` Flags

Cookies carrying session tokens or sensitive authentication state must restrict client-side script access and HTTP transmission.

- **Recommended Practice:** Always enable `.set_http_only(true)` to mitigate XSS cookie theft and `.set_secure(true)` to enforce HTTPS transmission.

### Content Security Policy (CSP) Headers

Web responses serving HTML must define restrictive Content Security Policy headers.

- **Anti-Pattern:** `default-src '*'` or `script-src '*'` allows execution of external scripts from any origin.
- **Recommended Practice:** Use `default-src 'self'; script-src 'self'`. Avoid deprecated `X-XSS-Protection` headers in favor of robust CSP policies.

### Unspecified Interface Binds (`0.0.0.0`)

Binding network listeners to `0.0.0.0` (IPv4) or `::` (IPv6) exposes the service to all attached network interfaces.

- **Recommended Practice:** Bind explicitly to `127.0.0.1` for internal/local services. Bind to `0.0.0.0` only for public ingress proxies or container application entry points.

### Secure Temporary File Generation

Hardcoding temporary directories (`/tmp/my_app`) invites symlink attacks and race conditions (TOCTOU).

- **Recommended Practice:** Use the `tempfile` crate (`tempfile::tempdir()`, `tempfile::NamedTempFile`) to guarantee cryptographically unique temporary files with automatic cleanup.

### Trojan Source & Invisible Unicode Formatting

Invisible Unicode control characters (such as bidirectional override characters `U+202E`, zero-width spaces, or homoglyphs) can visually obscure code execution logic.

- **Recommended Practice:** Reject source files containing invisible or bidirectional control characters. Ensure linter rules flag invisible Unicode tokens.

### Open Redirects and Regular Expression Security (ReDoS)

- **Regex Anchors:** Always anchor domain and URL validation regexes (`^...$`) to prevent SSRF and redirect bypasses.
- **ReDoS:** Avoid un-bounded nested quantifiers in regular expressions (e.g. `(a+)+`) when evaluating untrusted user inputs.

---

## 5. Collections and Data Structure Best Practices

### In-Place Collection Filtering: Use `.retain()`

Filtering a collection by creating a new iterator and collecting into a new container allocates fresh memory.

- **Anti-Pattern:** `vec = vec.into_iter().filter(|x| ...).collect();`
- **Recommended Practice:** Use `.retain(|x| ...)` directly on `Vec`, `VecDeque`, `HashMap`, and `HashSet` to filter elements in-place without reallocation.

```rust
let mut numbers = vec![1, 2, 3, 4, 5, 6];

// ❌ Anti-pattern — allocates a new vector
numbers = numbers.into_iter().filter(|x| x % 2 == 0).collect();

// ✅ Recommended — in-place modification
numbers.retain(|x| x % 2 == 0);
```

### Collision Awareness in `HashMap` Accumulation

Calling `map.extend(other_map)` overwrites values for existing keys present in `other_map`.

- **Recommended Practice:** When accumulating counts or merging collections with overlapping keys, iterate explicitly and combine values (`map.entry(key).and_modify(...).or_insert(...)`).

### Deterministic Iteration on Maps and Sets

Iterating over `HashMap` or `HashSet` yields elements in non-deterministic order.

- **Anti-Pattern:** Pairing ordered iterator operations (`.skip_while()`, `.nth()`, `.position()`) with `HashMap::iter()`.
- **Recommended Practice:** Use `BTreeMap` or `BTreeSet` when predictable, key-ordered iteration is required.

### Zero-Sized Types and Array Initialization

Using zero-length arrays (`[T; 0]`) as type markers forces unnecessary trait bounds on `T`.

- **Recommended Practice:** Use `std::marker::PhantomData<T>` to mark unused generic parameters without storing instances.

### Slice and Collection Indexing

Accessing elements via `.iter().nth(n)` on collections that support indexed access performs unnecessary iterator setup.

- **Recommended Practice:** Use `.get(n)` or `.get_mut(n)` directly on slices, `Vec`, and `VecDeque`.

```rust
let v = vec![10, 20, 30];

// ❌ Anti-pattern — unnecessary iterator overhead
let val = v.iter().nth(1);

// ✅ Recommended — direct index bounds-checked access
let val = v.get(1);
```

---

## 6. Language Ergonomics, Formatting, and Formatting Traits

### `write!` Macro in `Display` and `Debug` Implementations

The `fmt` method provided by `Display` and `Debug` traits writes into an output `Formatter` buffer. Using `print!` or `eprint!` inside `fmt` outputs directly to standard stdout/stderr, bypassing the formatter stream.

- **Anti-Pattern:** Using `print!` or `eprint!` inside `fmt(&self, f: &mut Formatter)`.
- **Recommended Practice:** Use `write!(f, ...)` or standard debug helpers (`f.debug_struct(...)`).

```rust
use std::fmt;

struct Point { x: i32, y: i32 }

// ❌ Anti-pattern — writes to stdout, not formatter buffer
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        print!("({}, {})", self.x, self.y);
        Ok(())
    }
}

// ✅ Recommended — uses write! macro on formatter parameter
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
```

### Floating-Point `NaN` Comparisons

Comparing floating-point variables directly to `f32::NAN` or `f64::NAN` with `==` or `!=` always evaluates to `false` because IEEE 754 specifies that `NaN != NaN`.

- **Anti-Pattern:** `if val == f64::NAN` or `if val != f64::NAN`.
- **Recommended Practice:** Use `val.is_nan()`.

### Collapsible String Replacement Calls

Chaining multiple `.replace()` calls with the same replacement target causes multiple full-string passes and allocations.

- **Anti-Pattern:** `s.replace('a', "z").replace('b', "z")`
- **Recommended Practice:** Use a closure pattern match: `s.replace(|c| matches!(c, 'a' | 'b'), "z")`.

### Build-Time Environment Variable Checks

Using `option_env!("VAR").unwrap()` defers environment check failures to runtime panics.

- **Recommended Practice:** Use `env!("VAR")` to validate required environment variables at compile time.

### Self Type Keyword in Returns

Inside `impl` blocks or trait definitions, reference the implementing type as `Self` rather than module `self`.

### Single-Character String Patterns

Methods on `str` (such as `.split()`, `.find()`, `.contains()`) accept both characters (`char`) and string slices (`&str`).

- **Recommended Practice:** Pass character literals (`'/'`) instead of single-character string literals (`"/"`) to avoid string pattern search overhead.

### Duration Sub-Second API

Avoid manual division when extracting sub-second components from `std::time::Duration`.

```rust
let duration = std::time::Duration::from_millis(1500);

// ❌ Anti-pattern — manual math
let millis = duration.subsec_nanos() / 1_000_000;

// ✅ Recommended — standard helper
let millis = duration.subsec_millis();
```

### Code Invariants: Range, Math, and Logical Checks

- **Zero Step Iterators:** `.step_by(0)` panics at runtime; step size must be non-zero.
- **Empty Ranges:** Ranges where start > end (e.g. `42..21`) are empty and execute zero iterations.
- **Erasing Arithmetic:** Operations like `x * 0` or `0 / x` evaluate to zero and indicate logic bugs.
- **Identical Operands:** Binary checks like `a < b || a < b` or `x == x` indicate copy-paste mistakes.

---

## 7. Performance Invariants

| Anti-Pattern | Recommended Alternative | Rationale |
|---|---|---|
| `"str".bytes().count()` | `"str".len()` | `len()` is $O(1)$ constant time; `bytes().count()` iterates in $O(N)$ time. |
| `"str".bytes().nth(n)` | `"str".as_bytes().get(n)` | Direct byte slice indexing is $O(1)$; iterator `.nth()` is $O(N)$. |
| `vec.iter().count()` | `vec.len()` | Direct `.len()` query on collections with length properties. |
| `iter.skip(n).next()` | `iter.nth(n)` | Direct `nth()` implementation avoids unnecessary adapter allocation. |
| `string.extend(other.chars())` | `string.push_str(&other)` | `push_str` copies byte slices in bulk rather than char-by-char iteration. |
| `match val { Some(x) => expr, _ => () }` | `if let Some(x) = val { expr }` | `if let` reduces nesting and visual complexity for single-arm matches. |
| `Arc<RwLock<HashMap<K, V>>>` | `Arc<DashMap<K, V>>` | Lock-sharded concurrent map reduces thread contention under write loads. |
| `s.replace('a', "x").replace('b', "x")` | `s.replace(\|c\| matches!(c, 'a' \| 'b'), "x")` | Single string pass avoids intermediate heap allocations. |

---

## 8. Resilience Patterns (Retry, Backoff, Circuit Breaker)

Modern Rust services use `tower-resilience` for composable resilience middleware built on the Tower `Service` trait.

### Retry with Exponential Backoff

- **Anti-Pattern:** Hand-rolling retry loops with `tokio::time::sleep` — error-prone, inconsistent, no jitter.
- **Recommended Practice:** Use `tower-resilience` retry middleware with exponential backoff and jitter.

```rust
use tower::ServiceBuilder;
use tower_resilience::retry::{RetryLayer, RetryPolicy};

let service = ServiceBuilder::new()
    .layer(
        RetryLayer::new(RetryPolicy::exponential_backoff()
            .max_retries(3)
            .with_jitter()
            .build())
    )
    .service(my_http_client);
```

### Circuit Breaker

Prevents cascading failures by short-circuiting requests when a downstream dependency is unhealthy.

- **Anti-Pattern:** Retrying a failing service indefinitely — creates retry storms and amplifies outages.
- **Recommended Practice:** Combine retries with a circuit breaker. The breaker trips when failures exceed a threshold, immediately rejecting requests until the dependency recovers.

```rust
use tower_resilience::circuit_breaker::CircuitBreakerLayer;

let circuit_breaker = CircuitBreakerLayer::builder()
    .failure_rate_threshold(0.5)    // Trip at 50% failure rate
    .wait_duration_in_open_state(Duration::from_secs(30))
    .build();

let service = ServiceBuilder::new()
    .layer(circuit_breaker)
    .layer(retry_layer)
    .service(my_http_client);
```

### When to Retry vs. When to Circuit-Break

| Signal | Action |
|---|---|
| Transient error (timeout, 503) | Retry with backoff |
| Persistent error (401, 404, validation) | Do NOT retry — fail immediately |
| Multiple consecutive failures | Circuit breaker should trip |
| Non-idempotent request (POST without txn key) | Do NOT retry |
| Dependency fully down (circuit open) | Return error immediately, do not enqueue |

### Idempotency Requirement

> **Never retry non-idempotent operations** unless the operation has an idempotency key. `GET`, `PUT`, and `DELETE` are generally safe to retry. `POST` requires an explicit idempotency key header or transaction ID.

---

### Related
- Rust Idioms and Patterns @.agents/skills/rust-idioms/SKILL.md
- Security Mandate @.agents/rules/security-mandate.md
- Security Principles @.agents/rules/security-principles.md
- Concurrency and Threading Principles @.agents/rules/concurrency-and-threading-principles.md
- Resources and Memory Management Principles @.agents/rules/resources-and-memory-management-principles.md
- Performance Optimization Principles @.agents/rules/performance-optimization-principles.md
- Performance (Rust) @.agents/skills/perf-optimization/languages/rust.md
