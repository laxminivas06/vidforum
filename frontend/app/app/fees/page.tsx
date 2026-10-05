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
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  Receipt,
  QrCode,
  ShieldCheck,
  Building2,
  X,
} from "lucide-react"

interface FeeItem {
  id: string
  title: string
  term: string
  dueDate: string
  amount: number
  paidAmount: number
  status: "PAID" | "PENDING" | "OVERDUE"
  receiptNo?: string
  paymentDate?: string
  paymentMode?: string
}

export default function StudentFeesPage() {
  const [feeSchedule, setFeeSchedule] = useState<FeeItem[]>([
    {
      id: "fee-1",
      title: "Term 1 Composite Tuition Fee",
      term: "Term 1 (2026-27)",
      dueDate: "2026-07-15",
      amount: 35000,
      paidAmount: 35000,
      status: "PAID",
      receiptNo: "RCP-HYD-2026-0891",
      paymentDate: "2026-07-10",
      paymentMode: "UPI / PhonePe",
    },
    {
      id: "fee-2",
      title: "Science & Robotics Lab Component",
      term: "Term 1 (2026-27)",
      dueDate: "2026-07-15",
      amount: 15000,
      paidAmount: 15000,
      status: "PAID",
      receiptNo: "RCP-HYD-2026-0892",
      paymentDate: "2026-07-10",
      paymentMode: "Net Banking (SBI)",
    },
    {
      id: "fee-3",
      title: "Air-Conditioned Bus Transport (Kondapur Route 4)",
      term: "Term 1 (2026-27)",
      dueDate: "2026-08-01",
      amount: 12000,
      paidAmount: 12000,
      status: "PAID",
      receiptNo: "RCP-HYD-2026-1104",
      paymentDate: "2026-08-02",
      paymentMode: "UPI / Google Pay",
    },
    {
      id: "fee-4",
      title: "Term 2 Composite Tuition Fee",
      term: "Term 2 (2026-27)",
      dueDate: "2026-11-15",
      amount: 35000,
      paidAmount: 0,
      status: "PENDING",
    },
    {
      id: "fee-5",
      title: "CBSE All India Secondary Examination Registration Fee",
      term: "Annual Board",
      dueDate: "2026-11-30",
      amount: 3500,
      paidAmount: 0,
      status: "PENDING",
    },
  ])

  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null)
  const [payMethod, setPayMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState<FeeItem | null>(null)

  const totalCommitted = feeSchedule.reduce((acc, f) => acc + f.amount, 0)
  const totalPaid = feeSchedule.reduce((acc, f) => acc + f.paidAmount, 0)
  const pendingBalance = totalCommitted - totalPaid

  const handlePayClick = (item: FeeItem) => {
    setSelectedFee(item)
    setIsPayModalOpen(true)
  }

  const handleExecutePayment = () => {
    if (!selectedFee) return
    setIsProcessing(true)

    setTimeout(() => {
      const generatedReceipt = `RCP-HYD-2026-${Math.floor(1000 + Math.random() * 9000)}`
      setFeeSchedule((prev) =>
        prev.map((f) =>
          f.id === selectedFee.id
            ? {
                ...f,
                paidAmount: f.amount,
                status: "PAID",
                receiptNo: generatedReceipt,
                paymentDate: "2026-10-05",
                paymentMode: payMethod === "UPI" ? "Instant UPI (BHIM/QR)" : payMethod === "CARD" ? "Debit Card" : "Net Banking",
              }
            : f
        )
      )
      setIsProcessing(false)
      setIsPayModalOpen(false)
      setActiveReceipt({
        ...selectedFee,
        paidAmount: selectedFee.amount,
        status: "PAID",
        receiptNo: generatedReceipt,
        paymentDate: "2026-10-05",
        paymentMode: payMethod === "UPI" ? "Instant UPI (BHIM/QR)" : payMethod === "CARD" ? "Debit Card" : "Net Banking",
      })
    }, 1200)
  }

  return (
    <AppShell
      pageTitle="Student Fee Ledger & Online Payments"
      breadcrumbs={[
        { label: "Portal Home", href: "/app/home" },
        { label: "Fees & Invoices" },
      ]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Badge variant="positive" className="px-2.5 py-1 text-xs">
            Student: Sai Teja Chary (10-A)
          </Badge>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* KPI Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Billed (2026-27)</span>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  ₹{totalCommitted.toLocaleString("en-IN")}
                </p>
                <span className="text-[11px] text-text-muted mt-0.5 block font-mono">
                  5 Fee heads scheduled
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-primary flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Total Paid to Date</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 3 Installments settled
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className={pendingBalance > 0 ? "border-amber-400 bg-amber-50/10" : ""}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary font-medium">Upcoming Payable</span>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  ₹{pendingBalance.toLocaleString("en-IN")}
                </p>
                <span className="text-[11px] text-text-muted mt-0.5 block font-mono">
                  Next due: Nov 15, 2026
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Heads Ledger */}
        <Card>
          <CardHeader className="pb-3 border-b border-border-default flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                <span>Academic Year 2026-27 Fee Schedule</span>
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Official institutional fee breakdown verified with Narayana e-Techno School Hyderabad accounts office.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-subtle text-text-muted border-b border-border-default uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fee Component</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {feeSchedule.map((item) => (
                  <tr key={item.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-text-primary">{item.title}</p>
                      {item.receiptNo && (
                        <p className="text-[11px] text-text-muted font-mono mt-0.5">
                          Receipt: {item.receiptNo} • {item.paymentMode}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">{item.term}</td>
                    <td className="py-3 px-4 font-mono text-text-secondary">{item.dueDate}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "PAID" ? (
                        <Badge variant="positive" className="text-[10px]">
                          Paid & Cleared
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">
                          Upcoming Due
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === "PAID" ? (
                        <Button
                          size="dense"
                          variant="secondary"
                          leadingIcon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => setActiveReceipt(item)}
                        >
                          Receipt
                        </Button>
                      ) : (
                        <Button
                          size="dense"
                          variant="primary"
                          leadingIcon={<CreditCard className="w-3.5 h-3.5" />}
                          onClick={() => handlePayClick(item)}
                        >
                          Pay Now
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Banking Notice & Security Guarantee */}
        <div className="p-4 rounded-xl border border-border-default bg-subtle/40 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary space-y-1">
            <p className="font-semibold text-text-primary">256-Bit SSL Encrypted Educational Payment Gateway</p>
            <p>
              Direct settlements processed through RBI-approved Payment Aggregators (Razorpay / Axis Bank). GST receipts are instantly generated with verifiable SHA-256 cryptographic hashes for income tax exemption under 80C.
            </p>
          </div>
        </div>
      </div>

      {/* Pay Online Modal Dialog */}
      {isPayModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-canvas border border-border-default rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">
                Pay Fee: {selectedFee.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-subtle border border-border-default flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-text-muted font-medium">Payable Amount</span>
                  <p className="text-xl font-bold font-mono text-text-primary">
                    ₹{selectedFee.amount.toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge variant="neutral">{selectedFee.term}</Badge>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-text-primary block">Select Payment Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("UPI")}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      payMethod === "UPI"
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                        : "border-border-default bg-canvas hover:bg-subtle text-text-secondary"
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-inherit" />
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("CARD")}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      payMethod === "CARD"
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                        : "border-border-default bg-canvas hover:bg-subtle text-text-secondary"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-inherit" />
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("NETBANKING")}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      payMethod === "NETBANKING"
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                        : "border-border-default bg-canvas hover:bg-subtle text-text-secondary"
                    }`}
                  >
                    <Building2 className="w-5 h-5 mx-auto mb-1 text-inherit" />
                    Net Banking
                  </button>
                </div>
              </div>

              {payMethod === "UPI" && (
                <div className="p-4 rounded-xl border border-dashed border-border-default text-center space-y-2">
                  <div className="w-32 h-32 mx-auto bg-canvas border border-border-default rounded-xl p-2 flex flex-col items-center justify-center">
                    <QrCode className="w-20 h-20 text-text-primary" />
                    <span className="text-[9px] font-mono text-text-muted">Scan with any UPI App</span>
                  </div>
                  <p className="text-[11px] text-text-muted">Supports PhonePe, Google Pay, Paytm, BHIM</p>
                </div>
              )}

              {payMethod === "CARD" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="4123 4567 8901 2345"
                      className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1">
                        Valid Thru
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={3}
                        className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-text-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {payMethod === "NETBANKING" && (
                <div className="space-y-2">
                  <label className="font-semibold text-text-primary block">Select Major Bank</label>
                  <select className="w-full p-2.5 rounded-lg border border-border-default bg-canvas text-text-primary text-xs">
                    <option>State Bank of India</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-border-default">
                <Button size="dense" variant="secondary" onClick={() => setIsPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  onClick={handleExecutePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Authorizing Payment..." : `Authorize ₹${selectedFee.amount.toLocaleString("en-IN")}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-canvas border border-border-default rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">
                Official Fee Payment Receipt
              </h3>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              {/* Header */}
              <div className="text-center border-b border-border-default pb-3">
                <h4 className="font-bold text-sm text-text-primary uppercase tracking-wide">
                  Narayana e-Techno School
                </h4>
                <p className="text-[11px] text-text-muted">
                  Kondapur Main Road, Serilingampally, Hyderabad - 500084
                </p>
                <p className="text-[10px] text-text-muted">Affiliation No: CBSE/AFF/3630124 • U-DISE: 36010200301</p>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-text-muted block">Receipt No:</span>
                  <span className="font-bold text-text-primary">{activeReceipt.receiptNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted block">Date:</span>
                  <span className="font-bold text-text-primary">{activeReceipt.paymentDate}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Student Name:</span>
                  <span className="font-bold text-text-primary">Sai Teja Chary</span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted block">Admission No / Class:</span>
                  <span className="font-bold text-text-primary">NGS-HYD-2026-001 (10-A)</span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-border-default rounded-lg p-3 bg-subtle/30">
                <div className="flex justify-between font-bold border-b border-border-default pb-1">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between py-1.5 text-text-primary">
                  <span>{activeReceipt.title} ({activeReceipt.term})</span>
                  <span>₹{activeReceipt.amount.toLocaleString("en-IN")}.00</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border-default pt-1.5 text-text-primary">
                  <span>Total Received</span>
                  <span>₹{activeReceipt.amount.toLocaleString("en-IN")}.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-text-muted pt-2 border-t border-border-default">
                <span>Mode: {activeReceipt.paymentMode}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Digitally Authorized Cashier
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button size="dense" variant="secondary" onClick={() => setActiveReceipt(null)}>
                  Close
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  leadingIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => {
                    alert(`Receipt ${activeReceipt.receiptNo} downloaded successfully.`)
                    setActiveReceipt(null)
                  }}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
