"use client"

import React, { useState, useMemo } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  ProgressBar,
} from "@/components/ui"
import {
  GraduationCap,
  Plus,
  BookOpen,
  Users,
  DoorOpen,
  Layers,
  Sparkles,
  ChevronRight,
  Calendar,
  CalendarDays,
  CheckCircle,
  XCircle,
  Copy,
  Printer,
  Trash2,
  Clock,
  Search,
  BookMarked,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Pencil,
} from "lucide-react"
import {
  useAcademics,
  useAcademicYears,
  useCreateAcademicYear,
  useSetCurrentAcademicYear,
  useCloseAcademicYear,
  useCloneAcademicYear,
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useGenerateClassMatrix,
  useCreateSection,
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useGradeSubjects,
  useMapSubjectToGrade,
  useRemoveSubjectFromGrade,
  useCopySubjectMatrix,
  useExamEstimates,
  useCreateExamEstimate,
  useCalendarConfig,
  useSaveCalendarConfig,
  useCalendarDays,
  useCreateCalendarDay,
  useDeleteCalendarDay,
  useWorkingDaysCount,
  useTextbooks,
  useCreateTextbook,
  useDeleteTextbook,
  useBooklist,
  useDepartments,
} from "@/lib/api/hooks"

type TabType = "hierarchy" | "subjects" | "mapping" | "calendar" | "exams" | "textbooks" | "years"

export default function AcademicsWorkspacePage() {
  const [activeTab, setActiveTab] = useState<TabType>("hierarchy")

  // Academic Years
  const { data: academicYears = [], isLoading: isYearsLoading } = useAcademicYears()
  const currentYear = useMemo(() => academicYears.find((y: any) => y.is_current) || academicYears[0], [academicYears])
  const [selectedYearId, setSelectedYearId] = useState<string>("")
  const activeYearId = selectedYearId || currentYear?.id || ""

  // Hierarchy & Grades
  const { data: grades = [], isLoading: isGradesLoading } = useAcademics()
  const [selectedGradeId, setSelectedGradeId] = useState<string>("")
  const activeGrade = grades.find((g) => g.id === selectedGradeId) || grades[0]

  // Classes & Departments
  const { data: classes = [] } = useClasses(activeYearId)
  const { data: departments = [] } = useDepartments()

  // Subjects
  const { data: subjects = [] } = useSubjects()
  const [subjectSearch, setSubjectSearch] = useState("")

  // Curriculum Mapping
  const [mappingClassId, setMappingClassId] = useState<string>("")
  const activeMappingClassId = mappingClassId || classes[0]?.id || ""
  const { data: mappedSubjects = [] } = useGradeSubjects(activeMappingClassId)

  // Calendar & Working Days
  const { data: calendarConfig } = useCalendarConfig(activeYearId)
  const { data: calendarDays = [] } = useCalendarDays(activeYearId)
  const { data: workingDaysCount } = useWorkingDaysCount(activeYearId)
  const [workingDaysSelection, setWorkingDaysSelection] = useState<number[]>([1, 2, 3, 4, 5])
  const [dateCheckInput, setDateCheckInput] = useState("")
  const [dateCheckResult, setDateCheckResult] = useState<any>(null)

  // Exam Estimates
  const { data: examEstimates = [] } = useExamEstimates(activeYearId)

  // Textbooks
  const [textbookClassId, setTextbookClassId] = useState<string>("")
  const activeTextbookClassId = textbookClassId || classes[0]?.id || ""
  const { data: textbooks = [] } = useTextbooks(activeYearId, activeTextbookClassId || undefined)
  const { data: booklistData } = useBooklist(activeYearId, activeTextbookClassId)

  // Modals
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false)
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false)
  const [isMapSubjectModalOpen, setIsMapSubjectModalOpen] = useState(false)
  const [isCopyMatrixModalOpen, setIsCopyMatrixModalOpen] = useState(false)
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false)
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false)
  const [isAddTextbookModalOpen, setIsAddTextbookModalOpen] = useState(false)
  const [isBooklistModalOpen, setIsBooklistModalOpen] = useState(false)
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false)
  const [isCloneYearModalOpen, setIsCloneYearModalOpen] = useState(false)
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)

  // Success / Error banner state
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Mutations
  const createYearMutation = useCreateAcademicYear()
  const setCurrentYearMutation = useSetCurrentAcademicYear()
  const closeYearMutation = useCloseAcademicYear()
  const cloneYearMutation = useCloneAcademicYear()
  const generateMatrixMutation = useGenerateClassMatrix()
  const createSectionMutation = useCreateSection()
  const createSubjectMutation = useCreateSubject()
  const mapSubjectMutation = useMapSubjectToGrade()
  const removeSubjectMutation = useRemoveSubjectFromGrade()
  const copyMatrixMutation = useCopySubjectMatrix()
  const saveCalendarConfigMutation = useSaveCalendarConfig()
  const createCalendarDayMutation = useCreateCalendarDay()
  const deleteCalendarDayMutation = useDeleteCalendarDay()
  const createExamEstimateMutation = useCreateExamEstimate()
  const createTextbookMutation = useCreateTextbook()
  const deleteTextbookMutation = useDeleteTextbook()

  // Form states
  const [matrixGrades, setMatrixGrades] = useState("Grade 1, Grade 2, Grade 3, Grade 4, Grade 5")
  const [matrixSections, setMatrixSections] = useState("Section A, Section B")
  const [matrixCapacity, setMatrixCapacity] = useState(40)
  const [matrixDeptId, setMatrixDeptId] = useState("")

  const [newSubName, setNewSubName] = useState("")
  const [newSubCode, setNewSubCode] = useState("")
  const [newSubCredits, setNewSubCredits] = useState(4)
  const [newSubElective, setNewSubElective] = useState(false)
  const [newSubDeptId, setNewSubDeptId] = useState("")

  const [mapSubjectId, setMapSubjectId] = useState("")
  const [mapPeriods, setMapPeriods] = useState(5)
  const [mapMaxMarks, setMapMaxMarks] = useState(100)
  const [mapPassMarks, setMapPassMarks] = useState(35)
  const [mapMandatory, setMapMandatory] = useState(true)

  const [copyTargetClassIds, setCopyTargetClassIds] = useState<string[]>([])

  const [holidayDate, setHolidayDate] = useState("")
  const [holidayType, setHolidayType] = useState("holiday")
  const [holidayDesc, setHolidayDesc] = useState("")
  const [holidayIsWorking, setHolidayIsWorking] = useState(false)

  const [examTermName, setExamTermName] = useState("")
  const [examStartDate, setExamStartDate] = useState("")
  const [examEndDate, setExamEndDate] = useState("")
  const [examClassId, setExamClassId] = useState("")
  const [examDesc, setExamDesc] = useState("")

  const [tbTitle, setTbTitle] = useState("")
  const [tbAuthor, setTbAuthor] = useState("")
  const [tbPublisher, setTbPublisher] = useState("")
  const [tbEdition, setTbEdition] = useState("2026 Edition")
  const [tbIsbn, setTbIsbn] = useState("")
  const [tbPrice, setTbPrice] = useState(350)
  const [tbSubjectId, setTbSubjectId] = useState("")
  const [tbMandatory, setTbMandatory] = useState(true)

  const [yearName, setYearName] = useState("")
  const [yearStart, setYearStart] = useState("2026-06-01")
  const [yearEnd, setYearEnd] = useState("2027-05-31")
  const [yearIsCurrent, setYearIsCurrent] = useState(false)

  const [cloneSourceId, setCloneSourceId] = useState("")
  const [cloneName, setCloneName] = useState("")
  const [cloneStart, setCloneStart] = useState("2027-06-01")
  const [cloneEnd, setCloneEnd] = useState("2028-05-31")

  const [secName, setSecName] = useState("")
  const [secCapacity, setSecCapacity] = useState(40)

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects
    const q = subjectSearch.toLowerCase()
    return subjects.filter((s: any) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
  }, [subjects, subjectSearch])

  // Helper to trigger notifications
  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg)
    setActionError(null)
    setTimeout(() => setActionSuccess(null), 4000)
  }
  const triggerError = (msg: string) => {
    setActionError(msg)
    setActionSuccess(null)
    setTimeout(() => setActionError(null), 5000)
  }

  // Add Class / Grade Modal state
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassSection, setNewClassSection] = useState("Section A")
  const [newClassCapacity, setNewClassCapacity] = useState(40)
  const [newClassDeptId, setNewClassDeptId] = useState("")

  // Subject Master (Grade-Scoped) state
  const [selectedSubjectGradeId, setSelectedSubjectGradeId] = useState<string>("")
  const activeSubjectGradeId = selectedSubjectGradeId || selectedGradeId || grades[0]?.id || classes[0]?.id || ""
  const currentSubjectGrade = grades.find((g) => g.id === activeSubjectGradeId) || grades[0]
  const { data: gradeMappedSubjects = [] } = useGradeSubjects(activeSubjectGradeId)

  // Edit Subject Modal state
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any | null>(null)
  const [editSubName, setEditSubName] = useState("")
  const [editSubCode, setEditSubCode] = useState("")
  const [editSubCredits, setEditSubCredits] = useState(4)
  const [editSubIsElective, setEditSubIsElective] = useState(false)
  const [editSubPeriods, setEditSubPeriods] = useState(5)
  const [editSubMaxMarks, setEditSubMaxMarks] = useState(100)
  const [editSubPassMarks, setEditSubPassMarks] = useState(35)
  const [editSubMandatory, setEditSubMandatory] = useState(true)

  // Add Subject to Grade Modal state
  const [isAddSubjectToGradeModalOpen, setIsAddSubjectToGradeModalOpen] = useState(false)
  const [addSubjectMode, setAddSubjectMode] = useState<"NEW" | "CATALOG">("NEW")
  const [catalogSubjectId, setCatalogSubjectId] = useState("")
  const [newGradeSubPeriods, setNewGradeSubPeriods] = useState(5)
  const [newGradeSubMaxMarks, setNewGradeSubMaxMarks] = useState(100)
  const [newGradeSubPassMarks, setNewGradeSubPassMarks] = useState(35)
  const [newGradeSubMandatory, setNewGradeSubMandatory] = useState(true)

  // Class & Subject Mutations
  const createClassMutation = useCreateClass()
  const updateClassMutation = useUpdateClass()
  const deleteClassMutation = useDeleteClass()
  const updateSubjectMutation = useUpdateSubject()
  const deleteSubjectMutation = useDeleteSubject()

  // Display subjects for selected grade in Subject Master
  const displayGradeSubjects = useMemo(() => {
    let list: any[] = []
    if (gradeMappedSubjects && gradeMappedSubjects.length > 0) {
      list = gradeMappedSubjects.map((s: any) => ({
        id: s.subject_id || s.id,
        name: s.subject_name || s.name,
        code: s.subject_code || s.code,
        credits: s.credits || 4,
        periodsPerWeek: s.periods_per_week || 5,
        maxMarks: s.max_marks || 100,
        passMarks: s.pass_marks || 35,
        isMandatory: s.is_mandatory ?? true,
        type: s.is_elective ? "ELECTIVE" : "CORE",
        isElective: !!s.is_elective,
      }))
    } else if (currentSubjectGrade?.subjects) {
      list = currentSubjectGrade.subjects.map((s: any) => ({
        ...s,
        isElective: s.type === "ELECTIVE",
      }))
    }

    if (!subjectSearch.trim()) return list
    const q = subjectSearch.toLowerCase()
    return list.filter((s: any) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
  }, [gradeMappedSubjects, currentSubjectGrade, subjectSearch])

  const handleOpenEditSubject = (sub: any) => {
    setEditingSubject(sub)
    setEditSubName(sub.name)
    setEditSubCode(sub.code)
    setEditSubCredits(sub.credits || 4)
    setEditSubIsElective(sub.isElective || sub.type === "ELECTIVE")
    setEditSubPeriods(sub.periodsPerWeek || 5)
    setEditSubMaxMarks(sub.maxMarks || 100)
    setEditSubPassMarks(sub.passMarks || 35)
    setEditSubMandatory(sub.isMandatory ?? true)
    setIsEditSubjectModalOpen(true)
  }

  const handleSaveSubjectEdit = async () => {
    if (!editSubName.trim() || !editSubCode.trim()) {
      triggerError("Subject name and code are required.")
      return
    }
    try {
      await updateSubjectMutation.mutateAsync({
        id: editingSubject.id,
        data: {
          name: editSubName.trim(),
          code: editSubCode.trim().toUpperCase(),
          credits: editSubCredits,
          isElective: editSubIsElective,
        },
      })
      if (activeSubjectGradeId) {
        await mapSubjectMutation.mutateAsync({
          classId: activeSubjectGradeId,
          subjectId: editingSubject.id,
          periodsPerWeek: editSubPeriods,
          maxMarks: editSubMaxMarks,
          passMarks: editSubPassMarks,
          isMandatory: editSubMandatory,
        })
      }
      triggerSuccess(`Subject "${editSubName}" updated successfully for ${currentSubjectGrade?.name}!`)
      setIsEditSubjectModalOpen(false)
      setEditingSubject(null)
    } catch (err: any) {
      triggerError(err.message || "Failed to update subject")
    }
  }

  const handleAddSubjectToGrade = async () => {
    if (!activeSubjectGradeId) {
      triggerError("Please select a class / grade first")
      return
    }

    try {
      let subjectIdToMap = ""
      if (addSubjectMode === "NEW") {
        if (!newSubName.trim() || !newSubCode.trim()) {
          triggerError("Subject name and code are required")
          return
        }
        const created = await createSubjectMutation.mutateAsync({
          name: newSubName.trim(),
          code: newSubCode.trim().toUpperCase(),
          credits: newSubCredits,
          isElective: newSubElective,
          departmentId: newSubDeptId || departments[0]?.id || undefined,
        })
        subjectIdToMap = created.id
      } else {
        if (!catalogSubjectId) {
          triggerError("Please select a subject from the catalog")
          return
        }
        subjectIdToMap = catalogSubjectId
      }

      await mapSubjectMutation.mutateAsync({
        classId: activeSubjectGradeId,
        subjectId: subjectIdToMap,
        periodsPerWeek: newGradeSubPeriods,
        maxMarks: newGradeSubMaxMarks,
        passMarks: newGradeSubPassMarks,
        isMandatory: newGradeSubMandatory,
      })

      triggerSuccess(`Subject added to ${currentSubjectGrade?.name} successfully!`)
      setIsAddSubjectToGradeModalOpen(false)
      setNewSubName("")
      setNewSubCode("")
      setCatalogSubjectId("")
    } catch (err: any) {
      triggerError(err.message || "Failed to add subject")
    }
  }

  const handleRemoveSubjectFromGrade = async (sub: any) => {
    if (confirm(`Remove subject "${sub.name}" from ${currentSubjectGrade?.name}?`)) {
      try {
        await removeSubjectMutation.mutateAsync({
          classId: activeSubjectGradeId,
          subjectId: sub.id,
        })
        triggerSuccess(`Removed "${sub.name}" from ${currentSubjectGrade?.name}.`)
      } catch (err: any) {
        triggerError(err.message || "Failed to remove subject")
      }
    }
  }

  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) {
      triggerError("Class / Grade name is required.")
      return
    }

    try {
      const created = await createClassMutation.mutateAsync({
        name: newClassName.trim(),
        academicYearId: activeYearId,
        departmentId: newClassDeptId || departments[0]?.id || undefined,
        sequenceOrder: grades.length + 1,
        initialSection: newClassSection.trim() || "Section A",
        initialCapacity: newClassCapacity || 40,
      })

      triggerSuccess(`Class / Grade "${newClassName}" added successfully with ${newClassSection || "Section A"}!`)
      setIsAddClassModalOpen(false)
      if (created?.id) {
        setSelectedGradeId(created.id)
        setSelectedSubjectGradeId(created.id)
      }
      setNewClassName("")
      setNewClassSection("Section A")
      setNewClassCapacity(40)
    } catch (err: any) {
      triggerError(err.message || "Failed to create class / grade")
    }
  }

  return (
    <AppShell
      pageTitle="Academics & Curriculum Management"
      breadcrumbs={[
        { label: "Core" },
        { label: "Academics" },
        {
          label:
            activeTab === "hierarchy"
              ? "Classes or Grades"
              : activeTab === "subjects"
              ? "Subject Master"
              : activeTab,
        },
      ]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          {activeTab === "hierarchy" && (
            <>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setNewClassName("")
                  setNewClassSection("Section A")
                  setNewClassCapacity(40)
                  setNewClassDeptId(departments[0]?.id || "")
                  setIsAddClassModalOpen(true)
                }}
              >
                Add Class / Grade
              </Button>
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<Layers className="w-3.5 h-3.5" />}
                onClick={() => setIsMatrixModalOpen(true)}
              >
                Generate Class Matrix
              </Button>
              <Button
                size="dense"
                variant="ghost"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddSectionModalOpen(true)}
              >
                Add Section
              </Button>
            </>
          )}

          {activeTab === "subjects" && (
            <Button
              size="dense"
              variant="primary"
              leadingIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setAddSubjectMode("NEW")
                setNewSubName("")
                setNewSubCode("")
                setNewSubCredits(4)
                setNewSubElective(false)
                setCatalogSubjectId("")
                setIsAddSubjectToGradeModalOpen(true)
              }}
            >
              Add Subject to {currentSubjectGrade?.name || "Grade"}
            </Button>
          )}

          {activeTab === "mapping" && (
            <>
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => setIsCopyMatrixModalOpen(true)}
              >
                Copy Subject Matrix
              </Button>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsMapSubjectModalOpen(true)}
              >
                Map Subject to Class
              </Button>
            </>
          )}

          {activeTab === "calendar" && (
            <Button
              size="dense"
              variant="primary"
              leadingIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddHolidayModalOpen(true)}
            >
              Add Calendar Event / Holiday
            </Button>
          )}

          {activeTab === "exams" && (
            <Button
              size="dense"
              variant="primary"
              leadingIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddExamModalOpen(true)}
            >
              Schedule Exam Estimate
            </Button>
          )}

          {activeTab === "textbooks" && (
            <>
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => setIsBooklistModalOpen(true)}
              >
                Printable Booklist
              </Button>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddTextbookModalOpen(true)}
              >
                Add Preferred Textbook
              </Button>
            </>
          )}

          {activeTab === "years" && (
            <>
              <Button
                size="dense"
                variant="secondary"
                leadingIcon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => setIsCloneYearModalOpen(true)}
              >
                Clone Previous Year
              </Button>
              <Button
                size="dense"
                variant="primary"
                leadingIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddYearModalOpen(true)}
              >
                Create Academic Year
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Alerts / Banner Notifications */}
        {actionSuccess && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Global Overview Card */}
        <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-subtle border border-border-default flex items-center justify-center text-brand-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-text-primary">
                  Academic Planning & Curriculum Studio
                </h1>
                <Badge variant={currentYear ? "positive" : "warning"}>
                  {currentYear ? `Current: ${currentYear.name}` : "No Active Year"}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage academic calendars, Grade x Section rosters, curriculum mapping, exam schedules, and textbooks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-text-secondary">Academic Year:</span>
            <select
              value={activeYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-border-default bg-subtle text-text-primary font-semibold text-xs"
            >
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.is_current ? "★ (Active)" : `(${y.status || "planning"})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-border-default overflow-x-auto pb-px">
          {[
            { id: "hierarchy", label: "Classes or Grades", icon: DoorOpen },
            { id: "subjects", label: "Subject Master", icon: BookOpen },
            { id: "mapping", label: "Curriculum Mapping", icon: Layers },
            { id: "calendar", label: "Year Schedule & Working Days", icon: CalendarDays },
            { id: "exams", label: "Exam Estimates (A2)", icon: Clock },
            { id: "textbooks", label: "Preferred Textbooks (A1)", icon: BookMarked },
            { id: "years", label: "Academic Years", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-action-primary text-action-primary bg-action-primary/5 font-semibold"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CLASSES OR GRADES */}
        {/* ========================================================================= */}
        {activeTab === "hierarchy" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Left: Grade Level Selector with Top-Left Add Button */}
            <div className="flex flex-col gap-3">
              {/* Prominent Top-Left Button as explicitly requested */}
              <Button
                variant="primary"
                size="default"
                className="w-full shadow-sm justify-center font-semibold"
                leadingIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setNewClassName("")
                  setNewClassSection("Section A")
                  setNewClassCapacity(40)
                  setNewClassDeptId(departments[0]?.id || "")
                  setIsAddClassModalOpen(true)
                }}
              >
                + Add Class / Grade
              </Button>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">
                  Classes or Grades ({grades.length})
                </span>
                <span className="text-[11px] font-mono text-text-muted">
                  Year: {currentYear?.name || "Active"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {grades.map((grade) => {
                  const isSelected = grade.id === activeGrade?.id
                  const totalStudents = grade.sections.reduce((acc, s) => acc + s.enrolled, 0)
                  const totalCapacity = grade.sections.reduce((acc, s) => acc + s.capacity, 0)

                  return (
                    <div
                      key={grade.id}
                      onClick={() => setSelectedGradeId(grade.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-action-primary text-white border-action-primary shadow-sm"
                          : "bg-surface hover:bg-subtle border-border-default text-text-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{grade.name}</span>
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                            isSelected ? "bg-white/20 text-white" : "bg-subtle text-text-secondary"
                          }`}
                        >
                          {grade.code}
                        </span>
                      </div>

                      <div className={`text-xs mt-2 ${isSelected ? "text-neutral-300" : "text-text-secondary"}`}>
                        {grade.curriculum}
                      </div>

                      <div className="mt-3">
                        <div
                          className={`flex justify-between text-[11px] font-mono mb-1 ${
                            isSelected ? "text-neutral-300" : "text-text-muted"
                          }`}
                        >
                          <span>Occupancy</span>
                          <span>
                            {totalStudents}/{totalCapacity}
                          </span>
                        </div>
                        <div
                          className={`h-1.5 rounded-full overflow-hidden ${
                            isSelected ? "bg-white/20" : "bg-neutral-200"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full ${
                              isSelected ? "bg-brand-primary" : "bg-action-primary"
                            }`}
                            style={{
                              width: `${Math.min(100, totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Grade Details (Sections & Subjects) */}
            <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-6">
              {activeGrade ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-subtle border border-border-default">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-text-primary">
                          {activeGrade.name} — Class Sections
                        </h2>
                        <Badge variant="neutral">{activeGrade.curriculum}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {activeGrade.sections.length} Active Classroom Sections Configured
                      </p>
                    </div>

                    <Button
                      size="dense"
                      variant="secondary"
                      leadingIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => setIsAddSectionModalOpen(true)}
                    >
                      Add Section
                    </Button>
                  </div>

                  {/* Sections Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeGrade.sections.map((section) => {
                      const pct = Math.round((section.enrolled / (section.capacity || 40)) * 100)
                      return (
                        <Card key={section.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-semibold">{section.name}</CardTitle>
                              <Badge variant={pct >= 95 ? "warning" : "positive"}>
                                {pct}% Capacity
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-3 text-xs">
                            <div className="flex items-center gap-2 text-text-secondary">
                              <DoorOpen className="w-3.5 h-3.5 text-text-muted" />
                              <span>{section.room}</span>
                            </div>

                            <div className="flex items-center gap-2 text-text-secondary">
                              <Users className="w-3.5 h-3.5 text-text-muted" />
                              <span className="font-semibold text-text-primary">
                                {section.classTeacher}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-border-subtle">
                              <div className="flex justify-between font-mono text-[11px] text-text-muted mb-1">
                                <span>Enrolled:</span>
                                <span className="font-semibold text-text-primary">
                                  {section.enrolled} / {section.capacity} seats
                                </span>
                              </div>
                              <ProgressBar value={section.enrolled} max={section.capacity} />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Prescribed Curriculum & Subject Offerings */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-brand-primary" />
                          <CardTitle className="text-sm">Prescribed Curriculum & Subject Offerings</CardTitle>
                        </div>
                        <Button
                          size="dense"
                          variant="ghost"
                          onClick={() => {
                            setMappingClassId(activeGrade.id)
                            setActiveTab("mapping")
                          }}
                        >
                          Configure Mapping Matrix →
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeGrade.subjects.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="p-3 rounded-lg bg-subtle border border-border-default flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-xs text-text-primary">{sub.name}</div>
                              <div className="text-[11px] font-mono text-text-secondary mt-0.5">
                                {sub.code} • {sub.credits} Credits • {sub.periodsPerWeek || 5} Periods/Wk
                              </div>
                            </div>
                            <Badge variant={sub.type === "CORE" ? "positive" : "neutral"}>
                              {sub.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="p-8 text-center bg-surface rounded-xl border border-border-default text-text-secondary text-sm">
                  No grades found for this academic year. Click "Generate Class Matrix" to create Grade 1 to 10 automatically.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SUBJECT MASTER (GRADE-SCOPED)                                      */}
        {/* ========================================================================= */}
        {activeTab === "subjects" && (
          <div className="flex flex-col gap-5">
            {/* Step 1: Select Grade / Class Control Header */}
            <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col gap-3 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                        Select Grade / Class:
                      </span>
                      <Badge variant="neutral" className="text-[10px] uppercase font-mono">
                        {grades.length} Grades
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Select a grade or class to view, add, or edit its prescribed subjects and marks allocation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={activeSubjectGradeId}
                    onChange={(e) => setSelectedSubjectGradeId(e.target.value)}
                    className="px-3.5 py-2 rounded-lg border border-border-default bg-subtle text-xs font-bold text-text-primary min-w-[200px]"
                  >
                    {grades.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.subjects?.length || 0} subjects)
                      </option>
                    ))}
                  </select>

                  <Button
                    size="default"
                    variant="primary"
                    leadingIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setAddSubjectMode("NEW")
                      setNewSubName("")
                      setNewSubCode("")
                      setNewSubCredits(4)
                      setNewSubElective(false)
                      setCatalogSubjectId("")
                      setIsAddSubjectToGradeModalOpen(true)
                    }}
                  >
                    + Add Subject to {currentSubjectGrade?.name || "Grade"}
                  </Button>
                </div>
              </div>

              {/* Horizontal Grade Chips for instant 1-click switching */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border-subtle pb-1">
                {grades.map((g: any) => {
                  const isSelected = g.id === activeSubjectGradeId
                  const subCount = g.subjects?.length || 0
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedSubjectGradeId(g.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-action-black text-canvas shadow-xs font-bold"
                          : "bg-subtle text-text-secondary hover:text-text-primary hover:bg-border-subtle border border-border-subtle"
                      }`}
                    >
                      <span>{g.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isSelected ? "bg-white/20 text-white" : "bg-border-default text-text-muted"
                        }`}
                      >
                        {subCount}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Subject Offerings for Selected Grade / Class */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border-default">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-bold text-text-primary">
                    Subjects for {currentSubjectGrade?.name || "Selected Grade"}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    ({displayGradeSubjects.length} Assigned)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder={`Search ${currentSubjectGrade?.name || "grade"} subjects...`}
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-border-default bg-subtle text-xs text-text-primary w-48 sm:w-64"
                    />
                  </div>

                  <Button
                    size="dense"
                    variant="secondary"
                    leadingIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setAddSubjectMode("NEW")
                      setNewSubName("")
                      setNewSubCode("")
                      setNewSubCredits(4)
                      setNewSubElective(false)
                      setCatalogSubjectId("")
                      setIsAddSubjectToGradeModalOpen(true)
                    }}
                  >
                    Add Subject
                  </Button>
                </div>
              </div>

              {/* Grid of Subject Cards */}
              {displayGradeSubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayGradeSubjects.map((sub: any) => (
                    <Card key={sub.id || sub.code} className="hover:border-border-strong transition-all flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-brand-primary px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20">
                            {sub.code}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={sub.type === "CORE" || !sub.isElective ? "positive" : "neutral"} size="sm">
                              {sub.type === "CORE" || !sub.isElective ? "CORE" : "ELECTIVE"}
                            </Badge>
                            {sub.isMandatory && (
                              <Badge variant="neutral" size="sm" className="text-[10px]">
                                Mandatory
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-sm font-bold text-text-primary mt-2">
                          {sub.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2.5 text-xs text-text-secondary pt-0">
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-subtle border border-border-subtle font-mono text-[11px]">
                          <div>
                            <span className="text-text-muted block text-[10px]">Periods / Week:</span>
                            <span className="font-bold text-text-primary">{sub.periodsPerWeek || 5} Periods</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Credits:</span>
                            <span className="font-bold text-text-primary">{sub.credits || 4} Credits</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Max Marks:</span>
                            <span className="font-bold text-text-primary">{sub.maxMarks || 100}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Pass Marks:</span>
                            <span className="font-bold text-text-primary">{sub.passMarks || 35}</span>
                          </div>
                        </div>

                        {/* Card Actions: Edit Subject or Remove from Grade */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                          <Button
                            size="dense"
                            variant="secondary"
                            leadingIcon={<Pencil className="w-3 h-3 text-brand-primary" />}
                            onClick={() => handleOpenEditSubject(sub)}
                          >
                            Edit Subject
                          </Button>
                          <Button
                            size="dense"
                            variant="ghost"
                            className="text-status-error hover:bg-status-error/10 hover:text-status-error"
                            leadingIcon={<Trash2 className="w-3 h-3" />}
                            onClick={() => handleRemoveSubjectFromGrade(sub)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      No subjects configured for {currentSubjectGrade?.name || "this grade"} yet
                    </h4>
                    <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                      Add the core curriculum and elective subjects taught to students in {currentSubjectGrade?.name || "this grade"}.
                    </p>
                  </div>
                  <Button
                    size="default"
                    variant="primary"
                    leadingIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setAddSubjectMode("NEW")
                      setNewSubName("")
                      setNewSubCode("")
                      setNewSubCredits(4)
                      setNewSubElective(false)
                      setCatalogSubjectId("")
                      setIsAddSubjectToGradeModalOpen(true)
                    }}
                  >
                    + Add Subject to {currentSubjectGrade?.name || "Grade"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CURRICULUM & SUBJECT MAPPING */}
        {/* ========================================================================= */}
        {activeTab === "mapping" && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-text-secondary font-mono">Target Class:</span>
                <select
                  value={activeMappingClassId}
                  onChange={(e) => setMappingClassId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border-default bg-subtle text-xs font-semibold text-text-primary"
                >
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="dense"
                  variant="secondary"
                  leadingIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => setIsCopyMatrixModalOpen(true)}
                >
                  Copy Matrix to Other Classes
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  leadingIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsMapSubjectModalOpen(true)}
                >
                  Map Subject
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Subject Mapping Matrix & Assessment Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-default text-text-secondary font-mono bg-subtle/50">
                        <th className="py-2.5 px-3">Subject Name</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-center">Periods / Week</th>
                        <th className="py-2.5 px-3 text-center">Max Marks</th>
                        <th className="py-2.5 px-3 text-center">Pass Marks</th>
                        <th className="py-2.5 px-3 text-center">Mandatory</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {mappedSubjects.map((sub: any) => (
                        <tr key={sub.id || sub.subject_id} className="hover:bg-subtle/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-text-primary">{sub.subject_name}</td>
                          <td className="py-3 px-3 font-mono text-text-secondary">{sub.subject_code}</td>
                          <td className="py-3 px-3">
                            <Badge variant={sub.is_elective ? "neutral" : "positive"} size="sm">
                              {sub.is_elective ? "Elective" : "Core"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-text-primary">
                            {sub.periods_per_week || 5}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{sub.max_marks || 100}</td>
                          <td className="py-3 px-3 text-center font-mono text-green-700 font-bold">
                            {sub.pass_marks || 35}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant={sub.is_mandatory ? "positive" : "neutral"} size="sm">
                              {sub.is_mandatory ? "Yes" : "Optional"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={async () => {
                                if (confirm(`Remove ${sub.subject_name} from this class?`)) {
                                  try {
                                    await removeSubjectMutation.mutateAsync({
                                      classId: activeMappingClassId,
                                      subjectId: sub.subject_id,
                                    })
                                    triggerSuccess(`Removed ${sub.subject_name} from class.`)
                                  } catch (err: any) {
                                    triggerError(err.message)
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {mappedSubjects.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-text-secondary text-xs">
                            No subjects mapped to this class yet. Click "Map Subject" to prescribe subjects.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: YEAR SCHEDULE & WORKING DAYS */}
        {/* ========================================================================= */}
        {activeTab === "calendar" && (
          <div className="flex flex-col gap-6">
            {/* Top Stats: Live Working Days Counter */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border-default">
                <span className="text-xs text-text-secondary font-mono">Total Calendar Days</span>
                <div className="text-2xl font-bold text-text-primary mt-1">
                  {workingDaysCount?.totalDays || 365}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <span className="text-xs text-green-700 font-mono font-semibold">Active Working Days</span>
                <div className="text-2xl font-bold text-green-800 mt-1">
                  {workingDaysCount?.workingDays || 220}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs text-blue-700 font-mono font-semibold">Holidays & Weekends</span>
                <div className="text-2xl font-bold text-blue-800 mt-1">
                  {workingDaysCount?.holidays || 120}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <span className="text-xs text-orange-700 font-mono font-semibold">Vacation Period Days</span>
                <div className="text-2xl font-bold text-orange-800 mt-1">
                  {workingDaysCount?.vacationDays || 25}
                </div>
              </div>
            </div>

            {/* Working Week Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-primary" />
                    <CardTitle className="text-sm font-semibold">Working Week Schedule (Default Days)</CardTitle>
                  </div>
                  <Button
                    size="dense"
                    variant="primary"
                    onClick={async () => {
                      try {
                        await saveCalendarConfigMutation.mutateAsync({
                          academicYearId: activeYearId,
                          workingDaysOfWeek: workingDaysSelection,
                        })
                        triggerSuccess("Working week configuration saved successfully.")
                      } catch (err: any) {
                        triggerError(err.message)
                      }
                    }}
                  >
                    Save Configuration
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { day: 1, label: "Monday" },
                    { day: 2, label: "Tuesday" },
                    { day: 3, label: "Wednesday" },
                    { day: 4, label: "Thursday" },
                    { day: 5, label: "Friday" },
                    { day: 6, label: "Saturday" },
                    { day: 7, label: "Sunday" },
                  ].map((d) => {
                    const isSelected = workingDaysSelection.includes(d.day)
                    return (
                      <button
                        key={d.day}
                        onClick={() => {
                          if (isSelected) {
                            setWorkingDaysSelection(workingDaysSelection.filter((x) => x !== d.day))
                          } else {
                            setWorkingDaysSelection([...workingDaysSelection, d.day].sort())
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-action-primary text-white border-action-primary"
                            : "bg-subtle text-text-secondary border-border-default hover:border-text-secondary"
                        }`}
                      >
                        {d.label} {isSelected ? "✓ (Working)" : "✕ (Off)"}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Interactive Date Checker Service Simulator */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  <CardTitle className="text-sm font-semibold">isWorkingDay(date) Service Simulator</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="date"
                  value={dateCheckInput}
                  onChange={(e) => setDateCheckInput(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border-default bg-subtle text-xs text-text-primary"
                />
                <Button
                  size="dense"
                  variant="secondary"
                  onClick={async () => {
                    if (!dateCheckInput) return
                    try {
                      const res = await fetch(
                        `http://localhost:5000/api/v1/academics/working-days/check?academicYearId=${activeYearId}&date=${dateCheckInput}`,
                        {
                          headers: {
                            "Content-Type": "application/json",
                            "X-Institution-Id": "18b3b9a6-0791-47f4-bbd0-bf7c0221e18f",
                          },
                        }
                      )
                      const json = await res.json()
                      setDateCheckResult(json.data)
                    } catch (err: any) {
                      triggerError("Check failed: " + err.message)
                    }
                  }}
                >
                  Verify Date
                </Button>

                {dateCheckResult && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Badge variant={dateCheckResult.isWorkingDay ? "positive" : "warning"}>
                      {dateCheckResult.isWorkingDay ? "Working Day" : "Non-Working Day"}
                    </Badge>
                    <span className="text-text-secondary">({dateCheckResult.reason})</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calendar Holidays & Special Days Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Special Calendar Events & Holidays List</CardTitle>
                  <Button
                    size="dense"
                    variant="primary"
                    leadingIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsAddHolidayModalOpen(true)}
                  >
                    Add Holiday
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-default text-text-secondary font-mono bg-subtle/50">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Working Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {calendarDays.map((cd: any) => (
                        <tr key={cd.id} className="hover:bg-subtle/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-text-primary">
                            {new Date(cd.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={cd.day_type === "vacation" ? "warning" : "info"} size="sm">
                              {cd.day_type}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-text-primary">{cd.description || "—"}</td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant={cd.is_working_day ? "positive" : "warning"} size="sm">
                              {cd.is_working_day ? "Working Day" : "Holiday / Off"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={async () => {
                                if (confirm(`Delete calendar day ${cd.description}?`)) {
                                  try {
                                    await deleteCalendarDayMutation.mutateAsync(cd.id)
                                    triggerSuccess("Calendar day removed.")
                                  } catch (err: any) {
                                    triggerError(err.message)
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {calendarDays.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-text-secondary text-xs">
                            No special holidays or vacation days configured yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: EXAM ESTIMATES (A2) */}
        {/* ========================================================================= */}
        {activeTab === "exams" && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Term Assessment Windows & Milestones</CardTitle>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Estimated examination schedules and evaluation time windows across grade levels.
                    </p>
                  </div>
                  <Button
                    size="dense"
                    variant="primary"
                    leadingIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsAddExamModalOpen(true)}
                  >
                    Schedule Assessment Window
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-default text-text-secondary font-mono bg-subtle/50">
                        <th className="py-2.5 px-3">Term / Assessment Name</th>
                        <th className="py-2.5 px-3">Grade Level Target</th>
                        <th className="py-2.5 px-3">Window Start</th>
                        <th className="py-2.5 px-3">Window End</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {examEstimates.map((ee: any) => (
                        <tr key={ee.id} className="hover:bg-subtle/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-text-primary">{ee.term_name}</td>
                          <td className="py-3 px-3">
                            <Badge variant="neutral" size="sm">
                              {ee.class_name || "All Grades"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono">{new Date(ee.start_date).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-mono">{new Date(ee.end_date).toLocaleDateString()}</td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                ee.status === "completed"
                                  ? "positive"
                                  : ee.status === "scheduled"
                                  ? "info"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {ee.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-text-secondary">{ee.description || "—"}</td>
                        </tr>
                      ))}
                      {examEstimates.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-text-secondary text-xs">
                            No exam estimated schedules configured. Click "Schedule Assessment Window" to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: PREFERRED TEXTBOOKS (A1) */}
        {/* ========================================================================= */}
        {activeTab === "textbooks" && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-text-secondary font-mono">Filter by Class:</span>
                <select
                  value={activeTextbookClassId}
                  onChange={(e) => setTextbookClassId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border-default bg-subtle text-xs font-semibold text-text-primary"
                >
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="dense"
                  variant="secondary"
                  leadingIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => setIsBooklistModalOpen(true)}
                >
                  Printable Booklist
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  leadingIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddTextbookModalOpen(true)}
                >
                  Add Preferred Textbook
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {textbooks.map((b: any) => (
                <Card key={b.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={b.is_mandatory ? "positive" : "neutral"} size="sm">
                        {b.is_mandatory ? "MANDATORY" : "RECOMMENDED"}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-brand-primary">
                        ₹{parseFloat(b.price || 0).toFixed(2)}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold mt-2">{b.title}</CardTitle>
                    <div className="text-xs text-text-secondary">by {b.author}</div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Publisher:</span>
                      <span className="text-text-primary font-medium">{b.publisher}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Edition:</span>
                      <span className="text-text-primary">{b.edition || "Latest Edition"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ISBN:</span>
                      <span className="font-mono text-text-primary">{b.isbn || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subject:</span>
                      <span className="font-semibold text-text-primary">{b.subject_name}</span>
                    </div>
                    <div className="pt-2 border-t border-border-subtle flex justify-end">
                      <button
                        onClick={async () => {
                          if (confirm(`Remove textbook ${b.title}?`)) {
                            try {
                              await deleteTextbookMutation.mutateAsync(b.id)
                              triggerSuccess("Textbook removed from catalog.")
                            } catch (err: any) {
                              triggerError(err.message)
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {textbooks.length === 0 && (
                <div className="col-span-full p-8 text-center bg-surface rounded-xl border border-border-default text-text-secondary text-sm">
                  No preferred textbooks prescribed for this class. Click "Add Preferred Textbook" to catalog recommended titles.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: ACADEMIC YEARS LIFECYCLE */}
        {/* ========================================================================= */}
        {activeTab === "years" && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Institutional Academic Calendar Years</CardTitle>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Configure yearly operational windows, current year status, and clone forward full academic structures.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="dense"
                      variant="secondary"
                      leadingIcon={<Copy className="w-3.5 h-3.5" />}
                      onClick={() => setIsCloneYearModalOpen(true)}
                    >
                      Clone Structure
                    </Button>
                    <Button
                      size="dense"
                      variant="primary"
                      leadingIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => setIsAddYearModalOpen(true)}
                    >
                      Create Year
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-default text-text-secondary font-mono bg-subtle/50">
                        <th className="py-2.5 px-3">Year Name</th>
                        <th className="py-2.5 px-3">Start Date</th>
                        <th className="py-2.5 px-3">End Date</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Classes</th>
                        <th className="py-2.5 px-3 text-center">Students</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {academicYears.map((ay: any) => (
                        <tr key={ay.id} className="hover:bg-subtle/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">{ay.name}</span>
                              {ay.is_current && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-700 border border-green-500/20">
                                  ★ ACTIVE CURRENT
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono">{new Date(ay.start_date).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-mono">{new Date(ay.end_date).toLocaleDateString()}</td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant={
                                ay.status === "active"
                                  ? "positive"
                                  : ay.status === "closed"
                                  ? "error"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {ay.status || "planning"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-text-primary">
                            {ay.classes_count || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{ay.students_count || 0}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!ay.is_current && ay.status !== "closed" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await setCurrentYearMutation.mutateAsync(ay.id)
                                      triggerSuccess(`Academic year "${ay.name}" set as current!`)
                                    } catch (err: any) {
                                      triggerError(err.message)
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-action-primary/10 text-action-primary text-xs font-semibold hover:bg-action-primary/20"
                                >
                                  Set as Current
                                </button>
                              )}
                              {ay.status !== "closed" && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`Close academic year "${ay.name}"?`)) {
                                      try {
                                        await closeYearMutation.mutateAsync(ay.id)
                                        triggerSuccess(`Academic year "${ay.name}" closed.`)
                                      } catch (err: any) {
                                        triggerError(err.message)
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-red-500/10 text-red-700 text-xs font-semibold hover:bg-red-500/20"
                                >
                                  Close Year
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD CLASS / GRADE                                                  */}
      {/* ========================================================================= */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div>
                <h3 className="text-base font-bold text-text-primary">Add Class or Grade</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Define a new class level with its initial classroom section
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Class / Grade Name <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Grade 1, Grade 11 - Science, Class 6"
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Academic Year</label>
                <select
                  value={activeYearId}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle/50 text-text-secondary cursor-not-allowed"
                >
                  <option value={activeYearId}>{currentYear?.name || "Active Year"}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Department</label>
                <select
                  value={newClassDeptId}
                  onChange={(e) => setNewClassDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                >
                  <option value="">Default Department</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Initial Section</label>
                  <input
                    type="text"
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                    placeholder="Section A"
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={newClassCapacity}
                    onChange={(e) => setNewClassCapacity(parseInt(e.target.value, 10) || 40)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-default mt-2">
                <Button
                  type="button"
                  size="dense"
                  variant="ghost"
                  onClick={() => setIsAddClassModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="dense"
                  variant="primary"
                  isLoading={createClassMutation.isPending}
                >
                  + Create Class / Grade
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SUBJECT TO GRADE                                               */}
      {/* ========================================================================= */}
      {isAddSubjectToGradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-border-default max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Add Subject to {currentSubjectGrade?.name || "Grade"}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Assign a new or existing subject to the curriculum of {currentSubjectGrade?.name || "this grade"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubjectToGradeModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-lg bg-subtle p-1 border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => setAddSubjectMode("NEW")}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                  addSubjectMode === "NEW"
                    ? "bg-surface text-text-primary shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Create New Subject
              </button>
              <button
                type="button"
                onClick={() => setAddSubjectMode("CATALOG")}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                  addSubjectMode === "CATALOG"
                    ? "bg-surface text-text-primary shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Choose from Catalog ({subjects.length})
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {addSubjectMode === "NEW" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-text-primary block mb-1">
                        Subject Name <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="e.g. Mathematics, Science"
                        className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-text-primary block mb-1">
                        Subject Code <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={newSubCode}
                        onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                        placeholder="e.g. MATH-10, SCI-01"
                        className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-text-primary block mb-1">Type</label>
                      <select
                        value={newSubElective ? "ELECTIVE" : "CORE"}
                        onChange={(e) => setNewSubElective(e.target.value === "ELECTIVE")}
                        className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                      >
                        <option value="CORE">CORE Subject</option>
                        <option value="ELECTIVE">ELECTIVE Subject</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-text-primary block mb-1">Credits</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={newSubCredits}
                        onChange={(e) => setNewSubCredits(parseInt(e.target.value, 10) || 4)}
                        className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="font-semibold text-text-primary block mb-1">
                    Select Subject from School Master Catalog <span className="text-status-error">*</span>
                  </label>
                  <select
                    value={catalogSubjectId}
                    onChange={(e) => setCatalogSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  >
                    <option value="">-- Choose a Subject --</option>
                    {subjects.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code}) • {sub.is_elective ? "Elective" : "Core"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assessment & Schedule parameters for this grade */}
              <div className="pt-2 border-t border-border-subtle mt-1">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-2 font-mono">
                  Grade Schedule & Marks Criteria
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-sans">Periods / Week</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newGradeSubPeriods}
                      onChange={(e) => setNewGradeSubPeriods(parseInt(e.target.value, 10) || 5)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-subtle text-text-primary text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-sans">Max Marks</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={newGradeSubMaxMarks}
                      onChange={(e) => setNewGradeSubMaxMarks(parseInt(e.target.value, 10) || 100)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-subtle text-text-primary text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-sans">Pass Marks</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newGradeSubPassMarks}
                      onChange={(e) => setNewGradeSubPassMarks(parseInt(e.target.value, 10) || 35)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-subtle text-text-primary text-center"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newSubMandatoryCheck"
                    checked={newGradeSubMandatory}
                    onChange={(e) => setNewGradeSubMandatory(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default text-brand-primary"
                  />
                  <label htmlFor="newSubMandatoryCheck" className="text-xs text-text-primary font-medium cursor-pointer">
                    Mandatory for all students enrolled in {currentSubjectGrade?.name || "this grade"}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
              <Button
                type="button"
                size="dense"
                variant="ghost"
                onClick={() => setIsAddSubjectToGradeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="dense"
                variant="primary"
                isLoading={createSubjectMutation.isPending || mapSubjectMutation.isPending}
                onClick={handleAddSubjectToGrade}
              >
                + Add to {currentSubjectGrade?.name || "Grade"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SUBJECT (GRADE-SCOPED & MASTER)                               */}
      {/* ========================================================================= */}
      {isEditSubjectModalOpen && editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-border-default max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Edit Subject: {editingSubject.name}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Modify subject details and curriculum criteria for {currentSubjectGrade?.name || "this grade"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditSubjectModalOpen(false)
                  setEditingSubject(null)
                }}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">
                    Subject Name <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={editSubName}
                    onChange={(e) => setEditSubName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">
                    Subject Code <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={editSubCode}
                    onChange={(e) => setEditSubCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Subject Type</label>
                  <select
                    value={editSubIsElective ? "ELECTIVE" : "CORE"}
                    onChange={(e) => setEditSubIsElective(e.target.value === "ELECTIVE")}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  >
                    <option value="CORE">CORE</option>
                    <option value="ELECTIVE">ELECTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Academic Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editSubCredits}
                    onChange={(e) => setEditSubCredits(parseInt(e.target.value, 10) || 4)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  />
                </div>
              </div>

              {/* Assessment parameters for this grade */}
              <div className="pt-2 border-t border-border-subtle mt-1">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-2 font-mono">
                  Weekly Schedule & Grading Criteria ({currentSubjectGrade?.name || "Grade"})
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-sans">Periods / Week</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editSubPeriods}
                      onChange={(e) => setEditSubPeriods(parseInt(e.target.value, 10) || 5)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-subtle text-text-primary text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-sans">Max Marks</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={editSubMaxMarks}
                      onChange={(e) => setEditSubMaxMarks(parseInt(e.target.value, 10) || 100)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-subtle text-text-primary text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted block mb-1 font-sans">Pass Marks</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editSubPassMarks}
                      onChange={(e) => setEditSubPassMarks(parseInt(e.target.value, 10) || 35)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border-default bg-subtle text-text-primary text-center"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editSubMandatoryCheck"
                    checked={editSubMandatory}
                    onChange={(e) => setEditSubMandatory(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default text-brand-primary"
                  />
                  <label htmlFor="editSubMandatoryCheck" className="text-xs text-text-primary font-medium cursor-pointer">
                    Mandatory for students in {currentSubjectGrade?.name || "this grade"}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
              <Button
                type="button"
                size="dense"
                variant="ghost"
                onClick={() => {
                  setIsEditSubjectModalOpen(false)
                  setEditingSubject(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="dense"
                variant="primary"
                isLoading={updateSubjectMutation.isPending || mapSubjectMutation.isPending}
                onClick={handleSaveSubjectEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERATE GRADE X SECTION MATRIX */}
      {/* ========================================================================= */}
      {isMatrixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Generate Grade x Section Class Matrix</h3>
            <p className="text-xs text-text-secondary">
              Automatically creates standard classes and classroom sections with default seating capacities for the selected academic year.
            </p>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Department</label>
                <select
                  value={matrixDeptId}
                  onChange={(e) => setMatrixDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                >
                  <option value="">Select Department</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Grade Levels (comma-separated)</label>
                <input
                  type="text"
                  value={matrixGrades}
                  onChange={(e) => setMatrixGrades(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  placeholder="Grade 1, Grade 2, Grade 3"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Classroom Sections (comma-separated)</label>
                <input
                  type="text"
                  value={matrixSections}
                  onChange={(e) => setMatrixSections(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  placeholder="Section A, Section B, Section C"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Default Student Capacity per Section</label>
                <input
                  type="number"
                  value={matrixCapacity}
                  onChange={(e) => setMatrixCapacity(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsMatrixModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!matrixDeptId) {
                    alert("Please select a department")
                    return
                  }
                  try {
                    const gList = matrixGrades.split(",").map((s) => s.trim()).filter(Boolean)
                    const sList = matrixSections.split(",").map((s) => s.trim()).filter(Boolean)
                    await generateMatrixMutation.mutateAsync({
                      academicYearId: activeYearId,
                      departmentId: matrixDeptId,
                      gradeNames: gList,
                      sectionNames: sList,
                      defaultCapacity: matrixCapacity,
                    })
                    triggerSuccess(`Generated ${gList.length} classes and ${gList.length * sList.length} sections!`)
                    setIsMatrixModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Generate Matrix
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SECTION */}
      {/* ========================================================================= */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Add Classroom Section</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Section Name (e.g. Section C)</label>
                <input
                  type="text"
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="Section C"
                />
              </div>
              <div>
                <label className="font-semibold text-text-primary block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  value={secCapacity}
                  onChange={(e) => setSecCapacity(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsAddSectionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!secName.trim() || !activeGrade?.id) return
                  try {
                    await createSectionMutation.mutateAsync({
                      classId: activeGrade.id,
                      data: { name: secName.trim(), capacity: secCapacity },
                    })
                    triggerSuccess(`Added ${secName} to ${activeGrade.name}`)
                    setSecName("")
                    setIsAddSectionModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Add Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SUBJECT */}
      {/* ========================================================================= */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Add New Subject Master</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="font-semibold text-text-primary block mb-1">Subject Code (Unique)</label>
                <input
                  type="text"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono uppercase"
                  placeholder="e.g. CS101"
                />
              </div>
              <div>
                <label className="font-semibold text-text-primary block mb-1">Credits</label>
                <input
                  type="number"
                  step="0.5"
                  value={newSubCredits}
                  onChange={(e) => setNewSubCredits(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="electiveCheck"
                  checked={newSubElective}
                  onChange={(e) => setNewSubElective(e.target.checked)}
                  className="rounded border-border-default"
                />
                <label htmlFor="electiveCheck" className="text-xs font-semibold text-text-primary">
                  Elective Subject (Optional)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsAddSubjectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!newSubName.trim() || !newSubCode.trim()) return
                  try {
                    await createSubjectMutation.mutateAsync({
                      name: newSubName.trim(),
                      code: newSubCode.trim(),
                      credits: newSubCredits,
                      isElective: newSubElective,
                    })
                    triggerSuccess(`Subject ${newSubName} created successfully!`)
                    setNewSubName("")
                    setNewSubCode("")
                    setIsAddSubjectModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Create Subject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MAP SUBJECT TO CLASS */}
      {/* ========================================================================= */}
      {isMapSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Map Subject to Class</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Select Subject</label>
                <select
                  value={mapSubjectId}
                  onChange={(e) => setMapSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Periods/Wk</label>
                  <input
                    type="number"
                    value={mapPeriods}
                    onChange={(e) => setMapPeriods(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={mapMaxMarks}
                    onChange={(e) => setMapMaxMarks(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={mapPassMarks}
                    onChange={(e) => setMapPassMarks(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mapMandatoryCheck"
                  checked={mapMandatory}
                  onChange={(e) => setMapMandatory(e.target.checked)}
                  className="rounded border-border-default"
                />
                <label htmlFor="mapMandatoryCheck" className="text-xs font-semibold text-text-primary">
                  Mandatory Subject
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsMapSubjectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!mapSubjectId) return
                  try {
                    await mapSubjectMutation.mutateAsync({
                      classId: activeMappingClassId,
                      subjectId: mapSubjectId,
                      periodsPerWeek: mapPeriods,
                      maxMarks: mapMaxMarks,
                      passMarks: mapPassMarks,
                      isMandatory: mapMandatory,
                    })
                    triggerSuccess("Subject mapped to class successfully!")
                    setIsMapSubjectModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Map Subject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COPY SUBJECT MATRIX */}
      {/* ========================================================================= */}
      {isCopyMatrixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Copy Subject Matrix to Other Classes</h3>
            <p className="text-xs text-text-secondary">
              Select classes to replicate all {mappedSubjects.length} mapped subjects from the source class.
            </p>

            <div className="max-h-48 overflow-y-auto divide-y divide-border-subtle border border-border-default rounded-lg p-2 text-xs">
              {classes
                .filter((c: any) => c.id !== activeMappingClassId)
                .map((c: any) => {
                  const isChecked = copyTargetClassIds.includes(c.id)
                  return (
                    <label key={c.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-subtle rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setCopyTargetClassIds(copyTargetClassIds.filter((id) => id !== c.id))
                          } else {
                            setCopyTargetClassIds([...copyTargetClassIds, c.id])
                          }
                        }}
                      />
                      <span className="font-semibold text-text-primary">{c.name}</span>
                    </label>
                  )
                })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsCopyMatrixModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (copyTargetClassIds.length === 0) return
                  try {
                    await copyMatrixMutation.mutateAsync({
                      sourceClassId: activeMappingClassId,
                      targetClassIds: copyTargetClassIds,
                    })
                    triggerSuccess(`Replicated subject matrix to ${copyTargetClassIds.length} classes!`)
                    setCopyTargetClassIds([])
                    setIsCopyMatrixModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Copy to Selected Classes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD HOLIDAY / CALENDAR EVENT */}
      {/* ========================================================================= */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Add Calendar Schedule Event / Holiday</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Event Date</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Day Type</label>
                <select
                  value={holidayType}
                  onChange={(e) => setHolidayType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                >
                  <option value="holiday">Holiday</option>
                  <option value="vacation">Vacation Break</option>
                  <option value="event">Special Event</option>
                  <option value="working">Override Working Day</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Description / Reason</label>
                <input
                  type="text"
                  value={holidayDesc}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="e.g. Diwali Festival"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="holidayWorkingCheck"
                  checked={holidayIsWorking}
                  onChange={(e) => setHolidayIsWorking(e.target.checked)}
                  className="rounded border-border-default"
                />
                <label htmlFor="holidayWorkingCheck" className="text-xs font-semibold text-text-primary">
                  Treat as Operational Working Day
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsAddHolidayModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!holidayDate) return
                  try {
                    await createCalendarDayMutation.mutateAsync({
                      academicYearId: activeYearId,
                      date: holidayDate,
                      dayType: holidayType,
                      description: holidayDesc,
                      isWorkingDay: holidayIsWorking,
                    })
                    triggerSuccess("Calendar event created successfully!")
                    setHolidayDate("")
                    setHolidayDesc("")
                    setIsAddHolidayModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Add Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD EXAM ESTIMATE */}
      {/* ========================================================================= */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Schedule Term Assessment Estimate</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Term / Examination Title</label>
                <input
                  type="text"
                  value={examTermName}
                  onChange={(e) => setExamTermName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="e.g. Midterm Examinations"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Target Grade / Class</label>
                <select
                  value={examClassId}
                  onChange={(e) => setExamClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                >
                  <option value="">All Grades</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={examStartDate}
                    onChange={(e) => setExamStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">End Date</label>
                  <input
                    type="date"
                    value={examEndDate}
                    onChange={(e) => setExamEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Assessment Notes</label>
                <input
                  type="text"
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="Evaluation guidelines..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsAddExamModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!examTermName || !examStartDate || !examEndDate) return
                  if (new Date(examStartDate) > new Date(examEndDate)) {
                    alert("End date cannot be earlier than start date")
                    return
                  }
                  try {
                    await createExamEstimateMutation.mutateAsync({
                      academicYearId: activeYearId,
                      termName: examTermName,
                      startDate: examStartDate,
                      endDate: examEndDate,
                      classId: examClassId || undefined,
                      description: examDesc,
                    })
                    triggerSuccess("Exam estimate scheduled successfully!")
                    setIsAddExamModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Schedule Assessment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PREFERRED TEXTBOOK */}
      {/* ========================================================================= */}
      {isAddTextbookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Add Preferred Textbook</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Book Title</label>
                <input
                  type="text"
                  value={tbTitle}
                  onChange={(e) => setTbTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="e.g. NCERT Science & Technology"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Author</label>
                  <input
                    type="text"
                    value={tbAuthor}
                    onChange={(e) => setTbAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Publisher</label>
                  <input
                    type="text"
                    value={tbPublisher}
                    onChange={(e) => setTbPublisher(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                    placeholder="Publisher name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Subject</label>
                  <select
                    value={tbSubjectId}
                    onChange={(e) => setTbSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Estimated Price (₹)</label>
                  <input
                    type="number"
                    value={tbPrice}
                    onChange={(e) => setTbPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">ISBN</label>
                  <input
                    type="text"
                    value={tbIsbn}
                    onChange={(e) => setTbIsbn(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary font-mono"
                    placeholder="978-..."
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Edition</label>
                  <input
                    type="text"
                    value={tbEdition}
                    onChange={(e) => setTbEdition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tbMandatoryCheck"
                  checked={tbMandatory}
                  onChange={(e) => setTbMandatory(e.target.checked)}
                  className="rounded border-border-default"
                />
                <label htmlFor="tbMandatoryCheck" className="text-xs font-semibold text-text-primary">
                  Mandatory Prescribed Book
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsAddTextbookModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!tbTitle || !tbAuthor || !tbPublisher || !tbSubjectId) return
                  try {
                    await createTextbookMutation.mutateAsync({
                      academicYearId: activeYearId,
                      classId: activeTextbookClassId,
                      subjectId: tbSubjectId,
                      title: tbTitle,
                      author: tbAuthor,
                      publisher: tbPublisher,
                      edition: tbEdition,
                      isbn: tbIsbn,
                      price: tbPrice,
                      isMandatory: tbMandatory,
                    })
                    triggerSuccess("Preferred textbook added to catalog!")
                    setTbTitle("")
                    setTbAuthor("")
                    setTbPublisher("")
                    setIsAddTextbookModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Add Textbook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE BOOKLIST VIEW */}
      {/* ========================================================================= */}
      {isBooklistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Prescribed Booklist — {booklistData?.className || "Class"}
                </h3>
                <span className="text-xs text-text-secondary font-mono">
                  Academic Year: {booklistData?.academicYear}
                </span>
              </div>
              <Button size="dense" variant="secondary" leadingIcon={<Printer className="w-3.5 h-3.5" />} onClick={() => window.print()}>
                Print Booklist
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-subtle text-xs font-mono">
              <div>
                <span className="text-text-secondary">Total Titles:</span>{" "}
                <span className="font-bold text-text-primary">{booklistData?.totalBooks || 0}</span>
              </div>
              <div>
                <span className="text-text-secondary">Mandatory:</span>{" "}
                <span className="font-bold text-text-primary">{booklistData?.mandatoryCount || 0}</span>
              </div>
              <div>
                <span className="text-text-secondary">Est. Cost:</span>{" "}
                <span className="font-bold text-brand-primary">₹{booklistData?.totalEstimatedCost || 0}</span>
              </div>
            </div>

            <div className="divide-y divide-border-subtle text-xs">
              {booklistData?.books?.map((b: any, idx: number) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-text-primary">
                      {idx + 1}. {b.title}
                    </div>
                    <div className="text-text-secondary">
                      {b.author} • {b.publisher} {b.isbn && `• ISBN: ${b.isbn}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-text-primary">₹{b.price}</div>
                    <Badge variant={b.is_mandatory ? "positive" : "neutral"} size="sm">
                      {b.is_mandatory ? "Mandatory" : "Optional"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsBooklistModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE ACADEMIC YEAR */}
      {/* ========================================================================= */}
      {isAddYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Create Academic Year</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Academic Year Name</label>
                <input
                  type="text"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="e.g. AY 2026-2027"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">End Date</label>
                  <input
                    type="date"
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="yearCurrentCheck"
                  checked={yearIsCurrent}
                  onChange={(e) => setYearIsCurrent(e.target.checked)}
                  className="rounded border-border-default"
                />
                <label htmlFor="yearCurrentCheck" className="text-xs font-semibold text-text-primary">
                  Set as Current Operating Year
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsAddYearModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  if (!yearName || !yearStart || !yearEnd) return
                  try {
                    await createYearMutation.mutateAsync({
                      name: yearName,
                      startDate: yearStart,
                      endDate: yearEnd,
                      isCurrent: yearIsCurrent,
                    })
                    triggerSuccess(`Academic Year ${yearName} created successfully!`)
                    setYearName("")
                    setIsAddYearModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Create Year
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLONE ACADEMIC YEAR */}
      {/* ========================================================================= */}
      {isCloneYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border-default max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary">Clone Previous Academic Year Structure</h3>
            <p className="text-xs text-text-secondary">
              Transfers all classes, sections, subject mappings, and prescribed textbooks into a new operational academic year.
            </p>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Source Academic Year</label>
                <select
                  value={cloneSourceId || activeYearId}
                  onChange={(e) => setCloneSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                >
                  {academicYears.map((y: any) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Target New Year Name</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  placeholder="e.g. AY 2028-2029"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={cloneStart}
                    onChange={(e) => setCloneStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">End Date</label>
                  <input
                    type="date"
                    value={cloneEnd}
                    onChange={(e) => setCloneEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-default bg-subtle text-text-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <Button size="dense" variant="ghost" onClick={() => setIsCloneYearModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={async () => {
                  const sId = cloneSourceId || activeYearId
                  if (!sId || !cloneName || !cloneStart || !cloneEnd) return
                  try {
                    const res = await cloneYearMutation.mutateAsync({
                      sourceYearId: sId,
                      data: {
                        name: cloneName,
                        startDate: cloneStart,
                        endDate: cloneEnd,
                        cloneClasses: true,
                        cloneSubjects: true,
                        cloneTextbooks: true,
                      },
                    })
                    triggerSuccess(`Cloned ${res.clonedClassesCount} classes and ${res.clonedSectionsCount} sections into ${cloneName}!`)
                    setCloneName("")
                    setIsCloneYearModalOpen(false)
                  } catch (err: any) {
                    triggerError(err.message)
                  }
                }}
              >
                Clone Year Structure
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
