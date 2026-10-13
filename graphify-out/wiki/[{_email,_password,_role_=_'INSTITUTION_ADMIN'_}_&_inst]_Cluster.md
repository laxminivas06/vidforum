# [{ email, password, role = 'INSTITUTION_ADMIN' } & inst] Cluster

> 48 nodes · cohesion 0.05

## Key Concepts

- [AttendanceRepository](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L60) (14 connections)
- [AttendanceService](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L6) (14 connections)
- [.sendNotification()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.service.ts#L21) (9 connections)
- [.submitRollCall()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L93) (7 connections)
- [NotificationRepository](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.repository.ts#L17) (7 connections)
- [NotificationService](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.service.ts#L3) (6 connections)
- [.verifyFacultySectionAccess()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L642) (5 connections)
- [.getStudentSummary()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.controller.ts#L94) (4 connections)
- [.getInstitutionAttendanceStats()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L402) (4 connections)
- [.applyStudentLeave()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L266) (4 connections)
- [.decideStudentLeave()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L339) (4 connections)
- [.getScopedAttendance()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L206) (4 connections)
- [.getStudentAttendanceSummary()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L168) (4 connections)
- [.getNotifications()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.controller.ts#L6) (4 connections)
- [.send()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.controller.ts#L77) (4 connections)
- [.createStudentLeaveRequest()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L432) (3 connections)
- [.getOrCreateSession()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L62) (3 connections)
- [.getSectionRosterForSession()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L221) (3 connections)
- [.getSessionById()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L115) (3 connections)
- [.listStudentLeaveRequests()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts#L454) (3 connections)
- [.getOrCreateSession()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L8) (3 connections)
- [.getSectionRoster()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L72) (3 connections)
- [.listStudentLeaves()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts#L324) (3 connections)
- [.createNotification()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.repository.ts#L72) (3 connections)
- [.findForUser()](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.repository.ts#L22) (3 connections)
- *... and 23 more nodes in this community*

## Class Diagram

```mermaid
classDiagram
    class AttendanceRepository {
        +attendance.repository.ts()
        +.getOrCreateSession()
        +.getSessionById()
        +.listSessions()
        +.getSectionRosterForSession()
        +.recordRollCall()
        +.getStudentAttendanceSummary()
        +.getInstitutionAttendanceStats()
        +.createStudentLeaveRequest()
        +.listStudentLeaveRequests()
    }
    class AttendanceService {
        +attendance.service.ts()
        +.getOrCreateSession()
        +.getSessionById()
        +.listSessions()
        +.getSectionRoster()
        +.submitRollCall()
        +.getStudentAttendanceSummary()
        +.getScopedAttendance()
        +.applyStudentLeave()
        +.listStudentLeaves()
    }
    class NotificationRepository {
        +notification.repository.ts()
        +.constructor()
        +.findForUser()
        +.getUnreadCount()
        +.markAsRead()
        +.markAllAsRead()
        +.createNotification()
    }
    class NotificationService {
        +notification.service.ts()
        +.getUserNotifications()
        +.getUnreadCount()
        +.markAsRead()
        +.markAllAsRead()
        +.sendNotification()
    }
```

## Relationships

- No strong cross-community connections detected

## Source Files

- [C:\Antigravityyyyy\VID_School\backend\src\modules\attendance\attendance.controller.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.controller.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\attendance\attendance.repository.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.repository.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\attendance\attendance.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/attendance/attendance.service.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\notifications\notification.controller.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.controller.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\notifications\notification.repository.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.repository.ts)
- [C:\Antigravityyyyy\VID_School\backend\src\modules\notifications\notification.service.ts](file:///C:/Antigravityyyyy/VID_School/backend/src/modules/notifications/notification.service.ts)

## Audit Trail

- EXTRACTED: 91 (57%)
- INFERRED: 68 (43%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*