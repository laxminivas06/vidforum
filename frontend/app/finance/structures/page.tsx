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
} from "@/components/ui"
import {
  Layers,
  Plus,
  IndianRupee,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Settings2,
} from "lucide-react"

interface FeeHead {
  id: string
  name: string
  amount: number
  frequency: "Annual" | "Per Term" | "Monthly" | "One-time"
  isOptional: boolean
}

interface ClassFeeStructure {
  id: string
  grade: string
  academicYear: string
  totalAnnual: number
  heads: FeeHead[]
}

const INITIAL_STRUCTURES: ClassFeeStructure[] = [
  {
    id: "fs-10",
    grade: "Class 10 (CBSE Secondary)",
    academicYear: "AY 2026-27",
    totalAnnual: 85000,
    heads: [
      { id: "h1", name: "Annual Tuition Fee", amount: 55000, frequency: "Per Term", isOptional: false },
      { id: "h2", name: "STEM & Science Lab Fee", amount: 12000, frequency: "Annual", isOptional: false },
      { id: "h3", name: "Computer & Robotics Lab", amount: 8000, frequency: "Annual", isOptional: false },
      { id: "h4", name: "CBSE Examination & Board Registration", amount: 5000, frequency: "One-time", isOptional: false },
      { id: "h5", name: "Digital Learning & AI Yantra Portal", amount: 5000, frequency: "Annual", isOptional: false },
    ],
  },
  {
    id: "fs-09",
    grade: "Class 9 (CBSE Secondary)",
    academicYear: "AY 2026-27",
    totalAnnual: 78000,
    heads: [
      { id: "h6", name: "Annual Tuition Fee", amount: 50000, frequency: "Per Term", isOptional: false },
      { id: "h7", name: "Integrated Lab Science", amount: 10000, frequency: "Annual", isOptional: false },
      { id: "h8", name: "Computer Lab & Coding", amount: 8000, frequency: "Annual", isOptional: false },
      { id: "h9", name: "Library & Sports Facilities", amount: 5000, frequency: "Annual", isOptional: false },
      { id: "h10", name: "Digital Portal & Assessments", amount: 5000, frequency: "Annual", isOptional: false },
    ],
  },
]

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<ClassFeeStructure[]>(INITIAL_STRUCTURES)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState("Class 10 (CBSE Secondary)")

  // New Head form
  const [newHeadName, setNewHeadName] = useState("")
  const [newAmount, setNewAmount] = useState(5000)
  const [newFreq, setNewFreq] = useState<FeeHead["frequency"]>("Annual")

  const handleAddHead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHeadName.trim()) return

    setStructures((prev) =>
      prev.map((s) => {
        if (s.grade === selectedGrade) {
          const newHead: FeeHead = {
            id: `h-${Date.now()}`,
            name: newHeadName.trim(),
            amount: Number(newAmount) || 0,
            frequency: newFreq,
            isOptional: false,
          }
          return {
            ...s,
            totalAnnual: s.totalAnnual + newHead.amount,
            heads: [...s.heads, newHead],
          }
        }
        return s
      })
    )

    setIsAddModalOpen(false)
    setNewHeadName("")
  }

  return (
    <AppShell
      pageTitle="Fee Structures Master"
      breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Fee Structures" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Fee Component
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Structures Overview Cards */}
        {structures.map((s) => (
          <Card key={s.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-default">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-primary" />
                  <span>{s.grade}</span>
                </CardTitle>
                <p className="text-xs text-text-secondary mt-0.5 font-mono">{s.academicYear} • Official Schedule</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-text-muted uppercase font-semibold block">Total Annual Fee</span>
                <span className="text-lg font-bold text-emerald-600 font-mono">
                  ₹{s.totalAnnual.toLocaleString("en-IN")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-subtle border-b border-border-default text-text-secondary font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Fee Component / Head</th>
                    <th className="py-2.5 px-4">Billing Frequency</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {s.heads.map((head) => (
                    <tr key={head.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-text-primary">{head.name}</td>
                      <td className="py-2.5 px-4 text-text-secondary">{head.frequency}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="neutral" className="text-[10px]">
                          {head.isOptional ? "Optional" : "Mandatory"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-text-primary text-right">
                        ₹{head.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Fee Head Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface border border-border-default rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-primary" />
                <span>Add Fee Component Head</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-sm p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddHead} className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Target Grade
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                >
                  <option value="Class 10 (CBSE Secondary)">Class 10 (CBSE Secondary)</option>
                  <option value="Class 9 (CBSE Secondary)">Class 9 (CBSE Secondary)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Component Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olympiad Preparation Fee"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    Frequency
                  </label>
                  <select
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value as any)}
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs text-text-primary"
                  >
                    <option value="Annual">Annual</option>
                    <option value="Per Term">Per Term</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default mt-4">
                <Button size="dense" variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="dense" variant="primary" type="submit">
                  Save Component
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
