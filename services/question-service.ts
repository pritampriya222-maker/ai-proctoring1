import type { Question } from "@/types"
import { sampleQuestions } from "@/data/questions"

/**
 * Question Service
 * Manages question loading and dynamic updates
 *
 * In Phase 2, questions are loaded from a local JSON source.
 * The service supports polling for updates and can be extended
 * to fetch from an API in Phase 3.
 *
 * Why polling is used:
 * - Simpler than WebSockets for Phase 2
 * - Works without additional infrastructure
 * - Can detect mid-exam question updates
 * - Fallback-friendly if connection is lost
 */

// Simulated question bank that can be "updated" dynamically
let questionBank: Question[] = [...sampleQuestions]

// Version tracking for change detection
let questionVersion = 1

/**
 * Get current questions
 */
export function getQuestions(): Question[] {
  return [...questionBank]
}

/**
 * Get current version number
 */
export function getQuestionVersion(): number {
  return questionVersion
}

/**
 * Check if questions have been updated since a given version
 */
export function hasUpdates(sinceVersion: number): boolean {
  return questionVersion > sinceVersion
}

/**
 * Get only questions that have changed since a version
 */
export function getUpdatedQuestions(sinceVersion: number): Question[] {
  if (questionVersion <= sinceVersion) {
    return []
  }
  return [...questionBank]
}

/**
 * Update a specific question (admin function)
 * This simulates mid-exam updates that students should receive
 */
export function updateQuestion(questionId: string, updates: Partial<Question>): boolean {
  const index = questionBank.findIndex((q) => q.questionId === questionId)
  if (index === -1) return false

  questionBank[index] = {
    ...questionBank[index],
    ...updates,
  }
  questionVersion++

  // Store in localStorage for persistence
  if (typeof window !== "undefined") {
    localStorage.setItem("question_bank", JSON.stringify(questionBank))
    localStorage.setItem("question_version", String(questionVersion))
  }

  return true
}

/**
 * Add a new question to the bank
 */
export function addQuestion(question: Question): void {
  questionBank.push(question)
  questionVersion++

  if (typeof window !== "undefined") {
    localStorage.setItem("question_bank", JSON.stringify(questionBank))
    localStorage.setItem("question_version", String(questionVersion))
  }
}

/**
 * Reset question bank to defaults
 */
export function resetQuestionBank(): void {
  questionBank = [...sampleQuestions]
  questionVersion = 1

  if (typeof window !== "undefined") {
    localStorage.removeItem("question_bank")
    localStorage.removeItem("question_version")
  }
}

/**
 * Initialize question bank from storage
 */
export function initializeQuestionBank(): void {
  if (typeof window === "undefined") return

  const stored = localStorage.getItem("question_bank")
  const version = localStorage.getItem("question_version")

  if (stored && version) {
    try {
      questionBank = JSON.parse(stored)
      questionVersion = Number.parseInt(version, 10)
    } catch {
      // Reset on parse error
      resetQuestionBank()
    }
  }
}
