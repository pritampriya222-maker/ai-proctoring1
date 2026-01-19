"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Permission Card Component
 * Displays permission status and request button for camera/screen
 */

interface PermissionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  isGranted: boolean
  isLoading: boolean
  onRequest: () => void
  errorMessage?: string
}

export function PermissionCard({
  icon,
  title,
  description,
  isGranted,
  isLoading,
  onRequest,
  errorMessage,
}: PermissionCardProps) {
  return (
    <Card
      className={cn(
        "border-2 transition-all",
        isGranted ? "border-success/50 bg-success/5" : "border-border/50 bg-card/80",
      )}
    >
      <CardContent className="flex items-start gap-4 p-6">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            isGranted ? "bg-success/20 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {isGranted && <CheckCircle className="h-4 w-4 text-success" />}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>

          {errorMessage && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          {!isGranted && (
            <Button onClick={onRequest} disabled={isLoading} variant={isGranted ? "outline" : "default"} size="sm">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                "Grant Permission"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
