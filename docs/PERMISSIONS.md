# VID Platform: Canonical Permissions Registry

**Document:** `/docs/PERMISSIONS.md`  
**Standard Naming:** `<module>.<resource>.<action>`  
**Enforcement:** Server-side via `tenant_resolver → permission_middleware → resource_guard`  

---

## 1. Platform & System Permissions (`SUPER_ADMIN`)
- `platform.all` - Unrestricted platform root access
- `platform.read` - Read platform infrastructure and telemetry
- `platform.write` - Mutate platform settings
- `institutions.manage` - Create, provision, activate, and suspend institutions
- `subscriptions.manage` - Manage subscription plans and tenant quotas
- `ai.config.global` - Global AI Yantra service models and token budgets
- `telemetry.read` - System health, cluster metrics, and global audit inspection
- `billing.manage` - Global invoice settlement and gateway configurations

---

## 2. Institutional Administration (`INSTITUTION_ADMIN`)
- `institution.profile.read` - Read institutional profile and board affiliations
- `institution.profile.update` - Update institutional configuration and branding
- `institution.modules.toggle` - Enable or disable optional modules
- `users.manage` - Provision, assign roles, and edit institutional staff/users
- `roles.manage` - Inspect role capability mappings

---

## 3. Admissions Permissions (`ADMISSION_TEAM`)
- `admissions.enquiry.read` - Read prospective student inquiries
- `admissions.enquiry.create` - Record new inquiry
- `admissions.application.read` - View admissions applications and kanban
- `admissions.application.create` - Submit new application
- `admissions.application.verify` - Verify submitted applicant documents
- `admissions.application.approve` - Execute atomic approval transaction (creates student master)
- `admissions.application.reject` - Reject application
- `admissions.application.waitlist` - Place application on waitlist

---

## 4. Academic Core Permissions (`ACADEMIC_COORDINATOR`)
- `academics.year.manage` - Create and toggle academic calendar years
- `academics.department.manage` - Manage academic & administrative departments
- `academics.course.manage` - Manage course catalog
- `academics.class.manage` - Manage classes, sections, and class capacities
- `academics.subject.manage` - Manage subject catalog and syllabus
- `academics.allocation.manage` - Allocate faculty to classes, sections, and subjects
- `academics.promotion.manage` - Execute student promotion / demotion pipelines

---

## 5. Faculty Permissions (`FACULTY`)
- `faculty.profile.read` - View own faculty profile
- `faculty.classes.read` - View assigned classes, sections, and subjects
- `faculty.students.read` - View assigned student rosters (strictly resource-guarded)
- `faculty.timetable.read` - View today's schedule and timetable
- `attendance.session.create` - Open daily roll-call attendance for assigned section
- `attendance.record.write` - Mark student attendance
- `examinations.marks.entry` - Enter examination marks for assigned subjects
- `ai.tutor.access` - Faculty companion assistance

---

## 6. Examinations Permissions (`EXAM_TEAM`)
- `examinations.config.manage` - Configure exam types, grading scales, and passing criteria
- `examinations.schedule.manage` - Publish exam schedules and room allocations
- `examinations.marks.import` - Execute Excel marks import engine with pre-commit validation
- `examinations.marks.verify` - Verify entered marks
- `examinations.marks.approve` - Approve marks and lock gradebooks
- `examinations.reportcard.generate` - Generate student report cards and transcripts

---

## 7. Finance & Fee Permissions (`FINANCE_TEAM`)
- `finance.structure.manage` - Configure fee categories, heads, and installment schedules
- `finance.assignment.manage` - Assign fees to students, classes, or cohorts
- `finance.invoice.read` - View invoices ledger
- `finance.invoice.create` - Issue fee invoices
- `finance.payment.collect` - Record counter collections and cash/cheque receipts
- `finance.discount.manage` - Apply concession/scholarship waivers (creates audit trail)
- `finance.refund.manage` - Issue approved fee refunds

---

## 8. HRMS Permissions (`HR_STAFF`)
- `hrms.staff.read` - View staff directory and employment profiles
- `hrms.staff.manage` - Onboard employees and manage designations
- `hrms.attendance.manage` - Record staff biometric / roll-call attendance
- `hrms.leave.approve` - Review and approve staff leave requests

---

## 9. Student Permissions (`STUDENT`)
- `student.profile.view` - View own personal profile
- `student.academics.view` - View own enrolled classes, subjects, and study materials
- `student.attendance.view` - View own attendance percentages and session logs
- `student.timetable.view` - View own class schedule
- `student.fees.view` - View own fee invoices and payment status
- `student.marks.view` - View own approved examination results and report cards
- `student.tutor.access` - 24/7 AI Tutor personal study companion

---

## 10. Parent Permissions (`PARENT`)
- `parent.children.view` - View linked children via `student_parents` (Rule 9)
- `parent.attendance.view` - View linked children attendance alerts
- `parent.academics.view` - View linked children homework and progress
- `parent.fees.pay` - Pay outstanding invoices via online payment gateway
- `parent.marks.view` - View report cards and performance trends
