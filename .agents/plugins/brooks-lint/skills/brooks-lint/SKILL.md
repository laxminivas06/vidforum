---
name: brooks-lint
description: >-
  Use to review code against foundational engineering principles (Brooks, Martin, Fowler) with severity levels.
---

# Brooks Lint Skill

Reviews architecture and code through classic software engineering wisdom.

## Severity Classifications
- `[CRITICAL]`: Violations causing systemic instability, tenant leaks, or data loss.
- `[ARCHITECTURAL]`: Breaches of conceptual integrity, leaky abstractions, or premature complexity.
- `[MAINTAINABILITY]`: Missing tests, tight coupling, code duplication, or unclear boundaries.
- `[NIT]`: Minor style or naming inconsistencies.

## Guiding Principles
- Conceptual Integrity: VID is one cohesive ecosystem, not disjointed CRUD modules.
- YAGNI: Do not build speculative abstractions beyond the current task.

