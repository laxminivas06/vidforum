"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { API_BASE_URL, getAuthHeaders } from "./hooks"

export interface AcademicBoard {
  id: string
  institution_id: string
  code: string
  name: string
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AcademicStream {
  id: string
  institution_id: string
  code: string
  name: string
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AcademicConfiguration {
  id: string
  institution_id: string
  academic_year_id: string
  academic_year_name: string
  class_id: string
  class_name: string
  class_sequence: number
  display_order: number
  board_id: string
  board_code: string
  board_name: string
  stream_id?: string | null
  stream_code: string
  stream_name: string
  is_active: boolean
  section_count: number
  requires_exam?: boolean
  created_at: string
  updated_at: string
}

// 1. Boards
export function useAcademicBoards() {
  return useQuery({
    queryKey: ["academic-boards"],
    queryFn: async (): Promise<AcademicBoard[]> => {
      const res = await fetch(`${API_BASE_URL}/academics/boards`, {
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
      return []
    },
  })
}

export function useCreateAcademicBoard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { code: string; name: string; description?: string }) => {
      const res = await fetch(`${API_BASE_URL}/academics/boards`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to create academic board")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-boards"] })
      queryClient.invalidateQueries({ queryKey: ["academic-configurations"] })
    },
  })
}

// 2. Streams
export function useAcademicStreams() {
  return useQuery({
    queryKey: ["academic-streams"],
    queryFn: async (): Promise<AcademicStream[]> => {
      const res = await fetch(`${API_BASE_URL}/academics/streams`, {
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
      return []
    },
  })
}

export function useCreateAcademicStream() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { code: string; name: string; description?: string }) => {
      const res = await fetch(`${API_BASE_URL}/academics/streams`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to create academic stream")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-streams"] })
      queryClient.invalidateQueries({ queryKey: ["academic-configurations"] })
    },
  })
}

// 3. Configurations
export function useAcademicConfigurations(academicYearId?: string) {
  return useQuery({
    queryKey: ["academic-configurations", academicYearId],
    queryFn: async (): Promise<AcademicConfiguration[]> => {
      const url = academicYearId
        ? `${API_BASE_URL}/academics/configurations?academicYearId=${encodeURIComponent(academicYearId)}`
        : `${API_BASE_URL}/academics/configurations`
      const res = await fetch(url, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
      return []
    },
  })
}

export function useCreateAcademicConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      academicYearId: string
      classId: string
      boardId: string
      streamId?: string | null
      displayOrder?: number
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/configurations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to save configuration")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-configurations"] })
      queryClient.invalidateQueries({ queryKey: ["admission-configurations"] })
    },
  })
}

export function useUpdateAcademicConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; displayOrder?: number; isActive?: boolean }) => {
      const res = await fetch(`${API_BASE_URL}/academics/configurations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to update configuration")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-configurations"] })
    },
  })
}

export function useDeleteAcademicConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/academics/configurations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to deactivate configuration")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-configurations"] })
    },
  })
}

// 4. Custom Grade
export function useCreateCustomGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      academicYearId: string
      boardId: string
      streamId?: string | null
      displayOrder?: number
      optionalSections?: string[]
    }) => {
      const res = await fetch(`${API_BASE_URL}/academics/custom-grade`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to create custom grade")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-configurations"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["hierarchy"] })
    },
  })
}
