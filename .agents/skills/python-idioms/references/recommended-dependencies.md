---
name: Recommended Dependencies (Python)
description: Curated packages, starter configs (pyproject.toml, ruff, mypy, pytest), and version guidance for Python projects (August 2026).
---

# Recommended Dependencies (Python — August 2026)

> **Target Python version:** Python 3.13+
> **Default package manager:** `uv` (preferred), `pip` (fallback)
> **Last verified:** August 2026

## Core Stack

| Category | Package | Version | Notes |
|---|---|---|---|
| HTTP Framework | FastAPI | 0.115+ | Default modern framework; use Flask 3.x for legacy. |
| ASGI Server | uvicorn | 0.34+ | Standard choice for ASGI. |
| Validation | pydantic | 2.x | High-performance data validation. |
| Serialization | `json` / `orjson` | stdlib / latest | `json` stdlib, use `orjson` for performance critical paths. |
| Database | SQLAlchemy | 2.x | ORM/Query builder (async support); `asyncpg` for PostgreSQL. |
| Migrations | alembic | 1.x | Standard for SQLAlchemy migrations. |
| HTTP Client | httpx | 0.28+ | Replaces requests; supports sync and async. |
| Logging | structlog / `logging` | 24.x / stdlib | `structlog` for structured logging, `logging` stdlib otherwise. |
| Config | pydantic-settings | 2.x | Type-safe environment variable parsing. |
| CLI | typer | 0.15+ | Type-hint driven CLI (or `click` 8.x). |
| UUID | `uuid` | stdlib | Built-in UUID generation. |
| Date/Time | `datetime` / `python-dateutil` | stdlib / latest | `zoneinfo` (stdlib 3.9+) covers timezone needs. Use `python-dateutil` only for advanced date string parsing (`dateutil.parser.parse`). |
| Task Queue | celery / arq | 5.x / 0.26+ | `celery` for heavy workloads, `arq` for async-native lightweight tasks. |
| Env Loading | `python-dotenv` | 1.x | For `.env` files (or `pydantic-settings` which reads `.env` natively). |

## Testing

| Category | Package | Version | Notes |
|---|---|---|---|
| Test Runner | pytest | 8.x | Standard Python test runner. |
| Async Testing | pytest-asyncio | 0.25+ | For testing async code with pytest. |
| Mocking | pytest-mock | 3.x | Fixture for `unittest.mock`. |
| Property-Based | hypothesis | 6.x | Property-based testing framework. |
| Coverage | coverage | 7.x | Code coverage measurement. |
| Integration | testcontainers-python | 4.x | Docker-based integration testing. |
| Factories | factory-boy | 3.x | Object generation for tests. |
| HTTP Mocking | respx | 0.22+ | Mocking HTTP requests (specifically httpx). |
| Time Mocking | freezegun | 1.x | Time-travel / mock `datetime` for tests. |

> For test double selection guidance (hand-written fakes, pytest-mock, respx, parametrize, snapshots), see **SKILL.md § Testing**.

## Resilience & Networking

| Package | Version | Use Case |
|---|---|---|
| httpx | 0.28+ | Sync & async HTTP client. |
| tenacity | 9.x | Advanced retry with backoff. |
| stamina | 24.x | Simpler, more opinionated retry API built on tenacity. |

## Development Tooling

| Package | Purpose |
|---|---|
| ruff | Blazing fast formatting + linting (replaces black, isort, flake8). |
| mypy | Strict static type checking. |
| bandit | Security issue detection. |
| pip-audit | CVE scanning for dependencies. |
| pre-commit | Git hooks framework. |
| uv | Extremely fast Python package and environment manager. |

## Starter `pyproject.toml` Template

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-web-service"
version = "0.1.0"
description = "A modern Python web service."
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.7.0",
    "httpx>=0.28.0",
    "structlog>=24.4.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "ruff>=0.9.0",
    "mypy>=1.14.0",
    "bandit>=1.8.0",
]

[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "S", "B", "ANN", "PT", "SIM", "RUF", "C4", "DTZ", "T20", "PIE", "RET", "SLF", "ARG"]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101", "ANN"]

[tool.mypy]
strict = true
python_version = "3.13"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["src"]

[tool.bandit]
skips = ["B101"]

[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
show_missing = true
skip_empty = true
```

## ruff Rule Set Reference

| Prefix | Source | What It Checks |
|---|---|---|
| E/W | pycodestyle | PEP 8 style |
| F | pyflakes | Logical errors, unused imports |
| I | isort | Import ordering |
| N | pep8-naming | Naming conventions |
| UP | pyupgrade | Python version upgrades |
| S | flake8-bandit | Security issues |
| B | flake8-bugbear | Common bug patterns |
| ANN | flake8-annotations | Type annotation coverage |
| PT | flake8-pytest-style | Pytest best practices |
| SIM | flake8-simplify | Code simplification |
| RUF | ruff-specific | Ruff's own rules |
| C4 | flake8-comprehensions | Comprehension best practices |
| DTZ | flake8-datetimez | Timezone-aware datetime |
| T20 | flake8-print | No print() in production |
| PIE | flake8-pie | Misc. lint rules |
| RET | flake8-return | Return statement consistency |
| SLF | flake8-self | Private member access |
| ARG | flake8-unused-arguments | Unused function arguments |

## Version Pinning Policy

- Use `uv lock` or `pip-compile` for reproducible installs
- Commit lockfile for applications
- Use `>=X.Y,<Z` ranges in `pyproject.toml` for libraries
- Run `pip-audit` in CI
- Run `uv pip check` to verify dependency consistency

## Anti-Patterns

- ❌ Using `setup.py` or `setup.cfg` for new projects — use `pyproject.toml` (PEP 621)
- ❌ Using `flake8` + `isort` + `black` separately — `ruff` replaces all three
- ❌ Using `requests` for new async projects — use `httpx` (sync and async)
- ❌ Using `unittest.TestCase` — use `pytest` functions
- ❌ Using `logging.basicConfig()` in libraries — only configure logging in the application entry point
- ❌ Using `requirements.txt` as the sole dependency spec — use `pyproject.toml` with a lockfile
- ❌ Using virtualenvwrapper or pyenv-virtualenv — use `uv venv` or stdlib `venv`
- ❌ Using `pipenv` — use `uv` or `pip-tools`
- ❌ Using `pydantic` v1 API in new projects — use v2 with `model_config = ConfigDict(...)`

## Related

- Python Idioms @.agents/skills/python-idioms/SKILL.md
- Django Idioms @.agents/skills/django-idioms/SKILL.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
