"use client"

import { useState } from "react"
import { StudentSessionCard } from "./student-session-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StudentSession } from "@/types"
import { Search, Users } from "lucide-react"

interface LiveMonitorGridProps {
  sessions: StudentSession[]
  onViewDetails: (session: StudentSession) => void
  onTerminate: (sessionId: string) => void
  onWarn?: (sessionId: string, message: string) => void
  onWatchLive?: (session: StudentSession) => void
}

export function LiveMonitorGrid({ sessions, onViewDetails, onTerminate, onWatchLive, onWarn }: LiveMonitorGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [alertFilter, setAlertFilter] = useState<string>("all")

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.studentId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || session.status === statusFilter

    const hasAlerts = session.behaviorFlags.some((f) => f.severity === "critical" || f.severity === "high")
    const matchesAlert =
      alertFilter === "all" || (alertFilter === "alerts" && hasAlerts) || (alertFilter === "clean" && !hasAlerts)

    return matchesSearch && matchesStatus && matchesAlert
  })

  const activeCount = sessions.filter((s) => s.status === "active").length
  const alertCount = sessions.filter((s) =>
    s.behaviorFlags.some((f) => f.severity === "critical" || f.severity === "high"),
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium text-primary">{activeCount}</span>
              <span className="text-muted-foreground"> active sessions</span>
            </span>
          </div>
          {alertCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400">{alertCount} with alerts</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={alertFilter} onValueChange={setAlertFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Alerts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="alerts">With Alerts</SelectItem>
            <SelectItem value="clean">No Alerts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {sessions.length === 0 ? "No active exam sessions" : "No sessions found matching your filters"}
          </p>
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground/70 mt-1">Sessions will appear here when students start exams</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSessions.map((session) => (
            <StudentSessionCard
              key={session.sessionId}
              session={session}
              onViewDetails={onViewDetails}
              onTerminate={onTerminate}
              onWatchLive={onWatchLive}
              onWarn={onWarn}
            />
          ))}
        </div>
      )}
    </div>
  )
}
