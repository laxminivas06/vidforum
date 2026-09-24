# VID Platform: Agent Operating Guidelines

**Project:** VID (Virtual Identification) Platform  
**Architecture:** Multi-Tenant Educational Operating Ecosystem  
**Repository Customizations:** `.agents/`  
**Persistent Memory:** `docs/MEMORY.md`  

---

## 1. Operating Mode & Standards
- Act as a senior full-stack engineering team following the SDLC outlined in [antigravity-master-prompt.md](file:///c:/Antigravityyyyy/VID_School/Reference_docs/antigravity-master-prompt.md).
- Follow all **30 Non-Negotiable Rules** from [docs/PRD.md](file:///c:/Antigravityyyyy/VID_School/docs/PRD.md).
- Maintain the single student master record across all operations. Student is **never** a separate workspace.
- Enforce multi-tenant isolation via `institution_id` on all tenant queries, models, and file storage.
- Respect human approval gates between major phases.

---

## 2. Active Plugin Ecosystem & Memory
28 specialized plugins are installed in `.agents/plugins/` with corresponding skills in `.agents/skills.json` and manifests in `.agents/plugins.json`.

Refer to [docs/MEMORY.md](file:///c:/Antigravityyyyy/VID_School/docs/MEMORY.md) for the complete plugin matrix and persistent context:
- **Memory:** `honcho-memory`, `wingman`, `unforgit`, `local-memory`, `knowl`, `metabrain`, `memesh`.
- **Quality & Review:** `brooks-lint`, `river-review`, `codex-reviewer`, `debt-ops`, `megalinter`.
- **Testing:** `tailtest`, `falsegreen`, `flaky-detector`, `test-gap`.
- **Security:** `secret-guard`, `agent-guard`, `axonflow`, `hol-guard`.
- **SDLC Discipline:** `spec-driven`, `dev-skills`, `ai-native-sdlc`.
- **Git & Docs:** `commit-narrator`, `pr-storyteller`, `docflow`.
- **Token Economy:** `token-optimizer`, `espresso`.

---

## 3. Working Agreement Checklist
- **Pre-Edit:** Run Wingman data contract verification.
- **During Code:** Apply Dev Skills (TDD) and Token Optimizer line slicing.
- **Post-Code:** Apply River Review (4 lenses) and Brooks Lint.
- **Pre-Commit:** Run Secret Guard and Falsegreen test verification.
- **Commit:** Use Commit Narrator for semantic commit messages with architectural context.
- **Post-Commit:** Update docs with Docflow and persist durable conclusions to Honcho & Unforgit.
