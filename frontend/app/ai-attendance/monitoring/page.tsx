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
  Plus,
} from "lucide-react"

interface CameraDeck {
  id: string
  name: string
  fps: number
  verified: number
  status: "ONLINE" | "OFFLINE"
}

export default function AIAttendanceMonitoringPage() {
  const [cameraDecks, setCameraDecks] = useState<CameraDeck[]>([])

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
          headline={cameraDecks.length > 0 ? `${cameraDecks.length} Biometric Terminals Synchronized` : "Edge Facial Recognition Ready"}
          description="Edge-accelerated facial recognition pipeline computing 512-dimension face embeddings locally without transferring raw imagery off-premises."
        />

        {/* Camera Grid or Clean Empty State */}
        {cameraDecks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameraDecks.map((cam) => (
              <Card key={cam.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-brand-primary" />
                      <CardTitle className="text-sm font-semibold">{cam.name}</CardTitle>
                    </div>
                    <Badge variant={cam.status === "ONLINE" ? "positive" : "neutral"}>
                      {cam.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-xs">
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
        ) : (
          <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-default flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-subtle border border-border-default flex items-center justify-center text-text-muted">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                No Biometric Vision Decks Connected
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                Pair edge camera feeds (turnstiles, high school gates, foyer checkpoints) to monitor real-time automated student attendance.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
