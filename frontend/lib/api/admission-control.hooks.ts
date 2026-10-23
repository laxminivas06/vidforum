"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { API_BASE_URL, getAuthHeaders } from "./hooks"

export interface AdmissionConfiguration {
  id: string
  institution_id: string
  academic_configuration_id: string
  requires_exam: boolean
  examination_name?: string | null
  max_marks: number
  passing_marks: number
  cutoff_marks: number
  exam_date?: string | null
  status: string
  display_order: number
  academic_year_id: string
  academic_year_name: string
  class_name: string
  class_sequence: number
  board_code: string
  board_name: string
  stream_code: string
  stream_name: string
}

export interface AdmissionFeePolicy {
  id: string
  institution_id: string
  academic_year_id: string
  policy_type: "fee" | "no_fee"
  pricing_method: "same_for_all" | "customized"
  flat_amount: number
  effective_from?: string | null
  effective_to?: string | null
  is_active: boolean
}

export interface CustomFeeRate {
  id: string
  policy_id: string
  academic_configuration_id: string
  amount: number
  class_name: string
  board_code: string
  stream_name: string
  academic_year_name: string
}

export interface TemporaryAdmission {
  id: string
  temporary_admission_number: string
  student_name: string
  contact_number: string
  parent_name: string
  email?: string | null
  date_of_birth?: string | null
  gender?: string | null
  preliminary_address?: string | null
  academic_year_id: string
  academic_year_name: string
  academic_configuration_id: string
  class_name: string
  board_code: string
  stream_name: string
  admission_config_id?: string | null
  examination_name?: string | null
  config_cutoff_marks?: number | null
  config_passing_marks?: number | null
  status: "pending" | "exam_scheduled" | "qualified" | "not_qualified" | "approved" | "rejected" | "converted_to_permanent"
  created_at: string
  exam_result_id?: string | null
  marks_obtained?: number | null
  max_marks?: number | null
  passing_marks?: number | null
  cutoff_marks?: number | null
  result_status?: "pending" | "qualified" | "not_qualified" | null
  admin_review_status?: "pending" | "approved" | "rejected" | null
  reviewed_at?: string | null
}

export interface PermanentAdmissionItem {
  id: string
  permanent_admission_number: string
  temporary_admission_id?: string | null
  temporary_admission_number?: string | null
  student_id: string
  student_name: string
  date_of_birth: string
  gender: string
  photo_url?: string | null
  aadhaar_number?: string | null
  class_name: string
  board_code: string
  stream_name: string
  academic_year_name: string
  admission_fee_amount: number
  fee_payment_status: "pending" | "verified" | "waived" | "not_applicable"
  enrollment_status: string
  created_at: string
  payment_id?: string | null
  payment_amount?: number | null
  payment_mode?: string | null
  payment_status?: string | null
  utr_reference_number?: string | null
}

export interface PaymentRecord {
  id: string
  permanent_admission_id: string
  permanent_admission_number: string
  student_id: string
  student_name: string
  amount: number
  payment_mode: "cash" | "upi" | "card" | "other"
  payment_status: "pending_verification" | "verified" | "failed"
  utr_reference_number?: string | null
  gateway_reference_id?: string | null
  payment_date: string
  payment_time: string
  upi_provider?: string | null
  collected_by?: string | null
  collected_datetime?: string | null
  notes?: string | null
  audit_trail: any[]
  created_at: string
}

export interface SupportingDocument {
  id: string
  institution_id: string
  student_id: string
  student_name: string
  admission_number: string
  document_type: string
  document_name: string
  file_storage_key?: string | null
  file_url?: string | null
  file_size?: number | null
  file_mime?: string | null
  aadhaar_last4?: string | null
  verification_status: "pending" | "verified" | "rejected"
  uploaded_by?: string | null
  verified_by?: string | null
  verified_at?: string | null
  created_at: string
}

// 1. Admission Configurations
export function useAdmissionConfigurations(academicYearId?: string) {
  return useQuery({
    queryKey: ["admission-configurations", academicYearId],
    queryFn: async (): Promise<AdmissionConfiguration[]> => {
      const url = academicYearId
        ? `${API_BASE_URL}/admissions/configurations?academicYearId=${encodeURIComponent(academicYearId)}`
        : `${API_BASE_URL}/admissions/configurations`
      const res = await fetch(url, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
      return []
    },
  })
}

export function useSaveAdmissionConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      academicConfigurationId: string
      requiresExam: boolean
      examinationName?: string
      maxMarks?: number
      passingMarks?: number
      cutoffMarks?: number
      examDate?: string
      status?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/configurations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to save admission rule")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-configurations"] })
    },
  })
}

// 2. Admission Fees Policy
export function useAdmissionFeePolicy(academicYearId?: string) {
  return useQuery({
    queryKey: ["admission-fee-policy", academicYearId],
    enabled: !!academicYearId,
    queryFn: async (): Promise<AdmissionFeePolicy | null> => {
      const res = await fetch(
        `${API_BASE_URL}/admissions/fees/policy?academicYearId=${encodeURIComponent(academicYearId!)}`,
        { headers: getAuthHeaders() }
      )
      const json = await res.json()
      if (json.success && json.data) {
        return json.data
      }
      return null
    },
  })
}

export function useSaveAdmissionFeePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      academicYearId: string
      policyType: "fee" | "no_fee"
      pricingMethod: "same_for_all" | "customized"
      flatAmount: number
      effectiveFrom?: string
      effectiveTo?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/fees/policy`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to save fee policy")
      }
      return json.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admission-fee-policy", variables.academicYearId] })
    },
  })
}

export function useCustomFeeRates(policyId?: string) {
  return useQuery({
    queryKey: ["admission-fee-custom-rates", policyId],
    enabled: !!policyId,
    queryFn: async (): Promise<CustomFeeRate[]> => {
      const res = await fetch(
        `${API_BASE_URL}/admissions/fees/custom-rates?policyId=${encodeURIComponent(policyId!)}`,
        { headers: getAuthHeaders() }
      )
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
      return []
    },
  })
}

export function useSaveCustomFeeRates() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      policyId: string
      rates: Array<{ academicConfigurationId: string; amount: number }>
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/fees/custom-rates`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to save custom rates")
      }
      return json.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admission-fee-custom-rates", variables.policyId] })
    },
  })
}

// 3. Temporary Admissions
export function useTemporaryAdmissions(filters?: { search?: string; status?: string; academicYearId?: string }) {
  return useQuery({
    queryKey: ["temporary-admissions", filters],
    queryFn: async (): Promise<TemporaryAdmission[]> => {
      const params = new URLSearchParams()
      if (filters?.search) params.append("search", filters.search)
      if (filters?.status && filters.status !== "all") params.append("status", filters.status)
      if (filters?.academicYearId) params.append("academicYearId", filters.academicYearId)

      const res = await fetch(`${API_BASE_URL}/admissions/temporary?${params.toString()}`, {
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

export function useCreateTemporaryAdmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      studentName: string
      contactNumber: string
      parentName: string
      email?: string
      dateOfBirth?: string
      gender?: string
      preliminaryAddress?: string
      academicYearId: string
      academicConfigurationId: string
      admissionConfigId?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/temporary`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to create temporary admission")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temporary-admissions"] })
    },
  })
}

export function useBulkRecordExamResults() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      marks: Array<{ temporaryId: string; marksObtained: number }>
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/temporary/bulk-marks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to record bulk exam marks")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temporary-admissions"] })
    },
  })
}

export function useRecordExamResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: string
      examName: string
      maxMarks: number
      marksObtained: number
      passingMarks: number
      cutoffMarks: number
      notes?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/temporary/${id}/result`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to record exam result")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temporary-admissions"] })
    },
  })
}

export function useReviewExamResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: "approved" | "rejected"; notes?: string }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/temporary/${id}/review`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, notes }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to review exam result")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temporary-admissions"] })
    },
  })
}

// 4. Permanent Admissions
export function useNextPermanentAdmissionNumber() {
  return useQuery({
    queryKey: ["next-permanent-admission-number"],
    queryFn: async (): Promise<string> => {
      const res = await fetch(`${API_BASE_URL}/admissions/permanent/next-number`, {
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (json.success && json.data?.permanentAdmissionNumber) {
        return json.data.permanentAdmissionNumber
      }
      return "ADM-2026-0001"
    },
  })
}

export function useCompletePermanentAdmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_BASE_URL}/admissions/permanent/complete`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to enroll permanent admission")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permanent-admissions"] })
      queryClient.invalidateQueries({ queryKey: ["temporary-admissions"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["admission-payments"] })
    },
  })
}

export const useCreatePermanentAdmission = useCompletePermanentAdmission

export function usePermanentAdmissions(filters?: { search?: string; academicYearId?: string }) {
  return useQuery({
    queryKey: ["permanent-admissions", filters],
    queryFn: async (): Promise<PermanentAdmissionItem[]> => {
      const params = new URLSearchParams()
      if (filters?.search) params.append("search", filters.search)
      if (filters?.academicYearId) params.append("academicYearId", filters.academicYearId)

      const res = await fetch(`${API_BASE_URL}/admissions/permanent?${params.toString()}`, {
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

// 5. Payments
export function useAdmissionPayments(filters?: { search?: string; paymentMode?: string }) {
  return useQuery({
    queryKey: ["admission-payments", filters],
    queryFn: async (): Promise<PaymentRecord[]> => {
      const params = new URLSearchParams()
      if (filters?.search) params.append("search", filters.search)
      if (filters?.paymentMode && filters.paymentMode !== "all") params.append("paymentMode", filters.paymentMode)

      const res = await fetch(`${API_BASE_URL}/admissions/payments?${params.toString()}`, {
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

export function useVerifyAdmissionPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "failed" }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/payments/${id}/verify`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to verify payment")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-payments"] })
      queryClient.invalidateQueries({ queryKey: ["permanent-admissions"] })
    },
  })
}

export const usePaymentRecords = useAdmissionPayments
export const useVerifyPayment = useVerifyAdmissionPayment

// 6. Supporting Documents
export function useSupportingDocuments(studentId?: string) {
  return useQuery({
    queryKey: ["supporting-documents", studentId],
    queryFn: async (): Promise<SupportingDocument[]> => {
      const url = studentId
        ? `${API_BASE_URL}/admissions/supporting-documents?studentId=${encodeURIComponent(studentId)}`
        : `${API_BASE_URL}/admissions/supporting-documents`
      const res = await fetch(url, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
      return []
    },
  })
}

export function useUploadSupportingDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      studentId: string
      documentType: string
      documentName: string
      fileStorageKey?: string
      fileUrl?: string
      fileSize?: number
      fileMime?: string
      aadhaarNumber?: string
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/supporting-documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to upload document")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supporting-documents"] })
    },
  })
}

export function useVerifySupportingDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/supporting-documents/${id}/verify`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to verify document")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supporting-documents"] })
    },
  })
}

// =========================================================================
// INSTITUTE SETTINGS / SYSTEM CONFIGURATION (FOUNDATIONAL RULES)
// =========================================================================

export interface AdmissionInfoSettings {
  hasExamination: boolean
  examTotalMarks: number
  passMarks: number
}

export interface CustomGradeFee {
  gradeId: string
  gradeName: string
  amount: number
}

export interface AdmissionFeesSettings {
  isApplicable: boolean
  pricingMethod: "SAME_FOR_ALL" | "CUSTOM"
  baseAmount: number | null
  customGradeFees: CustomGradeFee[]
}

export interface AcademicFeesSettings {
  pricingMethod: "SAME_FOR_ALL" | "CUSTOM"
  baseAmount: number | null
  customGradeFees: CustomGradeFee[]
}

export interface PaymentQrCode {
  id: string
  provider: "PhonePe" | "Google Pay" | "Paytm" | "Unified UPI" | string
  upiId?: string
  qrImageUrl: string
  isDefault?: boolean
}

export interface PaymentSettings {
  isConfigured: boolean
  accountName?: string
  upiId?: string
  qrCodes: PaymentQrCode[]
  updatedAt?: string
}

export interface InstituteSystemSettings {
  admissionInfo: AdmissionInfoSettings
  admissionFees: AdmissionFeesSettings
  academicFees: AcademicFeesSettings
  paymentSettings?: PaymentSettings
}

export interface AvailableGrade {
  id: string
  name: string
  sequence: number
}

export interface SystemSettingsResponse {
  systemConfiguration: InstituteSystemSettings
  availableGrades: AvailableGrade[]
}

export function useInstituteSystemSettings() {
  return useQuery({
    queryKey: ["institute-system-settings"],
    queryFn: async (): Promise<SystemSettingsResponse> => {
      const res = await fetch(`${API_BASE_URL}/admissions/system-settings`, {
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (json.success && json.data) {
        return json.data
      }
      throw new Error(json.error || json.message || "Failed to load system settings")
    },
  })
}

export function useSaveInstituteSystemSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      section?: "admissionInfo" | "admissionFees" | "academicFees" | "paymentSettings"
      admissionInfo?: AdmissionInfoSettings
      admissionFees?: AdmissionFeesSettings
      academicFees?: AcademicFeesSettings
      paymentSettings?: PaymentSettings
    }) => {
      const res = await fetch(`${API_BASE_URL}/admissions/system-settings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to save system settings")
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute-system-settings"] })
      queryClient.invalidateQueries({ queryKey: ["admission-configurations"] })
      queryClient.invalidateQueries({ queryKey: ["admission-fee-policy"] })
      queryClient.invalidateQueries({ queryKey: ["admission-fee-custom-rates"] })
      queryClient.invalidateQueries({ queryKey: ["academic-fee-structures"] })
    },
  })
}

