"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { ExamState, Question, Answer, QuestionLog, BehaviorFlag, ExamLog } from "@/types"
import { useAuth } from "./auth-context"
import { usePairing } from "./pairing-context"
import { useRecording } from "./recording-context"
import {
  registerSession,
  updateSession as updateRegistrySession,
  addActivityLog,
  completeSession,
} from "@/services/session-registry"

/**
 * Exam Context
 * Manages exam state, questions, answers, and behavior logging
 * Implements dynamic question management and behavior analysis
 */

interface ExamContextType {
  examState: ExamState | null
  examLog: ExamLog | null
  isExamActive: boolean
  initializeExam: (questions: Question[], durationMinutes: number) => void
  selectAnswer: (questionId: string, optionIndex: number) => void
  navigateToQuestion: (index: number) => void
  submitExam: () => void
  updateQuestions: (questions: Question[]) => void
  addBehaviorFlag: (flag: Omit<BehaviorFlag, "timestamp">) => void
  tick: () => void
}

const ExamContext = createContext<ExamContextType | undefined>(undefined)

interface ExamProviderProps {
  children: ReactNode
}

export function ExamProvider({ children }: ExamProviderProps) {
  const { session, student, updateSession } = useAuth()
  const { isPaired, pairingState } = usePairing()
  const { hasWebcamPermission, hasScreenPermission } = useRecording()
  const [examState, setExamState] = useState<ExamState | null>(null)
  const [examLog, setExamLog] = useState<ExamLog | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null)

  useEffect(() => {
    if (!examState || !session || examState.isSubmitted) return

    const hasRecentHeartbeat = pairingState.lastHeartbeat
      ? Date.now() - (pairingState.lastHeartbeat instanceof Date
        ? pairingState.lastHeartbeat.getTime()
        : new Date(pairingState.lastHeartbeat).getTime()) < 10000
      : false

    const interval = setInterval(() => {
      updateRegistrySession(session.sessionId, {
        currentQuestion: examState.currentQuestionIndex + 1,
        answeredCount: examState.answers.filter((a) => a.selectedOption !== null).length,
        webcamActive: hasWebcamPermission,
        screenShareActive: hasScreenPermission,
        mobileConnected: isPaired && hasRecentHeartbeat,
        behaviorFlags: examLog?.behaviorFlags || [],
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [examState, session, isPaired, pairingState, hasWebcamPermission, hasScreenPermission, examLog])

  // Initialize exam with questions and duration
  const initializeExam = useCallback(
    (questions: Question[], durationMinutes: number) => {
      const now = new Date()
      const answers: Answer[] = questions.map((q) => ({
        questionId: q.questionId,
        selectedOption: null,
        timeSpent: 0,
        answeredAt: null,
        isLocked: false,
      }))

      const newExamState: ExamState = {
        questions,
        answers,
        currentQuestionIndex: 0,
        startTime: now,
        endTime: null,
        totalDuration: durationMinutes * 60,
        remainingTime: durationMinutes * 60,
        isSubmitted: false,
      }

      const newExamLog: ExamLog = {
        sessionId: session?.sessionId || "",
        studentId: session?.studentId || "",
        questionLogs: [],
        behaviorFlags: [],
        totalCorrect: 0,
        totalQuestions: questions.length,
        accuracy: 0,
        examDuration: 0,
        startTime: now,
        endTime: null,
      }

      setExamState(newExamState)
      setExamLog(newExamLog)
      setQuestionStartTime(now)

      if (session) {
        updateSession({ status: "active", startTime: now })

        registerSession({
          sessionId: session.sessionId,
          studentId: session.studentId,
          studentName: student?.name || "Unknown",
          examId: "exam-001",
          startTime: now.getTime(),
          totalDuration: durationMinutes * 60,
          totalQuestions: questions.length,
          currentQuestion: 1,
          answeredCount: 0,
          webcamActive: true,
          screenShareActive: true,
          mobileConnected: isPaired,
          behaviorFlags: [],
          activityLog: [{ action: "Started exam", timestamp: now.getTime() }],
        })
      }
    },
    [session, student, updateSession, isPaired],
  )

  // Select an answer for a question
  const selectAnswer = useCallback(
    (questionId: string, optionIndex: number) => {
      setExamState((prev) => {
        if (!prev) return null

        const answerIndex = prev.answers.findIndex((a) => a.questionId === questionId)
        if (answerIndex === -1) return prev

        const answer = prev.answers[answerIndex]
        if (answer.isLocked) return prev

        const newAnswers = [...prev.answers]
        const timeOnQuestion =
          questionStartTime && questionStartTime instanceof Date
            ? Math.floor((Date.now() - questionStartTime.getTime()) / 1000)
            : 0

        newAnswers[answerIndex] = {
          ...answer,
          selectedOption: optionIndex,
          timeSpent: answer.timeSpent + timeOnQuestion,
          answeredAt: new Date(),
        }

        if (session) {
          addActivityLog(session.sessionId, `Answered Q${answerIndex + 1}`)
        }

        return { ...prev, answers: newAnswers }
      })
    },
    [questionStartTime, session],
  )

  // Navigate to a specific question
  const navigateToQuestion = useCallback(
    (index: number) => {
      setExamState((prev) => {
        if (!prev) return null
        if (index < 0 || index >= prev.questions.length) return prev

        const currentAnswer = prev.answers[prev.currentQuestionIndex]
        if (questionStartTime && questionStartTime instanceof Date && !currentAnswer.isLocked) {
          const timeOnQuestion = Math.floor((Date.now() - questionStartTime.getTime()) / 1000)
          const newAnswers = [...prev.answers]
          newAnswers[prev.currentQuestionIndex] = {
            ...currentAnswer,
            timeSpent: currentAnswer.timeSpent + timeOnQuestion,
          }
          setQuestionStartTime(new Date())
          return { ...prev, currentQuestionIndex: index, answers: newAnswers }
        }

        setQuestionStartTime(new Date())
        return { ...prev, currentQuestionIndex: index }
      })
    },
    [questionStartTime],
  )

  // Analyze behavior and generate flags
  const analyzeBehavior = useCallback((examState: ExamState): BehaviorFlag[] => {
    const flags: BehaviorFlag[] = []
    const { questions, answers } = examState

    let fastCorrectHard = 0
    let hardQuestionCorrect = 0
    let totalHard = 0

    questions.forEach((q, index) => {
      const answer = answers[index]
      if (!answer.selectedOption === null) return

      const isCorrect = answer.selectedOption === q.correctAnswer
      const isBelowMinTime = answer.timeSpent < q.minimumExpectedTime

      if (q.difficulty === "hard") {
        totalHard++
        if (isCorrect) {
          hardQuestionCorrect++
          if (isBelowMinTime) {
            fastCorrectHard++
          }
        }
      }

      if (isCorrect && isBelowMinTime && answer.timeSpent < q.minimumExpectedTime * 0.5) {
        flags.push({
          type: "fast_correct",
          description: `Question ${index + 1}: Answered correctly in ${answer.timeSpent}s (min expected: ${q.minimumExpectedTime}s)`,
          timestamp: new Date(),
          severity: q.difficulty === "hard" ? "high" : "medium",
        })
      }
    })

    if (totalHard >= 3 && hardQuestionCorrect / totalHard > 0.8) {
      flags.push({
        type: "high_accuracy_hard",
        description: `High accuracy on hard questions: ${hardQuestionCorrect}/${totalHard} correct`,
        timestamp: new Date(),
        severity: "medium",
      })
    }

    if (fastCorrectHard >= 2) {
      flags.push({
        type: "suspicious_pattern",
        description: `${fastCorrectHard} hard questions answered correctly below minimum time`,
        timestamp: new Date(),
        severity: "high",
      })
    }

    return flags
  }, [])

  // Submit the exam
  const submitExam = useCallback(() => {
    setExamState((prev) => {
      if (!prev || prev.isSubmitted) return prev

      const endTime = new Date()
      const startTimeMs = prev.startTime && prev.startTime instanceof Date ? prev.startTime.getTime() : 0
      const examDuration = Math.floor((endTime.getTime() - startTimeMs) / 1000)

      let totalCorrect = 0
      const questionLogs: QuestionLog[] = prev.questions.map((q, index) => {
        const answer = prev.answers[index]
        const isCorrect = answer.selectedOption === q.correctAnswer
        if (isCorrect) totalCorrect++

        return {
          questionId: q.questionId,
          difficulty: q.difficulty,
          timeSpent: answer.timeSpent,
          isCorrect,
          answeredBelowMinTime: answer.timeSpent < q.minimumExpectedTime,
          timestamp: answer.answeredAt || endTime,
        }
      })

      const behaviorFlags = analyzeBehavior(prev)

      setExamLog((log) => {
        if (!log) return null
        return {
          ...log,
          questionLogs,
          behaviorFlags: [...log.behaviorFlags, ...behaviorFlags],
          totalCorrect,
          accuracy: (totalCorrect / prev.questions.length) * 100,
          examDuration,
          endTime,
        }
      })

      if (session) {
        updateSession({
          status: behaviorFlags.some((f) => f.severity === "high") ? "flagged" : "completed",
          endTime,
        })

        completeSession(session.sessionId)
        addActivityLog(session.sessionId, "Completed exam")
      }

      return {
        ...prev,
        endTime,
        isSubmitted: true,
        remainingTime: 0,
      }
    })
  }, [analyzeBehavior, session, updateSession])

  // Update questions dynamically
  const updateQuestions = useCallback((newQuestions: Question[]) => {
    setExamState((prev) => {
      if (!prev) return null

      const updatedQuestions = prev.questions.map((existingQ) => {
        const answer = prev.answers.find((a) => a.questionId === existingQ.questionId)
        if (answer?.isLocked) return existingQ

        const newQ = newQuestions.find((q) => q.questionId === existingQ.questionId)
        return newQ || existingQ
      })

      return { ...prev, questions: updatedQuestions }
    })
  }, [])

  // Add a behavior flag manually
  const addBehaviorFlag = useCallback((flag: Omit<BehaviorFlag, "timestamp">) => {
    setExamLog((prev) => {
      if (!prev) return null
      return {
        ...prev,
        behaviorFlags: [...prev.behaviorFlags, { ...flag, timestamp: new Date() }],
      }
    })
  }, [])

  // Timer tick
  const tick = useCallback(() => {
    setExamState((prev) => {
      if (!prev || prev.isSubmitted || prev.remainingTime <= 0) return prev

      const newRemainingTime = prev.remainingTime - 1

      if (newRemainingTime <= 0) {
        submitExam()
        return { ...prev, remainingTime: 0 }
      }

      return { ...prev, remainingTime: newRemainingTime }
    })
  }, [submitExam])

  const value: ExamContextType = {
    examState,
    examLog,
    isExamActive: !!examState && !examState.isSubmitted,
    initializeExam,
    selectAnswer,
    navigateToQuestion,
    submitExam,
    updateQuestions,
    addBehaviorFlag,
    tick,
  }

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
}

export function useExam(): ExamContextType {
  const context = useContext(ExamContext)
  if (context === undefined) {
    throw new Error("useExam must be used within an ExamProvider")
  }
  return context
}
