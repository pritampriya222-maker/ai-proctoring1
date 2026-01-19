"use client"

import { usePairing } from "@/contexts/pairing-context"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, CheckCircle, Wifi, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Pairing Status Component
 * Shows current mobile pairing status and connection health
 */

export function PairingStatus() {
  const { pairingState, isPaired } = usePairing()
  const { deviceId, lastHeartbeat: rawLastHeartbeat, cameraConfirmed } = pairingState

  const lastHeartbeat = rawLastHeartbeat ? new Date(rawLastHeartbeat) : null
  const isConnected = lastHeartbeat ? Date.now() - lastHeartbeat.getTime() < 10000 : false

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  if (!pairingState.isPaired) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No Device Paired</p>
            <p className="text-sm text-muted-foreground">Scan the QR code with your mobile device</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-2", isPaired ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5")}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                isPaired ? "bg-success/20" : "bg-warning/20",
              )}
            >
              <Smartphone className={cn("h-5 w-5", isPaired ? "text-success" : "text-warning")} />
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                Mobile Paired
                {isPaired && <CheckCircle className="h-4 w-4 text-success" />}
              </p>
              <p className="text-xs text-muted-foreground">Device: {deviceId?.slice(-8) || "Unknown"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <Wifi className={cn("h-4 w-4", isConnected ? "text-success" : "text-destructive")} />
            <div>
              <p className="text-xs font-medium">{isConnected ? "Connected" : "Disconnected"}</p>
              {lastHeartbeat && <p className="text-xs text-muted-foreground">{formatTime(lastHeartbeat)}</p>}
            </div>
          </div>

          {/* Camera Status */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <Camera className={cn("h-4 w-4", cameraConfirmed ? "text-success" : "text-warning")} />
            <div>
              <p className="text-xs font-medium">{cameraConfirmed ? "Confirmed" : "Pending"}</p>
              <p className="text-xs text-muted-foreground">Camera Setup</p>
            </div>
          </div>
        </div>

        {!cameraConfirmed && (
          <p className="text-xs text-warning text-center">
            Waiting for camera placement confirmation on mobile device...
          </p>
        )}
      </CardContent>
    </Card>
  )
}
