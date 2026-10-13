---
name: postgres-idioms
description: >-
  PostgreSQL best practices — schema design, query performance, indexing,
  connection management, RLS, concurrency, monitoring, and migrations.
  Load when writing SQL, designing schemas, or optimizing PostgreSQL queries.
---

# PostgreSQL Idioms and Best Practices

PostgreSQL rewards set-based thinking, explicit joins, and query plan awareness.
Idiomatic PostgreSQL = readable, performant, migration-safe, secure.

> Scope: PostgreSQL-specific patterns. For database design principles
> (normalization, naming, migration strategy), see `@.agents/rules/database-design-principles.md`.
> For deep-dive references on individual topics, see `references/` in this skill directory.

## Priority Guide

| Priority | Category | Impact |
|---|---|---|
| 1 | Query Performance & Indexing | CRITICAL |
| 2 | Connection Management | CRITICAL |
| 3 | Security & RLS | CRITICAL |
| 4 | Schema Design | HIGH |
| 5 | Concurrency & Locking | MEDIUM-HIGH |
| 6 | Data Access Patterns | MEDIUM |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM |
| 8 | Advanced Features | LOW |

---

## 1. Query Performance & Indexing (CRITICAL)

### Always EXPLAIN Before Optimizing

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;
```

**Red flags in query plans:**
- `Seq Scan` on large table → missing index
- `Rows Removed by Filter` → poor selectivity or wrong index
- `read >> hit` in Buffers → data not cached, cold query
- `Sort Method: external merge` → `work_mem` too low
- `Nested Loop` with high row count → consider `Hash Join`

### Index Strategy

**Choose the right index type:**

| Type | Use When | Operators |
|---|---|---|
| B-tree (default) | General sorted data | `=`, `<`, `>`, `BETWEEN`, `IN`, `IS NULL` |
| GIN | JSONB, arrays, full-text search | `@>`, `?`, `?&`, `@@` |
| GiST | Geometric, range, nearest-neighbor | `&&`, `@>`, `<->` (KNN) |
| BRIN | Large time-series, naturally ordered | Range queries on ordered columns |
| Hash | Equality-only (marginal B-tree improvement) | `=` |

**Composite indexes — column order matters (leftmost prefix rule):**

```sql
-- ✅ Equality columns first, range columns last
CREATE INDEX idx_orders_status_date ON orders (status, created_at);
-- Works: WHERE status = 'pending'
-- Works: WHERE status = 'pending' AND created_at > '2024-01-01'
-- FAILS: WHERE created_at > '2024-01-01' (alone — no leftmost match)
```

**Partial indexes for filtered queries (5-20x smaller):**

```sql
CREATE INDEX idx_users_active_email ON users (email)
  WHERE deleted_at IS NULL;
```

**Covering indexes to avoid heap fetches:**

```sql
-- INCLUDE non-searchable columns for index-only scans
CREATE INDEX idx_orders_status ON orders (status)
  INCLUDE (customer_id, total);
```

**Always index foreign keys.** PostgreSQL does NOT auto-index FK columns:

```sql
-- ❌ Missing index on FK — causes Seq Scan on JOIN and CASCADE
CREATE TABLE orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE
);

-- ✅ Always create FK index
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
```

**Detect missing indexes** with `pg_stat_user_tables`:

```sql
SELECT schemaname, relname, seq_scan, idx_scan,
       seq_tup_read, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 100
  AND n_live_tup > 10000
ORDER BY seq_tup_read DESC;
```

**Index creation on production — always `CONCURRENTLY`:**

```sql
CREATE INDEX CONCURRENTLY idx_orders_date ON orders (created_at);
-- Does NOT block writes (but takes longer, requires retry on failure)
```

---

## 2. Connection Management (CRITICAL)

Each PostgreSQL connection costs ~1-3 MB RAM. Unbounded connections crash the database.

### Connection Pooling

Use a connection pooler (PgBouncer, pgcat, Supavisor) between app and database.

| Pool Mode | Behavior | Prepared Statements? | Use When |
|---|---|---|---|
| **Transaction** | Connection returned after each transaction | ❌ No | Default — most applications |
| **Session** | Connection held for entire client session | ✅ Yes | Prepared statements, temp tables, `SET` commands |

**Critical**: Disable prepared statements in your ORM/driver when using transaction mode pooling.

### Idle Connection Cleanup

```sql
-- Kill idle-in-transaction connections after 30s (holds locks, blocks VACUUM)
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
-- Kill fully idle connections after 10 minutes
ALTER SYSTEM SET idle_session_timeout = '10min';
SELECT pg_reload_conf();
```

### Statement Timeout

```sql
-- Prevent runaway queries (set per session or globally)
SET statement_timeout = '30s';
-- Or per transaction
SET LOCAL statement_timeout = '5s';
```

### Monitor Active Connections

```sql
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

---

## 3. Security & RLS (CRITICAL)

### Principle of Least Privilege

```sql
-- ❌ Overly broad — any SQL injection becomes catastrophic
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;

-- ✅ Minimal, specific grants
CREATE ROLE app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON users, orders, products TO app_readonly;

CREATE ROLE app_writer;
GRANT USAGE ON SCHEMA public TO app_writer;
GRANT SELECT, INSERT, UPDATE ON orders TO app_writer;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_writer;
-- No DELETE, no DDL, no other tables
```

### Row Level Security (RLS) for Multi-Tenant Data

RLS enforces data isolation at the database level — defense in depth beyond application filtering:

```sql
-- ❌ Application-level filtering only (bug or bypass = data leak)
SELECT * FROM orders WHERE user_id = $current_user_id;

-- ✅ Database-enforced isolation
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;  -- Applies to table owner too

CREATE POLICY orders_user_isolation ON orders
  USING (user_id = current_setting('app.current_user_id')::BIGINT);
```

**Set the session variable in your application before queries:**

```sql
SET LOCAL app.current_user_id = '42';
SELECT * FROM orders;  -- Returns only user 42's orders, regardless of query
```

### RLS Performance Optimization

```sql
-- ❌ Function called per row (1M rows = 1M function calls)
CREATE POLICY orders_policy ON orders
  USING (get_current_user_id() = user_id);

-- ✅ Wrap in subquery — called once, result cached
CREATE POLICY orders_policy ON orders
  USING (user_id = (SELECT current_setting('app.current_user_id')::BIGINT));
```

**Use `SECURITY DEFINER` functions for complex permission checks:**

```sql
CREATE OR REPLACE FUNCTION is_team_member(team_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = is_team_member.team_id
      AND team_members.user_id = current_setting('app.current_user_id')::BIGINT
  );
$$;
```

> `SECURITY DEFINER` functions bypass RLS on tables they touch.
> Always validate the caller identity inside the function.
> Always set `search_path` explicitly to prevent search path injection.

---

## 4. Schema Design (HIGH)

### Data Types — Choose Correctly

| ❌ Avoid | ✅ Use Instead | Why |
|---|---|---|
| `timestamp` | `timestamptz` | Timezone-aware, stores UTC internally |
| `float` / `real` | `numeric` | Exact decimal arithmetic (financial data) |
| `varchar(n)` | `text` | No performance penalty in PG, avoids arbitrary limits |
| `serial` | `bigint generated always as identity` | SQL-standard, supports `ALWAYS`/`BY DEFAULT` |
| `uuid` (v4 random) | `uuid` (v7 time-ordered) | Avoids index fragmentation on large tables |

### Primary Key Strategy

```sql
-- ✅ Single database: IDENTITY (sequential, 8 bytes, SQL-standard)
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

-- ✅ Distributed systems: UUIDv7 (time-ordered, no fragmentation)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v7() PRIMARY KEY
);
```

**Avoid random UUID v4 as PK on large tables** — scattered inserts cause index fragmentation and poor cache locality.

### Naming Conventions

- **Lowercase snake_case only** — PostgreSQL folds unquoted identifiers to lowercase
- Never use double-quoted identifiers unless unavoidable
- Tables: plural (`users`, `orders`), or singular if team convention is consistent
- Indexes: `idx_{table}_{columns}` (e.g., `idx_orders_customer_id`)
- Constraints: `{table}_{columns}_{type}` (e.g., `orders_customer_id_fk`, `users_email_unique`)

### Safe Constraint Migrations

PostgreSQL does NOT support `ADD CONSTRAINT IF NOT EXISTS`:

```sql
-- ❌ Syntax error
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_email_unique UNIQUE (email);

-- ✅ Idempotent constraint creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;
```

### Table Partitioning (100M+ rows)

```sql
-- ✅ Declarative range partitioning for time-series data
CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ NOT NULL,
  data JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024_q1 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE events_2024_q2 PARTITION OF events
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Benefits: partition pruning (5-20x faster queries), per-partition VACUUM,
-- easy archival (DROP old partitions vs DELETE + VACUUM)
```

**When to partition:**
- Tables exceeding 100M rows
- Time-series data with range queries
- Multi-tenant data with tenant-scoped queries
- High-churn tables where VACUUM is problematic

---

## 5. Concurrency & Locking (MEDIUM-HIGH)

### Prevent Deadlocks — Consistent Lock Ordering

```sql
-- ✅ Acquire locks in PK order before updating
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
```

### Keep Transactions Short

```sql
-- ❌ Long transaction holds locks, blocks VACUUM
BEGIN;
  SELECT * FROM orders FOR UPDATE;
  -- ... HTTP call to external service (5s) ...
  UPDATE orders SET status = 'paid';
COMMIT;

-- ✅ Fetch data, process externally, then short write transaction
-- Step 1: read (no lock)
SELECT * FROM orders WHERE id = $1;
-- Step 2: external processing
-- Step 3: short write transaction
BEGIN;
  UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending';
COMMIT;
```

### SKIP LOCKED for Queue Processing

```sql
-- ✅ Workers skip locked rows — 10x throughput vs blocking
UPDATE jobs SET status = 'processing', locked_by = $worker_id
WHERE id = (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
) RETURNING *;
```

### Advisory Locks for Application-Level Coordination

```sql
-- Transaction-scoped: released on COMMIT/ROLLBACK
SELECT pg_advisory_xact_lock(hashtext('daily_report'));

-- Try without blocking (returns false if already locked)
SELECT pg_try_advisory_lock(hashtext('cron_job_xyz'));
```

---

## 6. Data Access Patterns (MEDIUM)

### CTEs Over Subqueries for Readability

```sql
-- ✅ CTE — readable, debuggable, materializable
WITH active_tasks AS (
    SELECT id, title, priority, user_id
    FROM tasks WHERE status = 'active'
)
SELECT u.name, COUNT(at.id) AS task_count
FROM users u
JOIN active_tasks at ON u.id = at.user_id
GROUP BY u.name;
```

### Keyset Pagination Over OFFSET

```sql
-- ❌ OFFSET — O(n) scans all preceding rows, degrades at depth
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 10000;

-- ✅ Keyset — O(1) consistent performance regardless of page depth
SELECT * FROM products
WHERE (created_at, id) > ($last_created_at, $last_id)
ORDER BY created_at, id LIMIT 20;
```

### UPSERT — Atomic Insert-or-Update

```sql
-- ✅ No race conditions, no check-then-insert anti-pattern
INSERT INTO settings (user_id, key, value)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

### N+1 Query Prevention

```sql
-- ❌ N+1: 1 query for list + N queries for details
SELECT id FROM orders WHERE user_id = $1;
-- then for each: SELECT * FROM order_items WHERE order_id = $id;

-- ✅ Single JOIN or batch IN
SELECT o.*, oi.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = $1;
```

### Batch Inserts and Bulk Loading

```sql
-- ❌ One INSERT per row (N round-trips, N transaction logs)
INSERT INTO events (type, data) VALUES ('click', '{}');
INSERT INTO events (type, data) VALUES ('view', '{}');

-- ✅ Multi-row INSERT (1 round-trip)
INSERT INTO events (type, data) VALUES
  ('click', '{}'),
  ('view', '{}'),
  ('scroll', '{}');

-- ✅ COPY for massive imports (fastest)
COPY events (type, data) FROM STDIN WITH (FORMAT csv);
```

### Explicit JOIN Syntax

**Never** use implicit joins in `WHERE`. Always use explicit `JOIN ... ON`.

### Parameterized Queries

**Never** concatenate strings into SQL. Always use `$1`, `$2` parameterized queries.
See `@.agents/rules/security-principles.md`.

---

## 7. Monitoring & Diagnostics (LOW-MEDIUM)

### pg_stat_statements — Top Resource Consumers

```sql
-- Enable: add to shared_preload_libraries, restart
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 queries by total execution time
SELECT query, calls, total_exec_time, mean_exec_time,
       rows, shared_blks_hit, shared_blks_read
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### VACUUM & ANALYZE

```sql
-- Run ANALYZE after large data changes (updates planner statistics)
ANALYZE orders;

-- Check autovacuum health
SELECT schemaname, relname, n_dead_tup, last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

**Tune autovacuum for high-churn tables:**

```sql
ALTER TABLE high_churn_table SET (
  autovacuum_vacuum_scale_factor = 0.01,    -- Default 0.20 (20%)
  autovacuum_analyze_scale_factor = 0.005   -- Default 0.10 (10%)
);
```

> Standard `VACUUM` runs concurrently (no exclusive lock).
> Only `VACUUM FULL` requires exclusive access (rewrites table).

---

## 8. Advanced Features (LOW)

### Full-Text Search

```sql
-- ✅ Use tsvector + GIN index (100x faster than LIKE '%term%')
ALTER TABLE articles ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);

SELECT * FROM articles WHERE search_vector @@ to_tsquery('english', 'postgres & performance');
```

For leading wildcard search (`LIKE '%term'`), use `pg_trgm` extension with GIN/GiST index.

### JSONB Indexing

```sql
-- GIN with jsonb_path_ops: 2-3x smaller, supports @> only
CREATE INDEX idx_events_data ON events USING GIN (data jsonb_path_ops);

-- Expression index for specific key lookups
CREATE INDEX idx_events_type ON events ((data->>'type'));
```

---

## Anti-Patterns Checklist

- ❌ Missing indexes on foreign keys
- ❌ N+1 queries (use `JOIN` or batch `IN`)
- ❌ String concatenation in queries (SQL injection risk)
- ❌ Storing comma-separated values in a single column (use arrays or junction table)
- ❌ `OFFSET` pagination on large datasets (use keyset)
- ❌ `timestamp` without timezone (use `timestamptz`)
- ❌ `varchar(n)` without reason (use `text`)
- ❌ Random UUID v4 as PK on large tables (use `bigint identity` or UUIDv7)
- ❌ Check-then-insert pattern (race condition — use `UPSERT`)
- ❌ `serial` for new tables (use `bigint generated always as identity`)
- ❌ `SELECT *` in production queries (list specific columns)
- ❌ `GRANT ALL` to application roles (principle of least privilege)
- ❌ Application-only data filtering without RLS (defense in depth)
- ❌ Long transactions with external I/O inside (hold locks, block VACUUM)
- ❌ Prepared statements with transaction-mode pooling (connection mismatch)
- ❌ Double-quoted identifiers (force case sensitivity, error-prone)

## Related

- Database Design Principles: `@.agents/rules/database-design-principles.md`
- Security Principles: `@.agents/rules/security-principles.md`
- Performance Optimization Principles: `@.agents/rules/performance-optimization-principles.md`
- Deep-dive references: `references/` directory in this skill
