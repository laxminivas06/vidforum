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

export default function DocumentsVaultPage() {
  const [docs, setDocs] = useState<VaultDoc[]>([])
  const [selectedDoc, setSelectedDoc] = useState<VaultDoc | null>(null)

  const columns: TableColumn<VaultDoc>[] = [
    {
      header: "Document Name",
      key: "title",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <div className="font-semibold text-text-primary text-xs">{item.title}</div>
            <div className="text-[11px] font-mono text-text-secondary mt-0.5">
              SHA: {item.sha256.substring(0, 16)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      key: "category",
      render: (item) => (
        <Badge variant="neutral" className="text-[10px] font-mono uppercase">
          {item.category.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Owner Entity",
      key: "owner",
      render: (item) => <span className="text-xs text-text-secondary">{item.owner}</span>,
    },
    {
      header: "Ingestion Date",
      key: "date",
      render: (item) => (
        <span className="font-mono text-xs text-text-secondary">{item.date}</span>
      ),
    },
    {
      header: "Cryptographic Seal",
      key: "status",
      render: (item) => (
        <Badge
          variant={item.status === "CRYPTOGRAPHICALLY_VERIFIED" ? "positive" : "warning"}
          className="flex items-center gap-1 w-fit"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>{item.status === "CRYPTOGRAPHICALLY_VERIFIED" ? "Verified" : "Pending"}</span>
        </Badge>
      ),
    },
    {
      header: "Actions",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            size="dense"
            variant="ghost"
            onClick={() => setSelectedDoc(item)}
            className="p-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="dense" variant="ghost" className="p-1.5">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Digital Documents Vault"
      breadcrumbs={[{ label: "Core" }, { label: "Documents Vault" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Audit Certificate Chain
          </Button>
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload Sealed Document
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {docs.length > 0 ? (
          <Table
            data={docs}
            columns={columns}
            keyExtractor={(item) => item.id}
            cardTitle={(item) => item.title}
            cardSubtitle={(item) => `${item.owner} • ${item.date}`}
            cardBadge={(item) => (
              <Badge variant="positive" className="text-[10px]">
                {item.status.replace("_", " ")}
              </Badge>
            )}
          />
        ) : (
          <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Digital Vault Repository is Empty
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                No archived documents, student certificates, or institutional charters uploaded yet. Click "Upload Sealed Document" to archive institutional assets.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Verification Inspect Drawer */}
      <SlideOver
        open={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || "Document Record"}
        subtitle="Cryptographic Provenance & Immutability Record"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              size="dense"
              variant="secondary"
              leadingIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Original
            </Button>
            <Button size="dense" variant="primary" onClick={() => setSelectedDoc(null)}>
              Done
            </Button>
          </div>
        }
      >
        {selectedDoc && (
          <div className="flex flex-col gap-6 py-4">
            <div className="p-4 rounded-xl bg-positive/10 border border-positive/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-positive shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs text-positive">
                  Cryptographically Sealed
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  This document has been verified with an immutable SHA-256 digital signature.
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-canvas border border-border-default">
                <span className="text-[10px] text-text-secondary block font-sans">
                  Digital SHA-256 Digest
                </span>
                <span className="break-all font-semibold text-text-primary">
                  {selectedDoc.sha256}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-canvas border border-border-default">
                  <span className="text-[10px] text-text-secondary block font-sans">
                    Document Category
                  </span>
                  <span className="font-semibold text-text-primary">
                    {selectedDoc.category}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-canvas border border-border-default">
                  <span className="text-[10px] text-text-secondary block font-sans">File Size</span>
                  <span className="font-semibold text-text-primary">{selectedDoc.size}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}
