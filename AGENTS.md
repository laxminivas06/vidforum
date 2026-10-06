# VID Platform: Agent Operating Guidelines

**Project:** VID (Virtual Identification) Platform  
**Architecture:** Multi-Tenant Educational Operating Ecosystem  
**Repository Customizations:** `.agents/`  
**Persistent Memory:** `docs/MEMORY.md`  

---

## 1. Operating Mode & Standards
- Act as a senior full-stack engineering team following the SDLC outlined in [antigravity-master-prompt.md](file:///c:/Projects/VID_School/vidforum/Reference_docs/antigravity-master-prompt.md).
- **Ponytail Ultra Mode (Active):** Enforce strict YAGNI minimalism, shortest working diffs, standard-library/native-platform first, and zero unrequested boilerplate or abstractions across all coding tasks.
- Follow all **30 Non-Negotiable Rules** from [docs/PRD.md](file:///c:/Projects/VID_School/vidforum/docs/PRD.md).
- Maintain the single student master record across all operations. Student is **never** a separate workspace.
- Enforce multi-tenant isolation via `institution_id` on all tenant queries, models, and file storage.
- **Team Collaboration & Zero-Isolation Policy:**
  1. *Whole-Team Multi-User Architecture:* Never introduce changes, shortcuts, or conditional checks that only work for a single developer, machine, or user account. Code pushed to git must work out-of-the-box for any team member.
  2. *No Hardcoded Accounts or Bypasses:* Never hardcode user emails (personal accounts), user IDs, tenant overrides, or mock accounts directly into repositories or services. Auth, authorization, and queries must resolve dynamically via standard database records and JWT tokens.
  3. *No Machine-Specific Paths or Configs:* All file paths must be relative or derived via standard runtime environment variables (`__dirname`, `process.cwd()`, `import.meta.env`). Do not hardcode local Windows paths (`C:\Users\...`, `C:\Antigravityyyyy\...`) in source code or scripts.
  4. *Environment & Fail-Open Reliability:* Optional local dependencies (e.g., Redis) must fail open or run in degraded mode gracefully without blocking teammates.
- **Zero Duplicate Data & Dates Policy:** Strictly prohibit duplicate data, duplicate dates, duplicate record IDs, duplicate tenant codes, or duplicate student records across all pages, views, tables, and seed/mock datasets. Every entity must have strictly unique identifiers and distinct, realistic dates and values.
- **Zero LocalStorage for Working/Domain Data Policy:** Strictly prohibit storing, caching, or retrieving any working, domain, or operational application data (e.g., institutions, admins, workspaces, users, students, grades, subjects, textbooks, admissions, fees) in browser `localStorage` or `sessionStorage`. All application state must be stored in and fetched strictly from the centralized cloud database (Supabase PostgreSQL via backend API). Local storage is exclusively restricted to ephemeral auth session tokens (`vid_auth_token`).
- **Database Operations & Supabase MCP Protocol:** Whenever interacting with, modifying, or altering database schemas, tables, views, stored procedures, triggers, or SQL functions, prioritize and use the **Supabase MCP Server** (`supabase-mcp-server`, project `cyvckmjocomqzipbvbpv`). All function modifications, DDL schema evolutions, and migrations must be executed through Supabase MCP tools (`apply_migration`, `execute_sql`, `list_tables`) with strict backward compatibility verification.
- Respect human approval gates between major phases.

---

## 2. Active Plugin Ecosystem & Memory
Specialized plugins installed in `.agents/plugins/` and global customizations:

Refer to [docs/MEMORY.md](file:///c:/Projects/VID_School/vidforum/docs/MEMORY.md) for the complete plugin matrix and persistent context:
- **Intake & Prompt Mastery (Phase 0):** `prompt-architect` (Transforms plain-language prompts into engineered, rule-enforced architectural blueprints before code execution).
- **Minimalism & Speed:** `ponytail` (Intensity: **Ultra** — YAGNI, native platform first, shortest diff).
- **Memory:** `honcho-memory`, `wingman`, `unforgit`, `local-memory`, `knowl`, `metabrain`, `memesh`.
- **Quality & Review:** `brooks-lint`, `river-review`, `codex-reviewer`, `debt-ops`, `megalinter`, `a11y-audit`.
- **Testing:** `tailtest`, `falsegreen`, `flaky-detector`, `test-gap`.
- **Security:** `secret-guard`, `agent-guard`, `axonflow`, `hol-guard`.
- **SDLC Discipline:** `spec-driven`, `dev-skills`, `ai-native-sdlc`, `openapi-gen`.
- **Git & Docs:** `commit-narrator`, `pr-storyteller`, `docflow`.
- **Token Economy:** `token-optimizer`, `espresso`.

---

## 3. Working Agreement Checklist
- **Phase 0 (Intake & Prompt Mastery):** Apply Prompt Architect on plain or informal user requests to clarify scope, inject PRD invariants (Rule 1 student master, Rule 2 tenant isolation, zero duplicate data), specify `@/components/ui/` primitives, and formulate measurable acceptance criteria.
- **Pre-Edit:** Run Wingman data contract verification + check existing codebase components to avoid re-implementing existing code.
- **Database Changes:** Route all schema modifications, table alterations, and function creations/edits through the **Supabase MCP Server** (`supabase-mcp-server`), ensuring all SQL functions and procedures are accurately tested and synchronized with `backend/db/migrations/`.
- **During Code:** Apply **Ponytail Ultra** (reuse `@/components/ui/`, native features over libs, single root-cause fixes, shortest diffs, no speculative boilerplate).
- **Post-Code:** Apply River Review (4 lenses) and Brooks Lint.
- **Pre-Commit:** Run Secret Guard, Falsegreen test verification, and Team Collaboration Audit (confirming zero hardcoded accounts, zero machine-specific paths, and fail-open fallbacks).
- **Commit & Git Governance:** Use Commit Narrator for semantic commit messages with architectural context. Strictly DO NOT push to Git / GitHub unless the user explicitly requests a git push in the prompt.
- **Workspace Navigation Isolation Policy:** Strictly enforce isolated workspace navigation across all workspaces (Academics, Staff/HRMS, Admissions, etc.): when inside a workspace, display ONLY that workspace's dedicated tools in the sidebar. Never leak other workspace navigation items into an isolated workspace.
- **Centralized Cloud State Enforcement:** Prohibit adding `localStorage.setItem` or `localStorage.getItem` for domain entities in frontend components or hooks. Mutate cloud database via backend API and use TanStack Query invalidation (`queryClient.invalidateQueries`) to refresh state across clients.
- **Post-Commit:** Update docs with Docflow and persist durable conclusions to Honcho & Unforgit.
