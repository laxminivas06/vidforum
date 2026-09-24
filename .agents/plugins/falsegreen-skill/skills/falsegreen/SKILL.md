---
name: falsegreen
description: >-
  Use to verify assertions in tests and eliminate tautological or hollow tests.
---

# Falsegreen Skill

Catches hollow tests and ineffective assertions.

## Patterns to Flag
- Tests lacking explicit `assert` statements.
- Mocks that assert only that they were called, without asserting outputs or effects.
- Tests that pass unconditionally even if simulated inputs are altered.

