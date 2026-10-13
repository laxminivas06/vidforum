---
name: Recommended Dependencies (Rust)
description: A curated list of recommended crates and versions for new Rust projects (July 2026).
---

# Recommended Dependencies (Rust — July 2026)

> **Target:** Rust stable 1.97+. All crates below are actively maintained, widely adopted, and represent the community-recommended choices as of July 2026. Always check crates.io for the latest patch version within these major lines.
>
> **Last verified:** July 2026. Review this list quarterly or when starting a new project.

## Core Stack

| Category | Crate | Version | Features | Notes |
|---|---|---|---|---|
| Async Runtime | `tokio` | `1` | `rt-multi-thread`, `macros`, `signal`, `time` | The standard async runtime. Use `full` feature for convenience in apps. |
| HTTP Framework | `axum` | `0.8` | — | Tokio-native, Tower-based. See `axum-idioms` skill. |
| Tower Middleware | `tower` | `0.5` | — | Often transitive via axum. |
| Tower HTTP | `tower-http` | `0.6` | `trace`, `cors`, `compression` | HTTP-specific middleware layers. |
| Serialization | `serde` | `1` | `derive` | De facto standard. See `serde-patterns.md` (in this skill's `references/`). |
| JSON | `serde_json` | `1` | — | JSON serialization/deserialization. |
| Error (library) | `thiserror` | `2` | — | Typed error enums with `#[derive(Error)]`. Supports `no_std`. |
| Error (application) | `anyhow` | `1` | — | Ergonomic error chaining for app code. Never in library crates. |
| Database | `sqlx` | `0.8` | `runtime-tokio`, `tls-rustls`, `postgres` | Compile-time checked queries. |
| Observability | `tracing` | `0.1` | — | Structured diagnostics. Replaces `log` for async apps. |
| Observability | `tracing-subscriber` | `0.3` | `json`, `env-filter`, `time` | Subscriber configuration. |
| Validation | `validator` | `0.19` | `derive` | Struct-level validation with `#[derive(Validate)]`. |
| UUID | `uuid` | `1` | `v4`, `serde` | Standard UUID generation. |
| Date/Time | `chrono` | `0.4` | `serde` | Or `time` crate — pick one per project, don't mix. |
| CLI | `clap` | `4` | `derive` | CLI argument parsing with derive macros. |
| Config | `config` | `0.14` | — | Layered configuration (env, file, defaults). |
| Env Loading | `dotenvy` | `0.15` | — | Load `.env` files into env vars. Maintained fork of `dotenv`. |
| Regex | `regex` | `1` | — | Fast, safe regular expressions. Use `once_cell` or `LazyLock` for compiled patterns. |
| Randomness | `rand` | `0.9` | — | Random number generation. Use `rand::thread_rng()` for non-crypto, `rand_chacha` for reproducible. |

## Resilience & Networking

| Category | Crate | Version | Notes |
|---|---|---|---|
| Retry / Circuit Breaker | `tower-resilience` | `0.10` | Retry, circuit breaker, bulkhead, coalesce, hedge. Replaces hand-rolled retry logic. Enable features per middleware (e.g. `circuitbreaker`, `retry`). |
| HTTP Client | `reqwest` | `0.12` | Tokio-based HTTP client. Use with `json` and `rustls-tls` features. |
| gRPC | `tonic` | `0.12` | gRPC over HTTP/2 with tokio. |
| Data Parallelism | `rayon` | `1` | CPU-bound parallel iterators. Never mix with tokio — use `spawn_blocking` bridge. |
| Complex Serde | `serde_with` | `3` | Custom serialization helpers (base64, display/fromstr, timestamps). |

## Testing

| Category | Crate | Version | Notes |
|---|---|---|---|
| Benchmarking | `criterion` | `0.5` | Statistical micro-benchmarks. |
| Property Testing | `proptest` | `1` | Property-based / fuzz testing. |
| Mocking | `mockall` | `0.13` | Auto-generated mocks. Prefer hand-written fakes for simple traits. |
| Parameterized Tests | `rstest` | `0.23` | Fixtures + parameterized test cases (like Go table-driven tests). |
| Snapshot Testing | `insta` | `1` | Golden-file testing for large outputs. |
| Coverage | `cargo-llvm-cov` | latest | Line/branch coverage reporting. |
| Coverage (alt) | `cargo-tarpaulin` | latest | Simpler coverage tool. |
| Test Containers | `testcontainers` | `0.23` | Spin up real databases/services in tests. |

## Development Tooling

| Category | Tool | Notes |
|---|---|---|
| Formatting | `cargo fmt` (rustfmt) | Non-negotiable. Run before every commit. |
| Linting | `cargo clippy` | Must pass with zero warnings. See `@.agents/skills/rust-idioms/SKILL.md` §Clippy. |
| Type checking | `cargo check` | Fastest feedback loop during development. |
| Audit | `cargo audit` | Check for known vulnerabilities in deps. |
| Async debugging | `tokio-console` + `console-subscriber` | Visual async runtime inspector. |
| Profiling | `cargo-flamegraph` | CPU flamegraphs. See `@.agents/skills/perf-optimization/languages/rust.md`. |
| Binary bloat | `cargo-bloat` | Analyze binary size by crate. |
| Feature testing | `cargo-hack` | Test all feature flag combinations in CI. |

## Starter Cargo.toml Template

For a new web service project:

```toml
[package]
name = "my-service"
version = "0.1.0"
edition = "2024"
rust-version = "1.97"

[dependencies]
tokio = { version = "1", features = ["full"] }
axum = "0.8"
tower = "0.5"
tower-http = { version = "0.6", features = ["trace", "cors", "compression"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = ["runtime-tokio", "tls-rustls", "postgres"] }
thiserror = "2"
anyhow = "1"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["json", "env-filter"] }
uuid = { version = "1", features = ["v4", "serde"] }
validator = { version = "0.19", features = ["derive"] }

[dev-dependencies]
tokio = { version = "1", features = ["test-util"] }
criterion = { version = "0.5", features = ["html_reports"] }
rstest = "0.23"
insta = { version = "1", features = ["json"] }

[lints.rust]
missing_docs = "warn"
unsafe_code = "deny"

[lints.clippy]
pedantic = { level = "warn", priority = -1 }
unwrap_used = "deny"
expect_used = "warn"
```

## Workspace Lint Configuration

For multi-crate workspaces, centralize lint config in the workspace root:

```toml
# Workspace root Cargo.toml
[workspace]
members = ["crates/*"]

[workspace.lints.rust]
missing_docs = "warn"
unsafe_code = "deny"

[workspace.lints.clippy]
pedantic = { level = "warn", priority = -1 }
unwrap_used = "deny"
expect_used = "warn"

# Each member crate Cargo.toml:
[lints]
workspace = true
```

> Every workspace member MUST include `[lints] workspace = true`. Use CI checks to enforce this.

## Version Pinning Policy

- **Pin major version** in `Cargo.toml`: `tokio = "1"` (allows 1.x.y updates)
- **Commit `Cargo.lock`** for binary crates (applications, CLI tools)
- **Do NOT commit `Cargo.lock`** for library crates
- **Run `cargo audit`** in CI to catch known vulnerabilities
- **Run `cargo update`** periodically to pull patch/minor updates within pinned ranges

## Anti-Patterns

- ❌ Using `dep = "*"` — no version constraint at all
- ❌ Pinning exact versions `dep = "=1.2.3"` — prevents security patches
- ❌ Mixing `log` and `tracing` in the same app — choose `tracing` for async
- ❌ Using `thiserror` 1.x in new projects — use `thiserror` 2.x
- ❌ Adding `async-trait` as a default dependency — only include it when `dyn Trait` dynamic dispatch is explicitly required. For the full policy (static vs dynamic dispatch, when to add the crate), see `@.agents/skills/rust-idioms/SKILL.md` §Toolchain (1.75+ milestone) — single source of truth.
- ❌ Using `actix-web` for new projects without specific reason — `axum` is the ecosystem default

### Related
- Rust Idioms @.agents/skills/rust-idioms/SKILL.md
- Axum Idioms @.agents/skills/axum-idioms/SKILL.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
