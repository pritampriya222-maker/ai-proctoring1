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

    const checkPairingStatus = async () => {
      try {
        const res = await fetch(`/api/pairing?sessionId=${session.sessionId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.found) {
            setPairingState({
              isPaired: data.isPaired ?? false,
              deviceId: data.deviceId ?? null,
              pairingCode: data.pairingCode ?? null,
              lastHeartbeat: data.lastHeartbeat ?? null,
              cameraConfirmed: data.cameraConfirmed ?? false,
            })
          }
        }
      } catch (error) {
        console.error("Failed to check pairing status:", error)
      }
    }

    // Check immediately and then poll every 2 seconds
    checkPairingStatus()
    const interval = setInterval(checkPairingStatus, 2000)

    return () => clearInterval(interval)
  }, [session?.sessionId])

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
