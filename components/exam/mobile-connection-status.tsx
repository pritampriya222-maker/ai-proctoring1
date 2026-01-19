"use client"

import { usePairing } from "@/contexts/pairing-context"
import { Badge } from "@/components/ui/badge"
import { Smartphone, CheckCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * Mobile Connection Status Component
 * Shows the connection status of the paired mobile device during the exam
 */

export function MobileConnectionStatus() {
  const { pairingState } = usePairing()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkHeartbeat = () => {
      if (!pairingState.isPaired || !pairingState.cameraConfirmed) {
        setIsConnected(false)
        return
      }

      const lastHeartbeat = pairingState.lastHeartbeat
      if (!lastHeartbeat) {
        setIsConnected(false)
        return
      }

      // Handle both Date objects and ISO strings
      const heartbeatTime = lastHeartbeat instanceof Date ? lastHeartbeat.getTime() : new Date(lastHeartbeat).getTime()

      const timeSinceHeartbeat = Date.now() - heartbeatTime
      // Consider connected if heartbeat within last 10 seconds
      setIsConnected(timeSinceHeartbeat < 10000)
    }

    // Check immediately
    checkHeartbeat()

    // Check every 2 seconds
    const interval = setInterval(checkHeartbeat, 2000)

    return () => clearInterval(interval)
  }, [pairingState])

  if (!pairingState.isPaired) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-muted/50 text-muted-foreground border-border">
        <Smartphone className="h-3 w-3" />
        <span>Mobile Not Paired</span>
      </Badge>
    )
  }

  if (!isConnected) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Mobile Reconnecting...</span>
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-400 border-green-500/30">
      <Smartphone className="h-3 w-3" />
      <CheckCircle className="h-3 w-3" />
      <span>Mobile Connected</span>
    </Badge>
  )
}
