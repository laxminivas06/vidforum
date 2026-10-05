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
  User,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Heart,
  Bus,
  FileText,
  ShieldCheck,
  Edit3,
  Calendar,
  Download,
  AlertCircle,
  Building2,
  X,
} from "lucide-react"

export default function StudentParentProfilePage() {
  const [activeTab, setActiveTab] = useState<"BIO" | "PARENTS" | "TRANSPORT" | "DOCS">("BIO")
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Parent update form state
  const [parentPhone, setParentPhone] = useState("+91 98490 12345")
  const [parentEmail, setParentEmail] = useState("raghavendra.chary@gmail.com")
  const [emergencyPhone, setEmergencyPhone] = useState("+91 98490 54321")

  const student = {
    fullName: "Sai Teja Chary",
    admissionNo: "NGS-HYD-2026-001",
    penNo: "210492817203", // CBSE Permanent Education Number
    rollNo: "10-A-01",
    grade: "Class 10 - Section A",
    house: "Shivaji House (Emerald Green)",
    dob: "April 14, 2011 (15 Years)",
    gender: "Male",
    bloodGroup: "O+ (Positive)",
    aadhaarMasked: "•••• •••• 8912",
    institution: "Narayana e-Techno School, Hyderabad",
    affiliation: "CBSE Board (Affiliation #3630124)",
    admissionDate: "June 12, 2021",
    status: "Active Student",
  }

  const handleSaveContactUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateSuccess(true)
    setTimeout(() => {
      setUpdateSuccess(false)
      setIsUpdateModalOpen(false)
    }, 1200)
  }

  return (
    <AppShell
      pageTitle="Student & Guardian Master Profile"
      breadcrumbs={[
        { label: "Portal Home", href: "/app/home" },
        { label: "Student Master Dossier" },
      ]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={() => setIsUpdateModalOpen(true)}
          >
            Update Contact Info
          </Button>
          <Link href="/students/cccccccc-cccc-cccc-cccc-cccccccccc01">
            <Button size="dense" variant="primary" leadingIcon={<User className="w-3.5 h-3.5" />}>
              Admin 360° Dossier
            </Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Student Identity Hero */}
        <div className="p-6 rounded-2xl bg-action-black text-canvas flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-brand-primary/20 border-2 border-brand-primary/40 flex items-center justify-center text-brand-primary shrink-0 shadow-inner">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-canvas">{student.fullName}</h2>
                <Badge variant="positive" className="text-[10px]">
                  {student.status}
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-1 font-mono">
                {student.grade} • Roll No: {student.rollNo} • Adm: {student.admissionNo}
              </p>
              <p className="text-[11px] text-brand-green mt-0.5 font-medium">
                {student.institution}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right text-xs font-mono">
            <span className="text-text-muted">CBSE PEN: {student.penNo}</span>
            <span className="text-text-muted">House: {student.house}</span>
            <span className="text-emerald-400 font-semibold">Affiliated CBSE 2026-27</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border-default pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("BIO")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "BIO"
                ? "bg-action-black text-canvas font-bold"
                : "text-text-secondary hover:text-text-primary hover:bg-subtle"
            }`}
          >
            Biographical & Academic
          </button>
          <button
            onClick={() => setActiveTab("PARENTS")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "PARENTS"
                ? "bg-action-black text-canvas font-bold"
                : "text-text-secondary hover:text-text-primary hover:bg-subtle"
            }`}
          >
            Guardian & Emergency
          </button>
          <button
            onClick={() => setActiveTab("TRANSPORT")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "TRANSPORT"
                ? "bg-action-black text-canvas font-bold"
                : "text-text-secondary hover:text-text-primary hover:bg-subtle"
            }`}
          >
            Transport & Route
          </button>
          <button
            onClick={() => setActiveTab("DOCS")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "DOCS"
                ? "bg-action-black text-canvas font-bold"
                : "text-text-secondary hover:text-text-primary hover:bg-subtle"
            }`}
          >
            Credential Locker
          </button>
        </div>

        {/* Tab 1: Bio & Academic */}
        {activeTab === "BIO" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border-default">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary" />
                  <span>Student Biographical Record</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Full Legal Name:</span>
                  <span className="font-semibold text-text-primary">{student.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Date of Birth:</span>
                  <span className="font-semibold text-text-primary">{student.dob}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Gender:</span>
                  <span className="font-semibold text-text-primary">{student.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Blood Group:</span>
                  <span className="font-bold text-red-600">{student.bloodGroup}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">National Aadhaar ID:</span>
                  <span className="font-mono text-text-primary">{student.aadhaarMasked}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Mother Tongue:</span>
                  <span className="font-semibold text-text-primary">Telugu</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-border-default">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-primary" />
                  <span>Institutional Enrollment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Admission Number:</span>
                  <span className="font-mono font-bold text-text-primary">{student.admissionNo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Current Class & Section:</span>
                  <span className="font-semibold text-text-primary">{student.grade}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Class Roll Number:</span>
                  <span className="font-mono text-text-primary">{student.rollNo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Admission Date:</span>
                  <span className="font-mono text-text-primary">{student.admissionDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Assigned House:</span>
                  <span className="font-semibold text-emerald-600">{student.house}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Medium of Instruction:</span>
                  <span className="font-semibold text-text-primary">English (CBSE Standard)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Parents & Emergency */}
        {activeTab === "PARENTS" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border-default">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary" />
                  <span>Father / Primary Guardian</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Guardian Name:</span>
                  <span className="font-semibold text-text-primary">Sri T. Raghavendra Chary</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Occupation:</span>
                  <span className="font-semibold text-text-primary">Senior Structural Design Lead</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Mobile Phone:</span>
                  <span className="font-mono font-semibold text-text-primary flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-primary" /> {parentPhone}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Email Address:</span>
                  <span className="font-mono text-text-primary flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-primary" /> {parentEmail}
                  </span>
                </div>
                <div className="py-1">
                  <span className="text-text-muted block mb-1">Residential Address:</span>
                  <p className="font-medium text-text-primary leading-relaxed bg-subtle/50 p-2 rounded-lg border border-border-default">
                    Flat 402, Sri Sai Nilayam, Raghavendra Colony, Kondapur, Serilingampally, Hyderabad, Telangana - 500084
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-border-default">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Mother & Emergency Contacts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Mother's Name:</span>
                  <span className="font-semibold text-text-primary">Smt. T. Lakshmi Devi</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Occupation:</span>
                  <span className="font-semibold text-text-primary">Faculty, Mathematics (Junior College)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Emergency Mobile:</span>
                  <span className="font-mono font-semibold text-text-primary flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-primary" /> {emergencyPhone}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-default">
                  <span className="text-text-muted">Family Physician:</span>
                  <span className="font-semibold text-text-primary">Dr. K. S. Rao (Apollo Clinic)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Dietary Preference:</span>
                  <span className="font-semibold text-emerald-600">Pure Vegetarian</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Transport & Route */}
        {activeTab === "TRANSPORT" && (
          <Card>
            <CardHeader className="pb-3 border-b border-border-default">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bus className="w-4 h-4 text-brand-primary" />
                <span>Dedicated School Transport Allocation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-subtle border border-border-default">
                  <span className="text-text-muted block text-[11px]">Bus Route Code</span>
                  <span className="font-bold text-sm text-text-primary mt-1 block">Route 04 (Kondapur A/C)</span>
                  <span className="text-[10px] text-text-secondary">Vehicle: TS-09-UB-4421</span>
                </div>
                <div className="p-3 rounded-xl bg-subtle border border-border-default">
                  <span className="text-text-muted block text-[11px]">Assigned Boarding Point</span>
                  <span className="font-bold text-sm text-text-primary mt-1 block">Raghavendra Colony Arch</span>
                  <span className="text-[10px] text-text-secondary">250m from residence</span>
                </div>
                <div className="p-3 rounded-xl bg-subtle border border-border-default">
                  <span className="text-text-muted block text-[11px]">Timings</span>
                  <span className="font-bold text-sm text-emerald-600 mt-1 block">Pickup: 08:15 AM</span>
                  <span className="text-[10px] text-text-secondary">Drop-off: 04:30 PM</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border-default bg-subtle/30 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-text-primary">Designated Route Driver & Attendant</h4>
                  <p className="text-text-secondary text-[11px] mt-0.5">
                    Sri K. Anjaneyulu (Driver) • Contact: +91 91770 23412
                  </p>
                </div>
                <Link href="/transport">
                  <Button size="dense" variant="secondary">
                    Live GPS Telemetry
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Credential Locker */}
        {activeTab === "DOCS" && (
          <Card>
            <CardHeader className="pb-3 border-b border-border-default flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-primary" />
                  <span>Student Digital Credential Archive</span>
                </CardTitle>
                <p className="text-xs text-text-secondary mt-0.5">
                  Tamper-proof, cryptographically signed educational credentials under PRD Document Vault.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {[
                { title: "Bonafide & Study Certificate (2026-27)", code: "NGS-DOC-BON-2026-001", date: "2026-08-10", size: "245 KB" },
                { title: "CBSE Class 9 Official Marksheet & Transcript", code: "NGS-DOC-MS-2025-412", date: "2026-04-12", size: "680 KB" },
                { title: "Digital Birth Certificate (GHMC Municipal Archive)", code: "GHMC-BC-2011-8912", date: "Verified", size: "310 KB" },
                { title: "Narayana Scholastic ID Card (QR Verified)", code: "NGS-ID-2026-10A", date: "2026-06-01", size: "180 KB" },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border-default flex items-center justify-between hover:bg-subtle/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{doc.title}</p>
                      <p className="text-[11px] text-text-muted font-mono">
                        {doc.code} • {doc.date} • {doc.size}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="dense"
                    variant="secondary"
                    leadingIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => alert(`Initiating secure download of ${doc.title}`)}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Update Contact Info Modal Dialog */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-canvas border border-border-default rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">
                Update Guardian Contact Coordinates
              </h3>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContactUpdate} className="p-5 space-y-4 text-xs">
              {updateSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Contact details updated and synchronized with institutional database!</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Primary Guardian Mobile *
                </label>
                <input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Primary Guardian Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Emergency / Secondary Mobile *
                </label>
                <input
                  type="tel"
                  required
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border-default">
                <Button size="dense" variant="secondary" type="button" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="dense" variant="primary" type="submit">
                  Save & Synchronize
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
