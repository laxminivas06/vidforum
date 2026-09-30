"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Institution, Applicant, AcademicGrade, FacultyMember, FeeRecord } from "@/types"

// Mock Institutions (Dummy institutions removed per Super Admin directive)
const MOCK_INSTITUTIONS: Institution[] = []

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
        if (json.success && Array.isArray(json.data)) {
          // Cloud database is the canonical master
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, falling back to local storage:", err)
      }

      // Offline fallback only
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("vid_custom_institutions")
          if (raw) return JSON.parse(raw)
        } catch (e) {
          console.warn("Failed to parse custom institutions", e)
        }
      }
      return []
    },
  })
}

export function useCreateInstitution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newInst: {
      name: string
      code: string
      domain: string
      boardAffiliation?: string
      contactEmail?: string
      region?: string
      plan?: "BASIC" | "PRO" | "ENTERPRISE"
    }): Promise<Institution> => {
      const payload = {
        name: newInst.name.trim(),
        code: newInst.code.trim().toUpperCase(),
        domain: newInst.domain.trim().toLowerCase(),
        plan: newInst.plan || "ENTERPRISE",
        region: newInst.region || "Bangalore, India",
        boardAffiliation: newInst.boardAffiliation || "CBSE Standard",
        contactEmail: newInst.contactEmail || "admin@institution.edu",
      }

      const res = await fetch(`${API_BASE_URL}/institutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message || json.message || "Failed to create institution in cloud database")
      }
      return json.data
    },
    onSuccess: (newInstitution) => {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("vid_custom_institutions")
          const current: Institution[] = raw ? JSON.parse(raw) : []
          const updated = [
            newInstitution,
            ...current.filter((i) => i.code !== newInstitution.code && i.id !== newInstitution.id),
          ]
          localStorage.setItem("vid_custom_institutions", JSON.stringify(updated))
        } catch (e) {
          console.warn("Failed to persist custom institution", e)
        }
      }

      queryClient.invalidateQueries({ queryKey: ["institutions"] })
    },
  })
}

export function useInstitutionAdmins(institutionId?: string) {
  return useQuery({
    queryKey: ["institution-admins", institutionId],
    queryFn: async (): Promise<any[]> => {
      if (!institutionId) return []
      let customAdmins: any[] = []
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("vid_institute_admins")
          if (raw) {
            const parsed = JSON.parse(raw)
            customAdmins = parsed.filter(
              (a: any) =>
                a.institutionId === institutionId ||
                a.institutionCode?.toLowerCase() === institutionId.toLowerCase()
            )
          }
        } catch (e) {
          console.warn("Failed to parse custom institute admins", e)
        }
      }

      let backendAdmins: any[] = []
      try {
        const res = await fetch(`${API_BASE_URL}/institutions/${institutionId}/admins`)
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          backendAdmins = json.data
        }
      } catch (err) {
        // Backend offline
      }

      const merged = [...customAdmins, ...backendAdmins]
      const seen = new Set<string>()
      return merged.filter((a) => {
        const key = (a.userId || a.email || a.id).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
    enabled: !!institutionId,
  })
}

export function useCreateInstitutionAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      institutionId: string
      userId: string
      email: string
      password?: string
      workspaces: string[]
      name?: string
      institutionName?: string
      institutionCode?: string
    }) => {
      const newAdmin = {
        id: `adm-${Date.now()}`,
        userId: payload.userId.trim().toLowerCase(),
        name: payload.name || payload.userId,
        email: payload.email.trim().toLowerCase(),
        password: payload.password || "admin123",
        institutionId: payload.institutionId,
        institutionName: payload.institutionName || "Partner Institution",
        institutionCode: payload.institutionCode || "INST",
        workspaces: payload.workspaces,
        createdAt: new Date().toISOString(),
      }

      try {
        const res = await fetch(`${API_BASE_URL}/institutions/${payload.institutionId}/admins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, persisting admin locally:", err)
      }

      return newAdmin
    },
    onSuccess: (newAdmin, variables) => {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("vid_institute_admins")
          const current = raw ? JSON.parse(raw) : []
          const updated = [
            newAdmin,
            ...current.filter(
              (a: any) =>
                a.userId?.toLowerCase() !== newAdmin.userId?.toLowerCase() &&
                a.email?.toLowerCase() !== newAdmin.email?.toLowerCase()
            ),
          ]
          localStorage.setItem("vid_institute_admins", JSON.stringify(updated))

          // Also register in platform users list so it appears in Platform Users page
          const rawUsers = localStorage.getItem("vid_platform_users")
          const currentUsers = rawUsers ? JSON.parse(rawUsers) : []
          const platformUser = {
            id: newAdmin.id || `usr-${Date.now()}`,
            name: newAdmin.name || newAdmin.userId,
            email: newAdmin.email,
            role: "INSTITUTION_ADMIN",
            institution: variables.institutionName || newAdmin.institutionName || "Partner Institution",
            status: "ACTIVE",
            createdAt: new Date().toISOString().split("T")[0],
          }
          const updatedUsers = [
            platformUser,
            ...currentUsers.filter(
              (u: any) => u.email?.toLowerCase() !== newAdmin.email?.toLowerCase()
            ),
          ]
          localStorage.setItem("vid_platform_users", JSON.stringify(updatedUsers))
        } catch (e) {
          console.warn("Failed to persist institute admin to localStorage", e)
        }
      }

      queryClient.invalidateQueries({ queryKey: ["institution-admins", variables.institutionId] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export interface PlatformUserItem {
  id: string
  name: string
  email: string
  role: string
  institution: string
  status: "ACTIVE" | "INACTIVE"
  institutionId?: string | null
  createdAt?: string
}

export function usePlatformUsers() {
  return useQuery({
    queryKey: ["platform-users"],
    queryFn: async (): Promise<PlatformUserItem[]> => {
      let backendList: PlatformUserItem[] = []
      try {
        const res = await fetch(`${API_BASE_URL}/users`)
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          backendList = json.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: (u.role || "FACULTY").toUpperCase().replace(/\s+/g, "_"),
            institution: u.institution || "VID Global Platform",
            status: (u.status || "ACTIVE").toUpperCase() as "ACTIVE" | "INACTIVE",
            institutionId: u.institutionId,
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : undefined,
          }))
        }
      } catch (err) {
        console.warn("Backend users unavailable, falling back to local:", err)
      }

      let localUsers: PlatformUserItem[] = []
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("vid_platform_users")
          if (raw) localUsers = JSON.parse(raw)
        } catch (e) {
          // ignore
        }
      }

      const combined = backendList.length > 0 ? backendList : localUsers
      const seen = new Set<string>()
      return combined.filter((u) => {
        const key = (u.email || u.id).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
  })
}

export function useCreatePlatformUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      email: string
      role: string
      institutionName: string
    }): Promise<PlatformUserItem> => {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to create user")
      }
      return json.data
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useUpdatePlatformUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      id: string
      name?: string
      email?: string
      role?: string
      institutionName?: string
      status?: "ACTIVE" | "INACTIVE"
    }): Promise<PlatformUserItem> => {
      const { id, ...data } = payload
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to update user")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
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

