"use client"

import type { ExamLog, BehaviorFlag } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Target, Flag, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Behavior Log Viewer Component (Admin)
 * Displays detailed behavior analysis and flags for a student
 */

interface BehaviorLogViewerProps {
  examLog: ExamLog | null
  integrityScore?: number
  recommendation?: "pass" | "review" | "investigate"
}

export function BehaviorLogViewer({ examLog, integrityScore = 100, recommendation = "pass" }: BehaviorLogViewerProps) {
  if (!examLog) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
          No exam data available
        </CardContent>
      </Card>
    )
  }

  const recommendationStyles = {
    pass: "bg-success/20 text-success border-success/30",
    review: "bg-warning/20 text-warning border-warning/30",
    investigate: "bg-destructive/20 text-destructive border-destructive/30",
  }

  const severityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/20 text-warning",
    high: "bg-destructive/20 text-destructive",
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Behavior Analysis
          </span>
          <Badge className={recommendationStyles[recommendation]}>{recommendation.toUpperCase()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Integrity Score */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/30">
            <span
              className={cn(
                "text-2xl font-bold",
                integrityScore >= 75 ? "text-success" : integrityScore >= 50 ? "text-warning" : "text-destructive",
              )}
            >
              {integrityScore}
            </span>
          </div>
          <div>
            <p className="font-medium">Integrity Score</p>
            <p className="text-sm text-muted-foreground">Based on behavior pattern analysis</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Target className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-lg font-bold">{examLog.accuracy.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Clock className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-lg font-bold">{Math.floor(examLog.examDuration / 60)}m</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <AlertTriangle className="mx-auto h-5 w-5 text-warning mb-1" />
            <p className="text-lg font-bold">{examLog.behaviorFlags.length}</p>
            <p className="text-xs text-muted-foreground">Flags</p>
          </div>
        </div>

        {/* Behavior Flags */}
        {examLog.behaviorFlags.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Flagged Behaviors
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {examLog.behaviorFlags.map((flag, index) => (
                <FlagItem key={index} flag={flag} severityColors={severityColors} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-success/10 p-4 text-center">
            <Shield className="mx-auto h-6 w-6 text-success mb-2" />
            <p className="text-sm text-success">No suspicious behavior detected</p>
          </div>
        )}

        {/* Question-by-Question Breakdown */}
        {examLog.questionLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Question Analysis</h4>
            <div className="grid grid-cols-5 gap-1">
              {examLog.questionLogs.map((log, index) => (
                <div
                  key={log.questionId}
                  className={cn(
                    "rounded p-2 text-center text-xs",
                    log.isCorrect ? "bg-success/20" : "bg-destructive/20",
                    log.answeredBelowMinTime && "ring-2 ring-warning",
                  )}
                  title={`Q${index + 1}: ${log.timeSpent}s, ${log.difficulty}`}
                >
                  <span className="font-medium">{index + 1}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Green = Correct, Red = Incorrect, Yellow ring = Below minimum time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FlagItem({
  flag,
  severityColors,
}: {
  flag: BehaviorFlag
  severityColors: Record<string, string>
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
      <AlertTriangle
        className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          flag.severity === "high"
            ? "text-destructive"
            : flag.severity === "medium"
              ? "text-warning"
              : "text-muted-foreground",
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium capitalize">{flag.type.replace(/_/g, " ")}</p>
        <p className="text-xs text-muted-foreground truncate">{flag.description}</p>
      </div>
      <Badge className={severityColors[flag.severity]}>{flag.severity}</Badge>
    </div>
  )
}
