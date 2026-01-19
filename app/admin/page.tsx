"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { LiveMonitorGrid } from "@/components/admin/live-monitor-grid"
import { SessionDetailModal } from "@/components/admin/session-detail-modal"
import { QuestionEditor } from "@/components/admin/question-editor"
import { StudentManager } from "@/components/admin/student-manager"
import { LiveVideoViewer } from "@/components/admin/live-video-viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getActiveSessions, toStudentSession } from "@/services/session-registry"
import type { StudentSession } from "@/types"
import { LayoutDashboard, FileQuestion, Activity, Users } from "lucide-react"

export default function AdminDashboard() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<StudentSession[]>([])
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [watchingSession, setWatchingSession] = useState<StudentSession | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }
    if (user?.role !== "admin") {
      router.push("/exam/setup")
    }
  }, [isAuthenticated, user, router])

  // REAL-TIME SESSION MONITORING VIA SOCKET
  useEffect(() => {
    import("@/lib/socket-client").then(({ socket }) => {
      if (!socket.connected) socket.connect()

      socket.emit('admin-join')

      const updateSessionsList = (backendSessions: any[]) => {
        // Convert backend session data to UI format
        // Assuming backend structure matches ActiveSessionData
        const mapped = backendSessions.map(toStudentSession)
        setSessions(mapped)

        // Update watching session details if needed
        setWatchingSession(prev => {
          if (!prev) return null
          const updated = mapped.find(s => s.sessionId === prev.sessionId)
          return updated || prev
        })
      }

      // Initial State
      socket.on('init-state', (data: { sessions: any[] }) => {
        updateSessionsList(data.sessions)
      })

      // Individual Updates (Optimized: update single item in array)
      socket.on('session-updated', (updatedSession: any) => {
        setSessions(prev => {
          const idx = prev.findIndex(s => s.sessionId === updatedSession.sessionId)
          const mapped = toStudentSession(updatedSession)
          if (idx === -1) return [...prev, mapped]

          const newSessions = [...prev]
          newSessions[idx] = mapped

          // Update watching session details if needed
          setWatchingSession(w => {
            if (w?.sessionId === mapped.sessionId) return mapped
            return w
          })

          return newSessions
        })
      })

      socket.on('student-added', (newSession: any) => {
        setSessions(prev => {
          if (prev.find(s => s.sessionId === newSession.sessionId)) return prev
          return [...prev, toStudentSession(newSession)]
        })
      })

      return () => {
        socket.off('init-state')
        socket.off('session-updated')
        socket.off('student-added')
      }
    })
  }, [])

  const handleViewDetails = (session: StudentSession) => {
    setSelectedSession(session)
    setDetailModalOpen(true)
  }

  const handleWatchLive = useCallback((session: StudentSession) => {
    setWatchingSession(session)
  }, [])

  const handleTerminate = (sessionId: string) => {
    import("@/lib/socket-client").then(({ socket }) => {
      socket.emit('admin-terminate', { sessionId, reason: 'Terminated by Admin' })
    })
    // Optimistic update
    setSessions(prev => prev.map(s => s.sessionId === sessionId ? { ...s, status: 'terminated' } : s))
  }

  const handleWarn = async (sessionId: string, message: string) => {
    import("@/lib/socket-client").then(({ socket }) => {
      socket.emit('admin-warning', { sessionId, message })
    })
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container py-6 space-y-6">
        {watchingSession && (
          <LiveVideoViewer
            session={watchingSession}
            onClose={() => setWatchingSession(null)}
            onWarn={handleWarn}
          />
        )}

        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList>
            <TabsTrigger value="monitor" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Live Monitor
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <FileQuestion className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-6">
            <AdminStats sessions={sessions} />
            <LiveMonitorGrid
              sessions={sessions}
              onViewDetails={handleViewDetails}
              onTerminate={handleTerminate}
              onWatchLive={handleWatchLive}
              onWarn={handleWarn}
            />
          </TabsContent>

          <TabsContent value="students">
            <StudentManager />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionEditor />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="rounded-lg border border-border p-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed exam analytics and behavior reports will be available here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <SessionDetailModal
        session={selectedSession}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onTerminate={handleTerminate}
      />
    </div>
  )
}
