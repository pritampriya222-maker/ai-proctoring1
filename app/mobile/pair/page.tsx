"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import type { QRPairingData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, AlertTriangle, Loader2 } from "lucide-react"

/**
 * Mobile Pairing Entry Page
 * Validates QR code data and redirects to proctoring page
 * This is the page that opens when the QR code is scanned
 */

function MobilePairContent() {
  const searchParams = useSearchParams()
  const [pairingData, setPairingData] = useState<QRPairingData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    // Updated to use simpler URL format: ?code=sessionId&student=studentId&ts=timestamp
    const sessionId = searchParams.get("code")
    const studentId = searchParams.get("student")
    const timestamp = searchParams.get("ts")

    // Also support legacy format with base64 encoded data
    const dataParam = searchParams.get("data")

    if (dataParam) {
      // Legacy format
      try {
        const decoded = JSON.parse(atob(dataParam)) as QRPairingData
        if (!decoded.sessionId || !decoded.studentId || !decoded.timestamp || !decoded.expiresAt) {
          throw new Error("Invalid pairing data")
        }
        if (decoded.expiresAt < Date.now()) {
          setError("This QR code has expired. Please generate a new one on your laptop.")
          setIsValidating(false)
          return
        }
        setPairingData(decoded)
        setIsValidating(false)
        return
      } catch {
        setError("Failed to parse pairing data. Please scan the QR code again.")
        setIsValidating(false)
        return
      }
    }

    if (!sessionId || !studentId || !timestamp) {
      setError("Invalid pairing link. Please scan the QR code again.")
      setIsValidating(false)
      return
    }

    try {
      const ts = Number.parseInt(timestamp, 10)
      const expiresAt = ts + 5 * 60 * 1000 // 5 minutes from creation

      // Check if expired
      if (expiresAt < Date.now()) {
        setError("This QR code has expired. Please generate a new one on your laptop.")
        setIsValidating(false)
        return
      }

      const data: QRPairingData = {
        sessionId,
        studentId,
        timestamp: ts,
        expiresAt,
      }

      setPairingData(data)
      setIsValidating(false)
    } catch {
      setError("Failed to parse pairing data. Please scan the QR code again.")
      setIsValidating(false)
    }
  }, [searchParams])

  const handleContinue = () => {
    if (!pairingData) return

    // Store pairing data and redirect to proctoring page
    sessionStorage.setItem("mobile_pairing_data", JSON.stringify(pairingData))
    window.location.href = `/mobile/proctor?session=${pairingData.sessionId}`
  }

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating pairing code...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Pairing Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-muted-foreground">
              Please return to your laptop and generate a new QR code, then scan it again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Mobile Proctoring</CardTitle>
          <CardDescription>Your device is ready to be paired for exam proctoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pairingData && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono">{pairingData.sessionId.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Student ID:</span>
                <span className="font-mono">{pairingData.studentId}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">By continuing, you will:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Grant camera access for proctoring</li>
              <li>Record video during the exam</li>
              <li>Keep your phone positioned for side monitoring</li>
            </ul>
          </div>

          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue to Camera Setup
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Make sure you&apos;re using a stable internet connection
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MobilePairPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <MobilePairContent />
    </Suspense>
  )
}
