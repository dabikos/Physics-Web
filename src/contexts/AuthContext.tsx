import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

interface UserData {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  class_id?: string | null
}

interface AuthContextType {
  user: UserData | null
  token: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'physics_token'
const USER_KEY = 'physics_user'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8003'
const ADMIN_EMAILS = String(import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

function isAdminUser(user: UserData | null) {
  if (!user) return false
  return user.role === 'admin' || ADMIN_EMAILS.includes(user.email.toLowerCase())
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedToken) setToken(storedToken)
    if (storedUser) setUser(JSON.parse(storedUser))
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data?.detail || 'Ошибка входа' }
      }

      if (data.user?.role !== 'teacher' && data.user?.role !== 'admin' && !isAdminUser(data.user)) {
        return { success: false, error: '\u0414\u043e\u0441\u0442\u0443\u043f \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0443\u0447\u0438\u0442\u0435\u043b\u044f' }
      }

      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.access_token)
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Ошибка сети' }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role: 'teacher', class_id: null })
      })
      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data?.detail || 'Ошибка регистрации' }
      }

      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.access_token)
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Ошибка сети' }
    }
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const isAdmin = isAdminUser(user)
  const value = useMemo(() => ({ user, token, loading, signIn, signUp, signOut, isAdmin }), [user, token, loading, isAdmin])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
