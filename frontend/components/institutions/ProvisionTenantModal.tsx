"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Building2,
  ShieldCheck,
  Globe,
  Mail,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Server,
  Layers,
} from "lucide-react"
import { Button, Badge, FormField, Input, Select, SelectOption } from "@/components/ui"
import { useCreateInstitution } from "@/lib/api/hooks"
import { Institution } from "@/types"

export interface ProvisionTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (institution: Institution) => void
}

const REGION_OPTIONS: SelectOption[] = [
  { label: "AP-South (Bangalore / Mumbai, India)", value: "Bangalore, India", sublabel: "Lowest latency for APAC schools" },
  { label: "US-East (N. Virginia, USA)", value: "N. Virginia, USA", sublabel: "North America Cloud cluster" },
  { label: "EU-West (London, UK)", value: "London, UK", sublabel: "GDPR Compliant European cluster" },
  { label: "AP-Southeast (Singapore)", value: "Singapore", sublabel: "Southeast Asia regional cluster" },
]

const PLAN_OPTIONS: { id: "BASIC" | "PRO" | "ENTERPRISE"; name: string; desc: string; badge: "neutral" | "positive" | "warning" }[] = [
  { id: "BASIC", name: "Basic", desc: "Core SIS, Attendance & Grading", badge: "neutral" },
  { id: "PRO", name: "Pro Tier", desc: "Admissions Kanban, Finance & Parent Portal", badge: "warning" },
  { id: "ENTERPRISE", name: "Enterprise Fleet", desc: "AI Yantra, Full Biometrics & Dedicated RLS", badge: "positive" },
]

const POPULAR_BOARDS = [
  "CBSE Standard",
  "ICSE / ISC",
  "IB World School",
  "Cambridge International (CIE)",
  "State Board",
  "AICTE / UGC",
]

export const ProvisionTenantModal: React.FC<ProvisionTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [boardAffiliation, setBoardAffiliation] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [region, setRegion] = useState(REGION_OPTIONS[0].value)
  const [plan, setPlan] = useState<"BASIC" | "PRO" | "ENTERPRISE">("ENTERPRISE")
  const [customDomain, setCustomDomain] = useState("")
  const [isCustomDomain, setIsCustomDomain] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  const createInstitutionMutation = useCreateInstitution()

  // Auto-generate code prefix and domain slug when typing the official name
  const handleNameChange = (val: string) => {
    setName(val)
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }))
    }

    // Only auto-derive code if user hasn't explicitly customized it
    if (!code || code === autoGenerateCode(name)) {
      const newCode = autoGenerateCode(val)
      setCode(newCode)
    }

    // Auto-derive domain slug
    if (!isCustomDomain) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20)
      setCustomDomain(slug ? `${slug}.vid.edu` : "")
    }
  }

  const autoGenerateCode = (fullName: string): string => {
    const cleaned = fullName.trim()
    if (!cleaned) return ""
    const words = cleaned.split(/\s+/).filter(Boolean)
    if (words.length === 1) {
      return words[0].slice(0, 4).toUpperCase()
    }
    const acronym = words.map((w) => w[0]).join("").toUpperCase().slice(0, 5)
    return `${acronym}-HQ`
  }

  const effectiveDomain = customDomain || (code ? `${code.toLowerCase().replace(/[^a-z0-9]/g, "")}.vid.edu` : "tenant.vid.edu")

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName("")
      setCode("")
      setBoardAffiliation("")
      setContactEmail("")
      setContactPhone("")
      setRegion(REGION_OPTIONS[0].value)
      setPlan("ENTERPRISE")
      setCustomDomain("")
      setIsCustomDomain(false)
      setErrors({})
      setSubmittedSuccess(false)
    }
  }, [isOpen])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) {
      errs.name = "Official Institution Name is required"
    }
    if (!code.trim()) {
      errs.code = "Institutional Code (Prefix) is required"
    } else if (code.trim().length < 2) {
      errs.code = "Code must be at least 2 characters"
    }
    if (!boardAffiliation.trim()) {
      errs.boardAffiliation = "Accreditation or Board Affiliation is required"
    }
    if (!contactEmail.trim()) {
      errs.contactEmail = "Administrative Contact Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errs.contactEmail = "Please enter a valid administrative email address"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const created = await createInstitutionMutation.mutateAsync({
        name,
        code,
        domain: effectiveDomain,
        boardAffiliation,
        contactEmail,
        region,
        plan,
      })

      setSubmittedSuccess(true)
      if (onSuccess) {
        onSuccess(created)
      }

      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err) {
      console.error("Failed to provision tenant:", err)
      setErrors((prev) => ({
        ...prev,
        form: "Failed to provision tenant. Please check parameters and try again.",
      }))
    }
  }

  // Keyboard navigation: Escape closes, Cmd/Ctrl+Enter submits
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(e as any)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, handleSubmit])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-canvas border border-border-default rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="provision-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-default bg-surface/50 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-action-black text-canvas flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-5 h-5 text-canvas" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="provision-modal-title"
                  className="text-base sm:text-lg font-bold text-text-primary tracking-tight"
                >
                  Institutional Profile & Identity
                </h2>
                <Badge variant="positive">PROVISION TENANT</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1 max-w-lg">
                Update primary institutional branding, accreditation details, and official domain records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.form && (
            <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center gap-2.5 text-xs text-status-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {submittedSuccess && (
            <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center gap-3 text-xs text-status-success">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-semibold text-sm">Tenant Provisioned Successfully!</div>
                <div className="text-text-secondary mt-0.5">
                  Institutional database partition and domain routes have been initialized.
                </div>
              </div>
            </div>
          )}

          {/* Section 1: The Core 4 Required Fields */}
          <div className="space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
              <span>1. Institutional Identity & Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Official Institution Name */}
              <div className="sm:col-span-2">
                <FormField
                  label="Official Institution Name"
                  required
                  error={errors.name}
                  helperText="Full legal name of the school, academy, or university campus."
                >
                  <Input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Springfield International Academy"
                    hasError={Boolean(errors.name)}
                    autoFocus
                  />
                </FormField>
              </div>

              {/* Institutional Code (Prefix) */}
              <div>
                <FormField
                  label="Institutional Code (Prefix)"
                  required
                  error={errors.code}
                  helperText="2-8 chars prefix for Student IDs (e.g. SIA-2026-001)."
                >
                  <Input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase())
                      if (errors.code) setErrors((prev) => ({ ...prev, code: "" }))
                    }}
                    placeholder="e.g. SIA-BLR"
                    hasError={Boolean(errors.code)}
                    className="font-mono uppercase font-semibold"
                  />
                </FormField>
              </div>

              {/* Administrative Contact Email */}
              <div>
                <FormField
                  label="Administrative Contact Email"
                  required
                  error={errors.contactEmail}
                  helperText="Primary email for root tenant alerts and recovery."
                >
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value)
                      if (errors.contactEmail) setErrors((prev) => ({ ...prev, contactEmail: "" }))
                    }}
                    placeholder="principal@institution.edu"
                    hasError={Boolean(errors.contactEmail)}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </FormField>
              </div>

              {/* Accreditation / Board Affiliation */}
              <div className="sm:col-span-2">
                <FormField
                  label="Accreditation / Board Affiliation"
                  required
                  error={errors.boardAffiliation}
                  helperText="Select or type the educational governing board or curriculum framework."
                >
                  <Input
                    value={boardAffiliation}
                    onChange={(e) => {
                      setBoardAffiliation(e.target.value)
                      if (errors.boardAffiliation) setErrors((prev) => ({ ...prev, boardAffiliation: "" }))
                    }}
                    placeholder="e.g. CBSE / ICSE / IB World"
                    hasError={Boolean(errors.boardAffiliation)}
                  />
                </FormField>

                {/* Popular Board Quick Select Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-text-muted self-center mr-1">Quick pick:</span>
                  {POPULAR_BOARDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setBoardAffiliation(b)
                        if (errors.boardAffiliation) setErrors((prev) => ({ ...prev, boardAffiliation: "" }))
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                        boardAffiliation === b
                          ? "bg-action-black text-canvas border-action-black font-medium"
                          : "bg-subtle text-text-secondary border-border-default hover:border-border-strong hover:text-text-primary"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Multi-Tenant Domain & Infrastructure Record */}
          <div className="space-y-4 pt-2 border-t border-border-default">
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-primary" />
              <span>2. Multi-Tenant Domain & DNS Routing</span>
            </div>

            {/* Verified Multi-Tenant Domain Card (matches settings/page.tsx) */}
            <div className="p-4 rounded-xl bg-subtle border border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-text-primary flex items-center gap-2">
                  <span>Verified Multi-Tenant Domain</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                </div>
                <div className="text-xs font-mono text-brand-primary mt-1 font-semibold">
                  {effectiveDomain} <span className="text-text-secondary font-normal">(SSL Encrypted & Cloudflare Routed)</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-1">
                  Tenant partition will automatically enforce Row-Level Security (RLS) under this domain isolate.
                </p>
              </div>
              <Badge variant="positive" className="shrink-0">
                DNS READY
              </Badge>
            </div>

            {/* Subdomain Customization Toggle */}
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="custom-domain-toggle" className="text-text-secondary cursor-pointer">
                Custom Domain Slug
              </label>
              <input
                id="custom-domain-toggle"
                type="text"
                value={customDomain}
                onChange={(e) => {
                  setIsCustomDomain(true)
                  setCustomDomain(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }}
                placeholder="custom-slug.vid.edu"
                className="w-56 px-3 py-1.5 text-xs bg-canvas border border-border-default rounded-lg font-mono focus:outline-none focus:border-border-strong"
              />
            </div>
          </div>

          {/* Section 3: Region & Subscription Plan */}
          <div className="space-y-4 pt-2 border-t border-border-default">
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-primary" />
              <span>3. Deployment Cluster & Subscription Tier</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormField label="Deployment Region">
                  <Select
                    options={REGION_OPTIONS}
                    value={region}
                    onChange={setRegion}
                    searchable={false}
                  />
                </FormField>
              </div>

              <div>
                <FormField label="Administrative Contact Phone (Optional)">
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98450 00000"
                  />
                </FormField>
              </div>
            </div>

            {/* Plan Tier Selector */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-text-primary">
                Subscription Plan Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PLAN_OPTIONS.map((p) => {
                  const isSelected = plan === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-action-black text-canvas border-action-black shadow-md ring-2 ring-action-black/20"
                          : "bg-surface border-border-default hover:border-border-strong text-text-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs uppercase tracking-wider">
                          {p.name}
                        </span>
                        <Badge variant={p.badge}>{p.id}</Badge>
                      </div>
                      <p
                        className={`text-[11px] mt-2 leading-relaxed ${
                          isSelected ? "text-canvas/80" : "text-text-secondary"
                        }`}
                      >
                        {p.desc}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border-default bg-surface/50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-text-secondary font-mono">
            Tenant status: <span className="font-semibold text-status-success">READY TO PROVISION</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="dense"
              onClick={onClose}
              disabled={createInstitutionMutation.isPending || submittedSuccess}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="dense"
              onClick={handleSubmit}
              isLoading={createInstitutionMutation.isPending}
              disabled={submittedSuccess}
              leadingIcon={<Sparkles className="w-3.5 h-3.5 text-brand-primary" />}
            >
              Provision Tenant
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
