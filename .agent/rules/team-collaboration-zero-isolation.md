---
name: team-collaboration-zero-isolation
description: >-
  Enforces whole-team multi-user architecture, zero hardcoded accounts/bypasses, zero machine-specific paths, and fail-open local development reliability across all workspaces.
always_on: true
---

# Team Collaboration & Zero-Isolation Rule

## Core Directives

### 1. Whole-Team Multi-User Architecture
- **Shared Team Project:** This project is shared by the entire development team. Never introduce changes, shortcuts, or conditional checks that only work for a single developer, machine, or user account.
- **Out-of-the-Box Functionality:** Code committed and pushed to git MUST work cleanly out-of-the-box for any team member pulling the latest commits.
- **Centralized Data Priority:** All data must be read from and written to the centralized cloud database (Supabase PostgreSQL via backend API). Never rely on machine-specific or browser-local storage (e.g., `localStorage`) to make a feature appear to work for one developer while failing for teammates.

### 2. No Hardcoded Accounts or Bypasses
- **Zero Personal or Mock Overrides:** Never hardcode user emails (e.g. personal developer accounts), specific user IDs, tenant overrides, or mock accounts directly into repositories, services, controllers, or frontend components.
- **Dynamic Authorization & Resolution:** Authentication, authorization, and data querying must always resolve dynamically through standard database records and validated JWT/session tokens.
- **Multi-Tenant Consistency:** All users and roles (Super Admin, Institution Admin, Faculty, Student, Parent) must be provisioned and resolved via standard database queries.

### 3. No Machine-Specific Paths or Configs
- **Relative & Environment Paths:** All file paths must be relative or derived via standard Node.js / Vite / Next.js environment variables and runtime helpers (`__dirname`, `process.cwd()`, `import.meta.env`, `process.env`).
- **No Hardcoded Machine Paths:** Do not hardcode local Windows paths (e.g. `C:\Users\...` or `C:\Antigravityyyyy\...`) anywhere in source code, scripts, configuration, or documentation links.
- **Cross-Platform Compatibility:** Ensure path separators and shell scripts work across developer environments (Windows, macOS, Linux).

### 4. Environment & Fail-Open Reliability
- **Graceful Degradation:** Optional local development dependencies (such as Redis or local caching daemons) must fail open or run in degraded mode gracefully.
- **Zero Blocker Policy:** Team members without optional dependencies installed or running must never be blocked from running, developing, or testing the application locally.

---

## Pre-Commit Audit Checklist
- [ ] Are all new endpoints and features tested using standard dynamic database queries rather than hardcoded credentials?
- [ ] Does the change work for any newly cloned repository without requiring developer-specific environment tweaks?
- [ ] Are there zero hardcoded local filesystem paths (`C:\Users\...`, `C:\...`)?
- [ ] Do optional external services (Redis, etc.) fail open with fallback behavior?
