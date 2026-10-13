---
name: structured-spec
description: Write, review, validate, or parse structured specification documents — PRDs, SDDs (design docs), implementation plans, TSDs (technical specs), BDD specs, and ADRs (architecture decision records) — using the Structured Spec standard (YAML frontmatter + Markdown narrative + HTML-comment annotations for requirement/contract/test/architecture/decision/slo + executable code contracts, with requirement-to-contract-to-test traceability). Use when asked to draft, scaffold, template, or check completeness/traceability of a spec, requirements doc, design doc, or decision record, migrate a plain-Markdown spec to this format, or slice a spec into tasks for multiple agents.
---

# Structured Spec

Specification documents that are readable by humans, writable by agents, and parseable by machines. Standard GitHub-Flavored Markdown plus typed annotations carried in HTML comments, so renderers ignore them and parsers don't have to guess.

**Standard version 2.0.0.** Every file in this directory is at 2.0.0; do not mix with v1 documents (see `specification.md` §9 to migrate one).

## Use this skill when

- Writing or reviewing a PRD, SDD, implementation plan, TSD, BDD spec, or ADR
- Validating a spec's completeness or requirement traceability
- Migrating plain Markdown into the structured format
- Slicing a spec into work packages for multiple agents

Not for: ordinary prose docs, READMEs, or runbooks that have no requirements to trace.

## Where to look

Read only what the task needs. These files do not repeat each other — each fact lives in exactly one place.

| Question | File |
|---|---|
| Which document type do I write? | This file, next section |
| What are the annotation fields and rules? | `specification.md` §3–§4 |
| How does traceability work? | `specification.md` §5 |
| When is a spec complete? | `specification.md` §6 |
| Which `type` value do I use? | `taxonomy.md` |
| What section order for this doc type? | `profiles/<doc_type>.md` |
| Is the frontmatter legal? | `spec-schema.json` |
| Show me a full real document | `example-prd.md` |
| Give me a blank starting point | `template.md` |
| Is this document actually valid? | Manual review against `specification.md` §6 completeness rules |

## Pick the profile

`doc_type` is a closed set of seven. Choose by the question the document answers:

| The document answers | `doc_type` | Profile |
|---|---|---|
| WHY — business context, users, success criteria | `prd` | `profiles/prd.md` |
| HOW — architecture, components, trade-offs | `sdd` | `profiles/sdd.md` |
| WHEN and WHO — tasks, sequencing, owners | `implementation-plan` | `profiles/implementation-plan.md` |
| INTERFACE — APIs, payloads, errors, versioning | `tsd` | `profiles/tsd.md` |
| BEHAVIOR — scenarios and edge cases | `bdd` | `profiles/bdd.md` |
| DECISION — one choice, its alternatives and consequences | `adr` | `profiles/adr.md` |
| None of the above | `custom` | no profile; universal rules only |

If the request spans several, write separate documents and link them via `dependencies.specs`. Do not merge a PRD and an SDD into one file.

## When to consolidate vs separate

Not every project needs six documents. Use project scale to decide:

| Scale | Guidance |
|---|---|
| **Small (Tier 1, ≤5 files, single module)** | One PRD is sufficient. Embed BDD scenarios inline (Section 7: Acceptance Tests). Embed API contracts inline. No separate SDD, TSD, or BDD document needed. |
| **Medium (Tier 2, cross-module, 6+ files)** | PRD + SDD. Embed decisions as inline `<!-- decision -->` annotations in the SDD. Separate TSD only if external consumers exist. Separate BDD only if scenario count exceeds ~15. |
| **Large (Tier 3, public API, multi-service)** | Full separation: PRD + SDD + TSD + BDD + Implementation Plan. Standalone ADRs for decisions that outlive the SDD. |

**Rule of thumb**: Start with one document. Separate when a section grows past what a single reader needs to scan (typically >15 scenarios for BDD, >10 endpoints for TSD, or when different audiences need different documents).

## Phased delivery

For large features, use `milestones` in frontmatter and `milestone` fields on annotations to split delivery into phases:

1. **Define milestones** in frontmatter: `milestones: [{name: "Phase 1: Core", target_date: "2026-09-01", status: "in-progress"}, ...]`
2. **Tag annotations** with `milestone: "Phase 1: Core"` — requirements, contracts, tests, and tasks
3. **Review per phase** — completeness rules (§6.5) apply per milestone. Phase 2 requirements don't block Phase 1 approval.
4. **Slice by milestone** — orchestrators can dispatch Phase 1 tasks first, then Phase 2 after review

Annotations without a `milestone` field belong to all phases (backward compatible).

## Document storage

Structured spec documents live under `docs/` alongside other project documentation. Each document type has a prescribed location:

```text
docs/
├── specs/                    ← PRDs, SDDs, TSDs, BDD specs, Implementation Plans
│   ├── prd-billing-export.md
│   ├── sdd-payment-service.md
│   ├── tsd-billing-api.md
│   ├── bdd-checkout-flow.md
│   └── plan-v2-migration.md
├── decisions/                ← ADRs (convention from `adr` skill)
│   ├── 0001-use-postgresql.md
│   └── 0002-adopt-feature-structure.md
├── research_logs/            ← Research findings (convention from `research-methodology` skill)
├── audits/                   ← Audit reports (convention from `code-review` skill)
└── debugging/                ← Debug investigations (convention from `debugging-protocol` skill)
```

**File naming for specs**: `{doc_type}-{short-slug}.md` (e.g., `prd-billing-export.md`, `sdd-payment-service.md`). The `spec_id` in frontmatter is the canonical identifier; the filename is for human navigation.

**ADRs stay in `docs/decisions/`** — the `adr` skill owns that convention (`NNNN-short-title.md` numbering). Do not move ADRs to `docs/specs/`.

**`.agentwork/` is ephemeral** — scope cards, handoffs, findings, and pipeline artifacts go there. Persisted specifications always go under `docs/`.

## Workflow

1. **Pick the profile** from the table above. If genuinely ambiguous, ask; otherwise infer and state the choice.
2. **Open `profiles/<doc_type>.md`** for that profile's ID prefixes, section order, and extra rules.
3. **Write frontmatter.** Nine required fields. New documents start at `status: draft`.
4. **Write the narrative.** Plain Markdown. Context and reasoning that annotations cannot carry.
5. **Add annotations** immediately above what they describe — `specification.md` §4 for fields, `taxonomy.md` for `type` values.
6. **Link once, from the child.** Contracts, tests, architecture, SLOs, and decisions name the requirements they serve. Requirements never point back; the reverse index is derived. Adding a test never means editing a requirement.
7. **Verify completeness** against `specification.md` §6. Fix gaps before raising `status` above `draft`.

## Minimum viable spec

Enough to be valid. Everything else is elaboration.

````markdown
---
$schema: "https://raw.githubusercontent.com/irahardianto/awesome-agv/main/.agents/skills/structured-spec/spec-schema.json"
spec_id: "PRD-BILLING-EXPORT-V1"
title: "Billing Export"
doc_type: "prd"
status: "draft"
version: "0.1.0"
owners: ["platform-team"]
created: "2026-08-18"
modified: "2026-08-18"
---

# 1. Problem Context

Finance reconciles invoices by hand because usage data never leaves the platform.

<!-- requirement
  id: REQ-001
  title: Export daily usage as CSV
  priority: must
  category: functional
  rationale: Manual reconciliation costs the finance team two days per month
-->

Exports run nightly and cover the previous UTC day.

<!-- contract
  id: CT-API-001
  type: api-contract
  title: Usage export endpoint
  stack_category: application-code
  implements_requirements: [REQ-001]
-->

```yaml
paths:
  /exports/usage:
    get:
      parameters: [{ name: date, in: query, required: true, schema: { type: string, format: date } }]
      responses: { "200": { description: CSV export } }
```

<!-- test
  id: TC-001
  type: acceptance-test
  title: Export returns the previous day's usage
  verifies_requirements: [REQ-001]
-->

```gherkin
Scenario: Export returns the previous day's usage
  Given usage exists for 2026-08-17
  When the client requests the export for 2026-08-17
  Then the response is CSV containing that day's rows
```
````

## Rules that are easy to get wrong

1. **Link once, from the child.** Never mirror a link on both ends — that is what made v1 documents contradict themselves.
2. **Tests are not contracts.** `acceptance-test` and `integration-test` are `test` types. A Gherkin block is never a `<!-- contract -->`.
3. **Code contracts run as written.** No pseudocode, no `...` elisions inside a contract's code block.
4. **IDs are unique per document** and never renumbered once the status is `approved` — other specs cite them.
5. **Annotations touch the content they describe**, separated by at most one blank line.
6. **`draft` is never blocked.** Enforcement scales with `status`; see `specification.md` §6.3. Do not refuse to write a rough draft because it lacks tests.
