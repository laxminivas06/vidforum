---
name: python-idioms
description: >-
  Modern Python (3.11+) idioms: type annotations, typing Protocols, Pydantic models, asyncio, pytest fixtures, and Ruff/Mypy strict compliance. Use when writing, refactoring, or reviewing Python applications, APIs, or scripts.
---

## Python Idioms and Patterns

### Core Philosophy

Python rewards explicitness and readability over cleverness. Follow the Zen of Python. If it reads like plain English, it's probably idiomatic.

> **Scope**: This skill covers Python-specific coding idioms. For file layout see `references/project-structure.md`. For safety/SAST/performance patterns see `references/python-patterns-and-anti-patterns.md`. For logging see `logging-implementation` skill. For quality commands see `code-idioms-and-conventions` rule.

### Loading Guards

- If no `pyproject.toml` or `*.py` files, this skill does not apply
- If Django project (`django` in dependencies), co-load `django-idioms` skill alongside this one

### When to Load References

| Situation | Reference to Load |
|---|---|
| Starting a new project or setting up file layout | `references/project-structure.md` |
| Choosing packages, `pyproject.toml` setup, or ruff config | `references/recommended-dependencies.md` |
| Writing code that handles user input, async operations, or I/O | `references/python-patterns-and-anti-patterns.md` |

### Toolchain and Python Version

- Default to latest stable Python. As of August 2026, Python 3.14. Minimum target: 3.13+.
- Key version milestones:
  - **3.14+** — Deferred evaluation of annotations (PEP 649, no more `from __future__ import annotations`), template strings (PEP 750)
  - **3.13+** — Improved error messages, experimental free-threaded build, experimental JIT
  - **3.12+** — Type parameter syntax `type X = ...` (PEP 695), `@override` decorator, improved f-strings, `itertools.batched`
  - **3.11+** — `StrEnum`, `ExceptionGroup` + `except*`, `asyncio.TaskGroup`, `tomllib`, fine-grained error locations
  - **3.10+** — Pattern matching (`match`/`case`), `X | Y` union syntax, `TypeAlias`

### Type Hints — Non-Negotiable

Type hints are required for all public APIs, class attributes, and function signatures.

- Use standard collections (`list`, `dict`, `set`) for typing, not `typing.List` etc.
- Use `X | Y` instead of `Union[X, Y]` or `Optional[X]`.
- Use PEP 695 type parameter syntax (3.12+) for generic types: `type Vector[T] = list[T]`
- Use `@override` (3.12+) to ensure methods actually override a base class method.
- Use `TypeVar` with constraints and bounds when necessary.
- Use `Never` for functions that always raise an exception or never return.

```python
# ❌ Anti-pattern: Untyped or legacy typing
from typing import List, Optional, TypeVar

T = TypeVar('T')

def process_items(items: List[T], strict: Optional[bool] = None) -> List[T]: ...

class Worker(BaseWorker):
    def run(self): ... # Overrides base class? Maybe.
```

```python
# ✅ Recommended pattern: Modern typing syntax
from typing import override, Never

type Vector[T] = list[T]

def process_items[T](items: Vector[T], strict: bool | None = None) -> Vector[T]: ...

class Worker(BaseWorker):
    @override
    def run(self) -> None: ...

def crash_and_burn(msg: str) -> Never:
    raise RuntimeError(msg)
```

**Protocols for Structural Subtyping**
Define required behavior via `Protocol` instead of inheritance when depending on abstractions.

**TypedDict for JSON/Dict payloads**
When dealing with dictionaries that have a fixed schema, use `TypedDict`.

### Error Handling

- Raise specific exceptions, not generic `Exception`.
- Build a domain-specific exception hierarchy (e.g. `AppError` base class).
- Never explicitly silence errors without handling or logging (`except Exception: pass`). Use `contextlib.suppress()` if appropriate and intentional.
- Use exception groups and `except*` (3.11+) when multiple errors can occur simultaneously.
- Use `add_note()` (3.11+) to attach additional context to exceptions before re-raising.
- **Pattern:** Never assign the result of functions that return `None` (DeepSource bug risk).
- **Pattern:** `finally` blocks should not swallow exceptions; they are for cleanup only.

```python
# ❌ Anti-pattern: Broad except, swallowing errors, assigning None
def load_data():
    try:
        data = fetch()
        return data
    except Exception as e:
        print(f"Failed: {e}")
        
    finally:
        return None # Swallows exception!

res = dict.get("key") # Might return None, then what?
```

```python
# ✅ Recommended pattern: Specific exceptions, exception groups, add_note
class AppError(Exception): pass
class NetworkError(AppError): pass

def load_data() -> dict:
    try:
        return fetch()
    except TimeoutError as e:
        e.add_note("Timeout while fetching external data")
        raise NetworkError("Failed to fetch") from e

# Exception groups (3.11+)
try:
    raise ExceptionGroup("Multiple failures", [NetworkError(), ValueError()])
except* NetworkError as e:
    handle_network(e)
except* ValueError as e:
    handle_value(e)
```

### Dataclasses and Pydantic

- Use `@dataclass` for internal data structures.
- Use `@dataclass(frozen=True, slots=True)` (3.10+) as the recommended default for value objects. `slots=True` avoids `__dict__` creation, saving memory and speeding up attribute access.
- Use `@dataclass(kw_only=True)` (3.10+) to require keyword arguments.
- Use Pydantic `BaseModel` when data crosses system boundaries (I/O, APIs, config) and requires validation.
- Use Pydantic v2 `model_validator` and `field_validator` for complex validation rules.

```python
# ✅ Recommended pattern: Dataclasses
from dataclasses import dataclass

@dataclass(frozen=True, slots=True, kw_only=True)
class UserConfig:
    id: int
    username: str
    active: bool = True
```

```python
# ✅ Recommended pattern: Pydantic Validation
from pydantic import BaseModel, field_validator, model_validator

class User(BaseModel):
    password: str
    password_confirm: str

    @model_validator(mode="after")
    def check_passwords_match(self) -> "User":
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self
```

**When to use which:**

| Use Case | Recommendation |
|---|---|
| Untrusted / external data (API input, config files, webhook payloads) | `pydantic.BaseModel` |
| Internal value objects, domain entities (no validation needed) | `@dataclass(frozen=True, slots=True)` |
| Dictionary-shaped typed data (JSON response shapes, kwargs mappings) | `TypedDict` |
| Named string or integer constants | `enum.StrEnum` / `enum.IntEnum` |

### Interfaces and Dependency Injection

Prefer composition and dependency injection over deep inheritance hierarchies. Depend on `typing.Protocol` to define the interface a function or class expects.

```python
# ✅ Recommended pattern: Dependency Injection with Protocols
from typing import Protocol

class MessageSender(Protocol):
    def send(self, msg: str) -> None: ...

class EmailSender:
    def send(self, msg: str) -> None:
        pass # Implementation

def notify_user(sender: MessageSender) -> None:
    sender.send("Hello")
```

### Async / Await

- Use `asyncio.TaskGroup` (3.11+) as the preferred way to run concurrent tasks over `asyncio.gather`. It provides structured concurrency and better error handling.
- Use `asyncio.Runner` (3.11+) for managing the event loop lifecycle instead of raw `get_event_loop()`.
- **Never** call `asyncio.run()` from inside an already running event loop.
- Use `asyncio.to_thread()` to offload blocking/CPU-bound work to a thread pool so the event loop is not blocked.

```python
# ❌ Anti-pattern: Unstructured concurrency
import asyncio

async def main():
    await asyncio.gather(task1(), task2()) # Errors in one task don't cancel the other easily
```

```python
# ✅ Recommended pattern: Structured concurrency with TaskGroup
import asyncio

async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            task1 = tg.create_task(fetch_data())
            task2 = tg.create_task(process_data())
        # tg automatically waits for all tasks. If one fails, others are cancelled.
    except* Exception as e:
        print(f"Task group failed: {e}")
```

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Variables, Functions, Methods | snake_case | `calculate_total()` |
| Classes, Protocols, TypeAliases | PascalCase | `UserRepository` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Protected/Private members | _leading_underscore | `_internal_cache` |
| Dunder methods | \_\_dunder\_\_ | `__init__` |

- Be descriptive. `fetch_user_by_id(user_id: int)` is better than `get_u(i)`.

### Idiomatic Patterns

- **Context Managers:** Use `with` statements for resource management (files, network connections, locks).
- **Generators:** Use `yield` for lazy evaluation and memory efficiency when dealing with large sequences.
- **`dataclasses.replace`:** Use for immutable updates to dataclasses.
- **`functools.cache` / `lru_cache`:** Use for memoizing expensive deterministic function calls.
- **`__slots__`:** Use via `@dataclass(slots=True)` or explicitly to save memory on heavily instantiated classes.
- **`StrEnum`:** (3.11+) Use for string-based enumerations.
- **Pattern Matching (3.10+):** Use `match`/`case` for structural pattern matching instead of long `if/elif/else` chains.
- **String Affixes (3.9+):** Use `str.removeprefix()` and `str.removesuffix()` instead of error-prone slicing or `strip()`.
- **Dict Merge Operator (3.9+):** Use `dict1 | dict2` to merge dictionaries.
- **Walrus Operator `:=`:** Use for assignment expressions to avoid repeating expensive calls or improving loop conditions.
- **`itertools.batched` (3.12+):** Use to cleanly chunk iterables into batches.
- **`pathlib.Path`:** ALWAYS prefer over `os.path` for file operations.
- **Mutable Defaults:** NEVER use mutable default arguments (`[]`, `{}`). Use `None` as a sentinel. (DeepSource #1 bug risk)

```python
# ❌ Anti-pattern: Mutable default argument
def add_item(item: str, items: list = []) -> list:
    items.append(item)
    return items

# ✅ Recommended pattern: None sentinel
def add_item(item: str, items: list | None = None) -> list:
    if items is None:
        items = []
    items.append(item)
    return items
```

```python
# ✅ Recommended pattern: Pattern matching & itertools.batched
import itertools

def process(command: dict | list):
    match command:
        case {"action": "delete", "id": int(id_val)}:
            delete_record(id_val)
        case list(items):
            for batch in itertools.batched(items, 100):
                process_batch(batch)
```

### Testing

Write deterministic tests focusing on behavior.
- Test coverage non-negotiable policy (same as Rust/TS).
- Coverage commands: `pytest --cov=src --cov-report=term-missing`
- Prefer `@pytest.mark.parametrize` for data-driven testing.
- Use `pytest-asyncio` for async tests.
- Use typed mock factories or fixtures instead of `patch` decorators when possible.

**Test Double Selection Table:**

| Approach | When to Use |
|---|---|
| Hand-written fake (implement Protocol) | Simple interface, few methods, need stateful behavior |
| `pytest-mock` (mocker fixture) | Verify call counts, argument matching |
| `respx` | HTTP boundary mocking — intercepts httpx calls |
| `@pytest.mark.parametrize` | Same logic, multiple input/output pairs |
| Snapshot (`syrupy`) | Large outputs — JSON responses, CLI output |
| `hypothesis` | Property-based testing for wide input spaces |

### Lint Suppression Policy

**NEVER suppress these — they signal structural problems:**

| Rule | What It Signals | What To Do Instead |
|---|---|---|
| `F841` (unused variable) | Dead code | Remove the variable |
| `S` rules (security) | Security vulnerability | Fix the vulnerability |
| `B006` (mutable default) | Shared mutable state bug | Use `None` sentinel pattern |
| `ANN` (missing annotations) | Untyped public API | Add type annotations |
| `E712` (`== True/False/None`) | Identity vs equality confusion | Use `is` / `is not` |

**Acceptable suppressions (with mandatory `# noqa:` + reason comment):**

| Rule | When Acceptable |
|---|---|
| `S101` (assert) | In test files only |
| `ANN101`/`ANN102` (self/cls annotations) | Standard convention — self/cls never need annotations |
| `T20` (print) | In CLI tools or scripts |
| `ARG` (unused argument) | In interface implementations where signature is fixed |

**Rule of thumb:** If you're about to write `# noqa:`, stop and ask: "Am I suppressing a real design problem?"

### Formatting and Static Analysis — Feedback Loop

Adopt the standard Rust/TS-style static analysis workflow:

| Phase | Command | Purpose |
|---|---|---|
| TDD / rapid iteration | `mypy src/ --strict` | Type-check only — fastest feedback |
| Pre-commit | `ruff check . --fix` | Lint — must pass with **zero warnings** |
| Pre-commit | `ruff format .` | Formatting — non-negotiable |
| Pre-commit | `pytest` | Unit tests — must all pass |
| Coverage verification | `pytest --cov=src --cov-report=term-missing` | Verify before merging |
| Security audit | `bandit -r src/ -c pyproject.toml` | Security scanning |
| Dependency audit | `pip-audit` | CVE scanning |

Configure all tools in `pyproject.toml` — never use per-file pragma comments to disable checks without a `# noqa:` reason comment.

Never use `print()` in production. Always use a configured logger (see `logging-implementation` skill).

### Documentation

**Document all public items:**
- Every public function, class, method, and module MUST have a docstring.
- Use Google-style docstrings (recommended) or NumPy-style (for scientific code).
- At minimum: one-line summary. For complex items: summary + Args + Returns + Raises.

```python
# ❌ Anti-pattern: Undocumented public API
def calculate_discount(price: float, rate: float) -> float:
    return price * (1 - rate)
```

```python
# ✅ Recommended pattern: Documented public API
def calculate_discount(price: float, rate: float) -> float:
    """Calculates the final price after applying a discount rate.

    Args:
        price: The original price.
        rate: The discount rate as a decimal (e.g., 0.2 for 20%).

    Returns:
        The final discounted price.
        
    Raises:
        ValueError: If the rate is not between 0.0 and 1.0.
    """
    if not (0.0 <= rate <= 1.0):
        raise ValueError("Rate must be between 0.0 and 1.0")
    return price * (1 - rate)
```

### Dependency Management

1. Minimize dependency count — each dependency is an attack surface.
2. Audit regularly — run `pip-audit` in CI.
3. Use `pyproject.toml` as the single source of truth for project metadata.
4. Commit lockfiles for applications (`uv.lock`, `requirements.lock`).
5. Prefer stdlib over third-party when feature parity exists.
6. Check for unused dependencies with import analysis.

> For the full curated dependency list with versions, see `references/recommended-dependencies.md`.

### Configuration and Environment

1. Never scatter `os.environ` / `os.getenv()` calls throughout the codebase.
2. Use pydantic-settings `BaseSettings` for validated, typed config.
3. Fail fast on missing required config at boot, not at first use.

```python
# ❌ Anti-pattern: Scattered os.getenv calls
import os

def connect_db():
    db_url = os.getenv("DATABASE_URL") # Fails later if missing
    # connect...
```

```python
# ✅ Recommended pattern: Centralized typed config
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    api_key: str

# Fails immediately at startup if env vars are missing or invalid
settings = Settings() 

def connect_db():
    db_url = settings.database_url
    # connect...
```

### Safety, Security, and Performance

- **Key safety rules (non-negotiable):** 
  - Never use `eval()` or `exec()` with untrusted input.
  - Never use `pickle` on untrusted data.
  - Always parameterize SQL queries; never concatenate strings to build SQL.
  - Always validate user input at system boundaries.
- See `references/python-patterns-and-anti-patterns.md` for the full catalog of safety and security patterns.
- See `perf-optimization` skill for profiling and performance guidance.

### Related Principles

- Code Idioms and Conventions `@code-idioms-and-conventions.md`
- Project Structure — Python Backend `@references/project-structure.md`
- Security Principles `@security-principles.md`
- Architectural Patterns — Testability-First Design `@architectural-pattern.md`
- Testing Strategy `@testing-strategy.md`
- Error Handling Principles `@error-handling-principles.md`
- Core Design Principles § Concurrency `@core-design-principles.md`
- Logging and Observability Mandate `@logging-and-observability-mandate.md`
- Logging Implementation `@.agents/skills/logging-implementation/SKILL.md`
- Django Idioms `@.agents/skills/django-idioms/SKILL.md`
- Testability Patterns `@.agents/skills/testability-patterns/SKILL.md`
- Concurrency and Threading Principles `@concurrency-and-threading-principles.md`
- Performance Optimization Principles `@performance-optimization-principles.md`
- Resource and Memory Management Principles `@resources-and-memory-management-principles.md`
- Security Mandate `@security-mandate.md`
- Dependency Management Principles `@dependency-management-principles.md`
- Recommended Dependencies `@references/recommended-dependencies.md`
- Python Patterns and Anti-Patterns `@references/python-patterns-and-anti-patterns.md`
