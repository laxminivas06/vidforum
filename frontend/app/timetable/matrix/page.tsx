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
import { Clock, Plus, CheckCircle2, AlertTriangle, Calendar, Layers } from "lucide-react"
import { useClasses } from "@/lib/api/hooks"

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
  const { data: classes = [] } = useClasses()
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [scheduleAllocations, setScheduleAllocations] = useState<Record<string, any>>({})

  const currentClass = classes.find((c: any) => c.id === selectedClassId) || classes[0]

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
            <span className="text-xs text-text-secondary font-medium">Select Class / Grade:</span>
            {classes.length > 0 ? (
              <select
                value={selectedClassId || currentClass?.id}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 font-medium text-text-primary focus:outline-none cursor-pointer min-w-[200px]"
              >
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-mono text-text-muted">
                No classes configured yet
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-brand-primary" />
            <span className="font-semibold text-text-primary">Conflict Detection Active</span>
          </div>
        </div>

        {/* Timetable Weekly Matrix */}
        {classes.length > 0 ? (
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
                {PERIODS.map((slot) => (
                  <tr key={slot.period} className="border-b border-border-default hover:bg-subtle/40">
                    <td className="p-3 font-mono text-[11px] text-text-secondary bg-subtle/30">
                      <div className="font-semibold text-text-primary">{slot.period}</div>
                      <div className="text-text-muted">{slot.time}</div>
                    </td>
                    {DAYS.map((day) => {
                      const key = `${day}-${slot.period}`
                      const allocation = scheduleAllocations[key]

                      return (
                        <td key={day} className="p-2 border-l border-border-default">
                          {allocation ? (
                            <div className="p-2 rounded-lg bg-canvas border border-border-default flex flex-col gap-1">
                              <span className="font-semibold text-text-primary">
                                {allocation.subject}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                {allocation.teacher}
                              </span>
                              <span className="text-[10px] font-mono text-brand-primary font-medium">
                                {allocation.room}
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg border border-dashed border-border-subtle hover:border-brand-primary/40 bg-canvas/50 text-center text-[11px] text-text-muted transition-colors flex items-center justify-center">
                              <span>Unassigned</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                No Classes Configured For Timetable
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                Add classes or grades in Academics & Curriculum workspace first to configure periods, faculty subject assignments, and conflict-free weekly timetables.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
