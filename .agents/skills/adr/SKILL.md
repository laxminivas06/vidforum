---
name: adr
description: Architecture Decision Record skill for documenting significant architectural decisions with context, options, and consequences. Use during the Research phase when choosing between approaches, or whenever the user asks to document an architectural decision.
---

# Architecture Decision Record (ADR) Skill

## Purpose
Document significant architectural decisions so institutional knowledge persists across conversations and team members. ADRs capture the **why**, not just the **what**.

## When to Invoke
- During Research phase (`phase-research.md`) when a significant architecture decision is identified
- When user explicitly asks to document a decision
- When choosing between 2+ viable approaches
- When introducing a new dependency or pattern
- When changing existing architecture

## ADR Storage
ADRs are stored in `docs/decisions/` as numbered files:
```text
docs/decisions/
├── 0001-use-postgresql-for-storage.md
├── 0002-adopt-feature-based-structure.md
├── 0003-use-testcontainers-for-integration.md
└── NNNN-short-title.md
```

## ADR Template

Create the ADR file at `docs/decisions/NNNN-short-title.md` (e.g., `0001-use-postgresql-for-storage.md`):

### ID conventions

An ADR has three identifiers — each serves a different purpose:

| Identifier | Convention | Example | Purpose |
|---|---|---|---|
| **File name** | `NNNN-short-title.md` | `0001-use-postgresql-for-storage.md` | Human navigation in `docs/decisions/` |
| **`spec_id`** (frontmatter) | `ADR-NNNN-SHORT-SLUG-VN` | `ADR-0001-USE-POSTGRESQL-V1` | Globally unique document ID for cross-references |
| **`id`** (annotation) | `ADR-NNNN` | `ADR-0001` | Annotation-level decision ID for traceability links |

The file number (`NNNN`) is the single source of truth — `spec_id` and annotation `id` derive from it.

### Template

```markdown
---
$schema: "https://raw.githubusercontent.com/irahardianto/awesome-agv/main/.agents/skills/structured-spec/spec-schema.json"
spec_id: "ADR-0001-USE-POSTGRESQL-V1"
title: "Use PostgreSQL for primary storage"
doc_type: "adr"
status: "proposed"
version: "1.0.0"
owners: ["platform-team"]
created: "2026-08-20"
modified: "2026-08-20"
---

<!-- decision
  id: ADR-0001
  title: Use PostgreSQL for primary storage
  status: proposed
  context: The application needs a relational database with ACID transactions, JSON support, and row-level security for multi-tenant isolation.
  alternatives: ["PostgreSQL", "MySQL", "CockroachDB"]
  rationale: PostgreSQL provides the best combination of JSONB support, RLS, and ecosystem maturity for our scale.
  consequences: Operational complexity of managing PostgreSQL in production. Team must learn RLS patterns. Limits future migration to non-relational stores.
  affects_requirements: [REQ-DATA-001]
-->

## Context
What is the issue that we're seeing that is motivating this decision?
Include technical constraints, business requirements, and relevant context.

## Decision
We chose **PostgreSQL** as the primary storage engine.

## Alternatives Considered

### Option A: PostgreSQL
- **Pros:** JSONB, RLS, mature ecosystem, strong community
- **Cons:** Operational overhead, single-node write bottleneck at extreme scale
- **Effort:** Low (team has experience)

### Option B: MySQL
- **Pros:** Widely deployed, good tooling
- **Cons:** No native RLS, weaker JSON support, less extensible
- **Effort:** Low

### Option C: CockroachDB
- **Pros:** Distributed SQL, automatic sharding, PostgreSQL-compatible wire protocol
- **Cons:** Younger ecosystem, higher operational complexity, cost at scale
- **Effort:** Medium (unfamiliar tooling)

## Rationale
PostgreSQL provides the best combination of JSONB support, row-level security, and ecosystem maturity for our current scale. CockroachDB was a strong contender but adds operational complexity we don't need until we outgrow single-node writes.

## Consequences

### Positive
- JSONB enables flexible schema evolution without migrations for non-critical fields
- RLS simplifies multi-tenant data isolation at the database layer

### Negative
- Team must learn RLS policy patterns (training cost)
- Single-node write bottleneck may require sharding at >10K TPS

### Risks
- Migration to a non-relational store would be costly if requirements shift
- RLS misconfiguration could expose tenant data (mitigated by integration tests)

## Related
- Architectural Patterns @architectural-pattern.md
- Database Design Principles @database-design-principles.md
```

## Process Guidelines

1. **Number sequentially** — check existing ADRs in `docs/decisions/` for the next number
2. **Keep titles short** — descriptive enough to identify the decision at a glance
3. **Status lifecycle:** `proposed` → `accepted` (after approval) → optionally `deprecated` or `superseded`
4. **Never delete ADRs** — if a decision is reversed, mark as `superseded` (with `superseded_by` in frontmatter) and create a new ADR
5. **Use Sequential Thinking skill** if the trade-off analysis is complex

## Structured Spec Integration

- **Cross-reference:** See `structured-spec/profiles/adr.md` for full annotation field reference and additional rules.
- **Standalone vs embedded:** Standalone ADRs live in `docs/decisions/`; decisions scoped to a single SDD/PRD should be embedded as `<!-- decision -->` annotations within that document.
- **Completeness:** When status is `accepted`, verify the ADR satisfies `specification.md` §6 and `profiles/adr.md` additional rules.
- **Annotation fields reference:** Point to `specification.md §4.5` for the complete field table.

## Rule Compliance
ADRs should reference applicable rules:
- Architectural Patterns @architectural-pattern.md
- Core Design Principles @core-design-principles.md
- Project Structure @project-structure.md
