---
name: code-audit
description: >-
  Orchestration reference for the /audit workflow. Contains dimension scope
  cards for parallel subagent dispatch, subagent prompt template, and code audit
  report template.
---

# Code Audit Skill

Reference material for the `/audit` workflow. Not a standalone skill — always loaded via the workflow.

## Contents

| Reference | Purpose | Used By |
|---|---|---|
| `references/audit-dimensions.md` | 7 MECE dimension scope cards + subagent prompt template | Coordinator dispatching parallel subagents |
| `references/audit-report-template.md` | Structured report template for the final audit output | Coordinator writing Phase 4 report |

## Usage

The `/audit` workflow loads this skill automatically.

- **Dimension scope cards:** Read `references/audit-dimensions.md` to get the scope definition for each dimension (A–G) and the system prompt template for subagent dispatch.
- **Report template:** Read `references/audit-report-template.md` when writing the Phase 4 code audit report.
