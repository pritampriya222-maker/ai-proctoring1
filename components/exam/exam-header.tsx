"use client"

import { useAuth } from "@/contexts/auth-context"
import { ExamTimer } from "./exam-timer"
import { RecordingIndicator } from "./recording-indicator"
import { MobileConnectionStatus } from "./mobile-connection-status"
import { Shield } from "lucide-react"

/**
 * Exam Header Component
 * Displays exam title, timer, recording status, and student info
 */

export function ExamHeader() {
  const { student, session } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Proctor Exam</h1>
            <p className="text-xs text-muted-foreground">Session: {session?.sessionId.slice(-8)}</p>
          </div>
        </div>

        {/* Center: Timer */}
        <ExamTimer />

        {/* Right: Status and Info */}
        <div className="flex items-center gap-4">
          <RecordingIndicator />

          <MobileConnectionStatus />

          {/* Student Info */}
          <div className="text-right">
            <p className="text-sm font-medium">{student?.name}</p>
            <p className="text-xs text-muted-foreground">{student?.studentId}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
