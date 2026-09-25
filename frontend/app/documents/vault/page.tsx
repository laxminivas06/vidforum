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
  Table,
  TableColumn,
  ConfirmDialog,
  SlideOver,
} from "@/components/ui"
import {
  FileText,
  Upload,
  Lock,
  Download,
  Search,
  Eye,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
} from "lucide-react"

interface VaultDoc {
  id: string
  title: string
  category: "STUDENT_CREDENTIAL" | "INSTITUTIONAL_CHARTER" | "STAFF_CONTRACT" | "COMPLIANCE"
  owner: string
  sha256: string
  date: string
  size: string
  status: "CRYPTOGRAPHICALLY_VERIFIED" | "PENDING_SEAL"
}

const MOCK_DOCS: VaultDoc[] = [
  {
    id: "doc-v1",
    title: "Class 10 CBSE Board Accreditation Certificate",
    category: "INSTITUTIONAL_CHARTER",
    owner: "Springfield Academy",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    date: "2026-06-15",
    size: "2.4 MB",
    status: "CRYPTOGRAPHICALLY_VERIFIED",
  },
  {
    id: "doc-v2",
    title: "Transfer Certificate (TC) Master Serial SIA-2026-042",
    category: "STUDENT_CREDENTIAL",
    owner: "Aarav Sharma",
    sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    date: "2026-09-12",
    size: "840 KB",
    status: "CRYPTOGRAPHICALLY_VERIFIED",
  },
  {
    id: "doc-v3",
    title: "Fire Safety & Structural Compliance Audit 2026",
    category: "COMPLIANCE",
    owner: "Municipal Fire Dept",
    sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    date: "2026-08-30",
    size: "4.1 MB",
    status: "CRYPTOGRAPHICALLY_VERIFIED",
  },
]

export default function DocumentsVaultPage() {
  const [selectedDoc, setSelectedDoc] = useState<VaultDoc | null>(null)

  const columns: TableColumn<VaultDoc>[] = [
    {
      header: "Document Name",
      key: "title",
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-brand-primary shrink-0" />
          <div>
            <div className="font-semibold text-text-primary">{item.title}</div>
            <div className="text-[11px] font-mono text-text-secondary truncate max-w-xs">
              SHA: {item.sha256.substring(0, 16)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      key: "category",
      render: (item) => <Badge variant="neutral">{item.category.replace("_", " ")}</Badge>,
    },
    {
      header: "Beneficiary / Owner",
      key: "owner",
      render: (item) => <span className="text-xs">{item.owner}</span>,
    },
    {
      header: "Timestamp",
      key: "date",
      render: (item) => <span className="font-mono text-xs text-text-secondary">{item.date}</span>,
    },
    {
      header: "Integrity",
      key: "status",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-primary font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>TAMPER-PROOF</span>
        </div>
      ),
    },
    {
      header: "Action",
      key: "id",
      render: (item) => (
        <Button size="dense" variant="secondary" onClick={() => setSelectedDoc(item)}>
          Inspect Hash
        </Button>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Immutable Documents Vault"
      breadcrumbs={[{ label: "Core" }, { label: "Documents Vault" }]}
      rightHeaderAction={
        <Button
          size="dense"
          variant="primary"
          leadingIcon={<Upload className="w-3.5 h-3.5" />}
        >
          Seal New Document
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <Table
          data={MOCK_DOCS}
          columns={columns}
          keyExtractor={(item) => item.id}
          cardTitle={(item) => item.title}
          cardSubtitle={(item) => item.category}
          cardBadge={(item) => <Badge variant="positive">Verified</Badge>}
        />
      </div>

      <SlideOver
        open={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
        title="Document Cryptographic Proof"
        subtitle={selectedDoc?.title}
      >
        {selectedDoc && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-lg bg-neutral-900 text-white font-mono break-all text-[11px] border border-neutral-800">
              <span className="text-brand-primary font-semibold block mb-1">
                // SHA-256 CHECKSUM
              </span>
              {selectedDoc.sha256}
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border-default flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Owner:</span>
                <span className="font-semibold text-text-primary">{selectedDoc.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">File Size:</span>
                <span className="font-mono text-text-primary">{selectedDoc.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Date Sealed:</span>
                <span className="font-mono text-text-primary">{selectedDoc.date}</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="bg-brand-primary text-black hover:bg-emerald-400 mt-2"
              leadingIcon={<Download className="w-4 h-4" />}
            >
              Download Verified PDF
            </Button>
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}
