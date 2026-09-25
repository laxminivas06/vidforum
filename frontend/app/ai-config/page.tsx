"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { Cpu, Settings, Save } from "lucide-react"

export default function AIConfigPage() {
  return (
    <AppShell
      pageTitle="AI Yantra Global Configuration"
      breadcrumbs={[{ label: "System & AI" }, { label: "AI Config" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Save className="w-3.5 h-3.5" />}>
          Save Settings
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brand-primary" />
              <CardTitle className="text-sm">Global AI Model Weights & Routing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs flex flex-col gap-3">
            <div className="flex justify-between border-b border-border-default pb-2">
              <span className="font-semibold text-text-primary">Voice Agent Foundation</span>
              <span className="font-mono text-text-secondary">Whisper-Large-v3 + ElevenLabs Multilingual</span>
            </div>
            <div className="flex justify-between border-b border-border-default pb-2">
              <span className="font-semibold text-text-primary">Facial Embeddings Engine</span>
              <span className="font-mono text-text-secondary">InsightFace ArcFace 512d (Local Edge)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-text-primary">AI Tutor Reasoning Engine</span>
              <span className="font-mono text-text-secondary">Claude 3.5 Sonnet / Gemini 1.5 Pro</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
