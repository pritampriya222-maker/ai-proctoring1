"use client"

import { usePairing } from "@/contexts/pairing-context"
import { useRecording } from "@/contexts/recording-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Circle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Setup Checklist Component
 * Shows progress of all required setup steps before exam can start
 */

interface ChecklistItem {
  id: string
  label: string
  isComplete: boolean
  isRequired: boolean
}

export function SetupChecklist() {
  const { hasWebcamPermission, hasScreenPermission } = useRecording()
  const { isPaired } = usePairing()

  const items: ChecklistItem[] = [
    {
      id: "webcam",
      label: "Webcam permission granted",
      isComplete: hasWebcamPermission,
      isRequired: true,
    },
    {
      id: "screen",
      label: "Screen sharing enabled",
      isComplete: hasScreenPermission,
      isRequired: true,
    },
    {
      id: "mobile",
      label: "Mobile device paired",
      isComplete: isPaired,
      isRequired: true,
    },
  ]

  const completedCount = items.filter((item) => item.isComplete).length
  const allComplete = items.every((item) => !item.isRequired || item.isComplete)

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Setup Checklist</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.isComplete ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : item.isRequired ? (
              <AlertTriangle className="h-5 w-5 text-warning" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={cn("text-sm", item.isComplete ? "text-foreground" : "text-muted-foreground", "flex-1")}>
              {item.label}
            </span>
            {item.isRequired && !item.isComplete && <span className="text-xs text-warning">Required</span>}
          </div>
        ))}

        {!allComplete && (
          <p className="mt-4 text-xs text-muted-foreground">Complete all required steps to start the exam</p>
        )}

        {allComplete && (
          <div className="mt-4 rounded-lg bg-success/10 p-3 text-center text-sm text-success">
            All requirements met! You can start the exam.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
