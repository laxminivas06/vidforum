"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import {
  Button,
  Badge,
  Card,
  StatCard,
  Table,
  TableColumn,
  FormField,
  Input,
} from "@/components/ui"
import {
  Search,
  Plus,
  ArrowUpDown,
  GraduationCap,
  Users,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  X,
  Eye,
  RefreshCw,
  Building,
  Banknote,
} from "lucide-react"
import {
  useStudents,
  useAcademics,
  useEnrollmentCounts,
  useCreateStudent,
  usePromoteStudent,
  useBulkImportStudents,
} from "@/lib/api/hooks"
import { StudentListItem } from "@/types"
import {
  useEscapeKey,
  useSubmitKey,
  useKeybinding,
} from "@/lib/hooks/useKeyboardShortcuts"
import {
  getModifierLabel,
  isModifierPressed,
} from "@/lib/utils/keyboard"

export default function StudentsDirectoryPage() {
  const router = useRouter()

  // Filters state
  const [search, setSearch] = useState("")
  const [selectedClass, setSelectedClass] = useState("ALL")
  const [selectedSection, setSelectedSection] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [ageMin, setAgeMin] = useState<string>("")
  const [ageMax, setAgeMax] = useState<string>("")

  // Queries
  const { data: rawStudents = [], isLoading, refetch } = useStudents({
    search: search.trim() || undefined,
    classId: selectedClass !== "ALL" ? selectedClass : undefined,
    sectionId: selectedSection !== "ALL" ? selectedSection : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    ageMin: ageMin ? parseInt(ageMin, 10) : undefined,
    ageMax: ageMax ? parseInt(ageMax, 10) : undefined,
  })

  const { data: academicGrades = [] } = useAcademics()
  const { data: enrollmentCounts = [] } = useEnrollmentCounts()

  // Flatten classes from academicGrades
  const classesList = useMemo(() => {
    const list: { id: string; name: string; gradeName: string; sections: any[] }[] = []
    academicGrades.forEach((g) => {
      if (Array.isArray(g.sections)) {
        list.push({
          id: g.id,
          name: g.name,
          gradeName: g.name,
          sections: g.sections,
        })
      }
    })
    return list
  }, [academicGrades])

  // Modals state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedStudentForPromotion, setSelectedStudentForPromotion] = useState<StudentListItem | null>(null)

  // Stats calculation
  const totalStudents = rawStudents.length
  const activeStudents = rawStudents.filter((s) => (s.status || "").toLowerCase() === "active").length
  const maleCount = rawStudents.filter((s) => (s.gender || "").toLowerCase() === "male").length
  const femaleCount = rawStudents.filter((s) => (s.gender || "").toLowerCase() === "female").length

  const totalCapacity = enrollmentCounts.reduce((acc, curr) => acc + (curr.capacity || 0), 0)
  const totalEnrolled = enrollmentCounts.reduce((acc, curr) => acc + (curr.enrolled_count || 0), 0)
  const utilizationPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

  // Table columns
  const columns: TableColumn<StudentListItem>[] = [
    {
      header: "Admission #",
      key: "admissionNumber",
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-brand-primary">
          {s.admissionNumber || "N/A"}
        </span>
      ),
    },
    {
      header: "Student Name",
      key: "name",
      render: (s) => (
        <div>
          <Link
            href={`/students/${s.id}`}
            className="font-semibold text-text-primary hover:text-brand-primary hover:underline transition-colors"
          >
            {s.name || `${s.firstName} ${s.lastName}`}
          </Link>
          <div className="text-[11px] text-text-secondary mt-0.5">
            {s.gender ? `${s.gender.charAt(0).toUpperCase() + s.gender.slice(1)}` : "Student"} • {s.age ? `${s.age} yrs` : "Age N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Class & Section",
      key: "className",
      render: (s) => (
        <div>
          <span className="text-xs font-medium text-text-primary">
            {s.className || "Unassigned"}
          </span>
          {s.sectionName && (
            <span className="text-xs text-text-secondary ml-1">
              ({s.sectionName})
            </span>
          )}
          {s.rollNumber && (
            <div className="text-[10px] font-mono text-text-muted">
              Roll #{s.rollNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Primary Contact",
      key: "guardianName",
      render: (s) => (
        <div>
          <div className="text-xs text-text-primary">{s.guardianName || "N/A"}</div>
          <div className="text-xs font-mono text-text-secondary">{s.guardianPhone || "N/A"}</div>
        </div>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (s) => {
        const st = (s.status || "active").toLowerCase()
        const variant =
          st === "active" ? "positive" : st === "graduated" ? "brand" : st === "transferred" ? "warning" : "neutral"
        return (
          <Badge variant={variant as any} size="sm">
            {st.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      header: "Actions",
      key: "id",
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="dense"
            variant="secondary"
            className="text-xs py-1 px-2.5 h-7"
            leadingIcon={<Eye className="w-3 h-3" />}
            onClick={() => router.push(`/students/${s.id}`)}
          >
            Profile
          </Button>
          <Button
            size="dense"
            variant="secondary"
            className="text-xs py-1 px-2.5 h-7"
            leadingIcon={<ArrowUpDown className="w-3 h-3" />}
            onClick={() => {
              setSelectedStudentForPromotion(s)
              setIsPromoteModalOpen(true)
            }}
          >
            Promote
          </Button>
        </div>
      ),
    },
  ]

  // Export CSV handler
  const handleExportCSV = () => {
    if (rawStudents.length === 0) return
    const headers = [
      "Admission Number",
      "First Name",
      "Last Name",
      "Gender",
      "Date of Birth",
      "Class",
      "Section",
      "Guardian Name",
      "Guardian Phone",
      "Status",
    ]
    const rows = rawStudents.map((s) => [
      s.admissionNumber || "",
      s.firstName || "",
      s.lastName || "",
      s.gender || "",
      s.dateOfBirth || "",
      s.className || "",
      s.sectionName || "",
      s.guardianName || "",
      s.guardianPhone || "",
      s.status || "",
    ])
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `students_directory_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const searchRef = useRef<HTMLInputElement>(null)
  const isAnyModalOpen = isEnrollModalOpen || isPromoteModalOpen || isImportModalOpen

  // Keyboard navigation shortcuts
  useKeybinding("n", () => setIsEnrollModalOpen(true), { enabled: !isAnyModalOpen })
  useKeybinding("c", () => setIsEnrollModalOpen(true), { enabled: !isAnyModalOpen })
  useKeybinding("b", () => setIsImportModalOpen(true), { enabled: !isAnyModalOpen })
  useKeybinding("/", (e) => {
    e.preventDefault()
    searchRef.current?.focus()
  }, { enabled: !isAnyModalOpen })

  return (
    <AppShell
      pageTitle="Students Master Directory"
      breadcrumbs={[{ label: "Core" }, { label: "Students Directory" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setIsImportModalOpen(true)}
            title="Bulk Import (B)"
          >
            Bulk Import
            <span className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded bg-surface border border-border-default text-[9px] font-mono text-text-muted">
              B
            </span>
          </Button>
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsEnrollModalOpen(true)}
            title={`Enroll Student (${getModifierLabel()}+N or N)`}
          >
            Enroll Student
            <span className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded bg-black/20 text-[9px] font-mono text-black font-semibold">
              N
            </span>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={totalStudents}
            description="Central Master Records"
            icon={<Users className="w-5 h-5 text-brand-primary" />}
          />
          <StatCard
            label="Active Roster"
            value={activeStudents}
            description={`${totalStudents - activeStudents} Alumni / Transferred`}
            icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
          />
          <StatCard
            label="Demographics"
            value={`${maleCount}B : ${femaleCount}G`}
            description="Gender Distribution"
            icon={<GraduationCap className="w-5 h-5 text-blue-400" />}
          />
          <StatCard
            label="Capacity Utilization"
            value={`${utilizationPct}%`}
            description={`${totalEnrolled} / ${totalCapacity} Total Seats`}
            icon={<Building className="w-5 h-5 text-amber-400" />}
          />
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name or admission #... (/)"
                className="w-full pl-9 pr-7 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-mono px-1 py-0.5 rounded bg-surface border border-border-default">
                /
              </kbd>
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setSelectedSection("ALL")
              }}
              className="text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Classes</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="alumni">Alumni</option>
              <option value="transferred">Transferred</option>
              <option value="dropped">Dropped</option>
            </select>

            {/* Age Filters */}
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span>Age:</span>
              <input
                type="number"
                placeholder="Min"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className="w-14 px-2 py-1.5 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none text-text-primary"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className="w-14 px-2 py-1.5 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none text-text-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="dense"
              variant="secondary"
              leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Students Table */}
        <Table
          data={rawStudents}
          columns={columns}
          keyExtractor={(s) => s.id}
          loading={isLoading}
          cardTitle={(s) => s.name || `${s.firstName} ${s.lastName}`}
          cardSubtitle={(s) => `${s.admissionNumber} • ${s.className || "Class N/A"}`}
          cardBadge={(s) => <Badge variant="neutral">{(s.status || "active").toUpperCase()}</Badge>}
        />
      </div>

      {/* Direct Enrollment Modal */}
      {isEnrollModalOpen && (
        <DirectEnrollModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          academicGrades={academicGrades}
          enrollmentCounts={enrollmentCounts}
          onSuccess={() => {
            setIsEnrollModalOpen(false)
            refetch()
          }}
        />
      )}

      {/* Promotion Wizard Modal */}
      {isPromoteModalOpen && (
        <PromotionWizardModal
          isOpen={isPromoteModalOpen}
          student={selectedStudentForPromotion}
          onClose={() => {
            setIsPromoteModalOpen(false)
            setSelectedStudentForPromotion(null)
          }}
          academicGrades={academicGrades}
          onSuccess={() => {
            setIsPromoteModalOpen(false)
            setSelectedStudentForPromotion(null)
            refetch()
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <BulkImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false)
            refetch()
          }}
        />
      )}
    </AppShell>
  )
}

// -------------------------------------------------------------
// Direct Enrollment Modal Component
// -------------------------------------------------------------
interface DirectEnrollModalProps {
  isOpen: boolean
  onClose: () => void
  academicGrades: any[]
  enrollmentCounts: any[]
  onSuccess: () => void
}

function DirectEnrollModal({ isOpen, onClose, academicGrades, enrollmentCounts, onSuccess }: DirectEnrollModalProps) {
  const createStudentMutation = useCreateStudent()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("2012-05-15")
  const [gender, setGender] = useState("male")
  const [bloodGroup, setBloodGroup] = useState("O+")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [academicYearId, setAcademicYearId] = useState("")
  const [rollNumber, setRollNumber] = useState("")

  // Guardian details
  const [guardianName, setGuardianName] = useState("")
  const [guardianPhone, setGuardianPhone] = useState("")
  const [guardianEmail, setGuardianEmail] = useState("")
  const [guardianRelationship, setGuardianRelationship] = useState("father")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [addressLine1, setAddressLine1] = useState("")

  // Student Fees
  const [feeAmount, setFeeAmount] = useState<string>("5000")
  const [feeStatus, setFeeStatus] = useState<string>("paid")

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate live age
  const calculatedAge = useMemo(() => {
    if (!dateOfBirth) return null
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }, [dateOfBirth])

  // Get selected class capacity status
  const classCapacityInfo = useMemo(() => {
    if (!classId) return null
    return enrollmentCounts.find((c) => c.class_id === classId) || null
  }, [classId, enrollmentCounts])

  const isClassAtCapacity = classCapacityInfo ? classCapacityInfo.available_seats <= 0 : false

  // Set default class & section when academic grades load
  React.useEffect(() => {
    if (academicGrades.length > 0 && !classId) {
      const first = academicGrades[0]
      setClassId(first.id)
      if (first.sections?.length > 0) {
        setSectionId(first.sections[0].id)
      }
    }
  }, [academicGrades, classId])

  const firstNameRef = useRef<HTMLInputElement>(null)

  const executeEnroll = async () => {
    setErrorMsg(null)

    if (!firstName || !lastName || !dateOfBirth || !gender || !classId || !sectionId) {
      setErrorMsg("Please fill all mandatory fields (Name, DOB, Gender, Class, Section).")
      if (!firstName) firstNameRef.current?.focus()
      return
    }

    if (isClassAtCapacity) {
      setErrorMsg(`Selected class is at full capacity (${classCapacityInfo?.enrolled_count}/${classCapacityInfo?.capacity} seats filled). Choose another class or section.`)
      return
    }

    try {
      setIsSubmitting(true)
      const notesWithFee = [
        feeAmount ? `Admission Fee: ₹${feeAmount} (${feeStatus})` : "",
      ].filter(Boolean).join(" | ")

      await createStudentMutation.mutateAsync({
        firstName,
        lastName,
        dateOfBirth,
        gender,
        classId,
        sectionId,
        academicYearId: academicYearId || "00000000-0000-0000-0000-000000000001",
        rollNumber: rollNumber || undefined,
        bloodGroup,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelationship,
        emergencyPhone,
        addressLine1,
        notes: notesWithFee || undefined,
      })
      onSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to enroll student")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    executeEnroll()
  }

  // Keybindings: Esc closes, Cmd+Enter / Ctrl+Enter submits
  useEscapeKey(onClose, isOpen)
  useSubmitKey(() => executeEnroll(), { requireModifier: true, enabled: isOpen && !isSubmitting })

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null)
      const timer = setTimeout(() => firstNameRef.current?.focus(), 60)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface border border-border-default rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default bg-subtle">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Direct Student Enrollment</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Create a new student master record and guardian linkage with capacity validation
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary" title="Close (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Personal Information */}
          <div className="text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-1">
            1. Student Demographics
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">First Name *</label>
              <input
                ref={firstNameRef}
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Aarav"
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Date of Birth *</label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
              {calculatedAge !== null && (
                <div className="text-[11px] text-text-secondary mt-1">
                  Age: <span className="font-semibold text-brand-primary">{calculatedAge} years</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          {/* Academic Placement & Capacity */}
          <div className="text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-1 mt-2">
            2. Academic Placement & Capacity
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Class *</label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value)
                  const matched = academicGrades.find((g) => g.id === e.target.value)
                  if (matched?.sections?.length > 0) {
                    setSectionId(matched.sections[0].id)
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              >
                {academicGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Section *</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              >
                {academicGrades
                  .find((g) => g.id === classId)
                  ?.sections?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  )) || <option value="">No sections</option>}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Roll Number (Optional)</label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Auto-assigned if empty"
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
            </div>
          </div>

          {/* Live Capacity Indicator */}
          {classCapacityInfo && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isClassAtCapacity
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>
                  <strong>{classCapacityInfo.class_name} Capacity:</strong> {classCapacityInfo.enrolled_count} /{" "}
                  {classCapacityInfo.capacity} Enrolled
                </span>
              </div>
              <Badge variant={isClassAtCapacity ? "error" : "positive"}>
                {isClassAtCapacity ? "AT CAPACITY" : `${classCapacityInfo.available_seats} Seats Left`}
              </Badge>
            </div>
          )}

          {/* Guardian Information */}
          <div className="text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-1 mt-2">
            3. Guardian & Emergency Contact
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Guardian Name</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Phone Number</label>
              <input
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Relationship</label>
              <select
                value={guardianRelationship}
                onChange={(e) => setGuardianRelationship(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>
          </div>

          {/* Admission Fees */}
          <div className="text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-1 mt-2">
            4. Admission Fees & Status
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Student Admission Fee (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Fee Payment Status</label>
              <select
                value={feeStatus}
                onChange={(e) => setFeeStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary cursor-pointer font-medium"
              >
                <option value="paid">Paid (Collected at Admission)</option>
                <option value="unpaid">Unpaid / Payment Due</option>
                <option value="partial">Partially Paid</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-border-default mt-2">
            <div className="flex items-center gap-2">
              <Button size="dense" variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                type="submit"
                disabled={isSubmitting || isClassAtCapacity}
                className="bg-brand-primary text-black hover:bg-emerald-400"
              >
                {isSubmitting ? "Enrolling Student..." : "Enroll Student"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Promotion Wizard Modal Component
// -------------------------------------------------------------
interface PromotionWizardModalProps {
  isOpen: boolean
  student: StudentListItem | null
  onClose: () => void
  academicGrades: any[]
  onSuccess: () => void
}

function PromotionWizardModal({ isOpen, student, onClose, academicGrades, onSuccess }: PromotionWizardModalProps) {
  const promoteMutation = usePromoteStudent()

  const [toClassId, setToClassId] = useState("")
  const [toSectionId, setToSectionId] = useState("")
  const [decision, setDecision] = useState("promoted")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  React.useEffect(() => {
    if (academicGrades.length > 0 && !toClassId) {
      setToClassId(academicGrades[0].id)
      if (academicGrades[0].sections?.length > 0) {
        setToSectionId(academicGrades[0].sections[0].id)
      }
    }
  }, [academicGrades, toClassId])

  if (!isOpen || !student) return null

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!toClassId || !toSectionId) {
      setErrorMsg("Target class and section are required")
      return
    }

    try {
      setIsSubmitting(true)
      await promoteMutation.mutateAsync({
        id: student.id,
        toClassId,
        toSectionId,
        academicYearId: "00000000-0000-0000-0000-000000000001",
        decision,
      })
      onSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to promote student")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keybindings: Esc dismisses, Cmd+Enter / Ctrl+Enter submits
  useEscapeKey(onClose, isOpen)
  useSubmitKey((e) => handlePromote(e as any), { requireModifier: true, enabled: isOpen && !isSubmitting })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface border border-border-default rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-border-default bg-subtle">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Promotion Wizard</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Promote or transition {student.name} to the next academic level
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary" title="Close (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePromote} className="p-5 flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="p-3 rounded-lg bg-subtle border border-border-subtle">
            <div className="text-xs text-text-secondary">Current Placement:</div>
            <div className="text-sm font-semibold text-text-primary mt-1">
              {student.name} ({student.admissionNumber})
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              Current: {student.className || "Class N/A"} • Section {student.sectionName || "A"}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Promotion Decision</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
            >
              <option value="promoted">Promoted (Advance to Next Grade)</option>
              <option value="retained">Retained (Repeat Year)</option>
              <option value="graduated">Graduated / Alumni</option>
              <option value="transferred">Transferred Out</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Target Class *</label>
              <select
                value={toClassId}
                onChange={(e) => {
                  setToClassId(e.target.value)
                  const matched = academicGrades.find((g) => g.id === e.target.value)
                  if (matched?.sections?.length > 0) {
                    setToSectionId(matched.sections[0].id)
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              >
                {academicGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Target Section *</label>
              <select
                value={toSectionId}
                onChange={(e) => setToSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
              >
                {academicGrades
                  .find((g) => g.id === toClassId)
                  ?.sections?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  )) || <option value="">No sections</option>}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-border-default">
            <div className="flex items-center gap-2">
              <Button size="dense" variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-primary text-black hover:bg-emerald-400"
              >
                {isSubmitting ? "Promoting..." : "Confirm Promotion"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Bulk Import Modal Component
// -------------------------------------------------------------
interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const bulkImportMutation = useBulkImportStudents()

  const [csvText, setCsvText] = useState("")
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [importReport, setImportReport] = useState<{ total: number; success: number; failed: number; results: any[] } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sampleTemplate = `firstName,lastName,dateOfBirth,gender,classId,sectionId,guardianName,guardianPhone
Rohan,Verma,2011-04-12,male,18b3b9a6-0791-47f4-bbd0-bf7c0221e18f,18b3b9a6-0791-47f4-bbd0-bf7c0221e18f,Sunil Verma,+91 98765 11111
Sneha,Patel,2012-08-20,female,18b3b9a6-0791-47f4-bbd0-bf7c0221e18f,18b3b9a6-0791-47f4-bbd0-bf7c0221e18f,Anita Patel,+91 98765 22222`

  const handleParse = () => {
    setErrorMsg(null)
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) {
      setErrorMsg("CSV must contain at least a header row and one data row")
      return
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    const rows: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const values = line.split(",").map((v) => v.trim())
      const row: any = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ""
      })
      rows.push(row)
    }

    setParsedRows(rows)
  }

  const handleRunImport = async () => {
    if (parsedRows.length === 0) return
    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      const res = await bulkImportMutation.mutateAsync({
        rows: parsedRows,
        academicYearId: "00000000-0000-0000-0000-000000000001",
      })
      setImportReport(res)
    } catch (err: any) {
      setErrorMsg(err.message || "Bulk import failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keybindings: Esc dismisses, Cmd+Enter / Ctrl+Enter executes import
  useEscapeKey(onClose, isOpen)
  useSubmitKey(() => {
    if (importReport) {
      onSuccess()
    } else if (parsedRows.length > 0 && !isSubmitting) {
      handleRunImport()
    }
  }, { requireModifier: true, enabled: isOpen })

  // Report screen Enter/Esc dismissal
  useEffect(() => {
    if (!isOpen || !importReport) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault()
        onSuccess()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, importReport, onSuccess])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface border border-border-default rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-border-default bg-subtle">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Bulk Student Import</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Import students from CSV with server-side validation and atomic reporting
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary" title="Close (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {!importReport ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-secondary">Paste CSV Data:</span>
                  <button
                    type="button"
                    onClick={() => setCsvText(sampleTemplate)}
                    className="text-xs text-brand-primary hover:underline font-mono"
                  >
                    Insert Sample Template
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="firstName,lastName,dateOfBirth,gender,classId,sectionId..."
                  className="w-full p-3 font-mono text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-brand-primary text-text-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button size="dense" variant="secondary" onClick={handleParse}>
                  Preview & Validate ({parsedRows.length} rows loaded)
                </Button>
                {parsedRows.length > 0 && (
                  <Button
                    size="dense"
                    variant="primary"
                    disabled={isSubmitting}
                    onClick={handleRunImport}
                    className="bg-brand-primary text-black hover:bg-emerald-400"
                  >
                    {isSubmitting ? "Importing..." : `Execute Import (${parsedRows.length} rows)`}
                  </Button>
                )}
              </div>

              {parsedRows.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-border-default rounded-lg p-2 bg-canvas">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-default text-text-secondary">
                        <th className="p-1">#</th>
                        <th className="p-1">Name</th>
                        <th className="p-1">DOB</th>
                        <th className="p-1">Gender</th>
                        <th className="p-1">Guardian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r, i) => (
                        <tr key={i} className="border-b border-border-subtle text-text-primary">
                          <td className="p-1 font-mono text-[11px]">{i + 1}</td>
                          <td className="p-1 font-semibold">{r.firstName} {r.lastName}</td>
                          <td className="p-1">{r.dateOfBirth}</td>
                          <td className="p-1">{r.gender}</td>
                          <td className="p-1">{r.guardianName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Import Execution Complete!
                </div>
                <div className="text-xs text-emerald-400/90 mt-1">
                  Successfully imported: <strong>{importReport.success}</strong> / {importReport.total} records.
                  {importReport.failed > 0 && ` (${importReport.failed} failed)`}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="dense"
                  variant="primary"
                  className="bg-brand-primary text-black hover:bg-emerald-400"
                  onClick={onSuccess}
                >
                  Done & Refresh Directory
                  <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-mono text-black font-semibold">
                    ↵ or Esc
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
