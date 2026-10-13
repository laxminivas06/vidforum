---
name: security-audit
description: >-
  Orchestration reference for the /security-audit workflow. Contains dimension
  scope cards for parallel subagent dispatch, subagent prompt template, and
  security audit report template.
---

# Security Audit Skill

Reference material for the `/security-audit` workflow. Not a standalone skill — always loaded via the workflow.

## Contents

| Reference | Purpose | Used By |
|---|---|---|
| `references/security-dimensions.md` | 6 MECE dimension scope cards + subagent prompt template | Coordinator dispatching parallel subagents |
| `references/security-audit-report-template.md` | Structured report template for the final audit output | Coordinator writing Phase 4 report |

## Usage

The `/security-audit` workflow loads this skill automatically.

- **Dimension scope cards:** Read `references/security-dimensions.md` to get the scope definition for each dimension (A–F) and the system prompt template for subagent dispatch.
- **Report template:** Read `references/security-audit-report-template.md` when writing the Phase 4 security audit report.
