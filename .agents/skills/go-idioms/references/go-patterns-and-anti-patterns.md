---
name: Go Patterns, Safety Invariants, and Anti-Patterns
description: Concurrency traps, resource leaks, security vulnerabilities, collection pitfalls, performance invariants, and resilience patterns for Go. Load before writing any code that handles I/O, concurrency, or user input.
---

> Load this file **before** writing code that handles I/O, concurrency, or user input.

## Section Index
- [1. I/O, File System, and Path Handling](#1-io-file-system-and-path-handling)
- [2. Concurrency, Synchronization, and Goroutines](#2-concurrency-synchronization-and-goroutines)
- [3. Memory Safety and Resource Management](#3-memory-safety-and-resource-management)
- [4. Security Vulnerabilities](#4-security-vulnerabilities)
- [5. Collections and Data Structure Best Practices](#5-collections-and-data-structure-best-practices)
- [6. Language Ergonomics and Style](#6-language-ergonomics-and-style)
- [7. Performance Invariants](#7-performance-invariants)
- [8. Resilience Patterns (Timeout, Retry, Circuit Breaker)](#8-resilience-patterns-timeout-retry-circuit-breaker)
- [Related Section](#related-section)

---

## 1. I/O, File System, and Path Handling

### HTTP Response Body Closing
Must drain AND close `resp.Body` — failing to drain prevents connection reuse. 

**Anti-Pattern:** Bare `defer resp.Body.Close()` without draining leaves unread bytes, preventing the HTTP client from returning the connection to the pool.

**Recommended Practice:** Drain the body using `io.Copy(io.Discard, resp.Body)` before closing.

❌ Bad
```go
resp, err := http.Get("http://example.com")
if err != nil {
	return err
}
defer resp.Body.Close()
// Only reading a portion, or not at all
```

✅ Good
```go
resp, err := http.Get("http://example.com")
if err != nil {
	return err
}
defer func() {
	if _, err := io.Copy(io.Discard, resp.Body); err != nil {
		slog.Warn("failed to drain response body", "error", err)
	}
	if err := resp.Body.Close(); err != nil {
		slog.Warn("failed to close response body", "error", err)
	}
}()
```

### File Permission Octal Literals
Unix permissions must use octal representation.

**Anti-Pattern:** Decimal `755` which Go interprets as decimal 755 (octal 1363), not octal.

**Recommended Practice:** Use `0o` prefix for octal literals.

❌ Bad
```go
os.Mkdir("config", 755) // Creates directory with unexpected permissions
```

✅ Good
```go
os.Mkdir("config", 0o755)
```

### Partial Read/Write Handling
`io.Reader.Read()` and `io.Writer.Write()` may not process the full buffer. 

**Anti-Pattern:** Ignoring the returned byte count or assuming a single `Read`/`Write` processes everything.

**Recommended Practice:** Use `io.ReadAll()`, `io.ReadFull()`, or `io.Copy()`.

❌ Bad
```go
buf := make([]byte, 1024)
r.Read(buf) // Might read fewer than 1024 bytes
```

✅ Good
```go
buf := make([]byte, 1024)
_, err := io.ReadFull(r, buf)
```

### Secure Temporary Files
Creating files in hardcoded `/tmp/` paths can lead to symlink attacks or Time-of-Check to Time-of-Use (TOCTOU) vulnerabilities.

**Anti-Pattern:** Using string concatenation with `/tmp/`.

**Recommended Practice:** Use `os.CreateTemp` and `os.MkdirTemp`.

❌ Bad
```go
filename := "/tmp/mytemp_" + randString()
f, err := os.Create(filename)
```

✅ Good
```go
f, err := os.CreateTemp("", "mytemp_*")
```

### Path Traversal Prevention
Canonicalize user-supplied paths and verify they remain within the allowed base directory.

**Anti-Pattern:** Directly concatenating user input to a base path.

**Recommended Practice:** Use `filepath.Clean` and check with `strings.HasPrefix` after resolving symlinks.

❌ Bad
```go
userPath := r.URL.Query().Get("file")
fullPath := filepath.Join(baseDir, userPath) // Vulnerable if userPath contains "../"
```

✅ Good
```go
userPath := r.URL.Query().Get("file")
fullPath := filepath.Join(baseDir, filepath.Clean("/"+userPath))
if !strings.HasPrefix(fullPath, baseDir) {
	return errors.New("invalid path")
}
```

### Cross-Platform Path Handling
Use the `filepath` package (OS-aware) for native filesystem operations. The `path` package is POSIX-only and should be used for logical paths (like URLs).

**Anti-Pattern:** Using `path.Join` for local file paths on Windows.

**Recommended Practice:** Always use `filepath` for the local OS.

❌ Bad
```go
path.Join(dir, file) // Will use '/' even on Windows
```

✅ Good
```go
filepath.Join(dir, file) // Uses OS-specific separator
```

---

## 2. Concurrency, Synchronization, and Goroutines

### Defer in Loops
`defer` runs when the enclosing FUNCTION returns, not the loop iteration. This accumulates deferred calls (e.g., file handles) until the function exits.

**Anti-Pattern:** `defer f.Close()` inside a `for` loop.

**Recommended Practice:** Extract the loop body into a separate function, or call cleanup explicitly.

❌ Bad
```go
for _, filename := range files {
	f, _ := os.Open(filename)
	defer f.Close() // Leaks handles until loop finishes
}
```

✅ Good
```go
for _, filename := range files {
	func() {
		f, err := os.Open(filename)
		if err != nil {
			slog.Error("failed to open file", "error", err, "file", filename)
			return
		}
		defer func() {
			if err := f.Close(); err != nil {
				slog.Warn("failed to close file", "error", err, "file", filename)
			}
		}()
		// process f
	}()
}
```

### Loop Variable Capture (Historical)
Pre-Go 1.22: loop variables were shared across iterations. Closures captured the same variable. Go 1.22+ fixed this with per-iteration scoping.

**Anti-Pattern (Pre 1.22):** Using loop variables directly in goroutines.

**Recommended Practice:** Pass as arguments or shadow locally (if targeting < 1.22).

❌ Bad (Pre 1.22)
```go
for _, v := range items {
	go func() {
		fmt.Println(v) // Captures the last value
	}()
}
```

✅ Good (Pre 1.22, unneeded in 1.22+)
```go
for _, v := range items {
	go func(val string) {
		fmt.Println(val)
	}(v)
}
```

### Goroutine Leaks
A goroutine blocked on a channel read/write with no way to unblock runs forever.

**Anti-Pattern:** Spawning a goroutine that waits on a channel indefinitely.

**Recommended Practice:** Always provide a cancellation path via `context.Context` or a done channel.

❌ Bad
```go
func process() {
	ch := make(chan int)
	go func() {
		ch <- doWork() // Blocks forever if nobody reads
	}()
}
```

✅ Good
```go
func process(ctx context.Context) {
	ch := make(chan int)
	go func() {
		select {
		case <-ctx.Done():
			return
		case ch <- doWork():
		}
	}()
}
```

### sync.Pool with Non-Pointer Values
Storing value types in `sync.Pool` causes heap allocation due to `interface{}` boxing. 

**Anti-Pattern:** Putting raw structs into a pool.

**Recommended Practice:** Always store pointers.

❌ Bad
```go
pool := sync.Pool{New: func() any { return bytes.Buffer{} }}
```

✅ Good
```go
pool := sync.Pool{New: func() any { return new(bytes.Buffer) }}
```

### sync.WaitGroup Counter Mismatches
`Add()` must be called before spawning the goroutine, not inside it.

**Anti-Pattern:** Calling `wg.Add(1)` inside the goroutine closure.

**Recommended Practice:** Call `wg.Add` synchronously before `go`.

❌ Bad
```go
var wg sync.WaitGroup
go func() {
	wg.Add(1) // Might execute after wg.Wait() finishes
	defer wg.Done()
}()
wg.Wait()
```

✅ Good
```go
var wg sync.WaitGroup
wg.Add(1)
go func() {
	defer wg.Done()
}()
wg.Wait()
```

### Channel Deadlocks
Sending to an unbuffered channel with no receiver blocks forever. Common in single-goroutine programs.

**Anti-Pattern:** Sending and receiving in the same goroutine without buffering.

**Recommended Practice:** Run the sender or receiver in a separate goroutine, or use buffered channels if size is bounded.

❌ Bad
```go
ch := make(chan int)
ch <- 1
<-ch
```

✅ Good
```go
ch := make(chan int, 1)
ch <- 1
<-ch
```

### Context Propagation
Always pass `context.Context` as the first parameter.

**Anti-Pattern:** Storing contexts in structs.

**Recommended Practice:** Pass it directly to functions needing cancellation/timeouts.

❌ Bad
```go
type Service struct {
	ctx context.Context
}
```

✅ Good
```go
func (s *Service) DoWork(ctx context.Context) error
```

### Untrappable Signals
Registering handlers for `SIGKILL` or `SIGSTOP` is a no-op — these signals cannot be caught by the application.

**Anti-Pattern:** Attempting to catch `syscall.SIGKILL`.

**Recommended Practice:** Catch `syscall.SIGINT` or `syscall.SIGTERM` instead.

❌ Bad
```go
ch := make(chan os.Signal, 1)
signal.Notify(ch, syscall.SIGKILL) // No-op, cannot be caught
```

✅ Good
```go
ch := make(chan os.Signal, 1)
signal.Notify(ch, syscall.SIGTERM, syscall.SIGINT)
```

### Race Conditions in Map Access
Concurrent map reads/writes without synchronization cause runtime panic.

**Anti-Pattern:** Multiple goroutines writing to a map simultaneously without locks.

**Recommended Practice:** Use `sync.Map` or a `sync.RWMutex` to protect map access.

❌ Bad
```go
m := make(map[string]int)
go func() { m["a"] = 1 }()
go func() { m["b"] = 2 }() // fatal error: concurrent map writes
```

✅ Good
```go
var mu sync.RWMutex
m := make(map[string]int)

go func() {
	mu.Lock()
	m["a"] = 1
	mu.Unlock()
}()
```

### select Without default
A `select` with no `default` case blocks until one case is ready. Use `default` for non-blocking attempts.

**Anti-Pattern:** Using a blocking `select` when checking channel readiness.

**Recommended Practice:** Add a `default` case for non-blocking attempts.

❌ Bad
```go
select {
case msg := <-ch:
	fmt.Println(msg)
	// Blocks if `ch` is empty
}
```

✅ Good
```go
select {
case msg := <-ch:
	fmt.Println(msg)
default:
	fmt.Println("no message ready")
}
```

---

## 3. Memory Safety and Resource Management

### Slice Header vs Backing Array
Appending to a slice may or may not reallocate the backing array.

**Anti-Pattern:** Ignoring the return value of `append` or keeping old slice references.

**Recommended Practice:** After `append`, always use the returned slice.

❌ Bad
```go
func process(s []int) {
	append(s, 1) // Does not modify the caller's slice length
}
```

✅ Good
```go
func process(s []int) []int {
	return append(s, 1)
}
```

### String/Byte Slice Conversion Costs
`string([]byte)` and `[]byte(string)` allocate and copy.

**Anti-Pattern:** Pre-converting byte slices to strings for map lookups.

**Recommended Practice:** For map lookups, the compiler optimizes `map[string(byteslice)]` — don't pre-convert.

❌ Bad
```go
keyStr := string(keyBytes)
val := m[keyStr]
```

✅ Good
```go
val := m[string(keyBytes)] // Compiler optimizes out allocation
```

### time.Tick Memory Leak
`time.Tick()` creates a ticker that can never be stopped or garbage collected.

**Anti-Pattern:** Using `time.Tick` outside of global/main functions.

**Recommended Practice:** Use `time.NewTicker()` + `defer ticker.Stop()`.

❌ Bad
```go
for range time.Tick(time.Second) {
	// Leaks memory when function exits
}
```

✅ Good
```go
ticker := time.NewTicker(time.Second)
defer ticker.Stop()
for range ticker.C {
}
```

### Defer Ordering (LIFO)
Deferred calls execute in last-in-first-out order. Be aware when the order of cleanup matters.

**Anti-Pattern:** Assuming deferred functions execute in the order they are defined.

**Recommended Practice:** Plan for LIFO execution.

❌ Bad
```go
// Output: 1, 2
// Incorrect if closing resource 2 depends on resource 1 still being open.
```

✅ Good
```go
defer fmt.Println("2")
defer fmt.Println("1")
// Prints "1", then "2"
```

### Connection Pool Exhaustion
Forgetting to close `*sql.Rows`, `*http.Response.Body`, or `net.Conn` leaks connections and can quickly exhaust pools.

**Anti-Pattern:** Ignoring errors on close or failing to close connections altogether.

**Recommended Practice:** Always close in a `defer` immediately after a successful open.

❌ Bad
```go
rows, err := db.Query("SELECT * FROM users")
if err != nil {
	return err
}
// rows.Close() is missing, connection is leaked
for rows.Next() {
	// ...
}
```

✅ Good
```go
rows, err := db.Query("SELECT * FROM users")
if err != nil {
	return err
}
defer func() {
	if err := rows.Close(); err != nil {
		slog.Warn("failed to close rows", "error", err)
	}
}()

for rows.Next() {
	// ...
}
```

### Large Slice Memory Retention
Slicing a large backing array retains the entire backing array in memory.

**Recommended Practice:** Use `slices.Clone()` or manual copy for small sub-slices.

❌ Bad
```go
small := largeData[0:10] // largeData never garbage collected
```

✅ Good
```go
small := slices.Clone(largeData[0:10])
```

---

## 4. Security Vulnerabilities

### Insecure File Permissions
Creating files with overly permissive modes (like `0o777`).

**Anti-Pattern:** Writing sensitive files with world-readable/writable permissions.

**Recommended Practice:** Use `0o600` for sensitive files, `0o644` for normal files, `0o755` for directories.

❌ Bad
```go
err := os.WriteFile("config.json", data, 0o777)
```

✅ Good
```go
err := os.WriteFile("config.json", data, 0o600)
```

### Hard-coded Credentials
API keys, passwords, or tokens directly in source.

**Anti-Pattern:** Hard-coding secrets into variables.

**Recommended Practice:** Use environment variables or secret management.

❌ Bad
```go
const apiKey = "sk_live_1234567890abcdef"
```

✅ Good
```go
apiKey := os.Getenv("API_KEY")
if apiKey == "" {
	log.Fatal("API_KEY is required")
}
```

### Template Injection
Using `text/template` instead of `html/template` for HTML output.

**Anti-Pattern:** `text/template` doesn't escape output. Using `template.HTML()` bypasses escaping.

**Recommended Practice:** Use `html/template` which auto-escapes.

❌ Bad
```go
import "text/template"
// vulnerable to XSS
```

✅ Good
```go
import "html/template"
```

### Unsafe Command Execution
Building shell commands with string concatenation of user input via `os/exec`.

**Anti-Pattern:** Passing concatenated strings to shells (`sh -c`).

**Recommended Practice:** Pass arguments as separate args to `exec.Command()`.

❌ Bad
```go
exec.Command("sh", "-c", "ls "+userInput)
```

✅ Good
```go
exec.Command("ls", userInput)
```

### Network Binding to 0.0.0.0
Binding to all interfaces when only localhost is needed exposes the service externally.

**Anti-Pattern:** Listening on `0.0.0.0` or empty host `""`.

**Recommended Practice:** Bind to `127.0.0.1` for internal services.

❌ Bad
```go
http.ListenAndServe(":8080", nil) // Binds to all interfaces
```

✅ Good
```go
http.ListenAndServe("127.0.0.1:8080", nil) // Binds to localhost only
```

### SQL Injection
String formatting query parameters.

**Anti-Pattern:** Concatenating user strings into SQL queries.

**Recommended Practice:** Always use parameterized queries.

❌ Bad
```go
db.Query("SELECT * FROM users WHERE id = " + id)
```

✅ Good
```go
db.Query("SELECT * FROM users WHERE id = $1", id)
```

### Regex Anchoring
Unanchored regex for URL/domain validation allows bypass.

**Anti-Pattern:** Validating domains without anchors allows matches like `badexample.com/example.com`.

**Recommended Practice:** Always use `^...$` anchors.

❌ Bad
```go
matched, _ := regexp.MatchString(`example\.com`, userInput)
```

✅ Good
```go
matched, _ := regexp.MatchString(`^example\.com$`, userInput)
```

### ReDoS
Nested quantifiers (`(a+)+`) on untrusted input. Go's `regexp` is safe (RE2 engine, no backtracking), but third-party `regexp2` is not. Keep to `regexp`.

### Open Redirects
Redirecting to user-supplied URLs without validation can lead to phishing attacks.

**Anti-Pattern:** Trusting user input blindly for `http.Redirect`.

**Recommended Practice:** Validate the redirect URL against an allowlist, or ensure it is a relative path.

❌ Bad
```go
func handleRedirect(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("next")
	http.Redirect(w, r, target, http.StatusFound)
}
```

✅ Good
```go
func handleRedirect(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("next")
	if !strings.HasPrefix(target, "/") || strings.HasPrefix(target, "//") {
		http.Error(w, "invalid redirect", http.StatusBadRequest)
		return
	}
	http.Redirect(w, r, target, http.StatusFound)
}
```

### Timing Side Channels
Using `==` for secret comparison.

**Recommended Practice:** Use `crypto/subtle.ConstantTimeCompare`.

❌ Bad
```go
if inputHash == storedHash { ... }
```

✅ Good
```go
if subtle.ConstantTimeCompare(inputHash, storedHash) == 1 { ... }
```

---

## 5. Collections and Data Structure Best Practices

### Nil Map Assignment Panic
Writing to an uninitialized map panics at runtime.

**Anti-Pattern:** Declaring a map variable without initializing it.

**Recommended Practice:** Always initialize with `make(map[K]V)` or a map literal.

❌ Bad
```go
var m map[string]int
m["key"] = 1 // panic: assignment to entry in nil map
```

✅ Good
```go
m := make(map[string]int)
m["key"] = 1
```

### Map Iteration Non-Determinism
`for k, v := range m` visits keys in random order.

**Recommended Practice:** Use `slices.Sorted(maps.Keys(m))` when deterministic order is needed.

### Nil Slice vs Empty Slice with encoding/json
`var s []int` marshals to `null`, `s := []int{}` marshals to `[]`. Choose intentionally based on API expectations.

### Pre-allocation
When size is known, avoid repeated grow-and-copy.

❌ Bad
```go
var s []int
for i := 0; i < n; i++ {
	s = append(s, i) // Allocates multiple times
}
```

✅ Good
```go
s := make([]int, 0, n)
for i := 0; i < n; i++ {
	s = append(s, i)
}
```

### Inefficient Slice Concatenation
Appending elements one-by-one in a loop vs variadic append.

❌ Bad
```go
for _, item := range s2 {
	s1 = append(s1, item)
}
```

✅ Good
```go
s1 = append(s1, s2...)
```

### Redundant make Arguments
`make([]T, 0, 0)` trailing 0 capacity is redundant. Use `make([]T, 0)`.

### maps.Clone and slices.Clone
Prefer stdlib clone functions (Go 1.21+) over manual copy loops.

### Sorted Iteration
Use `slices.SortFunc` for custom sort, `slices.Sorted(maps.Keys(m))` for sorted map keys.

---

## 6. Language Ergonomics and Style

### Error String Formatting
Error strings should not be capitalized (unless proper nouns) or end with punctuation.

❌ Bad
```go
return errors.New("File not found.")
```

✅ Good
```go
return errors.New("file not found")
```

### Redundant Control Flow
`else` after `return`, `break`, `continue`, or `panic` is unnecessary. Flatten with early returns.

❌ Bad
```go
if err != nil {
	return err
} else {
	return nil
}
```

✅ Good
```go
if err != nil {
	return err
}
return nil
```

### Useless break in switch
Go switch cases don't fall through by default. Explicit `break` is redundant.

**Anti-Pattern:** Adding `break` at the end of every case.

**Recommended Practice:** Omit `break`. Use `fallthrough` only when necessary.

❌ Bad
```go
switch x {
case 1:
	fmt.Println("one")
	break
}
```

✅ Good
```go
switch x {
case 1:
	fmt.Println("one")
}
```

### Unexported Return Types from Exported Functions
An exported function returning an unexported type is a usability anti-pattern — callers can use the value but can't name the type.

**Anti-Pattern:** Returning a private struct from a public function.

**Recommended Practice:** Make the return type exported, or return an exported interface.

❌ Bad
```go
func NewClient() *client {
	return &client{}
}
```

✅ Good
```go
func NewClient() *Client {
	return &Client{}
}
```

### Unnecessary Blank Identifier
`for _ = range s` should be `for range s`. `_ = someFunc()` when the return isn't used should be removed.

**Anti-Pattern:** Assigning unused returns to the blank identifier when no returns are required.

**Recommended Practice:** Drop the assignment entirely.

❌ Bad
```go
for _ = range s { }
_ = someFunc() // assuming someFunc returns nothing or 1 unused value
```

✅ Good
```go
for range s { }
someFunc()
```

### Type Assertion Safety
Always use the comma-ok pattern (`val, ok := x.(T)`) to avoid panics.

❌ Bad
```go
s := val.(string) // Panics if not string
```

✅ Good
```go
s, ok := val.(string)
```

### Misplaced default in switch
Convention is to place `default` as the last case.

**Anti-Pattern:** Placing `default` randomly in the middle of cases.

**Recommended Practice:** Move `default` to the end.

❌ Bad
```go
switch n {
default:
	fmt.Println("other")
case 1:
	fmt.Println("one")
}
```

✅ Good
```go
switch n {
case 1:
	fmt.Println("one")
default:
	fmt.Println("other")
}
```

### Naked returns
Only use naked returns in short functions (< 5 lines).

**Anti-Pattern:** Naked returns in long, complex functions make it hard to track what is being returned.

**Recommended Practice:** Be explicit in long functions.

❌ Bad
```go
func compute(a, b int) (result int, err error) {
	// ... 20 lines of code ...
	return // Naked return
}
```

✅ Good
```go
func compute(a, b int) (int, error) {
	// ... 20 lines of code ...
	return result, err
}
```

### Redundant type declarations
`var s string = "hello"` should be `s := "hello"`.

**Anti-Pattern:** Explicitly typing variables when the compiler can infer them.

**Recommended Practice:** Use short variable declarations or omit the type.

❌ Bad
```go
var s string = "hello"
```

✅ Good
```go
s := "hello"
// or
var s = "hello"
```

### String formatting verbs
Use `%q` for quoted strings (includes escaping), `%v` for default formatting, `%+v` for struct field names, `%#v` for Go syntax.

---

## 7. Performance Invariants

| Anti-Pattern | Recommended Alternative | Rationale |
|---|---|---|
| `s += "chunk"` in loop | `strings.Builder` | Avoids O(n²) allocations |
| `[]byte(s)` in map key lookup | Direct `map[string(b)]` | Compiler optimizes — no alloc |
| `regexp.Compile()` per call | Package-level `regexp.MustCompile` | Compile once, use many |
| `make([]T, 0)` when size known | `make([]T, 0, n)` | Avoids grow-and-copy |
| `sort.Slice(s, less)` | `slices.SortFunc(s, cmp)` | ~10% faster, type-safe |
| `fmt.Sprintf("%d", n)` in hot path | `strconv.Itoa(n)` | No reflection overhead |
| Value types in `sync.Pool` | Pointer types in `sync.Pool` | Avoids interface boxing alloc |
| `time.Tick()` in functions | `time.NewTicker()` + `defer Stop()` | Tick leaks, can't be GC'd |
| Manual byte buffer loops | `io.Copy(dst, src)` | Optimized kernel-level copy |
| `len(s) == 0` for strings | `s == ""` | Semantic clarity (both O(1)) |
| `bytes.Compare(a, b) == 0` | `bytes.Equal(a, b)` | Clearer intent, same perf |
| Repeated `append` one-by-one | `append(s1, s2...)` variadic | Single grow operation |

---

## 8. Resilience Patterns (Timeout, Retry, Circuit Breaker)

### Context-Based Timeouts
Always use `context.WithTimeout` or `context.WithDeadline` for operations that may hang.

❌ Bad
```go
resp, err := http.Get("http://example.com") // Might hang forever
```

✅ Good
```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
req, _ := http.NewRequestWithContext(ctx, "GET", "http://example.com", nil)
resp, err := http.DefaultClient.Do(req)
```

### Retry with Backoff
Don't hand-roll retry loops. Use exponential backoff with jitter (e.g., `cenkalti/backoff`).

### Circuit Breaker
Prevent cascading failures by failing fast when downstream is struggling. Use libs like `sony/gobreaker` or `mercari/go-circuitbreaker`.

### When to Retry vs When to Circuit-Break
| Signal | Action |
|---|---|
| Transient error (timeout, 503) | Retry with backoff |
| Persistent error (401, 404, validation) | Do NOT retry — fail immediately |
| Multiple consecutive failures | Circuit breaker should trip |
| Non-idempotent request (POST without idempotency key) | Do NOT retry |
| Dependency fully down (circuit open) | Return error immediately |

### Idempotency Requirement
Never retry non-idempotent operations without an idempotency key.

### Graceful Shutdown
Handle `SIGTERM`/`SIGINT` with context cancellation.

✅ Good
```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

// Pass ctx to server or background workers
<-ctx.Done()
// Execute graceful shutdown
```

---

## Related Section
- [Go Idioms and Patterns](file:///home/irahardianto/works/projects/awesome-agv/.agents/skills/go-idioms/SKILL.md)
- [Security Mandate](file:///home/irahardianto/works/projects/awesome-agv/.agents/rules/security-mandate.md)
- [Security Principles](file:///home/irahardianto/works/projects/awesome-agv/.agents/rules/security-principles.md)
- [Concurrency and Threading Principles](file:///home/irahardianto/works/projects/awesome-agv/.agents/rules/concurrency-and-threading-principles.md)
- [Resources and Memory Management Principles](file:///home/irahardianto/works/projects/awesome-agv/.agents/rules/resources-and-memory-management-principles.md)
- [Performance Optimization Principles](file:///home/irahardianto/works/projects/awesome-agv/.agents/rules/performance-optimization-principles.md)
