---
name: secret-guard
description: >-
  Use before git commits to scan staged diffs for high-entropy strings and secret token patterns.
---

# Secret Guard Skill

Pre-commit secret scanner.

## Scan Targets
- High entropy alphanumeric strings (>16 characters).
- JWT signatures, AWS keys (`AKIA...`), Private key blocks (`-----BEGIN PRIVATE KEY-----`).
- Abort git commits if an unmasked secret is detected in the diff.

