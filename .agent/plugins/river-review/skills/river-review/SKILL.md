---
name: river-review
description: >-
  Use to perform multi-perspective reviews (Security, Performance, Architecture, Testing) on staged diffs.
---

# River Review Skill

Inspects code diffs through 4 distinct critical perspectives.

## Review Lenses
1. **Security Lens:** Input validation, tenant isolation, RBAC enforcement, SQL injection avoidance.
2. **Performance Lens:** No unbounded database queries, pagination on collections, proper caching.
3. **Architecture Lens:** Adherence to defined domain boundaries in `backend/` and `frontend/`.
4. **Testing Lens:** Test coverage for happy paths, edge cases, and failure modes.

