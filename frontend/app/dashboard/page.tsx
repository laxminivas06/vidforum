"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { AppShell } from "@/components/layout/AppShell"
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SpotHeroPanel,
  Button,
  Badge,
  Table,
  TableColumn,
  ConfirmDialog,
  FormField,
  Input,
  Select,
  SelectOption,
} from "@/components/ui"
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
  Plus,
  Send,
  Building2,
  Cpu,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  UserPlus,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Settings,
  Layers,
  Package,
  Key,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  X,
  Search,
  Lock,
  AlertCircle,
  CheckSquare,
  Square,
  History,
  Shield,
  UserX,
  UserCheck,
  FileSpreadsheet as FileSpreadsheetIcon,
} from "lucide-react"
import {
  useInstitutions,
  useAdmissions,
  useFinance,
  useFaculty,
  useFacultyAccounts,
  useProvisionFaculty,
  useRoleTemplates,
  useProvisionUser,
  useResetUserCredentials,
  useUpdateUserStatus,
} from "@/lib/api/hooks"
import { EditUserAccessModal, BulkProvisionModal, UserAuditModal } from "@/components/users"
import { Institution, Applicant } from "@/types"
import { PLATFORM_WORKSPACES } from "@/config/workspaces"

const DEFAULT_FACULTY_WORKSPACES = [
  "faculty",
  "academics",
  "attendance",
  "examinations",
  "timetable",
]

const WORKSPACE_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard: GraduationCap,
  UserPlus,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  CreditCard,
  FileText,
  Briefcase,
  Clock,
  Settings,
  Building2,
  Package,
  Layers,
  ShieldCheck,
}

export default function DashboardPage() {
  const { role } = useAuth()

  if (role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />
  }

  if (role === "INSTITUTION_ADMIN") {
    return <InstitutionAdminDashboard />
  }

  if (typeof window !== "undefined") {
    if (role === "FACULTY") {
      window.location.href = "/faculty/dashboard"
      return null
    }
    if (role === "STUDENT" || role === "PARENT") {
      window.location.href = "/students/cccccccc-cccc-cccc-cccc-cccccccccc01"
      return null
    }
    if (role === "ADMISSION_TEAM") {
      window.location.href = "/admissions"
      return null
    }
    if (role === "FINANCE_TEAM") {
      window.location.href = "/finance/dashboard"
      return null
    }
    if (role === "EXAM_TEAM") {
      window.location.href = "/examinations/schedules"
      return null
    }
    if (role === "ACADEMIC_COORDINATOR") {
      window.location.href = "/academics/hierarchy"
      return null
    }
  }

  return <InstitutionAdminDashboard />
}

// ─────────────────────────────────────────────────────────────
// 1. INSTITUTION ADMIN WORKSPACE (Replaces Executive Workspace Hub)
// ─────────────────────────────────────────────────────────────
function InstitutionAdminDashboard() {
  const { institutionName } = useAuth()
  const { data: applicants, isLoading: appsLoading } = useAdmissions()
  const { data: fees } = useFinance()
  const { data: facultyAccounts = [], isLoading: accountsLoading } = useFacultyAccounts()
  const { data: staffList = [] } = useFaculty()
  const { data: roleTemplates = [] } = useRoleTemplates()
  const provisionMutation = useProvisionFaculty()
  const provisionUserMutation = useProvisionUser()
  const resetCredentialsMutation = useResetUserCredentials()
  const updateStatusMutation = useUpdateUserStatus()

  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string>("")

  // Check URL query param ?tab=users on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("tab") === "users") {
        setActiveTab("users")
      }
    }
  }, [])

  // Faculty & User Accounts State
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [accountFilter, setAccountFilter] = useState<"ALL" | "CREDENTIALS_SET" | "PENDING">("ALL")
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [provisionName, setProvisionName] = useState("")
  const [provisionEmail, setProvisionEmail] = useState("")
  const [provisionUserId, setProvisionUserId] = useState("")
  const [provisionPassword, setProvisionPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRoleTemplate, setSelectedRoleTemplate] = useState<string>("TEACHER")
  const [provisionError, setProvisionError] = useState<string | null>(null)
  const [provisionSuccessData, setProvisionSuccessData] = useState<any | null>(null)
  const [copySuccessToast, setCopySuccessToast] = useState<string | null>(null)
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(DEFAULT_FACULTY_WORKSPACES)

  // Additional Action Modals State
  const [isBulkProvisionModalOpen, setIsBulkProvisionModalOpen] = useState(false)
  const [isEditAccessModalOpen, setIsEditAccessModalOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<any | null>(null)

  const handleRoleTemplateChange = (tplKey: string) => {
    setSelectedRoleTemplate(tplKey)
    const tpl = roleTemplates.find((t: any) => t.key === tplKey)
    if (tpl && Array.isArray(tpl.defaultWorkspaces) && tpl.defaultWorkspaces.length > 0) {
      setSelectedWorkspaces(tpl.defaultWorkspaces)
    }
  }

  const handleToggleWorkspace = (wsId: string) => {
    setSelectedWorkspaces((prev) =>
      prev.includes(wsId) ? prev.filter((id) => id !== wsId) : [...prev, wsId]
    )
  }

  const handleSelectAllWorkspaces = () => {
    setSelectedWorkspaces(PLATFORM_WORKSPACES.map((w) => w.id))
  }

  const handleDeselectAllWorkspaces = () => {
    setSelectedWorkspaces([])
  }

  const handleFacultyPresetWorkspaces = () => {
    setSelectedWorkspaces(DEFAULT_FACULTY_WORKSPACES)
  }

  // Filtered Faculty Accounts
  const filteredAccounts = facultyAccounts.filter((acc: any) => {
    // Filter by credentials status
    if (accountFilter === "CREDENTIALS_SET" && !acc.hasCredentials) return false
    if (accountFilter === "PENDING" && acc.hasCredentials) return false

    // Search query
    if (!userSearchQuery.trim()) return true
    const q = userSearchQuery.toLowerCase()
    return (
      acc.name?.toLowerCase().includes(q) ||
      acc.email?.toLowerCase().includes(q) ||
      acc.employeeCode?.toLowerCase().includes(q) ||
      acc.userId?.toLowerCase().includes(q) ||
      acc.subjects?.toLowerCase().includes(q) ||
      acc.roleTemplate?.toLowerCase().includes(q)
    )
  })

  // Pre-fill fields when selecting a staff member from roster
  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffId(staffId)
    const found = staffList.find((s) => s.id === staffId) || facultyAccounts.find((a: any) => a.staffId === staffId)
    if (found) {
      setProvisionName(found.name || "")
      setProvisionEmail(found.email || "")
      const suggestedUserId = found.employeeCode
        ? found.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, "")
        : (found.email.split("@")[0] || `user_${Date.now()}`)
      setProvisionUserId(suggestedUserId)
      if (!provisionPassword) {
        generateRandomPassword()
      }
      if (found.roleTemplate) {
        setSelectedRoleTemplate(found.roleTemplate)
      }
      if (found.assignedWorkspaces && Array.isArray(found.assignedWorkspaces) && found.assignedWorkspaces.length > 0) {
        setSelectedWorkspaces(found.assignedWorkspaces)
      } else {
        setSelectedWorkspaces(DEFAULT_FACULTY_WORKSPACES)
      }
    }
  }

  // Generate a clean secure memorable password
  const generateRandomPassword = () => {
    const specials = ["@", "!", "#", "$"]
    const special = specials[Math.floor(Math.random() * specials.length)]
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const generated = `VidSecure${special}${randomNum}`
    setProvisionPassword(generated)
    return generated
  }

  // Submit Provisioning Form
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provisionEmail.trim()) {
      setProvisionError("Email address is required")
      return
    }
    const finalPassword = provisionPassword.trim() || generateRandomPassword()

    try {
      setProvisionError(null)
      const result = await provisionUserMutation.mutateAsync({
        staffId: selectedStaffId || undefined,
        name: provisionName.trim() || undefined,
        email: provisionEmail.trim().toLowerCase(),
        userId: provisionUserId.trim() || provisionEmail.trim().toLowerCase(),
        password: finalPassword,
        roleTemplate: selectedRoleTemplate,
        workspaces: selectedWorkspaces,
      })

      setProvisionSuccessData({
        name: provisionName || result.name,
        email: provisionEmail,
        userId: provisionUserId || result.userId,
        password: finalPassword,
        roleTemplate: result.roleTemplate || selectedRoleTemplate,
        workspaces: selectedWorkspaces,
        loginUrl: typeof window !== "undefined" ? `${window.location.origin}/login` : "/login",
      })

      // Reset modal inputs
      setSelectedStaffId("")
      setProvisionName("")
      setProvisionEmail("")
      setProvisionUserId("")
      setProvisionPassword("")
      setSelectedRoleTemplate("TEACHER")
      setSelectedWorkspaces(DEFAULT_FACULTY_WORKSPACES)
    } catch (err: any) {
      setProvisionError(err.message || "Failed to provision user credentials")
    }
  }

  // Direct Credential Reset Handler
  const handleDirectResetCredentials = async (account: any) => {
    try {
      const res = await resetCredentialsMutation.mutateAsync({
        id: account.profileId || account.id,
      })
      setProvisionSuccessData({
        name: account.name,
        email: account.email,
        userId: account.userId || account.email,
        password: res.initialPassword,
        roleTemplate: account.roleTemplate || "TEACHER",
        workspaces: account.assignedWorkspaces || DEFAULT_FACULTY_WORKSPACES,
        loginUrl: typeof window !== "undefined" ? `${window.location.origin}/login` : "/login",
      })
      setIsProvisionModalOpen(true)
      setCopySuccessToast(`Credentials reset! Temporary password generated for ${account.name}.`)
      setTimeout(() => setCopySuccessToast(null), 4000)
    } catch (err: any) {
      setCopySuccessToast(`Error: ${err.message || "Failed to reset credentials"}`)
      setTimeout(() => setCopySuccessToast(null), 4000)
    }
  }

  // Account Status Toggle Handler
  const handleToggleStatus = async (account: any) => {
    const isCurrentlyActive = (account.profileStatus || "active").toLowerCase() === "active"
    const nextStatus = isCurrentlyActive ? "inactive" : "active"
    try {
      await updateStatusMutation.mutateAsync({
        id: account.profileId || account.id,
        status: nextStatus,
      })
      setCopySuccessToast(`Account status updated to ${nextStatus.toUpperCase()} for ${account.name}.`)
      setTimeout(() => setCopySuccessToast(null), 3000)
    } catch (err: any) {
      setCopySuccessToast(`Error: ${err.message || "Failed to update status"}`)
      setTimeout(() => setCopySuccessToast(null), 3000)
    }
  }

  // Copy Credentials to Clipboard
  const handleCopyCredentials = (userId: string, email: string, pwd?: string, workspaces?: string[]) => {
    const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:3000/login"
    const wsNames = workspaces && workspaces.length > 0
      ? workspaces.map((wId) => PLATFORM_WORKSPACES.find((w) => w.id === wId)?.shortName || wId).join(", ")
      : "Faculty, Academics, Attendance, Exams, Timetable"
    const text = `VID Platform User Credentials:\nUser ID / Login ID: ${userId || email}\nEmail: ${email}\nInitial Password: ${pwd || "[Generated at setup]"}\nPermitted Workspaces: ${wsNames}\nNotice: Password change mandatory on first login.\nLogin Portal: ${loginUrl}`
    navigator.clipboard.writeText(text)
    setCopySuccessToast(`Credentials copied! You can now send this User ID & Password to the user.`)
    setTimeout(() => setCopySuccessToast(null), 3500)
  }

  // Build staff options for dropdown
  const staffOptions: SelectOption[] = [
    { label: "Select Faculty Member from Staff & HRMS...", value: "" },
    ...facultyAccounts.map((s: any) => ({
      label: `${s.name} (${s.employeeCode || "No Code"})${s.hasCredentials ? " • [Credentials Set]" : " • [Pending Setup]"}`,
      value: s.staffId || s.id,
      sublabel: `${s.qualification || "Faculty"} • ${s.email}`,
    })),
  ]

  // Columns for Admissions Inflow
  const applicantColumns: TableColumn<Applicant>[] = [
    {
      header: "Applicant",
      key: "studentName",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.studentName}</div>
          <div className="text-xs text-text-secondary">{item.applicationNumber}</div>
        </div>
      ),
    },
    {
      header: "Grade",
      key: "gradeApplying",
      render: (item) => <span className="font-mono text-xs">{item.gradeApplying}</span>,
    },
    {
      header: "Applied Date",
      key: "appliedDate",
      render: (item) => <span className="font-mono text-xs text-text-secondary">{item.appliedDate}</span>,
    },
    {
      header: "Status",
      key: "stage",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "error" | "neutral"> = {
          APPROVED: "positive",
          ENROLLED: "positive",
          DOCUMENT_VERIFICATION: "warning",
          INTERVIEW: "warning",
          INQUIRY: "neutral",
          APPLIED: "neutral",
          REJECTED: "error",
        }
        return (
          <Badge variant={variants[item.stage] || "neutral"}>
            {item.stage.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <Link
          href={`/admissions?appId=${item.id}`}
          className="text-xs font-semibold text-action-primary hover:underline flex items-center gap-1"
        >
          Inspect <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ]

  // Columns for Faculty & User Accounts Table
  const accountColumns: TableColumn<any>[] = [
    {
      header: "Member Name & Code",
      key: "name",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary flex items-center gap-1.5">
            <span>{item.name}</span>
            {item.gender && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-subtle text-text-secondary border border-border-subtle font-mono">
                {item.gender}
              </span>
            )}
          </div>
          <div className="text-xs text-text-secondary font-mono">{item.employeeCode || "No Employee Code"}</div>
        </div>
      ),
    },
    {
      header: "Department & Role",
      key: "designation",
      render: (item) => (
        <div>
          <div className="text-xs font-medium text-text-primary">{item.designation || "Staff"}</div>
          <div className="text-[11px] text-text-secondary">{item.department || "Academic Department"}</div>
        </div>
      ),
    },
    {
      header: "Role Template",
      key: "roleTemplate",
      render: (item) => {
        const tplKey = item.roleTemplate || "TEACHER"
        const tpl = roleTemplates.find((t: any) => t.key === tplKey)
        return (
          <div className="flex flex-col gap-0.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/30 w-fit">
              {tpl?.name || tplKey}
            </span>
            <span className="text-[10px] text-text-muted">Role: {item.role}</span>
          </div>
        )
      },
    },
    {
      header: "User ID & Email",
      key: "userId",
      render: (item) => (
        <div>
          <div className="text-xs font-mono font-semibold text-brand-primary flex items-center gap-1">
            <Key className="w-3 h-3 text-text-muted shrink-0" />
            <span>{item.userId || item.email}</span>
          </div>
          <div className="text-[11px] text-text-muted font-mono">{item.email}</div>
        </div>
      ),
    },
    {
      header: "Status",
      key: "hasCredentials",
      render: (item) => {
        const isInactive = (item.profileStatus || "active").toLowerCase() === "inactive"
        return (
          <div className="flex flex-col gap-1">
            {isInactive ? (
              <Badge variant="error">DEACTIVATED</Badge>
            ) : item.hasCredentials ? (
              <Badge variant="positive">CREDENTIALS ACTIVE</Badge>
            ) : (
              <Badge variant="warning">PENDING SETUP</Badge>
            )}
            {item.mustChangePassword && (
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono">
                First-login change req.
              </span>
            )}
          </div>
        )
      },
    },
    {
      header: "Permitted Workspaces",
      key: "assignedWorkspaces",
      render: (item) => {
        const list: string[] = item.assignedWorkspaces || []
        if (list.length === 0) {
          return (
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <span className="italic">Default Set</span>
            </div>
          )
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {list.map((wsId: string) => {
              const ws = PLATFORM_WORKSPACES.find((w) => w.id === wsId)
              return (
                <span
                  key={wsId}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-subtle text-text-secondary border border-border-subtle"
                >
                  {ws?.shortName || wsId}
                </span>
              )
            })}
          </div>
        )
      },
    },
    {
      header: "Actions",
      key: "staffId",
      render: (item) => {
        const isInactive = (item.profileStatus || "active").toLowerCase() === "inactive"
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.hasCredentials ? (
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<Key className="w-3 h-3" />}
                title="Reset temporary password"
                onClick={() => handleDirectResetCredentials(item)}
              >
                Reset
              </Button>
            ) : (
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Key className="w-3 h-3" />}
                onClick={() => {
                  handleStaffSelection(item.staffId || item.id)
                  setIsProvisionModalOpen(true)
                }}
              >
                Set
              </Button>
            )}

            <Button
              size="dense"
              variant="ghost"
              title="Edit Role Template & Workspaces"
              leadingIcon={<Shield className="w-3 h-3" />}
              onClick={() => {
                setSelectedUserForEdit(item)
                setIsEditAccessModalOpen(true)
              }}
            >
              Access
            </Button>

            <Button
              size="dense"
              variant="ghost"
              title={isInactive ? "Reactivate account" : "Deactivate account"}
              leadingIcon={isInactive ? <UserCheck className="w-3 h-3 text-emerald-500" /> : <UserX className="w-3 h-3 text-red-500" />}
              onClick={() => handleToggleStatus(item)}
            >
              {isInactive ? "Enable" : "Disable"}
            </Button>

            <Button
              size="dense"
              variant="ghost"
              title="Security & Lifecycle Audit"
              leadingIcon={<History className="w-3 h-3" />}
              onClick={() => {
                setSelectedUserForAudit(item)
                setIsAuditModalOpen(true)
              }}
            >
              Audit
            </Button>

            {item.hasCredentials && (
              <Button
                size="dense"
                variant="ghost"
                title="Copy Login Info"
                leadingIcon={<Copy className="w-3 h-3" />}
                onClick={() => handleCopyCredentials(item.userId, item.email, item.tempPassword, item.assignedWorkspaces)}
              >
                Copy
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <AppShell
      pageTitle="Institute Admin Workspace"
      breadcrumbs={[{ label: "Institute Admin" }, { label: activeTab === "users" ? "Faculty Accounts" : "Command Center" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          {activeTab === "users" ? (
            <div className="flex items-center gap-2">
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<FileSpreadsheetIcon className="w-3.5 h-3.5" />}
                onClick={() => setIsBulkProvisionModalOpen(true)}
              >
                Bulk Provision (CSV)
              </Button>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setSelectedStaffId("")
                  setProvisionName("")
                  setProvisionEmail("")
                  setProvisionUserId("")
                  setSelectedRoleTemplate("TEACHER")
                  generateRandomPassword()
                  setSelectedWorkspaces(DEFAULT_FACULTY_WORKSPACES)
                  setProvisionError(null)
                  setProvisionSuccessData(null)
                  setIsProvisionModalOpen(true)
                }}
              >
                Provision Account
              </Button>
            </div>
          ) : (
            <>
              <Link href="/hrms/staff">
                <Button size="dense" variant="secondary" leadingIcon={<Users className="w-3.5 h-3.5" />}>
                  Staff & HRMS
                </Button>
              </Link>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Send className="w-3.5 h-3.5" />}
                onClick={() => {
                  setSelectedAction("Broadcast Emergency Notice")
                  setConfirmDialogOpen(true)
                }}
              >
                Emergency Broadcast
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Toast Notification */}
        {copySuccessToast && (
          <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-text-primary text-xs flex items-center justify-between shadow-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-primary shrink-0" />
              <span>{copySuccessToast}</span>
            </div>
            <button
              onClick={() => setCopySuccessToast(null)}
              className="p-1 hover:bg-brand-primary/20 rounded text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Switcher: Institutional Overview vs Faculty User Accounts */}
        <div className="flex items-center justify-between border-b border-border-default pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-action-black text-canvas shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-subtle"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Institutional Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "users"
                  ? "bg-action-black text-canvas shadow-xs font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-subtle"
              }`}
            >
              <Key className="w-4 h-4 text-brand-primary" />
              <span>Faculty & User Accounts</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-brand-primary/20 text-brand-primary font-mono font-bold">
                {facultyAccounts.length}
              </span>
            </button>
          </div>

          <div className="text-xs font-mono text-text-muted hidden sm:block">
            Workspace: <span className="font-semibold text-text-primary">Institute Admin</span>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: FACULTY & USER ACCOUNT MANAGEMENT                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Header Banner */}
            <div className="p-5 rounded-xl bg-surface border border-border-default shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span>Faculty & User Account Provisioning</span>
                    <Badge variant="positive">RBAC ENFORCED</Badge>
                  </h1>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Generate login credentials (User ID / Email & Password) for faculty added in Staff & HRMS workspace so they can authenticate and log into the application.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="default"
                leadingIcon={<Key className="w-4 h-4" />}
                onClick={() => {
                  setSelectedStaffId("")
                  setProvisionName("")
                  setProvisionEmail("")
                  setProvisionUserId("")
                  generateRandomPassword()
                  setProvisionError(null)
                  setProvisionSuccessData(null)
                  setIsProvisionModalOpen(true)
                }}
              >
                Provision Credentials
              </Button>
            </div>

            {/* Account KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Staff in HRMS"
                value={facultyAccounts.length.toString()}
                icon={<Users className="w-5 h-5 text-brand-primary" />}
                description="Staff members added in Staff & HRMS"
              />
              <StatCard
                label="Accounts Active (Can Login)"
                value={facultyAccounts.filter((a: any) => a.hasCredentials).length.toString()}
                icon={<CheckCircle2 className="w-5 h-5 text-brand-green" />}
                description="User ID & Password generated"
              />
              <StatCard
                label="Pending Login Credentials"
                value={facultyAccounts.filter((a: any) => !a.hasCredentials).length.toString()}
                icon={<Clock className="w-5 h-5 text-brand-warning" />}
                description="Click 'Set Credentials' to generate"
              />
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border-default">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, user ID, email, employee code..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-canvas border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAccountFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    accountFilter === "ALL" ? "bg-action-black text-canvas font-bold" : "text-text-secondary hover:bg-subtle"
                  }`}
                >
                  All ({facultyAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountFilter("CREDENTIALS_SET")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    accountFilter === "CREDENTIALS_SET" ? "bg-action-black text-canvas font-bold" : "text-text-secondary hover:bg-subtle"
                  }`}
                >
                  Credentials Active ({facultyAccounts.filter((a: any) => a.hasCredentials).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountFilter("PENDING")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    accountFilter === "PENDING" ? "bg-action-black text-canvas font-bold" : "text-text-secondary hover:bg-subtle"
                  }`}
                >
                  Pending Setup ({facultyAccounts.filter((a: any) => !a.hasCredentials).length})
                </button>
              </div>
            </div>

            {/* Faculty Accounts Table */}
            <Table
              data={filteredAccounts}
              columns={accountColumns}
              keyExtractor={(item) => item.staffId || item.id}
              loading={accountsLoading}
              cardTitle={(item) => item.name}
              cardSubtitle={(item) => item.designation || "Faculty Member"}
              cardBadge={(item) => (
                <Badge variant={item.hasCredentials ? "positive" : "warning"}>
                  {item.hasCredentials ? "CREDENTIALS ACTIVE" : "PENDING SETUP"}
                </Badge>
              )}
            />
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: OVERVIEW & WORKSPACES COMMAND CENTER                   */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Welcome & Term Status Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-subtle border border-border-default flex items-center justify-center text-brand-primary">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-semibold text-text-primary">
                      {institutionName}
                    </h1>
                    <Badge variant="positive">CAMPUS SYNCED</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Academic Year 2026-2027 • Term 1 • Current Period: 03 (Morning Session)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
                <div>
                  <span className="text-text-muted">Biometric Decks: </span>
                  <span className="text-brand-primary font-semibold">12/12 Online</span>
                </div>
                <div className="hidden sm:block text-border-default">•</div>
                <div>
                  <span className="text-text-muted">Server Sync: </span>
                  <span className="text-text-primary">Live PostgreSQL</span>
                </div>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Staff & Faculty Roster"
                value={staffList.length.toString()}
                delta="HRMS Active"
                deltaType="increase"
                icon={<Users className="w-5 h-5" />}
                description="Teachers & staff onboarded"
              />
              <StatCard
                label="Faculty Accounts Active"
                value={facultyAccounts.filter((a: any) => a.hasCredentials).length.toString()}
                delta="Can Log In"
                deltaType="increase"
                icon={<Key className="w-5 h-5" />}
                description="Verified credentials in system"
              />
              <StatCard
                label="Fee Realization"
                value="₹1.84 Cr"
                delta="82.4% collected"
                deltaType="neutral"
                icon={<CreditCard className="w-5 h-5" />}
                description="Term 1 fee collection"
              />
              <StatCard
                label="Faculty On Duty"
                value={`${staffList.filter((s) => s.status === "ACTIVE").length} Active`}
                delta="Zero unattended"
                deltaType="neutral"
                icon={<Activity className="w-5 h-5" />}
                description="Teaching allocation synchronized"
              />
            </div>

            {/* Dedicated Workspace Launcher */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-surface border border-border-default shadow-card">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-primary" />
                    <h2 className="text-base font-bold text-text-primary">
                      Select Dedicated Workspace
                    </h2>
                    <Badge variant="neutral" className="text-[10px] font-mono">
                      Strictly Isolated Workstations
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Each workspace loads exclusively with its dedicated sub-tools, rosters, and data workflows.
                  </p>
                </div>
                <div className="text-xs font-mono text-text-muted shrink-0">
                  10 Isolated Workspaces Configured
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PLATFORM_WORKSPACES.filter((ws) => ws.id !== "dashboard").map((ws) => {
                  const IconComp = WORKSPACE_ICONS[ws.iconName] || Briefcase
                  return (
                    <div
                      key={ws.id}
                      className="group relative flex flex-col justify-between p-4 rounded-xl bg-surface border border-border-default hover:border-brand-primary/60 hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="w-9 h-9 rounded-lg bg-subtle border border-border-default/80 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                            <IconComp className="w-4.5 h-4.5" />
                          </div>
                          <Badge variant="neutral" className="text-[9px] uppercase tracking-wider font-mono">
                            {ws.category}
                          </Badge>
                        </div>

                        <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                          {ws.name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                          {ws.description}
                        </p>

                        <div className="mt-3 pt-3 border-t border-border-subtle/80 space-y-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Sub-Tools ({ws.navItems.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {ws.navItems.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-block text-[11px] px-1.5 py-0.5 rounded bg-subtle text-text-secondary truncate max-w-[130px]"
                              >
                                {item.title}
                              </span>
                            ))}
                            {ws.navItems.length > 3 && (
                              <span className="inline-block text-[10px] px-1 py-0.5 text-text-muted">
                                +{ws.navItems.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2">
                        <Link
                          href={ws.primaryRoute}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-action-black text-canvas hover:bg-neutral-800 text-xs font-semibold shadow-xs transition-colors"
                        >
                          <span>Enter {ws.shortName}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2-Column Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main 2 Cols: Admissions Inflow Table */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">
                      Recent Admissions Inflow
                    </h2>
                    <p className="text-xs text-text-secondary">
                      Applicants in active review for upcoming intake
                    </p>
                  </div>
                  <Link href="/admissions">
                    <Button size="dense" variant="ghost">
                      View Kanban →
                    </Button>
                  </Link>
                </div>

                <Table
                  data={applicants || []}
                  columns={applicantColumns}
                  keyExtractor={(item) => item.id}
                  loading={appsLoading}
                  cardTitle={(item) => item.studentName}
                  cardSubtitle={(item) => item.applicationNumber}
                  cardBadge={(item) => (
                    <Badge variant={item.stage === "APPROVED" ? "positive" : "warning"}>
                      {item.stage}
                    </Badge>
                  )}
                />
              </div>

              {/* Side 1 Col: Quick Links */}
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-brand-primary" />
                      <CardTitle className="text-sm">User & Account Management</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Generate and give User IDs and passwords to faculty onboarded in Staff & HRMS so they can authenticate and log into the application.
                    </p>
                    <Button
                      size="default"
                      variant="primary"
                      className="w-full"
                      leadingIcon={<Key className="w-4 h-4" />}
                      onClick={() => setActiveTab("users")}
                    >
                      Manage Faculty Accounts
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Direct Shortcuts</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Link href="/hrms/staff" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                      <span>Staff & HRMS Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                    </Link>
                    <Link href="/admissions" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                      <span>Admissions Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                    </Link>
                    <Link href="/academics/hierarchy" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                      <span>Academics & Sections</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                    </Link>
                    <Link href="/finance/dashboard" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-subtle border border-transparent hover:border-border-default transition-all text-xs font-medium text-text-primary">
                      <span>Fee Collections & Dues</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. PROVISION FACULTY CREDENTIALS MODAL                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
                  <Key className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Provision User Account Credentials</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Generate User ID & Password with Section 10 Role Templates and workspace isolation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProvisionModalOpen(false)
                  setProvisionSuccessData(null)
                }}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Success Notification with Credential Card */}
              {provisionSuccessData ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        Account Successfully Provisioned!
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        The user can now log in using either their User ID or Email with the generated temporary password.
                      </p>
                    </div>
                  </div>

                  {/* Mandatory First-Login Password Change Notice */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Mandatory First-Login Password Change:</strong> This user will be required to change their temporary password immediately upon their first login.
                    </span>
                  </div>

                  {/* Credentials Box */}
                  <div className="p-4 rounded-xl bg-subtle border border-border-default space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="text-text-secondary">Full Name:</span>
                      <span className="font-bold text-text-primary">{provisionSuccessData.name}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="text-text-secondary">Role Template:</span>
                      <span className="font-bold text-brand-primary">{provisionSuccessData.roleTemplate}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="text-text-secondary">User ID (Login ID):</span>
                      <span className="font-bold text-brand-primary">{provisionSuccessData.userId}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="text-text-secondary">Email Address:</span>
                      <span className="text-text-primary">{provisionSuccessData.email}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="text-text-secondary">Temporary Password:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{provisionSuccessData.password}</span>
                    </div>

                    <div className="flex flex-col border-b border-border-subtle pb-2 gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Permitted Workspaces:</span>
                        <span className="text-brand-primary font-bold">{provisionSuccessData.workspaces?.length || 0} Enabled</span>
                      </div>
                      <div className="flex flex-wrap gap-1 font-sans">
                        {(provisionSuccessData.workspaces || []).map((wsId: string) => {
                          const ws = PLATFORM_WORKSPACES.find((w) => w.id === wsId)
                          return (
                            <span
                              key={wsId}
                              className="px-2 py-0.5 rounded text-[11px] bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20"
                            >
                              {ws?.shortName || wsId}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Login Portal:</span>
                      <span className="text-action-primary underline">{provisionSuccessData.loginUrl}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="default"
                      className="flex-1"
                      leadingIcon={<Copy className="w-4 h-4" />}
                      onClick={() =>
                        handleCopyCredentials(
                          provisionSuccessData.userId,
                          provisionSuccessData.email,
                          provisionSuccessData.password,
                          provisionSuccessData.workspaces
                        )
                      }
                    >
                      Copy Credentials to Give to User
                    </Button>

                    <Link href="/login" target="_blank" className="flex-1">
                      <Button type="button" variant="secondary" size="default" className="w-full" leadingIcon={<ExternalLink className="w-4 h-4" />}>
                        Test Login Page
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProvisionSubmit} className="space-y-4">
                  {provisionError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{provisionError}</span>
                    </div>
                  )}

                  {/* Section 10 Role Template */}
                  <FormField label="Assign Role Template (Section 10 Standard)" required>
                    <Select
                      value={selectedRoleTemplate}
                      onChange={(val) => handleRoleTemplateChange(val)}
                      className="w-full text-xs font-semibold"
                      options={roleTemplates.map((t: any) => ({
                        label: `${t.name} (Role: ${t.roleName} • ${t.defaultWorkspaces?.length || 0} Default Workspaces)`,
                        value: t.key,
                      }))}
                    />
                  </FormField>

                  {/* Select Staff Member from HRMS Roster */}
                  <FormField label="Optional: Link to Staff Member from HRMS Workspace">
                    <Select
                      options={staffOptions}
                      value={selectedStaffId}
                      onChange={(val) => handleStaffSelection(val)}
                      placeholder="Select staff member (optional)..."
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <FormField label="Full Name" required>
                      <Input
                        value={provisionName}
                        onChange={(e) => setProvisionName(e.target.value)}
                        placeholder="User full name"
                      />
                    </FormField>

                    {/* Email Address */}
                    <FormField label="Email Address" required>
                      <Input
                        type="email"
                        value={provisionEmail}
                        onChange={(e) => setProvisionEmail(e.target.value)}
                        placeholder="user@school.edu"
                      />
                    </FormField>
                  </div>

                  {/* User ID / Login Username */}
                  <FormField
                    label="User ID / Login Username"
                    required
                    helperText="This username can be used interchangeably with their email address on the login screen."
                  >
                    <Input
                      value={provisionUserId}
                      onChange={(e) => setProvisionUserId(e.target.value)}
                      placeholder="e.g. fac.raman or USR1042"
                      leftIcon={<Key className="w-3.5 h-3.5 text-text-muted" />}
                    />
                  </FormField>

                  {/* Password with Generator */}
                  <FormField
                    label="Initial Temporary Password"
                    helperText="Initial credential. Click 'Generate' to create a strong password or enter custom. User will update on first login."
                  >
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={provisionPassword}
                          onChange={(e) => setProvisionPassword(e.target.value)}
                          placeholder="Initial password or click Generate..."
                          leftIcon={<Lock className="w-3.5 h-3.5 text-text-muted" />}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="default"
                        onClick={generateRandomPassword}
                      >
                        Generate
                      </Button>
                    </div>
                  </FormField>

                  {/* Workspaces Scoping Section */}
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border-default gap-2">
                      <div>
                        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-brand-primary" />
                          <span>Assign Permitted Workspaces</span>
                          <span className="text-status-error">*</span>
                        </label>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          Click any workspace to grant or revoke access for this user upon login.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={handleFacultyPresetWorkspaces}
                          className="text-[11px] font-semibold text-brand-primary hover:underline"
                        >
                          Faculty Preset (5)
                        </button>
                        <span className="text-text-muted text-xs">•</span>
                        <button
                          type="button"
                          onClick={handleSelectAllWorkspaces}
                          className="text-[11px] font-semibold text-text-primary hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-text-muted text-xs">•</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllWorkspaces}
                          className="text-[11px] font-semibold text-text-secondary hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Workspaces Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-56 overflow-y-auto pr-1">
                      {PLATFORM_WORKSPACES.map((ws) => {
                        const isChecked = selectedWorkspaces.includes(ws.id)
                        return (
                          <div
                            key={ws.id}
                            onClick={() => handleToggleWorkspace(ws.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                              isChecked
                                ? "bg-action-black/5 border-action-black/30 dark:bg-white/5 dark:border-white/30"
                                : "bg-surface border-border-default hover:border-border-strong opacity-65"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0 text-text-primary">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-action-black dark:text-canvas" />
                              ) : (
                                <Square className="w-4 h-4 text-text-muted" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-text-primary truncate">
                                  {ws.name}
                                </span>
                                <Badge
                                  variant="neutral"
                                  className="text-[9px] px-1.5 py-0 uppercase tracking-wider"
                                >
                                  {ws.category}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                                {ws.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-text-secondary">
                      <span>Selected Workspaces:</span>
                      <span className="font-semibold text-text-primary">
                        {selectedWorkspaces.length} of {PLATFORM_WORKSPACES.length} Selected
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-border-default flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="default"
                      onClick={() => setIsProvisionModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="default"
                      isLoading={provisionUserMutation.isPending}
                    >
                      Save & Provision Account
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Access Modal */}
      <EditUserAccessModal
        isOpen={isEditAccessModalOpen}
        user={selectedUserForEdit}
        onClose={() => {
          setIsEditAccessModalOpen(false)
          setSelectedUserForEdit(null)
        }}
        onSuccess={() => {
          setCopySuccessToast("User access updated successfully.")
          setTimeout(() => setCopySuccessToast(null), 3000)
        }}
      />

      {/* Bulk Provisioning Modal */}
      <BulkProvisionModal
        isOpen={isBulkProvisionModalOpen}
        onClose={() => setIsBulkProvisionModalOpen(false)}
        onSuccess={() => {
          setCopySuccessToast("Bulk account provisioning completed.")
          setTimeout(() => setCopySuccessToast(null), 3000)
        }}
      />

      {/* User Audit Trail Modal */}
      <UserAuditModal
        isOpen={isAuditModalOpen}
        user={selectedUserForAudit}
        onClose={() => {
          setIsAuditModalOpen(false)
          setSelectedUserForAudit(null)
        }}
      />

      {/* Emergency Broadcast Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Confirm Emergency Broadcast"
        description="Are you sure you want to dispatch a critical SMS and push broadcast to all guardians and staff? This action cannot be revoked once queued."
        confirmLabel="Authorize Broadcast"
        danger
        onConfirm={() => setConfirmDialogOpen(false)}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. SUPER ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const { data: institutions, isLoading } = useInstitutions()

  const instColumns: TableColumn<Institution>[] = [
    {
      header: "Institution Name",
      key: "name",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.name}</div>
          <div className="text-xs font-mono text-text-secondary">{item.domain}</div>
        </div>
      ),
    },
    {
      header: "Code",
      key: "code",
      render: (item) => <span className="font-mono text-xs">{item.code}</span>,
    },
    {
      header: "Plan",
      key: "plan",
      render: (item) => (
        <Badge variant={item.plan === "ENTERPRISE" ? "positive" : "neutral"}>
          {item.plan}
        </Badge>
      ),
    },
    {
      header: "Students",
      key: "studentsCount",
      render: (item) => <span className="font-mono text-xs font-semibold">{item.studentsCount.toLocaleString()}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (item) => (
        <Badge variant={item.status === "ACTIVE" ? "positive" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <Link
          href={`/institutions?id=${item.id}`}
          className="text-xs font-semibold text-action-primary hover:underline"
        >
          Manage Tenant
        </Link>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Super Administrator Platform Console"
      breadcrumbs={[{ label: "Platform" }, { label: "Multi-Tenant Fleet" }]}
      rightHeaderAction={
        <Link href="/institutions">
          <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
            Provision Tenant
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Institutions"
            value="24"
            delta="+2 provisioning"
            deltaType="increase"
            icon={<Building2 className="w-5 h-5" />}
            description="Multi-tenant cluster health: 100%"
          />
          <StatCard
            label="Platform Students"
            value="48,200"
            delta="+1,420 this month"
            deltaType="increase"
            icon={<Users className="w-5 h-5" />}
            description="Across 6 global education hubs"
          />
          <StatCard
            label="Platform MRR"
            value="₹1.42 Cr"
            delta="99.4% SLA uptime"
            deltaType="increase"
            icon={<CreditCard className="w-5 h-5" />}
            description="Enterprise tier retention: 98%"
          />
          <StatCard
            label="AI Yantra Minutes"
            value="128.4k"
            delta="+18% vs last week"
            deltaType="increase"
            icon={<Cpu className="w-5 h-5" />}
            description="Autonomous voice & vision models"
          />
        </div>

        {/* Institutions Fleet Table */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Provisioned Institutional Tenants
              </h2>
              <p className="text-xs text-text-secondary">
                Live isolation clusters partitioned by tenant ID
              </p>
            </div>
            <Link href="/institutions">
              <Button size="dense" variant="secondary">
                View All Tenants →
              </Button>
            </Link>
          </div>

          <Table
            data={institutions || []}
            columns={instColumns}
            keyExtractor={(item) => item.id}
            loading={isLoading}
            cardTitle={(item) => item.name}
            cardSubtitle={(item) => item.domain}
            cardBadge={(item) => (
              <Badge variant={item.status === "ACTIVE" ? "positive" : "warning"}>
                {item.status}
              </Badge>
            )}
          />
        </div>
      </div>
    </AppShell>
  )
}
