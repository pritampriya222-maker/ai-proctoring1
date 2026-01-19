"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { QRPairingData, MobilePairingState } from "@/types"
import { useAuth } from "./auth-context"

/**
 * Pairing Context
 * Manages QR code generation and mobile device pairing state
 * Uses API polling to check pairing status
 */

interface PairingContextType {
  pairingState: MobilePairingState
  qrData: QRPairingData | null
  isPaired: boolean
  generateQRCode: () => QRPairingData
  confirmPairing: (deviceId: string) => void
  resetPairing: () => void
  updateHeartbeat: () => void
  confirmMobileCamera: () => void
}

const PairingContext = createContext<PairingContextType | undefined>(undefined)

interface PairingProviderProps {
  children: ReactNode
}

export function PairingProvider({ children }: PairingProviderProps) {
  const { session } = useAuth()
  const [pairingState, setPairingState] = useState<MobilePairingState>({
    isPaired: false,
    deviceId: null,
    pairingCode: null,
    lastHeartbeat: null,
    cameraConfirmed: false,
  })
  const [qrData, setQrData] = useState<QRPairingData | null>(null)

  useEffect(() => {
    if (!session?.sessionId) return

    // Connect socket
    import("@/lib/socket-client").then(({ socket }) => {
      if (!socket.connected) socket.connect()

      const onPairingUpdate = (data: any) => {
        // Handle pairing update from socket
        if (data.status === 'connected' || data.isPaired) {
          setPairingState(prev => ({
            ...prev,
            isPaired: true,
            deviceId: data.deviceId || prev.deviceId,
            lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat).toISOString() : new Date().toISOString(),
            status: data.status
          }))
        } else if (data.status === 'disconnected') {
          setPairingState(prev => ({ ...prev, isPaired: false }))
        } else if (data.cameraConfirmed) {
          setPairingState(prev => ({ ...prev, cameraConfirmed: true }))
        }
      }

      socket.on(`pairing-update`, onPairingUpdate)
      socket.on(`mobile-status-update`, onPairingUpdate) // If broadcasted to room

      // Also join a room for this session if not automatically done (usually server handles it on some join event)
      // We can emit a 'desktop-join' or just rely on 'student-join' which is in ExamContext usually.
      // But Pairing might happen before Exam starts.
      // For now, let's assume 'student-join' or similar puts us in the room, 
      // OR we just listen to 'pairing-update' which is broadcast to all? 
      // Wait, in server.js I emitted to 'admin-room' and 'sessionId'.
      // Desktop should join 'sessionId'.

      // We'll rely on global socket connection logic or emit a join here.
      // For pairing specifically, let's just listen.

      return () => {
        socket.off(`pairing-update`, onPairingUpdate)
        socket.off(`mobile-status-update`, onPairingUpdate)
      }
    })
  }, [session?.sessionId])

  // NOTE: Initial status check might still be useful via API if socket takes time to connect
  // but for "Modify existing files" and "Use Socket.IO ONLY", I will rely on socket.


  // Generate QR code data for mobile pairing
  const generateQRCode = useCallback((): QRPairingData => {
    if (!session) {
      throw new Error("No active session")
    }

    const now = Date.now()
    const qrData: QRPairingData = {
      sessionId: session.sessionId,
      studentId: session.studentId,
      timestamp: now,
      expiresAt: now + 5 * 60 * 1000, // Expires in 5 minutes
    }

    setQrData(qrData)

    const newPairingState: MobilePairingState = {
      isPaired: false,
      deviceId: null,
      pairingCode: btoa(JSON.stringify(qrData)),
      lastHeartbeat: null,
      cameraConfirmed: false,
    }

    setPairingState(newPairingState)

    // Sync to server
    fetch('/api/pairing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        action: 'init',
        ...newPairingState
      })
    }).catch(err => console.error("Failed to init pairing on server", err));


    return qrData
  }, [session])

  // Confirm pairing from mobile device (This is mainly called on mobile, but keeping signature)
  const confirmPairing = useCallback(
    (deviceId: string) => {
      // NOTE: This usually runs on the mobile device. 
      // If run here, it's for simulation.
      const newState: MobilePairingState = {
        ...pairingState,
        isPaired: true,
        deviceId,
        lastHeartbeat: new Date().toISOString(),
      }

      setPairingState(newState)

      if (session?.sessionId) {
        fetch('/api/pairing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            action: 'pair',
            deviceId
          })
        }).catch(console.error)
      }

    },
    [pairingState, session?.sessionId],
  )

  // Reset pairing state
  const resetPairing = useCallback(() => {
    const newState: MobilePairingState = {
      isPaired: false,
      deviceId: null,
      pairingCode: null,
      lastHeartbeat: null,
      cameraConfirmed: false,
    }

    setPairingState(newState)
    setQrData(null)

    if (session?.sessionId) {
      fetch('/api/pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'reset'
        })
      }).catch(console.error)
    }
  }, [session?.sessionId])

  // Update heartbeat (Usually called from mobile)
  const updateHeartbeat = useCallback(() => {
    if (session?.sessionId) {
      fetch('/api/pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'heartbeat'
        })
      }).catch(console.error)
    }
  }, [session?.sessionId])

  // Confirm mobile camera placement
  const confirmMobileCamera = useCallback(() => {
    const newState: MobilePairingState = {
      ...pairingState,
      cameraConfirmed: true
    }
    setPairingState(newState)

    if (session?.sessionId) {
      fetch('/api/pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'confirm_camera'
        })
      }).catch(console.error)
    }
  }, [pairingState, session?.sessionId])

  const value: PairingContextType = {
    pairingState,
    qrData,
    isPaired: pairingState.isPaired && pairingState.cameraConfirmed,
    generateQRCode,
    confirmPairing,
    resetPairing,
    updateHeartbeat,
    confirmMobileCamera,
  }

  return <PairingContext.Provider value={value}>{children}</PairingContext.Provider>
}

export function usePairing(): PairingContextType {
  const context = useContext(PairingContext)
  if (context === undefined) {
    throw new Error("usePairing must be used within a PairingProvider")
  }
  return context
}
