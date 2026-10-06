# Tenant Repository Base

> 7 nodes

## Key Concepts

- **TenantScopedRepository** (11 connections) — `backend/src/common/tenant-repository.base.ts`
- **.validateTenant()** (5 connections) — `backend/src/common/tenant-repository.base.ts`
- **.findById()** (3 connections) — `backend/src/common/tenant-repository.base.ts`
- **.findByIdOrFail()** (3 connections) — `backend/src/common/tenant-repository.base.ts`
- **.findMany()** (2 connections) — `backend/src/common/tenant-repository.base.ts`
- **.softDelete()** (2 connections) — `backend/src/common/tenant-repository.base.ts`
- **.constructor()** (1 connections) — `backend/src/common/tenant-repository.base.ts`

## Relationships

- [Error Format Tenant](Error_Format_Tenant.md) (3 shared connections)
- [Audit Repository Auditrepository](Audit_Repository_Auditrepository.md) (2 shared connections)
- [Repository Service Timetable](Repository_Service_Timetable.md) (1 shared connections)
- [Notifications Notification Repository](Notifications_Notification_Repository.md) (1 shared connections)

## Source Files

- `backend/src/common/tenant-repository.base.ts`

## Audit Trail

- EXTRACTED: 17 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*