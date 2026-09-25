"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Institution, Applicant, AcademicGrade, FacultyMember, FeeRecord } from "@/types"

// Mock Institutions
const MOCK_INSTITUTIONS: Institution[] = [
  {
    id: "inst-001",
    name: "Springfield International Academy",
    code: "SIA-BLR",
    domain: "springfield.vid.edu",
    status: "ACTIVE",
    plan: "ENTERPRISE",
    studentsCount: 2450,
    facultyCount: 142,
    createdAt: "2024-01-15",
    region: "Bangalore, India",
  },
  {
    id: "inst-002",
    name: "St. Jude Heritage World School",
    code: "SJHW-DEL",
    domain: "stjude.vid.edu",
    status: "ACTIVE",
    plan: "PRO",
    studentsCount: 1820,
    facultyCount: 98,
    createdAt: "2024-03-22",
    region: "New Delhi, India",
  },
  {
    id: "inst-003",
    name: "Oakridge Global STEM Campus",
    code: "OGSC-HYD",
    domain: "oakridge.vid.edu",
    status: "ACTIVE",
    plan: "ENTERPRISE",
    studentsCount: 3100,
    facultyCount: 180,
    createdAt: "2023-11-05",
    region: "Hyderabad, India",
  },
  {
    id: "inst-004",
    name: "Presidency Model Collegiate",
    code: "PMC-MUM",
    domain: "presidency.vid.edu",
    status: "PENDING",
    plan: "BASIC",
    studentsCount: 850,
    facultyCount: 45,
    createdAt: "2024-08-10",
    region: "Mumbai, India",
  },
]

// Mock Applicants for Admissions Kanban
const MOCK_APPLICANTS: Applicant[] = [
  {
    id: "app-101",
    applicationNumber: "APP-2026-0891",
    studentName: "Aarav Sharma",
    gradeApplying: "Grade 9",
    parentName: "Vikram Sharma",
    parentPhone: "+91 98450 12345",
    parentEmail: "vikram.sharma@example.com",
    stage: "INQUIRY",
    documentsSubmitted: [
      { id: "doc-1", title: "Birth Certificate", status: "PENDING", fileName: "birth_cert.pdf", uploadDate: "2026-09-12" },
      { id: "doc-2", title: "Previous Marksheet", status: "PENDING", fileName: "grade8_term2.pdf", uploadDate: "2026-09-12" },
    ],
    feePaid: false,
    feeAmount: 2500,
    appliedDate: "2026-09-12",
  },
  {
    id: "app-102",
    applicationNumber: "APP-2026-0892",
    studentName: "Rhea Nair",
    gradeApplying: "Grade 11 (Science)",
    parentName: "Sunita Nair",
    parentPhone: "+91 97410 88219",
    parentEmail: "sunita.nair@example.com",
    stage: "APPLIED",
    documentsSubmitted: [
      { id: "doc-3", title: "Birth Certificate", status: "VERIFIED", fileName: "rhea_birth.pdf", uploadDate: "2026-09-14" },
      { id: "doc-4", title: "Transfer Certificate", status: "PENDING", fileName: "tc_transfer.pdf", uploadDate: "2026-09-14" },
    ],
    feePaid: true,
    feeAmount: 2500,
    appliedDate: "2026-09-14",
    entranceScore: 88,
  },
  {
    id: "app-103",
    applicationNumber: "APP-2026-0893",
    studentName: "Zaid Khan",
    gradeApplying: "Grade 7",
    parentName: "Farhan Khan",
    parentPhone: "+91 99001 54321",
    parentEmail: "farhan.k@example.com",
    stage: "DOCUMENT_VERIFICATION",
    documentsSubmitted: [
      { id: "doc-5", title: "Birth Certificate", status: "VERIFIED", fileName: "zaid_birth.pdf", uploadDate: "2026-09-15" },
      { id: "doc-6", title: "Aadhaar Card", status: "VERIFIED", fileName: "aadhaar_zaid.pdf", uploadDate: "2026-09-15" },
      { id: "doc-7", title: "Previous Marksheet", status: "VERIFIED", fileName: "grade6_final.pdf", uploadDate: "2026-09-15" },
    ],
    feePaid: true,
    feeAmount: 2500,
    appliedDate: "2026-09-15",
    entranceScore: 92,
  },
  {
    id: "app-104",
    applicationNumber: "APP-2026-0894",
    studentName: "Ananya Iyer",
    gradeApplying: "Grade 10",
    parentName: "Karthik Iyer",
    parentPhone: "+91 98860 99421",
    parentEmail: "karthik.iyer@example.com",
    stage: "INTERVIEW",
    documentsSubmitted: [
      { id: "doc-8", title: "Birth Certificate", status: "VERIFIED", fileName: "ananya_b.pdf", uploadDate: "2026-09-10" },
      { id: "doc-9", title: "Previous Marksheet", status: "VERIFIED", fileName: "grade9_final.pdf", uploadDate: "2026-09-10" },
    ],
    feePaid: true,
    feeAmount: 2500,
    appliedDate: "2026-09-10",
    entranceScore: 95,
  },
  {
    id: "app-105",
    applicationNumber: "APP-2026-0895",
    studentName: "Devansh Patel",
    gradeApplying: "Grade 11 (Commerce)",
    parentName: "Nilesh Patel",
    parentPhone: "+91 94250 67123",
    parentEmail: "nilesh.patel@example.com",
    stage: "APPROVED",
    documentsSubmitted: [
      { id: "doc-10", title: "Birth Certificate", status: "VERIFIED", fileName: "dev_birth.pdf", uploadDate: "2026-09-08" },
      { id: "doc-11", title: "Grade 10 Board Result", status: "VERIFIED", fileName: "icse_marksheet.pdf", uploadDate: "2026-09-08" },
      { id: "doc-12", title: "Conduct Certificate", status: "VERIFIED", fileName: "conduct.pdf", uploadDate: "2026-09-08" },
    ],
    feePaid: true,
    feeAmount: 2500,
    appliedDate: "2026-09-08",
    entranceScore: 91,
    notes: "Approved by Principal on merit list.",
  },
]

// Mock Academic Grades & Hierarchy
const MOCK_GRADES: AcademicGrade[] = [
  {
    id: "grd-10",
    name: "Grade 10",
    code: "G10",
    curriculum: "CBSE Standard",
    sections: [
      { id: "sec-10a", name: "Section A", room: "Block B - Room 201", capacity: 40, enrolled: 38, classTeacher: "Mrs. Revathi Raman" },
      { id: "sec-10b", name: "Section B", room: "Block B - Room 202", capacity: 40, enrolled: 39, classTeacher: "Mr. Deepak Varma" },
      { id: "sec-10c", name: "Section C", room: "Block B - Room 203", capacity: 40, enrolled: 37, classTeacher: "Ms. Shalini Gupta" },
    ],
    subjects: [
      { id: "sub-1", name: "Mathematics", code: "MAT101", credits: 4, type: "CORE" },
      { id: "sub-2", name: "Physics & Chemistry", code: "SCI102", credits: 4, type: "CORE" },
      { id: "sub-3", name: "English Language & Lit", code: "ENG103", credits: 3, type: "CORE" },
      { id: "sub-4", name: "Computer Applications", code: "CS104", credits: 3, type: "ELECTIVE" },
      { id: "sub-5", name: "STEM Innovation Lab", code: "LAB105", credits: 2, type: "LAB" },
    ],
  },
  {
    id: "grd-11",
    name: "Grade 11",
    code: "G11",
    curriculum: "CBSE Senior",
    sections: [
      { id: "sec-11s", name: "Section A (Science)", room: "Block C - Room 301", capacity: 45, enrolled: 44, classTeacher: "Dr. Arvind Rao" },
      { id: "sec-11c", name: "Section B (Commerce)", room: "Block C - Room 302", capacity: 45, enrolled: 42, classTeacher: "Mr. George Mathew" },
    ],
    subjects: [
      { id: "sub-11-1", name: "Advanced Physics", code: "PHY201", credits: 4, type: "CORE" },
      { id: "sub-11-2", name: "Organic Chemistry", code: "CHM202", credits: 4, type: "CORE" },
      { id: "sub-11-3", name: "Calculus & Algebra", code: "MAT203", credits: 4, type: "CORE" },
      { id: "sub-11-4", name: "Python & AI Foundations", code: "AI204", credits: 3, type: "ELECTIVE" },
    ],
  },
]

// Mock Faculty Roster
const MOCK_FACULTY: FacultyMember[] = [
  {
    id: "fac-01",
    employeeCode: "FAC-EMP-1042",
    name: "Mrs. Revathi Raman",
    designation: "Senior Mathematics Lecturer & HOD",
    department: "Department of Mathematics",
    email: "revathi.raman@springfield.edu",
    phone: "+91 98451 22910",
    assignedClasses: [
      { grade: "Grade 10", section: "Section A", subject: "Mathematics", room: "B-201", schedule: "Mon/Wed/Fri 08:30 - 09:30" },
      { grade: "Grade 10", section: "Section B", subject: "Mathematics", room: "B-202", schedule: "Tue/Thu 10:00 - 11:00" },
    ],
    todayClasses: [
      { time: "08:30 - 09:30 AM", grade: "Grade 10", section: "Section A", subject: "Calculus & Quadratic Equations", status: "COMPLETED" },
      { time: "11:15 - 12:15 PM", grade: "Grade 10", section: "Section B", subject: "Coordinate Geometry", status: "IN_PROGRESS" },
      { time: "02:00 - 03:00 PM", grade: "Grade 11", section: "Section A", subject: "Trigonometric Identites Lab", status: "UPCOMING" },
    ],
    status: "ACTIVE",
  },
  {
    id: "fac-02",
    employeeCode: "FAC-EMP-1088",
    name: "Dr. Arvind Rao",
    designation: "Head of Physical Sciences",
    department: "Department of Science",
    email: "arvind.rao@springfield.edu",
    phone: "+91 97412 33490",
    assignedClasses: [
      { grade: "Grade 11", section: "Section A", subject: "Advanced Physics", room: "C-301", schedule: "Mon-Fri 09:30 - 10:30" },
    ],
    todayClasses: [
      { time: "09:30 - 10:30 AM", grade: "Grade 11", section: "Section A", subject: "Electromagnetism & Wave Optics", status: "COMPLETED" },
      { time: "01:30 - 03:00 PM", grade: "Grade 11", section: "Section A", subject: "Optics Laboratory Session", status: "UPCOMING" },
    ],
    status: "ACTIVE",
  },
]

// Mock Fee Records
const MOCK_FEES: FeeRecord[] = [
  {
    id: "fee-001",
    studentId: "stu-101",
    studentName: "Aarav Sharma",
    rollNumber: "SIA-2026-042",
    gradeSection: "Grade 10-A",
    invoiceNumber: "INV-2026-8901",
    term: "Term 1 (Academic 2026-27)",
    totalAmount: 48500,
    paidAmount: 48500,
    balanceAmount: 0,
    dueDate: "2026-09-01",
    status: "PAID",
  },
  {
    id: "fee-002",
    studentId: "stu-102",
    studentName: "Devansh Patel",
    rollNumber: "SIA-2026-043",
    gradeSection: "Grade 11-A",
    invoiceNumber: "INV-2026-8902",
    term: "Term 1 (Academic 2026-27)",
    totalAmount: 56000,
    paidAmount: 30000,
    balanceAmount: 26000,
    dueDate: "2026-09-15",
    status: "PARTIAL",
  },
  {
    id: "fee-003",
    studentId: "stu-103",
    studentName: "Rhea Nair",
    rollNumber: "SIA-2026-044",
    gradeSection: "Grade 11-B",
    invoiceNumber: "INV-2026-8903",
    term: "Term 1 (Academic 2026-27)",
    totalAmount: 56000,
    paidAmount: 0,
    balanceAmount: 56000,
    dueDate: "2026-09-10",
    status: "OVERDUE",
  },
]

// --- TanStack Query Hooks (Live Backend with Fallback) ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"
const DEFAULT_INST_ID = "22222222-2222-2222-2222-222222222201"

export function useInstitutions() {
  return useQuery({
    queryKey: ["institutions"],
    queryFn: async (): Promise<Institution[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/institutions`)
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, using mock institutions:", err)
      }
      return MOCK_INSTITUTIONS
    },
  })
}

export function useAdmissions() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["admissions"],
    queryFn: async (): Promise<Applicant[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/admissions/applicants`, {
          headers: { "X-Institution-Id": DEFAULT_INST_ID },
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, using mock applicants:", err)
      }
      return MOCK_APPLICANTS
    },
  })

  const updateStageMutation = useMutation({
    mutationFn: async ({ applicantId, newStage }: { applicantId: string; newStage: any }) => {
      try {
        await fetch(`${API_BASE_URL}/admissions/applicants/${applicantId}/stage`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Institution-Id": DEFAULT_INST_ID,
          },
          body: JSON.stringify({ stage: newStage }),
        })
      } catch (err) {
        console.warn("Stage update fetch fallback:", err)
      }
      return { applicantId, newStage }
    },
    onSuccess: ({ applicantId, newStage }) => {
      queryClient.setQueryData(["admissions"], (old: Applicant[] | undefined) => {
        if (!old) return []
        return old.map((app) => (app.id === applicantId ? { ...app, stage: newStage } : app))
      })
    },
  })

  return {
    ...query,
    updateStage: updateStageMutation.mutateAsync,
  }
}

export function useAcademics() {
  return useQuery({
    queryKey: ["academics-hierarchy"],
    queryFn: async (): Promise<AcademicGrade[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/academics/grades`, {
          headers: { "X-Institution-Id": DEFAULT_INST_ID },
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, using mock academic grades:", err)
      }
      return MOCK_GRADES
    },
  })
}

export function useFaculty() {
  return useQuery({
    queryKey: ["faculty-roster"],
    queryFn: async (): Promise<FacultyMember[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/faculty`, {
          headers: { "X-Institution-Id": DEFAULT_INST_ID },
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, using mock faculty:", err)
      }
      return MOCK_FACULTY
    },
  })
}

export function useMyClasses() {
  return useQuery({
    queryKey: ["faculty-my-classes"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/faculty`, {
          headers: { "X-Institution-Id": DEFAULT_INST_ID },
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data[0]
        }
      } catch (err) {
        console.warn("Backend unavailable, using mock my-classes:", err)
      }
      return MOCK_FACULTY[0]
    },
  })
}

export function useFinance() {
  return useQuery({
    queryKey: ["finance-records"],
    queryFn: async (): Promise<FeeRecord[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/finance/records`, {
          headers: { "X-Institution-Id": DEFAULT_INST_ID },
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, using mock fees:", err)
      }
      return MOCK_FEES
    },
  })
}

