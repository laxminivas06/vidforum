---
name: token-optimizer
description: >-
  Use to minimize token consumption via line-range views, focused ripgrep searches, and compact diffs.
---

# Token Optimizer Skill

Conserves context window and optimizes token efficiency.

## Best Practices
- Always use `StartLine` and `EndLine` with `view_file` on large files.
- Prefer targeted `grep_search` with glob includes over broad file views.
- Edit files with precise chunks rather than rewriting entire files.

