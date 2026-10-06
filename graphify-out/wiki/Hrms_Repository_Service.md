# Hrms Repository Service

> 16 nodes

## Key Concepts

- **hrms.service.ts** (20 connections) — `backend/src/modules/hrms/hrms.service.ts`
- **notificationService** (11 connections) — `backend/src/modules/notifications/notification.service.ts`
- **hrms.repository.ts** (11 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **StaffRecord** (6 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **LeaveRequestRecord** (5 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **StaffAttendanceRecord** (5 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **.getStaffDetails()** (5 connections) — `backend/src/modules/hrms/hrms.service.ts`
- **DesignationRecord** (4 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **LeaveTypeRecord** (4 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **StaffEmploymentHistory** (3 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **.getUnreadCount()** (3 connections) — `backend/src/modules/notifications/notification.service.ts`
- **.markAllAsRead()** (3 connections) — `backend/src/modules/notifications/notification.service.ts`
- **.markAsRead()** (3 connections) — `backend/src/modules/notifications/notification.service.ts`
- **DepartmentRecord** (1 connections) — `backend/src/modules/hrms/hrms.repository.ts`
- **.getUserNotifications()** (1 connections) — `backend/src/modules/notifications/notification.service.ts`
- **.sendNotification()** (1 connections) — `backend/src/modules/notifications/notification.service.ts`

## Relationships

- [Hrms Repository Hrmsrepository](Hrms_Repository_Hrmsrepository.md) (19 shared connections)
- [Repository Service Timetable](Repository_Service_Timetable.md) (11 shared connections)
- [Auth Repository Workspaces](Auth_Repository_Workspaces.md) (3 shared connections)
- [Routes Middleware Router](Routes_Middleware_Router.md) (1 shared connections)
- [Hrms Controller Actionleaveschema](Hrms_Controller_Actionleaveschema.md) (1 shared connections)
- [Users Provisioning Service](Users_Provisioning_Service.md) (1 shared connections)

## Source Files

- `backend/src/modules/hrms/hrms.repository.ts`
- `backend/src/modules/hrms/hrms.service.ts`
- `backend/src/modules/notifications/notification.service.ts`

## Audit Trail

- EXTRACTED: 59 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*