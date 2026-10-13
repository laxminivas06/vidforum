# Structured Spec Standard

**Version:** 2.0.0

A technology-agnostic standard for specification documents that are simultaneously human-readable, AI-writable, and machine-parseable.

Applies to PRDs, SDDs, implementation plans, TSDs, BDD specs, ADRs, and any planning document used in software development.

**This file owns:** annotation syntax, annotation field tables, the traceability model, completeness rules, and the parser/manifest contract.
**It does not define:** contract types, test types, architecture types, or stack categories — those live in `taxonomy.md`. Profile-specific section order and ID prefixes live in `profiles/<doc_type>.md`.

---

## 1. Model

A structured spec is standard GitHub-Flavored Markdown plus a lightweight annotation layer carried in HTML comments. Three layers coexist in one file:

```
LAYER 3  CODE CONTRACTS       Native, executable code blocks (SQL, OpenAPI, TS, HCL…)
LAYER 2  ANNOTATIONS          HTML comments with typed key-value metadata
LAYER 1  MARKDOWN NARRATIVE   Prose, tables, Mermaid diagrams
```

### 1.1 Design principles

1. **Markdown-first.** Every document is valid GFM. Annotations are HTML comments that all renderers silently ignore.
2. **Progressive formality.** A `draft` may carry no annotations at all. Formality is required only as the document matures (§6.3).
3. **Single-direction traceability.** Every link is written exactly once, by the child (§5). Nothing is stated twice, so nothing can disagree.
4. **Stack-agnostic.** The meta-format assumes no language, database, cloud, or framework. Technology lives inside code blocks.
5. **Deterministic parseability.** A single regex or AST pass extracts everything. No NLP.
6. **Zero-hop executability.** Code contracts are runnable/compilable as written, with no transformation.

---

## 2. Document Structure

```
[1] YAML frontmatter   — machine metadata, always present
[2] Narrative sections — prose + annotations + code blocks
[3] Appendix           — optional: references, glossary, changelog
```

### 2.1 Frontmatter

Every spec MUST begin with YAML frontmatter delimited by `---`. `spec-schema.json` is the machine-checkable definition of this section; the tables below are its human-readable description. If the two ever disagree, `spec-schema.json` wins.

```yaml
---
$schema: "https://raw.githubusercontent.com/irahardianto/awesome-agv/main/.agents/skills/structured-spec/spec-schema.json"
spec_id: "PRD-PROJECT-FEATURE-V1"
title: "Document Title"
doc_type: "prd"
status: "draft"
version: "1.0.0"
owners: ["team-a"]
created: "2026-08-18"
modified: "2026-08-18"
---
```

#### Required fields

| Field | Type | Description |
|---|---|---|
| `$schema` | string | Always `https://raw.githubusercontent.com/irahardianto/awesome-agv/main/.agents/skills/structured-spec/spec-schema.json` |
| `spec_id` | string | Globally unique. Convention: `DOCTYPE-PROJECT-FEATURE-VN` |
| `title` | string | Human-readable title |
| `doc_type` | enum | `prd`, `sdd`, `implementation-plan`, `tsd`, `bdd`, `adr`, `custom` — closed set |
| `status` | enum | `draft`, `in-review`, `approved`, `deprecated`, `superseded` |
| `version` | string | Semantic version of this document |
| `owners` | string[] | At least one responsible team or person |
| `created` | string | ISO 8601 date |
| `modified` | string | ISO 8601 date |

#### Optional fields

| Field | Type | Description |
|---|---|---|
| `supersedes` | string | `spec_id` this version replaces |
| `superseded_by` | string | `spec_id` that replaces this version |
| `stakeholders` | object[] | `{name, role, team}` |
| `stack_profile` | object | `{primary_language, runtime, database, infrastructure, platform, …}` |
| `contract_types_used` | string[] | Contract types present, from `taxonomy.md` §1 |
| `dependencies` | object | `{specs: string[], external_systems: object[]}` |
| `milestones` | object[] | `{name, target_date, status}` |
| `risk_assessment` | object[] | `{risk, severity, mitigation, owner}` |

Service level objectives are **not** frontmatter. They are `<!-- slo -->` annotations (§4.6), so that each one carries an ID and can be traced.

### 2.2 Section ordering

The profile named by `doc_type` recommends a section order. Profiles are guidelines, not constraints: add, remove, or reorder sections to fit the document. See `profiles/<doc_type>.md`.

---

## 3. Annotation Syntax

```html
<!-- annotation_type
  key: value
  key: ["item1", "item2"]
  key: |
    Multi-line value
    preserves newlines
-->
```

Rules:

- Opening tag is `<!-- ` followed by the lowercase annotation type, then a newline.
- Each key-value pair sits on its own line, indented exactly 2 spaces.
- List values use YAML inline array syntax: `["a", "b"]`. ID lists may omit quotes: `[REQ-001, REQ-002]`.
- Multi-line strings use YAML literal block style `|`.
- Closing tag `-->` sits on its own line.
- An annotation MUST immediately precede the content it describes, separated by at most one blank line.
- Annotation IDs MUST be unique within the document.

### 3.1 ID format

`PREFIX-NNN` or `PREFIX-SCOPE-NNN` — for example `REQ-001`, `REQ-AUTH-002`, `CT-DATA-001`.

Prefixes are assigned per profile (see `profiles/<doc_type>.md`). The universal defaults are `REQ-` requirements, `CT-` contracts, `TC-` tests, `ARCH-` architecture, `ADR-` decisions, `SLO-` service level objectives.

---

## 4. Annotation Types

Six types exist. Each row marked **Required** must be present for the document to validate.

### 4.1 `requirement`

States something the system must do or must be. Never describes implementation.

```html
<!-- requirement
  id: REQ-001
  title: Attribute every API call to an enterprise user
  priority: must
  category: functional
  rationale: Cost allocation is impossible without per-user attribution
  acceptance: |
    GIVEN a Gemini API call carrying an OS username
    WHEN the ingestion job processes the log record
    THEN the call is attributed to exactly one enterprise user
  milestone: "Phase 1: Core Attribution"
-->
```

| Field | Required | Values |
|---|---|---|
| `id` | Yes | Unique. §3.1 |
| `title` | Yes | Short, imperative mood |
| `priority` | Yes | `must`, `should`, `may`, `must-not` (RFC 2119) |
| `category` | Yes | `functional`, `nonfunctional`, `security`, `compliance`, `ux`, `performance`, `reliability`, `operational` |
| `rationale` | No | Why this requirement exists |
| `acceptance` | No | Gherkin-style criteria, literal block |
| `milestone` | No | Name of the milestone/phase this requirement belongs to. Must match a `milestones[].name` in frontmatter when milestones are defined |

A requirement declares **no outbound links**. Contracts, tests, architecture, SLOs, and decisions all point *at* it (§5).

### 4.2 `contract`

Attaches machine-readable meaning to the code block that immediately follows.

```html
<!-- contract
  id: CT-DATA-001
  type: data-schema
  title: Daily usage summary table
  stack_category: relational-database
  implements_requirements: [REQ-001, REQ-003]
-->
```

| Field | Required | Values |
|---|---|---|
| `id` | Yes | Unique. §3.1 |
| `type` | Yes | One of the 8 contract types in `taxonomy.md` §1 |
| `title` | Yes | Human-readable title |
| `implements_requirements` | Yes | ≥1 requirement ID |
| `stack_category` | No | From `taxonomy.md` §4 |
| `milestone` | No | Name of the milestone/phase this contract belongs to. Inherits from the requirement if omitted |

A `contract` MUST be followed by a fenced code block containing directly executable content.

### 4.3 `test`

Specifies a verification scenario. Precedes a Gherkin block or equivalent.

```html
<!-- test
  id: TC-ATTRIB-001
  type: acceptance-test
  title: Known OS username maps to enterprise user
  verifies_requirements: [REQ-001]
-->
```

| Field | Required | Values |
|---|---|---|
| `id` | Yes | Unique. §3.1 |
| `type` | Yes | `acceptance-test` or `integration-test` — `taxonomy.md` §2 |
| `verifies_requirements` | Yes | ≥1 requirement ID |
| `title` | No | Human-readable title |
| `milestone` | No | Name of the milestone/phase this test belongs to. Inherits from the verified requirement if omitted |

### 4.4 `architecture`

Annotates a diagram.

```html
<!-- architecture
  id: ARCH-001
  type: c4-container
  title: Ingestion and serving containers
  supports_requirements: [REQ-001]
-->
```

| Field | Required | Values |
|---|---|---|
| `id` | Yes | Unique. §3.1 |
| `type` | Yes | One of the 8 architecture types in `taxonomy.md` §3 |
| `title` | No | Human-readable title |
| `supports_requirements` | No | Requirement IDs this diagram illustrates |

### 4.5 `decision`

Captures a design or architecture decision.

```html
<!-- decision
  id: ADR-001
  title: Store raw payloads in BigQuery rather than Cloud SQL
  status: accepted
  context: Ingestion is append-heavy and analytical, not transactional
  alternatives: ["BigQuery", "Cloud SQL", "Firestore"]
  rationale: Columnar storage matches the aggregation query pattern and cost profile
  consequences: No sub-second point lookups; analytics queries are cheap and fast
  affects_requirements: [REQ-003]
-->
```

| Field | Required | Values |
|---|---|---|
| `id` | Yes | Unique. §3.1 |
| `title` | Yes | Short title |
| `status` | Yes | `proposed`, `accepted`, `deprecated`, `superseded` |
| `context` | Yes | Why the decision was needed |
| `rationale` | Yes | Why this option was chosen |
| `alternatives` | No | Options considered. SHOULD list ≥2 |
| `consequences` | No | Downstream impact, positive and negative |
| `affects_requirements` | No | Requirement IDs this decision constrains |

### 4.6 `slo`

Defines one service level objective.

```html
<!-- slo
  id: SLO-001
  title: Dashboard query latency
  target: p95 < 800ms
  measurement: Cloud Monitoring latency metric on the /api/usage endpoint
  alert_threshold: p95 > 1200ms for 5min
  constrains_requirements: [REQ-NFR-001]
-->
```

| Field | Required | Values |
|---|---|---|
| `id` | Yes | Unique. §3.1 |
| `title` | Yes | Short title |
| `target` | Yes | The objective expression |
| `measurement` | Yes | How it is measured |
| `alert_threshold` | No | When to page |
| `constrains_requirements` | No | Requirement IDs this SLO bounds |

---

## 5. Traceability Model

### 5.1 One direction only

Every link is declared **exactly once, by the child**, pointing at the requirement it serves:

```
contract     --implements_requirements-->  requirement
test         --verifies_requirements---->  requirement
architecture --supports_requirements---->  requirement
slo          --constrains_requirements-->  requirement
decision     --affects_requirements----->  requirement
```

Requirements never point back. The reverse index (`traced_by`) is **derived by the parser** and appears only in the generated manifest (§7.2).

This is the single most important rule in the standard. Earlier versions asked authors to mirror each link on both ends; in practice the two copies drifted apart and the document became self-contradictory. Write the link once, at the point where the contract or test is authored.

### 5.2 Adding a test or contract

Add the annotation with its `implements_requirements` / `verifies_requirements` list. **Do not edit the requirement.** Nothing else needs to change.

---

## 6. Completeness Rules

### 6.1 Errors — a conforming document MUST satisfy all of these

| # | Rule |
|---|---|
| E1 | Every annotation `id` is unique within the document |
| E2 | Every requirement ID referenced by any annotation resolves to a defined `requirement` |
| E3 | Every `contract` declares ≥1 `implements_requirements` |
| E4 | Every `test` declares ≥1 `verifies_requirements` |
| E5 | Every requirement with priority `must` or `must-not` is either verified by ≥1 test or carries an inline `acceptance` block. Profiles that own verification (`prd`, `bdd`, `tsd`) strengthen this to require a test |
| E6 | Every `contract` `type` is a valid contract type; every `test` `type` is a valid test type |
| E7 | Every required field listed in §4 is present |
| E8 | Frontmatter validates against `spec-schema.json` |

### 6.2 Warnings — SHOULD be satisfied, do not block

| # | Rule |
|---|---|
| W1 | Every `must` requirement is implemented by ≥1 contract. Requirements with `category: ux`, `performance`, or `operational` are commonly satisfied by an SLO or a process instead, and are exempt |
| W2 | Every `decision` lists ≥2 `alternatives` |
| W3 | Every `decision` describes `consequences` |
| W4 | Every requirement carries a `rationale` |
| W5 | No requirement is referenced by nothing at all |

### 6.3 When rules apply

| `status` | Enforcement |
|---|---|
| `draft` | Nothing enforced. Annotations optional. Report findings as information only |
| `in-review` | Errors reported as errors, warnings as warnings |
| `approved` | Errors MUST be zero |
| `deprecated`, `superseded` | Not validated |

This is how "progressive formality" (§1.1) and the completeness rules coexist: a sketch is never blocked, an approved document is never incomplete.

### 6.4 Profile rules

A profile may **add** rules and may **strengthen** a rule listed above. A profile may never weaken or contradict one. Where a profile strengthens a rule, the stricter form applies automatically based on `doc_type`.

### 6.5 Milestone-scoped completeness

When frontmatter `milestones` are defined and annotations carry `milestone` fields, completeness rules (§6.1 E1–E8) apply **per milestone**:

- A `must` requirement tagged `milestone: "Phase 2"` does not need a contract or test in Phase 1.
- An `approved` document may have unfulfilled requirements for future milestones — only the **current** milestone's requirements must satisfy E3, E4, E5.
- The "current" milestone is the one whose `status` is `in-progress` in frontmatter. If none is `in-progress`, all milestones are evaluated.
- Requirements and contracts **without** a `milestone` field are implicitly scoped to all milestones (backward compatible — existing documents are unaffected).
- A reviewer assessing a phased delivery checks: "Are all `must` requirements **for the current milestone** covered by contracts and tests?"

---

## 7. Parser Contract

### 7.1 Responsibilities

A conforming parser MUST:

1. Extract YAML frontmatter and validate it against `spec-schema.json`
2. Scan for all HTML-comment annotations
3. Parse each into a typed object
4. Build the reverse index by inverting the child→parent links of §5.1
5. Evaluate §6 at the enforcement level implied by `status`
6. Emit the manifest below

Verify completeness by checking each rule in the table above against the document.

### 7.2 Manifest

```json
{
  "$schema": "https://raw.githubusercontent.com/irahardianto/awesome-agv/main/.agents/skills/structured-spec/manifest-schema.json",
  "spec_id": "PRD-PROJECT-V1",
  "doc_type": "prd",
  "title": "Document Title",
  "status": "approved",
  "requirements": [
    {
      "id": "REQ-001",
      "priority": "must",
      "category": "functional",
      "traced_by": {
        "contracts": ["CT-DATA-001"],
        "tests": ["TC-ATTRIB-001"],
        "architecture": ["ARCH-001"],
        "slos": [],
        "decisions": []
      }
    }
  ],
  "contracts": [{ "id": "CT-DATA-001", "type": "data-schema", "implements_requirements": ["REQ-001"] }],
  "tests": [{ "id": "TC-ATTRIB-001", "type": "acceptance-test", "verifies_requirements": ["REQ-001"] }],
  "architecture": [{ "id": "ARCH-001", "type": "c4-container" }],
  "decisions": [{ "id": "ADR-001", "status": "accepted" }],
  "slos": [{ "id": "SLO-001", "target": "p95 < 800ms" }],
  "validation": { "status": "approved", "errors": [], "warnings": [] }
}
```

`traced_by` is derived. It never appears in the source document.

---

## 8. Multi-Agent Slicing

Annotation IDs are deterministic partition keys. An orchestrator reads the manifest and hands disjoint ID sets to subagents:

| Strategy | Partition by | Best for |
|---|---|---|
| By contract ID | Explicit ID list | Targeted implementation |
| By contract type | All `infrastructure` to one agent | Role-based teams |
| By requirement | A requirement's `traced_by` closure | Feature-oriented teams |
| By stack category | All `relational-database` to one agent | Tech-specialized agents |
| By milestone | All annotations in `Phase 1` to one team | Phased delivery |

Because links are single-direction, a requirement's full work package is exactly its `traced_by` closure in the manifest — no reconciliation needed.

---

## 9. Migration

Existing plain Markdown upgrades incrementally. Annotations are purely additive; no prose rewriting is required.

1. Add frontmatter with the nine required fields, `status: draft`
2. Add `<!-- requirement -->` above requirement-like statements
3. Tag existing code blocks with `<!-- contract -->` and set `implements_requirements`
4. Add `<!-- test -->` annotations with `verifies_requirements`
5. Verify against §6 completeness rules, fix gaps, then raise `status`

Migrating from standard v1.0.0: delete every `traces:` block from requirement annotations (the information is now derived), move frontmatter `slos:` into `<!-- slo -->` annotations, and retype any `contract` that used `acceptance-test` or `integration-test` as a `test` annotation.

---

## 10. File Manifest

```
structured-spec/
  SKILL.md            Entry point: when to use, profile routing, workflow
  specification.md    This file — syntax, fields, traceability, completeness
  taxonomy.md         Controlled vocabularies (contract/test/architecture/stack)
  spec-schema.json    JSON Schema for frontmatter
  template.md         Blank starter
  example-prd.md      Conformant worked example (PRD profile)
  profiles/
    prd.md  sdd.md  implementation-plan.md  tsd.md  bdd.md  adr.md
```
