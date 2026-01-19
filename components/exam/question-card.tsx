"use client"

import type { Question, Answer } from "@/types"
import { useExam } from "@/contexts/exam-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Lock } from "lucide-react"

/**
 * Question Card Component
 * Displays a single MCQ question with options
 * Handles answer selection and visual feedback
 */

interface QuestionCardProps {
  question: Question
  answer: Answer
  questionNumber: number
}

export function QuestionCard({ question, answer, questionNumber }: QuestionCardProps) {
  const { selectAnswer } = useExam()

  const difficultyColors: Record<string, string> = {
    easy: "bg-success/20 text-success border-success/30",
    medium: "bg-warning/20 text-warning border-warning/30",
    hard: "bg-destructive/20 text-destructive border-destructive/30",
  }

  const handleOptionSelect = (optionIndex: number) => {
    if (answer.isLocked) return
    selectAnswer(question.questionId, optionIndex)
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg font-medium leading-relaxed">
            <span className="text-muted-foreground">Q{questionNumber}.</span> {question.question}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn("capitalize", difficultyColors[question.difficulty])}>
              {question.difficulty}
            </Badge>
            {answer.isLocked && (
              <Badge variant="outline" className="bg-muted/50">
                <Lock className="mr-1 h-3 w-3" />
                Locked
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = answer.selectedOption === index

          return (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={answer.isLocked}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isSelected ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border/50 bg-secondary/30",
              )}
            >
              <span className="flex-shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </span>
              <span className="text-sm font-medium text-muted-foreground mr-2">{String.fromCharCode(65 + index)}.</span>
              <span className={cn("flex-1", isSelected && "text-foreground")}>{option}</span>
            </button>
          )
        })}

        <p className="mt-4 text-xs text-muted-foreground">
          Minimum expected time: {question.minimumExpectedTime} seconds
        </p>
      </CardContent>
    </Card>
  )
}
