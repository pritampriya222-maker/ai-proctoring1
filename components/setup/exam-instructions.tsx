"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Eye, Clock, Smartphone, Monitor, Ban } from "lucide-react"

/**
 * Exam Instructions Component
 * Displays important exam rules and proctoring information
 */

export function ExamInstructions() {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Important Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <InstructionItem icon={<Eye className="h-4 w-4" />} text="Your webcam will record throughout the exam" />
          <InstructionItem icon={<Monitor className="h-4 w-4" />} text="Your screen will be recorded and monitored" />
          <InstructionItem
            icon={<Smartphone className="h-4 w-4" />}
            text="Keep your mobile device positioned to capture your side profile"
          />
          <InstructionItem icon={<Clock className="h-4 w-4" />} text="You have 30 minutes to complete all questions" />
          <InstructionItem icon={<Ban className="h-4 w-4" />} text="Do not switch tabs or leave the exam window" />
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-2 font-medium text-sm">What is being recorded:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>- Laptop webcam (your face)</li>
            <li>- Screen activity</li>
            <li>- Mobile camera (side view)</li>
            <li>- Answer timing patterns</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          By starting the exam, you agree to the proctoring terms and conditions.
        </p>
      </CardContent>
    </Card>
  )
}

function InstructionItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  )
}
