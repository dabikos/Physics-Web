import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Users, Copy, RefreshCw, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const API_BASE = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8003`

interface Session {
  id: string
  code: string
  class_id?: string | null
  created_at: string
  expires_at: string
  active: boolean
}

interface Student {
  id: string
  name: string
  email: string
  class_id?: string | null
}

export function ConnectPage() {
  const { token } = useAuth()
  const { theme } = useTheme()
  const [classes, setClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsMap, setResultsMap] = useState<Record<string, { score: number; correct: number; total: number }>>({})
  const [summary, setSummary] = useState<{ count: number; average: number } | null>(null)
  const isDark = theme === 'dark'
  const textPrimary = isDark ? 'text-white' : 'text-slate-900'
  const textMuted = isDark ? 'text-slate-300' : 'text-slate-600'
  const textMutedStrong = isDark ? 'text-slate-400' : 'text-slate-500'
  const cardBg = isDark ? 'bg-slate-900/70' : 'bg-white/95'
  const cardBorder = isDark ? 'border-white/10' : 'border-slate-200'
  const cardShadow = isDark ? 'shadow-black/30' : 'shadow-slate-200/60'
  const controlBg = isDark ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-700 border-slate-300'
  const controlHover = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
  const listItemBg = isDark ? 'bg-slate-800/70' : 'bg-slate-100'
  const summaryBg = isDark ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  const timeLeft = useMemo(() => {
    if (!session?.expires_at) return ''
    const expires = new Date(session.expires_at).getTime()
    const now = Date.now()
    const diff = Math.max(0, Math.floor((expires - now) / 1000))
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes} мин ${seconds.toString().padStart(2, '0')} сек`
  }, [session?.expires_at])

  const loadClasses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/teacher/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setClasses(data?.classes || [])
      }
    } catch {
      // ignore
    }
  }

  const loadResults = async (sessionId?: string | null) => {
    if (!sessionId) return
    try {
      const response = await fetch(`${API_BASE}/api/teacher/pairing-sessions/${sessionId}/results`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        const map: Record<string, { score: number; correct: number; total: number }> = {}
        ;(data?.results || []).forEach((item: any) => {
          map[item.student_id] = { score: item.score, correct: item.correct, total: item.total }
        })
        setResultsMap(map)
        setSummary(data?.summary || null)
      }
    } catch {
      // ignore
    }
  }

  const loadActiveSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/teacher/pairing-sessions/active`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setSession(data.session)
        setStudents(data.students || [])
        loadResults(data.session?.id)
      }
    } catch {
      // ignore
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/teacher/pairing-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ class_id: selectedClass || null })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.detail || 'Ошибка создания кода')
      } else {
        setSession(data)
        setStudents([])
        setResultsMap({})
        setSummary(null)
      }
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    if (!session) return
    setLoading(true)
    try {
      await fetch(`${API_BASE}/api/teacher/pairing-sessions/${session.id}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      setSession(null)
      setStudents([])
      setResultsMap({})
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!session?.code) return
    await navigator.clipboard.writeText(session.code)
  }

  useEffect(() => {
    loadClasses()
    loadActiveSession()
    const interval = setInterval(loadActiveSession, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!session?.code) {
      setQrUrl(null)
      return
    }
    QRCode.toDataURL(session.code, { width: 240, margin: 2 }).then(setQrUrl).catch(() => setQrUrl(null))
  }, [session?.code])

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-28 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
          <QrCode size={24} />
        </div>
        <div>
          <h1 className={`text-3xl font-semibold ${textPrimary}`}>Подключение учеников</h1>
          <p className={textMuted}>Сгенерируйте PIN или QR и попросите учеников подключиться из приложения.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="space-y-6">
          <div className={`rounded-3xl border ${cardBorder} ${cardBg} p-6 shadow-xl ${cardShadow}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className={`text-xl font-semibold ${textPrimary}`}>Код подключения</h2>
                <p className={`text-sm ${textMutedStrong}`}>Создайте новый код и передайте его классу.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  className={`px-4 py-2 rounded-xl border ${controlBg}`}
                >
                  <option value="">Все классы</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold shadow-lg shadow-primary-600/30 disabled:opacity-60"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  Сгенерировать
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-300 text-sm">{error}</div>
            )}

            <div className="mt-6 grid md:grid-cols-[1fr_220px] gap-6 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`text-4xl font-bold tracking-[0.4em] ${textPrimary}`}>
                    {session?.code || '------'}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${controlBg} ${controlHover}`}
                  >
                    <Copy size={16} />
                    Копировать
                  </button>
                </div>
                <div className={`text-sm ${textMutedStrong}`}>
                  {session ? `Класс: ${session.class_id || 'Все'} • Осталось: ${timeLeft}` : 'Код не создан'}
                </div>
                {session && (
                  <button
                    onClick={handleClose}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${controlBg} ${controlHover}`}
                  >
                    <XCircle size={16} />
                    Остановить код
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center">
                <div className={`w-56 h-56 rounded-2xl ${listItemBg} flex items-center justify-center`}>
                  {qrUrl ? <img src={qrUrl} alt="QR" className="w-52 h-52" /> : <span className="text-slate-400">QR</span>}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border ${cardBorder} ${cardBg} p-6 shadow-xl ${cardShadow}`}>
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-primary-500" size={22} />
              <h3 className={`text-lg font-semibold ${textPrimary}`}>Подключённые ученики</h3>
            </div>
            {students.length === 0 ? (
              <div className={textMutedStrong}>Пока никто не подключился.</div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className={`flex items-center justify-between rounded-2xl ${listItemBg} px-4 py-3`}>
                    <div>
                      <div className={`${textPrimary} font-semibold`}>{student.name}</div>
                      <div className={`text-sm ${textMutedStrong}`}>{student.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${textMuted}`}>{student.class_id || '-'}</div>
                      {resultsMap[student.id] ? (
                        <div className="text-xs text-emerald-500 dark:text-emerald-300">
                          {resultsMap[student.id].score}% ({resultsMap[student.id].correct}/{resultsMap[student.id].total})
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {summary ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm flex items-center justify-between ${summaryBg}`}>
              <span>Результаты теста</span>
              <span>Средний: {summary.average}% • Всего: {summary.count}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-gradient-to-br from-primary-600 to-accent-500 p-6 text-white shadow-xl shadow-primary-600/40">
            <h3 className="text-xl font-semibold mb-2">Инструкция для ученика</h3>
            <ol className="space-y-2 text-sm text-white/90">
              <li>1. Откройте приложение и выберите «Подключение».</li>
              <li>2. Введите PIN или сканируйте QR.</li>
              <li>3. Учитель увидит вас в списке подключённых.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
