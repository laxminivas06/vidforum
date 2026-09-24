---
name: tailtest
description: >-
  Use to automatically detect git-changed files, identify test gaps, and run targeted test suites.
---

# Tailtest Skill

Change-driven testing utility.

## Procedure
1. Inspect `git status` for modified files.
2. Locate or create corresponding unit tests in `backend/tests/` or `frontend/src/tests/`.
3. Execute the specific test suite and ensure all assertions pass.

