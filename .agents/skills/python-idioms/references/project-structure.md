## Python Backend Layout

Use this structure for Python backend applications. The vertical slice principle applies — features are packages, not technical layers.

```
apps/
  backend/                          # Backend application source code
    pyproject.toml                  # Project metadata, dependencies, tool configs
    alembic/                        # Database migrations (if using SQLAlchemy + Alembic)
      alembic.ini
      env.py
      versions/
        001_create_tasks_table.py
    src/
      yourapp/                      # Importable package (src-layout, preferred)
        py.typed                    # PEP 561 marker: signals mypy to read types from this package
        main.py                     # Entry point: creates app, wires dependencies, starts server
        platform/                   # Foundational technical concerns (the "Framework")
          database.py               # DB engine and session factory
          server.py                 # ASGI app setup (FastAPI/Starlette router, middleware)
          logger.py                 # structlog / logging configuration
          config.py                 # Settings (pydantic-settings BaseSettings)
        features/                   # Business Features (Vertical Slices)
          task/                     # Task management
            __init__.py
            conftest.py             # Shared fixtures scoped to this feature's tests

            # --- Public API ---
            service.py              # TaskService class (public API of this feature)

            # --- Delivery (HTTP) ---
            router.py               # FastAPI APIRouter with HTTP endpoints
            schemas.py              # Pydantic request/response models (API boundary only)
            test_router.py          # Component tests (TestClient + mock service)

            # --- Domain (Business Logic) ---
            logic.py                # Pure domain functions (no I/O)
            models.py               # Domain dataclasses (Task, Priority, etc.)
            errors.py               # Feature-specific exceptions
            test_logic.py           # Unit tests (pure functions — no mocks needed)

            # --- Storage (Data Access) ---
            storage.py              # TaskStorage Protocol (interface)
            storage_pg.py           # PostgreSQL implementation (asyncpg / SQLAlchemy)
            storage_mock.py         # InMemoryTaskStorage (test implementation)
            test_storage_pg.py      # Integration tests (real DB via testcontainers)

          order/                    # Order management
            service.py
            router.py
            schemas.py
            logic.py
            models.py
            storage.py
            storage_pg.py
            storage_mock.py
            ...
    conftest.py                     # Root-level fixtures shared across all features (e.g. app client, DB session)
    tests/                          # Optional: top-level E2E tests (cross-feature boundaries)
      e2e/
        test_create_task_api.e2e.py
```

**Key Python conventions:**

- **`src/` layout** is strongly preferred — prevents accidental imports of the development tree and matches packaging best practices (PEP 517 / `pypa/build`)
- **`pyproject.toml`** is the single configuration file for `ruff`, `mypy`, `pytest`, `bandit`, and packaging metadata — do not create `setup.cfg`, `.flake8`, or `mypy.ini` files
- **`py.typed`** is a zero-byte marker file (PEP 561) that signals to `mypy` and downstream consumers that this package ships type information. Add it to the package root for any library or published service.
- **Feature packages** use `__init__.py` — keep it empty or use it solely to re-export the feature's public API
- **`platform/`** holds technical infrastructure that features depend on (database sessions, configuration, logging); features never import each other's `platform/` code directly
- **Tests co-locate** with the code they test (`test_*.py` in the same directory) except for E2E tests which go in `tests/e2e/`
- **`conftest.py` placement:** place at the project root for fixtures shared across all features (app instance, database session factory, auth headers); place at the feature level for fixtures scoped to that feature only. Pytest discovers `conftest.py` by walking up the directory tree.
- **`storage_mock.py`** is a production-quality in-memory implementation of the `Storage` Protocol, not a `unittest.Mock` — it is the recommended test double for unit tests of business logic and component tests of routers. Use `pytest-mock` (`mocker.patch`) when you need to verify call counts or argument matching against a third-party library or adapter that you cannot replace via dependency injection.

### Dependency Wiring (main.py)

```python
# src/yourapp/main.py
from yourapp.platform.database import create_engine
from yourapp.platform.server import create_app
from yourapp.features.task.storage_pg import PostgresTaskStorage
from yourapp.features.task.service import TaskService
from yourapp.features.task.router import build_router as build_task_router

def create_application() -> FastAPI:
    engine = create_engine()
    task_storage = PostgresTaskStorage(engine=engine)
    task_service = TaskService(storage=task_storage)

    app = create_app()
    app.include_router(build_task_router(service=task_service))
    return app

app = create_application()
```

### Configuration (platform/config.py)

```python
# src/yourapp/platform/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    debug: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

def get_settings() -> Settings:
    return Settings()
```

### pyproject.toml Baseline

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "yourapp"
requires-python = ">=3.13"

[tool.hatch.build.targets.wheel]
packages = ["src/yourapp"]

[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "S", "B", "ANN", "PT", "SIM", "RUF", "C4", "DTZ", "T20", "PIE", "RET", "SLF", "ARG"]

[tool.mypy]
strict = true
python_version = "3.13"

[tool.pytest.ini_options]
testpaths = ["src"]
asyncio_mode = "auto"

[tool.bandit]
skips = ["B101"]   # assert statements allowed in test files
```

### Related Principles
- Project Structure @.agents/rules/project-structure.md (core philosophy)
- Python Idioms and Patterns @../SKILL.md (coding idioms, error handling, naming)
- Recommended Dependencies @recommended-dependencies.md (curated packages, starter configs)
