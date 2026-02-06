import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLoginPage } from '@/pages/AuthLoginPage'
import { AuthRegisterPage } from '@/pages/AuthRegisterPage'
import { LessonPage } from '@/pages/LessonPage'
import { WorldPage } from '@/pages/WorldPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { AIPage } from '@/pages/AIPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ConnectPage } from '@/pages/ConnectPage'
import { LandingPage } from '@/pages/LandingPage'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">{'Загрузка...'} </div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const location = useLocation()
  const hideHeader = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'
    }`}>
      {user && !hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthLoginPage />} />
        <Route path="/register" element={<AuthRegisterPage />} />
        <Route path="/lesson" element={<RequireAuth><LessonPage /></RequireAuth>} />
        <Route path="/world" element={<RequireAuth><WorldPage /></RequireAuth>} />
        <Route path="/library" element={<RequireAuth><LibraryPage /></RequireAuth>} />
        <Route path="/ai" element={<RequireAuth><AIPage /></RequireAuth>} />
        <Route path="/connect" element={<RequireAuth><ConnectPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
