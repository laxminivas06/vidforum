---
name: Python Patterns, Safety Invariants, and Anti-Patterns
description: Type safety pitfalls, async traps, resource leaks, security vulnerabilities, collection best practices, performance invariants, and resilience patterns for Python. Load before writing any code that handles user input, async operations, or I/O.
---

> Load this file **before** writing code that handles user input, async operations, or I/O.

## Section Index

| Section | Description |
|---|---|
| [1. Type Safety and Common Pitfalls](#1-type-safety-and-common-pitfalls) | Mutable defaults, truthiness traps, closures, None checks. |
| [2. Async and Concurrency Anti-Patterns](#2-async-and-concurrency-anti-patterns) | Blocking calls, task groups, GIL, sync/async mixing. |
| [3. Resource Management and I/O](#3-resource-management-and-io) | Context managers, file encoding, pool exhaustion. |
| [4. Security Vulnerabilities](#4-security-vulnerabilities) | Injection, deserialization, SSRF, path traversal. |
| [5. Collections and Data Structure Best Practices](#5-collections-and-data-structure-best-practices) | Defaultdict, sets, comprehensions, dict operations. |
| [6. String and Text Processing](#6-string-and-text-processing) | Concatenation, regex compilation, f-strings, walrus operator. |
| [7. Performance Invariants](#7-performance-invariants) | Generators, caching, `__slots__`, complexity reference. |
| [8. Resilience Patterns](#8-resilience-patterns-timeout-retry-circuit-breaker) | Retry, backoff, circuit breaking, bulkheads. |
| [9. Structural Pattern Matching](#9-structural-pattern-matching) | `match`/`case` patterns, guards, anti-patterns. |

---

## 1. Type Safety and Common Pitfalls

### Mutable Default Arguments
Python evaluates default arguments once at function definition time. Mutable defaults (`list`, `dict`, `set`) are shared across all calls, leading to unexpected state accumulation.

```python
# ❌ Shared mutable state across calls
def add_item(item, items=[]):
    items.append(item)
    return items

# ✅ Use None sentinel
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

### `is` vs `==` for Value Comparison
`is` checks identity (same object in memory), `==` checks value equality. Never use `is` to compare values (strings, integers, lists).

```python
# ❌ Compares identity (can fail unexpectedly)
if user_input is "yes":
    pass

# ✅ Compares value
if user_input == "yes":
    pass
```

### Truthiness Traps
Empty containers are falsy, but `0`, `0.0`, `False`, and empty strings are also falsy. Use explicit checks when the distinction matters.

```python
# ❌ Treats 0 and None the same way
def process(count: int | None):
    if not count:  # Fails if count is 0
        count = 10
        
# ✅ Explicit None check
def process(count: int | None):
    if count is None:
        count = 10
```

### `None` Checks
Always use `is None` or `is not None` to check for `None`, never `== None` or `!= None`. Custom objects can override equality checks.

```python
# ❌ Uses equality operator
if value == None:
    pass

# ✅ Uses identity operator
if value is None:
    pass
```

### Inconsistent Return Types
Functions should return consistent types across all execution paths.

```python
# ❌ Returns dict or None or bool
def get_user(user_id: int):
    if user_id < 0:
        return False
    user = db.query(user_id)
    if not user:
        return None
    return {"id": user.id}

# ✅ Always returns dict or raises an exception
def get_user(user_id: int) -> dict:
    if user_id < 0:
        raise ValueError("Invalid ID")
    user = db.query(user_id)
    if not user:
        raise NotFoundError()
    return {"id": user.id}
```

### Late Binding Closures
Closures in Python capture variables by reference, not by value. Loop variables in closures all reference the same variable, which holds the final value of the loop.

```python
# ❌ All functions return 4 (last value of i)
funcs = [lambda: i for i in range(5)]

# ✅ Capture by value using a default argument
funcs = [lambda i=i: i for i in range(5)]
```

### Assigning Result of In-Place Operations
Many in-place operations (`list.sort()`, `list.reverse()`, `dict.update()`) mutate the object and return `None`. Do not assign their result.

```python
# ❌ Assigns None to sorted_items
sorted_items = items.sort()

# ✅ Modifies in place or uses sorted()
items.sort()
# Or
sorted_items = sorted(items)
```

### Integer Interning
CPython interns small integers (-5 to 256). Identity comparison (`is`) works for these but fails for larger values. Always use `==` for integer equality.

```python
# ❌ Works for 10, fails for 1000
if a is 1000:
    pass

# ✅ Always works
if a == 1000:
    pass
```

## 2. Async and Concurrency Anti-Patterns

### Blocking Calls in Async Functions
Never call blocking I/O (file read, `time.sleep`, synchronous network requests like `requests.get`) inside an async function. It blocks the entire event loop, freezing all other coroutines.

```python
import asyncio
import requests
import httpx

# ❌ Blocks the event loop
async def fetch_data(url: str):
    response = requests.get(url)  # Blocking!
    return response.json()

# ✅ Use async HTTP client
async def fetch_data(url: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()
```

### Fire-and-Forget Coroutines
Calling an async function without `await` (or creating a task) returns a coroutine object that never executes. Python warns about this at runtime.

```python
# ❌ Coroutine is never awaited, work is never done
async def main():
    fetch_data() 

# ✅ Await or create task
async def main():
    await fetch_data()
    # Or
    asyncio.create_task(fetch_data())
```

### GIL Misconceptions
The Global Interpreter Lock (GIL) prevents CPU-bound parallelism with threads in CPython. 

```python
# ❌ Uses threads for CPU-bound work (no speedup)
import threading
def compute_heavy(): ...
threads = [threading.Thread(target=compute_heavy) for _ in range(4)]

# ✅ Uses multiprocessing for CPU-bound work
from concurrent.futures import ProcessPoolExecutor
with ProcessPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(compute_heavy, data))
```

### TaskGroup Error Handling (3.11+)
`asyncio.TaskGroup` is the modern way to manage structured concurrency. It automatically cancels all other running tasks in the group if any task raises an unhandled exception.

```python
# ❌ Manual task tracking, prone to leaks on error
async def process_all():
    tasks = [asyncio.create_task(do_work(i)) for i in range(10)]
    await asyncio.gather(*tasks)

# ✅ Structured concurrency (Python 3.11+)
async def process_all():
    async with asyncio.TaskGroup() as tg:
        for i in range(10):
            tg.create_task(do_work(i))
```

### Mixing Sync and Async
Don't call `asyncio.run()` from inside an already-running event loop. 

```python
# ❌ Starting an event loop inside an event loop
async def inner():
    pass
async def outer():
    asyncio.run(inner())  # Raises RuntimeError

# ✅ Use await directly
async def outer():
    await inner()
```

### Thread Safety with asyncio
`asyncio` objects (queues, events, event loop methods) are NOT thread-safe. Use thread-safe variants when interacting across thread boundaries.

```python
# ❌ Unsafe modification of event loop from another thread
def worker_thread(loop, coro):
    loop.create_task(coro)

# ✅ Thread-safe scheduling
def worker_thread(loop, coro):
    asyncio.run_coroutine_threadsafe(coro, loop)
```

## 3. Resource Management and I/O

### Context Managers for All Resources
Always use `with` / `async with` for files, database connections, HTTP clients, locks, and sockets to guarantee cleanup, even if an exception occurs.

```python
# ❌ Resource leak on exception
f = open('data.txt')
data = f.read()
f.close()  # Never reached if read() raises

# ✅ Guaranteed cleanup
with open('data.txt') as f:
    data = f.read()
```

### Connection Pool Exhaustion
Failing to close database connections or HTTP client sessions exhausts connection pools, leading to system failure.

```python
# ❌ Creates a new session per request (exhausts sockets)
async def fetch(url):
    client = httpx.AsyncClient()
    return await client.get(url)

# ✅ Reuses session via context manager
async def fetch_all(urls):
    async with httpx.AsyncClient() as client:
        return [await client.get(url) for url in urls]
```

### Temporary File Security
Do not manually craft paths in `/tmp/`. It is vulnerable to race conditions and symlink attacks.

```python
# ❌ Insecure temporary file
with open('/tmp/my_temp_file.txt', 'w') as f:
    f.write(data)

# ✅ Secure temporary file
import tempfile
with tempfile.NamedTemporaryFile(mode='w', delete=True) as f:
    f.write(data)
```

### File Encoding
Always specify the encoding when opening text files. Relying on the default encoding makes code non-portable across platforms (e.g., Windows uses `cp1252` by default).

```python
# ❌ Platform-dependent encoding
with open('data.txt', 'w') as f:
    f.write("Some text")

# ✅ Explicit UTF-8 encoding
with open('data.txt', 'w', encoding='utf-8') as f:
    f.write("Some text")
```

### Partial Read/Write
Simple file operations can be done more cleanly with `pathlib`.

```python
from pathlib import Path

# ✅ Simple read/write using pathlib
Path("data.txt").write_text("Hello", encoding="utf-8")
content = Path("data.txt").read_text(encoding="utf-8")
```

## 4. Security Vulnerabilities

### Command Injection via subprocess
Using `shell=True` with user input enables arbitrary command execution. Always pass commands as lists with `shell=False`.

```python
import subprocess

# ❌ Command injection vulnerability
user_input = "file.txt; rm -rf /"
subprocess.run(f'ls {user_input}', shell=True)

# ✅ Safe — arguments are escaped automatically
subprocess.run(['ls', user_input], shell=False)
```

### Pickle Deserialization
`pickle.loads()` can execute arbitrary code upon deserialization. Never unpickle data from an untrusted source.

```python
import pickle
import json

# ❌ Remote code execution risk
data = pickle.loads(untrusted_bytes)

# ✅ Use safe serialization format
data = json.loads(untrusted_string)
```

### SSRF via Unvalidated URLs
Passing user-supplied URLs to HTTP clients without validation enables Server-Side Request Forgery.

```python
# ❌ SSRF vulnerability
url = request.args.get('url')
httpx.get(url)

# ✅ Validate URL scheme and domain
from urllib.parse import urlparse
url = request.args.get('url')
parsed = urlparse(url)
if parsed.scheme in ('http', 'https') and parsed.hostname in ALLOWED_DOMAINS:
    httpx.get(url)
```

### Path Traversal
Concatenating user input into file paths allows attackers to escape directories using `../`.

```python
from pathlib import Path

# ❌ Path traversal
base_dir = Path("/var/www/html")
path = base_dir / user_supplied_path
content = path.read_text()

# ✅ Resolve and check containment
resolved = (base_dir / user_supplied_path).resolve()
if not resolved.is_relative_to(base_dir.resolve()):
    raise ValueError('Path traversal detected')
content = resolved.read_text()
```

### SQL Injection
Never use string formatting for SQL queries. Use parameterized queries provided by your database driver.

```python
# ❌ SQL injection
cursor.execute(f"SELECT * FROM users WHERE id = '{user_id}'")

# ✅ Parameterized query
cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
```

### SSL Verification
Never disable SSL verification in production (`verify=False`).

```python
# ❌ MitM vulnerability
import requests
requests.get("https://api.example.com", verify=False)

# ✅ Always verify (default behavior)
import httpx
httpx.get("https://api.example.com") 
```

### YAML Unsafe Loading
`yaml.load()` without specifying a safe loader can execute arbitrary Python code.

```python
import yaml

# ❌ Arbitrary code execution
data = yaml.load(untrusted_yaml)

# ✅ Safe loading
data = yaml.safe_load(untrusted_yaml)
```

## 5. Collections and Data Structure Best Practices

### `defaultdict` for Grouping
Avoid checking for key existence manually when grouping data.

```python
# ❌ Clunky key checking
groups = {}
for item in items:
    if item.category not in groups:
        groups[item.category] = []
    groups[item.category].append(item)

# ✅ Clean grouping
from collections import defaultdict
groups = defaultdict(list)
for item in items:
    groups[item.category].append(item)
```

### `Counter` for Frequency Counting
Use `collections.Counter` instead of manual iteration to count occurrences.

```python
# ❌ Manual counting
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1

# ✅ Counter usage
from collections import Counter
counts = Counter(words)
```

### Comprehension Abuse
List comprehensions should be readable. If they require multiple nested loops, complex conditionals, or spans multiple lines, use standard `for` loops.

```python
# ❌ Unreadable comprehension
result = [transform(x) for group in data for x in group.items if x.is_valid and x.priority > 3]

# ✅ Readable loop
result = []
for group in data:
    for x in group.items:
        if x.is_valid and x.priority > 3:
            result.append(transform(x))
```

### Shallow vs Deep Copy
`copy.copy()` creates a shallow copy (new container, same references). `copy.deepcopy()` recursively copies objects. Be explicit about which one you need to avoid unexpected mutations.

```python
import copy
original = [[1, 2], [3, 4]]

# ❌ Mutates original nested list
shallow = copy.copy(original)
shallow[0].append(99) 

# ✅ Safe from mutation
deep = copy.deepcopy(original)
```

### `dict.get()` with Default
Use `.get()` when you want to handle missing keys gracefully instead of handling `KeyError` or using `in`.

```python
# ❌ Verbose check
if 'key' in my_dict:
    val = my_dict['key']
else:
    val = 'default'

# ✅ Clean access
val = my_dict.get('key', 'default')
```

### `dict | dict` Merge (3.9+)
Use the merge operator `|` instead of older syntax.

```python
# ❌ Old style
merged = {**d1, **d2}
d1.update(d2)

# ✅ Modern syntax
merged = d1 | d2
```

### Set Operations for Membership Testing
Always use `set` or `frozenset` for O(1) membership testing (`in`). Lists are O(n).

```python
# ❌ O(n) lookup in list
ALLOWED = ['admin', 'user', 'guest']
if role in ALLOWED:
    pass

# ✅ O(1) lookup in set
ALLOWED = {'admin', 'user', 'guest'}
if role in ALLOWED:
    pass
```

### Unpacking with `*` and `**`
Use modern unpacking techniques to handle structured data cleanly.

```python
# ❌ Indexing manually
first = items[0]
rest = items[1:]

# ✅ Clean head/tail unpacking
first, *rest = items
```

## 6. String and Text Processing

### `str.join()` for Concatenation
Repeatedly appending to a string using `+` in a loop has O(n²) complexity due to repeated memory allocations. `str.join()` is O(n).

```python
# ❌ O(n²) — creates intermediate strings
result = ''
for item in items:
    result += str(item)

# ✅ O(n) — single allocation
result = ''.join(str(item) for item in items)
```

### f-string Best Practices
Prefer f-strings over `%` formatting and `.format()`. However, do not use f-strings in standard `logging` calls.

```python
import logging

# ❌ Eager evaluation even if log level is disabled
logging.debug(f"Computed expensive value: {heavy_computation()}")

# ✅ Lazy evaluation
logging.debug("Computed expensive value: %s", heavy_computation())
```

### Regex Compilation
If a regex pattern is used repeatedly in a loop, compile it once.

```python
import re

# ❌ Re-compiles on every iteration
for line in lines:
    if re.match(r'\d+', line):
        pass

# ✅ Compile once
pattern = re.compile(r'\d+')
for line in lines:
    if pattern.match(line):
        pass
```

### `str.removeprefix()` / `str.removesuffix()` (3.9+)
Use these explicit methods instead of string slicing or `.lstrip()`/`.rstrip()` which remove character sets, not substrings.

```python
# ❌ Error-prone slicing
if text.startswith("Bearer "):
    token = text[len("Bearer "):]

# ✅ Explicit semantics
token = text.removeprefix("Bearer ")
```

### Walrus Operator `:=` (3.8+)

The assignment expression (`:=`) lets you assign and test a value in a single step. Use it where it removes duplication and keeps the logic at the call site — not for cleverness.

```python
import re

# ✅ Conditional match + capture in one step (avoids re-running the regex)
if m := re.match(r"(\d+)-(\w+)", event_id):
    record_id, record_type = m.group(1), m.group(2)

# ✅ Chunked read loop without a sentinel
with open("data.bin", "rb") as f:
    while chunk := f.read(8192):
        process(chunk)

# ❌ Anti-pattern: walrus inside a comprehension filter
# Technically valid, but difficult to read — prefer an explicit loop
result = [y for x in data if (y := transform(x)) > 0]  # Harder to reason about

# ✅ Preferred: explicit loop for clarity
result = []
for x in data:
    y = transform(x)
    if y > 0:
        result.append(y)
```

## 7. Performance Invariants

### Quick Reference

| Anti-Pattern | Recommended | Why |
|---|---|---|
| `+` concatenation in loop | `str.join()` | O(n) vs O(n²) complexity |
| `list` for membership test | `set` or `frozenset` | O(1) vs O(n) lookup time |
| List comprehension for large data | Generator expression | Lazy evaluation, significantly less memory |
| `logging.info(f"...")` | `logging.info("...", arg)` | Avoids string formatting when log level is disabled |
| Re-compiling regex in loop | `re.compile()` outside loop | Avoids repeated compilation overhead |
| `global` variables | Function parameters or closures | Avoids global namespace lookup overhead |
| `**kwargs` when keys are known | Explicit parameters | Avoids dictionary creation overhead per call |
| Repeated attribute access in loop | Local variable assignment | Avoids repeated attribute lookup (`.` operator) |
| `list(range(n))` | `range(n)` directly | Avoids materializing the entire sequence in memory |
| `in` on `dict.keys()` | `in dict` directly | `.keys()` creates an unnecessary view object |

### `__slots__` for Memory-Heavy Classes
By default, Python objects use a dictionary (`__dict__`) to store instance attributes. For classes with millions of instances, defining `__slots__` drastically reduces memory footprint.

```python
# ✅ Memory efficient class
class Point:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

### Generator Pipelines
Chain generators for memory-efficient processing of large data sets.

```python
import json

# ✅ Memory-efficient pipeline (only one record in memory at a time)
def read_lines(path):
    with open(path) as f:
        yield from f

def parse(lines):
    for line in lines:
        yield json.loads(line)

def filter_active(records):
    for r in records:
        if r['active']:
            yield r

# Execution is lazy
for record in filter_active(parse(read_lines('data.jsonl'))):
    pass # process(record)
```

### `functools.cache` for Memoization
Use caching for expensive pure function calls.

```python
import functools

# ✅ Caches results of previous calls
@functools.cache
def expensive_computation(x):
    # compute...
    return x * x
```

### `collections.deque` for Queue Operations
Popping from the front of a list (`list.pop(0)`) requires shifting all other elements, making it O(n). Use `deque` for O(1) operations on both ends.

```python
from collections import deque

# ❌ O(n) operation
queue = [1, 2, 3]
item = queue.pop(0)

# ✅ O(1) operation
queue = deque([1, 2, 3])
item = queue.popleft()
```

## 8. Resilience Patterns (Timeout, Retry, Circuit Breaker)

### Retry with Exponential Backoff
Transient failures (network blips) should be retried automatically. Libraries like `tenacity` handle this cleanly.

```python
import tenacity
import httpx

# ✅ Retries up to 3 times, exponential backoff from 1s to 10s
@tenacity.retry(
    stop=tenacity.stop_after_attempt(3),
    wait=tenacity.wait_exponential(multiplier=1, min=1, max=10),
    retry=tenacity.retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException)),
)
async def fetch_with_retry(client, url):
    response = await client.get(url)
    response.raise_for_status()
    return response.json()
```

### Timeouts
Every external call (network, database, file system lock) must have an explicit timeout to prevent infinite hangs.

```python
# ❌ Can hang forever
async with httpx.AsyncClient() as client:
    response = await client.get(url)

# ✅ Explicit timeout
async with httpx.AsyncClient(timeout=10.0) as client:
    response = await client.get(url)
```

### Circuit Breaker
When a downstream service is struggling, hitting it repeatedly makes it worse. A circuit breaker fails fast after a threshold of errors.

```python
import pybreaker
import httpx

# ✅ Fails fast after 5 consecutive errors, recovers after 60s
breaker = pybreaker.CircuitBreaker(fail_max=5, reset_timeout=60)

@breaker
def call_external_service(url):
    response = httpx.get(url, timeout=5.0)
    response.raise_for_status()
    return response
```

### Idempotency
Operations should be safely retryable. For mutating operations (POST/PUT), use an idempotency key.

```python
# ✅ Idempotent request using a UUID
import uuid
async def charge_customer(client, amount, customer_id):
    idempotency_key = str(uuid.uuid4())
    headers = {"Idempotency-Key": idempotency_key}
    return await client.post(
        "/charge", json={"amount": amount, "customer": customer_id}, headers=headers
    )
```

### Graceful Shutdown
Handle `SIGTERM` and `SIGINT` to safely drain queues, close connections, and terminate async applications.

```python
import asyncio
import signal

# ✅ Graceful cancellation of tasks on shutdown
async def main():
    loop = asyncio.get_running_loop()
    stop = asyncio.Event()
    
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, stop.set)
        
    # Wait until a shutdown signal is received
    await stop.wait()
    
    # Perform cleanup...
```

### Bulkhead Pattern
Isolate failure domains using connection pools or `asyncio.Semaphore` to ensure one slow endpoint doesn't consume all system resources.

```python
import asyncio

# ✅ Limit concurrent requests to a specific external service
semaphore = asyncio.Semaphore(10)

async def limited_fetch(client, url):
    async with semaphore:
        return await client.get(url)
```

## 9. Structural Pattern Matching

`match`/`case` (Python 3.10+) replaces long `if`/`elif` chains when dispatching on the **shape** or **type** of data. Use it for structural dispatch — not as a simple value switch.

### Class Patterns with Guards

Match on a dataclass or object type, with optional `if` guards for additional conditions.

```python
from dataclasses import dataclass

@dataclass
class Click:
    x: int
    y: int

@dataclass
class KeyPress:
    key: str

def handle_event(event: Click | KeyPress) -> None:
    match event:
        case Click(x=x, y=y) if x < 0 or y < 0:
            raise ValueError(f"Click out of bounds: ({x}, {y})")
        case Click(x=x, y=y):
            process_click(x, y)
        case KeyPress(key="q" | "Q"):
            quit()
        case KeyPress(key=k):
            process_key(k)
```

### Sequence Destructuring

Match and unpack lists or tuples by structure, including head/tail patterns with `*rest`.

```python
def process_command(parts: list[str]) -> None:
    match parts:
        case ["quit"]:
            quit()
        case ["go", direction]:
            move(direction)
        case ["go", direction, *extra] if extra:
            raise ValueError(f"Too many args for 'go': {extra}")
        case _:
            raise ValueError(f"Unknown command: {parts}")
```

### Mapping Patterns (JSON/Event Dispatch)

Match on dict structure — useful when processing events, webhook payloads, or JSON messages.

```python
def handle_webhook(payload: dict) -> None:
    match payload:
        case {"event": "user.created", "data": {"id": int(user_id)}}:
            on_user_created(user_id)
        case {"event": "order.paid", "data": {"order_id": str(order_id), "amount": float(amount)}}:
            on_order_paid(order_id, amount)
        case {"event": event_type}:
            log.warning("unhandled_event", event_type=event_type)
        case _:
            raise ValueError("Malformed webhook payload")
```

### OR Patterns and Wildcard

Use `|` inside a case to match multiple alternatives; `_` as a catch-all.

```python
def classify(value: object) -> str:
    match value:
        case int() | float():
            return "number"
        case str():
            return "string"
        case list() | tuple():
            return "sequence"
        case _:
            return "other"
```

### Anti-Patterns

```python
# ❌ Anti-pattern: match/case as a simple value switch
# Use a dict dispatch or if/elif — match adds no clarity here
match status_code:
    case 200:
        return "OK"
    case 404:
        return "Not Found"
    case 500:
        return "Server Error"

# ✅ Preferred for simple value lookup
HTTP_MESSAGES = {200: "OK", 404: "Not Found", 500: "Server Error"}
return HTTP_MESSAGES.get(status_code, "Unknown")


# ❌ Anti-pattern: deeply nested match that obscures logic
# Extract guard predicates into named functions instead
match event:
    case Event(type="click", data=Data(x=x, y=y, meta=Meta(user=User(role="admin")))) if x > 0:
        pass  # too nested — hard to read and test

# ✅ Extract the guard to a named predicate
def is_admin_click(event: Event) -> bool:
    return (
        event.type == "click"
        and event.data.x > 0
        and event.data.meta.user.role == "admin"
    )

if is_admin_click(event):
    ...
```

## Related
- Python Idioms @.agents/skills/python-idioms/SKILL.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Security Principles @.agents/rules/security-principles.md
- Concurrency and Threading Principles @.agents/rules/concurrency-and-threading-principles.md
- Performance Optimization Principles @.agents/rules/performance-optimization-principles.md
- Resource and Memory Management Principles @.agents/rules/resources-and-memory-management-principles.md
