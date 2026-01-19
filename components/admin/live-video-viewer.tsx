"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StudentSession } from "@/types"
import { X, Maximize2, Minimize2, Camera, Monitor, Smartphone, AlertTriangle } from "lucide-react"

interface LiveVideoViewerProps {
  session: StudentSession
  onClose: () => void
  onWarn?: (sessionId: string, message: string) => void
}

/**
 * Live Video Viewer Component
 * Shows screen recording with webcam overlay in bottom-right corner
 * Used by admin to monitor student activity in real-time
 */

export function LiveVideoViewer({ session, onClose, onWarn }: LiveVideoViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const hasAlerts = session.behaviorFlags.some((f) => f.severity === "critical" || f.severity === "high")

  return (
    <Card
      className={`border-border bg-card ${isFullscreen ? "fixed inset-4 z-50" : "relative"} ${hasAlerts ? "border-red-500/50" : ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-medium">{session.studentName}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {session.studentId}
          </Badge>
          {hasAlerts && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alert
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1 bg-orange-500 hover:bg-orange-600 text-white border-none"
            onClick={() => {
              const msg = prompt("Enter warning message for student:");
              if (msg) onWarn?.(session.sessionId, msg);
            }}
          >
            <AlertTriangle className="h-3 w-3" />
            Warn
          </Button>
          <div className="flex items-center gap-3 mr-4 text-xs">
            <span className={`flex items-center gap-1 ${session.webcamActive ? "text-green-400" : "text-red-400"}`}>
              <Camera className="h-3 w-3" />
              Webcam
            </span>
            <span
              className={`flex items-center gap-1 ${session.screenShareActive ? "text-green-400" : "text-red-400"}`}
            >
              <Monitor className="h-3 w-3" />
              Screen
            </span>
            <span
              className={`flex items-center gap-1 ${session.mobileConnected ? "text-green-400" : "text-muted-foreground"}`}
            >
              <Smartphone className="h-3 w-3" />
              Mobile
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div
          className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? "h-[calc(100vh-12rem)]" : "aspect-video"}`}
        >
          {/* Screen Recording (Main View) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {session.screenShareActive ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Monitor className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                  <div>
                    <p className="text-sm text-muted-foreground">Screen Recording Active</p>
                    <p className="text-xs text-muted-foreground/70">
                      Live feed would display here with WebRTC in production
                    </p>
                  </div>
                  {/* Simulated screen content */}
                  <div className="mt-4 mx-auto max-w-md p-4 bg-background/10 rounded-lg border border-border/20">
                    <div className="space-y-2">
                      <div className="h-3 bg-primary/20 rounded w-3/4" />
                      <div className="h-3 bg-muted/20 rounded w-full" />
                      <div className="h-3 bg-muted/20 rounded w-5/6" />
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="h-8 bg-muted/10 rounded" />
                        <div className="h-8 bg-muted/10 rounded" />
                        <div className="h-8 bg-primary/20 rounded" />
                        <div className="h-8 bg-muted/10 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Monitor className="h-12 w-12 text-red-400/50 mx-auto" />
                <p className="text-sm text-red-400">Screen Share Inactive</p>
              </div>
            )}
          </div>

          {/* Webcam Overlay (Bottom Right Corner) */}
          <div className="absolute bottom-3 right-3 w-32 h-24 md:w-48 md:h-36 bg-slate-900 rounded-lg border-2 border-border/50 overflow-hidden shadow-lg">
            {session.webcamActive ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground/70">Webcam Feed</p>
                </div>
                {/* Recording indicator */}
                <div className="absolute top-1 left-1 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] text-red-400 font-medium">REC</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-red-950/30">
                <Camera className="h-6 w-6 text-red-400/50" />
              </div>
            )}
          </div>

          {/* Mobile Camera Badge (if connected) */}
          {session.mobileConnected && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-green-500/20 rounded-md border border-green-500/30">
              <span className="flex items-center gap-1 text-[10px] text-green-400">
                <Smartphone className="h-3 w-3" />
                Mobile Recording
              </span>
            </div>
          )}

          {/* Status Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-md">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-white font-medium">LIVE</span>
            </div>
            <div className="px-2 py-1 bg-black/50 rounded-md">
              <span className="text-[10px] text-white">
                Q{session.currentQuestion}/{session.totalQuestions}
              </span>
            </div>
            <div className="px-2 py-1 bg-black/50 rounded-md">
              <span className="text-[10px] text-white">
                {Math.floor(session.timeRemaining / 60)}:{(session.timeRemaining % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {session.activityLog.length > 0 && (
          <div className="mt-2 p-2 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Recent Activity:</p>
            <div className="flex flex-wrap gap-1">
              {session.activityLog.slice(-3).map((log, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">
                  {log.action}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
