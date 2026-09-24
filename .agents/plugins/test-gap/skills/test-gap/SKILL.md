---
name: test-gap
description: >-
  Use to analyze code diffs against test suites and identify newly added lines lacking test coverage.
---

# Test Gap Skill

Ensures no modified or newly authored code is merged without test verification.

## Checks
- Compare `git diff` with test suites.
- Require at least one unit or integration test per critical operational flow.

