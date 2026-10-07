"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableColumn,
  ConfirmDialog,
} from "@/components/ui"
import {
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  GraduationCap,
  Users,
  Sparkles,
} from "lucide-react"
import { useEscapeKey, useSubmitKey, useKeybinding } from "@/lib/hooks/useKeyboardShortcuts"
import { getModifierLabel, isModifierPressed } from "@/lib/utils/keyboard"

interface LeadInquiry {
  id: string
  studentName: string
  parentName: string
  phone: string
  email: string
  gradeApplying: string
  source: "Website Form" | "Walk-in" | "Referral" | "Helpline"
  status: "NEW" | "CONTACTED" | "CAMPUS_VISIT" | "CONVERTED" | "CLOSED"
  inquiryDate: string
  notes: string
}

const INITIAL_INQUIRIES: LeadInquiry[] = [
  {
    id: "inq-001",
    studentName: "Aarav Sharma",
    parentName: "Sanjay Sharma",
    phone: "+91 98480 22334",
    email: "sanjay.sharma@gmail.com",
    gradeApplying: "Class 10 (CBSE)",
    source: "Website Form",
    status: "NEW",
    inquiryDate: "2026-10-04",
    notes: "Inquiring for IIT-JEE integrated batch admission.",
  },
  {
    id: "inq-002",
    studentName: "Kavya Deshmukh",
    parentName: "Ramesh Deshmukh",
    phone: "+91 97012 44556",
    email: "ramesh.deshmukh@yahoo.com",
    gradeApplying: "Class 9 (CBSE)",
    source: "Walk-in",
    status: "CAMPUS_VISIT",
    inquiryDate: "2026-10-03",
    notes: "Campus tour scheduled for Saturday at 11:00 AM.",
  },
  {
    id: "inq-003",
    studentName: "Mohammed Zeeshan",
    parentName: "Tariq Zeeshan",
    phone: "+91 98855 66778",
    email: "tariq.zeeshan@outlook.com",
    gradeApplying: "Class 10 (CBSE)",
    source: "Referral",
    status: "CONTACTED",
    inquiryDate: "2026-10-02",
    notes: "Shared fee structure and academic brochure over WhatsApp.",
  },
  {
    id: "inq-004",
    studentName: "Divya Teja Varma",
    parentName: "V. N. Varma",
    phone: "+91 99490 88990",
    email: "varma.vn@gmail.com",
    gradeApplying: "Class 9 (CBSE)",
    source: "Helpline",
    status: "CONVERTED",
    inquiryDate: "2026-09-30",
    notes: "Successfully converted to formal applicant in admissions pipeline.",
  },
]

export default function AdmissionsEnquiriesPage() {
  const [inquiries, setInquiries] = useState<LeadInquiry[]>(INITIAL_INQUIRIES)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Form state for new lead
  const [newStudentName, setNewStudentName] = useState("")
  const [newParentName, setNewParentName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newGrade, setNewGrade] = useState("Class 10 (CBSE)")
  const [newSource, setNewSource] = useState<LeadInquiry["source"]>("Walk-in")
  const [newNotes, setNewNotes] = useState("")

  // Element Refs for keyboard focus management
  const searchInputRef = useRef<HTMLInputElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)
  const studentNameInputRef = useRef<HTMLInputElement>(null)
  const parentNameInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const notesInputRef = useRef<HTMLTextAreaElement>(null)

  // Desk keybindings
  useKeybinding("n", () => setIsAddModalOpen(true), { enabled: !isAddModalOpen })
  useKeybinding("c", () => setIsAddModalOpen(true), { enabled: !isAddModalOpen })
  useKeybinding("n", () => setIsAddModalOpen(true), { alt: true, enabled: !isAddModalOpen })
  useKeybinding("/", (e) => {
    e.preventDefault()
    searchInputRef.current?.focus()
  }, { enabled: !isAddModalOpen })

  // Modal keybindings
  useEscapeKey(() => {
    setIsAddModalOpen(false)
    setTimeout(() => addBtnRef.current?.focus(), 50)
  }, isAddModalOpen)

  const saveInquiry = () => {
    if (!newStudentName.trim() || !newParentName.trim() || !newPhone.trim()) return

    const newEntry: LeadInquiry = {
      id: `inq-${Date.now()}`,
      studentName: newStudentName.trim(),
      parentName: newParentName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || "not-provided@example.com",
      gradeApplying: newGrade,
      source: newSource,
      status: "NEW",
      inquiryDate: new Date().toISOString().split("T")[0],
      notes: newNotes.trim() || "Fresh lead inquiry.",
    }

    setInquiries([newEntry, ...inquiries])
    setIsAddModalOpen(false)
    setNewStudentName("")
    setNewParentName("")
    setNewPhone("")
    setNewEmail("")
    setNewNotes("")
    setTimeout(() => addBtnRef.current?.focus(), 50)
  }

  useSubmitKey(() => {
    if (isAddModalOpen) {
      saveInquiry()
    }
  }, { requireModifier: true, enabled: isAddModalOpen })

  useEffect(() => {
    if (isAddModalOpen) {
      setTimeout(() => studentNameInputRef.current?.focus(), 60)
    }
  }, [isAddModalOpen])

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesSearch =
        inq.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.phone.includes(searchQuery)
      const matchesStatus = statusFilter === "ALL" || inq.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [inquiries, searchQuery, statusFilter])

  const handleAddInquiry = (e: React.FormEvent) => {
    e.preventDefault()
    saveInquiry()
  }

  const columns: TableColumn<LeadInquiry>[] = [
    {
      header: "Prospective Student & Parent",
      key: "studentName",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
            <span>{item.studentName}</span>
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Parent: {item.parentName}</div>
        </div>
      ),
    },
    {
      header: "Grade & Source",
      key: "gradeApplying",
      render: (item) => (
        <div>
          <span className="text-xs font-mono font-medium text-text-primary block">{item.gradeApplying}</span>
          <span className="text-[11px] text-text-secondary">{item.source}</span>
        </div>
      ),
    },
    {
      header: "Contact Details",
      key: "phone",
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs text-text-primary flex items-center gap-1.5 font-mono">
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>{item.phone}</span>
          </div>
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5 truncate max-w-[180px]">
            <Mail className="w-3 h-3 text-text-muted" />
            <span>{item.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "neutral" | "info"> = {
          NEW: "info",
          CONTACTED: "warning",
          CAMPUS_VISIT: "warning",
          CONVERTED: "positive",
          CLOSED: "neutral",
        }
        return (
          <Badge variant={variants[item.status] || "neutral"}>
            {item.status.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      header: "Actions",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.status !== "CONVERTED" ? (
            <Link href={`/admissions?leadId=${item.id}&name=${encodeURIComponent(item.studentName)}`}>
              <Button size="dense" variant="secondary" leadingIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Convert to Applicant
              </Button>
            </Link>
          ) : (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Lead Inquiries"
      breadcrumbs={[{ label: "Admissions", href: "/admissions" }, { label: "Inquiries" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            ref={addBtnRef}
            size="dense"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
            title="New Lead Inquiry (N or Alt+N)"
          >
            New Lead Inquiry
            <span className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded bg-black/20 text-[9px] font-mono text-white/90">
              N
            </span>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Inquiries</span>
                <p className="text-2xl font-bold text-text-primary mt-1">{inquiries.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Campus Visits</span>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {inquiries.filter((i) => i.status === "CAMPUS_VISIT").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Converted to Applicants</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {inquiries.filter((i) => i.status === "CONVERTED").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Conversion Rate</span>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {Math.round((inquiries.filter((i) => i.status === "CONVERTED").length / inquiries.length) * 100)}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search student, parent, phone... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CAMPUS_VISIT">Campus Visit</option>
              <option value="CONVERTED">Converted</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <Table
          data={filteredInquiries}
          columns={columns}
          keyExtractor={(item) => item.id}
          cardTitle={(item) => item.studentName}
          cardSubtitle={(item) => `${item.gradeApplying} • Parent: ${item.parentName}`}
          emptyMessage="No lead inquiries found matching criteria."
        />
      </div>

      {/* Add Lead Inquiry Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddModalOpen(false)
              setTimeout(() => addBtnRef.current?.focus(), 50)
            }
          }}
        >
          <div className="w-full max-w-md bg-surface border border-border-default rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-primary" />
                <span>Record New Lead Inquiry</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setTimeout(() => addBtnRef.current?.focus(), 50)
                }}
                className="text-text-muted hover:text-text-primary text-sm p-1 rounded-md"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddInquiry} className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Prospective Student Name *
                </label>
                <input
                  ref={studentNameInputRef}
                  type="text"
                  required
                  placeholder="e.g. Sai Teja"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isModifierPressed(e)) {
                      e.preventDefault()
                      parentNameInputRef.current?.focus()
                    }
                  }}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Parent / Guardian Name *
                  </label>
                  <input
                    ref={parentNameInputRef}
                    type="text"
                    required
                    placeholder="e.g. Srikanth Rao"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isModifierPressed(e)) {
                        e.preventDefault()
                        phoneInputRef.current?.focus()
                      }
                    }}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Phone Number *
                  </label>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    required
                    placeholder="+91 98480..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isModifierPressed(e)) {
                        e.preventDefault()
                        emailInputRef.current?.focus()
                      }
                    }}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Grade Applying
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Class 10 (CBSE)">Class 10 (CBSE)</option>
                    <option value="Class 9 (CBSE)">Class 9 (CBSE)</option>
                    <option value="Class 8 (CBSE)">Class 8 (CBSE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Lead Source
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Website Form">Website Form</option>
                    <option value="Referral">Referral</option>
                    <option value="Helpline">Helpline</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Email Address
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="parent@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isModifierPressed(e)) {
                      e.preventDefault()
                      notesInputRef.current?.focus()
                    }
                  }}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Counseling Notes
                </label>
                <textarea
                  ref={notesInputRef}
                  rows={2}
                  placeholder="Student interest, curriculum preference... (Press Enter for newline, Cmd/Ctrl+Enter to save)"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isModifierPressed(e)) {
                      e.preventDefault()
                      saveInquiry()
                    }
                  }}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary resize-none focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex items-center justify-end pt-3 border-t border-border-default mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="dense"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setTimeout(() => addBtnRef.current?.focus(), 50)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="dense" variant="primary" type="submit">
                    Save Inquiry
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
