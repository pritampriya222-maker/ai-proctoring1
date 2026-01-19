import type { BehaviorFlag, QuestionLog, Question, Answer } from "@/types"

/**
 * Behavior Analyzer Service
 * Analyzes exam behavior patterns and generates flags
 *
 * This is flagging, NOT cheating detection.
 * Flags indicate patterns that may warrant review, not definitive cheating.
 *
 * Analysis criteria:
 * - Fast correct answers on hard questions
 * - High accuracy on difficult questions
 * - Suspicious timing patterns
 * - Face tracking anomalies (when integrated)
 */

interface AnalysisResult {
  flags: BehaviorFlag[]
  integrityScore: number // 0-100, higher is better
  recommendation: "pass" | "review" | "investigate"
}

/**
 * Analyze a complete exam session
 */
export function analyzeExamSession(
  questions: Question[],
  answers: Answer[],
  questionLogs: QuestionLog[],
  existingFlags: BehaviorFlag[] = [],
): AnalysisResult {
  const flags: BehaviorFlag[] = [...existingFlags]
  let penaltyPoints = 0

  // 1. Analyze timing patterns
  const timingFlags = analyzeTimingPatterns(questions, answers)
  flags.push(...timingFlags)
  penaltyPoints += timingFlags.length * 5

  // 2. Analyze accuracy patterns
  const accuracyFlags = analyzeAccuracyPatterns(questions, answers, questionLogs)
  flags.push(...accuracyFlags)
  penaltyPoints += accuracyFlags.filter((f) => f.severity === "high").length * 15
  penaltyPoints += accuracyFlags.filter((f) => f.severity === "medium").length * 8
  penaltyPoints += accuracyFlags.filter((f) => f.severity === "low").length * 3

  // 3. Analyze answer sequence
  const sequenceFlags = analyzeAnswerSequence(questions, answers)
  flags.push(...sequenceFlags)
  penaltyPoints += sequenceFlags.length * 10

  // Calculate integrity score (100 - penalties, minimum 0)
  const integrityScore = Math.max(0, 100 - penaltyPoints)

  // Determine recommendation
  let recommendation: "pass" | "review" | "investigate" = "pass"
  if (integrityScore < 50 || flags.some((f) => f.severity === "high")) {
    recommendation = "investigate"
  } else if (integrityScore < 75 || flags.length > 3) {
    recommendation = "review"
  }

  return {
    flags,
    integrityScore,
    recommendation,
  }
}

/**
 * Analyze timing patterns for suspicious behavior
 */
function analyzeTimingPatterns(questions: Question[], answers: Answer[]): BehaviorFlag[] {
  const flags: BehaviorFlag[] = []

  // Count fast answers by difficulty
  let fastEasy = 0
  let fastMedium = 0
  let fastHard = 0

  questions.forEach((q, index) => {
    const answer = answers[index]
    if (answer.selectedOption === null) return

    const isCorrect = answer.selectedOption === q.correctAnswer
    const isBelowMin = answer.timeSpent < q.minimumExpectedTime
    const isVeryFast = answer.timeSpent < q.minimumExpectedTime * 0.5

    if (isCorrect && isBelowMin) {
      if (q.difficulty === "easy") fastEasy++
      if (q.difficulty === "medium") fastMedium++
      if (q.difficulty === "hard") fastHard++
    }

    // Individual very fast correct answers
    if (isCorrect && isVeryFast && q.difficulty !== "easy") {
      flags.push({
        type: "fast_correct",
        description: `Q${index + 1} (${q.difficulty}): Answered correctly in ${answer.timeSpent}s (expected min: ${q.minimumExpectedTime}s)`,
        timestamp: new Date(),
        severity: q.difficulty === "hard" ? "high" : "medium",
      })
    }
  })

  // Pattern: Multiple fast hard answers
  if (fastHard >= 2) {
    flags.push({
      type: "suspicious_pattern",
      description: `${fastHard} hard questions answered correctly below minimum expected time`,
      timestamp: new Date(),
      severity: "high",
    })
  }

  // Pattern: Many fast medium answers
  if (fastMedium >= 3) {
    flags.push({
      type: "suspicious_pattern",
      description: `${fastMedium} medium questions answered correctly below minimum expected time`,
      timestamp: new Date(),
      severity: "medium",
    })
  }

  return flags
}

/**
 * Analyze accuracy patterns for suspicious behavior
 */
function analyzeAccuracyPatterns(
  questions: Question[],
  answers: Answer[],
  questionLogs: QuestionLog[],
): BehaviorFlag[] {
  const flags: BehaviorFlag[] = []

  // Count correct answers by difficulty
  const stats = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  }

  questions.forEach((q, index) => {
    const answer = answers[index]
    if (answer.selectedOption === null) return

    stats[q.difficulty].total++
    if (answer.selectedOption === q.correctAnswer) {
      stats[q.difficulty].correct++
    }
  })

  // Flag: Very high accuracy on hard questions
  if (stats.hard.total >= 3) {
    const hardAccuracy = stats.hard.correct / stats.hard.total
    if (hardAccuracy > 0.8) {
      flags.push({
        type: "high_accuracy_hard",
        description: `${stats.hard.correct}/${stats.hard.total} (${(hardAccuracy * 100).toFixed(0)}%) hard questions answered correctly`,
        timestamp: new Date(),
        severity: hardAccuracy === 1 ? "high" : "medium",
      })
    }
  }

  // Flag: Inverted difficulty pattern (better on hard than easy)
  if (stats.easy.total >= 2 && stats.hard.total >= 2) {
    const easyAccuracy = stats.easy.correct / stats.easy.total
    const hardAccuracy = stats.hard.correct / stats.hard.total

    if (hardAccuracy > easyAccuracy + 0.2) {
      flags.push({
        type: "suspicious_pattern",
        description: `Unusual pattern: Higher accuracy on hard (${(hardAccuracy * 100).toFixed(0)}%) than easy (${(easyAccuracy * 100).toFixed(0)}%) questions`,
        timestamp: new Date(),
        severity: "medium",
      })
    }
  }

  return flags
}

/**
 * Analyze answer sequence for patterns
 */
function analyzeAnswerSequence(questions: Question[], answers: Answer[]): BehaviorFlag[] {
  const flags: BehaviorFlag[] = []

  // Check for streaks of correct answers on consecutive hard questions
  let hardStreak = 0
  let maxHardStreak = 0

  questions.forEach((q, index) => {
    const answer = answers[index]
    if (q.difficulty === "hard" && answer.selectedOption === q.correctAnswer) {
      hardStreak++
      maxHardStreak = Math.max(maxHardStreak, hardStreak)
    } else if (q.difficulty === "hard") {
      hardStreak = 0
    }
  })

  if (maxHardStreak >= 3) {
    flags.push({
      type: "suspicious_pattern",
      description: `${maxHardStreak} consecutive hard questions answered correctly`,
      timestamp: new Date(),
      severity: "medium",
    })
  }

  // Check for unrealistic total exam time
  const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0)
  const expectedMinTime = questions.reduce((sum, q) => sum + q.minimumExpectedTime, 0)

  if (totalTime < expectedMinTime * 0.5) {
    flags.push({
      type: "suspicious_pattern",
      description: `Total time (${totalTime}s) is less than half the expected minimum (${expectedMinTime}s)`,
      timestamp: new Date(),
      severity: "high",
    })
  }

  return flags
}

/**
 * Add a face-related flag
 */
export function createFaceFlag(
  type: "face_absent" | "multiple_faces",
  duration?: number,
  count?: number,
): BehaviorFlag {
  if (type === "face_absent") {
    return {
      type: "face_absent",
      description: `Face not detected for ${duration || 0} seconds`,
      timestamp: new Date(),
      severity: (duration || 0) > 30 ? "high" : (duration || 0) > 10 ? "medium" : "low",
    }
  }

  return {
    type: "multiple_faces",
    description: `Multiple faces detected ${count || 1} times`,
    timestamp: new Date(),
    severity: (count || 1) > 3 ? "high" : "medium",
  }
}
