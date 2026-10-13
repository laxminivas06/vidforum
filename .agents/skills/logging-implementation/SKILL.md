---
name: logging-implementation
description: >-
  Structured logging implementation patterns: log levels, mandatory context fields
  (correlationId, userId, duration), security (PII scrubbing), and per-language library
  choices (Go slog, TypeScript pino, Python structlog). Load when implementing logging
  in any operation entry point. Prerequisite: logging-and-observability-mandate.md.
---

## Logging and Observability Principles

> **⚠️ Prerequisite:** All operations MUST be logged per Logging and Observability Mandate @.agents/rules/logging-and-observability-mandate.md. This guide provides implementation patterns only.


### Logging Standards

#### Log Levels (Standard Priority)

Use consistent log levels across all services:

| Level     | When to Use                             | Examples                                                 |
| --------- | --------------------------------------- | -------------------------------------------------------- |
| **TRACE** | Extremely detailed diagnostic info      | Function entry/exit, variable states (dev only)          |
| **DEBUG** | Detailed flow for debugging             | Query execution, cache hits/misses, state transitions    |
| **INFO**  | General informational messages          | Request started, task created, user logged in            |
| **WARN**  | Potentially harmful situations          | Deprecated API usage, fallback triggered, retry attempt  |
| **ERROR** | Error events that allow app to continue | Request failed, external API timeout, validation failure |
| **FATAL** | Severe errors causing shutdown          | Database unreachable, critical config missing            |

#### Logging Rules

**1. Every request/operation must log:**
```

// Start of operation
log.Info("creating task",
"correlationId", correlationID,
"userId", userID,
"title", task.Title,
)

// Success
log.Info("task created successfully",
"correlationId", correlationID,
"taskId", task.ID,
"duration", time.Since(start),
)

// Error
log.Error("failed to create task",
"correlationId", correlationID,
"error", err,
"userId", userID,
)

```

**2. Always include context:**
- `correlationId`: Trace requests across services (UUID)
- `userId`: Who triggered the action
- `duration`: Operation timing (milliseconds)
- `error`: Error details (if failed)


**3. Structured logging only** (no string formatting):
```

// ✅ Structured
log.Info("user login", "userId", userID, "ip", clientIP)

// ❌ String formatting
log.Info(fmt.Sprintf("User %s logged in from %s", userID, clientIP))

```

**4. Security - Never log:**
- Passwords or password hashes
- API keys or tokens
- Credit card numbers
- PII in production logs (email/phone only if necessary and sanitized)
- Full request/response bodies (unless DEBUG level in non-prod)

**5. Performance - Never log in hot paths:**
- Inside tight loops
- Per-item processing in batch operations (use summary instead)
- Synchronous logging in latency-critical paths

**Best Practice:** "Use logger middleware redaction (e.g., pino-redact, zap masking) rather than manual string manipulation."

#### Language-Specific Implementations

##### Go (using slog standard library)
```

import "log/slog"

// Configure logger
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
  Level: slog.LevelInfo, // Production default
}))

// Usage
logger.Info("operation started",
  "correlationId", correlationID,
  "userId", userID,
)

logger.Error("operation failed",
  "correlationId", correlationID,
  "error", err,
  "retryCount", retries,
)

```

##### TypeScript/Node.js (using pino)
```

import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

logger.info({
  correlationId,
  userId,
  duration: Date.now() - startTime,
}, 'task created successfully');

logger.error({
  correlationId,
  error: err.message,
  stack: err.stack,
}, 'failed to create task');

```

##### Python (using structlog)

**Setup — configure once at application startup:**
```python
import contextvars
import logging
import structlog

# Async-safe correlation ID propagation via contextvars (NOT thread-locals)
correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "correlation_id", default=""
)

def add_correlation_id(
    logger: structlog.types.WrappedLogger,
    method_name: str,
    event_dict: structlog.types.EventDict,
) -> structlog.types.EventDict:
    """Injects the current context's correlation_id into every log entry."""
    if cid := correlation_id_var.get():
        event_dict["correlation_id"] = cid
    return event_dict

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,   # merge bind_contextvars() calls
        add_correlation_id,                         # inject from ContextVar
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # Development: pretty console; Production: JSON
        structlog.dev.ConsoleRenderer()             # swap for JSONRenderer() in prod
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)
```

**ASGI Middleware — set correlation_id at the request boundary:**
```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        cid = request.headers.get("X-Correlation-Id") or str(uuid.uuid4())
        token = correlation_id_var.set(cid)
        try:
            response = await call_next(request)
            response.headers["X-Correlation-Id"] = cid
            return response
        finally:
            correlation_id_var.reset(token)  # always restore context

# Register in app startup:
# app.add_middleware(CorrelationIdMiddleware)
```

**Usage in handlers and services:**
```python
import structlog

logger = structlog.get_logger()

# correlation_id is automatically included via the ContextVar processor
logger.info("task_created",
    user_id=user_id,
    task_id=task.id,
    duration_ms=elapsed_ms,
)

logger.error("task_creation_failed",
    user_id=user_id,
    error=str(err),
)
```

> **Why `contextvars` not thread-locals?** Thread-locals are unsafe in async code — coroutines can switch context between `await` points. `contextvars.ContextVar` is propagated correctly across `await` boundaries and `asyncio.create_task()` calls, making it the only correct approach for async Python logging.

##### Rust (using tracing + tracing-subscriber)

**Basic tracing setup with subscriber configuration:**
```rust
use tracing_subscriber::EnvFilter;

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .json() // Production: JSON format
        .with_target(true)
        .with_thread_ids(true)
        .init();
}
```

**Environment-specific config (dev vs prod):**
```rust
fn init_tracing(env: &str) {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    match env {
        "development" => {
            tracing_subscriber::fmt()
                .with_env_filter(EnvFilter::new("debug"))
                .pretty() // Pretty-printed for dev
                .init();
        }
        _ => {
            tracing_subscriber::fmt()
                .with_env_filter(filter)
                .json() // JSON for staging/prod
                .with_target(true)
                .init();
        }
    }
}
```

**Structured logging with operation context (using #[instrument]):**
```rust
use tracing::{info, error, instrument};
use uuid::Uuid;

#[instrument(
    skip(service),
    fields(correlation_id = %Uuid::new_v4(), user_id = %user_id)
)]
pub async fn create_task(
    service: &TaskService,
    user_id: &str,
    request: CreateTaskRequest,
) -> Result<Task, AppError> {
    info!(title = %request.title, "creating task");
    let start = std::time::Instant::now();

    let task = service.create(request).await.map_err(|e| {
        error!(error = %e, "failed to create task");
        e
    })?;

    info!(
        task_id = %task.id,
        duration_ms = start.elapsed().as_millis() as u64,
        "task created successfully"
    );
    Ok(task)
}
```

**Propagating spans across async tasks:**
```rust
use tracing::Instrument;

// ✅ Propagate trace context into spawned tasks
tokio::spawn(
    async move { process_background_job(job_id).await }
        .instrument(tracing::info_span!("background_job", job_id = %job_id))
);
```

> For async runtime debugging (task starvation, blocked tasks), use `tokio-console` with `console-subscriber`. For distributed tracing, bridge `tracing` to OpenTelemetry via `tracing-opentelemetry`.

##### Log Patterns by Operation Type

##### API Request/Response
```

// Request received
log.Info("request received",
  "method", r.Method,
  "path", r.URL.Path,
  "correlationId", correlationID,
  "userId", userID,
)

// Request completed
log.Info("request completed",
  "correlationId", correlationID,
  "status", statusCode,
  "duration", duration,
)

```

##### Database Operations
```

// Query start (DEBUG level)
log.Debug("executing query",
  "correlationId", correlationID,
  "query", "SELECT * FROM tasks WHERE user_id = $1",
)

// Query success (DEBUG level)
log.Debug("query completed",
  "correlationId", correlationID,
  "rowsReturned", len(results),
  "duration", duration,
)

// Query error (ERROR level)
log.Error("query failed",
  "correlationId", correlationID,
  "error", err,
  "query", "SELECT * FROM tasks WHERE user_id = $1",
)

```

##### External API Calls
```

// Call start
log.Info("calling external API",
  "correlationId", correlationID,
  "service", "email-provider",
  "endpoint", "/send",
)

// Retry (WARN level)
log.Warn("retrying external API call",
  "correlationId", correlationID,
  "service", "email-provider",
  "attempt", retryCount,
  "error", err,
)

// Circuit breaker open (WARN level)
log.Warn("circuit breaker opened",
  "correlationId", correlationID,
  "service", "email-provider",
  "failureCount", failures,
)

```

##### Background Jobs
```

// Job start
log.Info("job started",
  "jobId", jobID,
  "jobType", "email-digest",
)

// Progress (INFO level - periodic, not per-item)
log.Info("job progress",
  "jobId", jobID,
  "processed", 1000,
  "total", 5000,
  "percentComplete", 20,
)

// Job complete
log.Info("job completed",
  "jobId", jobID,
  "duration", duration,
  "itemsProcessed", count,
)

```

##### Error Scenarios
```

// Recoverable error (ERROR level)
log.Error("validation failed",
  "correlationId", correlationID,
  "userId", userID,
  "error", "invalid email format",
  "input", sanitizedInput, // Sanitized!
)

// Fatal error (FATAL level)
log.Fatal("critical dependency unavailable",
  "error", err,
  "dependency", "database",
  "action", "shutting down",
)

```

#### Environment-Specific Configuration

| Environment     | Level | Format           | Destination             |
| --------------- | ----- | ---------------- | ----------------------- |
| **Development** | DEBUG | Pretty (colored) | Console                 |
| **Staging**     | INFO  | JSON             | Stdout → CloudWatch/GCP |
| **Production**  | INFO  | JSON             | Stdout → CloudWatch/GCP |

**Configuration (Go example):**
```go

func configureLogger() *slog.Logger {
var handler slog.Handler

    level := slog.LevelInfo
    if os.Getenv("ENV") == "development" {
        level = slog.LevelDebug
        handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
            Level: level,
        })
    } else {
        handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level: level,
        })
    }
    
    return slog.New(handler)
    }

```

**Configuration (Rust example):**
```rust
fn configure_logger() {
    let env = std::env::var("ENV").unwrap_or_else(|_| "development".into());
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    if env == "development" {
        tracing_subscriber::fmt()
            .with_env_filter(tracing_subscriber::EnvFilter::new("debug"))
            .pretty()
            .init();
    } else {
        tracing_subscriber::fmt()
            .with_env_filter(filter)
            .json()
            .init();
    }
}
```

#### Testing Logs

**Unit tests:** Capture and assert on log output
```

// Go example
func TestUserLogin(t *testing.T) {
var buf bytes.Buffer
logger := slog.New(slog.NewJSONHandler(&buf, nil))

    // Test operation
    service := NewUserService(logger, mockStore)
    err := service.Login(ctx, email, password)
    
    // Assert logs
    require.NoError(t, err)
    logs := buf.String()
    assert.Contains(t, logs, "user login successful")
    assert.Contains(t, logs, email)
    }

```

#### Monitoring Integration

**Correlation IDs:**
- Generate at ingress (API gateway, first handler)
- Propagate through all services
- Include in all logs, errors, and traces
- Format: UUID v4

**Log aggregation:**
- Ship to centralized system (CloudWatch, GCP Logs, Datadog)
- Index by: correlationId, userId, level, timestamp
- Alert on ERROR/FATAL patterns
- Dashboard: request rates, error rates, latency

#### Checklist for Every Feature

- [ ] All public operations log INFO on start
- [ ] All operations log INFO/ERROR on complete/failure
- [ ] All logs include correlationId
- [ ] No sensitive data in logs
- [ ] Structured logging (key-value pairs)
- [ ] Appropriate log level used
- [ ] Error logs include error details
- [ ] Performance-critical paths use DEBUG level

### Related Principles
- Logging and Observability Mandate @.agents/rules/logging-and-observability-mandate.md
- Monitoring and Alerting Principles @.agents/rules/monitoring-and-alerting-principles.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md
- API Design Principles @.agents/rules/api-design-principles.md
