"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Monitor, Hand, User, Smartphone } from "lucide-react"

/**
 * Placement Guide Component
 * Shows visual guide for proper phone positioning during proctoring
 */

export function PlacementGuide() {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Phone Placement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Position your phone at a 45-degree angle to capture:</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-3 text-center">
            <Monitor className="h-6 w-6 text-primary" />
            <span className="text-xs">Laptop Screen</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-3 text-center">
            <Hand className="h-6 w-6 text-primary" />
            <span className="text-xs">Both Hands</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-3 text-center">
            <User className="h-6 w-6 text-primary" />
            <span className="text-xs">Side Profile</span>
          </div>
        </div>

        {/* Visual diagram */}
        <div className="relative h-32 rounded-lg bg-muted/30 overflow-hidden">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* Desk */}
            <rect x="20" y="70" width="160" height="10" fill="currentColor" className="text-muted-foreground/30" />

            {/* Laptop */}
            <rect
              x="60"
              y="40"
              width="50"
              height="30"
              rx="2"
              fill="currentColor"
              className="text-muted-foreground/50"
            />
            <rect x="55" y="70" width="60" height="5" rx="1" fill="currentColor" className="text-muted-foreground/50" />

            {/* Person (simplified) */}
            <circle cx="85" cy="25" r="8" fill="currentColor" className="text-primary/50" />
            <rect x="80" y="35" width="10" height="15" rx="2" fill="currentColor" className="text-primary/50" />

            {/* Hands */}
            <circle cx="65" cy="55" r="4" fill="currentColor" className="text-primary/30" />
            <circle cx="105" cy="55" r="4" fill="currentColor" className="text-primary/30" />

            {/* Phone position */}
            <rect
              x="140"
              y="30"
              width="8"
              height="40"
              rx="1"
              fill="currentColor"
              className="text-success"
              transform="rotate(30 144 50)"
            />

            {/* Camera view angle */}
            <path
              d="M145 35 L60 25 L60 70 L145 55 Z"
              fill="currentColor"
              className="text-success/10"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4"
            />
          </svg>
        </div>

        <ul className="text-xs text-muted-foreground space-y-1">
          <li>- Keep the phone stationary during the exam</li>
          <li>- Ensure good lighting conditions</li>
          <li>- Phone must remain charged throughout</li>
        </ul>
      </CardContent>
    </Card>
  )
}
