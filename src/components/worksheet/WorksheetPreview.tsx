import { useState, useRef, useCallback, useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  Download, Pencil, Eye, Send, Plus, Info, FileSpreadsheet,
  X, Check, Copy, Users, Loader2, ExternalLink,
  BarChart3, ChevronDown, ChevronUp, Clock, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Worksheet, WorksheetTask } from '@/types/worksheet'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8003'

interface Props {
  worksheet: Worksheet
  onEdit: () => void
  onBack: () => void
  onNewSheet: () => void
  onUpdateWorksheet: (w: Worksheet) => void
}

export function WorksheetPreview({ worksheet, onEdit, onBack, onNewSheet, onUpdateWorksheet }: Props) {
  const { theme } = useTheme()
  const { token } = useAuth()
  const [showAnswers, setShowAnswers] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [title, setTitle] = useState(worksheet.title)
  const [desc, setDesc] = useState(worksheet.description)
  const printRef = useRef<HTMLDivElement>(null)

  /* ── Publish state ── */
  type PublishStep = 'closed' | 'checking' | 'no-session' | 'confirm' | 'sending' | 'done' | 'error'
  const [publishStep, setPublishStep] = useState<PublishStep>('closed')
  const [publishSession, setPublishSession] = useState<{ id: string; code: string; studentCount: number } | null>(null)
  const [publishError, setPublishError] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  /* ── Results state ── */
  const [showResults, setShowResults] = useState(false)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [worksheetResults, setWorksheetResults] = useState<any[]>([])
  const [resultsSummary, setResultsSummary] = useState<{ count: number; average: number | null } | null>(null)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [resultsSessionId, setResultsSessionId] = useState<string | null>(null)

  const openPublishModal = async () => {
    setPublishStep('checking')
    setPublishError('')
    setPublishSession(null)
    setCodeCopied(false)
    try {
      const res = await fetch(`${API_BASE}/api/teacher/pairing-sessions/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.session) {
        setPublishStep('no-session')
        return
      }
      setPublishSession({
        id: data.session.id,
        code: data.session.code,
        studentCount: (data.students || []).length,
      })
      setPublishStep('confirm')
    } catch {
      setPublishError('Ошибка сети')
      setPublishStep('error')
    }
  }

  const doPublish = async () => {
    if (!publishSession) return
    setPublishStep('sending')
    try {
      // Pre-compute crossword grids for tasks that have clues but no grid
      const enrichedTasks = worksheet.tasks.map((t) => {
        if (t.type === 'crossword' && t.crosswordClues?.length && !t.crosswordGrid?.length) {
          const layout = buildCrosswordLayout(t.crosswordClues)
          return {
            ...t,
            crosswordGrid: layout.grid.map((row) =>
              row.map((cell) => (cell ? cell.letter : '#')),
            ),
          }
        }
        return t
      })

      const res = await fetch(
        `${API_BASE}/api/teacher/pairing-sessions/${publishSession.id}/demo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            mode: 'worksheet',
            title: worksheet.title || 'Рабочий лист',
            subtitle: `${worksheet.subject}, ${worksheet.grade} класс`,
            payload: {
              worksheetId: worksheet.id,
              title: worksheet.title,
              description: worksheet.description,
              subject: worksheet.subject,
              grade: worksheet.grade,
              topic: worksheet.topic,
              tasks: enrichedTasks,
            },
          }),
        },
      )
      if (!res.ok) throw new Error('send failed')
      setPublishStep('done')
    } catch {
      setPublishError('Не удалось отправить рабочий лист')
      setPublishStep('error')
    }
  }

  const closePublish = () => setPublishStep('closed')

  const loadWorksheetResults = useCallback(async (sessionId?: string) => {
    const sid = sessionId || resultsSessionId
    if (!sid) return
    setResultsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/teacher/pairing-sessions/${sid}/worksheet-results`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setWorksheetResults(data.results || [])
        setResultsSummary(data.summary || null)
      }
    } catch {
      // ignore
    } finally {
      setResultsLoading(false)
    }
  }, [token, resultsSessionId])

  const openResults = () => {
    if (!publishSession) return
    setResultsSessionId(publishSession.id)
    setShowResults(true)
    loadWorksheetResults(publishSession.id)
  }

  const formatStudentAnswer = (taskId: string, graded: Record<string, any>) => {
    const info = graded[taskId]
    if (!info) return null
    const ans = info.answer
    let displayAnswer = ''
    if (ans === null || ans === undefined || ans === '') {
      displayAnswer = '— (не отвечено)'
    } else if (typeof ans === 'boolean') {
      displayAnswer = ans ? 'Истина' : 'Ложь'
    } else if (Array.isArray(ans)) {
      displayAnswer = ans.join(', ')
    } else if (typeof ans === 'object') {
      displayAnswer = Object.entries(ans).map(([k, v]) => `${k}: ${v}`).join(', ')
    } else {
      displayAnswer = String(ans)
    }
    return { displayAnswer, correct: info.correct, auto: info.auto }
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark'
    ? 'bg-white/[0.04] border border-white/[0.08]'
    : 'bg-white/80 border border-slate-200'

  const saveTitle = () => {
    setEditingTitle(false)
    onUpdateWorksheet({ ...worksheet, title })
  }
  const saveDesc = () => {
    setEditingDesc(false)
    onUpdateWorksheet({ ...worksheet, description: desc })
  }

  const handleDownloadPDF = useCallback(() => {
    const html = generatePrintHTML(worksheet)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }, [worksheet])

  return (
    <div className="space-y-6">
      <button onClick={onBack} className={`text-sm ${textMuted} hover:${textColor} transition-colors flex items-center gap-1`}>
        ← Мои листы
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {editingTitle ? (
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle} onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              className={`text-3xl font-bold bg-transparent border-b-2 border-primary-400 outline-none w-full ${textColor}`} />
          ) : (
            <h1 className={`text-3xl font-bold ${textColor} cursor-pointer hover:opacity-70`}
              onClick={() => setEditingTitle(true)}>
              {worksheet.title || 'Ваше название'}
            </h1>
          )}
          {editingDesc ? (
            <input autoFocus value={desc} onChange={(e) => setDesc(e.target.value)}
              onBlur={saveDesc} onKeyDown={(e) => e.key === 'Enter' && saveDesc()}
              className={`text-sm bg-transparent border-b border-primary-400/60 outline-none w-full mt-1 ${textMuted}`} />
          ) : (
            <p className={`text-sm ${textMuted} mt-1 cursor-pointer hover:opacity-70`}
              onClick={() => setEditingDesc(true)}>
              {worksheet.description || 'Ваше описание'}
            </p>
          )}
          <p className={`text-sm ${textMuted} mt-1`}>
            {worksheet.subject}, {worksheet.grade} класс
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${panelBg}`}>
          <FileSpreadsheet size={24} className={textMuted} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
          <Download size={14} /> Скачать PDF
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Pencil size={14} /> Редактировать задания
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowAnswers(!showAnswers)}>
          <Eye size={14} /> Посмотреть ответы
        </Button>
        <Button variant="secondary" size="sm" onClick={openPublishModal}>
          <Send size={14} /> Опубликовать
        </Button>
        {resultsSessionId && (
          <Button variant="secondary" size="sm" onClick={() => { setShowResults(!showResults); if (!showResults) loadWorksheetResults() }}>
            <BarChart3 size={14} /> Результаты учеников
          </Button>
        )}
      </div>

      <Button variant="secondary" size="sm" onClick={onNewSheet}>
        <Plus size={14} /> Новый лист
      </Button>

      <div>
        <h2 className={`text-xl font-bold ${textColor} mb-2`}>Предпросмотр:</h2>
        <div className={`flex items-center gap-2 text-sm ${textMuted}`}>
          <Info size={14} className="text-primary-400" />
          Правильные ответы видны только вам
        </div>
      </div>

      <div ref={printRef} className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-100' : 'bg-white'} shadow-lg`}>
        <div className="bg-white px-8 pt-8 pb-4 border-b border-slate-200 text-center">
          <h3 className="text-xl font-bold text-slate-900">
            Рабочий лист по предмету {worksheet.subject}, {worksheet.grade} класс
          </h3>
          <div className="flex justify-center gap-8 mt-3 text-sm text-slate-500">
            <span>Имя: __________</span>
            <span>Фамилия: __________</span>
            <span>Класс: _____</span>
          </div>
        </div>

        <div className="bg-white px-8 py-6 space-y-8">
          {worksheet.tasks.map((task, idx) => (
            <TaskPreviewCard key={task.id} task={task} index={idx} showAnswer={showAnswers} />
          ))}
        </div>
      </div>

      {showAnswers && (
        <div className={`rounded-2xl p-6 ${panelBg}`}>
          <h3 className={`text-lg font-bold ${textColor} mb-3`}>Ответы</h3>
          <ol className={`list-decimal list-inside space-y-1 text-sm ${textMuted}`}>
            {worksheet.tasks.map((task) => (
              <li key={task.id}>{getTaskAnswer(task)}</li>
            ))}
          </ol>
        </div>
      )}

      {/* ═══ Worksheet Results Panel ═══ */}
      {showResults && (
        <div className={`rounded-2xl overflow-hidden ${panelBg}`}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                <BarChart3 size={20} className="text-primary-400" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textColor}`}>Результаты учеников</h3>
                {resultsSummary && (
                  <p className={`text-sm ${textMuted}`}>
                    Отправили: {resultsSummary.count}
                    {resultsSummary.average !== null && ` • Средний балл: ${resultsSummary.average}%`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadWorksheetResults()}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10 text-white/50' : 'hover:bg-slate-100 text-slate-400'
                }`}
                title="Обновить"
              >
                <RefreshCw size={16} className={resultsLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowResults(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10 text-white/50' : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {resultsLoading && worksheetResults.length === 0 && (
            <div className="px-6 py-8 flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary-400" />
              <p className={`text-sm ${textMuted}`}>Загружаем результаты...</p>
            </div>
          )}

          {!resultsLoading && worksheetResults.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className={`text-sm ${textMuted}`}>Пока никто не отправил ответы</p>
              <p className={`text-xs ${textMuted} mt-1`}>Результаты появятся когда ученики нажмут «Отправить»</p>
            </div>
          )}

          {worksheetResults.length > 0 && (
            <div className="px-6 pb-4 space-y-3">
              {worksheetResults.map((r) => {
                const isExpanded = expandedStudent === r.student_id
                return (
                  <div key={r.student_id} className={`rounded-xl border ${
                    theme === 'dark' ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <button
                      onClick={() => setExpandedStudent(isExpanded ? null : r.student_id)}
                      className="w-full px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          r.score_percent !== null
                            ? r.score_percent >= 70
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : r.score_percent >= 40
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            : theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {r.score_percent !== null ? `${r.score_percent}%` : '—'}
                        </div>
                        <div className="text-left">
                          <div className={`font-semibold text-sm ${textColor}`}>{r.name || 'Ученик'}</div>
                          <div className={`text-xs ${textMuted}`}>
                            {r.class_id || '—'} • Отвечено {r.answered_count}/{r.task_count}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.score_percent !== null && (
                          <span className={`text-sm font-bold ${
                            r.score_percent >= 70 ? 'text-emerald-400' : r.score_percent >= 40 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {r.auto_score}/{r.auto_total}
                          </span>
                        )}
                        {isExpanded
                          ? <ChevronUp size={16} className={textMuted} />
                          : <ChevronDown size={16} className={textMuted} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={`px-4 pb-4 border-t ${
                        theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
                      }`}>
                        <div className="pt-3 space-y-2">
                          {worksheet.tasks.map((task, idx) => {
                            const info = formatStudentAnswer(task.id, r.graded || {})
                            const hasAnswer = info && info.displayAnswer !== '— (не отвечено)'
                            return (
                              <div key={task.id} className={`flex items-start gap-3 py-2 ${
                                idx < worksheet.tasks.length - 1
                                  ? `border-b ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-100'}`
                                  : ''
                              }`}>
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                  !info || !hasAnswer
                                    ? theme === 'dark' ? 'bg-white/5 text-white/30' : 'bg-slate-100 text-slate-400'
                                    : info.correct === true
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : info.correct === false
                                        ? 'bg-red-500/20 text-red-400'
                                        : theme === 'dark' ? 'bg-primary-500/20 text-primary-300' : 'bg-primary-50 text-primary-600'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs font-medium ${textMuted}`}>{task.title}</div>
                                  <div className={`text-sm mt-0.5 ${textColor} ${!hasAnswer ? 'italic opacity-50' : ''}`}>
                                    {info ? info.displayAnswer : '— (не отвечено)'}
                                  </div>
                                  {info && info.correct === false && info.auto && (
                                    <div className="text-xs text-emerald-400 mt-1">
                                      Правильно: {getTaskAnswer(task)}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 mt-1">
                                  {info && info.correct === true && <Check size={14} className="text-emerald-400" />}
                                  {info && info.correct === false && <X size={14} className="text-red-400" />}
                                  {info && info.correct === null && hasAnswer && <Clock size={14} className={textMuted} />}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Publish Modal ═══ */}
      {publishStep !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePublish} />
          <div className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white border border-slate-200'
          }`}>
            <button onClick={closePublish} className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-white/10 text-white/50' : 'hover:bg-slate-100 text-slate-400'
            }`}>
              <X size={18} />
            </button>

            {/* Checking */}
            {publishStep === 'checking' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 size={32} className="animate-spin text-primary-400" />
                <p className={`text-sm ${textMuted}`}>Проверяем подключение...</p>
              </div>
            )}

            {/* No session */}
            {publishStep === 'no-session' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Users size={20} className="text-amber-400" />
                  </div>
                  <h3 className={`text-lg font-bold ${textColor}`}>Нет активной сессии</h3>
                </div>
                <p className={`text-sm ${textMuted}`}>
                  Сначала создайте код подключения на странице «Подключение», чтобы ученики могли получить рабочий лист на свои устройства.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" size="sm" onClick={closePublish}>Отмена</Button>
                  <a href="/connect">
                    <Button variant="primary" size="sm">
                      <ExternalLink size={14} /> Перейти к подключению
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {/* Confirm */}
            {publishStep === 'confirm' && publishSession && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                    <Send size={20} className="text-primary-400" />
                  </div>
                  <h3 className={`text-lg font-bold ${textColor}`}>Отправить рабочий лист</h3>
                </div>
                <div className={`rounded-2xl p-4 space-y-3 ${
                  theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textMuted}`}>Код сессии</span>
                    <span className={`text-xl font-bold tracking-[0.2em] ${textColor}`}>{publishSession.code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textMuted}`}>Подключено учеников</span>
                    <span className={`text-lg font-semibold ${textColor}`}>{publishSession.studentCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textMuted}`}>Заданий в листе</span>
                    <span className={`text-lg font-semibold ${textColor}`}>{worksheet.tasks.length}</span>
                  </div>
                </div>
                <p className={`text-xs ${textMuted}`}>
                  Рабочий лист появится на экранах всех подключённых учеников. Они смогут заполнять задания интерактивно.
                </p>
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" size="sm" onClick={closePublish}>Отмена</Button>
                  <Button variant="primary" size="sm" onClick={doPublish}>
                    <Send size={14} /> Отправить
                  </Button>
                </div>
              </div>
            )}

            {/* Sending */}
            {publishStep === 'sending' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 size={32} className="animate-spin text-primary-400" />
                <p className={`text-sm ${textMuted}`}>Отправляем рабочий лист...</p>
              </div>
            )}

            {/* Done */}
            {publishStep === 'done' && publishSession && (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-3 pt-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <Check size={28} className="text-emerald-400" />
                  </div>
                  <h3 className={`text-xl font-bold ${textColor}`}>Рабочий лист отправлен!</h3>
                  <p className={`text-sm ${textMuted} text-center`}>
                    {publishSession.studentCount > 0
                      ? `${publishSession.studentCount} ${publishSession.studentCount === 1 ? 'ученик получил' : 'учеников получили'} задания`
                      : 'Лист отправлен. Ученики увидят его при подключении.'}
                  </p>
                </div>
                <div className={`rounded-2xl p-4 flex items-center justify-between ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
                }`}>
                  <div>
                    <div className={`text-xs ${textMuted}`}>PIN-код для подключения</div>
                    <div className={`text-2xl font-bold tracking-[0.3em] ${textColor}`}>{publishSession.code}</div>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(publishSession.code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000) }}
                    className={`p-2.5 rounded-xl transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-200'
                    }`}
                  >
                    {codeCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} className={textMuted} />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={closePublish}>Готово</Button>
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => { closePublish(); openResults() }}>
                    <BarChart3 size={14} /> Результаты
                  </Button>
                </div>
              </div>
            )}

            {/* Error */}
            {publishStep === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                    <X size={20} className="text-red-400" />
                  </div>
                  <h3 className={`text-lg font-bold ${textColor}`}>Ошибка</h3>
                </div>
                <p className={`text-sm ${textMuted}`}>{publishError || 'Произошла ошибка при публикации'}</p>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" size="sm" onClick={closePublish}>Закрыть</Button>
                  <Button variant="primary" size="sm" onClick={openPublishModal}>Попробовать снова</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   Task Preview Card — routes to sub-renderer
   ════════════════════════════════════════════ */
function TaskPreviewCard({ task, index, showAnswer }: { task: WorksheetTask; index: number; showAnswer: boolean }) {
  return (
    <div className="border border-slate-200 rounded-xl p-6 relative">
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-slate-800 text-white text-sm font-bold flex items-center justify-center shadow">
        {index + 1}
      </div>
      <h4 className="text-lg font-bold text-slate-900 mb-1">{task.title}</h4>
      <p className="text-sm text-slate-500 mb-4">{task.instruction}</p>
      <TaskRenderer task={task} showAnswer={showAnswer} />
    </div>
  )
}

function TaskRenderer({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  switch (task.type) {
    case 'multiple-choice': return <MultipleChoicePreview task={task} showAnswer={showAnswer} />
    case 'match-columns': return <MatchColumnsPreview task={task} showAnswer={showAnswer} />
    case 'find-extra': return <FindExtraPreview task={task} showAnswer={showAnswer} />
    case 'true-false': return <TrueFalsePreview task={task} showAnswer={showAnswer} />
    case 'short-answer': return <ShortAnswerPreview task={task} showAnswer={showAnswer} />
    case 'fill-blanks': return <FillBlanksPreview task={task} showAnswer={showAnswer} />
    case 'crossword': return <CrosswordPreview task={task} showAnswer={showAnswer} />
    case 'find-error': return <FindErrorPreview task={task} showAnswer={showAnswer} />
    case 'sequence': return <SequencePreview task={task} showAnswer={showAnswer} />
    case 'insert-letter': return <InsertLetterPreview task={task} showAnswer={showAnswer} />
    case 'compare-numbers': return <CompareNumbersPreview task={task} showAnswer={showAnswer} />
    case 'step-by-step': return <StepByStepPreview task={task} showAnswer={showAnswer} />
    case 'fill-table': return <FillTablePreview task={task} showAnswer={showAnswer} />
    case 'essay': return <EssayPreview task={task} />
    case 'categorize': return <CategorizePreview task={task} showAnswer={showAnswer} />
    case 'continue-sequence': return <ContinueSequencePreview task={task} showAnswer={showAnswer} />
    case 'anagram': return <AnagramPreview task={task} showAnswer={showAnswer} />
    case 'scenario': return <PassageQuestionsPreview task={task} showAnswer={showAnswer} fieldKey="passageText" />
    case 'text-analysis': return <PassageQuestionsPreview task={task} showAnswer={showAnswer} fieldKey="passageText" />
    case 'info-work': return <PassageQuestionsPreview task={task} showAnswer={showAnswer} fieldKey="passageText" />
    case 'filword': return <FilwordPreview task={task} showAnswer={showAnswer} />
    case 'handwriting': return <HandwritingPreview task={task} />
    case 'number-composition': return <NumberCompositionPreview task={task} showAnswer={showAnswer} />
    case 'continue-story': return <ContinueStoryPreview task={task} />
    case 'maze': return <MazePreview task={task} showAnswer={showAnswer} />
    case 'draw-illustration': return <DrawIllustrationPreview task={task} />
    case 'unknown-words': return <UnknownWordsPreview task={task} showAnswer={showAnswer} />
    default: return <p className="text-sm text-slate-400 italic">Тип задания: {task.title}</p>
  }
}

/* ════════════════════════════════════════════
   Sub-renderers (27 total)
   ════════════════════════════════════════════ */

/* ── 1. Multiple choice ── */
function MultipleChoicePreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  return (
    <div>
      {task.questionText && <p className="text-sm text-slate-700 mb-3">{task.questionText}</p>}
      <div className="space-y-2">
        {task.options?.map((opt, i) => {
          const isCorrect = i === task.correctIndex
          return (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
              showAnswer && isCorrect ? 'bg-primary-50 border-primary-300' : 'bg-white border-slate-200'
            }`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                showAnswer && isCorrect ? 'border-primary-500 bg-primary-500' : 'border-slate-300'
              }`}>
                {showAnswer && isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`text-sm ${showAnswer && isCorrect ? 'text-primary-700 font-semibold' : 'text-slate-700'}`}>{opt}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── 2. Match columns ── */
function MatchColumnsPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const left = task.leftColumn || []
  const right = task.rightColumn || []
  const pairs = task.pairs || {}
  return (
    <div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Столбец 1</div>
          <div className="space-y-2">
            {left.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-slate-700">{item}</span>
                <select className="ml-auto w-12 px-1 py-1 border border-slate-300 rounded text-sm text-slate-600 bg-white">
                  <option value="">—</option>
                  {right.map((_, ri) => (
                    <option key={ri} value={String.fromCharCode(1072 + ri)}>{String.fromCharCode(1072 + ri)}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Столбец 2</div>
          <div className="space-y-2">
            {right.map((item, i) => (
              <div key={i} className="text-sm text-slate-700">
                <span className="text-primary-500 font-semibold mr-2">{String.fromCharCode(1072 + i)}.</span>{item}
              </div>
            ))}
          </div>
        </div>
      </div>
      {showAnswer && Object.keys(pairs).length > 0 && (
        <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
          <div className="text-xs font-semibold text-primary-600 mb-1">Ответы:</div>
          {Object.entries(pairs).map(([l, r]) => (
            <div key={l} className="text-sm text-primary-700">{l} → {r}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 3. Find extra ── */
function FindExtraPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const items = task.items || task.options || []
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isCorrect = item === task.correctItem
        return (
          <div key={item} className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
            showAnswer && isCorrect ? 'bg-primary-50 border-primary-300 text-primary-700 font-semibold' : 'bg-white border-slate-200 text-slate-700'
          }`}>{item}</div>
        )
      })}
    </div>
  )
}

/* ── 4. True / False ── */
function TrueFalsePreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  return (
    <div>
      {task.questionText && <p className="text-sm text-slate-700 mb-3">{task.questionText}</p>}
      <div className="flex gap-3">
        {['Истина', 'Ложь'].map((label, i) => {
          const isCorrect = (i === 0) === task.isTrue
          return (
            <div key={label} className={`px-5 py-2.5 rounded-lg border text-sm cursor-default transition-colors ${
              showAnswer && isCorrect ? 'bg-primary-50 border-primary-300 text-primary-700 font-semibold' : 'bg-white border-slate-200 text-slate-700'
            }`}>{label}</div>
          )
        })}
      </div>
    </div>
  )
}

/* ── 5. Short answer ── */
function ShortAnswerPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  return (
    <div>
      {task.questionText && <p className="text-sm text-slate-700 mb-3">{task.questionText}</p>}
      <div className="border-b-2 border-slate-300 w-full max-w-md py-2 text-sm text-slate-400">
        {showAnswer ? <span className="text-primary-600 font-semibold">{task.answerText}</span> : 'Ваш ответ...'}
      </div>
    </div>
  )
}

/* ── 6. Fill blanks ── */
function FillBlanksPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  if (!task.blankText) return null
  const parts = task.blankText.split('___')
  const answers = task.blankAnswers || []
  return (
    <p className="text-sm text-slate-700 leading-relaxed">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            showAnswer && answers[i]
              ? <span className="font-semibold text-primary-600 border-b-2 border-primary-400 px-1">{answers[i]}</span>
              : <span className="inline-block w-24 border-b-2 border-slate-300 mx-1" />
          )}
        </span>
      ))}
    </p>
  )
}

/* ── 7. Crossword ── */

/** Builds a crossword grid layout from clues+answers automatically */
interface CwCell { letter: string; number?: number }

function buildCrosswordLayout(
  clues: { direction: 'across' | 'down'; number: number; clue: string; answer: string }[],
): { grid: (CwCell | null)[][]; rows: number; cols: number } {
  if (!clues || clues.length === 0) return { grid: [], rows: 0, cols: 0 }

  // Sparse map approach: key "r,c" → letter
  const cells = new Map<string, string>()
  const nums = new Map<string, number>()
  const k = (r: number, c: number) => `${r},${c}`

  type Placed = { word: string; r: number; c: number; dir: 'across' | 'down' }
  const placed: Placed[] = []

  const tryPlace = (word: string, r: number, c: number, dir: 'across' | 'down'): boolean => {
    const dr = dir === 'down' ? 1 : 0
    const dc = dir === 'across' ? 1 : 0
    // check every letter fits
    for (let i = 0; i < word.length; i++) {
      const cr = r + dr * i, cc = c + dc * i
      const ex = cells.get(k(cr, cc))
      if (ex !== undefined && ex !== word[i]) return false
      // check parallel neighbors don't cause merging
      if (ex === undefined) {
        if (dir === 'across') {
          if (cells.has(k(cr - 1, cc))) return false
          if (cells.has(k(cr + 1, cc))) return false
        } else {
          if (cells.has(k(cr, cc - 1))) return false
          if (cells.has(k(cr, cc + 1))) return false
        }
      }
    }
    // check before & after are free
    if (cells.has(k(r - dr, c - dc))) return false
    if (cells.has(k(r + dr * word.length, c + dc * word.length))) return false
    return true
  }

  const doPlace = (word: string, r: number, c: number, dir: 'across' | 'down', num: number) => {
    const dr = dir === 'down' ? 1 : 0, dc = dir === 'across' ? 1 : 0
    for (let i = 0; i < word.length; i++) cells.set(k(r + dr * i, c + dc * i), word[i])
    const existing = nums.get(k(r, c))
    if (existing === undefined || num < existing) nums.set(k(r, c), num)
    placed.push({ word, r, c, dir })
  }

  // Process across first, then down – try to intersect with already-placed words
  const sorted = [...clues].sort((a, b) => {
    if (a.direction !== b.direction) return a.direction === 'across' ? -1 : 1
    return a.number - b.number
  })

  for (const clue of sorted) {
    const word = clue.answer.toUpperCase()
    const wantDir = clue.direction

    if (placed.length === 0) {
      doPlace(word, 0, 0, wantDir, clue.number)
      continue
    }

    let ok = false
    // Try intersections with every placed word of the opposite direction
    outer: for (const p of placed) {
      if (p.dir === wantDir) continue
      for (let pi = 0; pi < p.word.length; pi++) {
        for (let wi = 0; wi < word.length; wi++) {
          if (p.word[pi] !== word[wi]) continue
          let nr: number, nc: number
          if (wantDir === 'across') {
            nr = p.dir === 'down' ? p.r + pi : p.r
            nc = (p.dir === 'down' ? p.c : p.c + pi) - wi
          } else {
            nc = p.dir === 'across' ? p.c + pi : p.c
            nr = (p.dir === 'across' ? p.r : p.r + pi) - wi
          }
          if (tryPlace(word, nr, nc, wantDir)) {
            doPlace(word, nr, nc, wantDir, clue.number)
            ok = true
            break outer
          }
        }
      }
    }

    // Fallback: place word separately below existing grid
    if (!ok) {
      let maxR = -Infinity
      cells.forEach((_, key) => { const r = parseInt(key); if (r > maxR) maxR = r })
      const newR = (isFinite(maxR) ? maxR : 0) + 2
      doPlace(word, newR, 0, wantDir, clue.number)
    }
  }

  // Build bounded 2D grid
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity
  cells.forEach((_, key) => {
    const parts = key.split(',').map(Number)
    minR = Math.min(minR, parts[0]); maxR = Math.max(maxR, parts[0])
    minC = Math.min(minC, parts[1]); maxC = Math.max(maxC, parts[1])
  })
  const rows = maxR - minR + 1, cols = maxC - minC + 1
  const grid: (CwCell | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
  cells.forEach((letter, key) => {
    const parts = key.split(',').map(Number)
    const r = parts[0] - minR, c = parts[1] - minC
    grid[r][c] = { letter, number: nums.get(key) }
  })

  return { grid, rows, cols }
}

function CrosswordPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const clues = task.crosswordClues || []
  const across = clues.filter((c) => c.direction === 'across')
  const down = clues.filter((c) => c.direction === 'down')

  // Auto-generate grid from clues
  const layout = useMemo(() => buildCrosswordLayout(clues), [clues])

  return (
    <div>
      {/* Grid */}
      {layout.grid.length > 0 && (
        <div className="inline-block mb-5">
          {layout.grid.map((row, ri) => (
            <div key={ri} className="flex">
              {row.map((cell, ci) => {
                if (!cell) {
                  return <div key={ci} className="w-9 h-9" />
                }
                return (
                  <div key={ci} className="w-9 h-9 border border-slate-300 bg-white relative">
                    {cell.number !== undefined && (
                      <span className="absolute top-px left-1 text-[9px] font-bold text-slate-500 leading-none">
                        {cell.number}
                      </span>
                    )}
                    {showAnswer && (
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-600">
                        {cell.letter}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
      {/* Clues */}
      <div className="grid grid-cols-2 gap-6 text-sm">
        {across.length > 0 && (
          <div>
            <div className="font-semibold text-slate-700 mb-1">По горизонтали:</div>
            {across.map((c) => (
              <div key={`a-${c.number}`} className="text-slate-600 py-0.5">
                <span className="font-semibold text-slate-800 mr-1">{c.number}.</span>
                {c.clue}
                {showAnswer && <span className="text-primary-600 font-semibold ml-1">({c.answer})</span>}
              </div>
            ))}
          </div>
        )}
        {down.length > 0 && (
          <div>
            <div className="font-semibold text-slate-700 mb-1">По вертикали:</div>
            {down.map((c) => (
              <div key={`d-${c.number}`} className="text-slate-600 py-0.5">
                <span className="font-semibold text-slate-800 mr-1">{c.number}.</span>
                {c.clue}
                {showAnswer && <span className="text-primary-600 font-semibold ml-1">({c.answer})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 8. Find error ── */
function FindErrorPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  return (
    <div>
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed mb-3">
        {task.errorText || task.questionText || ''}
      </div>
      {showAnswer && (
        <div className="space-y-2">
          {task.correctedText && (
            <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
              <div className="text-xs font-semibold text-primary-600 mb-1">Исправленный текст:</div>
              <p className="text-sm text-primary-700">{task.correctedText}</p>
            </div>
          )}
          {task.errorExplanation && (
            <div className="text-sm text-slate-500 italic">{task.errorExplanation}</div>
          )}
        </div>
      )}
      {!showAnswer && (
        <div className="border-b-2 border-slate-300 w-full py-2 text-sm text-slate-400">
          Напишите исправленный вариант...
        </div>
      )}
    </div>
  )
}

/* ── 9. Sequence ── */
function SequencePreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const items = showAnswer ? (task.correctSequence || task.sequenceItems || []) : (task.sequenceItems || [])
  return (
    <div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
            showAnswer ? 'bg-primary-50 border-primary-200' : 'bg-white border-slate-200 border-dashed'
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              showAnswer ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-300'
            }`}>
              {showAnswer ? i + 1 : '?'}
            </div>
            <span className={`text-sm ${showAnswer ? 'text-primary-700 font-medium' : 'text-slate-700'}`}>{item}</span>
          </div>
        ))}
      </div>
      {!showAnswer && (
        <p className="text-xs text-slate-400 mt-2 italic">Расставьте элементы в правильном порядке (1, 2, 3...)</p>
      )}
    </div>
  )
}

/* ── 10. Insert letter ── */
function InsertLetterPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const word = task.wordWithBlanks || ''
  const correct = task.correctWord || ''
  return (
    <div>
      <div className="flex flex-wrap gap-1 text-2xl font-mono tracking-widest">
        {word.split('').map((ch, i) => {
          const isMissing = ch === '_'
          return (
            <span key={i} className={`w-10 h-12 flex items-center justify-center border-b-2 ${
              isMissing
                ? showAnswer
                  ? 'border-primary-400 text-primary-600 font-bold'
                  : 'border-slate-400 text-transparent'
                : 'border-transparent text-slate-800'
            }`}>
              {isMissing && showAnswer ? correct[i] || '?' : ch === '_' ? '\u00A0' : ch}
            </span>
          )
        })}
      </div>
      {showAnswer && correct && (
        <p className="mt-3 text-sm text-primary-600 font-semibold">Ответ: {correct}</p>
      )}
    </div>
  )
}

/* ── 11. Compare numbers ── */
function CompareNumbersPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const pairs = task.comparePairs || []
  return (
    <div className="space-y-3">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-4 text-lg">
          <span className="font-mono font-semibold text-slate-800 min-w-[60px] text-right">{pair.left}</span>
          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
            showAnswer ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-300'
          }`}>
            {showAnswer ? pair.operator : '○'}
          </div>
          <span className="font-mono font-semibold text-slate-800 min-w-[60px]">{pair.right}</span>
        </div>
      ))}
    </div>
  )
}

/* ── 12. Step by step ── */
function StepByStepPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  return (
    <div>
      {task.problemCondition && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm text-slate-700 mb-4">
          <span className="font-semibold text-slate-800">Условие: </span>{task.problemCondition}
        </div>
      )}
      {showAnswer && task.solutionSteps && task.solutionSteps.length > 0 ? (
        <div className="space-y-2">
          {task.solutionSteps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-slate-700">{step}</p>
            </div>
          ))}
          {task.problemAnswer && (
            <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <span className="text-sm font-semibold text-primary-700">Ответ: </span>
              <span className="text-sm text-primary-600">{task.problemAnswer}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {n}
              </div>
              <div className="flex-1 border-b border-slate-300 pb-4" />
            </div>
          ))}
          <div className="border-b-2 border-slate-400 w-48 py-2 text-sm text-slate-400 mt-2 font-semibold">
            Ответ: ___________
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 13. Fill table ── */
function FillTablePreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const headers = task.tableHeaders || []
  const rows = task.tableRows || []
  const answers = task.tableAnswers || []
  const answerMap = new Map(answers.map((a) => [`${a.row}-${a.col}`, a.value]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => {
                const isBlank = cell === null || cell === ''
                const answer = answerMap.get(`${ri}-${ci}`)
                return (
                  <td key={ci} className={`border border-slate-300 px-3 py-2 ${
                    isBlank ? 'bg-yellow-50' : 'bg-white'
                  }`}>
                    {isBlank ? (
                      showAnswer && answer
                        ? <span className="text-primary-600 font-semibold">{answer}</span>
                        : <span className="text-slate-300">___</span>
                    ) : (
                      <span className="text-slate-700">{cell}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── 14. Essay ── */
function EssayPreview({ task }: { task: WorksheetTask }) {
  return (
    <div>
      {task.questionText && <p className="text-sm text-slate-700 mb-3">{task.questionText}</p>}
      <div className="border border-slate-200 rounded-lg p-4 min-h-[120px]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-slate-200 h-7" />
        ))}
      </div>
    </div>
  )
}

/* ── 15. Categorize ── */
function CategorizePreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const categories = task.categories || []
  const pool = task.allCategoryItems || categories.flatMap((c) => c.items)
  const shuffled = [...pool].sort(() => 0.5 - Math.random())

  return (
    <div>
      {/* Item pool */}
      {!showAnswer && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Слова для распределения:</div>
          <div className="flex flex-wrap gap-2">
            {shuffled.map((item, i) => (
              <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-slate-700">{item}</span>
            ))}
          </div>
        </div>
      )}
      {/* Category boxes */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat, i) => (
          <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 font-semibold text-sm text-slate-700 text-center">{cat.name}</div>
            <div className="p-3 min-h-[60px]">
              {showAnswer ? (
                <div className="flex flex-wrap gap-1">
                  {cat.items.map((item, j) => (
                    <span key={j} className="px-2 py-1 bg-primary-50 border border-primary-200 rounded text-xs text-primary-700">{item}</span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-300 italic">Перетащите сюда...</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 16. Continue sequence ── */
function ContinueSequencePreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const start = task.sequenceStart || []
  const answer = task.sequenceAnswer || []
  return (
    <div className="flex flex-wrap items-center gap-2">
      {start.map((item, i) => (
        <span key={i} className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700">{item}</span>
      ))}
      {/* Blank spots */}
      {(answer.length > 0 ? answer : ['?', '?']).map((a, i) => (
        <span key={`ans-${i}`} className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
          showAnswer
            ? 'bg-primary-50 border-primary-300 text-primary-600'
            : 'bg-white border-dashed border-slate-300 text-slate-300'
        }`}>
          {showAnswer ? a : '?'}
        </span>
      ))}
      <span className="text-slate-400 text-lg">...</span>
    </div>
  )
}

/* ── 17. Anagram ── */
function AnagramPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const scrambled = task.scrambledWord || ''
  const letters = scrambled.toUpperCase().split('')
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {letters.map((ch, i) => (
          <div key={i} className="w-10 h-10 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-center justify-center text-lg font-bold text-amber-700">
            {ch}
          </div>
        ))}
      </div>
      {task.anagramHint && (
        <p className="text-xs text-slate-400 italic mb-2">Подсказка: {task.anagramHint}</p>
      )}
      {showAnswer && task.anagramAnswer ? (
        <p className="text-sm font-semibold text-primary-600">Ответ: {task.anagramAnswer}</p>
      ) : (
        <div className="flex gap-2">
          {(task.anagramAnswer || scrambled).split('').map((_, i) => (
            <div key={i} className="w-10 h-10 border-2 border-dashed border-slate-300 rounded-lg" />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 18/19/20. Passage + Questions (scenario, text-analysis, info-work) ── */
function PassageQuestionsPreview({ task, showAnswer, fieldKey: _fk }: { task: WorksheetTask; showAnswer: boolean; fieldKey: string }) {
  const text = task.passageText || task.questionText || ''
  const questions = task.passageQuestions || []
  return (
    <div>
      {text && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-line">
          {text}
        </div>
      )}
      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-slate-700">{i + 1}. {q.question}</p>
              {showAnswer ? (
                <p className="text-sm text-primary-600 font-semibold mt-1 ml-4">{q.answer}</p>
              ) : (
                <div className="border-b border-slate-300 w-full max-w-sm mt-1 ml-4 h-5" />
              )}
            </div>
          ))}
        </div>
      )}
      {questions.length === 0 && (
        <div className="border border-slate-200 rounded-lg p-4 min-h-[60px]">
          {[1, 2, 3].map((n) => <div key={n} className="border-b border-slate-200 h-6" />)}
        </div>
      )}
    </div>
  )
}

/* ── 21. Filword ── */
function FilwordPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const grid = task.filwordGrid || []
  const words = task.filwordWords || []
  return (
    <div>
      {grid.length > 0 && (
        <div className="inline-block border border-slate-300 rounded mb-4">
          {grid.map((row, ri) => (
            <div key={ri} className="flex">
              {row.map((ch, ci) => (
                <div key={ci} className="w-8 h-8 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 bg-white">
                  {ch.toUpperCase()}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Найдите слова:</div>
        <div className="flex flex-wrap gap-2">
          {words.map((w, i) => (
            <span key={i} className={`px-3 py-1 rounded-lg border text-sm ${
              showAnswer ? 'bg-primary-50 border-primary-200 text-primary-700 line-through' : 'bg-white border-slate-200 text-slate-600'
            }`}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 22. Handwriting ── */
function HandwritingPreview({ task }: { task: WorksheetTask }) {
  const text = task.handwritingText || ''
  return (
    <div className="space-y-4">
      {/* Sample text */}
      <div className="text-2xl text-slate-700 tracking-wide" style={{ fontFamily: 'cursive, serif' }}>
        {text}
      </div>
      {/* Tracing lines */}
      <div className="border border-slate-200 rounded-lg p-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="relative h-10 mb-2">
            <div className="absolute bottom-0 w-full border-b-2 border-slate-300" />
            <div className="absolute bottom-4 w-full border-b border-dashed border-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 23. Number composition ── */
function NumberCompositionPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const target = task.targetNumber ?? 0
  const parts = task.numberParts || []
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-2xl font-bold text-amber-700">
          {target}
        </div>
        <span className="text-slate-400 text-lg">=</span>
      </div>
      <div className="space-y-2">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold ${
              showAnswer ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-300 bg-white text-slate-300'
            }`}>
              {showAnswer ? p.a : '?'}
            </div>
            <span className="text-slate-500 font-semibold">+</span>
            <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold ${
              showAnswer ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-300 bg-white text-slate-300'
            }`}>
              {showAnswer ? p.b : '?'}
            </div>
            <span className="text-slate-400">=</span>
            <span className="text-slate-700 font-semibold">{target}</span>
          </div>
        ))}
        {parts.length === 0 && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300" />
            <span className="text-slate-500 font-semibold">+</span>
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300" />
            <span className="text-slate-400">=</span>
            <span className="text-slate-700 font-semibold">{target}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 24. Continue story ── */
function ContinueStoryPreview({ task }: { task: WorksheetTask }) {
  return (
    <div>
      {task.storyBeginning && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-sm text-slate-700 mb-4 leading-relaxed italic">
          «{task.storyBeginning}»
        </div>
      )}
      <div className="border border-slate-200 rounded-lg p-4 min-h-[120px]">
        <p className="text-xs text-slate-300 mb-2">Продолжите рассказ:</p>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-slate-200 h-7" />
        ))}
      </div>
    </div>
  )
}

/* ── 25. Maze ── */
function MazePreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  const grid = task.mazeGrid || []
  if (grid.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
        <p className="text-sm text-slate-400">Лабиринт</p>
        <p className="text-xs text-slate-300 mt-1">Найдите путь от старта к финишу</p>
      </div>
    )
  }
  return (
    <div className="inline-block">
      {grid.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((cell, ci) => {
            let bg = 'bg-white'
            let content = ''
            if (cell === 1) bg = 'bg-slate-800'
            else if (cell === 2) { bg = 'bg-emerald-100'; content = '▶' }
            else if (cell === 3) { bg = 'bg-rose-100'; content = '★' }
            return (
              <div key={ci} className={`w-7 h-7 border border-slate-200 flex items-center justify-center text-xs ${bg}`}>
                {content}
              </div>
            )
          })}
        </div>
      ))}
      {showAnswer && <p className="text-xs text-primary-500 mt-2 italic">Путь показан в ответах</p>}
    </div>
  )
}

/* ── 26. Draw illustration ── */
function DrawIllustrationPreview({ task }: { task: WorksheetTask }) {
  return (
    <div>
      {(task.drawPrompt || task.questionText) && (
        <p className="text-sm text-slate-700 mb-3">{task.drawPrompt || task.questionText}</p>
      )}
      <div className="border-2 border-dashed border-slate-300 rounded-lg aspect-[4/3] max-w-md flex items-center justify-center">
        <div className="text-center text-slate-300">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Нарисуйте здесь</p>
        </div>
      </div>
    </div>
  )
}

/* ── 27. Unknown words ── */
function UnknownWordsPreview({ task, showAnswer }: { task: WorksheetTask; showAnswer: boolean }) {
  return (
    <div>
      {task.readingText && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-line">
          {task.readingText}
        </div>
      )}
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Незнакомые слова:</div>
      {showAnswer && task.unknownWordsList && task.unknownWordsList.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {task.unknownWordsList.map((w, i) => (
            <span key={i} className="px-3 py-1 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">{w}</span>
          ))}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg p-3 min-h-[60px]">
          {[1, 2].map((n) => <div key={n} className="border-b border-slate-200 h-6" />)}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════ */
function getTaskAnswer(task: WorksheetTask): string {
  switch (task.type) {
    case 'multiple-choice':
      return task.options?.[task.correctIndex ?? -1] ?? '—'
    case 'match-columns':
      return Object.entries(task.pairs || {}).map(([l, r]) => `${l} → ${r}`).join(', ')
    case 'find-extra':
      return task.correctItem || '—'
    case 'true-false':
      return task.isTrue ? 'Истина' : 'Ложь'
    case 'short-answer':
      return task.answerText || '—'
    case 'fill-blanks':
      return task.blankAnswers?.join(', ') || '—'
    case 'crossword':
      return task.crosswordClues?.map((c) => `${c.number}${c.direction === 'across' ? 'г' : 'в'}: ${c.answer}`).join(', ') || '—'
    case 'find-error':
      return task.correctedText || '—'
    case 'sequence':
      return task.correctSequence?.join(' → ') || '—'
    case 'insert-letter':
      return task.correctWord || '—'
    case 'compare-numbers':
      return task.comparePairs?.map((p) => `${p.left} ${p.operator} ${p.right}`).join(', ') || '—'
    case 'step-by-step':
      return task.problemAnswer || '—'
    case 'fill-table':
      return task.tableAnswers?.map((a) => a.value).join(', ') || '—'
    case 'essay':
      return task.answerText || 'Развёрнутый ответ'
    case 'categorize':
      return task.categories?.map((c) => `${c.name}: ${c.items.join(', ')}`).join('; ') || '—'
    case 'continue-sequence':
      return task.sequenceAnswer?.join(', ') || '—'
    case 'anagram':
      return task.anagramAnswer || '—'
    case 'scenario':
    case 'text-analysis':
    case 'info-work':
      return task.passageQuestions?.map((q) => q.answer).join('; ') || '—'
    case 'filword':
      return task.filwordWords?.join(', ') || '—'
    case 'handwriting':
      return task.handwritingText || '—'
    case 'number-composition':
      return task.numberParts?.map((p) => `${p.a}+${p.b}`).join(', ') || '—'
    case 'continue-story':
      return 'Творческое задание'
    case 'maze':
      return 'Лабиринт'
    case 'draw-illustration':
      return 'Рисунок'
    case 'unknown-words':
      return task.unknownWordsList?.join(', ') || '—'
    default:
      return '—'
  }
}

/* ── Print HTML ── */
function generatePrintHTML(ws: Worksheet): string {
  const tasksHTML = ws.tasks.map((task, idx) => {
    let body = ''

    switch (task.type) {
      case 'multiple-choice':
        body = `
          <p style="margin-bottom:6px;color:#444;">${task.questionText || ''}</p>
          ${(task.options || []).map((o) => `
            <label style="display:flex;align-items:center;gap:8px;padding:4px 0;">
              <span style="display:inline-block;width:16px;height:16px;border:2px solid #999;border-radius:50%;flex-shrink:0;"></span>
              <span>${o}</span>
            </label>
          `).join('')}`
        break

      case 'match-columns':
        body = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
            <div>${(task.leftColumn || []).map((l) => `<div style="padding:3px 0;">${l}</div>`).join('')}</div>
            <div>${(task.rightColumn || []).map((r, i) => `<div style="padding:3px 0;">${String.fromCharCode(1072 + i)}. ${r}</div>`).join('')}</div>
          </div>`
        break

      case 'find-extra':
        body = `<div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${(task.items || task.options || []).map((item) => `<span style="padding:4px 12px;border:1px solid #ccc;border-radius:6px;font-size:13px;">${item}</span>`).join('')}
        </div>`
        break

      case 'true-false':
        body = `<p style="color:#444;">${task.questionText || ''}</p>
          <div style="display:flex;gap:16px;margin-top:6px;">
            <label style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:14px;height:14px;border:2px solid #999;border-radius:3px;"></span>Истина</label>
            <label style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:14px;height:14px;border:2px solid #999;border-radius:3px;"></span>Ложь</label>
          </div>`
        break

      case 'short-answer':
        body = `<p style="color:#444;">${task.questionText || ''}</p>
          <div style="border-bottom:2px solid #999;width:300px;height:24px;margin-top:8px;"></div>`
        break

      case 'fill-blanks':
        body = `<p style="color:#444;">${(task.blankText || '').replace(/___/g, '<span style="display:inline-block;width:80px;border-bottom:2px solid #999;"></span>')}</p>`
        break

      case 'crossword': {
        const clues = task.crosswordClues || []
        const layout = buildCrosswordLayout(clues)
        let gridHtml = ''
        if (layout.grid.length > 0) {
          gridHtml = `<table style="border-collapse:collapse;margin-bottom:12px;">${layout.grid.map((row) =>
            `<tr>${row.map((cell) => {
              if (!cell) return `<td style="width:30px;height:30px;"></td>`
              return `<td style="width:30px;height:30px;border:1px solid #999;position:relative;background:#fff;">${
                cell.number !== undefined ? `<span style="position:absolute;top:1px;left:2px;font-size:8px;font-weight:bold;color:#666;">${cell.number}</span>` : ''
              }&nbsp;</td>`
            }).join('')}</tr>`
          ).join('')}</table>`
        }
        const across = clues.filter((c) => c.direction === 'across')
        const down = clues.filter((c) => c.direction === 'down')
        body = `${gridHtml}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;">
            ${across.length > 0 ? `<div><b>По горизонтали:</b>${across.map((c) => `<div>${c.number}. ${c.clue}</div>`).join('')}</div>` : ''}
            ${down.length > 0 ? `<div><b>По вертикали:</b>${down.map((c) => `<div>${c.number}. ${c.clue}</div>`).join('')}</div>` : ''}
          </div>`
        break
      }

      case 'find-error':
        body = `<div style="background:#f9f9f9;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:13px;color:#444;">${task.errorText || task.questionText || ''}</div>
          <div style="border-bottom:2px solid #999;margin-top:12px;height:24px;"></div>`
        break

      case 'sequence':
        body = `<div style="font-size:13px;">${(task.sequenceItems || []).map((item) =>
          `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;">
            <span style="display:inline-block;width:24px;height:24px;border:2px solid #ccc;border-radius:50%;text-align:center;line-height:20px;font-size:11px;color:#999;">?</span>
            <span>${item}</span>
          </div>`
        ).join('')}</div>`
        break

      case 'insert-letter':
        body = `<div style="font-size:24px;letter-spacing:8px;font-family:monospace;">${(task.wordWithBlanks || '').split('').map((ch) =>
          ch === '_' ? '<span style="display:inline-block;width:24px;border-bottom:2px solid #999;">&nbsp;</span>' : ch
        ).join('')}</div>`
        break

      case 'compare-numbers':
        body = `<div style="font-size:16px;">${(task.comparePairs || []).map((p) =>
          `<div style="display:flex;align-items:center;gap:12px;padding:6px 0;">
            <span style="font-weight:bold;">${p.left}</span>
            <span style="display:inline-block;width:28px;height:28px;border:2px solid #ccc;border-radius:50%;text-align:center;line-height:24px;font-size:12px;">○</span>
            <span style="font-weight:bold;">${p.right}</span>
          </div>`
        ).join('')}</div>`
        break

      case 'step-by-step':
        body = `${task.problemCondition ? `<div style="background:#f9f9f9;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:13px;color:#444;margin-bottom:12px;"><b>Условие:</b> ${task.problemCondition}</div>` : ''}
          <div style="font-size:13px;">${[1, 2, 3].map((n) =>
            `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#eee;font-size:11px;font-weight:bold;color:#888;">${n}</span>
              <div style="flex:1;border-bottom:1px solid #ccc;min-height:20px;"></div>
            </div>`
          ).join('')}
          <div style="margin-top:8px;border-bottom:2px solid #999;width:200px;height:24px;font-weight:bold;">Ответ:</div>
          </div>`
        break

      case 'fill-table': {
        const headers = task.tableHeaders || []
        const rows = task.tableRows || []
        body = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr>${headers.map((h) => `<th style="border:1px solid #ccc;padding:6px 8px;background:#f5f5f5;text-align:left;">${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((row) =>
            `<tr>${row.map((cell) =>
              `<td style="border:1px solid #ccc;padding:6px 8px;">${cell === null || cell === '' ? '&nbsp;' : cell}</td>`
            ).join('')}</tr>`
          ).join('')}</tbody>
        </table>`
        break
      }

      case 'essay':
        body = `<p style="color:#444;">${task.questionText || ''}</p>
          <div style="border:1px solid #ddd;border-radius:6px;padding:12px;min-height:100px;">
            ${[1, 2, 3, 4, 5].map(() => '<div style="border-bottom:1px solid #eee;height:24px;"></div>').join('')}
          </div>`
        break

      case 'categorize': {
        const cats = task.categories || []
        const allItems = task.allCategoryItems || cats.flatMap((c) => c.items)
        body = `<div style="margin-bottom:12px;"><b style="font-size:12px;color:#888;">Слова:</b>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">${allItems.map((item) =>
            `<span style="padding:3px 10px;border:1px solid #ddd;border-radius:4px;font-size:12px;">${item}</span>`
          ).join('')}</div></div>
          <div style="display:grid;grid-template-columns:${'1fr '.repeat(Math.min(cats.length, 3))};gap:8px;">${cats.map((c) =>
            `<div style="border:1px solid #ccc;border-radius:6px;overflow:hidden;">
              <div style="background:#f5f5f5;padding:6px;text-align:center;font-weight:bold;font-size:13px;">${c.name}</div>
              <div style="min-height:60px;padding:8px;"></div>
            </div>`
          ).join('')}</div>`
        break
      }

      case 'continue-sequence': {
        const start = task.sequenceStart || []
        body = `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          ${start.map((s) => `<span style="padding:6px 14px;background:#f0f0f0;border:1px solid #ccc;border-radius:6px;font-weight:bold;">${s}</span>`).join('')}
          <span style="padding:6px 14px;border:2px dashed #ccc;border-radius:6px;color:#ccc;">?</span>
          <span style="padding:6px 14px;border:2px dashed #ccc;border-radius:6px;color:#ccc;">?</span>
          <span style="color:#999;">...</span>
        </div>`
        break
      }

      case 'anagram': {
        const letters = (task.scrambledWord || '').toUpperCase().split('')
        body = `<div style="display:flex;gap:6px;margin-bottom:12px;">
          ${letters.map((l) => `<div style="width:32px;height:32px;border:2px solid #e8a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;background:#fef3c7;">${l}</div>`).join('')}
        </div>
        <div style="display:flex;gap:6px;">
          ${letters.map(() => '<div style="width:32px;height:32px;border:2px dashed #ccc;border-radius:6px;"></div>').join('')}
        </div>`
        break
      }

      case 'scenario':
      case 'text-analysis':
      case 'info-work': {
        const txt = task.passageText || task.questionText || ''
        const qs = task.passageQuestions || []
        body = `<div style="background:#f9f9f9;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:13px;color:#444;margin-bottom:12px;">${txt}</div>
          ${qs.map((q, i) => `<div style="margin-bottom:8px;"><p style="font-size:13px;font-weight:500;">${i + 1}. ${q.question}</p><div style="border-bottom:1px solid #ccc;max-width:300px;height:20px;margin-left:16px;"></div></div>`).join('')}`
        break
      }

      case 'filword': {
        const fgrid = task.filwordGrid || []
        const fwords = task.filwordWords || []
        let gridHtml = ''
        if (fgrid.length > 0) {
          gridHtml = `<table style="border-collapse:collapse;margin-bottom:12px;">${fgrid.map((row) =>
            `<tr>${row.map((c) =>
              `<td style="width:28px;height:28px;border:1px solid #ccc;text-align:center;font-size:12px;font-weight:bold;">${c.toUpperCase()}</td>`
            ).join('')}</tr>`
          ).join('')}</table>`
        }
        body = `${gridHtml}<div style="font-size:13px;"><b>Найдите слова:</b> ${fwords.join(', ')}</div>`
        break
      }

      case 'handwriting':
        body = `<div style="font-size:24px;font-family:cursive,serif;color:#444;margin-bottom:12px;">${task.handwritingText || ''}</div>
          <div style="border:1px solid #ddd;border-radius:6px;padding:12px;">
            ${[1, 2, 3].map(() => '<div style="position:relative;height:36px;margin-bottom:6px;"><div style="position:absolute;bottom:0;width:100%;border-bottom:2px solid #ccc;"></div><div style="position:absolute;bottom:14px;width:100%;border-bottom:1px dashed #eee;"></div></div>').join('')}
          </div>`
        break

      case 'number-composition': {
        const t = task.targetNumber ?? 0
        body = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:48px;height:48px;border-radius:50%;background:#fef3c7;border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;">${t}</div>
          <span style="font-size:18px;color:#999;">=</span>
        </div>
        ${(task.numberParts || [{ a: 0, b: 0 }]).map(() =>
          `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
            <div style="width:36px;height:36px;border:2px solid #ccc;border-radius:6px;"></div>
            <span style="font-weight:bold;color:#999;">+</span>
            <div style="width:36px;height:36px;border:2px solid #ccc;border-radius:6px;"></div>
            <span style="color:#999;">=</span>
            <span style="font-weight:bold;">${t}</span>
          </div>`
        ).join('')}`
        break
      }

      case 'continue-story':
        body = `${task.storyBeginning ? `<div style="background:#fef3c7;padding:12px;border:1px solid #f59e0b;border-radius:6px;font-size:13px;font-style:italic;color:#444;margin-bottom:12px;">«${task.storyBeginning}»</div>` : ''}
          <div style="border:1px solid #ddd;border-radius:6px;padding:12px;min-height:100px;">
            <p style="font-size:11px;color:#ccc;margin-bottom:4px;">Продолжите рассказ:</p>
            ${[1, 2, 3, 4, 5].map(() => '<div style="border-bottom:1px solid #eee;height:24px;"></div>').join('')}
          </div>`
        break

      case 'maze': {
        const mg = task.mazeGrid || []
        if (mg.length > 0) {
          body = `<table style="border-collapse:collapse;">${mg.map((row) =>
            `<tr>${row.map((cell) => {
              let bg = '#fff'
              let content = '&nbsp;'
              if (cell === 1) bg = '#333'
              else if (cell === 2) { bg = '#d1fae5'; content = '▶' }
              else if (cell === 3) { bg = '#ffe4e6'; content = '★' }
              return `<td style="width:24px;height:24px;border:1px solid #ddd;text-align:center;font-size:10px;background:${bg};">${content}</td>`
            }).join('')}</tr>`
          ).join('')}</table>`
        } else {
          body = `<div style="border:2px dashed #ccc;border-radius:8px;padding:40px;text-align:center;color:#999;">Лабиринт</div>`
        }
        break
      }

      case 'draw-illustration':
        body = `<p style="color:#444;">${task.drawPrompt || task.questionText || ''}</p>
          <div style="border:2px dashed #ccc;border-radius:8px;aspect-ratio:4/3;max-width:400px;display:flex;align-items:center;justify-content:center;margin-top:8px;">
            <span style="color:#ccc;font-size:14px;">Нарисуйте здесь</span>
          </div>`
        break

      case 'unknown-words':
        body = `${task.readingText ? `<div style="background:#f9f9f9;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:13px;color:#444;margin-bottom:12px;">${task.readingText}</div>` : ''}
          <div style="font-size:12px;font-weight:bold;color:#888;margin-bottom:4px;">Незнакомые слова:</div>
          <div style="border:1px solid #ddd;border-radius:6px;padding:8px;min-height:40px;">
            ${[1, 2].map(() => '<div style="border-bottom:1px solid #eee;height:20px;"></div>').join('')}
          </div>`
        break

      default:
        body = `<p style="color:#888;font-style:italic;">${task.instruction}</p>`
    }

    return `
      <div style="border:1px solid #ddd;border-radius:8px;padding:20px;margin-bottom:16px;page-break-inside:avoid;">
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
          <span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#333;color:#fff;font-weight:bold;font-size:14px;flex-shrink:0;">${idx + 1}</span>
          <div>
            <div style="font-weight:bold;font-size:16px;">${task.title}</div>
            <div style="font-size:13px;color:#666;">${task.instruction}</div>
          </div>
        </div>
        ${body}
      </div>`
  }).join('')

  const answersHTML = ws.tasks.map((task, idx) =>
    `<div style="margin-bottom:4px;"><strong>${idx + 1}.</strong> ${getTaskAnswer(task)}</div>`
  ).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Рабочий лист</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px; color: #222; }
    @media print { body { padding: 16px; } .no-print { display: none; } }
    .answers { page-break-before: always; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; }
  </style></head><body>
    <h1 style="text-align:center;font-size:20px;margin-bottom:4px;">Рабочий лист по предмету: ${ws.subject}</h1>
    <div style="display:flex;justify-content:center;gap:24px;font-size:13px;color:#666;margin-bottom:24px;">
      <span>Имя: __________</span><span>Фамилия: __________</span><span>Класс: _____</span>
    </div>
    <div style="text-align:center;font-size:13px;color:#666;margin-bottom:24px;">Дата: __________</div>
    ${tasksHTML}
    <p style="text-align:center;margin-top:32px;color:#666;font-size:14px;">Удачи в выполнении заданий!</p>
    <div class="answers">
      <h2>Ответы</h2>
      ${answersHTML}
    </div>
  </body></html>`
}
