"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StudentSession } from "@/types"
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react"

interface AdminStatsProps {
  sessions: StudentSession[]
}

export function AdminStats({ sessions }: AdminStatsProps) {
  const totalStudents = sessions.length
  const activeStudents = sessions.filter((s) => s.status === "active").length
  const completedStudents = sessions.filter((s) => s.status === "completed").length
  const alertStudents = sessions.filter((s) =>
    s.behaviorFlags.some((f) => f.severity === "critical" || f.severity === "high"),
  ).length

  const stats = [
    {
      title: "Total Sessions",
      value: totalStudents,
      icon: Users,
      description: "Students enrolled",
      color: "text-primary",
    },
    {
      title: "Active Now",
      value: activeStudents,
      icon: Clock,
      description: "Currently taking exam",
      color: "text-green-400",
    },
    {
      title: "Completed",
      value: completedStudents,
      icon: CheckCircle,
      description: "Finished exam",
      color: "text-blue-400",
    },
    {
      title: "With Alerts",
      value: alertStudents,
      icon: AlertTriangle,
      description: "Require attention",
      color: "text-red-400",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
