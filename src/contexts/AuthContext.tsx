import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

export interface UserData {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  class_id?: string | null
  subject?: string | null
  school?: string | null
  classroom?: string | null
}

export interface AuthContextType {
  user: UserData | null
  token: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
  updateProfile: (data: Partial<Pick<UserData, 'name' | 'subject' | 'school' | 'classroom' | 'class_id'>>) => Promise<{ success: boolean; error?: string }>
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'physics_token'
const USER_KEY = 'physics_user'

import { API_BASE } from '@/lib/api'

const ADMIN_EMAILS = String(import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

function isAdminUser(user: UserData | null) {
  if (!user) return false
  return user.role === 'admin' || ADMIN_EMAILS.includes(user.email.toLowerCase())
}

function formatDetailError(detail: any, fallback: string): string {
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d?.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ')
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail)
  }
  return String(detail)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedToken) setToken(storedToken)
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage:', e)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } finally {
      setLoading(false)
    }
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
        return { success: false, error: formatDetailError(data?.detail, 'Ошибка входа') }
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
      console.error('Login request error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Ошибка сети при подключении к серверу' }
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
        return { success: false, error: formatDetailError(data?.detail, 'Ошибка регистрации') }
      }

      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.access_token)
      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error('Register request error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Ошибка сети при подключении к серверу' }
    }
  }

  const updateProfile = async (updates: Partial<Pick<UserData, 'name' | 'subject' | 'school' | 'classroom' | 'class_id'>>) => {
    if (!user) return { success: false, error: 'Пользователь не авторизован' }

    const updatedUser: UserData = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))

    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        })
      }
      return { success: true }
    } catch (err) {
      console.warn('Backend profile sync failed, saved locally:', err)
      return { success: true }
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user || !token) return { success: false, error: 'Пользователь не авторизован' }
    if (newPassword.length < 6) return { success: false, error: 'Новый пароль должен содержать не менее 6 символов' }

    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: formatDetailError(data?.detail, 'Не удалось сменить пароль') }
      }
      return { success: true }
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Ошибка сети при смене пароля' }
    }
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const isAdmin = isAdminUser(user)
  const value = useMemo(
    () => ({ user, token, loading, signIn, signUp, signOut, updateProfile, changePassword, isAdmin }),
    [user, token, loading, isAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
