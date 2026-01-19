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
export async function registerSession(data: Omit<ActiveSessionData, "lastUpdate">): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', data })
    })
  } catch (e) {
    console.error("Failed to register session", e)
  }
}

// Update session status
export async function updateSession(
  sessionId: string,
  updates: Partial<Omit<ActiveSessionData, "sessionId" | "studentId" | "studentName">>,
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', sessionId, data: updates })
    })
  } catch (e) {
    console.error("Failed to update session", e)
  }
}

// Add activity log entry
export async function addActivityLog(sessionId: string, action: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log_activity', sessionId, data: { action } })
    })
  } catch (e) {
    console.error("Failed to log activity", e)
  }
}

// Add behavior flag
export async function addBehaviorFlag(sessionId: string, flag: BehaviorFlag): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_flag', sessionId, data: { flag } })
    })
  } catch (e) {
    console.error("Failed to add flag", e)
  }
}

// Complete session
export async function completeSession(sessionId: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', sessionId })
    })
  } catch (e) {
    console.error("Failed to complete session", e)
  }
}

// Remove session
export async function removeSession(sessionId: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', sessionId })
    })
  } catch (e) {
    console.error("Failed to remove session", e)
  }
}

// Get all active sessions
export async function getActiveSessions(): Promise<ActiveSessionData[]> {
  try {
    const res = await fetch('/api/admin/sessions', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch sessions", e);
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
