"use client"

import { useState } from "react"
import { useExam } from "@/contexts/exam-context"
import { useRecording } from "@/contexts/recording-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Send, AlertTriangle, CheckCircle } from "lucide-react"

/**
 * Submit Dialog Component
 * Confirmation dialog before submitting the exam
 * Shows unanswered questions warning and handles recording stop
 */

interface SubmitDialogProps {
  onSubmitComplete: () => void
}

export function SubmitDialog({ onSubmitComplete }: SubmitDialogProps) {
  const { examState, submitExam } = useExam()
  const { stopRecording, isRecording } = useRecording()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!examState) return null

  const unansweredCount = examState.answers.filter((a) => a.selectedOption === null).length
  const answeredCount = examState.answers.length - unansweredCount

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Stop recording and get the video blob
    if (isRecording) {
      const videoBlob = await stopRecording()

      if (videoBlob) {
        // Trigger download of the recorded video
        const url = URL.createObjectURL(videoBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `exam_recording_${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }

    // Submit the exam
    submitExam()
    setIsSubmitting(false)
    onSubmitComplete()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Send className="h-4 w-4" />
          Submit Exam
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Confirm Submission
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Are you sure you want to submit your exam? This action cannot be undone.</p>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Questions Answered</span>
                <span className="font-medium text-foreground">
                  {answeredCount} / {examState.answers.length}
                </span>
              </div>

              {unansweredCount > 0 && (
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{unansweredCount} questions are unanswered</span>
                </div>
              )}

              {unansweredCount === 0 && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">All questions answered</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Your recording will be saved and downloaded automatically upon submission.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Exam
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
