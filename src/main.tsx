import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { LessonProvider } from '@/contexts/LessonContext'
import './index.css'
import App from './App'
import { initAnalytics } from '@/lib/analytics'

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <ThemeProvider>
        <LessonProvider>
          <App />
        </LessonProvider>
      </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
