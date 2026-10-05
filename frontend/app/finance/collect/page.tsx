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
  SlideOver,
} from "@/components/ui"
import {
  Receipt,
  Search,
  CheckCircle2,
  Printer,
  CreditCard,
  IndianRupee,
  Building2,
  GraduationCap,
  Download,
  QrCode,
  Banknote,
} from "lucide-react"

interface StudentLookup {
  id: string
  name: string
  roll: string
  admissionNo: string
  grade: string
  parentName: string
  outstandingDue: number
}

const STUDENTS_DB: StudentLookup[] = [
  {
    id: "std-001",
    name: "Sai Teja Chary",
    roll: "10-A-01",
    admissionNo: "NGS-HYD-2026-001",
    grade: "Class 10 - Section A",
    parentName: "Sri T. Ramesh Chary",
    outstandingDue: 0,
  },
  {
    id: "std-002",
    name: "Ananya Reddy",
    roll: "10-A-02",
    admissionNo: "NGS-HYD-2026-002",
    grade: "Class 10 - Section A",
    parentName: "Sri K. Mahender Reddy",
    outstandingDue: 0,
  },
  {
    id: "std-003",
    name: "Rohan Kumar",
    roll: "10-A-03",
    admissionNo: "NGS-HYD-2026-003",
    grade: "Class 10 - Section A",
    parentName: "Sri Vijay Kumar",
    outstandingDue: 22500,
  },
  {
    id: "std-005",
    name: "Karthik Verma",
    roll: "10-A-05",
    admissionNo: "NGS-HYD-2026-005",
    grade: "Class 10 - Section A",
    parentName: "Sri Rajesh Verma",
    outstandingDue: 42500,
  },
]

export default function CounterFeeCollectionPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<StudentLookup | null>(STUDENTS_DB[2]) // Default Rohan Kumar
  const [paymentAmount, setPaymentAmount] = useState<number>(22500)
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "CARD" | "NETBANKING">("UPI")
  const [transactionRef, setTransactionRef] = useState("UPI-984801122334")
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null)

  const handleSearch = () => {
    const found = STUDENTS_DB.find(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (found) {
      setSelectedStudent(found)
      setPaymentAmount(found.outstandingDue)
    }
  }

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || paymentAmount <= 0) return

    const receipt = {
      receiptNumber: `NGS-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      student: selectedStudent,
      amountPaid: paymentAmount,
      mode: paymentMode,
      refNumber: transactionRef || "N/A",
      remainingDue: Math.max(0, selectedStudent.outstandingDue - paymentAmount),
    }

    setGeneratedReceipt(receipt)
    setReceiptModalOpen(true)
  }

  return (
    <AppShell
      pageTitle="Counter POS Fee Collection"
      breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Fee Collection" }]}
    >
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Search & Lookup Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-border-default">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-primary" />
              <span>Lookup Student Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter Student Name, Roll No (e.g. 10-A-03), or Admission No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-canvas border border-border-default rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
              />
              <Button size="default" variant="primary" onClick={handleSearch}>
                Find Student
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Account Summary & Payment Form */}
        {selectedStudent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Dossier Info */}
            <Card>
              <CardHeader className="pb-3 border-b border-border-default">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-primary" />
                  <span>Student Fee Ledger</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-default">
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">{selectedStudent.name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{selectedStudent.grade}</p>
                    <p className="text-[11px] font-mono text-text-muted">{selectedStudent.admissionNo}</p>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs font-mono">
                    {selectedStudent.roll}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border-default/60">
                    <span className="text-text-secondary">Parent / Guardian:</span>
                    <span className="font-medium text-text-primary">{selectedStudent.parentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-default/60">
                    <span className="text-text-secondary">Academic Session:</span>
                    <span className="font-mono text-text-primary">AY 2026-27 (CBSE)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-default/60">
                    <span className="text-text-secondary">Total Term Fee:</span>
                    <span className="font-mono text-text-primary">₹42,500</span>
                  </div>
                  <div className="flex justify-between py-2 bg-subtle px-3 rounded-xl mt-3">
                    <span className="font-bold text-text-primary">Current Outstanding Due:</span>
                    <span className="font-mono font-bold text-base text-amber-600">
                      ₹{selectedStudent.outstandingDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Collection Form */}
            <Card>
              <CardHeader className="pb-3 border-b border-border-default">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Receive Fee Collection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Collection Amount (INR) *
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        required
                        min={1}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full bg-canvas border border-border-default rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Payment Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "UPI", label: "UPI / QR", icon: QrCode },
                        { key: "CASH", label: "Cash POS", icon: Banknote },
                        { key: "CARD", label: "Debit/Credit", icon: CreditCard },
                        { key: "NETBANKING", label: "NetBanking", icon: Building2 },
                      ].map((m) => (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setPaymentMode(m.key as any)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            paymentMode === m.key
                              ? "bg-action-black text-canvas border-action-black shadow-xs"
                              : "bg-surface border-border-default text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          <m.icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      UTR / Transaction Reference No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-984801122334"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full bg-canvas border border-border-default rounded-xl px-3 py-2 text-xs font-mono text-text-primary"
                    />
                  </div>

                  <Button
                    size="default"
                    variant="primary"
                    type="submit"
                    className="w-full mt-2"
                    leadingIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Confirm Collection & Generate Receipt
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Official Fee Receipt Modal */}
      <SlideOver
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Official Fee Receipt"
        subtitle={generatedReceipt?.receiptNumber}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              size="dense"
              variant="secondary"
              leadingIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print Receipt
            </Button>
            <Button
              size="dense"
              variant="primary"
              leadingIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {
                alert(`Official fee receipt ${generatedReceipt?.receiptNumber} downloaded!`)
                setReceiptModalOpen(false)
              }}
            >
              Download PDF
            </Button>
          </div>
        }
      >
        {generatedReceipt && (
          <div className="py-4 space-y-6">
            {/* Header */}
            <div className="text-center p-4 bg-canvas rounded-xl border border-border-default">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold text-sm text-text-primary">Narayana e-Techno School</h3>
              </div>
              <p className="text-[11px] text-text-secondary">Affiliated to CBSE, New Delhi (Affiliation No: 3630128)</p>
              <p className="text-[10px] text-text-muted mt-0.5">Madhapur, Hyderabad - 500081 • Phone: 040-23114455</p>
              <div className="mt-2 pt-2 border-t border-border-default flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-text-primary">{generatedReceipt.receiptNumber}</span>
                <span className="text-text-muted font-mono">{generatedReceipt.date}</span>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-3 text-xs bg-subtle p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-text-muted">Student Name:</span>
                <span className="font-bold text-text-primary">{generatedReceipt.student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Admission No:</span>
                <span className="font-mono font-medium text-text-primary">{generatedReceipt.student.admissionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Class & Section:</span>
                <span className="text-text-primary">{generatedReceipt.student.grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Parent / Guardian:</span>
                <span className="text-text-primary">{generatedReceipt.student.parentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Payment Mode:</span>
                <Badge variant="neutral">{generatedReceipt.mode}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Reference / UTR:</span>
                <span className="font-mono text-text-secondary">{generatedReceipt.refNumber}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border border-border-default rounded-xl p-4 bg-canvas space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Amount Collected:</span>
                <span className="font-mono font-bold text-base text-emerald-600">
                  ₹{generatedReceipt.amountPaid.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-border-default">
                <span className="text-text-secondary">Balance Remaining Due:</span>
                <span className="font-mono font-bold text-text-primary">
                  ₹{generatedReceipt.remainingDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] text-text-muted italic pt-4 border-t border-border-default">
              Computer-generated official receipt. Recorded in financial audit dispatch.
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  )
}
