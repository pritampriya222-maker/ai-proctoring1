"use client"

import { useRef, useState, useCallback } from "react"

/**
 * Mobile Recording Hook
 * Handles mobile camera recording for side-proctoring
 * Records and saves video locally on the mobile device
 */

interface UseMobileRecordingReturn {
  stream: MediaStream | null
  isRecording: boolean
  hasPermission: boolean
  error: string | null
  requestPermission: () => Promise<boolean>
  startRecording: () => void
  stopRecording: () => Promise<Blob | null>
}

export function useMobileRecording(): UseMobileRecordingReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)

      // Request camera with constraints optimized for mobile
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera by default for side view
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })

      setStream(mediaStream)
      setHasPermission(true)
      return true
    } catch (err) {
      console.error("Failed to get camera permission:", err)

      // Try front camera if back camera fails
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        })

        setStream(mediaStream)
        setHasPermission(true)
        return true
      } catch (frontErr) {
        setError("Failed to access camera. Please check your browser permissions.")
        setHasPermission(false)
        return false
      }
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!stream) {
      setError("No camera stream available")
      return
    }

    try {
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000) // Capture in 1-second chunks
      setIsRecording(true)
    } catch (err) {
      console.error("Failed to start recording:", err)
      setError("Failed to start recording")
    }
  }, [stream])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current

      if (!recorder || recorder.state === "inactive") {
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        chunksRef.current = []
        setIsRecording(false)
        resolve(blob)
      }

      recorder.stop()
    })
  }, [])

  return {
    stream,
    isRecording,
    hasPermission,
    error,
    requestPermission,
    startRecording,
    stopRecording,
  }
}
