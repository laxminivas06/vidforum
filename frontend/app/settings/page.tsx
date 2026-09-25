"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  SettingsShell,
  SettingsSection,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  FormField,
  Input,
  ConfirmDialog,
} from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import {
  Building,
  GraduationCap,
  Users,
  ToggleLeft,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

export default function SettingsPage() {
  const {
    institutionName,
    enabledModules,
    toggleOptionalModule,
  } = useAuth()

  const [activeSection, setActiveSection] = useState("branding")
  const [schoolName, setSchoolName] = useState(institutionName)
  const [schoolCode, setSchoolCode] = useState("SIA-BLR-001")
  const [boardAffiliation, setBoardAffiliation] = useState("CBSE / Affiliation No. 830192")
  const [contactEmail, setContactEmail] = useState("principal@springfield.edu")
  const [academicYear, setAcademicYear] = useState("2026 - 2027")
  const [isSaved, setIsSaved] = useState(false)
  const [confirmToggleModule, setConfirmToggleModule] = useState<string | null>(null)

  const optionalModulesList = [
    { key: "events", title: "Campus Events & Calendar", description: "Auditorium booking, parent-teacher meetings, sports days" },
    { key: "transport", title: "Fleet & Transport", description: "Bus routing, GPS telemetry, driver management, student pickup stops" },
    { key: "hostel", title: "Residential Hostel", description: "Dormitory allocation, room rosters, warden approvals, meal plans" },
    { key: "library", title: "Library Management", description: "ISBN cataloging, barcode circulation, overdue fine calculation" },
    { key: "sports", title: "Athletics & Sports", description: "Team rosters, sports equipment tracking, tournament schedules" },
    { key: "inventory", title: "Inventory & Assets", description: "Lab consumables, classroom projectors, IT equipment depreciation" },
  ]

  const sections: SettingsSection[] = [
    { id: "branding", label: "Profile & Branding", icon: <Building className="w-4 h-4" /> },
    { id: "academic", label: "Academic Structure", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "modules", label: "Modular Extensions", icon: <ToggleLeft className="w-4 h-4" />, badge: `${enabledModules.length} Active` },
    { id: "roles", label: "Staff & Permissions", icon: <Users className="w-4 h-4" /> },
    { id: "security", label: "Security & Vault", icon: <ShieldCheck className="w-4 h-4" /> },
  ]

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <AppShell
      pageTitle="Institution Settings"
      breadcrumbs={[{ label: "Configuration" }, { label: "Settings Shell" }]}
      rightHeaderAction={
        <Button
          size="dense"
          variant="primary"
          leadingIcon={<Save className="w-3.5 h-3.5" />}
          onClick={handleSave}
        >
          {isSaved ? "Saved Successfully!" : "Save Changes"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {isSaved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Institution configuration persisted to tenant master record.</span>
          </div>
        )}

        <SettingsShell
          sections={sections}
          activeSectionId={activeSection}
          onSelectSection={setActiveSection}
        >
          {/* 1. BRANDING & PROFILE */}
          {activeSection === "branding" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Institutional Profile & Identity
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Update primary institutional branding, accreditation details, and official domain records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Official Institution Name">
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Springfield International Academy"
                  />
                </FormField>

                <FormField label="Institutional Code (Prefix)">
                  <Input
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    placeholder="e.g. SIA-BLR"
                  />
                </FormField>

                <FormField label="Accreditation / Board Affiliation">
                  <Input
                    value={boardAffiliation}
                    onChange={(e) => setBoardAffiliation(e.target.value)}
                    placeholder="e.g. CBSE / ICSE / IB World"
                  />
                </FormField>

                <FormField label="Administrative Contact Email">
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="principal@institution.edu"
                  />
                </FormField>
              </div>

              {/* Identity Verification Mark */}
              <div className="p-4 rounded-xl bg-subtle border border-border-default flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    Verified Multi-Tenant Domain
                  </div>
                  <div className="text-xs font-mono text-brand-primary mt-0.5">
                    springfield.vid.edu (SSL Encrypted & Cloudflare Routed)
                  </div>
                </div>
                <Badge variant="positive">DNS HEALTHY</Badge>
              </div>
            </div>
          )}

          {/* 2. ACADEMIC STRUCTURE */}
          {activeSection === "academic" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Academic Calendar & Term Boundaries
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Configure active academic cycle, assessment terms, and weekly timetable rhythm.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Current Academic Year">
                  <Input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </FormField>

                <FormField label="Active Working Days">
                  <Input value="Monday — Saturday (Alternate Saturdays Off)" readOnly />
                </FormField>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col gap-2">
                <div className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                  Term Schedule (2026-2027)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-subtle border border-border-default">
                    <span className="font-semibold text-text-primary">Term 1 (Autumn)</span>
                    <p className="text-text-secondary mt-1">Jun 01, 2026 — Oct 15, 2026</p>
                    <Badge variant="positive" className="mt-2">Active</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-subtle border border-border-default">
                    <span className="font-semibold text-text-primary">Term 2 (Winter)</span>
                    <p className="text-text-secondary mt-1">Nov 01, 2026 — Feb 28, 2027</p>
                    <Badge variant="neutral" className="mt-2">Upcoming</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-subtle border border-border-default">
                    <span className="font-semibold text-text-primary">Annual Exams</span>
                    <p className="text-text-secondary mt-1">Mar 01, 2027 — Mar 25, 2027</p>
                    <Badge variant="neutral" className="mt-2">Scheduled</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. MODULAR EXTENSIONS (PRD Rule 5) */}
          {activeSection === "modules" && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-text-primary">
                    Modular Optional Extensions
                  </h2>
                  <Badge variant="neutral">PRD Rule 5 Compliance</Badge>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Toggling an extension on/off dynamically adapts the persistent navigation sidebar in real-time. Disabled modules completely disappear from the navigation rail.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {optionalModulesList.map((mod) => {
                  const isEnabled = enabledModules.includes(mod.key)
                  return (
                    <div
                      key={mod.key}
                      className="p-4 rounded-xl bg-surface border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-border-default/80"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text-primary">
                            {mod.title}
                          </span>
                          <Badge variant={isEnabled ? "positive" : "neutral"}>
                            {isEnabled ? "ENABLED" : "DISABLED"}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {mod.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          size="dense"
                          variant={isEnabled ? "destructive" : "primary"}
                          onClick={() => {
                            if (isEnabled) {
                              setConfirmToggleModule(mod.key)
                            } else {
                              toggleOptionalModule(mod.key)
                            }
                          }}
                        >
                          {isEnabled ? "Disable Module" : "Activate Extension"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. ROLES & PERMISSIONS */}
          {activeSection === "roles" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Staff Role Delegation & RBAC Gates
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Define departmental staff roles. Two-tier role resolution enforces strict field-level scoping.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-border-default flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between border-b border-border-default pb-2">
                  <span className="font-semibold text-text-primary">Admissions Officer</span>
                  <Badge variant="positive">Read / Write / Verify</Badge>
                </div>
                <div className="flex items-center justify-between border-b border-border-default pb-2">
                  <span className="font-semibold text-text-primary">Bursar & Finance Desk</span>
                  <Badge variant="positive">Collect / Invoicing / Ledgers</Badge>
                </div>
                <div className="flex items-center justify-between border-b border-border-default pb-2">
                  <span className="font-semibold text-text-primary">Faculty Instructor</span>
                  <Badge variant="neutral">Assigned Classes Scoped</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">Student & Parent</span>
                  <Badge variant="neutral">Self Record Read Only</Badge>
                </div>
              </div>
            </div>
          )}

          {/* 5. SECURITY & AUDIT */}
          {activeSection === "security" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Security Policies & Immutable Audit Trail
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Manage encryption certificates, multi-factor authentication, and export compliance logs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border-default flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">
                      Hardware MFA Enforced
                    </div>
                    <div className="text-xs text-text-secondary">
                      Mandatory FIDO2 or TOTP token for all staff accounts with write permissions
                    </div>
                  </div>
                  <Badge variant="positive">ENFORCED</Badge>
                </div>

                <div className="flex items-center justify-between border-t border-border-default pt-3">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">
                      Session Inactivity Timeout
                    </div>
                    <div className="text-xs text-text-secondary">
                      Automatically lock terminals after 15 minutes of inactivity
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold">15 MIN</span>
                </div>
              </div>
            </div>
          )}
        </SettingsShell>
      </div>

      {/* Confirmation Dialog for Disabling Modules */}
      <ConfirmDialog
        open={confirmToggleModule !== null}
        title="Disable Optional Module"
        description="Disabling this module will immediately remove it from all navigation bars across the institution. No historical data will be lost, but active views will be suspended."
        confirmLabel="Disable Extension"
        danger
        onConfirm={() => {
          if (confirmToggleModule) {
            toggleOptionalModule(confirmToggleModule)
            setConfirmToggleModule(null)
          }
        }}
        onCancel={() => setConfirmToggleModule(null)}
      />
    </AppShell>
  )
}
