"use client"

import React, { useState, useRef } from "react"
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
  MapPin,
  Building,
} from "lucide-react"
import { useFaculty, useCreateStaff, useBulkCreateStaff } from "@/lib/api/hooks"
import { FacultyMember } from "@/types"
import * as XLSX from "xlsx"

const GENDER_OPTIONS: SelectOption[] = [
  { label: "Select Gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
]

export default function HRMSStaffPage() {
  const { data: staff = [], isLoading } = useFaculty()
  const createStaffMutation = useCreateStaff()
  const bulkCreateMutation = useBulkCreateStaff()

  const [selectedMember, setSelectedMember] = useState<FacultyMember | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Add Staff Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [qualification, setQualification] = useState("")
  const [university, setUniversity] = useState("")
  const [subjects, setSubjects] = useState("")
  const [experience, setExperience] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState("")
  const [bod, setBod] = useState("")
  const [gender, setGender] = useState("")
  const [designation, setDesignation] = useState("Lecturer")
  const [department, setDepartment] = useState("Academic Department")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Filtered staff list
  const filteredStaff = staff.filter((m) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.employeeCode?.toLowerCase().includes(q) ||
      m.subjects?.toLowerCase().includes(q) ||
      m.qualification?.toLowerCase().includes(q)
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
        dateOfBirth: bod || undefined,
        gender: gender || undefined,
        designation: designation.trim() || "Lecturer",
        department: department.trim() || "Academic Department",
      })

      setActionSuccess(`Staff member "${name}" was successfully added to the roster!`)
      // Reset form
      setName("")
      setPhone("")
      setQualification("")
      setUniversity("")
      setSubjects("")
      setExperience("")
      setAddress("")
      setEmail("")
      setBod("")
      setGender("")
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

        // Normalize columns matching user specification
        const formatted = rawJson.map((row, index) => {
          // Find fields regardless of casing
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
          const rowExp = findVal(["experince", "experience", "yearsofexperience"])
          const rowAddr = findVal(["address", "location", "residentialaddress"])
          const rowEmail = findVal(["email", "emailaddress", "mail"])
          const rowBod = findVal(["bod", "dob", "dateofbirth", "birthdate"])
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
        setBulkError("Failed to parse file: " + (err.message || "Invalid spreadsheet format"))
      }
    }

    reader.readAsBinaryString(file)
  }

  // 4. Submit Bulk Staff Members
  const handleBulkSubmit = async () => {
    const validItems = parsedRows.filter((r) => r.isValid)
    if (validItems.length === 0) {
      setBulkError("No valid rows to import. Please check that Name, Phone, and Email are provided.")
      return
    }

    try {
      setBulkError(null)
      const res = await bulkCreateMutation.mutateAsync(
        validItems.map((r) => ({
          name: r.name,
          phone: r.phone,
          qualification: r.qualification,
          university: r.university,
          subjects: r.subjects,
          experience: r.experience,
          address: r.address,
          email: r.email,
          dateOfBirth: r.dateOfBirth,
          gender: r.gender,
        }))
      )

      setBulkSuccess(`Successfully imported ${res.createdCount || validItems.length} staff members into the roster!`)
      setTimeout(() => {
        setIsBulkModalOpen(false)
        setParsedRows([])
        setBulkSuccess(null)
      }, 1800)
    } catch (err: any) {
      setBulkError(err.message || "Bulk import failed. Please verify the spreadsheet data.")
    }
  }

  const columns: TableColumn<FacultyMember>[] = [
    {
      header: "Staff Member",
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
          <div className="text-xs text-text-secondary font-mono">{item.employeeCode}</div>
        </div>
      ),
    },
    {
      header: "Academic & University",
      key: "qualification",
      render: (item) => (
        <div>
          <div className="text-xs font-medium text-text-primary flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-brand-primary shrink-0" />
            <span>{item.qualification || "Faculty"}</span>
          </div>
          <div className="text-[11px] text-text-secondary truncate max-w-[180px]">
            {item.university || "Springfield Campus"}
          </div>
        </div>
      ),
    },
    {
      header: "Subjects & Experience",
      key: "subjects",
      render: (item) => (
        <div>
          <div className="text-xs font-semibold text-text-primary">
            {item.subjects || "General Curriculum"}
          </div>
          <div className="text-[11px] text-text-secondary font-mono">
            Exp: {item.experience || "Active Faculty"}
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      key: "email",
      render: (item) => (
        <div>
          <div className="text-xs text-text-secondary font-mono flex items-center gap-1">
            <Mail className="w-3 h-3 text-text-muted shrink-0" />
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

  return (
    <AppShell
      pageTitle="Staff Roster & HRMS"
      breadcrumbs={[{ label: "Core" }, { label: "HRMS" }, { label: "Staff Roster" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          {/* Bulk Upload Button */}
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
            Bulk Upload (Excel / CSV)
          </Button>

          {/* Add Staff Member Button */}
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setFormErrors({})
              setActionSuccess(null)
              setIsAddModalOpen(true)
            }}
          >
            Add Staff Member
          </Button>
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
            label="Accounts Provisioned"
            value={staff.filter((s) => s.hasAccount).length.toString()}
            icon={<Briefcase className="w-5 h-5 text-accent-blue" />}
            description="Login User ID & Password configured"
          />
          <StatCard
            label="Pending Login Setup"
            value={staff.filter((s) => !s.hasAccount).length.toString()}
            icon={<Clock className="w-5 h-5 text-brand-warning" />}
            description="Needs credentials in Admin workspace"
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border-default">
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

          <div className="text-xs text-text-secondary font-mono">
            Showing <span className="font-bold text-text-primary">{filteredStaff.length}</span> of {staff.length} staff records
          </div>
        </div>

        {/* Staff Table */}
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
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ADD STAFF MEMBER MODAL WITH ALL 10 INPUT FIELDS            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleAddStaffSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {actionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {formErrors.submit && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              {/* 2-Column Grid of 10 Required Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Name */}
                <FormField label="Full Name" required error={formErrors.name}>
                  <Input
                    placeholder="e.g. Dr. Revathi Raman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormField>

                {/* 2. PhoneNumber */}
                <FormField label="Phone Number" required error={formErrors.phone}>
                  <Input
                    placeholder="e.g. +91 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </FormField>

                {/* 3. Email */}
                <FormField label="Email Address" required error={formErrors.email}>
                  <Input
                    type="email"
                    placeholder="e.g. revathi.raman@springfield.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormField>

                {/* 4. Qualification */}
                <FormField label="Qualification">
                  <Input
                    placeholder="e.g. Ph.D, M.Sc Mathematics, B.Ed"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                  />
                </FormField>

                {/* 5. University */}
                <FormField label="University">
                  <Input
                    placeholder="e.g. Delhi University / Stanford"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </FormField>

                {/* 6. Subjects */}
                <FormField label="Teaching Subjects">
                  <Input
                    placeholder="e.g. Mathematics, Calculus, Geometry"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                  />
                </FormField>

                {/* 7. Experience */}
                <FormField label="Teaching Experience">
                  <Input
                    placeholder="e.g. 8 Years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </FormField>

                {/* 8. BOD (Date of Birth) */}
                <FormField label="Birth of Date (DOB)">
                  <Input
                    type="date"
                    value={bod}
                    onChange={(e) => setBod(e.target.value)}
                  />
                </FormField>

                {/* 9. Gender */}
                <FormField label="Gender">
                  <Select
                    options={GENDER_OPTIONS}
                    value={gender}
                    onChange={(val) => setGender(val)}
                  />
                </FormField>

                {/* 10. Designation */}
                <FormField label="Designation">
                  <Input
                    placeholder="e.g. Senior Lecturer / Professor"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </FormField>
              </div>

              {/* Address (Full Width) */}
              <FormField label="Residential / Mailing Address">
                <Input
                  placeholder="e.g. 42 MG Road, Koramangala, Bangalore - 560034"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </FormField>

              {/* Department */}
              <FormField label="Department">
                <Input
                  placeholder="e.g. Department of Mathematics & Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </FormField>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-border-default flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  isLoading={createStaffMutation.isPending}
                >
                  Save Staff Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. BULK UPLOADING MODAL (EXCEL / CSV WITH DOWNLOAD TEMPLATE)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-subtle">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-green" />
                <div>
                  <h2 className="text-base font-bold text-text-primary">Bulk Add Staff Members</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Upload an Excel (.xlsx) or CSV file with the required columns
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-canvas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Template Download Prompt */}
              <div className="p-4 rounded-xl bg-subtle border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-primary" />
                    <span>Download Official Spreadsheet Template</span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Pre-formatted with Name, PhoneNumber, Qualification, University, Subjects, Experience, Address, Email, DOB, Gender
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="dense"
                    variant="secondary"
                    leadingIcon={<Download className="w-3 h-3" />}
                    onClick={() => handleDownloadTemplate("xlsx")}
                  >
                    Excel (.xlsx)
                  </Button>
                  <Button
                    size="dense"
                    variant="secondary"
                    leadingIcon={<Download className="w-3 h-3" />}
                    onClick={() => handleDownloadTemplate("csv")}
                  >
                    CSV (.csv)
                  </Button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-border-default hover:border-brand-primary rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-canvas"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-subtle flex items-center justify-center text-brand-primary mb-3 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-text-primary">
                  Click to select or drag and drop your Excel or CSV sheet
                </div>
                <p className="text-[11px] text-text-secondary mt-1">
                  Supported formats: .xlsx, .xls, .csv (Max 100 rows per batch)
                </p>
              </div>

              {/* Status Alerts */}
              {bulkError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {bulkSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{bulkSuccess}</span>
                </div>
              )}

              {/* Parsed Rows Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                      Parsed Spreadsheet Preview ({parsedRows.length} Rows)
                    </span>
                    <span className="text-xs text-text-secondary">
                      {parsedRows.filter((r) => r.isValid).length} ready to import
                    </span>
                  </div>

                  <div className="border border-border-default rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-subtle border-b border-border-default sticky top-0 font-mono text-[11px] text-text-secondary">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">Qualification</th>
                          <th className="p-2.5">University</th>
                          <th className="p-2.5">Subjects</th>
                          <th className="p-2.5">Gender</th>
                          <th className="p-2.5">Validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-subtle/50">
                            <td className="p-2.5 font-mono text-text-secondary">#{r.rowNumber}</td>
                            <td className="p-2.5 font-medium text-text-primary">{r.name || "—"}</td>
                            <td className="p-2.5 font-mono text-text-secondary">{r.email || "—"}</td>
                            <td className="p-2.5 font-mono text-text-secondary">{r.phone || "—"}</td>
                            <td className="p-2.5 text-text-secondary">{r.qualification || "—"}</td>
                            <td className="p-2.5 text-text-secondary">{r.university || "—"}</td>
                            <td className="p-2.5 text-text-secondary">{r.subjects || "—"}</td>
                            <td className="p-2.5 text-text-secondary">{r.gender || "—"}</td>
                            <td className="p-2.5">
                              {r.isValid ? (
                                <Badge variant="positive">VALID</Badge>
                              ) : (
                                <Badge variant="error">INCOMPLETE</Badge>
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

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-default flex items-center justify-between bg-subtle">
              <span className="text-xs text-text-secondary">
                {parsedRows.filter((r) => r.isValid).length} valid records to import
              </span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => setIsBulkModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  disabled={parsedRows.filter((r) => r.isValid).length === 0}
                  isLoading={bulkCreateMutation.isPending}
                  onClick={handleBulkSubmit}
                >
                  Import {parsedRows.filter((r) => r.isValid).length} Staff Members
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. STAFF MEMBER DETAILS SLIDEOVER                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <SlideOver
        open={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name || "Staff Details"}
        subtitle={selectedMember?.employeeCode}
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

            {/* Assigned Subject Sections if any */}
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
