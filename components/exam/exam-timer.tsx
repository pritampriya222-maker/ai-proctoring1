"use client"

import { useEffect } from "react"
import { useExam } from "@/contexts/exam-context"
import { Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Exam Timer Component
 * Displays remaining time and manages countdown
 * Shows warning when time is running low
 */

export function ExamTimer() {
  const { examState, tick } = useExam()

  // Timer tick every second
  useEffect(() => {
    if (!examState || examState.isSubmitted) return

    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [examState, tick])

  if (!examState) return null

  const { remainingTime } = examState
  const hours = Math.floor(remainingTime / 3600)
  const minutes = Math.floor((remainingTime % 3600) / 60)
  const seconds = remainingTime % 60

  const isLowTime = remainingTime <= 300 // 5 minutes warning
  const isCriticalTime = remainingTime <= 60 // 1 minute critical

  const formatTime = (value: number) => value.toString().padStart(2, "0")

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg",
        isCriticalTime
          ? "bg-destructive/20 text-destructive animate-pulse"
          : isLowTime
            ? "bg-warning/20 text-warning"
            : "bg-card text-foreground",
      )}
    >
      {isLowTime ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
      <span>
        {hours > 0 && `${formatTime(hours)}:`}
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
    </div>
  )
}
