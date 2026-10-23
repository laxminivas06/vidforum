"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { API_BASE_URL, getAuthHeaders } from "./hooks"

export interface FeeHeadComponent {
  id?: string
  componentName: string
  amount: number
}

export interface AcademicFeeStructure {
  id: string
  institution_id: string
  academic_year_id: string
  academic_year_name: string
  academic_configuration_id: string
  class_id: string
  class_name: string
  class_sequence: number
  board_id: string
  board_code: string
  board_name: string
  stream_id?: string | null
  stream_code: string
  stream_name: string
  tuition_fee: number
  other_fees: number
  total_fee: number
  status: "active" | "draft" | "archived"
  components: FeeHeadComponent[]
  created_at: string
  updated_at: string
}

export function useAcademicFeeStructures(filters?: {
  academicYearId?: string
  classId?: string
  boardId?: string
  streamId?: string
  status?: string
}) {
  return useQuery({
    queryKey: ["academic-fee-structures", filters],
    queryFn: async (): Promise<AcademicFeeStructure[]> => {
      const params = new URLSearchParams()
      if (filters?.academicYearId) params.append("academicYearId", filters.academicYearId)
      if (filters?.classId && filters.classId !== "all") params.append("classId", filters.classId)
      if (filters?.boardId && filters.boardId !== "all") params.append("boardId", filters.boardId)
      if (filters?.streamId && filters.streamId !== "all") params.append("streamId", filters.streamId)
      if (filters?.status && filters.status !== "all") params.append("status", filters.status)

      const res = await fetch(`${API_BASE_URL}/finance/academic-fees?${params.toString()}`, {
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

export function useAcademicFeeStructureById(id?: string) {
  return useQuery({
    queryKey: ["academic-fee-structure", id],
    enabled: !!id,
    queryFn: async (): Promise<AcademicFeeStructure | null> => {
      const res = await fetch(`${API_BASE_URL}/finance/academic-fees/${id}`, {
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (json.success && json.data) {
        return json.data
      }
      return null
    },
  })
}

export function useSaveAcademicFeeStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      academicYearId: string
      academicConfigurationId: string
      tuitionFee: number
      components: FeeHeadComponent[]
      status?: "active" | "draft" | "archived"
    }) => {
      const res = await fetch(`${API_BASE_URL}/finance/academic-fees`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to save academic fee structure")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-fee-structures"] })
    },
  })
}
