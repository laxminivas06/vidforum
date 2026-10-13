# Profile: Implementation Plan

| | |
|---|---|
| `doc_type` | `implementation-plan` |
| Focus | **WHEN and WHO** — task breakdown, sequencing, ownership, milestones |
| Primary annotations | `requirement` (as tasks), `contract`, `decision` |

Annotation syntax and fields: `specification.md` §3–§4. Type values: `taxonomy.md`. This file adds only what is specific to implementation plans.

## ID prefixes

| Prefix | Applies to |
|---|---|
| `TASK-` | Tasks, written as `requirement` annotations — `TASK-001`, `TASK-DB-001` |
| `CT-` | Contracts the tasks produce |
| `ADR-` | Decisions made while planning |

A task is a `requirement` annotation whose `id` uses the `TASK-` prefix. The `acceptance` block is the task's definition of done.

## Section order

1. Overview — what is being built, link to the PRD/SDD, current state
2. Prerequisites — access, tooling, environment, upstream dependencies
3. Task Breakdown — ordered tasks with owner, estimate, acceptance criteria
4. Dependency Graph — task-to-task edges, critical path, parallelism
5. Risk Assessment — technical and schedule risks with mitigations
6. Milestones — checkpoints, delivery targets, review gates
7. Rollback Plan — reverting, data migration rollback, feature flags
8. Open Issues — blockers and pending decisions

## Additional rules

Beyond `specification.md` §6:

1. Every task MUST carry an `acceptance` block. This satisfies E5 without a test annotation — plans schedule work, they do not verify behavior.
2. Every task MUST name an owner, in frontmatter `owners` or in the prose beneath the annotation.
3. Every task SHOULD carry an estimate.
4. The dependency graph MUST be acyclic.
5. Every milestone MUST reference the tasks it depends on.
6. The PRD or SDD being implemented MUST appear in `dependencies.specs`.
7. When frontmatter defines `milestones`, every task SHOULD carry a `milestone` field matching a `milestones[].name`.

## Writing guidance

**Tasks are units of assignable work, and their acceptance criteria are observable.**

```html
<!-- requirement
  id: TASK-001
  title: Provision BigQuery dataset and tables
  priority: must
  category: operational
  rationale: Every downstream ingestion task is blocked until storage exists
  milestone: "Phase 1: Data Infrastructure"
  acceptance: |
    GIVEN terraform apply completes without error
    THEN the agy_consumption dataset exists
    AND usage_summary_daily exists with the schema in CT-DATA-001
    AND the service account holds roles/bigquery.dataViewer
-->
```

**Contracts here are deliverables** — what the task produces: `infrastructure` for Terraform, `data-schema` for migrations, `config` for settings, `operational` for monitoring.

**Use `priority` for sequencing pressure**, not importance: `must` blocks the milestone, `should` slips to the next one without breaking it.

**Use `milestone` to group tasks into delivery phases.** When frontmatter defines `milestones`, tag each task with `milestone: "Phase Name"`. Completeness rules (specification.md §6.5) evaluate per milestone — a Phase 2 task does not block Phase 1 approval. Tasks without a `milestone` are implicitly in every phase.

## Multi-agent slicing

Implementation plans are the natural orchestration input. Each task's `traced_by` closure in the manifest is a self-contained work package, and the dependency graph determines what runs in parallel:

```
Orchestrator reads the manifest
  ├─ DB agent        TASK-001, TASK-005
  ├─ Backend agent   TASK-002, TASK-003
  ├─ Frontend agent  TASK-004, TASK-006
  ├─ Infra agent     TASK-007, TASK-008
  └─ QA agent        verifies every TASK-* acceptance block
```

For phased delivery, the orchestrator can also slice by milestone:

```
Orchestrator reads the manifest, filters by milestone
  Phase 1: "Data Infrastructure"
  ├─ DB agent        TASK-001, TASK-005
  └─ Infra agent     TASK-007
  Phase 2: "API Layer"
  ├─ Backend agent   TASK-002, TASK-003
  └─ Frontend agent  TASK-004, TASK-006
```

## Boundary

| Dimension | PRD | SDD | Implementation Plan |
|---|---|---|---|
| Answers | WHAT and WHY | HOW | WHEN and WHO |
| Granularity | Features | Components | Tasks |
| Time-bound | No | No | Yes |
| Has estimates and owners | No | No | Yes |

If a "task" has no owner and no completion criterion, it is a requirement in the wrong document.
