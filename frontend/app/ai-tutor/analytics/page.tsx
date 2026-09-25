"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  SpotHeroPanel,
  Button,
  Badge,
  ProgressBar,
} from "@/components/ui"
import {
  Bot,
  BrainCircuit,
  TrendingUp,
  BookOpen,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from "lucide-react"

export default function AITutorAnalyticsPage() {
  return (
    <AppShell
      pageTitle="AI Yantra — Personalized Tutor Insights"
      breadcrumbs={[{ label: "AI Yantra" }, { label: "Tutor Telemetry" }]}
    >
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Inquiries Resolved"
            value="1,420"
            delta="+24% this week"
            deltaType="increase"
            icon={<Bot className="w-5 h-5" />}
            description="Across Mathematics & Sciences"
          />
          <StatCard
            label="Average Solution Time"
            value="18 sec"
            delta="Instant step-by-step"
            deltaType="neutral"
            icon={<Sparkles className="w-5 h-5" />}
            description="Grounded in school syllabus"
          />
          <StatCard
            label="Concept Mastery Lift"
            value="+14.2%"
            delta="In mid-term scores"
            deltaType="increase"
            icon={<TrendingUp className="w-5 h-5" />}
            description="For students using AI Tutor"
          />
          <StatCard
            label="Active Student Users"
            value="684"
            delta="28% of total cohort"
            deltaType="increase"
            icon={<BookOpen className="w-5 h-5" />}
            description="Self-directed study sessions"
          />
        </div>

        {/* Diagnostic Weak Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-brand-primary" />
                <CardTitle className="text-sm">Cohort Learning Obstacles (Most Queried)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-xs">
              <div>
                <div className="flex justify-between font-mono mb-1">
                  <span className="font-semibold text-text-primary">
                    Quadratic Formula & Complex Roots (Grade 10)
                  </span>
                  <span>142 queries (64% struggle index)</span>
                </div>
                <ProgressBar value={64} max={100} />
              </div>

              <div>
                <div className="flex justify-between font-mono mb-1">
                  <span className="font-semibold text-text-primary">
                    Electromagnetic Induction & Lenz's Law (Grade 11)
                  </span>
                  <span>118 queries (52% struggle index)</span>
                </div>
                <ProgressBar value={52} max={100} />
              </div>

              <div>
                <div className="flex justify-between font-mono mb-1">
                  <span className="font-semibold text-text-primary">
                    Organic Reaction Mechanisms (Grade 12)
                  </span>
                  <span>98 queries (48% struggle index)</span>
                </div>
                <ProgressBar value={48} max={100} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm">Automated Teaching Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-lg bg-subtle border border-border-default flex flex-col gap-1">
                <span className="font-semibold text-text-primary">
                  Recommend Review Lecture for Grade 10-A
                </span>
                <p className="text-text-secondary">
                  34% of pupils prompted the AI Tutor for clarification on parabola vertex transformations after Wednesday's lecture.
                </p>
                <span className="text-[10px] font-mono text-brand-primary font-semibold mt-1">
                  DISPATCHED TO MRS. REVATHI RAMAN
                </span>
              </div>

              <div className="p-3 rounded-lg bg-subtle border border-border-default flex flex-col gap-1">
                <span className="font-semibold text-text-primary">
                  Practice Problem Set Generated
                </span>
                <p className="text-text-secondary">
                  50 customized progressive difficulty questions created for Grade 11 Physics cohort.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
