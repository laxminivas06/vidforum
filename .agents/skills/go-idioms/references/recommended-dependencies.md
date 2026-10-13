---
name: Recommended Dependencies (Go)
description: A curated list of recommended Go modules and tooling for new Go projects (August 2026).
---

# Recommended Dependencies (Go — August 2026)

> **Target:** Go 1.24+. All modules below are actively maintained, widely adopted, and represent the community-recommended choices as of August 2026. Always check pkg.go.dev for the latest version.
>
> **Go stdlib-first philosophy:** Go's standard library is exceptionally comprehensive. Prefer stdlib over third-party unless the third-party package offers significant ergonomic or safety improvements.
>
> **Last verified:** August 2026. Review this list quarterly or when starting a new project.

## Core Stack Table

| Category | Module | Version | Notes |
|---|---|---|---|
| HTTP | `net/http` | stdlib | **Primary choice.** Go 1.22+ enhanced ServeMux supports method-based routing (`GET /api/users/{id}`), path parameters, and middleware via `HandlerFunc` chaining. Sufficient for most APIs. |
| HTTP | `github.com/go-chi/chi/v5` | v5.x.x | For complex routing needs: middleware stacks, route groups, sub-routers. Compatible with stdlib `http.Handler`. No gin/echo needed. |
| Database | `github.com/jackc/pgx/v5` | v5.x.x | Preferred PostgreSQL driver. Native protocol, connection pooling (`pgxpool`), advanced type support. |
| Database (codegen) | `github.com/sqlc-dev/sqlc` | v1.31+ | **Recommended for new projects.** Write raw SQL, generate type-safe Go code. Zero-reflection, compile-time validated queries. |
| ORM | `gorm.io/gorm` | v1.x.x | Use only when ORM is explicitly needed. Prefer `sqlc` or `pgx` direct for most projects. |
| Serialization | `encoding/json`, `encoding/xml` | stdlib | No external JSON library needed for most use cases. |
| Validation | `github.com/go-playground/validator/v10` | v10.x.x | |
| Logging | `log/slog` | stdlib | Go 1.21+ as default. No external logging library needed. |
| Error handling | `errors` | stdlib | Use with `fmt.Errorf` and `%w`. No external library needed. |
| UUID | `github.com/google/uuid` | v1.x.x | |
| Config | `github.com/caarlos0/env/v11` | v11.x.x | |
| Config | `github.com/knadh/koanf/v2` | v2.x.x | |
| CLI | `github.com/spf13/cobra` + `pflag` | v1.x.x | |
| CLI | `github.com/urfave/cli/v3` | v3.x.x | |
| HTTP Client | `net/http` | stdlib | With custom transport. |
| HTTP Retry | `github.com/hashicorp/go-retryablehttp` | v0.x.x | For retry logic. |

## Observability Table

| Category | Module | Notes |
|---|---|---|
| Tracing | `go.opentelemetry.io/otel` | OpenTelemetry SDK + exporters |
| Structured Logging | slog adapters | For structured output |
| Metrics | `github.com/prometheus/client_golang` | Prometheus metrics |

## Testing Table

| Category | Module | Version | Notes |
|---|---|---|---|
| Assertions | `github.com/stretchr/testify` | v1.x.x | assert + require + suite |
| Deep comparison | `github.com/google/go-cmp` | v0.x.x | |
| Mocking | `go.uber.org/mock` | v0.x.x | Maintained fork of golang/mock |
| Test containers | `github.com/testcontainers/testcontainers-go` | v0.x.x | |
| HTTP testing | `net/http/httptest` | stdlib | |
| Fuzzing | `testing.F` | stdlib | Go 1.18+ |
| Benchmarking | `testing.B` | stdlib | |
| Coverage | `go test -cover` | stdlib | |

## Development Tooling Table

| Category | Tool | Notes |
|---|---|---|
| Formatting | `gofumpt` | Stricter gofmt |
| Linting | `golangci-lint` | |
| Type checking | `go vet` | |
| Security | `govulncheck`, `gosec` | |
| Static analysis | `staticcheck` | |
| Hot reload | `air` | |
| Debugger | `dlv` (Delve) | |
| API docs | `swaggo/swag` | For OpenAPI generation |
| Profiling | `go tool pprof`, `go tool trace` | |
| SQL codegen | `sqlc` | Generates type-safe Go from SQL queries |

## golangci-lint Configuration Template

Provide a `.golangci.yml` template that enables pedantic linting matching the project's standards:

```yaml
run:
  timeout: 5m
  go: '1.24'

linters:
  enable:
    - errcheck
    - govet
    - staticcheck
    - gosec
    - gofumpt
    - revive
    - unused
    - ineffassign
    - misspell
    - gocognit
    - cyclop
    - bodyclose
    - noctx
    - exhaustive
    - prealloc
    - gocritic
    - dupl
    - unconvert
    - unparam
    - nilerr
    - wastedassign

linters-settings:
  gocognit:
    min-complexity: 10
  cyclop:
    max-complexity: 10
  revive:
    rules:
      - name: exported
        severity: warning
      - name: unexported-return
        severity: warning
  gosec:
    severity: medium
    confidence: medium
  errcheck:
    check-blank: true
    check-type-assertions: true

issues:
  exclude-use-default: false
  max-issues-per-linter: 0
  max-same-issues: 0
```

## Concurrency and Scheduling Table

| Category | Module | Version | Notes |
|---|---|---|---|
| Fan-out/fan-in | `golang.org/x/sync/errgroup` | latest | Error-aware goroutine groups |
| Worker pool | `github.com/sourcegraph/conc` | v0.x.x | Structured concurrency with panic recovery |
| Rate limiting | `golang.org/x/time/rate` | latest | Token bucket rate limiter |
| Cron scheduling | `github.com/robfig/cron/v3` | v3.x.x | Cron expression scheduler |

## Resilience Table

| Category | Module | Version | Notes |
|---|---|---|---|
| Retry | `github.com/cenkalti/backoff/v4` | v4.x.x | Exponential backoff with jitter |
| Circuit breaker | `github.com/sony/gobreaker` | v1.x.x | State-machine circuit breaker |
| Timeout | `context.WithTimeout` | stdlib | Always prefer stdlib context for timeouts |

## Database Migration and Task Runner Table

| Category | Module | Version | Notes |
|---|---|---|---|
| Migrations | `github.com/pressly/goose/v3` | v3.x.x | SQL-based migrations with Go embedding |
| Migrations | `github.com/golang-migrate/migrate/v4` | v4.x.x | Multi-database support |
| Task runner | `github.com/go-task/task` | v3.x.x | Makefile alternative with YAML |

## Makefile Template

A starter `Makefile` for Go projects:

```makefile
.PHONY: all build test lint fmt vet vuln tidy clean

GO ?= go
GOFUMPT ?= gofumpt
GOLANGCI_LINT ?= golangci-lint

all: fmt vet lint test build

build:
	$(GO) build -o bin/ ./...

test:
	$(GO) test -race -cover ./...

lint:
	$(GOLANGCI_LINT) run

fmt:
	$(GOFUMPT) -l -w .

vet:
	$(GO) vet ./...

vuln:
	$(GO) run golang.org/x/vuln/cmd/govulncheck@latest ./...

tidy:
	$(GO) mod tidy
	$(GO) mod verify

clean:
	rm -rf bin/
```

## Starter go.mod Template

A new web service project:

> ⚠️ **Do NOT copy placeholder versions (`v5.x.x`) into a real `go.mod`.** Use `go get` to resolve the latest version for each dependency:
> ```bash
> go get github.com/jackc/pgx/v5@latest
> go get github.com/go-playground/validator/v10@latest
> go get github.com/google/uuid@latest
> ```

```go
module github.com/org/my-service

go 1.24

require (
    github.com/jackc/pgx/v5 v5.x.x              // Replace: go get github.com/jackc/pgx/v5@latest
    github.com/go-playground/validator/v10 v10.x.x // Replace: go get ...@latest
    github.com/google/uuid v1.x.x                 // Replace: go get ...@latest
)
```

## Version Pinning Policy

- Go modules pin by default (`go.sum` provides checksums)
- Always commit both `go.mod` and `go.sum`
- Run `go mod tidy` before commits
- Run `govulncheck ./...` in CI
- Run `go mod verify` to check downloaded modules

## Anti-Patterns

- ❌ Using `github.com/pkg/errors` in new projects — stdlib `errors` + `fmt.Errorf("%w")` is sufficient since Go 1.13
- ❌ Using `logrus` or `zap` for new projects — `log/slog` is stdlib since Go 1.21
- ❌ Using `gin` or `echo` for new APIs — Go 1.22+ stdlib ServeMux handles method-based routing and path parameters natively; use `chi` only for complex middleware stacks
- ❌ Using `github.com/golang/mock` — unmaintained, use `go.uber.org/mock`
- ❌ Using `github.com/jmoiron/sqlx` in new projects — unmaintained since April 2024 (feature-frozen). Use `sqlc` for type-safe SQL codegen or `pgx` direct
- ❌ Using `gorm` by default — only use when ORM is explicitly needed; prefer `sqlc` or `pgx` direct
- ❌ Vendoring dependencies without reason — Go module proxy handles caching
- ❌ Using `dep` or `glide` — these are deprecated, use Go modules

## Related Section

- Go Idioms @.agents/skills/go-idioms/SKILL.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
