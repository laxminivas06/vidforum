---
name: go-idioms
description: >-
  Go idioms and patterns: stdlib conventions, explicit error wrapping (%w), small interfaces, goroutines/channels concurrency, table-driven tests, and gofumpt formatting. Use when writing, refactoring, or reviewing Go services and packages.
---

## Go Idioms and Patterns

### 1. Core Philosophy

Go favors simplicity, explicitness, and readability. The language is intentionally small — resist the urge to import patterns from other languages. If it looks boring and obvious, it's probably idiomatic Go.

> **Scope:** This file covers Go-specific *coding idioms*. For file layout, see `references/project-structure.md`. For detailed safety, SAST, and performance patterns, see `references/go-patterns-and-anti-patterns.md`. For logging library choice, see the `logging-implementation` skill. For quality commands, see the `code-idioms-and-conventions` rule.

**Loading Guards:** If the project has no `go.mod`, this skill does not apply.

---

### 2. When to Load References

| Situation | Reference to Load |
|---|---|
| Starting a new project or setting up file layout | `references/project-structure.md` |
| Choosing packages, `go.mod` setup, or `golangci-lint` config | `references/recommended-dependencies.md` |
| Writing code that handles I/O, concurrency, or user input | `references/go-patterns-and-anti-patterns.md` |

---

### 3. Toolchain and Go Version

Default to the latest stable Go release. As of August 2026, **Go 1.24** is the baseline with the Go module system.

Key version milestones:
- **1.24+** — `go tool` for tool dependencies, swiss table map implementation
- **1.23+** — `range`-over-func (iterator protocol), `unique` package
- **1.22+** — `range`-over-integer, loop variable per-iteration scoping (eliminates loop variable capture bugs), enhanced `ServeMux` with method-based routing
- **1.21+** — `log/slog` structured logging, `maps` and `slices` stdlib packages, `sync.OnceFunc` / `sync.OnceValue` / `sync.OnceValues`, `min` / `max` builtins, `clear` builtin
- **1.18+** — Generics, fuzz testing with `testing.F`

**Example `go.mod` configuration:**
```go
module github.com/user/project

go 1.24.0

toolchain go1.24.0
```

---

### 4. Error Handling

1. **Always return errors — never panic in library or business code**
   - `panic` is reserved for truly unrecoverable states (programmer errors, nil dereference)
   - Use `recover` only at top-level goroutine boundaries (middleware, server startup)

2. **Wrap errors with context using `%w`**
   - Don't re-wrap at every level. Wrap once with meaningful context where it matters.
   
   ✅ Preserves the error chain for errors.Is / errors.As
   ```go
   return fmt.Errorf("creating task for user %s: %w", userID, err)
   ```

   ❌ Loses the error chain
   ```go
   return fmt.Errorf("creating task: %v", err)
   ```

3. **Error string formatting**
   - Error strings should be lowercase and have no trailing punctuation.
   - Go convention from Code Review Comments.

   ✅ Correct formatting
   ```go
   return fmt.Errorf("failed to open file %q: %w", path, err)
   ```

   ❌ Incorrect formatting
   ```go
   return fmt.Errorf("Failed to open file: %w.", err)
   ```

4. **Use `errors.Join` for multi-error aggregation (Go 1.20+)**
   ```go
   var errs []error
   if err := doFirst(); err != nil {
       errs = append(errs, err)
   }
   if err := doSecond(); err != nil {
       errs = append(errs, err)
   }
   return errors.Join(errs...)
   ```

5. **Use sentinel errors for expected branch conditions**
   ```go
   // Define in errors.go
   var ErrNotFound = errors.New("not found")
   var ErrUnauthorized = errors.New("unauthorized")

   // Caller checks with errors.Is
   if errors.Is(err, ErrNotFound) {
       // handle
   }
   ```

6. **Use typed errors for rich domain errors**
   ```go
   type ValidationError struct {
       Field   string
       Message string
   }
   func (e *ValidationError) Error() string {
       return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
   }

   // Caller unwraps with errors.As
   var ve *ValidationError
   if errors.As(err, &ve) {
       // access ve.Field, ve.Message
   }
   ```

7. **Handle errors at the right level** 
   - Propagate upward until you have enough context to act on them; don't swallow or re-wrap the same error twice.

8. **Use lazy evaluation for fallback values**
   - Prefer creating errors lazily only when a failure occurs to avoid unnecessary allocations.

---

### 5. Interfaces

1. **Keep interfaces small — one or two methods is ideal**

   ✅ Focused, composable
   ```go
   type Reader interface { Read(p []byte) (n int, err error) }
   type Writer interface { Write(p []byte) (n int, err error) }
   ```

   ❌ Monolithic
   ```go
   type FileManager interface {
       Read()
       Write()
       Delete()
       List()
       Stat()
   }
   ```

2. **"Accept interfaces, return structs"**
   - Function parameters: accept interfaces for flexibility and testability
   - Return values: return concrete structs so callers can access all methods

3. **Define interfaces where they are *used*, not where they are *implemented***

   ✅ Defined in the consumer package (task feature)
   ```go
   // task/storage.go
   type Storage interface {
       GetByID(ctx context.Context, id string) (*Task, error)
   }

   // postgres.go implements Storage — it does NOT define it
   ```

4. **Implicit satisfaction is a feature — don't use embedding to "implement" interfaces**
   - Any type with the right method set satisfies an interface automatically
   - No `implements` keyword needed or wanted

5. **`any` vs `interface{}`**
   - Always use `any` (Go 1.18+ alias) instead of `interface{}`.

6. **Interface compliance verification**
   - Use `var _ Interface = (*Struct)(nil)` to guarantee a type implements an interface at compile time.
   ```go
   var _ Storage = (*PostgresStorage)(nil)
   ```

7. **When NOT to use interfaces**
   - Premature abstraction violates YAGNI. Do not create an interface until you have 3+ implementations (or you need to mock it for testing in test-driven design).

8. **Generic interfaces with type parameters (Go 1.18+)**
   ```go
   type Repository[T any] interface {
       FindByID(ctx context.Context, id string) (T, error)
   }
   ```

---

### 6. Goroutines and Channels

> For general concurrency principles (race conditions, deadlocks, message passing), see `concurrency-and-threading-principles.md`. This section covers Go-specific mechanics.

1. **Always pass `context.Context` as the first parameter**

   ✅ Pass context
   ```go
   func (s *Service) GetTask(ctx context.Context, id string) (*Task, error)
   ```

   ❌ No way to cancel or propagate deadlines
   ```go
   func (s *Service) GetTask(id string) (*Task, error)
   ```

2. **Never start a goroutine without knowing how it will stop (Anti-pattern: Goroutine Leak)**
   - Every goroutine must have a definitive exit path (e.g., via `context.Context` cancellation or channel close).

   ✅ Goroutine is bounded by context cancellation
   ```go
   go func() {
       for {
           select {
           case <-ctx.Done():
               return
           case item := <-ch:
               process(item)
           }
       }
   }()
   ```

3. **Goroutine lifecycle management with `sync.WaitGroup`**
   ```go
   var wg sync.WaitGroup
   for _, task := range tasks {
       wg.Add(1)
       go func(t Task) {
           defer wg.Done()
           process(t)
       }(task)
   }
   wg.Wait()
   ```

4. **Use `errgroup` for concurrent fan-out with error collection**
   ```go
   g, ctx := errgroup.WithContext(ctx)
   g.Go(func() error { return fetchUsers(ctx) })
   g.Go(func() error { return fetchOrders(ctx) })
   if err := g.Wait(); err != nil { ... }
   ```

5. **Prefer channels for ownership transfer; mutexes for shared state**
   - Channel: "I'm handing this data to you"
   - Mutex: "We're both reading/writing this shared thing"

6. **Close channels from the sender, never the receiver**

7. **`context.AfterFunc` (Go 1.21+)**
   - Trigger an action asynchronously when a context completes.
   ```go
   stop := context.AfterFunc(ctx, func() {
       cleanupResources()
   })
   defer stop()
   ```

8. **Channel direction restrictions in function signatures**
   - Narrow channel directions for compile-time safety.
   ```go
   func producer(ch chan<- int) {} // Send-only
   func consumer(ch <-chan int) {} // Receive-only
   ```

9. **`sync.OnceFunc` / `sync.OnceValue` (Go 1.21+)**
   - Use for lazy, thread-safe initialization.
   ```go
   var initDb = sync.OnceValue(func() *sql.DB {
       // initialize DB
       return db
   })
   ```

10. **`select` with `default` for non-blocking operations**
    ```go
    select {
    case ch <- data:
        // Sent
    default:
        // Channel is full or unbuffered with no receiver, move on
    }
    ```

11. **`context.WithoutCancel` (Go 1.21+)**
    - Create a derived context that is not cancelled when the parent is. Use for background operations that must outlive the request (e.g., async audit logging, metrics flush).
    ```go
    // Request-scoped context cancelled when handler returns
    bgCtx := context.WithoutCancel(ctx)
    go func() {
        // This work continues even after the parent request completes
        auditLog(bgCtx, event)
    }()
    ```
    ⚠️ Use sparingly — most work should respect parent cancellation. Reserve for fire-and-forget operations where partial completion is acceptable.

12. **Structured concurrency with `conc` (when `errgroup` isn't enough)**
    - `errgroup` covers fan-out with error collection. For additional needs — panic recovery within goroutines, bounded worker pools with panic safety — use `github.com/sourcegraph/conc`.
    ```go
    // conc.WaitGroup recovers panics and re-panics on Wait()
    wg := conc.NewWaitGroup()
    wg.Go(func() { process(item1) })
    wg.Go(func() { process(item2) })
    wg.Wait() // Re-panics if any goroutine panicked
    ```
    - Prefer `errgroup` for simple fan-out. Reach for `conc` when you need panic recovery or bounded concurrency with `conc/pool`.

---

### 7. Naming Conventions

1. **Receiver names: short, consistent, and the first letter of the type**
   ✅
   ```go
   func (s *Service) Create(...) {}
   ```
   ❌
   ```go
   func (svc *Service) Create(...) {} // too verbose
   func (self *Service) Create(...) {} // not Go
   ```

2. **Package names: short, lowercase, no underscores, no plurals**
   ✅ `package task`
   ❌ `package tasks` (plural)
   ❌ `package task_service` (underscore)

3. **Acronyms follow Go conventions (all caps or all lowercase)**
   ✅ `userID`, `HTTPClient`
   ❌ `userId`, `HttpClient`

4. **Unexported identifiers omit the type name** — if it's private, keep it terse

5. **Don't stutter** — `task.Task` is fine; `task.TaskService` is not

6. **Error string formatting**
   - Error strings should not be capitalized or end with punctuation.

7. **Getter naming**
   - No `Get` prefix in Go. Use `user.Name()` not `user.GetName()`.

8. **Test naming**
   - Use the `TestFunctionName_Scenario_Expected` pattern.
   ```go
   func TestCalculateDiscount_NegativeInput_ReturnsError(t *testing.T) { ... }
   ```

9. **Constructor naming**
   - Use `New` prefix (`NewService`, `NewClient`).

10. **Interface naming**
    - Use the `-er` suffix for single-method interfaces (`Reader`, `Writer`, `Stringer`).

---

### 8. Idiomatic Patterns

1. **Range-over-func iterators (Go 1.23+)**
   ```go
   // Definition
   func Count(n int) iter.Seq[int] {
       return func(yield func(int) bool) {
           for i := 0; i < n; i++ {
               if !yield(i) {
                   return
               }
           }
       }
   }

   // Usage
   for i := range Count(5) {
       fmt.Println(i)
   }
   ```

2. **Nil slice vs empty slice semantics**
   - `var s []int` (nil slice) marshals to `null` in JSON.
   - `s := []int{}` or `make([]int, 0)` (empty slice) marshals to `[]` in JSON.

3. **Type assertions with comma-ok pattern**
   ```go
   if str, ok := val.(string); ok {
       fmt.Println(str)
   }
   ```

4. **Type switches for polymorphic dispatch**
   ```go
   switch v := val.(type) {
   case string:
       fmt.Println("String:", v)
   case int:
       fmt.Println("Int:", v)
   default:
       fmt.Println("Unknown type")
   }
   ```

5. **`strings.Builder` for string concatenation**
   - Avoid `+` inside loops. Use `strings.Builder`.
   ```go
   var b strings.Builder
   b.WriteString("hello")
   b.WriteString("world")
   return b.String()
   ```

6. **`slices` and `maps` stdlib packages (Go 1.21+)**
   - Use the built-in generic functions for sorting, reversing, filtering, and checking elements.
   ```go
   slices.Sort(mySlice)
   if slices.Contains(mySlice, target) { ... }
   ```

7. **Variadic append**
   - Use `append(s1, s2...)` instead of loops.

8. **Pre-allocation**
   - Use `make([]T, 0, n)` when the size is known to avoid reallocation overhead.

9. **`sync.Pool` for hot-path allocations**
   - Use only for POINTER values to reduce GC pressure.

10. **`time.NewTicker` vs `time.Tick`**
    - `time.Tick` leaks the underlying ticker. Always prefer `time.NewTicker` which can be stopped via `ticker.Stop()`.

11. **Struct embedding for composition (not inheritance)**
    - Use struct embedding to reuse fields and methods where it forms an "is-a" relationship, not for general code reuse.

12. **Early returns / guard clauses**
    - Reduce nesting.
    ```go
    if err != nil {
        return err
    }
    // Continue happy path
    ```

13. **Keep function complexity low**
    - Keep cyclomatic complexity under 10 (matching Rust/TS guidelines).

14. **Functional options for optional configuration**
   ```go
   type Option func(*Service)

   func WithTimeout(d time.Duration) Option {
       return func(s *Service) { s.timeout = d }
   }

   func NewService(store Storage, opts ...Option) *Service {
       s := &Service{store: store, timeout: 30 * time.Second}
       for _, o := range opts { o(s) }
       return s
   }
   ```

15. **`defer` for cleanup — always use error-checked closures**

   Every deferred cleanup call that returns an error MUST check and log the error.
   Never use bare `defer X.Close()` — the discarded error hides resource leak failures.

   ❌ NEVER: Error silently discarded
   ```go
   defer rows.Close()
   ```

   ✅ ALWAYS: Error-checked closure with structured logging
   ```go
   rows, err := db.QueryContext(ctx, query)
   if err != nil { return fmt.Errorf("querying tasks: %w", err) }
   defer func() {
       if err := rows.Close(); err != nil {
           slog.Warn("failed to close rows", "error", err, "operation", "ListTasks")
       }
   }()
   ```

   **Transaction rollback:**
   ❌ NEVER
   ```go
   defer tx.Rollback()
   ```

   ✅ ALWAYS: Guard against sql.ErrTxDone (already committed)
   ```go
   defer func() {
       if err := tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
           slog.Error("failed to rollback transaction", "error", err, "operation", "CreateOrder")
       }
   }()
   ```

   **HTTP response body:**
   ❌ NEVER
   ```go
   defer resp.Body.Close()
   ```

   ✅ ALWAYS: Drain then close (prevents connection reuse issues)
   ```go
   defer func() {
       if _, err := io.Copy(io.Discard, resp.Body); err != nil {
           slog.Warn("failed to drain response body", "error", err)
       }
       if err := resp.Body.Close(); err != nil {
           slog.Warn("failed to close response body", "error", err)
       }
   }()
   ```

16. **Avoid `init()` functions** 
    - They run implicitly and make testing harder; prefer explicit initialization in `main` or constructors.

17. **Use named return values only for documentation or `defer`-based cleanup** 
    - Never rely on naked returns in non-trivial functions.

18. **`unique.Handle` for string interning (Go 1.23+)**
    - Deduplicate frequently repeated values (user IDs, status strings) to reduce memory.
    ```go
    import "unique"

    h := unique.Make("active")
    // h.Value() returns "active"
    // Two handles with the same underlying value compare as equal
    h1 := unique.Make("active")
    fmt.Println(h == h1) // true — same canonical representation
    ```
    - Use when you have many copies of the same string in memory (e.g., status enums parsed from JSON). Don't use for unique values — the interning overhead is wasted.

---

### 9. Testing

> Test file naming and pyramid proportions are defined in `testing-strategy.md`. This section covers Go-specific tooling only.

1. **Table-driven tests are the default pattern**
   ```go
   func TestCalculateDiscount(t *testing.T) {
       tests := []struct {
           name     string
           input    float64
           expected float64
           wantErr  bool
       }{
           {"zero items", 0, 0, false},
           {"negative input", -1, 0, true},
       }
       for _, tt := range tests {
           t.Run(tt.name, func(t *testing.T) {
               got, err := calculateDiscount(tt.input)
               if tt.wantErr {
                   require.Error(t, err)
                   return
               }
               require.NoError(t, err)
               assert.Equal(t, tt.expected, got)
           })
       }
   }
   ```

2. **Use `testify` for assertions** 
   - `require` for fatal assertions, `assert` for non-fatal.

3. **Run with the race detector in CI** 
   - `go test -race ./...`

4. **Use `httptest.NewRecorder()` for HTTP handler tests** 
   - No live server needed.

5. **Test behaviour, not implementation** 
   - Assert on outputs and side effects, not internal field values.

6. **Test helpers with `t.Helper()` and `testing.TB` interface**
   ```go
   func createTestUser(t testing.TB) *User {
       t.Helper() // Corrects line numbers in failure output
       // ...
   }
   ```

7. **`t.Cleanup()` for resource teardown**
   - Automatically cleans up resources without needing defers across multiple helper functions.
   ```go
   func setupDB(t *testing.T) *sql.DB {
       db := connect()
       t.Cleanup(func() { db.Close() })
       return db
   }
   ```

8. **Fuzz testing with `testing.F` (Go 1.18+)**
   ```go
   func FuzzParse(f *testing.F) {
       f.Add("valid_input")
       f.Fuzz(func(t *testing.T, input string) {
           Parse(input) // ensure it never panics
       })
   }
   ```

9. **Benchmark patterns with `testing.B`**
   ```go
   func BenchmarkProcess(b *testing.B) {
       b.ReportAllocs() // ALWAYS report allocations
       b.ResetTimer()   // Ignore setup time
       for i := 0; i < b.N; i++ {
           Process()
       }
   }
   ```

10. **Golden file testing**
    - For large, complex outputs (like JSON or HTML), use golden files and compare against them.

11. **Test coverage non-negotiable policy**
    - Every new exported function/method MUST have tests.
    - Every branch MUST be exercised.

12. **Coverage commands**
    - Run `go test -cover ./...` and `go test -coverprofile=coverage.out ./...`.

13. **Test Double Selection Table**

| Approach | When to Use |
|---|---|
| Hand-written fake (implement interface) | Simple interface, few methods, need stateful behavior |
| `gomock`/`mockgen` | Complex interface, need to verify call counts, argument matching |
| `testify/mock` | Complex interface, prefer fluent assertion API |
| Table-driven tests | Same logic, multiple input/output pairs |
| `go-cmp` | Deep equality comparison with custom options |

Prefer hand-written fakes for core domain traits.

---

### 10. Formatting and Static Analysis

All of the following **must pass with zero warnings/errors** before any commit. See `code-idioms-and-conventions.md` for the full checklist.

**Feedback Loop — Development Workflow:**

| Phase | Command | Purpose |
|---|---|---|
| TDD / rapid iteration | `go vet ./...` | Type-checks and correctness — fastest loop |
| Pre-commit | `golangci-lint run` | Aggregated linting — must pass zero warnings |
| Pre-commit | `gofumpt -l -w .` | Formatting — non-negotiable |
| Pre-commit | `go test -race ./...` | Unit tests with race detector |
| Coverage verification | `go test -coverprofile=c.out ./...` | Verify before merging |
| Security audit | `govulncheck ./...` | CVE scanning |

**Lint suppression policy — NEVER suppress these:**

| Lint | What It Signals | What To Do Instead |
|---|---|---|
| `errcheck` | Unchecked error returns | Handle the error — use error-checked closure in defer |
| `govet` shadow | Variable shadowing | Rename the inner variable |
| `staticcheck` SA* | Correctness issues | Fix the underlying bug |
| `gosec` G* (security) | Security vulnerability | Fix the vulnerability |
| `cyclop` / `gocognit` | Function too complex | Decompose into smaller functions |

**Acceptable suppressions (with mandatory `// nolint:` comment + rationale):**

| Lint | When Acceptable |
|---|---|
| `gosec G104` (unhandled error) | In test code only, with `// nolint:gosec // test-only` |
| `revive exported` | When the exported symbol is intentionally part of API design |

**Rule of thumb:** If you're about to write `//nolint:`, stop and ask if you're suppressing a real design problem.

**`//nolint:errcheck` is NEVER acceptable.** If a function returns an error, handle it — even in `defer`. Use an error-checked closure. This is the #1 source of audit findings.

> **Logging:** Never use `fmt.Println` or `log.Printf` in production service code — these produce unstructured output. Use `log/slog` (stdlib, Go 1.21+) or the project's chosen adapter. See `@.agents/skills/logging-implementation/SKILL.md` for the required library and patterns.

---

### 11. Documentation

1. **Godoc conventions**
   - Package-level doc comment should exist for all exported packages.
   - All exported symbols (functions, structs, interfaces, vars, consts) MUST have a documentation comment starting with the name of the symbol.

2. **Example functions**
   - Use `func ExampleFunction()` with `// Output:` comments at the end of the function body for runnable examples in Godoc.
   ```go
   func ExampleHello() {
       fmt.Println("Hello")
       // Output: Hello
   }
   ```

3. **Package doc**
   - For complex packages, place package documentation in a dedicated `doc.go` file.

4. **Document the WHY, not the WHAT**
   - The code shows *what* is happening. Comments explain *why* it is done this way (design rationale, edge cases, workarounds).

---

### 12. Dependency Management

1. **Minimize dependency count**
   - Go stdlib is highly comprehensive. Rely on it heavily before bringing in external packages.

2. **Commit `go.sum` always**
   - Both `go.mod` and `go.sum` belong in version control to guarantee reproducible builds.

3. **`go mod tidy` before commits**
   - Always run this to prune unused dependencies and resolve checksums.

4. **`govulncheck` in CI**
   - Continuously scan for vulnerabilities in your module dependency tree.

5. **Module proxy and checksum database**
   - Use `GOPROXY` and the checksum database. For private modules, configure `GOPRIVATE` or `GONOSUMCHECK`.

6. **Prefer stdlib over third-party**
   - When feature parity exists (e.g., `log/slog` vs `zap`), use the stdlib.

---

### 13. Configuration and Environment

1. **Never scatter `os.Getenv()` calls throughout codebase**
   - It makes dependencies opaque and testing difficult.

2. **Centralized config struct parsed at startup**
   - Parse all configurations into a central `Config` struct once, then inject it (or its subsets) where needed.

3. **Fail fast**
   - Fail at boot for missing required configuration, not later at the first time of use.

4. **Example with struct tags and validation**
   ```go
   type Config struct {
       Port     int    `env:"PORT" envDefault:"8080"`
       Database string `env:"DATABASE_URL" envRequired:"true"`
   }

   func LoadConfig() (*Config, error) {
       // load and validate
   }
   ```

---

### 14. Safety, Security, and Performance

- **Key safety rules (non-negotiable):** 
  - Never ignore errors.
  - Always close resources safely in a `defer`.
  - Validate all user input at the system boundary.
- **For a full catalog:** Point to `references/go-patterns-and-anti-patterns.md`.
- **For Go-specific profiling:** Point to the `perf-optimization` skill.

---

### 15. Related Principles

- Code Idioms and Conventions @code-idioms-and-conventions.md
- Project Structure — Go Backend @references/project-structure.md
- Security Principles @security-principles.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md
- Testing Strategy @testing-strategy.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Logging and Observability Principles @.agents/skills/logging-implementation/SKILL.md
- Dependency Management Principles @dependency-management-principles.md
