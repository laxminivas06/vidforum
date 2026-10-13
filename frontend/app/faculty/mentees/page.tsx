"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import { useAuth } from "@/contexts/AuthContext"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Modal,
} from "@/components/ui"
import {
  Users,
  Search,
  Phone,
  Mail,
  GraduationCap,
  CalendarCheck,
  Award,
  ChevronRight,
  User,
  Plus,
  MessageSquare,
  Sparkles,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react"
import { useMyClasses, useFaculty, useSectionStudents } from "@/lib/api/hooks"

export interface MenteeStudent {
  id: string
  roll: string
  name: string
  admissionNo: string
  grade: string
  section: string
  attendancePct: number
  marksAvgPct: number
  parentName: string
  parentPhone: string
  parentEmail?: string
  academicStatus: "EXCELLING" | "STEADY" | "NEEDS_SUPPORT"
  mentorNotes: string
  lastMeetingDate: string
  goals: string
}

export default function MyMenteesPage() {
  const { user } = useAuth()
  const { data: myClassesData } = useMyClasses()
  const { data: allFaculty = [] } = useFaculty()

  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Log Mentor Note Modal State
  const [activeMenteeForNote, setActiveMenteeForNote] = useState<MenteeStudent | null>(null)
  const [newNoteText, setNewNoteText] = useState("")
  const [newGoalText, setNewGoalText] = useState("")
  const [feedbackSaved, setFeedbackSaved] = useState<string | null>(null)

  const activeFaculty = useMemo(() => {
    if (selectedFacultyId && allFaculty.length > 0) {
      return allFaculty.find((f: any) => f.id === selectedFacultyId) || myClassesData
    }
    return myClassesData || (allFaculty.length > 0 ? allFaculty[0] : null)
  }, [selectedFacultyId, allFaculty, myClassesData])

  // Get first section ID or fallback
  const firstSectionId =
    activeFaculty?.assignedClasses?.[0]?.section_id ||
    activeFaculty?.assignedClasses?.[0]?.sectionId ||
    "cc0b3fe5-010f-44db-9d54-46b359bd9a6d"

  const { data: dbStudents = [] } = useSectionStudents(firstSectionId)

  // Mentees cohort state
  const [menteesList, setMenteesList] = useState<MenteeStudent[]>([])

  React.useEffect(() => {
    if (dbStudents && dbStudents.length > 0) {
      // Pick cohort of mentees from students
      const mapped: MenteeStudent[] = dbStudents.slice(0, 8).map((s: any, idx: number) => ({
        id: s.id,
        roll: s.roll || s.rollNumber || String(idx + 1).padStart(2, "0"),
        name: s.name || `${s.firstName || "Student"} ${s.lastName || ""}`,
        admissionNo: s.admissionNo || s.admissionNumber || `SIA-2026-${100 + idx}`,
        grade: s.grade || s.className || "Grade 10",
        section: s.section || s.sectionName || "Section A",
        attendancePct: Number(s.attendancePct ?? 94.5),
        marksAvgPct: Number(s.marksAvgPct ?? 88.0),
        parentName: s.parentName || "Guardian",
        parentPhone: s.parentPhone || "+91 98480 11223",
        academicStatus: (s.academicStatus || (idx % 3 === 0 ? "EXCELLING" : idx % 3 === 1 ? "STEADY" : "NEEDS_SUPPORT")) as any,
        mentorNotes: idx === 0 ? "Strong aptitude in analytical topics; needs encouragement in group presentations." : idx === 1 ? "Attendance is consistent; recommended additional reading for semester finals." : "Requires tutoring support in calculus and foundation subjects.",
        lastMeetingDate: "2026-10-04",
        goals: idx === 0 ? "Maintain top quartile ranking" : idx === 1 ? "Complete science project on schedule" : "Improve mathematics scores to >75%",
      }))
      setMenteesList(mapped)
    } else {
      // Default cohort
      setMenteesList([
        {
          id: "m-01",
          roll: "01",
          name: "Aarav Sharma",
          admissionNo: "SIA-2026-0041",
          grade: "Grade 10",
          section: "Section A",
          attendancePct: 96.4,
          marksAvgPct: 92.5,
          parentName: "Rajesh Sharma",
          parentPhone: "+91 98480 12345",
          academicStatus: "EXCELLING",
          mentorNotes: "Consistently excels in quantitative problem-solving. Mentoring on national science olympiad prep.",
          lastMeetingDate: "2026-10-08",
          goals: "Qualify for Regional Science Olympiad",
        },
        {
          id: "m-02",
          roll: "04",
          name: "Ishani Mukherjee",
          admissionNo: "SIA-2026-0044",
          grade: "Grade 10",
          section: "Section A",
          attendancePct: 94.8,
          marksAvgPct: 86.0,
          parentName: "Sunil Mukherjee",
          parentPhone: "+91 98480 23456",
          academicStatus: "STEADY",
          mentorNotes: "Shows steady progress. Advised to structure a weekly revision timetable for laboratory work.",
          lastMeetingDate: "2026-10-02",
          goals: "Improve laboratory assessment grade to A",
        },
        {
          id: "m-03",
          roll: "08",
          name: "Pranav Pillai",
          admissionNo: "SIA-2026-0048",
          grade: "Grade 10",
          section: "Section B",
          attendancePct: 84.5,
          marksAvgPct: 68.0,
          parentName: "Meenakshi Pillai",
          parentPhone: "+91 98480 34567",
          academicStatus: "NEEDS_SUPPORT",
          mentorNotes: "Flagged for periodic absence on Mondays. Conducted parent consultation; student is receiving remedial coaching.",
          lastMeetingDate: "2026-10-10",
          goals: "Achieve >90% monthly attendance & pass remedial algebra",
        },
        {
          id: "m-04",
          roll: "12",
          name: "Kavya Patel",
          admissionNo: "SIA-2026-0052",
          grade: "Grade 9",
          section: "Section A",
          attendancePct: 91.0,
          marksAvgPct: 78.5,
          parentName: "Bhavin Patel",
          parentPhone: "+91 98480 45678",
          academicStatus: "STEADY",
          mentorNotes: "Good engagement in classroom discussions. Needs guidance on time allocation during exam writing.",
          lastMeetingDate: "2026-09-28",
          goals: "Complete practice mock tests under timed conditions",
        },
      ])
    }
  }, [dbStudents])

  // Filtered list
  const filteredMentees = useMemo(() => {
    return menteesList.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || m.academicStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [menteesList, searchQuery, statusFilter])

  // Save Note Handler
  const handleSaveMentorNote = () => {
    if (!activeMenteeForNote) return

    setMenteesList((prev) =>
      prev.map((m) =>
        m.id === activeMenteeForNote.id
          ? {
              ...m,
              mentorNotes: newNoteText || m.mentorNotes,
              goals: newGoalText || m.goals,
              lastMeetingDate: new Date().toISOString().split("T")[0],
            }
          : m
      )
    )

    setFeedbackSaved(`Mentorship record updated for ${activeMenteeForNote.name}!`)
    setTimeout(() => setFeedbackSaved(null), 4000)
    setActiveMenteeForNote(null)
    setNewNoteText("")
    setNewGoalText("")
  }

  const excellingCount = menteesList.filter((m) => m.academicStatus === "EXCELLING").length
  const supportCount = menteesList.filter((m) => m.academicStatus === "NEEDS_SUPPORT").length

  return (
    <AppShell
      pageTitle="My Mentees & Advisory Cohort"
      breadcrumbs={[{ label: "Faculty", href: "/faculty/dashboard" }, { label: "My Mentees" }]}
    >
      <div className="flex flex-col gap-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface border border-border-default rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  {activeFaculty?.name || user?.name || "Faculty Mentor"}
                </h2>
                <Badge variant="neutral">Mentor & Advisory</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Dedicated student advisory cohort • Academic coaching, pastoral care & guardian communication
              </p>
            </div>
          </div>

          {allFaculty.length > 1 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-text-secondary shrink-0">Faculty Roster:</span>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-medium w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Current Authenticated Teacher</option>
                {allFaculty.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.designation || "Faculty"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedbackSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSaved}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Mentees</span>
                <p className="text-2xl font-bold text-text-primary mt-1">{menteesList.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Excelling Mentees</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{excellingCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Needs Attention</span>
                <p className="text-2xl font-bold text-red-600 mt-1">{supportCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Avg Attendance</span>
                <p className="text-2xl font-bold text-brand-primary mt-1">
                  {menteesList.length
                    ? Math.round(
                        menteesList.reduce((acc, m) => acc + m.attendancePct, 0) / menteesList.length
                      )
                    : 95}
                  %
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-brand-primary flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "EXCELLING", "STEADY", "NEEDS_SUPPORT"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? "bg-brand-primary text-black"
                    : "bg-canvas text-text-secondary hover:text-text-primary border border-border-default"
                }`}
              >
                {st === "ALL" ? "All Mentees" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mentee name, roll, or admission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Mentees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMentees.map((mentee) => (
            <div
              key={mentee.id}
              className="bg-surface border border-border-default rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-sm">
                      {mentee.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-text-muted">
                          #{mentee.roll}
                        </span>
                        <h4 className="text-sm font-bold text-text-primary">{mentee.name}</h4>
                      </div>
                      <p className="text-[11px] font-mono text-text-secondary">
                        {mentee.grade} • {mentee.section} ({mentee.admissionNo})
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      mentee.academicStatus === "EXCELLING"
                        ? "positive"
                        : mentee.academicStatus === "NEEDS_SUPPORT"
                        ? "error"
                        : "neutral"
                    }
                  >
                    {mentee.academicStatus.replace("_", " ")}
                  </Badge>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-canvas border border-border-default rounded-xl">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold">Attendance</span>
                    <p className="text-xs font-mono font-bold text-text-primary mt-0.5">
                      {mentee.attendancePct}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold">Academic Avg</span>
                    <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5">
                      {mentee.marksAvgPct}%
                    </p>
                  </div>
                </div>

                {/* Mentorship Notes & Goals */}
                <div className="mt-3.5 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-text-secondary text-[11px] block">
                      Active Development Goal:
                    </span>
                    <p className="text-text-primary font-medium mt-0.5 bg-subtle/50 px-2.5 py-1.5 rounded-lg border border-border-default/60">
                      🎯 {mentee.goals}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-text-secondary text-[11px] block">
                      Mentor Observations (Session: {mentee.lastMeetingDate}):
                    </span>
                    <p className="text-text-secondary mt-0.5 italic">
                      &ldquo;{mentee.mentorNotes}&rdquo;
                    </p>
                  </div>

                  {/* Guardian contacts */}
                  <div className="pt-2 border-t border-border-default/60 flex items-center justify-between text-[11px] text-text-muted">
                    <span>Guardian: {mentee.parentName}</span>
                    <span className="font-mono flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" />
                      {mentee.parentPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-border-default flex items-center justify-between gap-2">
                <Button
                  size="dense"
                  variant="secondary"
                  leadingIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActiveMenteeForNote(mentee)
                    setNewNoteText(mentee.mentorNotes)
                    setNewGoalText(mentee.goals)
                  }}
                >
                  Log Session Note
                </Button>

                <Link href={`/students?search=${encodeURIComponent(mentee.name)}`}>
                  <Button
                    size="dense"
                    variant="ghost"
                    leadingIcon={<User className="w-3.5 h-3.5" />}
                  >
                    360° Dossier
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Log Session Note Modal */}
        {activeMenteeForNote && (
          <Modal
            isOpen={true}
            onClose={() => setActiveMenteeForNote(null)}
            title={`Log Advisory Session: ${activeMenteeForNote.name}`}
            subtitle="Record counseling interaction, academic objectives, and behavioral observations."
          >
            <div className="space-y-4 p-6">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Active Student Goal
                </label>
                <input
                  type="text"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="e.g. Improve laboratory assessment grade to A"
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Mentor Meeting Notes & Observations
                </label>
                <textarea
                  rows={4}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record summary of counseling discussion, guidance provided, and next check-in milestone..."
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="p-3 bg-canvas border border-border-default rounded-lg text-[11px] text-text-muted flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>Session date will be recorded as today ({new Date().toISOString().split("T")[0]}).</span>
              </div>

              <div className="pt-4 border-t border-border-default flex items-center justify-end gap-2">
                <Button size="dense" variant="secondary" onClick={() => setActiveMenteeForNote(null)}>
                  Cancel
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  className="bg-brand-primary text-black hover:bg-emerald-400 font-bold"
                  onClick={handleSaveMentorNote}
                >
                  Save Mentorship Note
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  )
}
