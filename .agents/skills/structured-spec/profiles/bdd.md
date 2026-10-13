# Profile: BDD Specification

| | |
|---|---|
| `doc_type` | `bdd` |
| Focus | **BEHAVIOR** — scenarios, acceptance criteria, edge cases |
| Primary annotations | `test`, `requirement` |

Annotation syntax and fields: `specification.md` §3–§4. Type values: `taxonomy.md`. This file adds only what is specific to BDD specs.

## ID prefixes

| Prefix | Applies to |
|---|---|
| `TC-` | Test scenarios — `TC-001`, `TC-CART-001` |
| `REQ-` | Behavioral requirements — `REQ-001`, `REQ-CART-002` |

## Section order

1. Feature Overview — what behavior this covers, link to the parent PRD
2. User Stories — "As a … I want … so that …", each tied to a requirement
3. Acceptance Scenarios — Gherkin, grouped by story or workflow
4. Edge Cases — boundaries, concurrency, empty and missing data
5. Error Scenarios — invalid input, system failure, timeout and retry
6. Data Examples — fixtures, sample payloads, state transitions

## Additional rules

Beyond `specification.md` §6:

1. **Strengthens E5** — every requirement, at any priority, needs ≥1 scenario. A BDD spec exists to provide them, so `should` and `may` are not exempt.
2. Every user story MUST map to ≥1 requirement.
3. Edge cases MUST be covered for: empty input, boundary values, concurrent access, and downstream failure.
4. If this spec verifies a PRD, that `spec_id` MUST appear in `dependencies.specs`.

## Writing guidance

**One `test` annotation per Gherkin block.** The annotation carries the identity and the link; the block carries the behavior.

**Write scenarios in domain language, not UI mechanics.** "When the user adds a widget to the cart" survives a redesign; "When the user clicks `#add-btn`" does not.

**Keep one behavior per scenario.** If a scenario needs two `When` steps to make sense, it is two scenarios.

**Choosing the annotation:**

| Situation | Annotate as |
|---|---|
| A behavior the product owner cares about | `requirement` plus ≥1 `test` |
| A specific case exercising an existing requirement | `test` only, linked to that requirement |
| An edge case of an existing requirement | `test` only, linked to the same requirement |
| A fixture or sample payload | No annotation — plain prose |

**Test type:** `acceptance-test` for user-visible behavior, `integration-test` when the scenario crosses a real service boundary. See `taxonomy.md` §2.

## Boundary

| Dimension | PRD | BDD Spec |
|---|---|---|
| Answers | WHAT and WHY | BEHAVIOR, exhaustively |
| Primary artifact | Requirements and contracts | Scenarios |
| Edge cases | May mention | Must cover |
| Data examples | May mention | Must provide |

A PRD carries the handful of scenarios that define acceptance. When coverage grows past that, move it into a BDD spec and link back via `dependencies.specs`.
