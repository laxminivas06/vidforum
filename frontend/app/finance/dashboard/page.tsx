"use client"

import React, { useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Button,
  Badge,
  Table,
  TableColumn,
  ConfirmDialog,
  SlideOver,
  FormField,
  Input,
} from "@/components/ui"
import {
  CreditCard,
  Receipt,
  Download,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle2,
  DollarSign,
  ArrowRight,
} from "lucide-react"
import { useFinance } from "@/lib/api/hooks"
import { FeeRecord } from "@/types"

export default function FinanceDashboardPage() {
  const { data: fees = [], isLoading } = useFinance()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null)
  const [waiveDialogOpen, setWaiveDialogOpen] = useState(false)
  const [collectDialogOpen, setCollectDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")

  const filteredFees = fees.filter((fee) => {
    const matchesSearch =
      fee.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || fee.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns: TableColumn<FeeRecord>[] = [
    {
      header: "Student & Roll",
      key: "studentName",
      render: (item) => (
        <div>
          <Link
            href={`/students/${item.studentId}`}
            className="font-semibold text-text-primary hover:underline"
          >
            {item.studentName}
          </Link>
          <div className="text-xs text-text-secondary font-mono">
            {item.rollNumber} • {item.gradeSection}
          </div>
        </div>
      ),
    },
    {
      header: "Invoice #",
      key: "invoiceNumber",
      render: (item) => <span className="font-mono text-xs">{item.invoiceNumber}</span>,
    },
    {
      header: "Total Fee",
      key: "totalAmount",
      render: (item) => (
        <span className="font-mono text-xs font-semibold">
          ₹{item.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Paid",
      key: "paidAmount",
      render: (item) => (
        <span className="font-mono text-xs text-brand-primary font-semibold">
          ₹{item.paidAmount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Balance Due",
      key: "balanceAmount",
      render: (item) => (
        <span
          className={`font-mono text-xs font-semibold ${
            item.balanceAmount > 0 ? "text-red-600" : "text-text-muted"
          }`}
        >
          ₹{item.balanceAmount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Due Date",
      key: "dueDate",
      render: (item) => <span className="font-mono text-xs text-text-secondary">{item.dueDate}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "error" | "neutral"> = {
          PAID: "positive",
          PARTIAL: "warning",
          OVERDUE: "error",
          PENDING: "neutral",
        }
        return <Badge variant={variants[item.status] || "neutral"}>{item.status}</Badge>
      },
    },
    {
      header: "Actions",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.balanceAmount > 0 && (
            <Button
              size="dense"
              variant="primary"
              onClick={() => {
                setSelectedRecord(item)
                setPaymentAmount(item.balanceAmount.toString())
                setCollectDialogOpen(true)
              }}
            >
              Collect
            </Button>
          )}
          <Button
            size="dense"
            variant="ghost"
            onClick={() => {
              setSelectedRecord(item)
              setWaiveDialogOpen(true)
            }}
          >
            Waive
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Finance & Collections Desk"
      breadcrumbs={[{ label: "Core" }, { label: "Finance & Fees" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Ledger CSV
          </Button>
          <Button
            size="dense"
            variant="primary"
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Generate Invoices
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Term Invoiced"
            value="₹2.23 Cr"
            delta="2,450 Invoices Dispatched"
            deltaType="neutral"
            icon={<Receipt className="w-5 h-5" />}
            description="Term 1 (Academic 2026-27)"
          />
          <StatCard
            label="Collected Realization"
            value="₹1.84 Cr"
            delta="82.4% Realized"
            deltaType="increase"
            icon={<CreditCard className="w-5 h-5" />}
            description="Zero reconciliation drift"
          />
          <StatCard
            label="Outstanding Dues"
            value="₹39.2 Lakhs"
            delta="142 overdue accounts"
            deltaType="decrease"
            icon={<AlertTriangle className="w-5 h-5" />}
            description="Voice AI follow-up active"
          />
          <StatCard
            label="Concessions & Waivers"
            value="₹4.8 Lakhs"
            delta="3 pending signoff"
            deltaType="neutral"
            icon={<DollarSign className="w-5 h-5" />}
            description="Merit and sibling discounts"
          />
        </div>

        {/* Filter Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-default">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, roll #, invoice #..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-canvas border border-border-default rounded-lg focus:outline-none focus:border-action-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-text-secondary font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-canvas border border-border-default rounded-lg px-3 py-2 font-medium text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <Table
          data={filteredFees}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={isLoading}
          cardTitle={(item) => item.studentName}
          cardSubtitle={(item) => `${item.invoiceNumber} • ${item.gradeSection}`}
          cardBadge={(item) => <Badge variant="neutral">{item.status}</Badge>}
        />
      </div>

      {/* Waive Fee Confirmation Dialog (Destructive Action Rule) */}
      <ConfirmDialog
        open={waiveDialogOpen}
        title="Confirm Fee Concession / Waiver"
        description={`Are you sure you want to authorize a fee concession for ${selectedRecord?.studentName}? This will permanently adjust the invoice balance from the institutional receivables ledger.`}
        confirmLabel="Authorize Waiver"
        danger
        onConfirm={() => {
          setWaiveDialogOpen(false)
          setSelectedRecord(null)
        }}
        onCancel={() => {
          setWaiveDialogOpen(false)
          setSelectedRecord(null)
        }}
      />

      {/* Record Payment Dialog */}
      <ConfirmDialog
        open={collectDialogOpen}
        title="Record Fee Payment Receipt"
        description={`Record incoming collection of ₹${paymentAmount} for invoice ${selectedRecord?.invoiceNumber} (${selectedRecord?.studentName})? A signed PDF receipt will be issued to the guardian.`}
        confirmLabel="Confirm Collection"
        danger={false}
        onConfirm={() => {
          setCollectDialogOpen(false)
          setSelectedRecord(null)
        }}
        onCancel={() => {
          setCollectDialogOpen(false)
          setSelectedRecord(null)
        }}
      />
    </AppShell>
  )
}
