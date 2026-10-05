"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
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
} from "@/components/ui"
import {
  CreditCard,
  Search,
  Filter,
  Download,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Receipt,
  GraduationCap,
} from "lucide-react"

interface InvoiceItem {
  id: string
  invoiceNumber: string
  studentName: string
  admissionNo: string
  grade: string
  dueDate: string
  amount: number
  paid: number
  status: "PAID" | "PARTIAL" | "OVERDUE"
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: "inv-001",
    invoiceNumber: "NGS-INV-2026-001",
    studentName: "Sai Teja Chary",
    admissionNo: "NGS-HYD-2026-001",
    grade: "Class 10 (CBSE)",
    dueDate: "2026-10-10",
    amount: 42500,
    paid: 42500,
    status: "PAID",
  },
  {
    id: "inv-002",
    invoiceNumber: "NGS-INV-2026-002",
    studentName: "Ananya Reddy",
    admissionNo: "NGS-HYD-2026-002",
    grade: "Class 10 (CBSE)",
    dueDate: "2026-10-10",
    amount: 42500,
    paid: 42500,
    status: "PAID",
  },
  {
    id: "inv-003",
    invoiceNumber: "NGS-INV-2026-003",
    studentName: "Rohan Kumar",
    admissionNo: "NGS-HYD-2026-003",
    grade: "Class 10 (CBSE)",
    dueDate: "2026-09-30",
    amount: 42500,
    paid: 20000,
    status: "OVERDUE",
  },
  {
    id: "inv-004",
    invoiceNumber: "NGS-INV-2026-004",
    studentName: "Sana Fathima",
    admissionNo: "NGS-HYD-2026-004",
    grade: "Class 10 (CBSE)",
    dueDate: "2026-10-15",
    amount: 42500,
    paid: 42500,
    status: "PAID",
  },
  {
    id: "inv-005",
    invoiceNumber: "NGS-INV-2026-005",
    studentName: "Karthik Verma",
    admissionNo: "NGS-HYD-2026-005",
    grade: "Class 10 (CBSE)",
    dueDate: "2026-10-01",
    amount: 42500,
    paid: 0,
    status: "OVERDUE",
  },
]

export default function InvoicesLedgerPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, searchQuery, statusFilter])

  const totals = useMemo(() => {
    const totalBilled = invoices.reduce((acc, i) => acc + i.amount, 0)
    const totalCollected = invoices.reduce((acc, i) => acc + i.paid, 0)
    const outstanding = totalBilled - totalCollected
    return { totalBilled, totalCollected, outstanding }
  }, [invoices])

  const columns: TableColumn<InvoiceItem>[] = [
    {
      header: "Invoice Reference",
      key: "invoiceNumber",
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-xs text-text-primary block">{item.invoiceNumber}</span>
          <span className="text-[11px] text-text-secondary">Due: {item.dueDate}</span>
        </div>
      ),
    },
    {
      header: "Student Dossier",
      key: "studentName",
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary text-xs flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
            <span>{item.studentName}</span>
          </div>
          <div className="text-[11px] font-mono text-text-muted">{item.admissionNo} • {item.grade}</div>
        </div>
      ),
    },
    {
      header: "Billed",
      key: "amount",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-text-primary">
          ₹{item.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Collected",
      key: "paid",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-emerald-600">
          ₹{item.paid.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Outstanding Balance",
      key: "id",
      render: (item) => {
        const bal = item.amount - item.paid
        return (
          <span className={`font-mono text-xs font-bold ${bal > 0 ? "text-amber-600" : "text-text-muted"}`}>
            ₹{bal.toLocaleString("en-IN")}
          </span>
        )
      },
    },
    {
      header: "Status",
      key: "status",
      render: (item) => {
        const variants: Record<string, "positive" | "warning" | "neutral"> = {
          PAID: "positive",
          PARTIAL: "warning",
          OVERDUE: "warning",
        }
        return <Badge variant={variants[item.status]}>{item.status}</Badge>
      },
    },
    {
      header: "Actions",
      key: "id",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.status === "OVERDUE" || item.status === "PARTIAL" ? (
            <Link href={`/finance/collect?studentId=${item.id}&amount=${item.amount - item.paid}`}>
              <Button size="dense" variant="primary" leadingIcon={<Receipt className="w-3.5 h-3.5" />}>
                Collect Fee
              </Button>
            </Link>
          ) : (
            <Button
              size="dense"
              variant="secondary"
              leadingIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => alert(`Receipt downloaded for ${item.invoiceNumber}`)}
            >
              Receipt
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppShell
      pageTitle="Invoices & Fee Dues Ledger"
      breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Invoices" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Link href="/finance/collect">
            <Button size="dense" variant="primary" leadingIcon={<Receipt className="w-3.5 h-3.5" />}>
              Counter POS Collection
            </Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Invoiced</span>
                <p className="text-2xl font-bold text-text-primary mt-1 font-mono">
                  ₹{totals.totalBilled.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Collected</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  ₹{totals.totalCollected.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Outstanding Dues</span>
                <p className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                  ₹{totals.outstanding.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface border border-border-default rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice number, student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-canvas border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
            >
              <option value="ALL">All Invoices</option>
              <option value="PAID">Paid Only</option>
              <option value="OVERDUE">Overdue Only</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <Table
          data={filteredInvoices}
          columns={columns}
          keyExtractor={(item) => item.id}
          cardTitle={(item) => item.invoiceNumber}
          cardSubtitle={(item) => `${item.studentName} • Billed: ₹${item.amount.toLocaleString("en-IN")}`}
          emptyMessage="No invoices found matching criteria."
        />
      </div>
    </AppShell>
  )
}
