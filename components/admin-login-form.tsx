"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react"

/**
 * Admin Login Form Component
 * Handles administrator authentication with separate credentials
 */

export function AdminLoginForm() {
  const router = useRouter()
  const { adminLogin, isLoading } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim()) {
      setError("Please enter your username")
      return
    }

    if (!password) {
      setError("Please enter your password")
      return
    }

    const success = await adminLogin(username, password)

    if (success) {
      router.push("/admin")
    } else {
      setError("Invalid username or password. Try admin / admin123")
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
          <ShieldCheck className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Sign in to access the proctoring dashboard
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={isLoading}
              className="bg-input/50"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-input/50 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </Button>
        </form>

        <div className="mt-6 rounded-lg bg-muted/30 p-4">
          <p className="text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Demo Credentials:</span>
            <br />
            Username: admin
            <br />
            Password: admin123
          </p>
        </div>

        {/* Link back to student login */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Student Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
