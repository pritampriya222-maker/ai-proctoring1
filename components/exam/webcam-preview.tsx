"use client"

import { useEffect, useRef } from "react"
import { useRecording } from "@/contexts/recording-context"
import { Card } from "@/components/ui/card"
import { VideoOff } from "lucide-react"

/**
 * Webcam Preview Component
 * Displays live webcam feed in a small overlay
 * Shows placeholder when camera is not available
 */

interface WebcamPreviewProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function WebcamPreview({ className = "", size = "md" }: WebcamPreviewProps) {
  const { getWebcamStream, hasWebcamPermission } = useRecording()
  const videoRef = useRef<HTMLVideoElement>(null)

  const sizeClasses = {
    sm: "w-32 h-24",
    md: "w-48 h-36",
    lg: "w-64 h-48",
  }

  useEffect(() => {
    const stream = getWebcamStream()
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [getWebcamStream, hasWebcamPermission])

  return (
    <Card className={`${sizeClasses[size]} overflow-hidden rounded-lg border-2 border-border/50 bg-card ${className}`}>
      {hasWebcamPermission ? (
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/50">
          <VideoOff className="h-8 w-8 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Camera Off</span>
        </div>
      )}
    </Card>
  )
}
