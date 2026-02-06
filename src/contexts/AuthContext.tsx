import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

interface UserData {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher'
  class_id?: string | null
}

interface AuthContextType {
  user: UserData | null
  token: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'physics_token'
const USER_KEY = 'physics_user'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8003'

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

      if (data.user?.role !== 'teacher') {
        return { success: false, error: 'Доступ только для учителя' }
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

  const value = useMemo(() => ({ user, token, loading, signIn, signUp, signOut }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
