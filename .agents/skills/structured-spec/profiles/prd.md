# Profile: PRD — Product Requirement Document

| | |
|---|---|
| `doc_type` | `prd` |
| Focus | **WHY** — business context, user needs, success criteria |
| Primary annotations | `requirement`, `contract`, `test`, `architecture`, `decision`, `slo` |

Annotation syntax and fields: `specification.md` §3–§4. Type values: `taxonomy.md`. This file adds only what is specific to PRDs.

## ID prefixes

| Prefix | Applies to |
|---|---|
| `REQ-` | Requirements — `REQ-001`, `REQ-AUTH-002` |
| `CT-` | Contracts — `CT-DATA-001`, `CT-API-001` |
| `TC-` | Tests — `TC-001`, `TC-ATTRIB-001` |
| `ARCH-` | Architecture diagrams |
| `ADR-` | Decisions |
| `SLO-` | Service level objectives |

## Section order

1. Problem Context — background, target users, goals, non-goals
2. System Architecture — C4 context/container diagrams, data flow
3. Requirements — functional, then non-functional
4. Data Contracts — schemas, DDL, domain models
5. API Contracts — service boundaries and interfaces
6. Infrastructure — deployment and provisioning
7. Acceptance Tests — BDD scenarios
8. Security and Compliance — auth, access control, data protection
9. Operational Concerns — SLOs, monitoring, alerting
10. Out of Scope
11. Open Questions
12. Architecture Decisions

## Additional rules

Beyond `specification.md` §6:

1. **Strengthens E5** — a `must`/`must-not` requirement needs a real `test` annotation. An inline `acceptance` block alone is not sufficient in a PRD.
2. Problem Context MUST state both Goals and Non-Goals.
3. Out of Scope MUST explicitly list what is excluded.
4. Every user-facing capability described in prose SHOULD carry a requirement annotation.

## Writing guidance

**Requirements state business need, never implementation.** "Attribute every API call to a user" is a PRD requirement; "use a hash join on trajectory_id" is not — that belongs in an SDD.

Pick `category` by what would make the requirement fail:

| Failure mode | `category` |
|---|---|
| Feature is absent or wrong | `functional` |
| Too slow | `performance` |
| Data leaks or access is unauthorized | `security` |
| Breaks a regulation | `compliance` |
| Users cannot figure it out | `ux` |
| Falls over under load or fault | `reliability` |
| Cannot be deployed, monitored, or operated | `operational` |
| Anything else quality-related | `nonfunctional` |

**Priority is a commitment, not a preference.** `must` means the release is blocked without it. If everything is `must`, nothing is.

## Boundary

| Content | Belongs in |
|---|---|
| Why we are building this, for whom | PRD |
| How the system is structured internally | SDD |
| The order in which we build it | Implementation Plan |
| Exact payload shapes and error codes | TSD |
| Exhaustive scenario coverage and edge cases | BDD spec |

A PRD may embed `decision` annotations for high-level choices. Detailed trade-off analysis belongs in an SDD or a standalone ADR.
