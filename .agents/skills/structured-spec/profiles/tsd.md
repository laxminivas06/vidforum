# Profile: TSD — Technical Specification

| | |
|---|---|
| `doc_type` | `tsd` |
| Focus | **INTERFACE** — APIs, protocols, payloads, errors, versioning |
| Primary annotations | `contract`, `requirement`, `test` |

Annotation syntax and fields: `specification.md` §3–§4. Type values: `taxonomy.md`. This file adds only what is specific to TSDs.

## ID prefixes

| Prefix | Applies to |
|---|---|
| `CT-` | Contracts — the primary artifact here — `CT-API-001`, `CT-EVT-001` |
| `REQ-` | Interface requirements and constraints |
| `TC-` | Tests |
| `ARCH-` | Protocol and flow diagrams |

## Section order

1. Overview — what this defines, scope, versioning strategy
2. Data Models — shared types, enumerations, the error model
3. API Specification — endpoints, request/response schemas, authn, rate limits
4. Event/Message Specification — schemas, ordering, retries, dead letters
5. Error Handling — envelope, code taxonomy, client retry guidance
6. Backward Compatibility — versioning rules, deprecation policy
7. Performance Constraints — limits, timeouts, pagination

## Additional rules

Beyond `specification.md` §6:

1. **Strengthens E5** — a `must`/`must-not` requirement needs a real `test` annotation.
2. Every endpoint or message in the spec MUST have a `contract` annotation.
3. Every `api-contract` MUST be verified by ≥1 test.
4. Every error code MUST appear in the Error Handling section.
5. Data Models MUST define a standard error envelope.
6. Every request and response type MUST be a `contract` of type `api-contract` or `domain-model`.
7. If this TSD realizes a PRD's API requirements, that `spec_id` MUST appear in `dependencies.specs`.

## Writing guidance

**A TSD is read by people writing clients.** Ambiguity here becomes a production incident somewhere else. Specify exact field names, types, nullability, units, and timezone conventions.

**TSD requirements are interface constraints:**

- "All responses use the standard error envelope"
- "`/users` supports cursor-based pagination"
- "Event payloads do not exceed 1 MB"
- "All timestamps are ISO 8601 in UTC"

**Contract types you will actually use here:** `api-contract` for endpoints and their payloads, `domain-model` for shared types and enums, `messaging` for event schemas, `data-schema` only if the interface exposes storage directly.

Contract tests and schema-conformance tests are `test` annotations of type `integration-test`. They are never `contract` annotations — see `taxonomy.md` §2.

## Boundary

| Dimension | PRD | SDD | TSD |
|---|---|---|---|
| Answers | WHAT and WHY | HOW | INTERFACE |
| Primary artifact | Requirements | Architecture | Contracts |
| Audience | PM, engineers | Architects | Callers of the interface |
| Contracts describe | External surface | Internal design | The public contract in full |
| Versioning | Document version | Document version | Document **and** API version |

If the content would change when the implementation changes but the wire format does not, it belongs in the SDD.
