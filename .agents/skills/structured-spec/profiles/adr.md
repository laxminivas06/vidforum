# Profile: ADR — Architecture Decision Record

| | |
|---|---|
| `doc_type` | `adr` |
| Focus | **DECISION** — one significant choice, its alternatives and consequences |
| Primary annotations | `decision` |

Annotation syntax and fields: `specification.md` §3–§4. Type values: `taxonomy.md`. This file adds only what is specific to ADRs.

## ID prefixes

| Prefix | Applies to |
|---|---|
| `ADR-` | The decision — `ADR-001`, `ADR-AUTH-001` |

## Section order

1. Title — the decision, stated as a sentence
2. Status — `proposed`, `accepted`, `deprecated`, or `superseded`
3. Context — the forces at play and why a choice is required now
4. Decision — what is being done
5. Alternatives Considered — the options, with pros and cons
6. Rationale — why this option won and what was traded away
7. Consequences — what becomes easier, what becomes harder, what risk is accepted

## Additional rules

Beyond `specification.md` §6:

1. A standalone ADR contains **exactly one** `decision` annotation, placed immediately after the frontmatter.
2. `alternatives` MUST list ≥2 options. A decision with one option is not a decision.
3. `consequences` MUST describe both positive and negative impact.
4. If `status` is `superseded`, frontmatter `superseded_by` MUST name the replacement.
5. If `status` is `deprecated` or `superseded`, the document is kept, never deleted — later readers need the reasoning.

E5 does not apply: an ADR holds no requirements.

## Writing guidance

**Context is written in the present tense, before the decision exists.** State the forces, not the answer. A reader should be able to reach a different conclusion from the same context and understand why you did not.

**Record the decision when it is made, not after it succeeds.** An ADR written retrospectively omits the alternatives that felt real at the time, which is the part future readers need.

**Consequences include the costs you accepted.** An ADR listing only benefits is marketing.

```html
<!-- decision
  id: ADR-001
  title: Use event-driven communication between services
  status: accepted
  context: Services are deployed as one unit and cannot scale or release independently
  alternatives: ["Kafka events", "Synchronous REST", "gRPC with a service mesh", "Shared database"]
  rationale: Events give the loosest coupling and let each service scale and fail independently. Kafka adds durable replay, which the reconciliation flow needs.
  consequences: Operational complexity rises — a broker to run and monitor. Eventual consistency forces rework of two user-facing flows. Event schema governance becomes a standing cost.
-->
```

## Standalone versus embedded

The same annotation serves both. A PRD, SDD, or implementation plan embeds `decision` annotations inline for choices scoped to that document.

Promote a decision to a standalone ADR when it outlives its parent document, is cited by other specs, or will plausibly be revisited on its own.

## Boundary

| Dimension | SDD | ADR |
|---|---|---|
| Scope | The whole design | One choice |
| Length | Many sections | One decision |
| Lifecycle | Revised as the design evolves | Immutable; superseded by a new ADR |

An accepted ADR is never edited to reflect a change of mind. Write a new ADR, set the old one to `superseded`, and link them with `supersedes` / `superseded_by`.
