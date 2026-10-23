"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from "@/components/ui"
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Settings2, 
  BookOpen, 
  GraduationCap, 
  Search,
  Filter,
  Check,
  X,
  Power
} from "lucide-react"
import { 
  useAcademicBoards, 
  useCreateAcademicBoard, 
  useAcademicStreams, 
  useCreateAcademicStream, 
  useAcademicConfigurations, 
  useCreateAcademicConfiguration,
  useUpdateAcademicConfiguration,
  useDeleteAcademicConfiguration,
  useCreateCustomGrade 
} from "@/lib/api/academic-config.hooks"
import { useAcademicYears } from "@/lib/api/hooks"

export default function AcademicConfigurationPage() {
  const [activeTab, setActiveTab] = useState<"configurations" | "boards" | "streams">("configurations")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBoardFilter, setSelectedBoardFilter] = useState("all")

  // Modals
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false)
  const [isAddBoardOpen, setIsAddBoardOpen] = useState(false)
  const [isAddStreamOpen, setIsAddStreamOpen] = useState(false)
  const [isAddConfigOpen, setIsAddConfigOpen] = useState(false)

  // Form states
  const [gradeName, setGradeName] = useState("")
  const [gradeDisplayOrder, setGradeDisplayOrder] = useState<number>(11)
  const [gradeBoardId, setGradeBoardId] = useState("")
  const [gradeStreamId, setGradeStreamId] = useState("")
  const [gradeSections, setGradeSections] = useState("A, B")

  const [boardCode, setBoardCode] = useState("")
  const [boardName, setBoardName] = useState("")
  const [boardDesc, setBoardDesc] = useState("")

  const [streamCode, setStreamCode] = useState("")
  const [streamName, setStreamName] = useState("")
  const [streamDesc, setStreamDesc] = useState("")

  const [configClassId, setConfigClassId] = useState("")
  const [configBoardId, setConfigBoardId] = useState("")
  const [configStreamId, setConfigStreamId] = useState("")
  const [configDisplayOrder, setConfigDisplayOrder] = useState(1)

  // API Hooks
  const { data: academicYears = [] } = useAcademicYears()
  const activeYear = academicYears.find((y: any) => y.is_current) || academicYears[0]

  const { data: boards = [], isLoading: boardsLoading } = useAcademicBoards()
  const { data: streams = [], isLoading: streamsLoading } = useAcademicStreams()
  const { data: configs = [], isLoading: configsLoading } = useAcademicConfigurations(activeYear?.id)

  const createBoardMutation = useCreateAcademicBoard()
  const createStreamMutation = useCreateAcademicStream()
  const createConfigMutation = useCreateAcademicConfiguration()
  const updateConfigMutation = useUpdateAcademicConfiguration()
  const deleteConfigMutation = useDeleteAcademicConfiguration()
  const createCustomGradeMutation = useCreateCustomGrade()

  // Distinct classes for mapping
  const distinctClasses = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    configs.forEach((c) => {
      if (!map.has(c.class_id)) {
        map.set(c.class_id, { id: c.class_id, name: c.class_name })
      }
    })
    return Array.from(map.values())
  }, [configs])

  // Filtered configurations
  const filteredConfigs = React.useMemo(() => {
    return configs.filter((c) => {
      const matchesSearch = 
        c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.board_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.stream_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesBoard = selectedBoardFilter === "all" || c.board_code === selectedBoardFilter
      return matchesSearch && matchesBoard
    })
  }, [configs, searchQuery, selectedBoardFilter])

  // Handlers
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boardCode || !boardName) return
    await createBoardMutation.mutateAsync({
      code: boardCode.toUpperCase(),
      name: boardName,
      description: boardDesc,
    })
    setBoardCode("")
    setBoardName("")
    setBoardDesc("")
    setIsAddBoardOpen(false)
  }

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!streamCode || !streamName) return
    await createStreamMutation.mutateAsync({
      code: streamCode.toUpperCase(),
      name: streamName,
      description: streamDesc,
    })
    setStreamCode("")
    setStreamName("")
    setStreamDesc("")
    setIsAddStreamOpen(false)
  }

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradeName || !gradeBoardId || !activeYear) return
    const sectionsArray = gradeSections.split(",").map((s) => s.trim()).filter(Boolean)
    await createCustomGradeMutation.mutateAsync({
      name: gradeName,
      academicYearId: activeYear.id,
      boardId: gradeBoardId,
      streamId: gradeStreamId || null,
      displayOrder: Number(gradeDisplayOrder),
      optionalSections: sectionsArray,
    })
    setGradeName("")
    setGradeBoardId("")
    setGradeStreamId("")
    setIsAddGradeOpen(false)
  }

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configClassId || !configBoardId || !activeYear) return
    await createConfigMutation.mutateAsync({
      academicYearId: activeYear.id,
      classId: configClassId,
      boardId: configBoardId,
      streamId: configStreamId || null,
      displayOrder: Number(configDisplayOrder),
    })
    setConfigClassId("")
    setConfigBoardId("")
    setConfigStreamId("")
    setIsAddConfigOpen(false)
  }

  const handleToggleActive = async (configId: string, currentStatus: boolean) => {
    await updateConfigMutation.mutateAsync({
      id: configId,
      isActive: !currentStatus,
    })
  }

  return (
    <AppShell
      pageTitle="Academic Configuration"
      breadcrumbs={[
        { label: "Institute Admin", href: "/dashboard" },
        
        { label: "Academic Configuration" },
      ]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddBoardOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Board</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddStreamOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stream</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (boards.length > 0) setGradeBoardId(boards[0].id)
              setIsAddGradeOpen(true)
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Grade (+)</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Info Banner */}
        <div className="bg-surface rounded-2xl border border-border-default p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-text-primary tracking-tight">Academic Foundation Matrix</h1>
                <Badge variant="neutral" className="text-xs font-semibold">
                  {activeYear?.name || "AY 2026-27"}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Composite academic configuration linking <span className="font-semibold text-text-primary">Grade</span>, <span className="font-semibold text-text-primary">Curriculum Board</span>, and <span className="font-semibold text-text-primary">Specialized Streams</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <div className="flex bg-subtle p-1 rounded-xl border border-border-default text-xs font-medium w-full md:w-auto">
              <button
                onClick={() => setActiveTab("configurations")}
                className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "configurations"
                    ? "bg-canvas text-text-primary shadow-xs font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Configurations ({configs.length})
              </button>
              <button
                onClick={() => setActiveTab("boards")}
                className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "boards"
                    ? "bg-canvas text-text-primary shadow-xs font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Boards ({boards.length})
              </button>
              <button
                onClick={() => setActiveTab("streams")}
                className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "streams"
                    ? "bg-canvas text-text-primary shadow-xs font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Streams ({streams.length})
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: CONFIGURATIONS TABLE */}
        {activeTab === "configurations" && (
          <Card className="border border-border-default shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border-default/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-subtle/30">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Grade, Board, or Stream..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Filter className="w-3.5 h-3.5 text-text-muted" />
                  <span>Board:</span>
                  <select
                    value={selectedBoardFilter}
                    onChange={(e) => setSelectedBoardFilter(e.target.value)}
                    className="bg-canvas border border-border-default rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="all">All Boards</option>
                    {boards.map((b) => (
                      <option key={b.id} value={b.code}>
                        {b.code} ({b.name})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (distinctClasses.length > 0) setConfigClassId(distinctClasses[0].id)
                    if (boards.length > 0) setConfigBoardId(boards[0].id)
                    setIsAddConfigOpen(true)
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Combination</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-subtle/60 text-text-secondary uppercase tracking-wider font-semibold border-b border-border-default">
                    <th className="py-3 px-4 w-16">Seq</th>
                    <th className="py-3 px-4">Academic Grade</th>
                    <th className="py-3 px-4">Curriculum Board</th>
                    <th className="py-3 px-4">Stream / Specialization</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4 text-center">Sections</th>
                    <th className="py-3 px-4 text-center">Admission Exam</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/60">
                  {configsLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-text-secondary">
                        Loading academic configuration matrix...
                      </td>
                    </tr>
                  ) : filteredConfigs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-text-secondary">
                        No academic configurations found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredConfigs.map((cfg) => (
                      <tr key={cfg.id} className="hover:bg-subtle/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-text-muted">{cfg.class_sequence || cfg.display_order}</td>
                        <td className="py-3 px-4 font-semibold text-text-primary">
                          {cfg.class_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            {cfg.board_code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {cfg.stream_name !== "No Stream" && cfg.stream_name !== "General" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {cfg.stream_name}
                            </span>
                          ) : (
                            <span className="text-text-muted">General Curriculum</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{cfg.academic_year_name}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="neutral">{cfg.section_count || 1} Sec</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {cfg.requires_exam ? (
                            <Badge variant="warning" className="text-[10px]">Entrance Exam</Badge>
                          ) : (
                            <Badge variant="positive" className="text-[10px]">Direct Admission</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              cfg.is_active
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-neutral-500/10 text-text-muted"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.is_active ? "bg-emerald-500" : "bg-neutral-400"}`} />
                            {cfg.is_active ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleActive(cfg.id, cfg.is_active)}
                            title={cfg.is_active ? "Deactivate configuration" : "Activate configuration"}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-colors"
                          >
                            <Power className={`w-3.5 h-3.5 ${cfg.is_active ? "text-emerald-500" : "text-neutral-400"}`} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: BOARDS */}
        {activeTab === "boards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((b) => (
              <Card key={b.id} className="border border-border-default shadow-xs p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      {b.code}
                    </span>
                    <Badge variant={b.is_active ? "positive" : "neutral"} className="text-[10px]">
                      {b.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mt-3">{b.name}</h3>
                  <p className="text-xs text-text-secondary mt-1">{b.description || "Official recognized curriculum."}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-default/60 flex items-center justify-between text-[11px] text-text-muted">
                  <span>Created {new Date(b.created_at).toLocaleDateString()}</span>
                  <span className="text-brand-primary font-medium">Standard Board</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: STREAMS */}
        {activeTab === "streams" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streams.map((s) => (
              <Card key={s.id} className="border border-border-default shadow-xs p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {s.code}
                    </span>
                    <Badge variant={s.is_active ? "positive" : "neutral"} className="text-[10px]">
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mt-3">{s.name}</h3>
                  <p className="text-xs text-text-secondary mt-1">{s.description || "Specialized academic track."}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border-default/60 flex items-center justify-between text-[11px] text-text-muted">
                  <span>Configured</span>
                  <span className="text-amber-500 font-medium">Curriculum Track</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD GRADE (+) */}
      <Modal
        isOpen={isAddGradeOpen}
        onClose={() => setIsAddGradeOpen(false)}
        title="Add Grade / Class Configuration"
      >
        <form onSubmit={handleCreateGrade} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Grade Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              placeholder="e.g., Grade 11, Intermediate First Year"
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Curriculum Board <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={gradeBoardId}
                onChange={(e) => setGradeBoardId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Optional Stream
              </label>
              <select
                value={gradeStreamId}
                onChange={(e) => setGradeStreamId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
              >
                <option value="">No Stream (General)</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Display Order Sequence
              </label>
              <input
                type="number"
                value={gradeDisplayOrder}
                onChange={(e) => setGradeDisplayOrder(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Initial Sections (comma separated)
              </label>
              <input
                type="text"
                value={gradeSections}
                onChange={(e) => setGradeSections(e.target.value)}
                placeholder="A, B, C"
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border-default flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAddGradeOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createCustomGradeMutation.isPending}>
              {createCustomGradeMutation.isPending ? "Saving..." : "Save Grade & Combination"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD BOARD */}
      <Modal
        isOpen={isAddBoardOpen}
        onClose={() => setIsAddBoardOpen(false)}
        title="Add Academic Board / Curriculum"
      >
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Board Code (e.g. CBSE, ICSE, IB) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={boardCode}
              onChange={(e) => setBoardCode(e.target.value.toUpperCase())}
              placeholder="e.g. ICSE"
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Full Board Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="e.g. Indian Certificate of Secondary Education"
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Description / Notes
            </label>
            <textarea
              value={boardDesc}
              onChange={(e) => setBoardDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-border-default flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAddBoardOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createBoardMutation.isPending}>
              {createBoardMutation.isPending ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD STREAM */}
      <Modal
        isOpen={isAddStreamOpen}
        onClose={() => setIsAddStreamOpen(false)}
        title="Add Curriculum Stream / Track"
      >
        <form onSubmit={handleCreateStream} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Stream Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={streamCode}
              onChange={(e) => setStreamCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS_AP"
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Stream Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="e.g. Computer Science Advanced"
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Description
            </label>
            <textarea
              value={streamDesc}
              onChange={(e) => setStreamDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-border-default flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAddStreamOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createStreamMutation.isPending}>
              {createStreamMutation.isPending ? "Creating..." : "Create Stream"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD COMBINATION */}
      <Modal
        isOpen={isAddConfigOpen}
        onClose={() => setIsAddConfigOpen(false)}
        title="Link Grade, Board & Stream Combination"
      >
        <form onSubmit={handleCreateConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Grade / Class <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={configClassId}
              onChange={(e) => setConfigClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
            >
              {distinctClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Board <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={configBoardId}
                onChange={(e) => setConfigBoardId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} ({b.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Stream (Optional)
              </label>
              <select
                value={configStreamId}
                onChange={(e) => setConfigStreamId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-canvas border border-border-default rounded-xl focus:outline-none focus:border-brand-primary"
              >
                <option value="">General Curriculum</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-border-default flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAddConfigOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createConfigMutation.isPending}>
              {createConfigMutation.isPending ? "Saving..." : "Save Combination"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
