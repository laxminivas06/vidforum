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
} from "@/components/ui"
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

interface ParsedRow {
  rollNo: string
  name: string
  marks: number
  maxMarks: number
  status: "VALID" | "WARNING" | "ERROR"
  message: string
}

const SAMPLE_PREVIEW: ParsedRow[] = [
  { rollNo: "10-A-01", name: "Sai Teja Chary", marks: 76, maxMarks: 80, status: "VALID", message: "Student record verified in Class 10" },
  { rollNo: "10-A-02", name: "Ananya Reddy", marks: 78, maxMarks: 80, status: "VALID", message: "Student record verified in Class 10" },
  { rollNo: "10-A-03", name: "Rohan Kumar", marks: 68, maxMarks: 80, status: "VALID", message: "Student record verified in Class 10" },
  { rollNo: "10-A-04", name: "Sana Fathima", marks: 72, maxMarks: 80, status: "VALID", message: "Student record verified in Class 10" },
  { rollNo: "10-A-05", name: "Karthik Verma", marks: 64, maxMarks: 80, status: "VALID", message: "Student record verified in Class 10" },
]

export default function ExcelImportEnginePage() {
  const [selectedFile, setSelectedFile] = useState<string | null>("CBSE_Class10_Maths_MidTerm_Ledger.xlsx")
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>(SAMPLE_PREVIEW)
  const [isIngesting, setIsIngesting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleDownloadTemplate = () => {
    const csvContent =
      "Roll_No,Student_Name,Class,Section,Subject_Code,Marks_Obtained,Max_Marks,Remarks\n" +
      "10-A-01,Sai Teja Chary,10,A,041,76,80,Good\n" +
      "10-A-02,Ananya Reddy,10,A,041,78,80,Excellent\n"

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "CBSE_Marks_Import_Template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleIngest = () => {
    setIsIngesting(true)
    setTimeout(() => {
      setIsIngesting(false)
      setIsSuccess(true)
    }, 1200)
  }

  return (
    <AppShell
      pageTitle="Excel Import Engine"
      breadcrumbs={[{ label: "Examinations", href: "/examinations/schedules" }, { label: "Excel Import Engine" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leadingIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Upload Zone */}
        <div className="p-8 rounded-2xl bg-surface border-2 border-dashed border-border-default flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              {selectedFile ? selectedFile : "Upload Marks Spreadsheet"}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Supports .xlsx, .xls and .csv formats. Max size 25MB.
            </p>
          </div>
          <input
            type="file"
            id="excel-file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setSelectedFile(e.target.files[0].name)
                setIsSuccess(false)
              }
            }}
          />
          <div className="flex items-center gap-3 mt-2">
            <Button
              size="dense"
              variant="secondary"
              onClick={() => document.getElementById("excel-file")?.click()}
            >
              Choose Spreadsheet
            </Button>
            {selectedFile && (
              <Button
                size="dense"
                variant="primary"
                disabled={isIngesting || isSuccess}
                leadingIcon={isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                onClick={handleIngest}
              >
                {isIngesting ? "Validating & Ingesting..." : isSuccess ? "Ingested" : "Ingest Ledger"}
              </Button>
            )}
          </div>
        </div>

        {isSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Ledger Ingestion Complete</p>
                <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                  5 of 5 rows committed to PostgreSQL with 0 integrity violations. Audit dispatch logged.
                </p>
              </div>
            </div>
            <Badge variant="positive">Verified</Badge>
          </div>
        )}

        {/* Validation Preview Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-default">
            <div>
              <CardTitle className="text-sm">Spreadsheet Pre-Flight Validation Preview</CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Target: Class 10 (CBSE) • Mid-Term Examination 2026 • Mathematics Standard (041)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="positive">5 Valid</Badge>
              <Badge variant="neutral">0 Errors</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-subtle border-b border-border-default text-text-secondary uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Validation Status</th>
                    <th className="py-3 px-4">Integrity Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-text-secondary">{row.rollNo}</td>
                      <td className="py-3 px-4 font-semibold text-text-primary">{row.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-text-primary">
                        {row.marks} / {row.maxMarks}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="positive" className="text-[10px]">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{row.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
