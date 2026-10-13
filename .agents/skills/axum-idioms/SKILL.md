---
name: axum-idioms
description: >-
  Axum (0.8+) web framework patterns: type-safe extractors, Tower middleware, route routing, and graceful shutdown. Use when implementing HTTP APIs or web services in Rust. Pair with rust-idioms.
---

## Axum Idioms and Patterns

### Core Philosophy

Axum (0.8+) rewards composability via Tower, type-safe extractors, and zero-cost abstractions. Idiomatic Axum = thin handlers, tower middleware, typed errors.

> **Version note:** This skill targets Axum **0.8+** (released 2025). Key changes from 0.7: path parameter syntax changed from `:name` to `{name}`, `State` extractor is now in `axum::extract`, and `axum::serve` replaces `axum::Server`. If you encounter an existing codebase on 0.7, check the [Axum 0.8 changelog](https://github.com/tokio-rs/axum/blob/main/axum/CHANGELOG.md) before applying these patterns.

> **Scope:** Axum-specific patterns. For Rust fundamentals: @.agents/skills/rust-idioms/SKILL.md. For project structure: @.agents/skills/rust-idioms/references/project-structure.md.

### Router and Route Organization

1. **Build routers with `Router::new()` and method routing:**
   ```rust
   // ✅ Group by resource, nest for versioning
   fn task_routes() -> Router<AppState> {
       Router::new()
           .route("/tasks", get(list_tasks).post(create_task))
           .route("/tasks/{id}", get(get_task).put(update_task).delete(delete_task))
   }

   fn app(state: Arc<AppState>) -> Router {
       let api = Router::new()
           .merge(task_routes())   // .merge() combines peer routers
           .merge(user_routes());

       Router::new()
           .nest("/api/v1", api)   // .nest() adds prefix to sub-router
           .fallback(handle_404)   // typed error, not Axum's default plain-text 404
           .with_state(state)
   }
   ```

2. **Path parameters use `{name}` syntax** (not `:name`).

### Extractors

1. **Built-in extractors — `Path`, `Query`, `Json`, `State`, `HeaderMap`:**
   ```rust
   // ✅ Typed and validated at compile time
   async fn get_task(
       State(state): State<Arc<AppState>>,
       Path(id): Path<Uuid>,
   ) -> Result<Json<TaskResponse>, AppError> {
       let task = state.task_service.find(id).await?;
       Ok(Json(task.into()))
   }
   ```

2. **Extractor ordering — body-consuming extractors MUST be last:**
   ```rust
   // ✅ Path before Json (Json consumes the body)
   async fn update_task(
       State(state): State<Arc<AppState>>,
       Path(id): Path<Uuid>,
       Json(body): Json<UpdateTaskRequest>,
   ) -> Result<Json<TaskResponse>, AppError> { ... }

   // ❌ Json before Path — won't compile or will fail at runtime
   async fn update_task(Json(body): Json<UpdateTaskRequest>, Path(id): Path<Uuid>) { ... }
   ```

3. **Custom extractors via `FromRequestParts` (non-body) or `FromRequest` (body):**
   ```rust
   // ✅ Custom extractor for authenticated user
   impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
       type Rejection = AppError;
       async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
           let token = parts.headers.get(AUTHORIZATION)
               .and_then(|v| v.to_str().ok())
               .and_then(|v| v.strip_prefix("Bearer "))
               .ok_or(AppError::Unauthorized)?;
           decode_jwt(token).map_err(|_| AppError::Unauthorized)
       }
   }
   ```

4. **Handle rejections with custom types** — never let Axum's default messages leak to clients.

### Application State

1. **Wrap in `Arc`, pass via `State`:**
   ```rust
   pub struct AppState {
       pub db: sqlx::PgPool,
       pub task_service: TaskService,
       pub config: AppConfig,
   }

   let state = Arc::new(AppState { db: pool, task_service, config });
   let app = Router::new().route("/tasks", get(list_tasks)).with_state(state);
   ```

2. **Compose state for feature isolation** — each feature defines its own state struct, combined at app level.
3. **Never clone `AppState` directly** — wrap in `Arc`, clone the `Arc`.

### Middleware (Tower)

1. **`ServiceBuilder` for layer composition:**
   ```rust
   // ✅ Full middleware stack — order matters (outermost runs first)
   let app = Router::new()
       .nest("/api/v1", api_routes())
       .layer(
           ServiceBuilder::new()
               .layer(TraceLayer::new_for_http())
               .layer(CompressionLayer::new())
               .layer(CorsLayer::permissive()) // development ONLY — see below
               .layer(TimeoutLayer::new(Duration::from_secs(30)))
       )
       .with_state(state);
   ```

   > **Never ship `CorsLayer::permissive()` to production.** It allows any origin, any method, any header, and sends no `Access-Control-Allow-Credentials`. Use an explicit, allow-listed layer instead. Load allowed origins from config, not literals:
   ```rust
    use tower_http::cors::CorsLayer;
   use http::HeaderValue;

   // ✅ Production-safe — explicit allow-list
   fn cors_layer(allowed_origins: &[String]) -> CorsLayer {
       let origins: Vec<HeaderValue> = allowed_origins
           .iter()
           .filter_map(|o| HeaderValue::try_from(o).ok())
           .collect();
       CorsLayer::new()
           .allow_origin(origins)                                      // explicit list, NEVER Any in prod
           .allow_methods([                                            // methods you actually serve
               axum::http::Method::GET,
               axum::http::Method::POST,
               axum::http::Method::PUT,
               axum::http::Method::DELETE,
           ])
           .allow_headers([
               axum::http::header::AUTHORIZATION,
               axum::http::header::CONTENT_TYPE,
               axum::http::header::ACCEPT,
           ])
           .allow_credentials(true)                                    // required for cookies / auth
           .max_age(Duration::from_secs(3600))                         // cache preflight 1h
   }
   // .layer(cors_layer(&config.cors.allowed_origins))
   ```
   > **Rule:** `allow_credentials(true)` is incompatible with `allow_origin(Any)` — browsers reject it. If you need credentials, you MUST enumerate origins. See `security-principles.md` §CORS.

2. **Custom middleware with `from_fn`:**
   ```rust
   async fn auth_middleware(
       State(state): State<Arc<AppState>>,
       request: Request,
       next: Next,
   ) -> Result<Response, AppError> {
       let token = request.headers().get(AUTHORIZATION)
           .and_then(|v| v.to_str().ok())
           .and_then(|v| v.strip_prefix("Bearer "))
           .ok_or(AppError::Unauthorized)?;
       state.auth_service.validate(token).await?;
       Ok(next.run(request).await)
   }

   // Apply to specific routes with route_layer
   let protected = Router::new()
       .route("/tasks", get(list_tasks))
       .route_layer(middleware::from_fn_with_state(state.clone(), auth_middleware));
   ```

3. **Layer ordering:** `ServiceBuilder` applies bottom-to-top — last `.layer()` wraps closest to handler.

4. **Propagate correlation IDs with `TraceLayer`:**
   ```rust
   use tower_http::trace::TraceLayer;
   use tracing::Span;

   // ✅ Inject x-request-id into every span for log correlation
   let trace_layer = TraceLayer::new_for_http()
       .make_span_with(|request: &Request<_>| {
            let request_id = request
                .headers()
                .get("x-request-id")
                .and_then(|v| v.to_str().ok())
                .map(String::from)
                .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
           tracing::info_span!(
               "request",
               method = %request.method(),
               uri = %request.uri(),
               request_id = %request_id,
           )
       });

   let app = Router::new()
       .nest("/api/v1", api_routes())
       .layer(trace_layer)
       .with_state(state);
   ```

   > All `tracing::info!`, `warn!`, `error!` calls inside a handler will automatically inherit the span fields above (method, uri, request_id). This satisfies the `correlationId` requirement from the Logging Mandate. See `logging-implementation/SKILL.md` §Rust for the full `init_tracing()` setup.

5. **Request body size limits** — prevent denial-of-service via large payloads:
   ```rust
   use axum::extract::DefaultBodyLimit;

   let app = Router::new()
       .nest("/api/v1", api_routes())
       .layer(DefaultBodyLimit::max(1024 * 1024))  // 1 MB global limit
       .with_state(state);

   // Per-route override for file uploads:
   let upload_routes = Router::new()
       .route("/upload", post(upload_file))
       .layer(DefaultBodyLimit::max(50 * 1024 * 1024));  // 50 MB for uploads
   ```

### Error Handling

1. **Unified `AppError` enum with `IntoResponse`:**
   ```rust
   #[derive(Debug, thiserror::Error)]
   pub enum AppError {
       #[error("not found: {0}")]       NotFound(String),
       #[error("validation failed: {0}")] Validation(String),
       #[error("unauthorized")]          Unauthorized,
       #[error("forbidden")]             Forbidden,
       #[error(transparent)]             Internal(#[from] anyhow::Error),
   }

   impl IntoResponse for AppError {
       fn into_response(self) -> Response {
           let (status, msg) = match &self {
               Self::NotFound(m) => (StatusCode::NOT_FOUND, m.clone()),
               Self::Validation(m) => (StatusCode::UNPROCESSABLE_ENTITY, m.clone()),
               Self::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized".into()),
               Self::Forbidden => (StatusCode::FORBIDDEN, "forbidden".into()),
               Self::Internal(e) => {
                   tracing::error!(error = %e, "internal server error");
                   (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".into())
               }
           };
           (status, Json(serde_json::json!({ "error": msg }))).into_response()
       }
   }
   ```

2. **Handler return type:** always `Result<impl IntoResponse, AppError>`.
3. **Convert rejections into `AppError`** for consistent JSON error shape.

### Response Types

1. **`Json<T>`** for standard responses, **`(StatusCode, Json<T>)`** tuple for non-200:
   ```rust
   async fn list_tasks(...) -> Result<Json<Vec<TaskResponse>>, AppError> { ... }
   async fn create_task(...) -> Result<(StatusCode, Json<TaskResponse>), AppError> {
       Ok((StatusCode::CREATED, Json(task.into())))
   }
   ```
2. **`Response` builder** for headers, streaming, or non-JSON (CSV, files).

### Validation

1. **`validator` crate with `#[derive(Validate)]`:**
   ```rust
   #[derive(Debug, Deserialize, Validate)]
   pub struct CreateTaskRequest {
       #[validate(length(min = 1, max = 255))]
       pub title: String,
       #[validate(range(min = 1, max = 5))]
       pub priority: u8,
   }
   ```

2. **Custom `ValidatedJson<T>` extractor** — implement `FromRequest<S>` that deserializes via `Json<T>` then calls `value.validate()`, converting failures to `AppError::Validation`:
   ```rust
   use axum::extract::{FromRequest, Request};
   use axum::Json;
   use serde::de::DeserializeOwned;
   use validator::Validate;

   pub struct ValidatedJson<T>(pub T);

   impl<S, T> FromRequest<S> for ValidatedJson<T>
   where
       S: Send + Sync,
       T: DeserializeOwned + Validate,
   {
       type Rejection = AppError;

       async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
           let Json(value) = Json::<T>::from_request(req, state)
                .await
                .map_err(|e| AppError::Validation(e.to_string()))?;
           value.validate().map_err(|e| AppError::Validation(e.to_string()))?;
           Ok(ValidatedJson(value))
       }
   }

   // Usage — replaces bare Json<T> in handler signatures
   async fn create_task(
       State(state): State<Arc<AppState>>,
       ValidatedJson(body): ValidatedJson<CreateTaskRequest>,
   ) -> Result<(StatusCode, Json<TaskResponse>), AppError> {
       let task = state.task_service.create(body).await?;
       Ok((StatusCode::CREATED, Json(task.into())))
   }
   ```

### Response Types and Domain Conversion

1. **Separate request and response types** — never expose domain models directly to the API:
   ```rust
   // --- Request type (deserialize + validate) ---
   #[derive(Debug, Deserialize, Validate)]
   #[serde(rename_all = "camelCase")]
   pub struct CreateTaskRequest {
       #[validate(length(min = 1, max = 255))]
       pub title: String,
       #[serde(default)]
       pub description: Option<String>,
       #[validate(range(min = 1, max = 5))]
       #[serde(default = "default_priority")]
       pub priority: u8,
   }

   fn default_priority() -> u8 { 3 }

   // --- Response type (serialize) ---
   #[derive(Debug, Serialize)]
   #[serde(rename_all = "camelCase")]
   pub struct TaskResponse {
       pub id: Uuid,
       pub title: String,
       #[serde(skip_serializing_if = "Option::is_none")]
       pub description: Option<String>,
       pub priority: u8,
       pub created_at: DateTime<Utc>,
   }

   // --- Domain → Response conversion ---
   impl From<Task> for TaskResponse {
       fn from(task: Task) -> Self {
           Self {
               id: task.id,
               title: task.title,
               description: task.description,
               priority: task.priority,
               created_at: task.created_at,
           }
       }
   }
   ```

2. **Use `.into()` in handlers** for clean conversion:
   ```rust
   async fn get_task(
       State(state): State<Arc<AppState>>,
       Path(id): Path<Uuid>,
   ) -> Result<Json<TaskResponse>, AppError> {
       let task = state.task_service.find(id).await?;
       Ok(Json(task.into()))  // From<Task> for TaskResponse
   }
   ```

3. **For serde attribute patterns** (rename_all, deny_unknown_fields, skip_serializing_if), see `rust-idioms/references/serde-patterns.md`.

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: Axum-specific patterns only.

1. **`tower::ServiceExt::oneshot` — test handlers without spawning a server:**
   ```rust
   #[tokio::test]
   async fn test_create_task_returns_201() {
       let app = app(Arc::new(test_app_state().await));
       let response = app.oneshot(
           Request::builder().method("POST").uri("/api/v1/tasks")
               .header("content-type", "application/json")
               .body(Body::from(r#"{"title":"Test","priority":3}"#)).unwrap(),
       ).await.unwrap();
       assert_eq!(response.status(), StatusCode::CREATED);
   }
   ```

2. **Mock state helpers** — inject trait-based test doubles for isolation:
   ```rust
   /// Build test AppState with mock services (no real DB needed)
   fn test_app_state() -> Arc<AppState> {
       let mock_task_service = MockTaskService::new();  // implements TaskService trait
       Arc::new(AppState {
           task_service: Box::new(mock_task_service),
           config: test_config(),
       })
   }
   ```
   > This follows the trait-based DI pattern from `@.agents/rules/architectural-pattern.md` — swap real I/O implementations for test doubles at the `AppState` level.

3. **`tower` dev-dependency required** — add `tower = { version = "0.5", features = ["util"] }` to `[dev-dependencies]` to use `ServiceExt::oneshot`.
4. **Integration tests** use a real database via `sqlx::test` or Testcontainers.

### Graceful Shutdown

Container orchestrators (Kubernetes, Docker `stop`) send **SIGTERM**, not SIGINT — handle BOTH. Use `tokio_util::sync::CancellationToken` (the recommended cancellation primitive per `@.agents/skills/rust-idioms/SKILL.md` §Async and Concurrency) so in-flight handlers and background tasks can observe the shutdown and unwind cooperatively. Axum's `with_graceful_shutdown` then drains active connections before exiting.

```rust
use tokio::signal;
use tokio_util::sync::CancellationToken;

// Wire the token into AppState so background tokio tasks can observe shutdown.
let shutdown = CancellationToken::new();
let state = Arc::new(AppState { /* ... */ shutdown: shutdown.clone() });

let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
axum::serve(listener, app)
    .with_graceful_shutdown(shutdown_signal(shutdown.clone()))
    .await?;
```

```rust
/// ✅ Unified signal handler — fires on SIGINT (ctrl-c) OR SIGTERM (container stop).
async fn shutdown_signal(token: CancellationToken) {
    let ctrl_c = async { signal::ctrl_c().await.expect("install ctrl-c handler") };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("install SIGTERM handler")
            .recv().await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c    => tracing::info!("SIGINT received, shutting down"),
        _ = terminate => tracing::info!("SIGTERM received, shutting down"),
    }
    token.cancel(); // notify background tasks + long-lived handlers to unwind
}
```

> **Why:** Axum stops accepting new connections and drains in-flight requests before exiting. The shared `CancellationToken` lets your background workers (queue consumers, scheduled jobs, long-poll handlers) observe the same shutdown and exit cooperatively instead of being killed mid-write. Add `tokio-util` (with the `rt` feature) to your dependencies. See `rust-idioms` §Async and Concurrency for the cancellation-safety policy.

### Anti-Patterns

- ❌ **Business logic in handlers** — extract to a service/logic layer; handlers only parse, delegate, respond
- ❌ **`Extension` instead of `State`** — `Extension` is untyped and pre-0.6; use `State<T>` always
- ❌ **Cloning entire state** — wrap in `Arc`, clone the `Arc`
- ❌ **Blocking in async handlers** — use `tokio::task::spawn_blocking` for CPU-bound or blocking I/O
- ❌ **Wrong extractor ordering** — body-consuming extractors (`Json`, `Form`) must be the last parameter
- ❌ **Returning string errors** — use typed `AppError` with `IntoResponse` for consistent error shape
- ❌ **Leaking internal error details** — log with `tracing::error!`, return generic message to client

### Formatting and Static Analysis

> Same tooling as Rust. See @.agents/skills/rust-idioms/SKILL.md#clippy-and-formatting.

### Related
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- Rust Idioms @.agents/skills/rust-idioms/SKILL.md
- API Design Principles @.agents/rules/api-design-principles.md
- Security Principles @.agents/rules/security-principles.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Architectural Patterns @.agents/rules/architectural-pattern.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Logging and Observability Mandate @.agents/rules/logging-and-observability-mandate.md
- Logging Implementation @.agents/skills/logging-implementation/SKILL.md
- Serde Patterns @.agents/skills/rust-idioms/references/serde-patterns.md
- SQLx Patterns @.agents/skills/rust-idioms/references/sqlx-patterns.md
