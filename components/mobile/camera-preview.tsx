"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { VideoOff, Video } from "lucide-react"

/**
 * Mobile Camera Preview Component
 * Displays full-screen camera preview for positioning
 */

interface MobileCameraPreviewProps {
  stream: MediaStream | null
  isRecording: boolean
}

export function MobileCameraPreview({ stream, isRecording }: MobileCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!stream) {
    return (
      <Card className="flex h-full w-full items-center justify-center bg-muted/50">
        <div className="flex flex-col items-center gap-4 text-center">
          <VideoOff className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground">Camera not available</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1.5 text-sm text-destructive-foreground">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Recording
        </div>
      )}

      {/* Camera active indicator */}
      {!isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-success/90 px-3 py-1.5 text-sm text-success-foreground">
          <Video className="h-4 w-4" />
          Camera Active
        </div>
      )}

      {/* Position guide overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Guide lines */}
        <div className="absolute inset-0 border-2 border-dashed border-white/20 m-8 rounded-lg" />

        {/* Corner markers */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary" />
      </div>
    </div>
  )
}
