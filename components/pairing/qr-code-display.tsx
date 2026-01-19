"use client"

import { useEffect, useState, useRef } from "react"
import type { QRPairingData } from "@/types"
import { Card } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * QR Code Display Component
 * Generates and displays QR code for mobile pairing
 * Using proper QR code generation with qrcode library
 */

interface QRCodeDisplayProps {
  data: QRPairingData | null
  onRefresh: () => void
  size?: number
}

export function QRCodeDisplay({ data, onRefresh, size = 250 }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (data) {
      setIsExpired(false)
    }
  }, [data])

  // Generate QR code when data changes
  useEffect(() => {
    if (!data) {
      setQrDataUrl(null)
      return
    }

    const generateQR = async () => {
      setIsGenerating(true)
      try {
        // Create the pairing URL that mobile will scan
        const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
        const pairingUrl = `${baseUrl}/mobile/pair?code=${data.sessionId}&student=${data.studentId}&ts=${data.timestamp}`

        console.log("[v0] Generating QR for URL:", pairingUrl)

        const qrCodeDataUrl = await generateQRCodeCanvas(pairingUrl, size)
        setQrDataUrl(qrCodeDataUrl)
      } catch (error) {
        console.error("[v0] Failed to generate QR code:", error)
      }
      setIsGenerating(false)
    }

    generateQR()

    // Check expiration
    const checkExpiration = () => {
      const remaining = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000))
      setTimeRemaining(remaining)
      if (data.expiresAt < Date.now()) {
        setIsExpired(true)
      }
    }

    checkExpiration()
    const interval = setInterval(checkExpiration, 1000)
    return () => clearInterval(interval)
  }, [data, size])

  const generateQRCodeCanvas = async (text: string, size: number): Promise<string> => {
    // Dynamically import the qrcode library
    const QRCode = (await import("qrcode")).default

    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size

    await QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })

    return canvas.toDataURL("image/png")
  }

  const handleRefresh = () => {
    setIsExpired(false)
    setQrDataUrl(null)
    onRefresh()
  }

  if (isExpired) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 bg-muted/50" style={{ width: size, height: size }}>
        <p className="text-sm text-muted-foreground mb-4 text-center">QR Code Expired</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate New
        </Button>
      </Card>
    )
  }

  if (isGenerating || !qrDataUrl) {
    return (
      <Card className="flex items-center justify-center bg-white" style={{ width: size, height: size }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  return (
    <div className="relative">
      <div className="rounded-lg overflow-hidden bg-white p-4">
        <img
          src={qrDataUrl || "/placeholder.svg"}
          alt="QR Code for mobile pairing"
          width={size}
          height={size}
          style={{ display: "block" }}
        />
      </div>
      {data && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-muted-foreground">
            Expires in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </p>
        </div>
      )}
    </div>
  )
}
