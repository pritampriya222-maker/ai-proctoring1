"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Student, Session } from "@/types"

interface User {
  id: string
  name: string
  email: string
  role: "student" | "admin"
  studentId?: string
}

interface AuthContextType {
  student: Student | null
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userId: string, password: string) => Promise<boolean>
  adminLogin: (username: string, password: string) => Promise<boolean>
  logout: () => void
  updateSession: (updates: Partial<Session>) => void
  addStudent: (studentId: string, name: string, email: string, password: string) => boolean
  removeStudent: (studentId: string) => boolean
  getStudents: () => Array<{ studentId: string; name: string; email: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

const ADMIN_CREDENTIALS = {
  admin: {
    password: "admin123",
    user: {
      id: "admin_1",
      name: "System Administrator",
      email: "admin@university.edu",
      role: "admin" as const,
    },
  },
}

const INITIAL_STUDENTS: Record<string, { password: string; student: Student }> = {
  STU001: {
    password: "password123",
    student: {
      id: "1",
      name: "John Doe",
      email: "john.doe@university.edu",
      studentId: "STU001",
    },
  },
  STU002: {
    password: "password123",
    student: {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@university.edu",
      studentId: "STU002",
    },
  },
  STU003: {
    password: "password123",
    student: {
      id: "3",
      name: "Bob Wilson",
      email: "bob.wilson@university.edu",
      studentId: "STU003",
    },
  },
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Record<string, { password: string; student: Student }>>(INITIAL_STUDENTS)

  useEffect(() => {
    const storedStudents = localStorage.getItem("proctor_students")
    if (storedStudents) {
      try {
        const parsed = JSON.parse(storedStudents)
        setStudents({ ...INITIAL_STUDENTS, ...parsed })
      } catch (error) {
        console.error("Failed to parse stored students:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Only save non-initial students
    const customStudents: Record<string, { password: string; student: Student }> = {}
    Object.entries(students).forEach(([key, value]) => {
      if (!INITIAL_STUDENTS[key]) {
        customStudents[key] = value
      }
    })
    if (Object.keys(customStudents).length > 0) {
      localStorage.setItem("proctor_students", JSON.stringify(customStudents))
    }
  }, [students])

  useEffect(() => {
    const storedSession = sessionStorage.getItem("proctor_session")
    const storedStudent = sessionStorage.getItem("proctor_student")
    const storedUser = sessionStorage.getItem("proctor_user")

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to restore user:", error)
        sessionStorage.removeItem("proctor_user")
      }
    }

    if (storedSession && storedStudent) {
      try {
        const parsedSession = JSON.parse(storedSession)
        const parsedStudent = JSON.parse(storedStudent)

        if (parsedSession.startTime) parsedSession.startTime = new Date(parsedSession.startTime)
        if (parsedSession.endTime) parsedSession.endTime = new Date(parsedSession.endTime)
        if (parsedSession.pairingTimestamp) parsedSession.pairingTimestamp = new Date(parsedSession.pairingTimestamp)

        setSession(parsedSession)
        setStudent(parsedStudent)
      } catch (error) {
        console.error("Failed to restore session:", error)
        sessionStorage.removeItem("proctor_session")
        sessionStorage.removeItem("proctor_student")
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (session) {
      sessionStorage.setItem("proctor_session", JSON.stringify(session))
    }
    if (student) {
      sessionStorage.setItem("proctor_student", JSON.stringify(student))
    }
    if (user) {
      sessionStorage.setItem("proctor_user", JSON.stringify(user))
    }
  }, [session, student, user])

  const login = useCallback(async (studentId: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Get current students including any added via localStorage
    const storedStudents = localStorage.getItem("proctor_students")
    let allStudents = { ...INITIAL_STUDENTS }
    if (storedStudents) {
      try {
        allStudents = { ...allStudents, ...JSON.parse(storedStudents) }
      } catch {}
    }

    const userData = allStudents[studentId.toUpperCase()]

    if (userData && userData.password === password) {
      const newSession: Session = {
        sessionId: generateSessionId(),
        studentId: userData.student.studentId,
        studentName: userData.student.name,
        startTime: null,
        endTime: null,
        status: "pending",
        mobilePaired: false,
        mobileDeviceId: null,
        pairingTimestamp: null,
      }

      const studentUser: User = {
        id: userData.student.id,
        name: userData.student.name,
        email: userData.student.email,
        role: "student",
        studentId: userData.student.studentId,
      }

      setStudent(userData.student)
      setUser(studentUser)
      setSession(newSession)
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }, [])

  const adminLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const adminData = ADMIN_CREDENTIALS[username.toLowerCase() as keyof typeof ADMIN_CREDENTIALS]

    if (adminData && adminData.password === password) {
      setUser(adminData.user)
      setStudent(null)
      setSession(null)
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }, [])

  const logout = useCallback(() => {
    setStudent(null)
    setUser(null)
    setSession(null)
    sessionStorage.removeItem("proctor_session")
    sessionStorage.removeItem("proctor_student")
    sessionStorage.removeItem("proctor_user")
  }, [])

  const updateSession = useCallback((updates: Partial<Session>) => {
    setSession((prev) => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
  }, [])

  const addStudent = useCallback(
    (studentId: string, name: string, email: string, password: string): boolean => {
      const normalizedId = studentId.toUpperCase()

      // Check if student already exists
      if (students[normalizedId]) {
        return false
      }

      const newStudent: Student = {
        id: `student_${Date.now()}`,
        name,
        email,
        studentId: normalizedId,
      }

      setStudents((prev) => ({
        ...prev,
        [normalizedId]: {
          password,
          student: newStudent,
        },
      }))

      return true
    },
    [students],
  )

  const removeStudent = useCallback(
    (studentId: string): boolean => {
      const normalizedId = studentId.toUpperCase()

      if (!students[normalizedId]) {
        return false
      }

      setStudents((prev) => {
        const updated = { ...prev }
        delete updated[normalizedId]
        return updated
      })

      // Also remove from localStorage
      const storedStudents = localStorage.getItem("proctor_students")
      if (storedStudents) {
        try {
          const parsed = JSON.parse(storedStudents)
          delete parsed[normalizedId]
          localStorage.setItem("proctor_students", JSON.stringify(parsed))
        } catch {}
      }

      return true
    },
    [students],
  )

  const getStudents = useCallback(() => {
    return Object.entries(students).map(([id, data]) => ({
      studentId: id,
      name: data.student.name,
      email: data.student.email,
    }))
  }, [students])

  const value: AuthContextType = {
    student,
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    adminLogin,
    logout,
    updateSession,
    addStudent,
    removeStudent,
    getStudents,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
