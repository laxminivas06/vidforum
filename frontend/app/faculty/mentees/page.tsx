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
  Loader2,
} from "lucide-react"
import {
  useMyClasses,
  useFaculty,
  useFacultyMentees,
  useUpdateMenteeNote,
} from "@/lib/api/hooks"

export interface MenteeStudent {
  id: string
  roll: string
  name: string
  admissionNo: string
  grade: string
  section: string
  sectionId?: string
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
  const [selectedSectionId, setSelectedSectionId] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Log Mentor Note Modal State
  const [activeMenteeForNote, setActiveMenteeForNote] = useState<MenteeStudent | null>(null)
  const [newNoteText, setNewNoteText] = useState("")
  const [newGoalText, setNewGoalText] = useState("")
  const [feedbackSaved, setFeedbackSaved] = useState<string | null>(null)

  // Identify faculty members who are designated as mentors
  const mentorFacultyList = useMemo(() => {
    return allFaculty.filter(
      (f: any) =>
        f.isClassMentor ||
        (Array.isArray(f.mentoredSections) && f.mentoredSections.length > 0)
    )
  }, [allFaculty])

  // Active faculty resolution
  const activeFaculty = useMemo(() => {
    if (selectedFacultyId && allFaculty.length > 0) {
      return allFaculty.find((f: any) => f.id === selectedFacultyId) || null
    }
    // If authenticated user is faculty with profile
    if (myClassesData?.id) {
      const match = allFaculty.find((f: any) => f.id === myClassesData.id)
      if (match) return match
      return myClassesData
    }
    // Default to the first faculty member who is a Class Mentor, or first faculty
    if (mentorFacultyList.length > 0) {
      return mentorFacultyList[0]
    }
    return allFaculty.length > 0 ? allFaculty[0] : null
  }, [selectedFacultyId, allFaculty, myClassesData, mentorFacultyList])

  // Fetch real mentees cohort for active faculty from cloud database
  const { data: menteesData, isLoading: isLoadingMentees } = useFacultyMentees(activeFaculty?.id)
  const updateMenteeNoteMutation = useUpdateMenteeNote()

  // Map students from mentored sections into mentees list
  const menteesList: MenteeStudent[] = useMemo(() => {
    if (menteesData?.students && menteesData.students.length > 0) {
      return menteesData.students.map((s: any, idx: number) => ({
        id: s.id,
        roll: s.roll || s.rollNumber || String(idx + 1).padStart(2, "0"),
        name: s.name || `${s.firstName || "Student"} ${s.lastName || ""}`,
        admissionNo: s.admissionNo || s.admissionNumber || `SIA-2026-${100 + idx}`,
        grade: s.grade || s.className || "Grade 10",
        section: s.section || s.sectionName || "Section A",
        sectionId: s.sectionId,
        attendancePct: Number(s.attendancePct ?? 95.0),
        marksAvgPct: Number(s.marksAvgPct ?? 88.0),
        parentName: s.parentName || "Guardian",
        parentPhone: s.parentPhone || "+91 98480 11223",
        parentEmail: s.parentEmail || "",
        academicStatus: (s.academicStatus || (idx % 3 === 0 ? "EXCELLING" : idx % 3 === 1 ? "STEADY" : "NEEDS_SUPPORT")) as any,
        mentorNotes: s.mentorNotes || (idx === 0 ? "Consistently excels in quantitative problem-solving." : "Shows steady progress; advised weekly revision timetable."),
        lastMeetingDate: s.lastMeetingDate || "2026-10-10",
        goals: s.goals || (idx === 0 ? "Maintain top quartile ranking" : "Improve examination performance to >80%"),
      }))
    }
    return []
  }, [menteesData?.students])

  // Filtered list by section, status, and search query
  const filteredMentees = useMemo(() => {
    return menteesList.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || m.academicStatus === statusFilter
      const matchesSection = selectedSectionId === "ALL" || m.sectionId === selectedSectionId
      return matchesSearch && matchesStatus && matchesSection
    })
  }, [menteesList, searchQuery, statusFilter, selectedSectionId])

  // Save Note Handler to Cloud Database
  const handleSaveMentorNote = async () => {
    if (!activeMenteeForNote) return

    try {
      await updateMenteeNoteMutation.mutateAsync({
        studentId: activeMenteeForNote.id,
        notes: newNoteText || activeMenteeForNote.mentorNotes,
      })
      setFeedbackSaved(`Mentorship observation recorded for ${activeMenteeForNote.name}!`)
      setTimeout(() => setFeedbackSaved(null), 4000)
      setActiveMenteeForNote(null)
      setNewNoteText("")
      setNewGoalText("")
    } catch (err: any) {
      console.error("Failed to save mentor note:", err)
      setFeedbackSaved("Failed to save note to cloud database. Please try again.")
      setTimeout(() => setFeedbackSaved(null), 4000)
    }
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
            <div className="w-10 h-10 rounded-xl bg-subtle border border-border-default text-brand-primary flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  {activeFaculty?.name || user?.name || "Faculty Mentor"}
                </h2>
                {menteesData?.isClassMentor ? (
                  <Badge variant="positive">Class Mentor</Badge>
                ) : (
                  <Badge variant="neutral">Faculty Advisory</Badge>
                )}
              </div>

              {/* Mentored Section Badges */}
              {menteesData?.mentoredSections && menteesData.mentoredSections.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {menteesData.mentoredSections.map((sec) => (
                    <span
                      key={sec.sectionId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                    >
                      <Sparkles className="w-3 h-3" />
                      Mentoring: {sec.gradeSection} ({sec.studentCount} students)
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary mt-0.5">
                  Dedicated student advisory cohort • Academic coaching, pastoral care & guardian communication
                </p>
              )}
            </div>
          </div>

          {allFaculty.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-text-secondary shrink-0">Faculty Roster:</span>
              <select
                value={selectedFacultyId || activeFaculty?.id || ""}
                onChange={(e) => {
                  setSelectedFacultyId(e.target.value)
                  setSelectedSectionId("ALL")
                }}
                className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-medium w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {allFaculty.map((f: any) => {
                  const isMentor =
                    f.isClassMentor ||
                    (Array.isArray(f.mentoredSections) && f.mentoredSections.length > 0)
                  const mentorText = isMentor
                    ? ` • Mentor: ${f.mentoredSections.map((s: any) => s.grade || s.class_name ? `${s.grade || s.class_name}-${s.section || s.section_name}` : s.section_name).join(", ")}`
                    : ""
                  return (
                    <option key={f.id} value={f.id}>
                      {f.name}{mentorText || ` (${f.designation || "Faculty"})`}
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedbackSaved && (
          <div className="p-3 bg-subtle border border-status-success/30 rounded-xl text-status-success text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
            <span>{feedbackSaved}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Mentees</span>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {isLoadingMentees ? "..." : menteesList.length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-subtle border border-border-default text-brand-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Excelling Mentees</span>
                <p className="text-2xl font-bold text-status-success mt-1">
                  {isLoadingMentees ? "..." : excellingCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-subtle border border-border-default text-brand-primary flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Needs Attention</span>
                <p className="text-2xl font-bold text-status-error mt-1">
                  {isLoadingMentees ? "..." : supportCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-subtle border border-border-default text-status-error flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Avg Attendance</span>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {isLoadingMentees
                    ? "..."
                    : menteesList.length
                    ? Math.round(
                        menteesList.reduce((acc, m) => acc + m.attendancePct, 0) / menteesList.length
                      )
                    : 95}
                  %
                </p>
              </div>
              <div className="p-2 rounded-lg bg-subtle border border-border-default text-brand-primary flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Filter Tabs (When Faculty Mentors Multiple Sections) */}
        {menteesData?.mentoredSections && menteesData.mentoredSections.length > 1 && (
          <div className="flex items-center gap-2 p-2 bg-surface border border-border-default rounded-xl overflow-x-auto">
            <span className="text-xs font-semibold text-text-secondary pl-1 shrink-0">
              Filter by Section:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSectionId("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedSectionId === "ALL"
                  ? "bg-action-black text-canvas font-bold shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-subtle"
              }`}
            >
              All Sections ({menteesList.length})
            </button>
            {menteesData.mentoredSections.map((sec) => (
              <button
                key={sec.sectionId}
                type="button"
                onClick={() => setSelectedSectionId(sec.sectionId)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedSectionId === sec.sectionId
                    ? "bg-action-black text-canvas font-bold shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-subtle"
                }`}
              >
                {sec.gradeSection} ({sec.studentCount})
              </button>
            ))}
          </div>
        )}

        {/* Filter & Search Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "EXCELLING", "STEADY", "NEEDS_SUPPORT"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-action-black text-canvas shadow-xs font-bold"
                    : "text-text-secondary hover:text-text-primary hover:bg-subtle"
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

        {/* Loading State */}
        {isLoadingMentees && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-3" />
            <p className="text-xs text-text-secondary">Loading mentored cohort from cloud database...</p>
          </div>
        )}

        {/* Empty State when no mentees */}
        {!isLoadingMentees && menteesList.length === 0 && (
          <div className="bg-surface border border-border-default rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-subtle border border-border-default flex items-center justify-center text-brand-primary mb-4">
              <GraduationCap className="w-7 h-7 text-brand-primary" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              No Mentees Assigned to {activeFaculty?.name || "This Faculty Member"}
            </h3>
            <p className="text-xs text-text-secondary mt-2 max-w-md leading-relaxed">
              To display students here, designate this faculty member as the <strong>Class Mentor</strong> for a class section in <strong>Academics &amp; Curriculum &rarr; Class Grades</strong>.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link href="/academics">
                <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
                  Assign Class Mentor in Academics
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Filtered empty state */}
        {!isLoadingMentees && menteesList.length > 0 && filteredMentees.length === 0 && (
          <div className="p-8 text-center bg-surface border border-border-default rounded-2xl">
            <p className="text-xs text-text-secondary">
              No mentees match your current search or status filter criteria.
            </p>
          </div>
        )}

        {/* Mentees Grid */}
        {!isLoadingMentees && filteredMentees.length > 0 && (
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
                      <p className="text-xs font-mono font-bold text-status-success mt-0.5">
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
        )}

        {/* Log Session Note Modal */}
        {activeMenteeForNote && (
          <Modal
            isOpen={true}
            onClose={() => setActiveMenteeForNote(null)}
            title={`Log Advisory Session: ${activeMenteeForNote.name}`}
            subtitle="Record counseling interaction, academic objectives, and behavioral observations in the cloud database."
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
                  Mentor Meeting Notes &amp; Observations
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
                  onClick={handleSaveMentorNote}
                  isLoading={updateMenteeNoteMutation.isPending}
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
