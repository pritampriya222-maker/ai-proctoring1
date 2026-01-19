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

  useEffect(() => {
    const loadSessions = async () => {
      const activeSessions = await getActiveSessions()
      const studentSessions = activeSessions.map(toStudentSession)
      setSessions(studentSessions)

      // Update watching session if it exists
      if (watchingSession) {
        const updated = studentSessions.find((s) => s.sessionId === watchingSession.sessionId)
        if (updated) {
          setWatchingSession(updated)
        }
      }
    }

    loadSessions()
    const interval = setInterval(loadSessions, 2000)

    return () => clearInterval(interval)
  }, [watchingSession])

  const handleViewDetails = (session: StudentSession) => {
    setSelectedSession(session)
    setDetailModalOpen(true)
  }

  const handleWatchLive = useCallback((session: StudentSession) => {
    setWatchingSession(session)
  }, [])

  const handleTerminate = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.sessionId === sessionId
          ? {
            ...session,
            status: "terminated",
            webcamActive: false,
            screenShareActive: false,
            mobileConnected: false,
            activityLog: [...session.activityLog, { action: "Session terminated by proctor", timestamp: Date.now() }],
          }
          : session,
      ),
    )
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container py-6 space-y-6">
        {watchingSession && <LiveVideoViewer session={watchingSession} onClose={() => setWatchingSession(null)} />}

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
