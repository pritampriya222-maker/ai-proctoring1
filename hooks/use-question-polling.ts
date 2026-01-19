"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { Question } from "@/types"
import { getQuestions, getQuestionVersion, hasUpdates, initializeQuestionBank } from "@/services/question-service"

/**
 * Question Polling Hook
 * Periodically checks for question updates during the exam
 *
 * Why polling instead of WebSockets:
 * - Simpler implementation for Phase 2
 * - Works without server infrastructure
 * - Gracefully handles connection issues
 * - Can be easily upgraded to WebSockets in Phase 3
 */

interface UseQuestionPollingOptions {
  enabled: boolean
  interval?: number // in milliseconds
  onUpdate?: (questions: Question[]) => void
}

interface UseQuestionPollingReturn {
  questions: Question[]
  version: number
  lastChecked: Date | null
  isPolling: boolean
  checkNow: () => void
}

export function useQuestionPolling({
  enabled,
  interval = 30000, // Default 30 seconds
  onUpdate,
}: UseQuestionPollingOptions): UseQuestionPollingReturn {
  const [questions, setQuestions] = useState<Question[]>([])
  const [version, setVersion] = useState(0)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const versionRef = useRef(version)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize on mount
  useEffect(() => {
    initializeQuestionBank()
    const initialQuestions = getQuestions()
    const initialVersion = getQuestionVersion()

    setQuestions(initialQuestions)
    setVersion(initialVersion)
    versionRef.current = initialVersion
    setLastChecked(new Date())
  }, [])

  // Check for updates
  const checkForUpdates = useCallback(() => {
    if (!enabled) return

    setIsPolling(true)

    const currentVersion = getQuestionVersion()

    if (hasUpdates(versionRef.current)) {
      const updatedQuestions = getQuestions()
      setQuestions(updatedQuestions)
      setVersion(currentVersion)
      versionRef.current = currentVersion

      if (onUpdate) {
        onUpdate(updatedQuestions)
      }
    }

    setLastChecked(new Date())
    setIsPolling(false)
  }, [enabled, onUpdate])

  // Start polling when enabled
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial check
    checkForUpdates()

    // Set up polling interval
    intervalRef.current = setInterval(checkForUpdates, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, checkForUpdates])

  // Manual check function
  const checkNow = useCallback(() => {
    checkForUpdates()
  }, [checkForUpdates])

  return {
    questions,
    version,
    lastChecked,
    isPolling,
    checkNow,
  }
}
