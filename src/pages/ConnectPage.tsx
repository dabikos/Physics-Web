import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Users, Copy, Check, RefreshCw, XCircle, Clock, Sparkles, Smartphone, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

import { API_BASE } from '@/lib/api'

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
  const [copied, setCopied] = useState(false)
  const [resultsMap, setResultsMap] = useState<Record<string, { score: number; correct: number; total: number }>>({})
  const [summary, setSummary] = useState<{ count: number; average: number } | null>(null)
  const isDark = theme === 'dark'

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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    loadClasses()
    loadActiveSession()
    const interval = setInterval(loadActiveSession, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!session?.code) {
      setQrUrl(null)
      return
    }
    QRCode.toDataURL(session.code, { 
      width: 320, 
      margin: 2,
      color: {
        dark: '#0B0F19',
        light: '#FFFFFF'
      }
    }).then(setQrUrl).catch(() => setQrUrl(null))
  }, [session?.code])

  return (
    <div className={`min-h-screen pt-16 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Top bar with breadcrumb & actions */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark
            ? 'quantum-card border-white/[0.08]'
            : 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/50'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-500 to-neon-cyan flex items-center justify-center text-white shadow-md shadow-primary-600/30">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Подключение к классу
                </h1>
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                  isDark
                    ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30'
                    : 'bg-primary-50 text-primary-700 border-primary-200'
                }`}>
                  Режим доски
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Выведите этот экран на проектор или смарт-доску для моментального подключения учеников
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  isDark 
                    ? 'bg-cosmic-800/90 border-white/10 text-white focus:border-primary-400' 
                    : 'bg-white border-slate-300 text-slate-800 focus:border-primary-500 shadow-sm'
                } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
              >
                <option value="">Все классы</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-primary-600/35 hover:shadow-primary-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{session ? 'Обновить код' : 'Создать код'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Main interactive grid */}
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          
          {/* Left: Projector QR & Big Code Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden text-center transition-all ${
              isDark
                ? 'quantum-card border-white/[0.1]'
                : 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/50'
            }`}>
              {/* Subtle background glow */}
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary-600/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-neon-cyan/10 blur-3xl pointer-events-none" />

              {session ? (
                <div className="space-y-6 relative z-10">
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-primary-500">
                      Код доступа для учеников
                    </span>
                    
                    {/* Big PIN Box */}
                    <div className="flex items-center justify-center gap-3">
                      <div className={`text-4xl sm:text-5xl font-black font-mono tracking-[0.2em] pl-3 py-2 px-5 rounded-xl border ${
                        isDark 
                          ? 'bg-cosmic-950/80 border-primary-500/40 text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-100 to-neon-cyan shadow-inner' 
                          : 'bg-slate-50 border-primary-300 text-primary-700 shadow-inner'
                      }`}>
                        {session.code}
                      </div>
                      
                      <button
                        onClick={handleCopy}
                        className={`p-3 rounded-xl border transition-all ${
                          copied
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
                            : isDark
                              ? 'bg-white/[0.05] border-white/10 hover:border-white/20 text-white'
                              : 'bg-slate-100 border-slate-200 hover:bg-slate-200/70 text-slate-700'
                        }`}
                        title="Скопировать код"
                      >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* QR Code Presentation Box */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative p-3 rounded-2xl bg-white shadow-xl shadow-slate-400/20 border-2 border-primary-500/30">
                      {qrUrl ? (
                        <img 
                          src={qrUrl} 
                          alt="QR для подключения" 
                          className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400">
                          <RefreshCw size={28} className="animate-spin text-primary-500" />
                        </div>
                      )}
                      
                      <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border text-[10px] font-bold shadow-md flex items-center gap-1.5 whitespace-nowrap ${
                        isDark
                          ? 'bg-slate-900 border-white/20 text-white'
                          : 'bg-white border-slate-300 text-slate-700 shadow-sm'
                      }`}>
                        <Smartphone size={12} className="text-primary-500" />
                        <span>Наведите камеру в приложении</span>
                      </div>
                    </div>
                  </div>

                  {/* Session status info bar */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm font-medium">
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${
                      isDark ? 'bg-white/[0.04] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <Clock size={16} className="text-amber-500" />
                      <span>Истекает через: <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{timeLeft}</strong></span>
                    </div>

                    {session.class_id && (
                      <div className={`px-3.5 py-1.5 rounded-full border ${
                        isDark ? 'bg-white/[0.04] border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        Класс: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{session.class_id}</strong>
                      </div>
                    )}

                    <button
                      onClick={handleClose}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-semibold transition"
                    >
                      <XCircle size={15} />
                      <span>Завершить сессию</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 space-y-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border transition-colors ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10 text-slate-400'
                      : 'bg-primary-50 border-primary-100 text-primary-600 shadow-inner'
                  }`}>
                    <QrCode size={40} />
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Код подключения не создан
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Нажмите кнопку ниже, чтобы сгенерировать уникальный PIN и QR-код для вашего урока.
                    </p>
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold shadow-xl shadow-primary-600/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles size={18} />
                    <span>Сгенерировать код для класса</span>
                  </button>
                </div>
              )}
            </div>

            {/* Test summary card if test is completed */}
            {summary && (
              <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-600/10 to-teal-500/15 border-emerald-500/30'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-md shadow-emerald-500/5'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500 text-white'
                  }`}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>Сводка успеваемости теста</h4>
                    <p className={`text-xs ${isDark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>Результаты в реальном времени</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-emerald-950'}`}>{summary.average}%</span>
                  <div className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-medium'}`}>Сдали: {summary.count} чел.</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Students Joined List & Instruction (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Connected Students Box */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all ${
              isDark
                ? 'quantum-card border-white/[0.1]'
                : 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-50 text-primary-600'
                  }`}>
                    <Users size={16} />
                  </div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Подключённые ученики
                  </h3>
                </div>
                
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isDark
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'} animate-pulse`} />
                  <span>{students.length} в классе</span>
                </span>
              </div>

              {students.length === 0 ? (
                <div className={`py-10 px-4 rounded-xl border border-dashed text-center space-y-1.5 ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto ${
                    isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    <Users size={18} />
                  </div>
                  <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Ожидание подключения...
                  </p>
                  <p className={`text-[11px] max-w-xs mx-auto ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Когда ученики отсканируют код со своих смартфонов, они сразу появятся в этом списке.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {students.map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isDark
                            ? 'bg-cosmic-900/90 border-white/[0.07] hover:border-white/15'
                            : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-neon-cyan flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-semibold text-xs leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.name}</div>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{student.email}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          {resultsMap[student.id] ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-mono text-xs font-bold">
                              {resultsMap[student.id].score}%
                            </span>
                          ) : (
                            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              {student.class_id || 'Подключён'}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Student Instructions Visual Card */}
            <div className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition-all ${
              isDark
                ? 'bg-gradient-to-br from-indigo-950/60 via-slate-900 to-indigo-950/40 border-primary-500/20 shadow-black/40'
                : 'bg-gradient-to-br from-indigo-50/90 via-white to-primary-50/70 border-indigo-100 shadow-indigo-100/40'
            }`}>
              <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                isDark ? 'text-neon-cyan' : 'text-primary-600'
              }`}>
                <ShieldCheck size={16} />
                <span>Как подключиться ученику</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark ? 'bg-white/10 text-white' : 'bg-primary-600 text-white shadow-sm'
                  }`}>
                    1
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Открыть приложение <strong>«Физика AI»</strong> на телефоне.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark ? 'bg-white/10 text-white' : 'bg-primary-600 text-white shadow-sm'
                  }`}>
                    2
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Нажать на иконку <strong>QR-кода</strong> в шапке или перейти в <strong>Профиль → Подключение</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark ? 'bg-white/10 text-white' : 'bg-primary-600 text-white shadow-sm'
                  }`}>
                    3
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Навести камеру на экран или ввести <strong>6-значный PIN-код</strong>.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
