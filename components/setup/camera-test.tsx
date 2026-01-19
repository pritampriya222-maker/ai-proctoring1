"use client"

import { useEffect, useRef, useState } from "react"
import { useRecording } from "@/contexts/recording-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, VideoOff, RefreshCw } from "lucide-react"

/**
 * Camera Test Component
 * Shows live camera preview for testing before exam starts
 */

export function CameraTest() {
  const { getWebcamStream, hasWebcamPermission, requestWebcamPermission } = useRecording()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const stream = getWebcamStream()
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [getWebcamStream, hasWebcamPermission])

  const handleRetry = async () => {
    setIsRetrying(true)
    await requestWebcamPermission()
    setIsRetrying(false)
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-5 w-5" />
          Camera Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          {hasWebcamPermission ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-success/20 px-3 py-1 text-xs text-success">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Camera Active
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
              <VideoOff className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">Camera permission not granted</p>
              <Button onClick={handleRetry} disabled={isRetrying} variant="outline" size="sm">
                {isRetrying ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Retry
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>Please ensure:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Your face is clearly visible</li>
            <li>Good lighting conditions</li>
            <li>Minimal background distractions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
