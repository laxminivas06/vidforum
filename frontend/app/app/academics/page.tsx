"use client"

import React, { useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "@/components/ui"
import {
  BookOpen,
  GraduationCap,
  Award,
  Download,
  CheckCircle2,
  FileText,
  User,
  ExternalLink,
} from "lucide-react"

interface SubjectProgress {
  code: string
  name: string
  teacher: string
  textbook: string
  syllabusCoveredPct: number
  term1Marks: number
  maxMarks: number
  grade: string
}

const MY_SUBJECTS: SubjectProgress[] = [
  {
    code: "041",
    name: "Mathematics Standard",
    teacher: "Sri T. Ramesh Chary (PGT Maths)",
    textbook: "NCERT Mathematics Class 10",
    syllabusCoveredPct: 68,
    term1Marks: 76,
    maxMarks: 80,
    grade: "A1",
  },
  {
    code: "086",
    name: "Science & Technology",
    teacher: "Dr. P. Venkata Subba Rao (Principal)",
    textbook: "NCERT Science Class 10",
    syllabusCoveredPct: 65,
    term1Marks: 74,
    maxMarks: 80,
    grade: "A1",
  },
  {
    code: "087",
    name: "Social Science",
    teacher: "Sri Ch. Satyanarayana (PGT Social)",
    textbook: "India and the Contemporary World II",
    syllabusCoveredPct: 60,
    term1Marks: 71,
    maxMarks: 80,
    grade: "A1",
  },
  {
    code: "184",
    name: "English Language & Literature",
    teacher: "Smt. S. Kavitha Rao (TGT English)",
    textbook: "First Flight & Footprints Without Feet",
    syllabusCoveredPct: 72,
    term1Marks: 73,
    maxMarks: 80,
    grade: "A1",
  },
  {
    code: "165",
    name: "Computer Applications",
    teacher: "Sri M. Aditya Nandan (PGT Computers)",
    textbook: "Computer Applications for Class 10 (CBSE)",
    syllabusCoveredPct: 80,
    term1Marks: 45,
    maxMarks: 50,
    grade: "A1",
  },
]

export default function StudentAcademicsPage() {
  return (
    <AppShell
      pageTitle="My Academic Subjects & Ledger"
      breadcrumbs={[{ label: "Portal", href: "/app/home" }, { label: "Academics" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => alert("Downloading official CBSE Term Progress Report...")}
          >
            Download Report Card (PDF)
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Academic Profile Strip */}
        <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Curriculum: CBSE Secondary High School</h3>
              <p className="text-xs text-text-secondary mt-0.5">Session: AY 2026-27 • Class 10 (Section A - Ramanujan)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="positive">Aggregate 92.4%</Badge>
            <Badge variant="neutral">Grade A1</Badge>
          </div>
        </div>

        {/* Subjects List */}
        <div className="space-y-4">
          {MY_SUBJECTS.map((sub) => (
            <Card key={sub.code}>
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-subtle text-text-secondary flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                    {sub.code}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-text-primary truncate">{sub.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-text-muted" />
                      <span>{sub.teacher}</span>
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-text-muted" />
                      <span>Textbook: {sub.textbook}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border-default/60">
                  {/* Progress */}
                  <div className="text-right sm:w-36">
                    <div className="flex justify-between text-[11px] text-text-secondary mb-1">
                      <span>Syllabus:</span>
                      <span className="font-mono font-bold">{sub.syllabusCoveredPct}%</span>
                    </div>
                    <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-primary h-full rounded-full"
                        style={{ width: `${sub.syllabusCoveredPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Marks & Grade */}
                  <div className="text-right min-w-[70px]">
                    <span className="text-[10px] text-text-muted uppercase font-semibold block">Score</span>
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {sub.term1Marks} / {sub.maxMarks}
                    </span>
                  </div>

                  <Badge variant="positive" className="font-mono font-bold">
                    {sub.grade}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
