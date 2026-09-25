export type StatusType = "ACTIVE" | "PENDING" | "SUSPENDED" | "ARCHIVED"

export interface Institution {
  id: string
  name: string
  code: string
  domain: string
  status: StatusType
  plan: "BASIC" | "PRO" | "ENTERPRISE"
  studentsCount: number
  facultyCount: number
  createdAt: string
  region: string
}

export type AdmissionStage = 
  | "INQUIRY" 
  | "APPLIED" 
  | "DOCUMENT_VERIFICATION" 
  | "INTERVIEW" 
  | "APPROVED" 
  | "ENROLLED" 
  | "REJECTED"

export interface Applicant {
  id: string
  applicationNumber: string
  studentName: string
  gradeApplying: string
  parentName: string
  parentPhone: string
  parentEmail: string
  stage: AdmissionStage
  documentsSubmitted: {
    id: string
    title: string
    status: "VERIFIED" | "PENDING" | "REJECTED"
    fileName: string
    uploadDate: string
  }[]
  feePaid: boolean
  feeAmount: number
  appliedDate: string
  entranceScore?: number
  notes?: string
}

export interface AcademicGrade {
  id: string
  name: string
  code: string
  curriculum: string
  sections: {
    id: string
    name: string
    room: string
    capacity: number
    enrolled: number
    classTeacher: string
  }[]
  subjects: {
    id: string
    name: string
    code: string
    credits: number
    type: "CORE" | "ELECTIVE" | "LAB"
  }[]
}

export interface FacultyAssignment {
  grade: string
  section: string
  subject: string
  room: string
  schedule: string
}

export interface FacultyMember {
  id: string
  employeeCode: string
  name: string
  designation: string
  department: string
  email: string
  phone: string
  assignedClasses: FacultyAssignment[]
  todayClasses: {
    time: string
    grade: string
    section: string
    subject: string
    status: "COMPLETED" | "UPCOMING" | "IN_PROGRESS"
  }[]
  status: "ACTIVE" | "ON_LEAVE"
  avatarUrl?: string
}

export interface FeeRecord {
  id: string
  studentId: string
  studentName: string
  rollNumber: string
  gradeSection: string
  invoiceNumber: string
  term: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  dueDate: string
  status: "PAID" | "PARTIAL" | "OVERDUE" | "PENDING"
}
