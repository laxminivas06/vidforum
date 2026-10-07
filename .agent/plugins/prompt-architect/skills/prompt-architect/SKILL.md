---
name: prompt-architect
description: >-
  Use at the very beginning (Phase 0: Intake) to expand, optimize, and structure plain-English user prompts into engineered architectural specifications enforcing PRD rules, multi-tenancy, RBAC, Ponytail Ultra, and acceptance criteria before code is written.
---

# Prompt Architect Skill (`prompt-architect`)

**Phase:** Phase 0 (Intake & Prompt Mastery)  
**Role:** Senior Architecture & Prompt Engineering Gate  
**Objective:** Transform natural, plain-language user requests into high-precision, context-enriched execution blueprints tailored to the VID Platform ecosystem.

---

## 1. When to Activate
- **Every incoming user request** that introduces a feature, modification, refactor, or bug fix.
- Whenever a request is stated loosely, informally, or without technical specifics (e.g. *"add a button to filter users"*, *"make a way to upload marks"*, *"fix tenant login"*).
- Before invoking coding agents or making file modifications.

---

## 2. The 5-Pillar Prompt Optimization Protocol

When processing a user prompt, `prompt-architect` executes this 5-stage synthesis:

### Pillar 1: Objective & Scope Clarification
- **User Intent:** What is the fundamental outcome the user expects?
- **Target Persona & Role:** Which of the 9 RBAC roles interacts with this feature (`SUPER_ADMIN`, `INSTITUTION_ADMIN`, `FACULTY`, `STUDENT`, etc.)?
- **Affected Surface:** Identify specific URLs, files, components, and API routes.

### Pillar 2: Architectural Invariants Check (PRD Non-Negotiables)
Every generated prompt must explicitly bind the execution agent to these permanent rules:
1. **Rule 1 (Student Master):** The student is a central master entity, never an isolated workspace.
2. **Rule 2 (Tenant Isolation):** Every tenant model, query, and file operation must be scoped by `institution_id`.
3. **Rule 5 & 25 (Module Governance):** Navigation and workspace visibility must respect dynamic permissions and enabled modules.
4. **Zero Duplicate Data & Dates Policy:** No duplicate dates, static copy-pasted timestamps, or duplicate mock records. All IDs and dates must be strictly unique and dynamic.
5. **RBAC Isolation:** Super Admin platform infrastructure is strictly separated from school operations.

### Pillar 3: Code Minimalism & UI Directives (Ponytail Ultra)
- **UI Primitives Reuse:** Mandate reusing `@/components/ui/` (`Button`, `Card`, `Table`, `Badge`, `Form`, `Select`, `SlideOver`, `ConfirmDialog`, `States`). Strictly forbid ad-hoc re-implementations.
- **Native Platform First:** Favor native standard library and browser features over new npm dependencies.
- **Shortest Working Diff:** Plan for the fewest touched files and lines that completely satisfy the requirement.
- **Responsive Guarantee:** Layout must support 320px to 1440px with zero horizontal scroll and mobile table-to-card collapse.

### Pillar 4: Data Contract & State Synchronization
- **API Response Envelope:** Mandate `{ success: boolean, data?: T, message?: string, error?: { code, message } }`.
- **Route Namespace:** Must use `/api/v1/<domain>`.
- **Query Cache Invalidation:** Explicitly declare TanStack Query cache keys to invalidate upon mutation (e.g. `["institutions"]`, `["users"]`).
- **Offline / Local Resilience:** Plan for offline fallback caching via `localStorage` when appropriate.

### Pillar 5: Measurable Acceptance Criteria & Test Scenarios
- **Happy Path:** Expected behavior under normal operation.
- **Edge Cases & Failure Modes:** Empty inputs, duplicate records, offline network, unpermitted roles.
- **Verification Plan:** Explicit verification steps (e.g. `npx tsc --noEmit`, API tests, browser verification).

---

## 3. Standard Optimized Output Template

When `prompt-architect` optimizes a prompt, it formats the blueprint as follows:

```markdown
### 🎯 Feature Objective
[Clear 1-sentence statement of what will be built or modified]

### 🛡️ Architectural & Domain Invariants
- **Multi-Tenant Scoping:** Enforce `institution_id` partition.
- **RBAC Role Authorization:** Limited to [Target Roles].
- **Zero Duplicate Policy:** Strictly distinct timestamps and unique keys.
- **Student Master Guarantee:** Preserves central student invariants.

### 🎨 UI & Implementation Blueprint (Ponytail Ultra)
- **Components to Reuse:** `@/components/ui/[Component1, Component2]`
- **Responsive Behavior:** 320px mobile card / desktop table behavior.
- **Shortest Diff Path:** Modify only [File1, File2].

### 🔌 Data Contracts & API Schema
- **Endpoint:** `METHOD /api/v1/...`
- **Payload / Query:** `{ field1, field2 }`
- **Cache Invalidation:** `queryClient.invalidateQueries({ queryKey: [...] })`

### ✅ Acceptance Criteria (Definition of Done)
- [ ] Criterion 1: Happy path works as expected.
- [ ] Criterion 2: Error handling and validation guards triggered correctly.
- [ ] Criterion 3: Zero TypeScript / build errors (`npx tsc --noEmit`).
- [ ] Criterion 4: Knowledge graph updated (`python -m graphify update .`).
```

---

## 4. Working Agreement
Before executing any complex code edits, generate the optimized prompt structure and align on requirements to ensure 100% adherence to project architecture from the very first line of code.
