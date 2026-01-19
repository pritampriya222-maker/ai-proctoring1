"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Mobile Proctor Error:", error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-destructive/50">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle>Something went wrong</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-center text-muted-foreground">
                        We encountered an unexpected error while setting up the proctoring session.
                    </p>

                    <div className="rounded-md bg-muted p-4 text-xs font-mono break-all text-left overflow-auto max-h-64">
                        <p className="font-bold mb-2">{error.message || "Unknown error occurred"}</p>
                        {error.stack && <pre className="text-[10px] opacity-70 whitespace-pre-wrap">{error.stack}</pre>}
                    </div>

                    <Button onClick={() => reset()} className="w-full gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
