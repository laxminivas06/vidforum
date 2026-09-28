# Express Server Core & Database Pooling

> 27 nodes · cohesion 0.14

## Key Concepts

- **api-response.ts** (25 connections) — `backend/src/utils/api-response.ts`
- **sendError()** (21 connections) — `backend/src/utils/api-response.ts`
- **app.ts** (14 connections) — `backend/src/app.ts`
- **auth.routes.ts** (14 connections) — `backend/src/modules/auth/auth.routes.ts`
- **auth.middleware.ts** (13 connections) — `backend/src/middleware/auth.middleware.ts`
- **src/server.ts** (9 connections) — `backend/src/server.ts`
- **env.ts** (8 connections) — `backend/src/config/env.ts`
- **env** (6 connections) — `backend/src/config/env.ts`
- **error.middleware.ts** (5 connections) — `backend/src/middleware/error.middleware.ts`
- **rbac.middleware.ts** (5 connections) — `backend/src/middleware/rbac.middleware.ts`
- **authMiddleware()** (3 connections) — `backend/src/middleware/auth.middleware.ts`
- **errorMiddleware()** (3 connections) — `backend/src/middleware/error.middleware.ts`
- **jsonwebtoken** (3 connections) — `backend/package.json`
- **app** (2 connections) — `backend/src/app.ts`
- **pool** (2 connections) — `backend/src/config/database.ts`
- **requirePermission()** (2 connections) — `backend/src/middleware/rbac.middleware.ts`
- **requireRole()** (2 connections) — `backend/src/middleware/rbac.middleware.ts`
- **router** (2 connections) — `backend/src/modules/auth/auth.routes.ts`
- **router** (2 connections) — `backend/src/routes/api.v1.ts`
- **backend/server.ts** (1 connections) — `backend/server.ts`
- **AuthenticatedUser** (1 connections) — `backend/src/middleware/auth.middleware.ts`
- **Express** (1 connections) — `backend/src/middleware/auth.middleware.ts`
- **Request** (1 connections) — `backend/src/middleware/auth.middleware.ts`
- **bootstrap()** (1 connections) — `backend/src/server.ts`
- **ApiResponse** (1 connections) — `backend/src/utils/api-response.ts`
- *... and 2 more nodes in this community*

## Relationships

- [Multi-Tenant Middleware & API Routing](Multi-Tenant_Middleware_&_API_Routing.md) (37 shared connections)
- [Backend Node.js Dependencies](Backend_Node.js_Dependencies.md) (6 shared connections)
- [Academic Controllers & Business Logic](Academic_Controllers_&_Business_Logic.md) (4 shared connections)
- [admissionscontrollerts / admissionsrepository](admissionscontrollerts_-_admissionsrepository.md) (2 shared connections)
- [academicscontrollerts / academicsrepositoryts](academicscontrollerts_-_academicsrepositoryts.md) (1 shared connections)
- [facultycontrollerts / facultyController](facultycontrollerts_-_facultyController.md) (1 shared connections)
- [financecontrollerts / financerepositoryts](financecontrollerts_-_financerepositoryts.md) (1 shared connections)
- [studentcontrollerts / studentrepositoryts](studentcontrollerts_-_studentrepositoryts.md) (1 shared connections)

## Source Files

- `backend/package.json`
- `backend/server.ts`
- `backend/src/app.ts`
- `backend/src/config/database.ts`
- `backend/src/config/env.ts`
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/middleware/error.middleware.ts`
- `backend/src/middleware/rbac.middleware.ts`
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/routes/api.v1.ts`
- `backend/src/server.ts`
- `backend/src/utils/api-response.ts`

## Audit Trail

- EXTRACTED: 99 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*