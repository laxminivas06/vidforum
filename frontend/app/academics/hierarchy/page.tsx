"use client"

import React, { useState } from "react"
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
} from "lucide-react"
import { useAcademics } from "@/lib/api/hooks"
import { AcademicGrade } from "@/types"

export default function AcademicsHierarchyPage() {
  const { data: grades = [], isLoading } = useAcademics()
  const [selectedGradeId, setSelectedGradeId] = useState<string>(grades[0]?.id || "grd-10")

  const activeGrade = grades.find((g) => g.id === selectedGradeId) || grades[0]

  return (
    <AppShell
      pageTitle="Academic Hierarchy & Sections"
      breadcrumbs={[{ label: "Core" }, { label: "Academics" }, { label: "Class Hierarchy" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button size="dense" variant="secondary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Grade
          </Button>
          <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
            Create Section
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Header Overview Card */}
        <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-subtle border border-border-default flex items-center justify-center text-brand-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-text-primary">
                  Academic Structure & Section Roster
                </h1>
                <Badge variant="positive">Affiliated Curriculum Active</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage grades, classrooms, class teacher assignments, and course credit distributions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-text-secondary">Total Active Grades:</span>
            <span className="font-bold text-text-primary">{grades.length}</span>
          </div>
        </div>

        {/* 2-Pane Grade Explorer */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Left: Grade Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono px-1">
              Select Grade Level
            </span>
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
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-subtle text-text-secondary"
                        }`}
                      >
                        {grade.code}
                      </span>
                    </div>

                    <div
                      className={`text-xs mt-2 ${
                        isSelected ? "text-neutral-300" : "text-text-secondary"
                      }`}
                    >
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
                            width: `${Math.min(100, (totalStudents / totalCapacity) * 100)}%`,
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
            {activeGrade && (
              <>
                {/* Active Grade Header */}
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

                  <Button size="dense" variant="secondary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add New Section
                  </Button>
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeGrade.sections.map((section) => {
                    const pct = Math.round((section.enrolled / section.capacity) * 100)
                    return (
                      <Card key={section.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                              {section.name}
                            </CardTitle>
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

                {/* Subject Offerings */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-brand-primary" />
                        <CardTitle className="text-sm">
                          Prescribed Curriculum & Subject Offerings
                        </CardTitle>
                      </div>
                      <Button size="dense" variant="ghost">
                        Assign Faculty →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeGrade.subjects.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 rounded-lg bg-subtle border border-border-default flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-xs text-text-primary">
                              {sub.name}
                            </div>
                            <div className="text-[11px] font-mono text-text-secondary mt-0.5">
                              {sub.code} • {sub.credits} Credits
                            </div>
                          </div>
                          <Badge
                            variant={
                              sub.type === "CORE"
                                ? "positive"
                                : sub.type === "LAB"
                                ? "warning"
                                : "neutral"
                            }
                          >
                            {sub.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
