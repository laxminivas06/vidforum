"use client"

import React, { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Button,
  Badge,
  Table,
  TableColumn,
  SlideOver,
  FormField,
  Input,
  Select,
  SelectOption,
  ProgressBar,
} from "@/components/ui"
import {
  Users,
  Plus,
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  X,
  FileText,
  Calendar,
  GraduationCap,
  Building,
  Trash2,
  Check,
  BarChart2,
  Activity,
} from "lucide-react"
import {
  useFaculty,
  useCreateStaff,
  useBulkCreateStaff,
  useDesignations,
  useCreateDesignation,
  useDeleteDesignation,
  useDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  useLeaveTypes,
  useCreateLeaveType,
  useLeaveRequests,
  useApplyLeave,
  useActionLeaveRequest,
  useStaffAttendance,
  useMarkAllStaffPresent,
  useRecordStaffAttendance,
  useHRReportSummary,
  checkDuplicateStaff,
  useFacultyWorkloads,
  useComputeStaffWorkload,
  FacultyWorkloadItem,
} from "@/lib/api/hooks"
import { FacultyMember } from "@/types"
import * as XLSX from "xlsx"

const GENDER_OPTIONS: SelectOption[] = [
  { label: "Select Gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
]

const TABS = [
  { id: "directory", label: "Staff Directory", icon: Users },
  { id: "workload", label: "Teaching Workload", icon: Activity },
  { id: "org", label: "Departments & Designations", icon: Building },
  { id: "leaves", label: "Leave Management", icon: Calendar },
  { id: "attendance", label: "Staff Attendance", icon: CheckCircle2 },
  { id: "reports", label: "HR Reports & Analytics", icon: BarChart2 },
] as const

type TabType = (typeof TABS)[number]["id"]

function HRMSStaffContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabQuery = (searchParams?.get("tab") as TabType) || null
  const statusQuery = searchParams?.get("status") || null

  const validTabs: TabType[] = ["directory", "workload", "org", "leaves", "attendance", "reports"]
  const initialTab: TabType = (tabQuery && validTabs.includes(tabQuery)) ? tabQuery : "directory"

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Status Filter from query (e.g. ?status=ACTIVE or ?status=ON_LEAVE)
  const statusFilter = statusQuery ? statusQuery.toUpperCase() : null

  // Synchronize activeTab with URL tab query
  useEffect(() => {
    if (tabQuery && validTabs.includes(tabQuery)) {
      setActiveTab(tabQuery)
    } else if (!tabQuery && !statusQuery) {
      setActiveTab("directory")
    }
  }, [tabQuery, statusQuery])

  const handleTabChange = (newTab: TabType) => {
    setConflictError(null)
    setActiveTab(newTab)
    if (newTab === "directory") {
      router.push("/hrms/staff", { scroll: false })
    } else {
      router.push(`/hrms/staff?tab=${newTab}`, { scroll: false })
    }
  }

  // --- Data Hooks ---
  const { data: staff = [], isLoading } = useFaculty()
  const { data: workloads = [], isLoading: isWorkloadsLoading } = useFacultyWorkloads()
  const computeWorkloadMutation = useComputeStaffWorkload()
  const createStaffMutation = useCreateStaff()
  const bulkCreateMutation = useBulkCreateStaff()

  const { data: designations = [] } = useDesignations()
  const createDesignationMutation = useCreateDesignation()
  const deleteDesignationMutation = useDeleteDesignation()

  const { data: departments = [] } = useDepartments()
  const createDepartmentMutation = useCreateDepartment()
  const deleteDepartmentMutation = useDeleteDepartment()

  const { data: leaveTypes = [] } = useLeaveTypes()
  const createLeaveTypeMutation = useCreateLeaveType()
  const { data: leaveRequests = [] } = useLeaveRequests()
  const applyLeaveMutation = useApplyLeave()
  const actionLeaveMutation = useActionLeaveRequest()

  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0])
  const { data: attendanceRecords = [] } = useStaffAttendance(attendanceDate)
  const markAllPresentMutation = useMarkAllStaffPresent()
  const recordAttendanceMutation = useRecordStaffAttendance()

  const { data: hrSummary } = useHRReportSummary()

  // --- Selection & Search ---
  const [selectedMember, setSelectedMember] = useState<FacultyMember | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // --- Single Staff Modal State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [qualification, setQualification] = useState("")
  const [university, setUniversity] = useState("")
  const [subjects, setSubjects] = useState("")
  const [experience, setExperience] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState("")
  const [designation, setDesignation] = useState("Lecturer")
  const [department, setDepartment] = useState("Academic Department")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  // --- Bulk Upload Modal State ---
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // --- Department & Designation Modals ---
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false)
  const [deptName, setDeptName] = useState("")
  const [deptCode, setDeptCode] = useState("")
  const [deptType, setDeptType] = useState("academic")

  const [isAddDesigModalOpen, setIsAddDesigModalOpen] = useState(false)
  const [desigName, setDesigName] = useState("")
  const [conflictError, setConflictError] = useState<string | null>(null)

  // --- Leave Modals ---
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false)
  const [leaveStaffId, setLeaveStaffId] = useState("")
  const [leaveTypeId, setLeaveTypeId] = useState("")
  const [leaveStartDate, setLeaveStartDate] = useState("")
  const [leaveEndDate, setLeaveEndDate] = useState("")
  const [leaveReason, setLeaveReason] = useState("")

  const [isAddLeaveTypeModalOpen, setIsAddLeaveTypeModalOpen] = useState(false)
  const [newLeaveTypeName, setNewLeaveTypeName] = useState("")
  const [newLeaveTypeDays, setNewLeaveTypeDays] = useState("12")

  // --- Live Duplicate Check Handler ---
  const handleDuplicateCheck = async (currentEmail?: string, currentName?: string, currentDob?: string) => {
    const e = currentEmail !== undefined ? currentEmail : email
    const n = currentName !== undefined ? currentName : name
    const d = currentDob !== undefined ? currentDob : dateOfBirth
    if (e?.includes("@") || (n?.trim() && d)) {
      try {
        const res = await checkDuplicateStaff({
          email: e?.trim() || undefined,
          name: n?.trim() || undefined,
          dateOfBirth: d || undefined,
        })
        if (res.isDuplicate) {
          setDuplicateWarning(`Potential duplicate detected: ${res.reasons.join(", ")}`)
        } else {
          setDuplicateWarning(null)
        }
      } catch {
        // Silently skip
      }
    } else {
      setDuplicateWarning(null)
    }
  }

  // --- Filtered staff list ---
  const filteredStaff = staff.filter((m) => {
    // 1. Status Filter from URL or selection
    if (statusFilter && m.status !== statusFilter) {
      return false
    }

    // 2. Text Search Query
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.employeeCode?.toLowerCase().includes(q) ||
      m.subjects?.toLowerCase().includes(q) ||
      m.qualification?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q) ||
      m.designation?.toLowerCase().includes(q)
    )
  })

  // 1. Single Staff Member Submit
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!name.trim()) errors.name = "Name is required"
    if (!phone.trim()) errors.phone = "Phone number is required"
    if (!email.trim()) errors.email = "Email address is required"
    else if (!email.includes("@")) errors.email = "Please enter a valid email"

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setFormErrors({})
      await createStaffMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        qualification: qualification.trim(),
        university: university.trim(),
        subjects: subjects.trim(),
        experience: experience.trim(),
        address: address.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        designation: designation.trim() || "Lecturer",
        department: department.trim() || "Academic Department",
      })

      setActionSuccess(`Staff member "${name}" was successfully added to the roster!`)
      setName("")
      setPhone("")
      setQualification("")
      setUniversity("")
      setSubjects("")
      setExperience("")
      setAddress("")
      setEmail("")
      setDateOfBirth("")
      setGender("")
      setDuplicateWarning(null)
      setTimeout(() => {
        setIsAddModalOpen(false)
        setActionSuccess(null)
      }, 1500)
    } catch (err: any) {
      setFormErrors({ submit: err.message || "Failed to add staff member" })
    }
  }

  // 2. Download Excel / CSV Sample Template
  const handleDownloadTemplate = (format: "xlsx" | "csv" = "xlsx") => {
    const templateHeaders = [
      {
        Name: "Dr. Aarti Raman",
        PhoneNumber: "+91 98450 11223",
        Qualification: "Ph.D in Mathematics",
        University: "Delhi University",
        Subjects: "Mathematics, Statistics",
        Experience: "7 Years",
        Address: "42 MG Road, Bangalore, India",
        Email: "aarti.raman@school.edu",
        DOB: "1989-08-14",
        Gender: "Female",
      },
      {
        Name: "Prof. Rajesh Kumar",
        PhoneNumber: "+91 97410 44556",
        Qualification: "M.Sc in Physics",
        University: "IIT Madras",
        Subjects: "Applied Physics",
        Experience: "5 Years",
        Address: "12 Science Block, Bangalore, India",
        Email: "rajesh.kumar@school.edu",
        DOB: "1991-03-22",
        Gender: "Male",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateHeaders)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff_Roster_Template")

    if (format === "csv") {
      XLSX.writeFile(workbook, "Staff_Roster_Template.csv")
    } else {
      XLSX.writeFile(workbook, "Staff_Roster_Template.xlsx")
    }
  }

  // 3. Parse Uploaded Excel or CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkError(null)
    setBulkSuccess(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: "binary" })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

        if (!rawJson || rawJson.length === 0) {
          setBulkError("The uploaded file contains no data rows.")
          return
        }

        const formatted = rawJson.map((row, index) => {
          const findVal = (keys: string[]) => {
            for (const k of Object.keys(row)) {
              const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
              if (keys.includes(cleanK)) return String(row[k]).trim()
            }
            return ""
          }

          const rowName = findVal(["name", "fullname", "staffname"])
          const rowPhone = findVal(["phonenumber", "phone", "mobile", "contact"])
          const rowQual = findVal(["qualification", "degree", "highestqualification"])
          const rowUniv = findVal(["university", "college", "institution"])
          const rowSub = findVal(["subjects", "subject", "teachingsubjects"])
          const rowExp = findVal(["experience", "experienceyears", "yearsofexperience", "experince"])
          const rowAddr = findVal(["address", "location", "residentialaddress"])
          const rowEmail = findVal(["email", "emailaddress", "mail"])
          const rowBod = findVal(["dateofbirth", "dob", "birthdate", "bod"])
          const rowGen = findVal(["gender", "sex"])

          const isValid = !!(rowName && rowEmail && rowPhone)

          return {
            rowNumber: index + 1,
            name: rowName,
            phone: rowPhone,
            qualification: rowQual,
            university: rowUniv,
            subjects: rowSub,
            experience: rowExp,
            address: rowAddr,
            email: rowEmail,
            dateOfBirth: rowBod,
            gender: rowGen,
            isValid,
          }
        })

        setParsedRows(formatted)
      } catch (err: any) {
        setBulkError("Error parsing file: " + (err.message || "Invalid spreadsheet"))
      }
    }
    reader.readAsBinaryString(file)
  }

  // 4. Bulk Upload Submit
  const handleBulkUploadSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid)
    if (validRows.length === 0) {
      setBulkError("No valid rows to import. Please check required fields.")
      return
    }

    try {
      setBulkError(null)
      await bulkCreateMutation.mutateAsync(
        validRows.map((r) => ({
          name: r.name,
          phone: r.phone,
          qualification: r.qualification,
          university: r.university,
          subjects: r.subjects,
          experience: r.experience,
          address: r.address,
          email: r.email,
          dateOfBirth: r.dateOfBirth || undefined,
          gender: r.gender || undefined,
        }))
      )

      setBulkSuccess(`Successfully imported ${validRows.length} staff members to the roster!`)
      setTimeout(() => {
        setIsBulkModalOpen(false)
        setParsedRows([])
        setBulkSuccess(null)
      }, 1800)
    } catch (err: any) {
      setBulkError(err.message || "Failed to process bulk upload.")
    }
  }

  // 5. Delete Department / Designation handlers with 409 conflict handling
  const handleDeleteDepartment = async (id: string) => {
    try {
      setConflictError(null)
      await deleteDepartmentMutation.mutateAsync(id)
    } catch (err: any) {
      setConflictError(err.message || "Failed to delete department")
    }
  }

  const handleDeleteDesignation = async (id: string) => {
    try {
      setConflictError(null)
      await deleteDesignationMutation.mutateAsync(id)
    } catch (err: any) {
      setConflictError(err.message || "Failed to delete designation")
    }
  }

  // --- Directory Table Columns ---
  const columns: TableColumn<FacultyMember>[] = [
    {
      header: "Staff Member",
      key: "name",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-text-primary text-xs">{item.name}</span>
          <span className="font-mono text-[11px] text-brand-primary">{item.employeeCode}</span>
        </div>
      ),
    },
    {
      header: "Role & Dept",
      key: "designation",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-primary">{item.designation || "Faculty"}</span>
          <span className="text-[11px] text-text-muted">{item.department || "Academic"}</span>
        </div>
      ),
    },
    {
      header: "Qualification & Subjects",
      key: "qualification",
      render: (item) => (
        <div className="flex flex-col max-w-xs">
          <span className="text-xs font-medium text-text-primary truncate">
            {item.qualification || "—"}
          </span>
          <span className="text-[11px] text-brand-primary truncate">{item.subjects || "—"}</span>
        </div>
      ),
    },
    {
      header: "Contact",
      key: "email",
      render: (item) => (
        <div className="flex flex-col">
          <div className="text-xs text-text-primary flex items-center gap-1 font-mono">
            <Mail className="w-2.5 h-2.5 text-text-muted shrink-0" />
            <span>{item.email}</span>
          </div>
          {item.phone && (
            <div className="text-[11px] text-text-muted font-mono flex items-center gap-1 mt-0.5">
              <Phone className="w-2.5 h-2.5 text-text-muted shrink-0" />
              <span>{item.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (item) => (
        <Badge variant={item.status === "ACTIVE" ? "positive" : item.status === "ON_LEAVE" ? "warning" : "neutral"}>
          {item.status === "ACTIVE" ? "Active" : item.status === "ON_LEAVE" ? "On Leave" : item.status || "Active"}
        </Badge>
      ),
    },
    {
      header: "Login Account",
      key: "hasAccount",
      render: (item) => (
        <div>
          {item.hasAccount ? (
            <Badge variant="positive">CREDENTIALS SET</Badge>
          ) : (
            <Badge variant="neutral">NO LOGIN CREDENTIALS</Badge>
          )}
        </div>
      ),
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <Button size="dense" variant="secondary" onClick={() => setSelectedMember(item)}>
          Profile
        </Button>
      ),
    },
  ]

  const workloadColumns: TableColumn<FacultyWorkloadItem>[] = [
    {
      header: "Instructor",
      key: "staff_name",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-text-primary text-xs">{item.staff_name}</span>
          <span className="font-mono text-[11px] text-brand-primary">{item.employee_code}</span>
        </div>
      ),
    },
    {
      header: "Department & Specialization",
      key: "department_name",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-primary">{item.department_name || "Science & Mathematics"}</span>
          <span className="text-[11px] text-text-muted">{item.specialization || item.qualification || "Core Faculty"}</span>
        </div>
      ),
    },
    {
      header: "Designation",
      key: "designation_name",
      render: (item) => (
        <span className="text-xs font-medium text-text-secondary">{item.designation_name || "Faculty Member"}</span>
      ),
    },
    {
      header: "Weekly Load",
      key: "periods_per_week",
      render: (item) => {
        const periods = item.periods_per_week || 0
        const variant = item.is_overloaded ? "error" : periods > 24 ? "warning" : "green"
        return (
          <div className="w-44 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-text-primary">{periods} Periods / wk</span>
              <span className="text-[10px] text-text-muted">Max 35</span>
            </div>
            <ProgressBar value={periods} max={35} variant={variant} height="sm" />
          </div>
        )
      },
    },
    {
      header: "Sections Assigned",
      key: "sections_count",
      render: (item) => (
        <Badge variant="neutral" className="font-mono text-xs">
          {item.sections_count || 0} Sections
        </Badge>
      ),
    },
    {
      header: "Workload Status",
      key: "is_overloaded",
      render: (item) => {
        if (item.is_overloaded) {
          return <Badge variant="error">Overloaded (&gt;28h)</Badge>
        }
        if ((item.periods_per_week || 0) === 0) {
          return <Badge variant="warning">On Leave / Idle</Badge>
        }
        return <Badge variant="positive">Balanced Load</Badge>
      },
    },
    {
      header: "Action",
      key: "staff_id",
      render: (item) => (
        <Button
          size="dense"
          variant="secondary"
          disabled={computeWorkloadMutation.isPending}
          onClick={async () => {
            try {
              await computeWorkloadMutation.mutateAsync({ staffId: item.staff_id })
              setActionSuccess(`Recomputed teaching workload for ${item.staff_name}!`)
            } catch (err: any) {
              setConflictError(err.message || "Failed to calculate workload")
            }
          }}
        >
          Recompute
        </Button>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Staff & HRMS"
      breadcrumbs={[
        { label: "Core" },
        { label: "HRMS" },
        {
          label:
            activeTab === "directory"
              ? statusFilter === "ACTIVE"
                ? "Active Faculty"
                : statusFilter === "ON_LEAVE"
                ? "On Leave / Sabbatical"
                : "Staff Directory"
              : activeTab === "workload"
              ? "Teaching Workload"
              : activeTab === "org"
              ? "Departments & Designations"
              : activeTab === "leaves"
              ? "Leave Management"
              : activeTab === "attendance"
              ? "Staff Attendance"
              : "HR Reports & Analytics",
        },
      ]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          {activeTab === "workload" && (
            <Button
              size="dense"
              variant="secondary"
              leadingIcon={<Activity className="w-3.5 h-3.5" />}
              onClick={() => {
                window.location.href = "/timetable/matrix"
              }}
            >
              Timetable Matrix →
            </Button>
          )}
          {activeTab === "directory" && (
            <>
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-brand-green" />}
                onClick={() => {
                  setBulkError(null)
                  setBulkSuccess(null)
                  setParsedRows([])
                  setIsBulkModalOpen(true)
                }}
              >
                Bulk Upload
              </Button>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setFormErrors({})
                  setActionSuccess(null)
                  setDuplicateWarning(null)
                  setIsAddModalOpen(true)
                }}
              >
                Add Staff Member
              </Button>
            </>
          )}

          {activeTab === "org" && (
            <>
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setDeptName("")
                  setDeptCode("")
                  setDeptType("academic")
                  setIsAddDeptModalOpen(true)
                }}
              >
                New Department
              </Button>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setDesigName("")
                  setIsAddDesigModalOpen(true)
                }}
              >
                New Designation
              </Button>
            </>
          )}

          {activeTab === "leaves" && (
            <>
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setNewLeaveTypeName("")
                  setNewLeaveTypeDays("12")
                  setIsAddLeaveTypeModalOpen(true)
                }}
              >
                New Leave Type
              </Button>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setLeaveStaffId(staff[0]?.id || "")
                  setLeaveTypeId(leaveTypes[0]?.id || "")
                  setLeaveStartDate(new Date().toISOString().split("T")[0])
                  setLeaveEndDate(new Date().toISOString().split("T")[0])
                  setLeaveReason("")
                  setIsApplyLeaveModalOpen(true)
                }}
              >
                Apply Leave
              </Button>
            </>
          )}

          {activeTab === "attendance" && (
            <Button
              size="dense"
              variant="primary"
              leadingIcon={<Check className="w-3.5 h-3.5" />}
              onClick={() => markAllPresentMutation.mutate(attendanceDate)}
              isLoading={markAllPresentMutation.isPending}
            >
              Mark All Present
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Staff Roster"
            value={staff.length.toString()}
            icon={<Users className="w-5 h-5 text-brand-primary" />}
            description="Verified staff in institution database"
          />
          <StatCard
            label="Active Faculty"
            value={staff.filter((s) => s.status === "ACTIVE").length.toString()}
            icon={<CheckCircle2 className="w-5 h-5 text-brand-green" />}
            description="Full-time teaching personnel"
          />
          <StatCard
            label="On Leave / Sabbatical"
            value={staff.filter((s) => s.status === "ON_LEAVE").length.toString()}
            icon={<Clock className="w-5 h-5 text-brand-warning" />}
            description="Staff on approved leave"
          />
          <StatCard
            label="Teaching Workload"
            value={workloads.length.toString()}
            icon={<Activity className="w-5 h-5 text-brand-blue" />}
            description={`${workloads.filter((w) => w.is_overloaded).length} overloaded (>28 periods)`}
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border-default gap-2 overflow-x-auto pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-hover"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Conflict Error Banner */}
        {conflictError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{conflictError}</span>
            </div>
            <button
              onClick={() => setConflictError(null)}
              className="p-1 rounded-md hover:bg-red-500/20 text-red-700 dark:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: STAFF DIRECTORY                                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "directory" && (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border-default">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search faculty by name, email, subjects, code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-canvas border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
                  />
                </div>

                {statusFilter && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-medium shrink-0">
                    <span>
                      Filtered:{" "}
                      <strong className="font-semibold">
                        {statusFilter === "ACTIVE"
                          ? "Active Faculty"
                          : statusFilter === "ON_LEAVE"
                          ? "On Leave / Sabbatical"
                          : statusFilter}
                      </strong>
                    </span>
                    <button
                      onClick={() => router.push("/hrms/staff", { scroll: false })}
                      className="p-0.5 hover:bg-brand-primary/20 rounded text-brand-primary cursor-pointer"
                      title="Clear status filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs text-text-secondary font-mono shrink-0">
                Showing <span className="font-bold text-text-primary">{filteredStaff.length}</span> of {staff.length} staff records
              </div>
            </div>

            <Table
              data={filteredStaff}
              columns={columns}
              keyExtractor={(item) => item.id}
              loading={isLoading}
              cardTitle={(item) => item.name}
              cardSubtitle={(item) => item.designation || "Staff Member"}
              cardBadge={(item) => (
                <Badge variant={item.hasAccount ? "positive" : "neutral"}>
                  {item.hasAccount ? "CREDENTIALS SET" : "PENDING LOGIN"}
                </Badge>
              )}
            />
          </>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB: TEACHING WORKLOAD & FACULTY LOAD DISTRIBUTION            */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "workload" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Teaching Faculty"
                value={workloads.length.toString()}
                icon={<Users className="w-5 h-5 text-brand-primary" />}
                description="Assigned academic instructors"
              />
              <StatCard
                label="Avg Periods / Week"
                value={
                  workloads.length > 0
                    ? (
                        workloads.reduce((acc, w) => acc + (w.periods_per_week || 0), 0) /
                        workloads.length
                      ).toFixed(1)
                    : "0"
                }
                icon={<Clock className="w-5 h-5 text-brand-blue" />}
                description="Per instructor average"
              />
              <StatCard
                label="Overloaded (>28h)"
                value={workloads.filter((w) => w.is_overloaded).length.toString()}
                icon={<AlertCircle className="w-5 h-5 text-status-error" />}
                description="Exceeding weekly threshold"
              />
              <StatCard
                label="On Leave / Available"
                value={workloads.filter((w) => (w.periods_per_week || 0) === 0).length.toString()}
                icon={<CheckCircle2 className="w-5 h-5 text-status-warning" />}
                description="Zero current periods assigned"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-primary" />
                    Faculty Teaching Workload Matrix
                  </CardTitle>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Live period allocations, section loads, and statutory teaching capacity monitoring.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Table
                  data={workloads}
                  columns={workloadColumns}
                  keyExtractor={(item) => item.staff_id}
                  loading={isWorkloadsLoading}
                  cardTitle={(item) => item.staff_name}
                  cardSubtitle={(item) => `${item.department_name || 'Academic'} • ${item.periods_per_week}h/week`}
                  cardBadge={(item) => (
                    <Badge variant={item.is_overloaded ? "error" : item.periods_per_week === 0 ? "warning" : "positive"}>
                      {item.is_overloaded ? "OVERLOADED" : item.periods_per_week === 0 ? "ON LEAVE" : "BALANCED"}
                    </Badge>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: DEPARTMENTS & DESIGNATIONS                            */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "org" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Departments Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building className="w-4 h-4 text-brand-primary" />
                    Departments ({departments.length})
                  </CardTitle>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Academic and administrative faculties
                  </p>
                </div>
                <Button
                  size="dense"
                  variant="secondary"
                  leadingIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddDeptModalOpen(true)}
                >
                  Add Dept
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  {departments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-text-muted">
                      No departments configured yet.
                    </div>
                  ) : (
                    departments.map((dept: any) => (
                      <div
                        key={dept.id}
                        className="p-3 rounded-xl bg-canvas border border-border-default flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary text-xs">{dept.name}</span>
                            <Badge variant="neutral" size="sm">
                              {dept.code}
                            </Badge>
                            <Badge variant="info" size="sm">
                              {dept.department_type || "academic"}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-text-secondary mt-1">
                            Staff assigned: <span className="font-semibold text-text-primary">{dept.staff_count ?? 0}</span>
                          </div>
                        </div>
                        <Button
                          size="dense"
                          variant="ghost"
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="text-text-muted hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Designations Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-accent-blue" />
                    Designations ({designations.length})
                  </CardTitle>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Official faculty and employee titles
                  </p>
                </div>
                <Button
                  size="dense"
                  variant="secondary"
                  leadingIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddDesigModalOpen(true)}
                >
                  Add Designation
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  {designations.length === 0 ? (
                    <div className="text-center py-8 text-xs text-text-muted">
                      No designations configured yet.
                    </div>
                  ) : (
                    designations.map((desig: any) => (
                      <div
                        key={desig.id}
                        className="p-3 rounded-xl bg-canvas border border-border-default flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-text-primary text-xs">{desig.name}</span>
                          <div className="text-[11px] text-text-secondary mt-1">
                            Staff assigned: <span className="font-semibold text-text-primary">{desig.staff_count ?? 0}</span>
                          </div>
                        </div>
                        <Button
                          size="dense"
                          variant="ghost"
                          onClick={() => handleDeleteDesignation(desig.id)}
                          className="text-text-muted hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 3: LEAVE MANAGEMENT                                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "leaves" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Leave Requests"
                value={leaveRequests.length.toString()}
                icon={<Calendar className="w-5 h-5 text-brand-primary" />}
              />
              <StatCard
                label="Pending Approval"
                value={leaveRequests.filter((l: any) => l.status === "pending").length.toString()}
                icon={<Clock className="w-5 h-5 text-brand-warning" />}
              />
              <StatCard
                label="Approved"
                value={leaveRequests.filter((l: any) => l.status === "approved").length.toString()}
                icon={<CheckCircle2 className="w-5 h-5 text-brand-green" />}
              />
              <StatCard
                label="Leave Types"
                value={leaveTypes.length.toString()}
                icon={<FileText className="w-5 h-5 text-accent-blue" />}
              />
            </div>

            {/* Leave Requests Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold">Leave Requests & Workflows</CardTitle>
                <Button
                  size="dense"
                  variant="primary"
                  leadingIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsApplyLeaveModalOpen(true)}
                >
                  Submit Leave Request
                </Button>
              </CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-10 text-xs text-text-muted">
                    No leave requests found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-default text-text-secondary font-medium">
                          <th className="py-2.5 px-3">Staff Member</th>
                          <th className="py-2.5 px-3">Leave Type</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Days</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/50">
                        {leaveRequests.map((req: any) => (
                          <tr key={req.id} className="hover:bg-subtle/50">
                            <td className="py-3 px-3 font-semibold text-text-primary">
                              {req.staff_name || "Faculty Member"}
                            </td>
                            <td className="py-3 px-3 text-text-secondary">{req.leave_type_name || "Leave"}</td>
                            <td className="py-3 px-3 font-mono text-text-muted">
                              {req.start_date} → {req.end_date}
                            </td>
                            <td className="py-3 px-3 font-semibold text-text-primary">{req.total_days}</td>
                            <td className="py-3 px-3 text-text-muted truncate max-w-xs">{req.reason || "—"}</td>
                            <td className="py-3 px-3">
                              <Badge
                                variant={
                                  req.status === "approved"
                                    ? "positive"
                                    : req.status === "rejected"
                                    ? "error"
                                    : "neutral"
                                }
                              >
                                {req.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right space-x-2">
                              {req.status === "pending" && (
                                <>
                                  <Button
                                    size="dense"
                                    variant="primary"
                                    onClick={() =>
                                      actionLeaveMutation.mutate({
                                        id: req.id,
                                        action: "approved",
                                        reviewNotes: "Approved by Administrator",
                                      })
                                    }
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="dense"
                                    variant="secondary"
                                    onClick={() =>
                                      actionLeaveMutation.mutate({
                                        id: req.id,
                                        action: "rejected",
                                        reviewNotes: "Declined by Administrator",
                                      })
                                    }
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leave Types Configuration */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold">Configured Leave Types</CardTitle>
                <Button
                  size="dense"
                  variant="secondary"
                  leadingIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddLeaveTypeModalOpen(true)}
                >
                  Add Type
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {leaveTypes.map((lt: any) => (
                    <div
                      key={lt.id}
                      className="p-3 rounded-xl bg-canvas border border-border-default flex items-center justify-between"
                    >
                      <span className="font-semibold text-text-primary text-xs">{lt.name}</span>
                      <Badge variant="info">
                        {lt.max_days_per_year ? `${lt.max_days_per_year} Days/Yr` : "Unlimited"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 4: STAFF ATTENDANCE                                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border-default">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-text-secondary">Attendance Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-canvas border border-border-default text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Check className="w-3.5 h-3.5" />}
                onClick={() => markAllPresentMutation.mutate(attendanceDate)}
                isLoading={markAllPresentMutation.isPending}
              >
                Mark All Present Today
              </Button>
            </div>

            {/* Attendance Roster Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Daily Roll Call ({attendanceDate})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border-default text-text-secondary font-medium">
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Staff Name</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/50">
                      {staff.map((member) => {
                        const rec = attendanceRecords.find((a: any) => a.staff_id === member.id)
                        const status = rec?.status || "unrecorded"
                        return (
                          <tr key={member.id} className="hover:bg-subtle/50">
                            <td className="py-3 px-3 font-mono text-brand-primary">{member.employeeCode}</td>
                            <td className="py-3 px-3 font-semibold text-text-primary">{member.name}</td>
                            <td className="py-3 px-3 text-text-muted">{member.designation || "Faculty"}</td>
                            <td className="py-3 px-3">
                              <Badge
                                variant={
                                  status === "present"
                                    ? "positive"
                                    : status === "absent"
                                    ? "error"
                                    : status === "half_day"
                                    ? "info"
                                    : "neutral"
                                }
                              >
                                {status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-right space-x-1.5">
                              <Button
                                size="dense"
                                variant={status === "present" ? "primary" : "secondary"}
                                onClick={() =>
                                  recordAttendanceMutation.mutate({
                                    staffId: member.id,
                                    date: attendanceDate,
                                    status: "present",
                                  })
                                }
                              >
                                Present
                              </Button>
                              <Button
                                size="dense"
                                variant={status === "absent" ? "primary" : "secondary"}
                                onClick={() =>
                                  recordAttendanceMutation.mutate({
                                    staffId: member.id,
                                    date: attendanceDate,
                                    status: "absent",
                                  })
                                }
                              >
                                Absent
                              </Button>
                              <Button
                                size="dense"
                                variant={status === "half_day" ? "primary" : "secondary"}
                                onClick={() =>
                                  recordAttendanceMutation.mutate({
                                    staffId: member.id,
                                    date: attendanceDate,
                                    status: "half_day",
                                  })
                                }
                              >
                                Half Day
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 5: HR REPORTS & ANALYTICS                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Headcount"
                value={(hrSummary?.headcount?.total ?? staff.length).toString()}
                icon={<Users className="w-5 h-5 text-brand-primary" />}
              />
              <StatCard
                label="Teaching Staff"
                value={(hrSummary?.headcount?.teaching ?? staff.length).toString()}
                icon={<GraduationCap className="w-5 h-5 text-brand-green" />}
              />
              <StatCard
                label="Non-Teaching Staff"
                value={(hrSummary?.headcount?.nonTeaching ?? 0).toString()}
                icon={<Briefcase className="w-5 h-5 text-accent-blue" />}
              />
              <StatCard
                label="Active Departments"
                value={(hrSummary?.byDepartment?.length ?? departments.length).toString()}
                icon={<Building className="w-5 h-5 text-brand-warning" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Department Headcount Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(hrSummary?.byDepartment || departments).map((d: any) => {
                      const count = d.staff_count ?? 0
                      const total = hrSummary?.headcount?.total || staff.length || 1
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={d.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-text-primary">{d.name || d.department_name}</span>
                            <span className="text-text-secondary">
                              {count} staff ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-subtle rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-primary rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Experience Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Experience Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Junior (< 2 Years)", count: hrSummary?.experienceDistribution?.lessThan2Yrs ?? 2 },
                      { label: "Mid-Level (2 - 5 Years)", count: hrSummary?.experienceDistribution?.twoToFiveYrs ?? 5 },
                      { label: "Senior (5 - 10 Years)", count: hrSummary?.experienceDistribution?.fiveToTenYrs ?? 6 },
                      { label: "Veteran (10+ Years)", count: hrSummary?.experienceDistribution?.moreThanTenYrs ?? 2 },
                    ].map((exp, idx) => {
                      const total = hrSummary?.headcount?.total || staff.length || 1
                      const pct = Math.round((exp.count / total) * 100)
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-text-primary">{exp.label}</span>
                            <span className="text-text-secondary">
                              {exp.count} staff ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-subtle rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-blue rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ADD STAFF MEMBER MODAL WITH LIVE DUPLICATE WARNING         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-subtle">
              <div>
                <h2 className="text-base font-bold text-text-primary">Add New Staff Member</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Enter personal, contact, and academic credentials for faculty onboarding
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {actionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {duplicateWarning && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              {formErrors.submit && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required error={formErrors.name}>
                  <Input
                    placeholder="e.g. Dr. Revathi Raman"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      handleDuplicateCheck(email, e.target.value, dateOfBirth)
                    }}
                  />
                </FormField>

                <FormField label="Phone Number" required error={formErrors.phone}>
                  <Input
                    placeholder="e.g. +91 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </FormField>

                <FormField label="Email Address" required error={formErrors.email}>
                  <Input
                    type="email"
                    placeholder="e.g. revathi.raman@springfield.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      handleDuplicateCheck(e.target.value, name, dateOfBirth)
                    }}
                  />
                </FormField>

                <FormField label="Qualification">
                  <Input
                    placeholder="e.g. Ph.D, M.Sc Mathematics, B.Ed"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                  />
                </FormField>

                <FormField label="University">
                  <Input
                    placeholder="e.g. Delhi University / Stanford"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </FormField>

                <FormField label="Teaching Subjects">
                  <Input
                    placeholder="e.g. Mathematics, Calculus, Geometry"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                  />
                </FormField>

                <FormField label="Teaching Experience">
                  <Input
                    placeholder="e.g. 8 Years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </FormField>

                <FormField label="Date of Birth (DOB)">
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value)
                      handleDuplicateCheck(email, name, e.target.value)
                    }}
                  />
                </FormField>

                <FormField label="Gender">
                  <Select
                    options={GENDER_OPTIONS}
                    value={gender}
                    onChange={(val) => setGender(val)}
                  />
                </FormField>

                <FormField label="Designation">
                  <Input
                    placeholder="e.g. Head of Mathematics"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Residential / Campus Address">
                <Input
                  placeholder="e.g. Faculty Enclave, Quarter #14, Campus Green"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </FormField>

              <div className="pt-4 border-t border-border-default flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={createStaffMutation.isPending}>
                  Add Staff Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. BULK UPLOAD MODAL                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-4xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-subtle">
              <div>
                <h2 className="text-base font-bold text-text-primary">Bulk Staff Onboarding</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Upload an Excel (.xlsx) or CSV file with teacher and staff details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="p-4 rounded-xl bg-canvas border border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-text-primary">Download Sample Spreadsheet Template</h3>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Pre-formatted with Name, Phone, Qualification, University, Subjects, Experience, Address, Email, DOB, Gender
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="dense"
                    variant="secondary"
                    leadingIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownloadTemplate("xlsx")}
                  >
                    Download Excel (.xlsx)
                  </Button>
                  <Button
                    size="dense"
                    variant="secondary"
                    leadingIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownloadTemplate("csv")}
                  >
                    Download CSV (.csv)
                  </Button>
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border-default hover:border-brand-primary/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-subtle/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-brand-primary" />
                <span className="text-xs font-semibold text-text-primary">
                  Click to select or drag and drop your spreadsheet here
                </span>
                <span className="text-[11px] text-text-muted">Supports .xlsx and .csv files</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>

              {bulkSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{bulkSuccess}</span>
                </div>
              )}

              {bulkError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      Parsed Preview: {parsedRows.length} Rows Detected
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      {parsedRows.filter((r) => r.isValid).length} Valid •{" "}
                      {parsedRows.filter((r) => !r.isValid).length} Invalid
                    </span>
                  </div>

                  <div className="border border-border-default rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-subtle text-text-secondary sticky top-0 border-b border-border-default">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Subjects</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/50 font-mono text-[11px]">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className={r.isValid ? "bg-canvas" : "bg-red-500/5 text-red-600"}>
                            <td className="py-2 px-3">{r.rowNumber}</td>
                            <td className="py-2 px-3 font-semibold">{r.name || "Missing Name"}</td>
                            <td className="py-2 px-3">{r.phone || "Missing Phone"}</td>
                            <td className="py-2 px-3">{r.email || "Missing Email"}</td>
                            <td className="py-2 px-3">{r.subjects || "—"}</td>
                            <td className="py-2 px-3">
                              {r.isValid ? (
                                <Badge variant="positive" size="sm">
                                  READY
                                </Badge>
                              ) : (
                                <Badge variant="error" size="sm">
                                  REQUIRED FIELDS MISSING
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border-default flex items-center justify-end gap-3 bg-subtle">
              <Button type="button" variant="secondary" onClick={() => setIsBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleBulkUploadSubmit}
                isLoading={bulkCreateMutation.isPending}
                disabled={parsedRows.filter((r) => r.isValid).length === 0}
              >
                Import {parsedRows.filter((r) => r.isValid).length} Valid Records
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. ADD DEPARTMENT MODAL                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border-default shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-text-primary">Add Department</h2>
              <button onClick={() => setIsAddDeptModalOpen(false)} className="p-1 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!deptName.trim() || !deptCode.trim()) return
                await createDepartmentMutation.mutateAsync({
                  name: deptName.trim(),
                  code: deptCode.trim().toUpperCase(),
                  departmentType: deptType,
                })
                setIsAddDeptModalOpen(false)
              }}
              className="space-y-4"
            >
              <FormField label="Department Name" required>
                <Input placeholder="e.g. Science Faculty" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
              </FormField>
              <FormField label="Department Code" required>
                <Input placeholder="e.g. SCI" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} />
              </FormField>
              <FormField label="Department Type">
                <Select
                  options={[
                    { label: "Academic", value: "academic" },
                    { label: "Administrative", value: "administrative" },
                    { label: "Support", value: "support" },
                  ]}
                  value={deptType}
                  onChange={(val) => setDeptType(val)}
                />
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddDeptModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={createDepartmentMutation.isPending}>
                  Create Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. ADD DESIGNATION MODAL                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAddDesigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border-default shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-text-primary">Add Designation</h2>
              <button onClick={() => setIsAddDesigModalOpen(false)} className="p-1 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!desigName.trim()) return
                await createDesignationMutation.mutateAsync(desigName.trim())
                setIsAddDesigModalOpen(false)
              }}
              className="space-y-4"
            >
              <FormField label="Designation Name" required>
                <Input placeholder="e.g. Senior Professor" value={desigName} onChange={(e) => setDesigName(e.target.value)} />
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddDesigModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={createDesignationMutation.isPending}>
                  Create Designation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. APPLY LEAVE MODAL                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isApplyLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border-default shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-text-primary">Submit Leave Request</h2>
              <button onClick={() => setIsApplyLeaveModalOpen(false)} className="p-1 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!leaveStaffId || !leaveTypeId || !leaveStartDate || !leaveEndDate) return
                await applyLeaveMutation.mutateAsync({
                  staffId: leaveStaffId,
                  leaveTypeId,
                  startDate: leaveStartDate,
                  endDate: leaveEndDate,
                  reason: leaveReason || "Personal / Medical Leave",
                })
                setIsApplyLeaveModalOpen(false)
              }}
              className="space-y-4"
            >
              <FormField label="Staff Member" required>
                <Select
                  options={staff.map((s) => ({ label: `${s.name} (${s.employeeCode})`, value: s.id }))}
                  value={leaveStaffId}
                  onChange={(val) => setLeaveStaffId(val)}
                />
              </FormField>
              <FormField label="Leave Type" required>
                <Select
                  options={leaveTypes.map((lt: any) => ({ label: lt.name, value: lt.id }))}
                  value={leaveTypeId}
                  onChange={(val) => setLeaveTypeId(val)}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Date" required>
                  <Input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} />
                </FormField>
                <FormField label="End Date" required>
                  <Input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} />
                </FormField>
              </div>
              <FormField label="Reason">
                <Input placeholder="Reason for leave" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsApplyLeaveModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={applyLeaveMutation.isPending}>
                  Submit Leave
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. ADD LEAVE TYPE MODAL                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAddLeaveTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border-default shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-text-primary">Add Leave Type</h2>
              <button onClick={() => setIsAddLeaveTypeModalOpen(false)} className="p-1 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newLeaveTypeName.trim()) return
                await createLeaveTypeMutation.mutateAsync({
                  name: newLeaveTypeName.trim(),
                  maxDaysPerYear: parseInt(newLeaveTypeDays) || 12,
                })
                setIsAddLeaveTypeModalOpen(false)
              }}
              className="space-y-4"
            >
              <FormField label="Leave Type Name" required>
                <Input placeholder="e.g. Sabbatical Leave" value={newLeaveTypeName} onChange={(e) => setNewLeaveTypeName(e.target.value)} />
              </FormField>
              <FormField label="Allowed Days Per Year" required>
                <Input type="number" value={newLeaveTypeDays} onChange={(e) => setNewLeaveTypeDays(e.target.value)} />
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddLeaveTypeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={createLeaveTypeMutation.isPending}>
                  Create Leave Type
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. SLIDE-OVER STAFF PROFILE DETAILS                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <SlideOver
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name || "Staff Member Details"}
      >
        {selectedMember && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Full Name:</span>
                <span className="font-semibold text-text-primary text-sm">{selectedMember.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Employee Code:</span>
                <span className="font-mono font-semibold text-text-primary">{selectedMember.employeeCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Designation:</span>
                <span className="font-medium text-text-primary">{selectedMember.designation || "Faculty"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Department:</span>
                <span className="font-medium text-text-primary">{selectedMember.department || "Academic"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Gender:</span>
                <span className="font-medium text-text-primary">{selectedMember.gender || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Date of Birth (DOB):</span>
                <span className="font-mono text-text-primary">{selectedMember.dateOfBirth || "—"}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col gap-2.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-text-primary font-mono">
                Academic & Qualifications
              </span>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Highest Degree:</span>
                <span className="font-semibold text-text-primary">{selectedMember.qualification || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">University:</span>
                <span className="font-medium text-text-primary">{selectedMember.university || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Teaching Subjects:</span>
                <span className="font-semibold text-brand-primary">{selectedMember.subjects || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Teaching Experience:</span>
                <span className="font-medium text-text-primary">{selectedMember.experience || "—"}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col gap-2.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-text-primary font-mono">
                Contact & Address
              </span>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Email:</span>
                <span className="font-mono text-text-primary">{selectedMember.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Phone:</span>
                <span className="font-mono text-text-primary">{selectedMember.phone || "—"}</span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-text-secondary">Residential Address:</span>
                <span className="text-text-primary bg-subtle p-2 rounded-lg border border-border-subtle">
                  {selectedMember.address || "No address on file."}
                </span>
              </div>
            </div>

            {selectedMember.assignedClasses && selectedMember.assignedClasses.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold uppercase text-text-primary font-mono tracking-wider text-[11px]">
                  Assigned Subject Sections
                </span>
                {selectedMember.assignedClasses.map((ac, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-subtle border border-border-default flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-text-primary">
                        {ac.grade} • {ac.section}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {ac.subject} (Room {ac.room})
                      </div>
                    </div>
                    <span className="text-xs font-mono text-text-muted">{ac.schedule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}

export default function HRMSStaffPage() {
  return (
    <Suspense fallback={null}>
      <HRMSStaffContent />
    </Suspense>
  )
}
