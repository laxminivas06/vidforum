# VID Platform: Security Vulnerabilities & Code Defect Audit

**Document:** `/docs/DEFECTS.md`  
**Execution Standard:** Section 4 (Known Defects) & Section 12 (Step R1 Audit)  
**Status:** Audited with Line-Level Citations  
**Date:** October 3, 2026  

---

## 1. Executive Summary

A forensic audit of commit `8189935` and repository source files revealed critical authentication vulnerabilities, hardcoded credential bypasses, plaintext credential leakage into user metadata, client-side identity forgery stores, and deleted automated test suites. 

Every item below must be eliminated in **Step R (R2 through R6)** before any feature development (Step 1B onwards) is permitted.

---

## 2. Line-Level Forensic Defect Ledger

### Defect 1: Universal Default Password `admin123` Accepted for Every Account
The system unconditionally validates password `admin123` for **any account**, even if a custom password was set:

| File | Line(s) | Vulnerable Code Snippet | Security Consequence |
|---|---|---|---|
| [`backend/src/modules/auth/auth.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/auth/auth.routes.ts) | 206–207 | `const suppliedPass = (password \|\| '').trim() \|\| 'admin123'; if (suppliedPass !== 'admin123')` | Super Admin bypasses password check |
| [`backend/src/modules/auth/auth.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/auth/auth.routes.ts) | 237–238 | `const isDefaultAdminPass = suppliedPassword === 'admin123'; let isPasswordValid = isDefaultAdminPass;` | **Critical:** Anyone can log into any user account using `admin123` |
| [`backend/src/modules/auth/auth.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/auth/auth.routes.ts) | 249 | `sendError(res, 'Invalid password. Default password is admin123.', 401);` | Error message explicitly broadcasts the universal password |
| [`frontend/contexts/AuthContext.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/contexts/AuthContext.tsx) | 296–298 | `if (cleanPassword !== expectedPass && cleanPassword !== "admin123")` | Frontend client authorizes login if `admin123` is entered |
| [`frontend/contexts/AuthContext.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/contexts/AuthContext.tsx) | 365–366 | `if (known.role === "SUPER_ADMIN" && cleanPassword !== "admin123")` | Hardcoded Super Admin password requirement |
| [`backend/src/modules/institutions/institution.service.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.service.ts) | 173, 184 | `password: data.password \|\| 'admin123'` | Hardcoded fallback in tenant admin provisioning |
| [`backend/src/modules/institutions/institution.repository.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/institutions/institution.repository.ts) | 107 | `const rawPassword = (data.password && data.password.trim()) \|\| 'admin123';` | Hardcoded fallback in repository creation |
| [`backend/src/modules/users/users.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/users/users.routes.ts) | 392, 570 | `const rawPassword = (password && password.trim()) \|\| 'admin123';` `const defaultPassHash = bcrypt.hashSync('admin123', 10);` | Hardcoded password in user creation & purge routes |

---

### Defect 2: Blank Password Accepted and Silently Replaced with `admin123`
Submitting an empty password does not fail validation; it silently authenticates the user:

| File | Line(s) | Vulnerable Code Snippet | Security Consequence |
|---|---|---|---|
| [`backend/src/modules/auth/auth.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/auth/auth.routes.ts) | 235 | `const suppliedPassword = (password \|\| '').trim() \|\| 'admin123';` | Server replaces empty password with `admin123` |
| [`frontend/contexts/AuthContext.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/contexts/AuthContext.tsx) | 231 | `const cleanPassword = (password \|\| "").trim() \|\| "admin123"` | Client replaces empty password with `admin123` |
| [`frontend/app/(auth)/login/page.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/app/(auth)/login/page.tsx) | 27, 44 | `const [password, setPassword] = useState("admin123")` `login(..., password.trim() \|\| "admin123")` | Form pre-populates default password |
| [`frontend/lib/api/hooks.ts`](file:///c:/Antigravityyyyy/VID_School/frontend/lib/api/hooks.ts) | 238 | `password: payload.password \|\| "admin123"` | API mutation hook defaults blank password |

---

### Defect 3: Client-Side Auth Fallbacks & Identity Forgery in Browser
The frontend checks browser `localStorage` and a hardcoded in-memory table to log users in when the backend is unreachable or account is missing:

| File | Line(s) | Vulnerable Code Snippet | Security Consequence |
|---|---|---|---|
| [`frontend/contexts/AuthContext.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/contexts/AuthContext.tsx) | 42–110 | `const KNOWN_ACCOUNTS: Record<string, { role: RoleType; name: string; ... }> = { ... }` | In-memory hardcoded accounts list |
| [`frontend/contexts/AuthContext.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/contexts/AuthContext.tsx) | 284–326 | `const rawAdmins = localStorage.getItem("vid_institute_admins")` | Browser localStorage grants administrator identity |
| [`frontend/contexts/AuthContext.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/contexts/AuthContext.tsx) | 327–360 | `const rawUsers = localStorage.getItem("vid_platform_users")` | Browser localStorage grants arbitrary platform roles |
| [`frontend/contexts/AuthContext.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/contexts/AuthContext.tsx) | 362–380 | `const known = KNOWN_ACCOUNTS[cleanId]; if (known) { ... }` | Authentication without backend verification |

---

### Defect 4: Default Password Material & Plaintext Hints Stored in `raw_user_meta_data`
Cleartext passwords and hint strings are persisted in Supabase `auth.users` JSON metadata and returned via API:

| File | Line(s) | Vulnerable Code Snippet | Security Consequence |
|---|---|---|---|
| [`backend/src/modules/users/users.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/users/users.routes.ts) | 426 | `plain_password_hint: rawPassword` saved to `auth.users.raw_user_meta_data` | Cleartext passwords stored in database metadata |
| [`backend/src/modules/users/users.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/users/users.routes.ts) | 352 | `u.raw_user_meta_data->>'plain_password_hint' as "tempPassword"` | Passwords exposed in `GET /api/v1/users/faculty-accounts` response |
| [`backend/src/modules/faculty/faculty.repository.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/faculty/faculty.repository.ts) | 82 | `userMeta = { ..., plain_password_hint: 'admin123' }` | Plaintext credential hint persisted on faculty creation |
| [`frontend/app/dashboard/page.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/app/dashboard/page.tsx) | 296, 1145 | `Password: ${pwd \|\| "[Default: admin123]"}` | UI renders and logs hardcoded default password |

---

### Defect 5: Login Lookup Sprawl & Unchecked Type Casting
Identifier lookup uses fragile queries, casts UUID to text with `COALESCE`, and handles student lookup through synthesized emails:

| File | Line(s) | Vulnerable Code Snippet | Security Consequence |
|---|---|---|---|
| [`backend/src/modules/auth/auth.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/auth/auth.routes.ts) | 152–179 | `// 3.5 Fallback: Search staff directly by employee_code or email` with `COALESCE(p.id, u.id)::text` | Fragile type casting masking schema discrepancies |
| [`backend/src/modules/auth/auth.routes.ts`](file:///c:/Antigravityyyyy/VID_School/backend/src/modules/auth/auth.routes.ts) | 181–199 | Student login synthesizes fake email `${studentRes.rows[0].admission_number.toLowerCase()}@springfield.edu` | Violates Rule 1 (Student has no separate workspace login in ERP) |
| Multiple files | N/A | Lookup by phone number without unique constraint | Ambiguous phone match can authenticate wrong user |

---

### Defect 6: Workspace Access Trusted from Token / Untracked Changes
- Workspaces granted to a user are read from JWT payload without verifying database state on each request.
- Revocation of a workspace does not immediately block the user until token expiry.
- Must be replaced by database-verified check cached by tenant `perm_version`.

---

### Defect 7: Default Role Assignment to `FACULTY` for All Staff
- `backend/src/modules/users/users.routes.ts` (Lines 37, 382, 414): `role = 'FACULTY'` defaults every staff member to teacher role, even non-teaching staff (HR, accountant, bursar).
- `backend/src/modules/auth/auth.routes.ts` (Lines 161, 177): `'FACULTY' as role_name` hardcoded.
- Must use Section 10 Role Templates (`Teacher`, `HR Officer`, `Admission Officer`, `Finance Officer`, `Exam Officer`, `Academic Coordinator`).

---

### Defect 8: Missing Rate Limiting, Lockout, and Login Security Audit
- `POST /api/v1/auth/login` lacks rate-limiting middleware (vulnerable to brute-force attacks).
- No consecutive failure counter or account lockout mechanism.
- Failed login attempts do not write immutable records to `audit_logs`.

---

### Defect 9: Ad-Hoc Scripts Run Against Working Database & Deleted Test Files
- Commit `8189935` deleted all automated test files in `backend/tests/`:
  - `phase1_step_b.test.ts` (342 lines)
  - `phase1_step_c.test.ts` (518 lines)
  - `phase2_attendance.test.ts` (615 lines)
  - `phase2_documents.test.ts` (596 lines)
  - `phase2_examinations.test.ts` (692 lines)
  - `phase2_finance.test.ts` (574 lines)
  - `phase2_hrms.test.ts` (435 lines)
  - `phase2_timetable.test.ts` (565 lines)
- `backend/package.json` had `"test"` script removed.
- Tests were executed directly against the live Supabase cloud database instead of an isolated test database.

---

### Defect 10: Label Typos and Data Normalization Errors
- [`frontend/app/hrms/staff/page.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/app/hrms/staff/page.tsx): Line 70 (`const [bod, setBod] = useState("")`)
- [`frontend/app/hrms/staff/page.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/app/hrms/staff/page.tsx): Line 227 (`findVal(["experince", "experience"])`)
- [`frontend/app/hrms/staff/page.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/app/hrms/staff/page.tsx): Line 230 (`findVal(["bod", "dob", "dateofbirth"])`)
- [`frontend/app/hrms/staff/page.tsx`](file:///c:/Antigravityyyyy/VID_School/frontend/app/hrms/staff/page.tsx): Line 591 (`<FormField label="Birth of Date (DOB)">`)
- Database column `experience` stored as freeform text instead of numeric years.

---

## 3. Remediation Action Plan (Step R)
1. **R2:** Completely rebuild `auth.routes.ts` with `findLoginSubject(identifier)`, strict bcrypt comparison, rate limiting, lockout, `must_change_password` flag, and session tokens. Strip all frontend auth fallbacks.
2. **R3:** Implement `requireWorkspace(key)` middleware and database-backed `perm_version` grant check.
3. **R4:** Extend Faculty & User Accounts provisioning modal with Role Templates and bulk credentials CSV export.
4. **R5:** Correct all typos, normalize schema names, and purge mock data.
5. **R6:** Recreate test infrastructure pointing to isolated `TEST_DATABASE_URL` with automated test suites and gate verification scripts.
