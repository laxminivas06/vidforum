# Security Audit Report Template

Use this template when writing the Phase 4 security audit report.
Fill all `{placeholders}` with actual data from the audit findings.

**Output location:** `docs/audits/security-audit-{scope}-{YYYY-MM-DD}-{HHmm}.md`

---

```markdown
# Security Audit: {Scope/Module Name}
Date: {date}
Auditor: AI Security Audit (multi-dimensional, {N} parallel subagents)

## Executive Summary
- **Dimensions activated:** {list, e.g., A, B, C, D, E, F}
- **Dimensions skipped:** {list with reasons, e.g., "B (no auth)"}
- **Files scanned:** {N}
- **Findings:** {N total} ({X} critical, {Y} high, {Z} medium, {W} enhancement)
- **Automated tools run:** {list tools and versions}
- **Overall risk assessment:** CRITICAL / HIGH / MODERATE / LOW (project-level risk, not individual finding)

## Critical Findings
Issues that are actively exploitable. Must be fixed immediately.
- [ ] **[CRIT-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Vulnerability:** {what the issue is}
  - **Impact:** {what an attacker could do}
  - **Evidence:** {code snippet, grep output, or tool result}
  - **Remediation:** {specific fix guidance}
  - **Fix workflow:** `/bugfix` — critical priority

## High Findings
Exploitable with effort. Must be fixed before release.
- [ ] **[HIGH-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Vulnerability:** {description}
  - **Impact:** {description}
  - **Evidence:** {evidence}
  - **Remediation:** {guidance}
  - **Fix workflow:** `/bugfix` or `/workflow-solo`

## Medium Findings
Weaknesses that increase attack surface. Fix in near term.
- [ ] **[MED-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Vulnerability:** {description}
  - **Remediation:** {guidance}
  - **Fix workflow:** `/bugfix`

## Enhancement Findings
Defense-in-depth improvements. No active vulnerability.
- [ ] **[ENH-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Suggestion:** {description}
  - **Fix workflow:** `/workflow-solo` or backlog

## Automated Tooling Results
| Tool | Version | Result | Findings |
|---|---|---|---|
| {tool name} | {version} | PASS/FAIL | {N} issues ({breakdown}) |

## Cross-Dimension Correlations
Findings that span multiple dimensions, with escalated severity.
- {description of correlated findings and why severity was escalated}

## Dimensions Covered
<!-- Required when total findings < 3 -->
| Dimension | Status | Files / Queries Examined |
|---|---|---|
| A. OWASP Code Patterns | ✅ Checked / ⏭ Skipped (reason) | e.g., scanned all 42 handler files for injection patterns |
| B. Authentication & Authorization | ✅ Checked / ⏭ Skipped (reason) | e.g., reviewed auth middleware, 12 protected endpoints |
| C. Secrets & Configuration | ✅ Checked | e.g., grep for key patterns, reviewed .env.template |
| D. Supply Chain & Dependencies | ✅ Checked | e.g., ran npm audit, reviewed 87 dependencies |
| E. Data Protection & Privacy | ✅ Checked / ⏭ Skipped (reason) | e.g., reviewed logging middleware, error handlers |
| F. Infrastructure Hardening | ✅ Checked / ⏭ Skipped (reason) | e.g., reviewed CORS config, security headers middleware |

## Remediation Priority Order
Findings ranked by fix priority. Fix in this order.
1. **[CRIT-001]** — {one-line summary} → `/bugfix`
2. **[CRIT-002]** — {one-line summary} → `/bugfix`
3. **[HIGH-001]** — {one-line summary} → `/bugfix`
4. ...
```
