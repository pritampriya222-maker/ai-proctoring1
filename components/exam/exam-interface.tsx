"use client"

import { useExam } from "@/contexts/exam-context"
import { ExamHeader } from "./exam-header"
import { QuestionCard } from "./question-card"
import { QuestionNavigator } from "./question-navigator"
import { WebcamPreview } from "./webcam-preview"
import { SubmitDialog } from "./submit-dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AdminWarningToast } from "./admin-warning-toast"

/**
 * Exam Interface Component
 * Main exam taking interface with question display, navigation, and controls
 */

interface ExamInterfaceProps {
  onExamComplete: () => void
}

export function ExamInterface({ onExamComplete }: ExamInterfaceProps) {
  const { examState, navigateToQuestion, adminMessage, clearAdminMessage } = useExam()

  if (!examState) return null

  const { questions, answers, currentQuestionIndex } = examState
  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestionIndex]

  const canGoBack = currentQuestionIndex > 0
  const canGoForward = currentQuestionIndex < questions.length - 1

  return (
    <div className="min-h-screen bg-background">
      <ExamHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Question Card */}
            <QuestionCard question={currentQuestion} answer={currentAnswer} questionNumber={currentQuestionIndex + 1} />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                disabled={!canGoBack}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>

              {canGoForward ? (
                <Button onClick={() => navigateToQuestion(currentQuestionIndex + 1)} className="gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <SubmitDialog onSubmitComplete={onExamComplete} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Webcam Preview */}
            <div className="sticky top-24">
              <WebcamPreview size="lg" className="w-full aspect-video" />
              <p className="mt-2 text-center text-xs text-muted-foreground">Live webcam preview</p>
            </div>

            {/* Question Navigator */}
            <QuestionNavigator />
          </div>
        </div>
      </main>

      <AdminWarningToast
        message={adminMessage || null}
        onClose={clearAdminMessage || (() => { })}
      />
    </div>
  )
}
