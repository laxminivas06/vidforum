"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SpotHeroPanel,
  Button,
  Badge,
} from "@/components/ui"
import {
  Camera,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  ScanFace,
  Server,
} from "lucide-react"

const CAMERA_DECKS = [
  { id: "cam-01", name: "Main Campus Gate A (Turnstile 1)", fps: 30, verified: 612, status: "ONLINE" },
  { id: "cam-02", name: "Main Campus Gate A (Turnstile 2)", fps: 30, verified: 598, status: "ONLINE" },
  { id: "cam-03", name: "Block B High School Foyer", fps: 28, verified: 410, status: "ONLINE" },
  { id: "cam-04", name: "Block C Senior Wing Entrance", fps: 30, verified: 320, status: "ONLINE" },
  { id: "cam-05", name: "Auditorium & Sports Complex Gate", fps: 30, verified: 142, status: "ONLINE" },
  { id: "cam-06", name: "Hostel Quadrangle Checkpoint", fps: 29, verified: 218, status: "ONLINE" },
]

export default function AIAttendanceMonitoringPage() {
  return (
    <AppShell
      pageTitle="AI Yantra — Vision Attendance Streams"
      breadcrumbs={[{ label: "AI Yantra" }, { label: "Biometric Vision Decks" }]}
      rightHeaderAction={
        <div className="flex items-center gap-2">
          <Button size="dense" variant="secondary" leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Calibrate Models
          </Button>
          <Button
            size="dense"
            variant="primary"
            className="bg-brand-primary text-black hover:bg-emerald-400"
            leadingIcon={<ScanFace className="w-3.5 h-3.5" />}
          >
            Enroll New Facial Vector
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Spot Hero */}
        <SpotHeroPanel
          badgeText="EDGE VISION CLUSTER // RTSP ENCRYPTED"
          headline="12/12 Biometric Terminals Synchronized"
          description="Edge-accelerated facial recognition pipeline computing 512-dimension face embeddings locally without transferring raw imagery off-premises (PRD Data Privacy Rule 26)."
        />

        {/* Camera Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAMERA_DECKS.map((cam) => (
            <Card key={cam.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand-primary" />
                    <CardTitle className="text-sm font-semibold">{cam.name}</CardTitle>
                  </div>
                  <Badge variant="positive">ONLINE</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                {/* Mock Live Viewfinder Window */}
                <div className="w-full h-36 rounded-lg bg-neutral-950 flex flex-col justify-between p-3 relative overflow-hidden border border-neutral-800">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 z-10">
                    <span className="flex items-center gap-1 text-brand-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                      LIVE RTSP
                    </span>
                    <span>{cam.fps} FPS</span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 border border-brand-primary/40 rounded-lg flex items-center justify-center">
                      <ScanFace className="w-8 h-8 text-brand-primary/30" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 z-10">
                    <span>NODE: {cam.id.toUpperCase()}</span>
                    <span className="text-white font-semibold">{cam.verified} Identifications</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 font-mono text-text-secondary">
                  <span>Match Confidence:</span>
                  <span className="font-bold text-brand-primary">99.78%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
