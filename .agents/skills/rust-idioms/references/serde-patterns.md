---

# Serde Patterns and Best Practices

Common patterns for `serde` serialization/deserialization in Rust applications.

---

## Container Attributes

### `rename_all` — Consistent Field Naming

Apply at the struct/enum level for consistent casing across all fields:

```rust
// ✅ API responses use camelCase (JavaScript convention)
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskResponse {
    pub task_id: Uuid,           // Serializes as "taskId"
    pub created_at: DateTime<Utc>, // Serializes as "createdAt"
    pub is_completed: bool,      // Serializes as "isCompleted"
}

// ✅ Config files use kebab-case (TOML/YAML convention)
#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct AppConfig {
    pub database_url: String,     // Reads "database-url"
    pub max_connections: u32,     // Reads "max-connections"
}
```

### `deny_unknown_fields` — Strict Input Validation

```rust
// ✅ Use for internal config / CLI input — catches typos
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub name: String,
}

// ❌ Do NOT use for external API responses — APIs add fields over time
// #[serde(deny_unknown_fields)]  // Will break when API adds new fields
pub struct ExternalApiResponse { ... }
```

> **Rule:** Use `deny_unknown_fields` for inputs you control (config files, internal messages). Never for external API responses.

---

## Field Attributes

### `skip_serializing_if` — Omit Optional Fields

```rust
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskResponse {
    pub id: Uuid,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,  // Omitted from JSON when None
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,            // Omitted when empty
}
```

### `default` — Backward-Compatible Deserialization

```rust
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub title: String,
    #[serde(default)]                    // Defaults to 0
    pub priority: u8,
    #[serde(default = "default_status")]  // Custom default
    pub status: TaskStatus,
}

fn default_status() -> TaskStatus {
    TaskStatus::Pending
}
```

### `with` — Custom Serialization

```rust
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize)]
pub struct Event {
    pub name: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub timestamp: DateTime<Utc>,  // Serialized as Unix timestamp
}
```

---

## Enum Representations

Serde supports multiple enum serialization strategies. Choose based on API requirements:

```rust
// Default: externally tagged (most common for Rust APIs)
// JSON: {"Completed": {"at": "2026-01-01"}}
#[derive(Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed { at: DateTime<Utc> },
}

// Internally tagged: cleaner for APIs
// JSON: {"type": "completed", "at": "2026-01-01"}
#[derive(Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum TaskEvent {
    Created { title: String },
    Completed { at: DateTime<Utc> },
}

// Untagged: when the variant is inferred from shape
// JSON: {"title": "my task"} or {"at": "2026-01-01"}
#[derive(Serialize, Deserialize)]
#[serde(untagged)]
pub enum Input {
    Create(CreateRequest),
    Update(UpdateRequest),
}
```

> **Default recommendation:** Use `#[serde(tag = "type", rename_all = "camelCase")]` (internally tagged) for API enums — it produces the cleanest JSON and is easiest for clients to parse.

---

## Newtype Serialization

### `transparent` — Newtype Wrappers

Use `#[serde(transparent)]` on newtype structs to serialize/deserialize as the inner type. Critical for Domain-Driven Design where domain IDs wrap primitives:

```rust
// ✅ Serializes as a plain UUID string, not {"0": "..."}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(transparent)]
pub struct TaskId(pub Uuid);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Email(pub String);

// JSON: "550e8400-e29b-41d4-a716-446655440000" (not wrapped in an object)
let id = TaskId(Uuid::new_v4());
let json = serde_json::to_string(&id).unwrap();
```

> **Rule:** Every newtype wrapper that appears in API request/response types MUST have `#[serde(transparent)]`. Without it, serde serializes the newtype as a single-field struct, breaking API contracts.

## Struct-Level Defaults

### `default` at Struct Level

Apply `#[serde(default)]` at the struct level to use `Default::default()` for ALL missing fields during deserialization. This differs from field-level `#[serde(default)]` which applies to individual fields:

```rust
// ✅ All fields use their Default impl when missing from input
#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct PaginationParams {
    pub page: u32,          // defaults to 0
    pub per_page: u32,      // defaults to 0 — override with manual Default impl
    pub sort_by: String,    // defaults to ""
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 20,
            sort_by: String::from("created_at"),
        }
    }
}
```

> Use struct-level `#[serde(default)]` for config structs and query parameters where most fields have sensible defaults. Use field-level `#[serde(default = "fn_name")]` when only specific fields need custom defaults.

---

## Request / Response Type Pattern

The full request/response type pattern (struct definitions, `#[validate]` attributes, `From<Domain> for Response` conversion, and `.into()` in handlers) is documented in `@.agents/skills/axum-idioms/SKILL.md` §Response Types and Domain Conversion.

**Key serde attributes for the pattern:**
- Request structs: `#[serde(rename_all = "camelCase")]` + `#[serde(default)]` on optional fields
- Response structs: `#[serde(rename_all = "camelCase")]` + `#[serde(skip_serializing_if = "Option::is_none")]`
- Never expose domain models directly to the API layer

> See `@.agents/skills/axum-idioms/SKILL.md` §Response Types and Domain Conversion for the complete, authoritative pattern.

---

## Anti-Patterns

- ❌ **Using `serde_json::Value` for typed data** — always deserialize into typed structs for compile-time safety. Acceptable uses of `Value`: JSON merge patches (RFC 7396), schema-less metadata fields (`metadata: Value`), and forwarding unknown JSON between services without inspection.
- ❌ **Applying `deny_unknown_fields` on external API responses** — breaks when API evolves
- ❌ **Mixing `flatten` with `deny_unknown_fields`** — produces unpredictable behavior. `#[serde(flatten)]` is valid for embedding shared field structs (e.g., pagination fields into a response), but be aware it disables `deny_unknown_fields` on the outer struct and has a ~20% deserialization performance overhead due to internal buffering.
- ❌ **Renaming fields individually** when `rename_all` covers the entire struct
- ❌ **Using `String` for structured data** — parse into domain types at the boundary
- ❌ **Skipping `#[serde(default)]` on optional fields** in requests — forces clients to send every field

---

### Related
- Rust Idioms @.agents/skills/rust-idioms/SKILL.md
- Axum Idioms @.agents/skills/axum-idioms/SKILL.md
- Data Serialization Principles @.agents/rules/data-serialization-and-interchange-principles.md
- API Design Principles @.agents/rules/api-design-principles.md
