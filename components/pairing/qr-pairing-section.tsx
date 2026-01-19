"use client"

import { useState, useEffect } from "react"
import { usePairing } from "@/contexts/pairing-context"
import { QRCodeDisplay } from "./qr-code-display"
import { PairingStatus } from "./pairing-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, RefreshCw, Smartphone, CheckCircle2 } from "lucide-react"

/**
 * QR Pairing Section Component
 * Main component for the QR code pairing flow
 * Displays QR code generation and pairing status
 *
 * Why QR pairing is enforced:
 * - Ensures dual-device proctoring is active
 * - Provides additional monitoring angle (side view)
 * - Captures hands and workspace
 * - Increases exam integrity
 */

export function QRPairingSection() {
  const { qrData, isPaired, pairingState, generateQRCode, resetPairing } = usePairing()
  const [hasGenerated, setHasGenerated] = useState(false)

  // Auto-generate QR code on first render
  useEffect(() => {
    if (!hasGenerated && !isPaired) {
      handleGenerate()
      setHasGenerated(true)
    }
  }, [hasGenerated, isPaired])

  const handleGenerate = () => {
    generateQRCode()
  }

  const handleReset = () => {
    resetPairing()
    handleGenerate()
  }

  if (isPaired) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            Mobile Device Paired
          </CardTitle>
          <CardDescription>Your mobile device is connected and ready for side-proctoring</CardDescription>
        </CardHeader>
        <CardContent>
          <PairingStatus />
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleReset} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Pair Different Device
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Pair Mobile Device
        </CardTitle>
        <CardDescription>
          Scan this QR code with your smartphone to enable side-proctoring. This step is mandatory before starting the
          exam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <QRCodeDisplay data={qrData} onRefresh={handleGenerate} size={200} />
            <Button onClick={handleGenerate} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate QR
            </Button>
          </div>

          {/* Instructions */}
          <div className="flex-1 space-y-4">
            <h4 className="font-medium">Instructions:</h4>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  1
                </span>
                <span>Open your phone&apos;s camera app or QR scanner</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  2
                </span>
                <span>Point it at the QR code displayed on your laptop screen</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  3
                </span>
                <span>Open the link and grant camera permissions on your phone</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  4
                </span>
                <span>Position your phone to capture your side profile, hands, and laptop screen</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  5
                </span>
                <span>Confirm the camera placement on your phone</span>
              </li>
            </ol>

            {/* Mobile placement guide */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Phone Placement Guide</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Position your phone at a 45-degree angle to your left or right side. The camera should capture:
              </p>
              <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>Your laptop screen</li>
                <li>Both of your hands</li>
                <li>Your side profile</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pairing Status */}
        {pairingState.isPaired && !pairingState.cameraConfirmed && <PairingStatus />}
      </CardContent>
    </Card>
  )
}
