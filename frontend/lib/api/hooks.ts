"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Institution, Applicant, AcademicGrade, FacultyMember, FeeRecord } from "@/types"

// Mock Institutions (Dummy institutions removed per Super Admin directive)
const MOCK_INSTITUTIONS: Institution[] = []

// Mock Applicants for Admissions Kanban (Mock data removed)
const MOCK_APPLICANTS: Applicant[] = []

// Mock Academic Grades & Hierarchy (Mock data removed)
const MOCK_GRADES: AcademicGrade[] = []

// Mock Faculty Roster (Mock data removed)
const MOCK_FACULTY: FacultyMember[] = []

// Mock Fee Records (Mock data removed)
const MOCK_FEES: FeeRecord[] = []

// --- TanStack Query Hooks (Live Backend with Database Persistence) ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"
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
    onSuccess: (updatedInst) => {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("vid_custom_institutions")
          if (raw) {
            const current = JSON.parse(raw)
            const updated = current.map((i: any) =>
              i.id === updatedInst.id || i.code === updatedInst.code
                ? { ...i, status: updatedInst.status }
                : i
            )
            localStorage.setItem("vid_custom_institutions", JSON.stringify(updated))
          }
        } catch (e) {
          // ignore
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
          const raw = localStorage.getItem("vid_institute_admins")
          if (raw) {
            const list = JSON.parse(raw)
            const updated = list.map((a: any) => {
              if (
                a.id === variables.adminId ||
                a.userId?.toLowerCase() === variables.adminId.toLowerCase() ||
                a.email?.toLowerCase() === variables.adminId.toLowerCase()
              ) {
                return { ...a, workspaces: variables.workspaces }
              }
              return a
            })
            localStorage.setItem("vid_institute_admins", JSON.stringify(updated))
          }

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
          console.warn("Failed to update local storage for workspaces", e)
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

