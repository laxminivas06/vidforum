"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from "@/components/ui"
import { 
  IndianRupee, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  QrCode, 
  CreditCard, 
  Receipt, 
  History, 
  CheckCheck,
  ShieldCheck,
  Building,
  Check
} from "lucide-react"
import { 
  usePaymentRecords, 
  useVerifyPayment, 
  PaymentRecord 
} from "@/lib/api/admission-control.hooks"

export default function PaymentRecordsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [modeFilter, setModeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPaymentForAudit, setSelectedPaymentForAudit] = useState<PaymentRecord | null>(null)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)

  const { data: payments = [], isLoading: paymentsLoading } = usePaymentRecords()
  const verifyPaymentMutation = useVerifyPayment()

  // Filtered Payments
  const filteredPayments = React.useMemo(() => {
    return payments.filter((p: PaymentRecord) => {
      const matchesSearch =
        p.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.permanent_admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.utr_reference_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.gateway_reference_id || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMode = modeFilter === "all" || p.payment_mode === modeFilter
      const matchesStatus = statusFilter === "all" || p.payment_status === statusFilter

      return matchesSearch && matchesMode && matchesStatus
    })
  }, [payments, searchQuery, modeFilter, statusFilter])

  // Aggregate Metrics
  const metrics = React.useMemo(() => {
    const totalCollected = payments.reduce((acc: number, p: PaymentRecord) => acc + (Number(p.amount) || 0), 0)
    const verifiedAmount = payments
      .filter((p: PaymentRecord) => p.payment_status === "verified")
      .reduce((acc: number, p: PaymentRecord) => acc + (Number(p.amount) || 0), 0)
    const pendingAmount = payments
      .filter((p: PaymentRecord) => p.payment_status === "pending_verification")
      .reduce((acc: number, p: PaymentRecord) => acc + (Number(p.amount) || 0), 0)

    return { totalCollected, verifiedAmount, pendingAmount, count: payments.length }
  }, [payments])

  const handleVerify = async (paymentId: string) => {
    try {
      await verifyPaymentMutation.mutateAsync({
        id: paymentId,
        status: "verified",
      })
    } catch (err: any) {
      alert("Failed to verify payment: " + err.message)
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Module 11: Finance & Payments
              </span>
              <Badge variant="outline" className="text-muted-foreground text-xs">
                Real-Time Ledger
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Admission Payment Records & Transactions
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Authoritative transaction receipts, UPI UTR verification, cash collections, and immutable audit logs.
            </p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border border-border bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Total Fee Inflow</span>
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1.5">
              ₹{metrics.totalCollected.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{metrics.count} transaction records</div>
          </Card>

          <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase">Verified Revenue</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
              ₹{metrics.verifiedAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Cleared & settled</div>
          </Card>

          <Card className="p-4 border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold uppercase">Pending Verification</span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1.5">
              ₹{metrics.pendingAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">UPI transfers awaiting check</div>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <Card className="border border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, adm no, or UTR..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="all">All Payment Modes</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash Desk</option>
                <option value="card">Card Terminal</option>
                <option value="other">Other</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Payments Table */}
        <Card className="border border-border/60 shadow-sm overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Student & Adm No.</th>
                  <th className="py-3.5 px-4">Mode & Reference</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Collector / Gateway</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                      Loading payment transactions...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground text-xs block">{p.student_name}</span>
                        <span className="font-mono text-primary text-[11px] font-medium">
                          {p.permanent_admission_number}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {p.payment_mode}
                          </Badge>
                          {p.payment_mode === "upi" && (
                            <span className="text-xs font-mono font-medium text-foreground">
                              UTR: {p.utr_reference_number || "—"}
                            </span>
                          )}
                          {p.payment_mode === "card" && (
                            <span className="text-xs font-mono text-foreground">
                              {p.gateway_reference_id || "—"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs text-foreground">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={p.payment_status === "verified" ? "success" : "warning"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {p.payment_status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                        {p.payment_date} {p.payment_time}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-foreground">
                        {p.collected_by || p.gateway_reference_id || "Online Gateway"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.payment_status === "pending_verification" && (
                            <Button
                              size="sm"
                              onClick={() => handleVerify(p.id)}
                              disabled={verifyPaymentMutation.isPending}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Verify Payment
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPaymentForAudit(p)
                              setIsAuditModalOpen(true)
                            }}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <History className="w-3.5 h-3.5" /> Audit Trail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AUDIT TRAIL MODAL */}
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Payment Audit Trail & Verification History"
        >
          {selectedPaymentForAudit && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-bold text-foreground">{selectedPaymentForAudit.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admission No:</span>
                  <span className="font-mono text-primary font-semibold">{selectedPaymentForAudit.permanent_admission_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono font-bold text-foreground">
                    ₹{Number(selectedPaymentForAudit.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference / UTR:</span>
                  <span className="font-mono text-foreground">
                    {selectedPaymentForAudit.utr_reference_number || selectedPaymentForAudit.gateway_reference_id || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-foreground block mb-2">Immutable Audit Trail Events:</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedPaymentForAudit.audit_trail && selectedPaymentForAudit.audit_trail.length > 0 ? (
                    selectedPaymentForAudit.audit_trail.map((entry: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg border border-border bg-background flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground capitalize">{entry.action}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Status: <strong className="text-foreground">{entry.status}</strong> • By: {entry.by}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg border border-border text-center text-muted-foreground">
                      No explicit audit events recorded.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer - Strictly clean buttons without keybinding badges */}
              <div className="flex items-center justify-end pt-3 border-t border-border">
                <Button variant="outline" onClick={() => setIsAuditModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  )
}
