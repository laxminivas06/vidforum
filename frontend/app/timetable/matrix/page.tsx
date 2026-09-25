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
import { Clock, Plus, CheckCircle2, AlertTriangle, Calendar } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const PERIODS = [
  { period: "Period 1", time: "08:30 - 09:30" },
  { period: "Period 2", time: "09:30 - 10:30" },
  { period: "Period 3", time: "10:45 - 11:45" },
  { period: "Period 4", time: "11:45 - 12:45" },
  { period: "Period 5", time: "01:30 - 02:30" },
  { period: "Period 6", time: "02:30 - 03:30" },
]

export default function TimetableMatrixPage() {
  const [selectedGrade, setSelectedGrade] = useState("Grade 10 - Section A")

  return (
    <AppShell
      pageTitle="Timetable Conflict Matrix"
      breadcrumbs={[{ label: "Core" }, { label: "Timetable Matrix" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button size="dense" variant="secondary">
            Auto-Resolve Conflicts
          </Button>
          <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
            Assign Period
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary font-medium">Select Class:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 font-medium text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="Grade 10 - Section A">Grade 10 - Section A</option>
              <option value="Grade 10 - Section B">Grade 10 - Section B</option>
              <option value="Grade 11 - Section A">Grade 11 - Section A (Science)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-brand-primary" />
            <span className="font-semibold text-text-primary">Conflict-Free Schedule</span>
          </div>
        </div>

        {/* Timetable Weekly Matrix */}
        <div className="overflow-x-auto rounded-xl border border-border-default bg-surface shadow-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle border-b border-border-default">
                <th className="p-3 font-mono font-semibold text-text-secondary uppercase w-32">
                  Timing
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-3 font-semibold text-text-primary border-l border-border-default"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((slot, idx) => (
                <tr key={slot.period} className="border-b border-border-default hover:bg-subtle/40">
                  <td className="p-3 font-mono text-[11px] text-text-secondary bg-subtle/30">
                    <div className="font-semibold text-text-primary">{slot.period}</div>
                    <div className="text-text-muted">{slot.time}</div>
                  </td>
                  {DAYS.map((day) => (
                    <td key={day} className="p-3 border-l border-border-default">
                      <div className="p-2 rounded-lg bg-canvas border border-border-default/80 flex flex-col gap-1">
                        <span className="font-semibold text-text-primary">
                          {idx % 2 === 0 ? "Mathematics" : "Physics & Lab"}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {idx % 2 === 0 ? "Mrs. Revathi Raman" : "Dr. Arvind Rao"}
                        </span>
                        <span className="text-[10px] font-mono text-brand-primary font-medium">
                          Room B-201
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
