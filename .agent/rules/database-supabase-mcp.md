---
name: database-supabase-mcp
description: >-
  Enforces using the Supabase MCP server for all database interactions, schema modifications, function/procedure alterations, and migration management.
always_on: true
---

# Database Operations via Supabase MCP Server

## 1. Core Rule & Mandate
Whenever dealing with the database—including inspecting schemas, modifying tables, creating/altering stored procedures, functions, triggers, views, or applying migrations—**always prioritize and use the Supabase MCP Server (`supabase-mcp-server`)**.

- **Target Supabase Project ID:** `cyvckmjocomqzipbvbpv`
- **Database Server:** `aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
- **MCP Server Name:** `supabase-mcp-server`

---

## 2. Function & Procedure Alterations Protocol
The primary rationale for using Supabase MCP is the ability to directly modify, alter, test, and manage all PostgreSQL database functions and schema objects in place:
1. **Modifying / Altering Functions:**
   - Execute `CREATE OR REPLACE FUNCTION` or `ALTER FUNCTION` directly via Supabase MCP (`apply_migration` for DDL, or `execute_sql`).
   - Verify function signature, parameter types, search path, and return type compatibility before execution.
2. **Schema & DDL Changes:**
   - Use `apply_migration` with descriptive migration names (e.g., `014_alter_functions_...`).
   - Store matching migration files under `backend/db/migrations/` to keep version control synchronized.
3. **Table & Schema Inspection:**
   - Inspect existing tables, columns, indexes, and constraints using `list_tables` and schema introspection queries before drafting changes.

---

## 3. Data Protection & PRD Invariants
1. **Zero Teardown / Data Retention Policy:**
   - Strictly prohibit dropping or purging tested data, Hyderabad demo records, or live entities.
   - Never run destructive truncation or teardown scripts that clear populated tables.
2. **Multi-Tenant Isolation (Rule 2):**
   - Ensure all tenant-scoped functions, triggers, and queries enforce `institution_id` isolation.
3. **Single Student Master Record (Rule 1):**
   - Maintain unified master records across all functions and queries. Student is never isolated into a separate workspace.
4. **Contract Safety:**
   - Consult `wingman` before changing database models or RPC function signatures to avoid breaking API consumers or frontend clients.
