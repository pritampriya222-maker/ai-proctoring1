"use client"

import { useExam } from "@/contexts/exam-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle } from "lucide-react"

/**
 * Question Navigator Component
 * Displays navigation buttons for all questions
 * Shows answered/unanswered/flagged status
 */

export function QuestionNavigator() {
  const { examState, navigateToQuestion } = useExam()

  if (!examState) return null

  const { questions, answers, currentQuestionIndex } = examState

  return (
    <div className="rounded-lg border border-border/50 bg-card/80 p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Question Navigator</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((_, index) => {
          const answer = answers[index]
          const isAnswered = answer.selectedOption !== null
          const isCurrent = index === currentQuestionIndex
          const isLocked = answer.isLocked

          return (
            <Button
              key={index}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              onClick={() => navigateToQuestion(index)}
              className={cn(
                "h-10 w-full relative",
                !isCurrent && isAnswered && "border-primary/50 bg-primary/10",
                !isCurrent && isLocked && "border-muted bg-muted/50",
              )}
            >
              {index + 1}
              {isAnswered && !isCurrent && <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-primary" />}
            </Button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-primary" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-3 w-3" />
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  )
}
