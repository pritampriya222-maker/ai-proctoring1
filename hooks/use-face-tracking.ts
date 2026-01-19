"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import type { FaceDetection, FaceTrackingLog } from "@/types"

/**
 * Face Tracking Hook
 * Uses TensorFlow.js face detection for post-exam analysis
 * Draws bounding boxes around detected faces
 *
 * Note: In Phase 2, this runs locally without real-time alerts.
 * The face tracking data is logged and embedded in the final video.
 */

interface UseFaceTrackingOptions {
  videoElement: HTMLVideoElement | null
  canvasElement: HTMLCanvasElement | null
  enabled: boolean
  onFaceDetected?: (detection: FaceDetection) => void
}

interface UseFaceTrackingReturn {
  isTracking: boolean
  lastDetection: FaceDetection | null
  trackingLog: FaceTrackingLog
  startTracking: () => void
  stopTracking: () => void
}

// Simple face detection using canvas analysis (no external dependencies)
// This is a simplified implementation for Phase 2
// In Phase 3, this would use TensorFlow.js or face-api.js

export function useFaceTracking({
  videoElement,
  canvasElement,
  enabled,
  onFaceDetected,
}: UseFaceTrackingOptions): UseFaceTrackingReturn {
  const [isTracking, setIsTracking] = useState(false)
  const [lastDetection, setLastDetection] = useState<FaceDetection | null>(null)
  const [trackingLog, setTrackingLog] = useState<FaceTrackingLog>({
    totalAbsences: 0,
    absenceDurations: [],
    multipleFaceDetections: 0,
    averageConfidence: 0,
  })

  const animationFrameRef = useRef<number | null>(null)
  const lastFacePresentRef = useRef<boolean>(true)
  const absenceStartRef = useRef<number | null>(null)
  const confidenceHistoryRef = useRef<number[]>([])

  // Simple skin tone detection for face presence estimation
  const detectFace = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number): FaceDetection => {
    // Get image data from the center region (where face is expected)
    const centerX = Math.floor(width * 0.25)
    const centerY = Math.floor(height * 0.15)
    const regionWidth = Math.floor(width * 0.5)
    const regionHeight = Math.floor(height * 0.6)

    const imageData = ctx.getImageData(centerX, centerY, regionWidth, regionHeight)
    const data = imageData.data

    let skinPixels = 0
    let totalPixels = 0

    // Check for skin-tone colored pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      totalPixels++

      // Simple skin tone detection (works for various skin tones)
      const isSkin =
        r > 60 &&
        r < 255 &&
        g > 40 &&
        g < 230 &&
        b > 20 &&
        b < 200 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 15 &&
        r - b > 15

      if (isSkin) {
        skinPixels++
      }
    }

    const skinRatio = skinPixels / totalPixels
    const isPresent = skinRatio > 0.15 // At least 15% skin-tone pixels
    const confidence = Math.min(skinRatio * 3, 1) // Scale to 0-1

    return {
      isPresent,
      boundingBox: isPresent
        ? {
            x: centerX,
            y: centerY,
            width: regionWidth,
            height: regionHeight,
          }
        : null,
      confidence,
      timestamp: new Date(),
    }
  }, [])

  // Draw detection result on canvas
  const drawDetection = useCallback(
    (ctx: CanvasRenderingContext2D, detection: FaceDetection, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height)

      if (detection.isPresent && detection.boundingBox) {
        const { x, y, width: bw, height: bh } = detection.boundingBox

        // Draw bounding box
        ctx.strokeStyle = detection.confidence > 0.5 ? "#22c55e" : "#eab308"
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, bw, bh)

        // Draw confidence label
        ctx.fillStyle = detection.confidence > 0.5 ? "#22c55e" : "#eab308"
        ctx.font = "14px sans-serif"
        ctx.fillText(`Face: ${(detection.confidence * 100).toFixed(0)}%`, x, y - 8)
      } else {
        // Draw "No Face Detected" warning
        ctx.fillStyle = "#ef4444"
        ctx.font = "16px sans-serif"
        ctx.fillText("No Face Detected", width / 2 - 70, height / 2)
      }
    },
    [],
  )

  // Main tracking loop
  const trackFrame = useCallback(() => {
    if (!videoElement || !canvasElement || !enabled) return

    const ctx = canvasElement.getContext("2d")
    if (!ctx) return

    // Match canvas size to video
    if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
      canvasElement.width = videoElement.videoWidth || 640
      canvasElement.height = videoElement.videoHeight || 480
    }

    // Draw video frame to canvas for analysis
    ctx.drawImage(videoElement, 0, 0)

    // Detect face
    const detection = detectFace(ctx, canvasElement.width, canvasElement.height)
    setLastDetection(detection)

    // Draw detection overlay
    drawDetection(ctx, detection, canvasElement.width, canvasElement.height)

    // Update tracking log
    confidenceHistoryRef.current.push(detection.confidence)
    if (confidenceHistoryRef.current.length > 100) {
      confidenceHistoryRef.current.shift()
    }

    // Track face absence
    if (!detection.isPresent && lastFacePresentRef.current) {
      // Face just disappeared
      absenceStartRef.current = Date.now()
      setTrackingLog((prev) => ({
        ...prev,
        totalAbsences: prev.totalAbsences + 1,
      }))
    } else if (detection.isPresent && !lastFacePresentRef.current && absenceStartRef.current) {
      // Face just reappeared
      const absenceDuration = (Date.now() - absenceStartRef.current) / 1000
      setTrackingLog((prev) => ({
        ...prev,
        absenceDurations: [...prev.absenceDurations, absenceDuration],
      }))
      absenceStartRef.current = null
    }

    lastFacePresentRef.current = detection.isPresent

    // Update average confidence
    const avgConfidence =
      confidenceHistoryRef.current.reduce((a, b) => a + b, 0) / confidenceHistoryRef.current.length || 0
    setTrackingLog((prev) => ({
      ...prev,
      averageConfidence: avgConfidence,
    }))

    // Callback
    if (onFaceDetected) {
      onFaceDetected(detection)
    }

    // Continue tracking
    animationFrameRef.current = requestAnimationFrame(trackFrame)
  }, [videoElement, canvasElement, enabled, detectFace, drawDetection, onFaceDetected])

  const startTracking = useCallback(() => {
    if (isTracking) return
    setIsTracking(true)
    animationFrameRef.current = requestAnimationFrame(trackFrame)
  }, [isTracking, trackFrame])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    isTracking,
    lastDetection,
    trackingLog,
    startTracking,
    stopTracking,
  }
}
