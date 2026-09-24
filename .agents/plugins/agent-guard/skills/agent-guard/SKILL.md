---
name: agent-guard
description: >-
  Use to guard against accidental leakage of secrets, keys, or credentials in files, logs, or commits.
---

# Agent Guard Skill

Real-time protection against secret leakage.

## Enforcement
- Ensure all passwords, tokens, API keys, and sensitive URLs are read exclusively from environment variables.
- Ensure `.env` is listed in `.gitignore` and only `.env.example` is committed.

