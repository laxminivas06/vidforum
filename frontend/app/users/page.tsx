"use client"

import React, { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Table,
  TableColumn,
  Badge,
  Button,
  FormField,
  Input,
  Select,
  SelectOption,
  StatCard,
} from "@/components/ui"
import {
  Users,
  Plus,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Shield,
  UserCheck,
  Pencil,
} from "lucide-react"
import {
  useInstitutions,
  usePlatformUsers,
  useCreatePlatformUser,
  useUpdatePlatformUser,
} from "@/lib/api/hooks"

export interface PlatformUser {
  id: string
  name: string
  email: string
  role: string
  institution: string
  status: "ACTIVE" | "INACTIVE"
  createdAt?: string
}

const DEFAULT_USERS: PlatformUser[] = [
  {
    id: "44444444-4444-4444-4444-444444444404",
    name: "VID Platform Super Admin",
    email: "superadmin@vid.edu",
    role: "SUPER_ADMIN",
    institution: "VID Global Platform",
    status: "ACTIVE",
    createdAt: "2026-09-01",
  },
]

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Institution Admin", value: "INSTITUTION_ADMIN", sublabel: "Tenant administrator with full school authority" },
  { label: "Faculty / Teacher", value: "FACULTY", sublabel: "Assigned classes, attendance & grades entry" },
  { label: "Super Admin", value: "SUPER_ADMIN", sublabel: "Global platform infrastructure administrator" },
  { label: "Admissions Team", value: "ADMISSION_TEAM", sublabel: "Inquiries, pipeline, document verification" },
  { label: "Finance Team", value: "FINANCE_TEAM", sublabel: "Fee structures, counter collection & invoicing" },
  { label: "Exam Controller", value: "EXAM_TEAM", sublabel: "Examination schedules & Excel marks imports" },
  { label: "Academic Coordinator", value: "ACADEMIC_COORDINATOR", sublabel: "Curriculum, hierarchy & timetable matrix" },
  { label: "Student", value: "STUDENT", sublabel: "Self-service student academic & fee portal" },
  { label: "Parent", value: "PARENT", sublabel: "Linked multi-child monitoring portal" },
]

const STATUS_OPTIONS: SelectOption[] = [
  { label: "Active", value: "ACTIVE", sublabel: "User can authenticate and access tenant workspace" },
  { label: "Inactive", value: "INACTIVE", sublabel: "Account suspended from logging in" },
]

export default function UsersPage() {
  const { data: institutions = [] } = useInstitutions()
  const { data: dbUsers = [], isLoading: isLoadingUsers } = usePlatformUsers()
  const createUserMutation = useCreatePlatformUser()
  const updateUserMutation = useUpdatePlatformUser()

  const [users, setUsers] = useState<PlatformUser[]>(DEFAULT_USERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [institutionFilter, setInstitutionFilter] = useState("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Add User Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("FACULTY")
  const [institution, setInstitution] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit User Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("FACULTY")
  const [editInstitution, setEditInstitution] = useState("")
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE")
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null)

  // Sync users whenever dbUsers loads
  useEffect(() => {
    if (dbUsers.length > 0) {
      setUsers(dbUsers as PlatformUser[])
    }
  }, [dbUsers])

  // Build institution options dynamically
  const institutionOptions: SelectOption[] = [
    { label: "VID Global Platform (Platform Ops)", value: "VID Global Platform", sublabel: "Default for Super Admins" },
    ...institutions.map((inst) => ({
      label: `${inst.name} (${inst.code})`,
      value: inst.name,
      sublabel: `${inst.region || "Institutional Tenant"} • ${inst.domain}`,
    })),
  ]

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    const matchesInstitution =
      institutionFilter === "ALL" ||
      u.institution.toLowerCase() === institutionFilter.toLowerCase()
    return matchesSearch && matchesRole && matchesInstitution
  })

  // Validate Add form
  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "User Name is required"
    if (!email.trim()) {
      errs.email = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address"
    } else if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      errs.email = "A user with this email address already exists (duplicate prevented)"
    }
    if (!role) errs.role = "Please select an assigned role"
    if (!institution) errs.institution = "Please select an institution tenant"

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle Add form submission (Direct Cloud Database Persistence)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    const newUserPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      institutionName: institution,
    }

    try {
      // Sync directly with Cloud Database through backend API
      const created = await createUserMutation.mutateAsync(newUserPayload)

      const finalUser: PlatformUser = {
        id: created.id || `usr-${Date.now()}`,
        name: created.name || newUserPayload.name,
        email: created.email || newUserPayload.email,
        role: created.role || newUserPayload.role,
        institution: created.institution || newUserPayload.institutionName,
        status: created.status || "ACTIVE",
        createdAt: created.createdAt || new Date().toISOString().split("T")[0],
      }

      // Update state
      const updated = [finalUser, ...users.filter((u) => u.email.toLowerCase() !== finalUser.email.toLowerCase())]
      setUsers(updated)

      setSuccessMessage(`User ${finalUser.name} created and saved to cloud database!`)
      setName("")
      setEmail("")
      setRole("FACULTY")

      setTimeout(() => {
        setSuccessMessage(null)
        setIsModalOpen(false)
      }, 700)
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to create user. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit User modal
  const handleOpenEdit = (user: PlatformUser) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditInstitution(user.institution || "VID Global Platform")
    setEditStatus(user.status || "ACTIVE")
    setEditErrors({})
    setEditSuccessMessage(null)
    setIsEditModalOpen(true)
  }

  // Handle Edit form submission (Direct Cloud Database PATCH)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    const errs: Record<string, string> = {}
    if (!editName.trim()) errs.name = "User Name is required"
    if (!editEmail.trim()) {
      errs.email = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      errs.email = "Please enter a valid email address"
    } else if (
      users.some((u) => u.id !== editingUser.id && u.email.toLowerCase() === editEmail.trim().toLowerCase())
    ) {
      errs.email = "Another user with this email already exists"
    }
    if (!editRole) errs.role = "Please select an assigned role"
    if (!editInstitution) errs.institution = "Please select an institution tenant"

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    setIsEditSubmitting(true)
    setEditErrors({})

    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        institutionName: editInstitution,
        status: editStatus,
      })

      // Update state locally immediately
      const updatedList = users.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: editName.trim(),
              email: editEmail.trim().toLowerCase(),
              role: editRole,
              institution: editInstitution,
              status: editStatus,
            }
          : u
      )
      setUsers(updatedList)

      setEditSuccessMessage("User updated and synced to cloud database!")
      setTimeout(() => {
        setEditSuccessMessage(null)
        setIsEditModalOpen(false)
        setEditingUser(null)
      }, 700)
    } catch (err: any) {
      setEditErrors({ form: err.message || "Failed to update user." })
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const columns: TableColumn<PlatformUser>[] = [
    {
      header: "User Details",
      key: "name",
      render: (u) => (
        <div>
          <div className="font-semibold text-text-primary">{u.name}</div>
          <div className="text-xs text-text-secondary font-mono flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3 h-3 text-text-muted" />
            <span>{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Assigned Role",
      key: "role",
      render: (u) => {
        const variant =
          u.role === "SUPER_ADMIN"
            ? "warning"
            : u.role === "INSTITUTION_ADMIN"
            ? "positive"
            : "neutral"
        return <Badge variant={variant}>{u.role.replace(/_/g, " ")}</Badge>
      },
    },
    {
      header: "Institution Tenant / Fleet",
      key: "institution",
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="text-xs text-text-primary font-medium truncate max-w-[240px]">
            {u.institution}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (u) => (
        <Badge variant={u.status === "ACTIVE" ? "positive" : "neutral"}>
          {u.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      key: "actions" as any,
      render: (u) => (
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => handleOpenEdit(u)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  const facultyCount = users.filter((u) => u.role === "FACULTY").length
  const adminCount = users.filter((u) => u.role.includes("ADMIN")).length

  return (
    <AppShell
      pageTitle="Platform Global Users"
      breadcrumbs={[{ label: "Platform" }, { label: "Users" }]}
      rightHeaderAction={
        <Button
          size="dense"
          variant="primary"
          leadingIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => {
            setErrors({})
            setSuccessMessage(null)
            setIsModalOpen(true)
          }}
        >
          Add User
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Registered Users"
            value={users.length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Faculty Members"
            value={facultyCount}
            icon={<UserCheck className="w-5 h-5 text-brand-primary" />}
          />
          <StatCard
            label="Administrators"
            value={adminCount}
            icon={<Shield className="w-5 h-5 text-amber-500" />}
          />
          <StatCard
            label="Active Tenancies"
            value={institutions.length}
            icon={<Building2 className="w-5 h-5" />}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border-default">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-action-black"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter by Institution */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary whitespace-nowrap">Institution:</span>
              <select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-action-black max-w-[200px]"
              >
                <option value="ALL">All Institutions ({institutions.length})</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.name}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Role */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary whitespace-nowrap">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-action-black"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="INSTITUTION_ADMIN">Institution Admin</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMISSION_TEAM">Admissions Team</option>
                <option value="FINANCE_TEAM">Finance Team</option>
                <option value="EXAM_TEAM">Exam Team</option>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Table
          data={filteredUsers}
          columns={columns}
          keyExtractor={(u) => u.id}
          cardTitle={(u) => u.name}
          cardSubtitle={(u) => u.institution}
          cardBadge={(u) => <Badge variant="positive">{u.role}</Badge>}
        />
      </div>

      {/* Add User Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-canvas border border-border-default rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-border-default bg-surface/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-action-black text-canvas flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4 text-canvas" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight">
                    Add Platform User
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Directly saves to cloud database with role and tenant mapping
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddUser} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errors.form && (
                <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-2 text-xs text-status-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center gap-2 text-xs text-status-success">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* User Name */}
              <FormField label="User Full Name" required error={errors.name}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar or Ananya Sen"
                />
              </FormField>

              {/* Email */}
              <FormField label="Email Address" required error={errors.email}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rajesh.kumar@institution.edu"
                />
              </FormField>

              {/* Role */}
              <FormField label="Assigned System Role" required error={errors.role}>
                <Select
                  value={role}
                  onChange={(val) => setRole(val)}
                  options={ROLE_OPTIONS}
                  placeholder="Select system role..."
                />
              </FormField>

              {/* Institution Tenant */}
              <FormField
                label="Institution Tenant / Faculty Association"
                required
                error={errors.institution}
                helperText="Associate user with a specific institutional tenant or platform fleet"
              >
                <Select
                  value={institution}
                  onChange={(val) => setInstitution(val)}
                  options={institutionOptions}
                  placeholder="Select institution tenant..."
                />
              </FormField>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border-default flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="dense"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="dense"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating & Saving..." : "Confirm & Add User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal Dialog (Requirement 3) */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-canvas border border-border-default rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-border-default bg-surface/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-action-black text-canvas flex items-center justify-center shadow-sm">
                  <Pencil className="w-4 h-4 text-canvas" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight">
                    Edit Platform User
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Update user details, authority role, and tenancy assignment
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {editErrors.form && (
                <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-2 text-xs text-status-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editErrors.form}</span>
                </div>
              )}

              {editSuccessMessage && (
                <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center gap-2 text-xs text-status-success">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editSuccessMessage}</span>
                </div>
              )}

              {/* User Name */}
              <FormField label="User Full Name" required error={editErrors.name}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                />
              </FormField>

              {/* Email */}
              <FormField label="Email Address" required error={editErrors.email}>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. rajesh.kumar@institution.edu"
                />
              </FormField>

              {/* Role */}
              <FormField label="Assigned System Role" required error={editErrors.role}>
                <Select
                  value={editRole}
                  onChange={(val) => setEditRole(val)}
                  options={ROLE_OPTIONS}
                  placeholder="Select system role..."
                />
              </FormField>

              {/* Institution Tenant */}
              <FormField
                label="Institution Tenant / Fleet"
                required
                error={editErrors.institution}
                helperText="Assign or reassign user to an institution or global fleet"
              >
                <Select
                  value={editInstitution}
                  onChange={(val) => setEditInstitution(val)}
                  options={institutionOptions}
                  placeholder="Select institution tenant..."
                />
              </FormField>

              {/* Account Status */}
              <FormField label="Account Status" required>
                <Select
                  value={editStatus}
                  onChange={(val) => setEditStatus(val as "ACTIVE" | "INACTIVE")}
                  options={STATUS_OPTIONS}
                  placeholder="Select account status..."
                />
              </FormField>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border-default flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="dense"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isEditSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="dense"
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? "Saving to Cloud DB..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
