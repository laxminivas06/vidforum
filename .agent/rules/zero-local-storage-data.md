---
name: zero-local-storage-data
description: >-
  Strictly prohibits storing, caching, or retrieving any working, domain, or operational application data in browser localStorage or sessionStorage. All data must be centralized in the cloud database.
always_on: true
---

# Zero LocalStorage for Working & Application Data Policy

## 1. Core Rule & Absolute Prohibition
Under no circumstances should application, domain, or operational data be saved to, cached in, or retrieved from browser `localStorage` or `sessionStorage`. 

All application state, records, mutations, and tenant configurations must be stored in and fetched exclusively from the **centralized cloud database (Supabase PostgreSQL via backend API)**.

### Prohibited Data in LocalStorage:
- Institutions and tenant definitions (`vid_custom_institutions`, etc.)
- Institution administrators and assigned workspace access (`vid_institute_admins`, etc.)
- User records, roles, profiles, and permissions (`vid_platform_users`, etc.)
- Admissions, inquiries, applicants, enrollments, and fees
- Academics data: grades, sections, subjects, syllabi, textbooks, exams, calendar schedules
- Student master records, marks, and attendance
- Faculty, HRMS, finance, and fee ledger items

### Permitted Exception (Authentication Session Only):
- Only the ephemeral JWT bearer token (`vid_auth_token` and `vid_refresh_token`) and basic active login session metadata (`vid_session_user`, `vid_session_role`) required to authenticate HTTP requests may be stored in browser storage.
- Never use local storage as a state store, cache layer, or offline surrogate for domain entities.

---

## 2. Rationale & Architecture Justification
1. **Multi-User Collaboration & Synchronization:**
   - When data is stored in `localStorage`, changes made by one user/browser are invisible to other team members, administrators, or users accessing from different machines.
   - This creates phantom states where a developer sees their changes locally, but teammates see empty or stale data.
2. **Single Centralized Source of Truth:**
   - The Supabase Cloud PostgreSQL database (`aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`) is the single authoritative source of truth.
   - TanStack Query (`queryClient.invalidateQueries`) is the only client-side caching mechanism allowed; it automatically synchronizes with backend API endpoints over the network.
3. **Data Integrity & Tenant Isolation:**
   - Bypassing the backend API circumvents database schema constraints, foreign key checks, row-level security (RLS), and audit log triggers.

---

## 3. Enforcement & Verification Checklist
1. **Never write `localStorage.setItem()`** for domain entities, lists, or working data.
2. **Never read `localStorage.getItem()`** to populate or fallback domain tables or forms.
3. **Always use TanStack Query mutations and invalidations** (`queryClient.invalidateQueries`) to refetch authoritative data directly from the backend API upon any mutation.
4. If a backend request fails, surface the error to the user via toast/dialog; never silently write to `localStorage`.
