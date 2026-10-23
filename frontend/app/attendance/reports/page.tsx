"use client"

import React, { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { 
  BarChart3, 
  Sparkles, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Filter, 
  GraduationCap, 
  TrendingUp,
  RefreshCw
} from "lucide-react"
import { loadAttendanceReports, AttendanceReportSummary } from "@/lib/face/sync"

export default function AttendanceReportsPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0])
  const [report, setReport] = useState<AttendanceReportSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchReports = async (dateStr: string) => {
    try {
      setLoading(true)
      const data = await loadAttendanceReports(dateStr)
      setReport(data)
    } catch (err) {
      console.error("Failed to load attendance report:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(selectedDate)
  }, [selectedDate])

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Navigation Item 9: Attendance Intelligence
              </span>
              <Badge variant="outline" className="text-muted-foreground text-xs font-mono">
                {selectedDate}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Institutional Attendance Reports & Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comprehensive biometric attendance rate summaries, AM/PM session distributions, and grade-level compliance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg text-xs">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent focus:outline-none text-foreground font-mono"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReports(selectedDate)}
              className="h-8 text-xs border-border/80"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-border bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Enrolled Students</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1.5">
              {report?.totalStudents || 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Active school roster</div>
          </Card>

          <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase">Present Today</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
              {report?.presentCount || 0}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              {report?.attendanceRate || 0}% overall rate
            </div>
          </Card>

          <Card className="p-4 border border-rose-500/20 bg-rose-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-800 dark:text-rose-300 font-semibold uppercase">Absent Today</span>
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1.5">
              {report?.absentCount || 0}
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">Unmarked roster count</div>
          </Card>

          <Card className="p-4 border border-sky-500/20 bg-sky-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-sky-800 dark:text-sky-300 font-semibold uppercase">Session Ratio</span>
              <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-sm font-bold font-mono text-foreground mt-2 flex items-center justify-between">
              <span>AM: {report?.amCount || 0}</span>
              <span>PM: {report?.pmCount || 0}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Biometric session splits</div>
          </Card>
        </div>

        {/* Grade-by-Grade Breakdown Table */}
        <Card className="border border-border/60 shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Class-by-Class Attendance Rates</CardTitle>
              <p className="text-xs text-muted-foreground">Detailed roster participation by class for {selectedDate}</p>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Class / Grade</th>
                  <th className="py-3 px-4 text-center">Total Students</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {!report?.classBreakdown || report.classBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                      No class breakdown data found for this date.
                    </td>
                  </tr>
                ) : (
                  report.classBreakdown.map((row, idx) => {
                    const absents = Math.max(0, row.total_students - row.present_students)
                    const rate = row.total_students > 0 ? Math.round((row.present_students / row.total_students) * 100) : 0

                    return (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground text-xs flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          <span>{row.class_name}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-xs text-foreground">
                          {row.total_students}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.present_students}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                          {absents}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  rate >= 75 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs w-9 text-right text-foreground">
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
