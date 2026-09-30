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
} from "lucide-react"
import { useInstitutions } from "@/lib/api/hooks"

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
  { id: "u-1", name: "Dr. Alistair Vance", email: "admin@springfield.edu", role: "INSTITUTION_ADMIN", institution: "Springfield International Academy", status: "ACTIVE", createdAt: "2026-09-01" },
  { id: "u-2", name: "Sister Maria Joseph", email: "principal@stjude.edu", role: "INSTITUTION_ADMIN", institution: "St. Jude Heritage World School", status: "ACTIVE", createdAt: "2026-09-05" },
  { id: "u-3", name: "Revathi Raman", email: "revathi.raman@springfield.edu", role: "FACULTY", institution: "Springfield International Academy", status: "ACTIVE", createdAt: "2026-09-10" },
  { id: "u-4", name: "Dr. Arvind Rao", email: "arvind.rao@springfield.edu", role: "FACULTY", institution: "Springfield International Academy", status: "ACTIVE", createdAt: "2026-09-12" },
  { id: "u-5", name: "Sarah Jenkins", email: "admissions@springfield.edu", role: "ADMISSION_TEAM", institution: "Springfield International Academy", status: "ACTIVE", createdAt: "2026-09-14" },
  { id: "u-6", name: "Marcus Brody", email: "finance@springfield.edu", role: "FINANCE_TEAM", institution: "Springfield International Academy", status: "ACTIVE", createdAt: "2026-09-16" },
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

export default function UsersPage() {
  const { data: institutions = [] } = useInstitutions()
  const [users, setUsers] = useState<PlatformUser[]>(DEFAULT_USERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Add User Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("FACULTY")
  const [institution, setInstitution] = useState("Springfield International Academy")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load and deduplicate saved users from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("vid_platform_users")
        if (raw) {
          const parsed: PlatformUser[] = JSON.parse(raw)
          // Deduplicate by email and id
          const combined = [...parsed, ...DEFAULT_USERS]
          const seen = new Set<string>()
          const deduplicated = combined.filter((u) => {
            const key = (u.email || u.id).toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          setUsers(deduplicated)
        }
      } catch (err) {
        console.warn("Failed to load stored platform users", err)
      }
    }
  }, [])

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
      u.institution.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Validate form
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

  // Handle form submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    const newUser: PlatformUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      institution,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0],
    }

    try {
      // Sync with backend API
      await fetch("http://localhost:5000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          institutionName: newUser.institution,
        }),
      }).catch((err) => console.warn("Backend sync offline, saving locally:", err))

      // Update state and persist
      const updated = [newUser, ...users]
      // Deduplicate
      const seen = new Set<string>()
      const deduped = updated.filter((u) => {
        const key = u.email.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setUsers(deduped)
      if (typeof window !== "undefined") {
        localStorage.setItem("vid_platform_users", JSON.stringify(deduped))
      }

      setSuccessMessage(`User ${newUser.name} created successfully!`)
      setName("")
      setEmail("")
      setRole("FACULTY")

      setTimeout(() => {
        setSuccessMessage(null)
        setIsModalOpen(false)
      }, 700)
    } catch (err) {
      setErrors({ form: "Failed to create user. Please try again." })
    } finally {
      setIsSubmitting(false)
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
        return <Badge variant={variant}>{u.role.replace("_", " ")}</Badge>
      },
    },
    {
      header: "Institution Tenant / Faculty",
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
            value={institutions.length || 4}
            icon={<Building2 className="w-5 h-5" />}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border-default">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-action-black"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-text-secondary whitespace-nowrap">Filter Role:</span>
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
                    Assign credentials, system role, and institutional tenant
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

              {/* Institution Tenant or Faculty Association */}
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
                  {isSubmitting ? "Creating User..." : "Confirm & Add User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}

