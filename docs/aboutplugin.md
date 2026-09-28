# VID Platform: Agent Plugin & Skill Directory

Please see the canonical documentation at [docs/about_plugins.md](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/about_plugins.md).

---

## Quick Reference Summary

The repository includes **28 custom agent plugins and skills** under [`.agents/plugins/`](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/.agents/plugins), orchestrated by [`.agents/rules/plugin-orchestrator.md`](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/.agents/rules/plugin-orchestrator.md):

1. **Memory & Architecture**: `wingman` (schema & student master check), `codex-honcho` (preference recall), `unforgit` (lessons & gotchas), `mcp-local-memory`, `metabrain`, `knowl`, `memesh`.
2. **Code Quality & Review**: `river-review` (Security, Perf, Arch, Testing lenses), `brooks-lint` (anti-overengineering), `codex-reviewer` (adversarial audit), `debt-ops`, `megalinter`.
3. **Testing & QA**: `tailtest` (targeted test runner), `falsegreen-skill` (meaningful assertions), `flaky-detector` (race conditions), `test-gap` (coverage analyzer).
4. **Security & Guardrails**: `secret-guard` (entropy/credential scanner), `agent-guard` (command safety), `axonflow` (PII masking), `hol-guard` (dependency audit).
5. **SDLC Discipline**: `spec-driven` (PRD -> Spec -> Tasks), `dev-skills` (TDD loop), `ai-native-sdlc` (human approval gates).
6. **Git & Docs Automation**: `commit-narrator` (semantic commit messages with *why*), `pr-storyteller` (PR releases), `docflow` (documentation freshness).
7. **Optimization**: `token-optimizer` (surgical file viewing), `espresso` (high-density concise answers).

For complete descriptions, rule checklists, and invocation examples, refer to **[`docs/about_plugins.md`](file:///c:/Users/Jagan%20Mohan%20Reddy/OneDrive/Desktop/VID_School/vidforum/docs/about_plugins.md)**.
