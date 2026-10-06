# Audit Repository Auditrepository

> 12 nodes

## Key Concepts

- **auditRepository** (8 connections) — `backend/src/modules/audit/audit.repository.ts`
- **audit.controller.ts** (8 connections) — `backend/src/modules/audit/audit.controller.ts`
- **audit.repository.ts** (8 connections) — `backend/src/modules/audit/audit.repository.ts`
- **auditService** (4 connections) — `backend/src/modules/audit/audit.service.ts`
- **audit.service.ts** (4 connections) — `backend/src/modules/audit/audit.service.ts`
- **AuditRecord** (1 connections) — `backend/src/modules/audit/audit.repository.ts`
- **.constructor()** (1 connections) — `backend/src/modules/audit/audit.repository.ts`
- **.createLog()** (1 connections) — `backend/src/modules/audit/audit.repository.ts`
- **.findLogById()** (1 connections) — `backend/src/modules/audit/audit.repository.ts`
- **.findLogs()** (1 connections) — `backend/src/modules/audit/audit.repository.ts`
- **.getAuditLogById()** (1 connections) — `backend/src/modules/audit/audit.service.ts`
- **.getAuditLogs()** (1 connections) — `backend/src/modules/audit/audit.service.ts`

## Relationships

- [Routes Middleware Router](Routes_Middleware_Router.md) (3 shared connections)
- [Users Provisioning Service](Users_Provisioning_Service.md) (2 shared connections)
- [Tenant Repository Base](Tenant_Repository_Base.md) (2 shared connections)
- [Examinations Controller Examinationscontroller](Examinations_Controller_Examinationscontroller.md) (2 shared connections)
- [Repository Service Timetable](Repository_Service_Timetable.md) (2 shared connections)
- [Academics Controller Academicscontroller](Academics_Controller_Academicscontroller.md) (1 shared connections)
- [Error Format Tenant](Error_Format_Tenant.md) (1 shared connections)

## Source Files

- `backend/src/modules/audit/audit.controller.ts`
- `backend/src/modules/audit/audit.repository.ts`
- `backend/src/modules/audit/audit.service.ts`

## Audit Trail

- EXTRACTED: 26 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*