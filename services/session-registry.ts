/**
 * Session Registry Service
 * Manages active exam sessions in localStorage for admin monitoring
 * In production, this would be a real-time database
 */

import type { StudentSession, BehaviorFlag } from "@/types"

const ACTIVE_SESSIONS_KEY = "proctor_active_sessions"

export interface ActiveSessionData {
  sessionId: string
  studentId: string
  studentName: string
  examId: string
  startTime: number
  totalDuration: number
  totalQuestions: number
  currentQuestion: number
  answeredCount: number
  webcamActive: boolean
  screenShareActive: boolean
  mobileConnected: boolean
  behaviorFlags: BehaviorFlag[]
  activityLog: { action: string; timestamp: number }[]
  lastUpdate: number
}

// Register a new session when exam starts
export function registerSession(data: Omit<ActiveSessionData, "lastUpdate">): void {
  const sessions = getActiveSessions()
  const existingIndex = sessions.findIndex((s) => s.sessionId === data.sessionId)

  const sessionData: ActiveSessionData = {
    ...data,
    lastUpdate: Date.now(),
  }

  if (existingIndex >= 0) {
    sessions[existingIndex] = sessionData
  } else {
    sessions.push(sessionData)
  }

  localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions))
}

// Update session status
export function updateSession(
  sessionId: string,
  updates: Partial<Omit<ActiveSessionData, "sessionId" | "studentId" | "studentName">>,
): void {
  const sessions = getActiveSessions()
  const index = sessions.findIndex((s) => s.sessionId === sessionId)

  if (index >= 0) {
    sessions[index] = {
      ...sessions[index],
      ...updates,
      lastUpdate: Date.now(),
    }
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions))
  }
}

// Add activity log entry
export function addActivityLog(sessionId: string, action: string): void {
  const sessions = getActiveSessions()
  const index = sessions.findIndex((s) => s.sessionId === sessionId)

  if (index >= 0) {
    sessions[index].activityLog.push({ action, timestamp: Date.now() })
    sessions[index].lastUpdate = Date.now()
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions))
  }
}

// Add behavior flag
export function addBehaviorFlag(sessionId: string, flag: BehaviorFlag): void {
  const sessions = getActiveSessions()
  const index = sessions.findIndex((s) => s.sessionId === sessionId)

  if (index >= 0) {
    sessions[index].behaviorFlags.push(flag)
    sessions[index].lastUpdate = Date.now()
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions))
  }
}

// Complete session
export function completeSession(sessionId: string): void {
  const sessions = getActiveSessions()
  const index = sessions.findIndex((s) => s.sessionId === sessionId)

  if (index >= 0) {
    sessions[index].webcamActive = false
    sessions[index].screenShareActive = false
    sessions[index].mobileConnected = false
    sessions[index].lastUpdate = Date.now()
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions))
  }
}

// Remove session
export function removeSession(sessionId: string): void {
  const sessions = getActiveSessions().filter((s) => s.sessionId !== sessionId)
  localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions))
}

// Get all active sessions
export function getActiveSessions(): ActiveSessionData[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(ACTIVE_SESSIONS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return []
}

// Convert to StudentSession format for admin display
export function toStudentSession(data: ActiveSessionData): StudentSession {
  const elapsed = Math.floor((Date.now() - data.startTime) / 1000)
  const timeRemaining = Math.max(0, data.totalDuration - elapsed)

  // Check if session is stale (no update in 30 seconds)
  const isStale = Date.now() - data.lastUpdate > 30000

  return {
    sessionId: data.sessionId,
    examId: data.examId,
    studentId: data.studentId,
    studentName: data.studentName,
    status: isStale ? "terminated" : timeRemaining > 0 ? "active" : "completed",
    startTime: data.startTime,
    timeRemaining,
    currentQuestion: data.currentQuestion,
    answeredCount: data.answeredCount,
    totalQuestions: data.totalQuestions,
    webcamActive: !isStale && data.webcamActive,
    screenShareActive: !isStale && data.screenShareActive,
    mobileConnected: !isStale && data.mobileConnected,
    behaviorFlags: data.behaviorFlags,
    activityLog: data.activityLog,
  }
}
