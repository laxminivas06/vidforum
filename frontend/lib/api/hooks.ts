"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Institution,
  Applicant,
  AcademicGrade,
  FacultyMember,
  FeeRecord,
  StudentListItem,
  ClassEnrollmentCount,
  EnquiryItem,
  AdmissionDocumentItem,
  EnrolledApplicantItem,
} from "@/types"

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return `${window.location.protocol}//${window.location.hostname}:5000/api/v1`
  }
  return "http://localhost:5000/api/v1"
}
const API_BASE_URL = getApiBaseUrl()
const DEFAULT_INST_ID = "18b3b9a6-0791-47f4-bbd0-bf7c0221e18f"

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Institution-Id": DEFAULT_INST_ID,
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vid_auth_token")
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    const sessionUser = localStorage.getItem("vid_session_user")
    if (sessionUser) {
      try {
        const u = JSON.parse(sessionUser)
        if (u.institutionId) {
          headers["X-Institution-Id"] = u.institutionId
        }
      } catch (e) {}
    }
  }
  return headers
}

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
        console.warn("Backend unavailable:", err)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
    },
  })
}

export function useUpdateInstitutionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      id: string
      status: "active" | "inactive" | "suspended"
    }): Promise<any> => {
      const res = await fetch(`${API_BASE_URL}/institutions/${payload.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: payload.status }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to update institution status")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
    },
  })
}

export function useInstitutionAdmins(institutionId?: string) {
  return useQuery({
    queryKey: ["institution-admins", institutionId],
    queryFn: async (): Promise<any[]> => {
      if (!institutionId) return []
      try {
        const res = await fetch(`${API_BASE_URL}/institutions/${institutionId}/admins`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend admins fetch error:", err)
      }
      return []
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
      const token = typeof window !== "undefined" ? localStorage.getItem("vid_auth_token") : null
      const res = await fetch(`${API_BASE_URL}/institutions/${payload.institutionId}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create institution administrator")
      }
      return json.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["institution-admins", variables.institutionId] })
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useUpdateAdminWorkspaces() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      institutionId: string
      adminId: string
      workspaces: string[]
    }) => {
      const res = await fetch(
        `${API_BASE_URL}/institutions/${payload.institutionId}/admins/${encodeURIComponent(payload.adminId)}/workspaces`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaces: payload.workspaces }),
        }
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update workspaces in Cloud DB")
      }
      return json.data
    },
    onSuccess: (_, variables) => {
      if (typeof window !== "undefined") {
        try {
          const rawSession = localStorage.getItem("vid_session_user")
          if (rawSession) {
            const sessionUser = JSON.parse(rawSession)
            if (
              sessionUser.id === variables.adminId ||
              sessionUser.email?.toLowerCase() === variables.adminId.toLowerCase()
            ) {
              sessionUser.assignedWorkspaces = variables.workspaces
              localStorage.setItem("vid_session_user", JSON.stringify(sessionUser))
            }
          }
        } catch (e) {
          // ignore
        }
      }

      queryClient.invalidateQueries({ queryKey: ["institution-admins", variables.institutionId] })
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
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
      try {
        const res = await fetch(`${API_BASE_URL}/users`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((u: any) => ({
            id: u.id,
            name: u.name || u.full_name || "Platform User",
            email: u.email,
            role: (u.role || "FACULTY").toUpperCase().replace(/\s+/g, "_"),
            institution: u.institution || "VID Global Platform",
            status: (u.status || "ACTIVE").toUpperCase() as "ACTIVE" | "INACTIVE",
            institutionId: u.institutionId,
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : undefined,
          }))
        }
      } catch (err) {
        console.warn("Backend users unavailable:", err)
      }
      return []
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
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend query failed for applicants:", err)
      }
      return []
    },
  })

  const updateStageMutation = useMutation({
    mutationFn: async ({ applicantId, newStage }: { applicantId: string; newStage: any }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/applicants/${applicantId}/stage`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage: newStage }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update applicant stage")
      }
      return { applicantId, newStage }
    },
    onSuccess: ({ applicantId, newStage }) => {
      queryClient.setQueryData(["admissions"], (old: Applicant[] | undefined) => {
        if (!old) return []
        return old.map((app) => (app.id === applicantId ? { ...app, stage: newStage } : app))
      })
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
    },
  })

  const approveApplicantMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      const res = await fetch(`${API_BASE_URL}/admissions/applicants/${applicantId}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to approve applicant")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["enrollment-counts"] })
    },
  })

  const createApplicantMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admissions/applications`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create application")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
    },
  })

  const bulkImportApplicantsMutation = useMutation({
    mutationFn: async (payload: { applicants: any[]; academicYearId?: string }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/applicants/bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to bulk import applicants")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      queryClient.invalidateQueries({ queryKey: ["enrollment-counts"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
    },
  })

  return {
    ...query,
    updateStage: updateStageMutation.mutateAsync,
    approveApplicant: approveApplicantMutation.mutateAsync,
    createApplicant: createApplicantMutation.mutateAsync,
    bulkImportApplicants: bulkImportApplicantsMutation.mutateAsync,
  }
}

export function useAdmissionDocuments(filters?: { status?: string; search?: string }) {
  const queryClient = useQueryClient()
  const qParams = new URLSearchParams()
  if (filters?.status) qParams.set("status", filters.status)
  if (filters?.search) qParams.set("search", filters.search)

  const query = useQuery({
    queryKey: ["admission-documents", filters],
    queryFn: async (): Promise<AdmissionDocumentItem[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/admissions/documents?${qParams.toString()}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Failed to fetch admission documents:", err)
      }
      return []
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ documentId, status }: { documentId: string; status: "verified" | "rejected" | "pending" }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/documents/${documentId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update document status")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-documents"] })
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      queryClient.invalidateQueries({ queryKey: ["enrolled-applicants"] })
    },
  })

  const addDocumentMutation = useMutation({
    mutationFn: async ({ applicationId, documentType, storageKey, status }: { applicationId: string; documentType: string; storageKey?: string; status?: string }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/applications/${applicationId}/documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ documentType, storageKey, status: status || "pending" }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to attach document")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-documents"] })
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      queryClient.invalidateQueries({ queryKey: ["enrolled-applicants"] })
    },
  })

  return {
    ...query,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    addDocument: addDocumentMutation.mutateAsync,
    isAdding: addDocumentMutation.isPending,
  }
}

export function useEnrolledApplicants(filters?: { search?: string; classId?: string }) {
  const qParams = new URLSearchParams()
  if (filters?.search) qParams.set("search", filters.search)
  if (filters?.classId) qParams.set("classId", filters.classId)

  return useQuery({
    queryKey: ["enrolled-applicants", filters],
    queryFn: async (): Promise<EnrolledApplicantItem[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/admissions/enrolled?${qParams.toString()}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Failed to fetch enrolled applicants:", err)
      }
      return []
    },
  })
}

export function useEnquiries(filters?: { search?: string; status?: string }) {
  const queryClient = useQueryClient()
  const qParams = new URLSearchParams()
  if (filters?.search) qParams.set("search", filters.search)
  if (filters?.status) qParams.set("status", filters.status)

  const query = useQuery({
    queryKey: ["enquiries", filters],
    queryFn: async (): Promise<EnquiryItem[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/admissions/enquiries?${qParams.toString()}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Failed to fetch enquiries:", err)
      }
      return []
    },
  })

  const createEnquiryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/admissions/enquiries`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create enquiry")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] })
    },
  })

  const convertEnquiryMutation = useMutation({
    mutationFn: async ({ id, classId, academicYearId }: { id: string; classId: string; academicYearId: string }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/enquiries/${id}/convert`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ classId, academicYearId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to convert enquiry")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] })
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
    },
  })

  return {
    ...query,
    createEnquiry: createEnquiryMutation.mutateAsync,
    convertEnquiry: convertEnquiryMutation.mutateAsync,
  }
}

export function useStudents(filters: {
  search?: string
  classId?: string
  sectionId?: string
  status?: string
  ageMin?: number
  ageMax?: number
} = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set("search", filters.search)
  if (filters.classId) queryParams.set("classId", filters.classId)
  if (filters.sectionId) queryParams.set("sectionId", filters.sectionId)
  if (filters.status) queryParams.set("status", filters.status)
  if (filters.ageMin !== undefined) queryParams.set("ageMin", String(filters.ageMin))
  if (filters.ageMax !== undefined) queryParams.set("ageMax", String(filters.ageMax))

  return useQuery({
    queryKey: ["students", filters],
    queryFn: async (): Promise<StudentListItem[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/students?${queryParams.toString()}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Failed to fetch students list:", err)
      }
      return []
    },
  })
}

export function useStudentMaster(id?: string) {
  return useQuery({
    queryKey: ["student-master", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/students/${id}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      } catch (err) {
        console.warn(`Failed to fetch student master for ${id}:`, err)
      }
      return null
    },
  })
}

export function useEnrollmentCounts() {
  return useQuery({
    queryKey: ["enrollment-counts"],
    queryFn: async (): Promise<ClassEnrollmentCount[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/students/enrollment-counts`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Failed to fetch enrollment counts:", err)
      }
      return []
    },
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to enroll student")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["enrollment-counts"] })
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update student")
      }
      return json.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["student-master", variables.id] })
    },
  })
}

export function usePromoteStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; toClassId: string; toSectionId: string; academicYearId: string; decision?: string }) => {
      const res = await fetch(`${API_BASE_URL}/students/${id}/promote`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to promote student")
      }
      return json.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["student-master", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["enrollment-counts"] })
    },
  })
}

export function useBulkImportStudents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rows, academicYearId }: { rows: any[]; academicYearId: string }) => {
      const res = await fetch(`${API_BASE_URL}/students/bulk-import`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rows, academicYearId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to bulk import students")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["enrollment-counts"] })
    },
  })
}

export function useAcademics(academicYearId?: string) {
  return useQuery({
    queryKey: ["academics-hierarchy", academicYearId || "all"],
    queryFn: async (): Promise<AcademicGrade[]> => {
      try {
        const url = academicYearId
          ? `${API_BASE_URL}/academics/grades?academicYearId=${academicYearId}`
          : `${API_BASE_URL}/academics/grades`
        const res = await fetch(url, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend query failed for academic grades:", err)
      }
      return []
    },
  })
}

export function useFaculty() {
  return useQuery({
    queryKey: ["faculty-roster"],
    queryFn: async (): Promise<FacultyMember[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/faculty`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for faculty roster:", err)
      }
      return []
    },
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      phone?: string
      qualification?: string
      university?: string
      subjects?: string
      experience?: string
      address?: string
      email: string
      dateOfBirth?: string
      gender?: string
      designation?: string
      department?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/faculty`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add staff member")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-roster"] })
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
    },
  })
}

export function useBulkCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (staffList: any[]) => {
      const res = await fetch(`${API_BASE_URL}/faculty/bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ staff: staffList }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Bulk staff upload failed")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-roster"] })
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
    },
  })
}

export function useFacultyAccounts() {
  return useQuery({
    queryKey: ["faculty-accounts"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/faculty-accounts`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for faculty accounts:", err)
      }
      return []
    },
  })
}

export function useProvisionFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      staffId?: string
      name?: string
      email: string
      userId: string
      password: string
      role?: string
      workspaces?: string[]
    }) => {
      const res = await fetch(`${API_BASE_URL}/users/provision-faculty`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to provision faculty credentials")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["faculty-roster"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useMyClasses() {
  return useQuery({
    queryKey: ["faculty-my-classes"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/faculty`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data[0]
        }
      } catch (err) {
        console.warn("Backend unavailable for my-classes:", err)
      }
      return null
    },
  })
}

export function useFinance() {
  return useQuery({
    queryKey: ["finance-records"],
    queryFn: async (): Promise<FeeRecord[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/finance/records`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable, using mock fees:", err)
      }
      return []
    },
  })
}

export function useRoleTemplates() {
  return useQuery({
    queryKey: ["role-templates"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/role-templates`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for role-templates:", err)
      }
      return []
    },
  })
}

export function useProvisionUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name?: string
      email: string
      userId?: string
      roleTemplate?: string
      workspaces?: string[]
      password?: string
      institutionId?: string
      staffId?: string
      phone?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/users/provision`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to provision user")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["faculty-roster"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useBulkProvisionUsers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      users: Array<{
        name: string
        email: string
        userId?: string
        roleTemplate?: string
        workspaces?: string[]
        phone?: string
      }>
      institutionId?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/users/bulk-provision`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Bulk provisioning failed")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["faculty-roster"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useUpdateUserAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string
      roleTemplate?: string
      role?: string
      workspaces?: string[]
    }) => {
      const res = await fetch(`${API_BASE_URL}/users/${id}/access`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update user access")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useResetUserCredentials() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password?: string }) => {
      const res = await fetch(`${API_BASE_URL}/users/${id}/reset-credentials`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to reset credentials")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: "active" | "inactive" | "suspended"
    }) => {
      const res = await fetch(`${API_BASE_URL}/users/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update user status")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
    },
  })
}

export function useUserAudit(userId?: string) {
  return useQuery({
    queryKey: ["user-audit", userId],
    queryFn: async () => {
      if (!userId) return []
      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/audit`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for user audit:", err)
      }
      return []
    },
    enabled: Boolean(userId),
  })
}

// ========================================================
// HRMS HOOKS (Step 1B)
// ========================================================

export function useDesignations() {
  return useQuery({
    queryKey: ["hrms-designations"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hrms/designations`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for designations:", err)
      }
      return []
    },
  })
}

export function useCreateDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API_BASE_URL}/hrms/designations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create designation")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-designations"] })
    },
  })
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/hrms/designations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete designation")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-designations"] })
    },
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ["hrms-departments"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hrms/departments`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for departments:", err)
      }
      return []
    },
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; code: string; departmentType?: string }) => {
      const res = await fetch(`${API_BASE_URL}/hrms/departments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create department")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-departments"] })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/hrms/departments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete department")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-departments"] })
    },
  })
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["hrms-leave-types"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hrms/leaves/types`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for leave types:", err)
      }
      return []
    },
  })
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; maxDaysPerYear: number }) => {
      const res = await fetch(`${API_BASE_URL}/hrms/leaves/types`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create leave type")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-leave-types"] })
    },
  })
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["hrms-leave-requests"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hrms/leaves/requests`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for leave requests:", err)
      }
      return []
    },
  })
}

export function useApplyLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      staffId: string
      leaveTypeId: string
      startDate: string
      endDate: string
      reason: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/hrms/leaves/requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to submit leave request")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["hrms-reports-summary"] })
    },
  })
}

export function useActionLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      action,
      reviewNotes,
    }: {
      id: string
      action: "approved" | "rejected"
      reviewNotes?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/hrms/leaves/requests/${id}/action`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, reviewNotes }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to action leave request")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["hrms-reports-summary"] })
    },
  })
}

export function useStaffAttendance(date?: string) {
  return useQuery({
    queryKey: ["hrms-attendance", date],
    queryFn: async () => {
      try {
        const query = date ? `?date=${encodeURIComponent(date)}` : ""
        const res = await fetch(`${API_BASE_URL}/hrms/attendance${query}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for staff attendance:", err)
      }
      return []
    },
  })
}

export function useMarkAllStaffPresent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (date?: string) => {
      const res = await fetch(`${API_BASE_URL}/hrms/attendance/mark-all-present`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ date }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to mark all staff present")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-attendance"] })
    },
  })
}

export function useRecordStaffAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      staffId: string
      date: string
      status: "present" | "absent" | "half_day" | "on_leave"
      remarks?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/hrms/attendance`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to record attendance")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-attendance"] })
    },
  })
}

export function useHRReportSummary() {
  return useQuery({
    queryKey: ["hrms-reports-summary"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hrms/reports/summary`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for HR reports summary:", err)
      }
      return null
    },
  })
}

export async function checkDuplicateStaff(data: {
  email?: string
  phone?: string
  name?: string
  dateOfBirth?: string
}) {
  const res = await fetch(`${API_BASE_URL}/hrms/staff/check-duplicate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  return json.data || { isDuplicate: false, reasons: [], duplicateFields: [] }
}

export interface FacultyWorkloadItem {
  staff_id: string
  employee_code: string
  staff_name: string
  department_name: string | null
  designation_name: string | null
  qualification: string | null
  specialization: string | null
  periods_per_week: number
  sections_count: number
  is_overloaded: boolean
}

export function useFacultyWorkloads(academicYearId?: string) {
  const q = academicYearId ? `?academicYearId=${academicYearId}` : ""
  return useQuery({
    queryKey: ["hrms-faculty-workloads", academicYearId],
    queryFn: async (): Promise<FacultyWorkloadItem[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/hrms/workload${q}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Failed to fetch faculty workloads:", err)
      }
      return []
    },
  })
}

export function useComputeStaffWorkload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ staffId, academicYearId }: { staffId: string; academicYearId?: string }) => {
      const res = await fetch(`${API_BASE_URL}/hrms/workload/compute/${staffId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ academicYearId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to calculate workload")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrms-faculty-workloads"] })
      queryClient.invalidateQueries({ queryKey: ["faculty-roster"] })
    },
  })
}

// =========================================================================
// STEP 2: ACADEMICS & CURRICULUM HOOKS
// =========================================================================

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academics-years"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/academics/academic-years`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for academic years:", err)
      }
      return []
    },
  })
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean; status?: string }) => {
      const res = await fetch(`${API_BASE_URL}/academics/academic-years`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to create academic year")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-years"] })
    },
  })
}

export function useSetCurrentAcademicYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/academics/academic-years/${id}/set-current`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to set current year")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-years"] })
    },
  })
}

export function useCloseAcademicYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/academics/academic-years/${id}/close`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to close academic year")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-years"] })
    },
  })
}

export function useCloneAcademicYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sourceYearId, data }: { sourceYearId: string; data: { name: string; startDate: string; endDate: string; cloneClasses?: boolean; cloneSubjects?: boolean; cloneTextbooks?: boolean } }) => {
      const res = await fetch(`${API_BASE_URL}/academics/academic-years/${sourceYearId}/clone`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to clone academic year")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-years"] })
      queryClient.invalidateQueries({ queryKey: ["academics-classes"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useClasses(academicYearId?: string) {
  return useQuery({
    queryKey: ["academics-classes", academicYearId],
    queryFn: async () => {
      try {
        const url = academicYearId 
          ? `${API_BASE_URL}/academics/classes?academicYearId=${academicYearId}`
          : `${API_BASE_URL}/academics/classes`
        const res = await fetch(url, { headers: getAuthHeaders() })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for classes:", err)
      }
      return []
    },
  })
}

export function useGenerateClassMatrix() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      academicYearId: string
      departmentId: string
      gradeNames: string[]
      sectionNames: string[]
      defaultCapacity?: number
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes/matrix-generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to generate class matrix")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-classes"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      academicYearId?: string
      departmentId?: string
      sequenceOrder?: number
      initialSection?: string
      initialCapacity?: number
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to create class / grade")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-classes"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useUpdateClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; departmentId?: string; sequenceOrder?: number } }) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to update class / grade")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-classes"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to delete class / grade")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-classes"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useCreateSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ classId, data }: { classId: string; data: { name: string; capacity?: number; classTeacherStaffId?: string } }) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes/${classId}/sections`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to create section")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
      queryClient.invalidateQueries({ queryKey: ["academics-classes"] })
    },
  })
}

export function useSubjects() {
  return useQuery({
    queryKey: ["academics-subjects"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/academics/subjects`, { headers: getAuthHeaders() })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for subjects:", err)
      }
      return []
    },
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      code: string
      isElective?: boolean
      type?: string
      subjectType?: string
      syllabus?: string
      credits?: number
      departmentId?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/subjects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to create subject")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
      queryClient.invalidateQueries({ queryKey: ["grade-subjects"] })
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: string; 
      data: { 
        name?: string; 
        code?: string; 
        isElective?: boolean; 
        type?: string;
        subjectType?: string;
        syllabus?: string;
        credits?: number; 
        departmentId?: string | null; 
        isActive?: boolean 
      } 
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/subjects/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to update subject")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["grade-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/academics/subjects/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to delete subject")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academics-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["grade-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useGradeSubjects(classId?: string) {
  return useQuery({
    queryKey: ["grade-subjects", classId],
    queryFn: async () => {
      if (!classId) return []
      try {
        const res = await fetch(`${API_BASE_URL}/academics/classes/${classId}/grade-subjects`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for grade subjects:", err)
      }
      return []
    },
    enabled: !!classId,
  })
}

export function useMapSubjectToGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      classId: string
      subjectId: string
      periodsPerWeek?: number
      maxMarks?: number
      passMarks?: number
      isMandatory?: boolean
      type?: string
      subjectType?: string
      syllabus?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes/${data.classId}/grade-subjects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to map subject")
      return json.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grade-subjects", variables.classId] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
      queryClient.invalidateQueries({ queryKey: ["academics-subjects"] })
    },
  })
}

export function useRemoveSubjectFromGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ classId, subjectId }: { classId: string; subjectId: string }) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes/${classId}/grade-subjects/${subjectId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to remove subject")
      return json.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grade-subjects", variables.classId] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useCopySubjectMatrix() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sourceClassId, targetClassIds }: { sourceClassId: string; targetClassIds: string[] }) => {
      const res = await fetch(`${API_BASE_URL}/academics/classes/${sourceClassId}/grade-subjects/copy-to`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetClassIds }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to copy subject matrix")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-subjects"] })
      queryClient.invalidateQueries({ queryKey: ["academics-hierarchy"] })
    },
  })
}

export function useExamEstimates(academicYearId?: string, classId?: string) {
  return useQuery({
    queryKey: ["exam-estimates", academicYearId, classId],
    queryFn: async () => {
      if (!academicYearId) return []
      try {
        let url = `${API_BASE_URL}/academics/exam-estimates?academicYearId=${academicYearId}`
        if (classId) url += `&classId=${classId}`
        const res = await fetch(url, { headers: getAuthHeaders() })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for exam estimates:", err)
      }
      return []
    },
    enabled: !!academicYearId,
  })
}

export function useCreateExamEstimate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      academicYearId: string
      classId?: string
      termName: string
      startDate: string
      endDate: string
      description?: string
      status?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/exam-estimates`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to create exam estimate")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-estimates"] })
    },
  })
}

export function useCalendarConfig(academicYearId?: string) {
  return useQuery({
    queryKey: ["calendar-config", academicYearId],
    queryFn: async () => {
      if (!academicYearId) return { working_days_of_week: [1, 2, 3, 4, 5] }
      try {
        const res = await fetch(`${API_BASE_URL}/academics/calendar-config?academicYearId=${academicYearId}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for calendar config:", err)
      }
      return { working_days_of_week: [1, 2, 3, 4, 5] }
    },
    enabled: !!academicYearId,
  })
}

export function useSaveCalendarConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { academicYearId: string; workingDaysOfWeek: number[] }) => {
      const res = await fetch(`${API_BASE_URL}/academics/calendar-config`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to save calendar config")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-config"] })
      queryClient.invalidateQueries({ queryKey: ["working-days-count"] })
    },
  })
}

export function useCalendarDays(academicYearId?: string) {
  return useQuery({
    queryKey: ["calendar-days", academicYearId],
    queryFn: async () => {
      if (!academicYearId) return []
      try {
        const res = await fetch(`${API_BASE_URL}/academics/calendar-days?academicYearId=${academicYearId}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for calendar days:", err)
      }
      return []
    },
    enabled: !!academicYearId,
  })
}

export function useCreateCalendarDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      academicYearId: string
      date: string
      dayType: string
      description?: string
      isWorkingDay?: boolean
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/calendar-days`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to add calendar day")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-days"] })
      queryClient.invalidateQueries({ queryKey: ["working-days-count"] })
    },
  })
}

export function useDeleteCalendarDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/academics/calendar-days/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to delete calendar day")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-days"] })
      queryClient.invalidateQueries({ queryKey: ["working-days-count"] })
    },
  })
}

export function useWorkingDaysCount(academicYearId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["working-days-count", academicYearId, startDate, endDate],
    queryFn: async () => {
      if (!academicYearId) return null
      try {
        let url = `${API_BASE_URL}/academics/working-days/count?academicYearId=${academicYearId}`
        if (startDate) url += `&startDate=${startDate}`
        if (endDate) url += `&endDate=${endDate}`
        const res = await fetch(url, { headers: getAuthHeaders() })
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for working days count:", err)
      }
      return null
    },
    enabled: !!academicYearId,
  })
}

export function useTextbooks(academicYearId?: string, classId?: string) {
  return useQuery({
    queryKey: ["preferred-textbooks", academicYearId, classId],
    queryFn: async () => {
      if (!academicYearId) return []
      try {
        let url = `${API_BASE_URL}/academics/textbooks?academicYearId=${academicYearId}`
        if (classId) url += `&classId=${classId}`
        const res = await fetch(url, { headers: getAuthHeaders() })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for preferred textbooks:", err)
      }
      return []
    },
    enabled: !!academicYearId,
  })
}

export function useCreateTextbook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      academicYearId: string
      classId: string
      subjectId?: string
      subjectName?: string
      subject?: string
      title: string
      author: string
      publisher: string
      edition?: string
      isbn?: string
      price?: number
      isMandatory?: boolean
      notes?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/textbooks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to create textbook")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferred-textbooks"] })
      queryClient.invalidateQueries({ queryKey: ["preferred-booklist"] })
    },
  })
}

export function useDeleteTextbook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/academics/textbooks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to delete textbook")
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferred-textbooks"] })
      queryClient.invalidateQueries({ queryKey: ["preferred-booklist"] })
    },
  })
}

export function useBooklist(academicYearId?: string, classId?: string) {
  return useQuery({
    queryKey: ["preferred-booklist", academicYearId, classId],
    queryFn: async () => {
      if (!academicYearId || !classId) return null
      try {
        const res = await fetch(`${API_BASE_URL}/academics/textbooks/booklist?academicYearId=${academicYearId}&classId=${classId}`, {
          headers: getAuthHeaders(),
        })
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      } catch (err) {
        console.warn("Backend unavailable for booklist:", err)
      }
      return null
    },
    enabled: !!academicYearId && !!classId,
  })
}



