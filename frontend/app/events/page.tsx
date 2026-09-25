"use client"

import React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { Calendar, Plus, MapPin, Clock } from "lucide-react"

export default function EventsPage() {
  const events = [
    { title: "Annual Inter-School STEM Exhibition", date: "Oct 12, 2026", time: "09:00 AM - 04:00 PM", venue: "Campus Main Auditorium", type: "ACADEMIC" },
    { title: "Parent-Teacher Academic Review (Term 1)", date: "Oct 18, 2026", time: "08:30 AM - 01:30 PM", venue: "Classrooms & Quadrangle", type: "CONFERENCE" },
    { title: "Inter-House Athletics Championship", date: "Nov 05, 2026", time: "07:30 AM - 05:00 PM", venue: "Athletics Stadium Track", type: "SPORTS" },
  ]

  return (
    <AppShell
      pageTitle="Campus Events & Calendar"
      breadcrumbs={[{ label: "Optional" }, { label: "Events" }]}
      rightHeaderAction={
        <Button size="dense" variant="primary" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
          Schedule Event
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="positive">{evt.type}</Badge>
                  <span className="font-mono text-xs text-text-secondary">{evt.date}</span>
                </div>
                <CardTitle className="text-sm mt-1">{evt.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  <span>{evt.time}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 text-text-muted" />
                  <span>{evt.venue}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
