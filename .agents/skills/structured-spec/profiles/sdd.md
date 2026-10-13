# Profile: SDD — Software/Solution Design Document

| | |
|---|---|
| `doc_type` | `sdd` |
| Focus | **HOW** — architecture, patterns, component design, trade-offs |
| Primary annotations | `requirement`, `contract`, `architecture`, `decision` |

Annotation syntax and fields: `specification.md` §3–§4. Type values: `taxonomy.md`. This file adds only what is specific to SDDs.

## ID prefixes

| Prefix | Applies to |
|---|---|
| `DES-` | Design requirements and constraints — `DES-001`, `DES-SEC-001` |
| `CT-` | Contracts |
| `ARCH-` | Architecture diagrams |
| `ADR-` | Decisions |

`DES-` rather than `REQ-` keeps design constraints visually distinct from the product requirements they serve, which usually live in a separate PRD.

## Section order

1. Context and Objectives — problem, design goals, link to the PRD
2. Architecture Overview — high-level structure, patterns, component inventory
3. Component Design — per-component internals, key algorithms
4. Data Architecture — data model, storage, caching, migration
5. API Design — internal and external contracts, event contracts
6. Security Architecture — authn flow, authz model, threat model
7. Deployment Architecture — topology, scaling, failure modes
8. Performance and Scalability — capacity, bottlenecks, optimization
9. Technology Decisions — the ADRs
10. Migration Strategy — path from current state, rollback

## Additional rules

Beyond `specification.md` §6:

1. Every component named in Architecture Overview MUST have a corresponding `architecture` annotation or `contract`.
2. Every significant technology choice MUST be captured as a `decision`, not buried in prose.
3. If this design implements a PRD, that PRD's `spec_id` MUST appear in `dependencies.specs`.
4. Every `must` design requirement SHOULD be supported by ≥1 `architecture` annotation.

E5 is not strengthened here: an SDD may state a design constraint with an inline `acceptance` block and leave verification to the PRD or BDD spec that owns it.

## Writing guidance

**SDD requirements are design constraints, not product needs.** They describe how the system must be built:

- "All inter-service communication uses gRPC with mutual TLS" — `security`
- "The connection pool caps at 20 connections" — `performance`
- "Analytics queries run against read replicas" — `reliability`
- "Deployments are zero-downtime" — `operational`

If a statement would still be true with a completely different implementation, it is a PRD requirement, not an SDD one.

**SDDs are architecture-heavy.** Expect several diagrams: `c4-context` for the boundary, `c4-container` for deployables, `c4-component` for internals, `sequence` for interaction flows, `er` for data relationships, `deployment` for topology.

**Contracts here lean internal** — `domain-model` for types crossing component boundaries, `data-schema` for storage, `api-contract` for service-to-service calls, `messaging` for events, `infrastructure` for topology.

## Boundary

| Dimension | PRD | SDD |
|---|---|---|
| Answers | WHAT and WHY | HOW |
| Requirements describe | Business need | Design constraint |
| Contracts describe | External interfaces | Internal and external |
| Decisions | High-level only | Detailed, with trade-offs |
| Tests | Defines them | References them; does not define |

An SDD is where most ADRs live. A decision significant enough to be revisited independently should instead be a standalone ADR, referenced from here.
