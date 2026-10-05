export type StatusType = "ACTIVE" | "PENDING" | "SUSPENDED" | "ARCHIVED" | "INACTIVE"

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
  boardAffiliation?: string
  contactEmail?: string
  contactPhone?: string
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
  classId?: string
  academicYearId?: string
  dateOfBirth?: string
  gender?: string
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

export interface AdmissionDocumentItem {
  id: string
  applicationId: string
  applicationNumber: string
  title: string
  fileName: string
  status: "VERIFIED" | "PENDING" | "REJECTED"
  verifiedAt?: string | null
  uploadDate: string
  applicantName: string
  gradeApplying: string
  guardianName: string
  guardianPhone: string
  applicantStage: string
}

export interface EnrolledApplicantItem {
  id: string
  applicationId: string
  studentId: string
  studentName: string
  applicationNumber: string
  admissionNumber: string
  gender: string
  dateOfBirth: string
  gradeName: string
  classId: string
  enrollmentDate: string
  enrolledDate: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  feeAmount: number
  feePaid: boolean
  feeStatus: string
  documents: {
    id: string
    title: string
    status: "VERIFIED" | "PENDING" | "REJECTED"
    fileName: string
    uploadDate: string
  }[]
  documentsVerified: number
  totalDocuments: number
}

export interface AcademicGrade {
  id: string
  name: string
  code: string
  curriculum: string
  sequenceOrder?: number
  departmentId?: string
  departmentName?: string
  academicYearId?: string
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
    type: "Languages" | "Core Subject" | "External" | "CORE" | "ELECTIVE" | "LAB" | string
    subjectType?: string
    syllabus?: string
    periodsPerWeek?: number
    maxMarks?: number
    passMarks?: number
    isMandatory?: boolean
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
  qualification?: string
  university?: string
  subjects?: string
  experience?: string
  address?: string
  dateOfBirth?: string
  gender?: string
  userId?: string
  hasAccount?: boolean
  assignedClasses: FacultyAssignment[]
  todayClasses?: {
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

export interface StudentListItem {
  id: string
  admissionNumber: string
  firstName: string
  lastName: string
  name: string
  dateOfBirth: string
  age: number
  gender: string
  status: string
  bloodGroup?: string
  nationality?: string
  photoUrl?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  classId?: string
  className?: string
  sectionId?: string
  sectionName?: string
  rollNumber?: string
  guardianName?: string
  guardianPhone?: string
}

export interface ClassEnrollmentCount {
  class_id: string
  institution_id: string
  class_name: string
  capacity: number
  enrolled_count: number
  available_seats: number
}

export interface EnquiryItem {
  id: string
  institution_id: string
  applicant_name: string
  date_of_birth?: string
  gender?: string
  grade_applying?: string
  class_id?: string
  academic_year_id?: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  source?: string
  notes?: string
  status: "open" | "converted" | "dropped"
  created_at: string
}

