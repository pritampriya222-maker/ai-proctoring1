"use client"

import { useRecording } from "@/contexts/recording-context"
import { Video, VideoOff, MonitorUp } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Recording Indicator Component
 * Shows current recording status for webcam and screen
 * Displays visual feedback about what is being recorded
 */

export function RecordingIndicator() {
  const { isRecording, hasWebcamPermission, hasScreenPermission } = useRecording()

  return (
    <div className="flex items-center gap-3">
      {/* Webcam Status */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
          hasWebcamPermission ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
        )}
      >
        {hasWebcamPermission ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
        <span>Camera</span>
      </div>

      {/* Screen Status */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
          hasScreenPermission ? "bg-success/20 text-success" : "bg-muted/50 text-muted-foreground",
        )}
      >
        <MonitorUp className="h-3.5 w-3.5" />
        <span>Screen</span>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-2 rounded-full bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse-recording" />
          <span>Recording</span>
        </div>
      )}
    </div>
  )
}
