import type React from "react"
import { AdminLoginForm } from "@/components/admin-login-form"
import { ShieldCheck, Users, Monitor, Activity } from "lucide-react"

/**
 * Admin Login Page
 * Separate entry point for administrators
 */

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">AI Proctor</h1>
          <p className="mt-3 text-lg text-muted-foreground">Administrator Portal</p>
        </div>

        {/* Admin Login Form */}
        <AdminLoginForm />

        {/* Admin Features */}
        <div className="mt-12 grid max-w-2xl grid-cols-2 gap-4 px-4 sm:grid-cols-4">
          <FeatureItem icon={<Monitor className="h-5 w-5" />} label="Live Monitoring" />
          <FeatureItem icon={<Users className="h-5 w-5" />} label="Student Management" />
          <FeatureItem icon={<Activity className="h-5 w-5" />} label="Behavior Analysis" />
          <FeatureItem icon={<ShieldCheck className="h-5 w-5" />} label="Session Control" />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Proctored Examination System v1.0</p>
          <p className="mt-1">Administrator Dashboard</p>
        </footer>
      </div>
    </main>
  )
}

function FeatureItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-card/50 p-4 text-center">
      <div className="text-orange-500">{icon}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
