import { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Pencil, Trash2, ChevronUp, ChevronDown, Copy, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Worksheet, WorksheetTask } from '@/types/worksheet'

interface Props {
  worksheet: Worksheet
  onSave: (worksheet: Worksheet) => void
  onBack: () => void
}

const BADGE_COLORS = [
  'bg-pink-500', 'bg-violet-500', 'bg-orange-500', 'bg-emerald-500',
  'bg-sky-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
]

export function WorksheetEditor({ worksheet, onSave, onBack }: Props) {
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<WorksheetTask[]>([...worksheet.tasks])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark'
    ? 'bg-white/[0.04] border border-white/[0.08]'
    : 'bg-white/80 border border-slate-200'

  const moveTask = useCallback((idx: number, dir: -1 | 1) => {
    setTasks((prev) => {
      const arr = [...prev]
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= arr.length) return prev
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const duplicateTask = useCallback((idx: number) => {
    setTasks((prev) => {
      const task = prev[idx]
      const clone: WorksheetTask = { ...task, id: `${task.id}-copy-${Date.now()}` }
      const arr = [...prev]
      arr.splice(idx + 1, 0, clone)
      return arr
    })
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<WorksheetTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    )
  }, [])

  const handleSave = () => {
    onSave({ ...worksheet, tasks })
  }

  return (
    <div className="space-y-6">
      <button onClick={() => { handleSave(); onBack() }}
        className={`text-sm ${textMuted} hover:text-primary-400 transition-colors flex items-center gap-1`}>
        ← Управление листом
      </button>

      <h1 className={`text-2xl font-bold ${textColor}`}>Редактирование заданий</h1>

      <div className={`flex items-center gap-2 text-sm ${textMuted}`}>
        <Info size={14} className="text-primary-400" />
        Ответы и значения видны только вам
      </div>

      <p className={`text-sm ${textMuted}`}>{worksheet.subject}, {worksheet.grade} класс</p>

      <div className="space-y-6">
        {tasks.map((task, idx) => (
          <div key={task.id}>
            <div className="flex items-center justify-between mb-2">
              <div className={`${BADGE_COLORS[idx % BADGE_COLORS.length]} text-white text-sm font-semibold px-4 py-1.5 rounded-full`}>
                {idx + 1} задание
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm"
                  onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}>
                  <Pencil size={13} /> Редактировать
                </Button>
                <button onClick={() => deleteTask(task.id)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-red-400' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`}>
                  <Trash2 size={16} />
                </button>
                <button onClick={() => moveTask(idx, -1)} disabled={idx === 0}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}`}>
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => moveTask(idx, 1)} disabled={idx === tasks.length - 1}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}`}>
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => duplicateTask(idx)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}`}>
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className={`rounded-2xl p-6 ${panelBg}`}>
              {editingTaskId === task.id ? (
                <TaskEditForm task={task} onUpdate={(u) => updateTask(task.id, u)} theme={theme} />
              ) : (
                <TaskDisplay task={task} theme={theme} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave}>
          Сохранить изменения
        </Button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   Task Display (read-only in editor) — all 27 types
   ════════════════════════════════════════════ */
function TaskDisplay({ task, theme }: { task: WorksheetTask; theme: string }) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const highlight = theme === 'dark' ? 'bg-primary-500/10 border-primary-500/30' : 'bg-primary-50 border-primary-300'
  const normal = theme === 'dark' ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white border-slate-200'

  return (
    <div>
      <h3 className={`text-lg font-bold ${textColor} mb-1`}>{task.title}</h3>
      <p className={`text-sm ${textMuted} mb-4`}>{task.instruction}</p>

      {/* ── multiple-choice ── */}
      {task.type === 'multiple-choice' && (
        <>
          {task.questionText && <p className={`text-sm ${textColor} mb-3`}>{task.questionText}</p>}
          <div className="space-y-2">
            {task.options?.map((opt, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${i === task.correctIndex ? highlight : normal}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  i === task.correctIndex ? 'border-primary-500 bg-primary-500' : theme === 'dark' ? 'border-white/30' : 'border-slate-300'
                }`}>
                  {i === task.correctIndex && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm ${i === task.correctIndex ? 'text-primary-300 font-semibold' : textMuted}`}>{opt}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── match-columns ── */}
      {task.type === 'match-columns' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className={`text-xs font-semibold ${textMuted} uppercase tracking-wider mb-2`}>Столбец 1</div>
            {task.leftColumn?.map((item, i) => (
              <div key={i} className={`text-sm ${textColor} py-1`}>{i + 1}. {item}</div>
            ))}
          </div>
          <div>
            <div className={`text-xs font-semibold ${textMuted} uppercase tracking-wider mb-2`}>Столбец 2</div>
            {task.rightColumn?.map((item, i) => (
              <div key={i} className={`text-sm ${textColor} py-1`}>
                <span className="text-primary-400 font-semibold mr-1">{String.fromCharCode(1072 + i)}.</span>{item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── find-extra ── */}
      {task.type === 'find-extra' && (
        <div className="flex flex-wrap gap-2">
          {(task.items || task.options || []).map((item) => (
            <span key={item} className={`px-3 py-1.5 rounded-lg border text-sm ${
              item === task.correctItem
                ? theme === 'dark' ? 'bg-primary-500/10 border-primary-500/30 text-primary-300 font-semibold' : 'bg-primary-50 border-primary-300 text-primary-700 font-semibold'
                : theme === 'dark' ? 'bg-white/[0.03] border-white/[0.08] text-white/60' : 'bg-white border-slate-200 text-slate-600'
            }`}>{item}</span>
          ))}
        </div>
      )}

      {/* ── true-false ── */}
      {task.type === 'true-false' && (
        <>
          {task.questionText && <p className={`text-sm ${textColor} mb-3`}>{task.questionText}</p>}
          <p className={`text-sm font-semibold ${task.isTrue ? 'text-emerald-400' : 'text-rose-400'}`}>
            Ответ: {task.isTrue ? 'Истина' : 'Ложь'}
          </p>
        </>
      )}

      {/* ── short-answer ── */}
      {task.type === 'short-answer' && (
        <>
          {task.questionText && <p className={`text-sm ${textColor} mb-3`}>{task.questionText}</p>}
          <p className="text-sm text-primary-400 font-semibold">Ответ: {task.answerText}</p>
        </>
      )}

      {/* ── fill-blanks ── */}
      {task.type === 'fill-blanks' && (
        <p className={`text-sm ${textColor}`}>
          {task.blankText?.replace(/___/g, ' [___] ')}
          {task.blankAnswers && task.blankAnswers.length > 0 && (
            <span className="block mt-2 text-primary-400 font-semibold">Ответы: {task.blankAnswers.join(', ')}</span>
          )}
        </p>
      )}

      {/* ── crossword ── */}
      {task.type === 'crossword' && (
        <div>
          {task.crosswordClues && task.crosswordClues.length > 0 && (
            <div className="space-y-1">
              {task.crosswordClues.map((c, i) => (
                <div key={i} className={`text-sm ${textMuted}`}>
                  <span className="font-semibold">{c.number}{c.direction === 'across' ? 'г' : 'в'}.</span> {c.clue}
                  <span className="text-primary-400 ml-1">({c.answer})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── find-error ── */}
      {task.type === 'find-error' && (
        <div>
          <p className={`text-sm ${textColor} mb-2`}>{task.errorText || task.questionText}</p>
          {task.correctedText && <p className="text-sm text-primary-400 font-semibold">Исправление: {task.correctedText}</p>}
          {task.errorExplanation && <p className={`text-xs ${textMuted} mt-1 italic`}>{task.errorExplanation}</p>}
        </div>
      )}

      {/* ── sequence ── */}
      {task.type === 'sequence' && (
        <div>
          <div className={`text-xs ${textMuted} mb-1`}>Элементы (перемешаны):</div>
          <div className="space-y-1">
            {task.sequenceItems?.map((item, i) => (
              <div key={i} className={`text-sm ${textColor} py-1 px-3 rounded border ${normal}`}>{item}</div>
            ))}
          </div>
          {task.correctSequence && (
            <p className="text-sm text-primary-400 font-semibold mt-2">Порядок: {task.correctSequence.join(' → ')}</p>
          )}
        </div>
      )}

      {/* ── insert-letter ── */}
      {task.type === 'insert-letter' && (
        <div>
          <p className={`text-lg font-mono ${textColor}`}>{task.wordWithBlanks}</p>
          {task.correctWord && <p className="text-sm text-primary-400 font-semibold mt-1">Ответ: {task.correctWord}</p>}
        </div>
      )}

      {/* ── compare-numbers ── */}
      {task.type === 'compare-numbers' && (
        <div className="space-y-1">
          {task.comparePairs?.map((p, i) => (
            <div key={i} className={`text-sm ${textColor}`}>
              {p.left} <span className="text-primary-400 font-bold">{p.operator}</span> {p.right}
            </div>
          ))}
        </div>
      )}

      {/* ── step-by-step ── */}
      {task.type === 'step-by-step' && (
        <div>
          {task.problemCondition && <p className={`text-sm ${textColor} mb-2`}><span className="font-semibold">Условие:</span> {task.problemCondition}</p>}
          {task.solutionSteps && (
            <ol className={`list-decimal list-inside text-sm ${textMuted} space-y-1`}>
              {task.solutionSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
          {task.problemAnswer && <p className="text-sm text-primary-400 font-semibold mt-2">Ответ: {task.problemAnswer}</p>}
        </div>
      )}

      {/* ── fill-table ── */}
      {task.type === 'fill-table' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {task.tableHeaders?.map((h, i) => (
                  <th key={i} className={`border px-2 py-1 text-left font-semibold ${theme === 'dark' ? 'border-white/10 text-white/80' : 'border-slate-300 text-slate-700 bg-slate-50'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {task.tableRows?.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`border px-2 py-1 ${theme === 'dark' ? 'border-white/10' : 'border-slate-300'} ${cell === null ? 'bg-yellow-500/10' : ''}`}>
                      <span className={cell === null ? 'text-primary-400 italic' : textColor}>{cell === null ? '___' : cell}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {task.tableAnswers && task.tableAnswers.length > 0 && (
            <p className="text-sm text-primary-400 font-semibold mt-2">
              Ответы: {task.tableAnswers.map((a) => a.value).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* ── essay ── */}
      {task.type === 'essay' && (
        <>
          {task.questionText && <p className={`text-sm ${textColor}`}>{task.questionText}</p>}
          {task.answerText && <p className="text-sm text-primary-400 font-semibold mt-1">Примерный ответ: {task.answerText}</p>}
        </>
      )}

      {/* ── categorize ── */}
      {task.type === 'categorize' && (
        <div>
          {task.categories?.map((cat, i) => (
            <div key={i} className="mb-2">
              <span className={`text-sm font-semibold ${textColor}`}>{cat.name}: </span>
              <span className={`text-sm ${textMuted}`}>{cat.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── continue-sequence ── */}
      {task.type === 'continue-sequence' && (
        <div>
          <p className={`text-sm ${textColor}`}>Начало: {task.sequenceStart?.join(', ')}</p>
          {task.sequenceAnswer && <p className="text-sm text-primary-400 font-semibold mt-1">Продолжение: {task.sequenceAnswer.join(', ')}</p>}
        </div>
      )}

      {/* ── anagram ── */}
      {task.type === 'anagram' && (
        <div>
          <p className={`text-sm ${textColor}`}>Буквы: {task.scrambledWord}</p>
          {task.anagramHint && <p className={`text-xs ${textMuted} italic`}>Подсказка: {task.anagramHint}</p>}
          {task.anagramAnswer && <p className="text-sm text-primary-400 font-semibold mt-1">Ответ: {task.anagramAnswer}</p>}
        </div>
      )}

      {/* ── scenario / text-analysis / info-work ── */}
      {(task.type === 'scenario' || task.type === 'text-analysis' || task.type === 'info-work') && (
        <div>
          {task.passageText && <p className={`text-sm ${textColor} mb-2 whitespace-pre-line`}>{task.passageText}</p>}
          {task.passageQuestions && task.passageQuestions.length > 0 && (
            <div className="space-y-1 mt-2">
              {task.passageQuestions.map((q, i) => (
                <div key={i} className={`text-sm`}>
                  <span className={textColor}>{i + 1}. {q.question}</span>
                  <span className="text-primary-400 ml-2">→ {q.answer}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── filword ── */}
      {task.type === 'filword' && (
        <div>
          {task.filwordGrid && task.filwordGrid.length > 0 && (
            <div className={`text-xs font-mono ${textMuted} mb-2`}>
              Сетка: {task.filwordGrid.length}×{task.filwordGrid[0]?.length}
            </div>
          )}
          {task.filwordWords && <p className={`text-sm ${textColor}`}>Слова: {task.filwordWords.join(', ')}</p>}
        </div>
      )}

      {/* ── handwriting ── */}
      {task.type === 'handwriting' && (
        <p className={`text-sm ${textColor}`}>Текст: {task.handwritingText}</p>
      )}

      {/* ── number-composition ── */}
      {task.type === 'number-composition' && (
        <div>
          <p className={`text-sm ${textColor}`}>Число: {task.targetNumber}</p>
          {task.numberParts && (
            <p className={`text-sm ${textMuted}`}>
              Состав: {task.numberParts.map((p) => `${p.a}+${p.b}`).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* ── continue-story ── */}
      {task.type === 'continue-story' && (
        <p className={`text-sm ${textColor} italic`}>«{task.storyBeginning}»</p>
      )}

      {/* ── maze ── */}
      {task.type === 'maze' && (
        <p className={`text-sm ${textMuted}`}>Лабиринт {task.mazeGrid ? `${task.mazeGrid.length}×${task.mazeGrid[0]?.length}` : ''}</p>
      )}

      {/* ── draw-illustration ── */}
      {task.type === 'draw-illustration' && (
        <p className={`text-sm ${textColor}`}>{task.drawPrompt || task.questionText}</p>
      )}

      {/* ── unknown-words ── */}
      {task.type === 'unknown-words' && (
        <div>
          {task.readingText && <p className={`text-sm ${textColor} mb-1 line-clamp-3`}>{task.readingText}</p>}
          {task.unknownWordsList && <p className="text-sm text-primary-400 font-semibold">Слова: {task.unknownWordsList.join(', ')}</p>}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   Task Edit Form — all 27 types
   ════════════════════════════════════════════ */
function TaskEditForm({
  task,
  onUpdate,
  theme,
}: {
  task: WorksheetTask
  onUpdate: (u: Partial<WorksheetTask>) => void
  theme: string
}) {
  const inputCls = `w-full bg-transparent border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors ${
    theme === 'dark'
      ? 'border-white/[0.15] text-white placeholder-white/30'
      : 'border-slate-300 text-slate-900 placeholder-slate-400'
  }`
  const labelCls = `text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`

  return (
    <div className="space-y-3">
      {/* Common fields */}
      <div>
        <label className={labelCls}>Название</label>
        <input className={inputCls} value={task.title} onChange={(e) => onUpdate({ title: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>Инструкция</label>
        <input className={inputCls} value={task.instruction} onChange={(e) => onUpdate({ instruction: e.target.value })} />
      </div>

      {/* ── multiple-choice ── */}
      {task.type === 'multiple-choice' && (
        <>
          <div>
            <label className={labelCls}>Вопрос</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.questionText || ''} onChange={(e) => onUpdate({ questionText: e.target.value })} />
          </div>
          {task.options?.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name={`correct-${task.id}`} checked={i === task.correctIndex}
                onChange={() => onUpdate({ correctIndex: i })} />
              <input className={`flex-1 ${inputCls}`} value={opt}
                onChange={(e) => {
                  const opts = [...(task.options || [])]
                  opts[i] = e.target.value
                  onUpdate({ options: opts })
                }} />
            </div>
          ))}
        </>
      )}

      {/* ── find-extra ── */}
      {task.type === 'find-extra' && (
        <>
          {(task.items || task.options || []).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name={`extra-${task.id}`} checked={item === task.correctItem}
                onChange={() => onUpdate({ correctItem: item })} />
              <input className={`flex-1 ${inputCls}`} value={item}
                onChange={(e) => {
                  const items = [...(task.items || task.options || [])]
                  const oldVal = items[i]
                  items[i] = e.target.value
                  const updates: Partial<WorksheetTask> = { items }
                  if (task.correctItem === oldVal) updates.correctItem = e.target.value
                  onUpdate(updates)
                }} />
            </div>
          ))}
        </>
      )}

      {/* ── true-false ── */}
      {task.type === 'true-false' && (
        <>
          <div>
            <label className={labelCls}>Утверждение</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.questionText || ''} onChange={(e) => onUpdate({ questionText: e.target.value })} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name={`tf-${task.id}`} checked={task.isTrue === true} onChange={() => onUpdate({ isTrue: true })} /> Истина
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name={`tf-${task.id}`} checked={task.isTrue === false} onChange={() => onUpdate({ isTrue: false })} /> Ложь
            </label>
          </div>
        </>
      )}

      {/* ── short-answer ── */}
      {task.type === 'short-answer' && (
        <>
          <div>
            <label className={labelCls}>Вопрос</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.questionText || ''} onChange={(e) => onUpdate({ questionText: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Правильный ответ</label>
            <input className={inputCls} value={task.answerText || ''} onChange={(e) => onUpdate({ answerText: e.target.value })} />
          </div>
        </>
      )}

      {/* ── fill-blanks ── */}
      {task.type === 'fill-blanks' && (
        <>
          <div>
            <label className={labelCls}>Текст с пропусками (используйте ___ для пропусков)</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.blankText || ''} onChange={(e) => onUpdate({ blankText: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Ответы (через запятую)</label>
            <input className={inputCls} value={task.blankAnswers?.join(', ') || ''}
              onChange={(e) => onUpdate({ blankAnswers: e.target.value.split(',').map((s) => s.trim()) })} />
          </div>
        </>
      )}

      {/* ── match-columns ── */}
      {task.type === 'match-columns' && (
        <>
          <div>
            <label className={labelCls}>Левый столбец (каждый элемент на новой строке)</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.leftColumn?.join('\n') || ''}
              onChange={(e) => onUpdate({ leftColumn: e.target.value.split('\n') })} />
          </div>
          <div>
            <label className={labelCls}>Правый столбец (каждый элемент на новой строке)</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.rightColumn?.join('\n') || ''}
              onChange={(e) => onUpdate({ rightColumn: e.target.value.split('\n') })} />
          </div>
        </>
      )}

      {/* ── crossword ── */}
      {task.type === 'crossword' && (
        <>
          {task.crosswordClues?.map((clue, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                {clue.number}{clue.direction === 'across' ? 'г' : 'в'}
              </span>
              <input className={`flex-1 ${inputCls}`} value={clue.clue} placeholder="Определение"
                onChange={(e) => {
                  const clues = [...(task.crosswordClues || [])]
                  clues[i] = { ...clues[i], clue: e.target.value }
                  onUpdate({ crosswordClues: clues })
                }} />
              <input className={`w-32 ${inputCls}`} value={clue.answer} placeholder="Ответ"
                onChange={(e) => {
                  const clues = [...(task.crosswordClues || [])]
                  clues[i] = { ...clues[i], answer: e.target.value }
                  onUpdate({ crosswordClues: clues })
                }} />
            </div>
          ))}
        </>
      )}

      {/* ── find-error ── */}
      {task.type === 'find-error' && (
        <>
          <div>
            <label className={labelCls}>Текст с ошибкой</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.errorText || ''} onChange={(e) => onUpdate({ errorText: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Исправленный текст</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.correctedText || ''} onChange={(e) => onUpdate({ correctedText: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Объяснение ошибки</label>
            <input className={inputCls} value={task.errorExplanation || ''} onChange={(e) => onUpdate({ errorExplanation: e.target.value })} />
          </div>
        </>
      )}

      {/* ── sequence ── */}
      {task.type === 'sequence' && (
        <>
          <div>
            <label className={labelCls}>Элементы (каждый на новой строке, в перемешанном порядке)</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={task.sequenceItems?.join('\n') || ''}
              onChange={(e) => onUpdate({ sequenceItems: e.target.value.split('\n').filter(Boolean) })} />
          </div>
          <div>
            <label className={labelCls}>Правильный порядок (каждый на новой строке)</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={task.correctSequence?.join('\n') || ''}
              onChange={(e) => onUpdate({ correctSequence: e.target.value.split('\n').filter(Boolean) })} />
          </div>
        </>
      )}

      {/* ── insert-letter ── */}
      {task.type === 'insert-letter' && (
        <>
          <div>
            <label className={labelCls}>Слово с пропусками (используйте _ для пропущенных букв)</label>
            <input className={inputCls} value={task.wordWithBlanks || ''} onChange={(e) => onUpdate({ wordWithBlanks: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Правильное слово</label>
            <input className={inputCls} value={task.correctWord || ''} onChange={(e) => onUpdate({ correctWord: e.target.value })} />
          </div>
        </>
      )}

      {/* ── compare-numbers ── */}
      {task.type === 'compare-numbers' && (
        <>
          {task.comparePairs?.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={`w-24 ${inputCls}`} value={pair.left} placeholder="Левое"
                onChange={(e) => {
                  const pairs = [...(task.comparePairs || [])]
                  pairs[i] = { ...pairs[i], left: e.target.value }
                  onUpdate({ comparePairs: pairs })
                }} />
              <select className={`w-16 ${inputCls}`} value={pair.operator}
                onChange={(e) => {
                  const pairs = [...(task.comparePairs || [])]
                  pairs[i] = { ...pairs[i], operator: e.target.value as '>' | '<' | '=' }
                  onUpdate({ comparePairs: pairs })
                }}>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="=">=</option>
              </select>
              <input className={`w-24 ${inputCls}`} value={pair.right} placeholder="Правое"
                onChange={(e) => {
                  const pairs = [...(task.comparePairs || [])]
                  pairs[i] = { ...pairs[i], right: e.target.value }
                  onUpdate({ comparePairs: pairs })
                }} />
            </div>
          ))}
        </>
      )}

      {/* ── step-by-step ── */}
      {task.type === 'step-by-step' && (
        <>
          <div>
            <label className={labelCls}>Условие задачи</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.problemCondition || ''} onChange={(e) => onUpdate({ problemCondition: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Шаги решения (каждый на новой строке)</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={task.solutionSteps?.join('\n') || ''}
              onChange={(e) => onUpdate({ solutionSteps: e.target.value.split('\n').filter(Boolean) })} />
          </div>
          <div>
            <label className={labelCls}>Ответ</label>
            <input className={inputCls} value={task.problemAnswer || ''} onChange={(e) => onUpdate({ problemAnswer: e.target.value })} />
          </div>
        </>
      )}

      {/* ── fill-table ── */}
      {task.type === 'fill-table' && (
        <>
          <div>
            <label className={labelCls}>Заголовки столбцов (через запятую)</label>
            <input className={inputCls} value={task.tableHeaders?.join(', ') || ''}
              onChange={(e) => onUpdate({ tableHeaders: e.target.value.split(',').map((s) => s.trim()) })} />
          </div>
          <div>
            <label className={labelCls}>Ответы для пустых ячеек (через запятую)</label>
            <input className={inputCls} value={task.tableAnswers?.map((a) => a.value).join(', ') || ''}
              onChange={(e) => onUpdate({
                tableAnswers: e.target.value.split(',').map((v, i) => ({
                  row: Math.floor(i / (task.tableHeaders?.length || 1)),
                  col: i % (task.tableHeaders?.length || 1),
                  value: v.trim(),
                })),
              })} />
          </div>
        </>
      )}

      {/* ── essay ── */}
      {task.type === 'essay' && (
        <>
          <div>
            <label className={labelCls}>Вопрос / тема эссе</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.questionText || ''} onChange={(e) => onUpdate({ questionText: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Примерный ответ (необязательно)</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={task.answerText || ''} onChange={(e) => onUpdate({ answerText: e.target.value })} />
          </div>
        </>
      )}

      {/* ── categorize ── */}
      {task.type === 'categorize' && (
        <>
          {task.categories?.map((cat, i) => (
            <div key={i}>
              <label className={labelCls}>Категория {i + 1}: Название</label>
              <input className={inputCls} value={cat.name}
                onChange={(e) => {
                  const cats = [...(task.categories || [])]
                  cats[i] = { ...cats[i], name: e.target.value }
                  onUpdate({ categories: cats })
                }} />
              <label className={`${labelCls} mt-1`}>Элементы (через запятую)</label>
              <input className={inputCls} value={cat.items.join(', ')}
                onChange={(e) => {
                  const cats = [...(task.categories || [])]
                  cats[i] = { ...cats[i], items: e.target.value.split(',').map((s) => s.trim()) }
                  onUpdate({ categories: cats })
                }} />
            </div>
          ))}
        </>
      )}

      {/* ── continue-sequence ── */}
      {task.type === 'continue-sequence' && (
        <>
          <div>
            <label className={labelCls}>Начало последовательности (через запятую)</label>
            <input className={inputCls} value={task.sequenceStart?.join(', ') || ''}
              onChange={(e) => onUpdate({ sequenceStart: e.target.value.split(',').map((s) => s.trim()) })} />
          </div>
          <div>
            <label className={labelCls}>Продолжение (ответ, через запятую)</label>
            <input className={inputCls} value={task.sequenceAnswer?.join(', ') || ''}
              onChange={(e) => onUpdate({ sequenceAnswer: e.target.value.split(',').map((s) => s.trim()) })} />
          </div>
        </>
      )}

      {/* ── anagram ── */}
      {task.type === 'anagram' && (
        <>
          <div>
            <label className={labelCls}>Перемешанные буквы</label>
            <input className={inputCls} value={task.scrambledWord || ''} onChange={(e) => onUpdate({ scrambledWord: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Правильное слово</label>
            <input className={inputCls} value={task.anagramAnswer || ''} onChange={(e) => onUpdate({ anagramAnswer: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Подсказка (необязательно)</label>
            <input className={inputCls} value={task.anagramHint || ''} onChange={(e) => onUpdate({ anagramHint: e.target.value })} />
          </div>
        </>
      )}

      {/* ── scenario / text-analysis / info-work ── */}
      {(task.type === 'scenario' || task.type === 'text-analysis' || task.type === 'info-work') && (
        <>
          <div>
            <label className={labelCls}>Текст / информация</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={task.passageText || ''}
              onChange={(e) => onUpdate({ passageText: e.target.value })} />
          </div>
          {task.passageQuestions?.map((q, i) => (
            <div key={i} className="flex gap-2">
              <input className={`flex-1 ${inputCls}`} value={q.question} placeholder={`Вопрос ${i + 1}`}
                onChange={(e) => {
                  const qs = [...(task.passageQuestions || [])]
                  qs[i] = { ...qs[i], question: e.target.value }
                  onUpdate({ passageQuestions: qs })
                }} />
              <input className={`w-40 ${inputCls}`} value={q.answer} placeholder="Ответ"
                onChange={(e) => {
                  const qs = [...(task.passageQuestions || [])]
                  qs[i] = { ...qs[i], answer: e.target.value }
                  onUpdate({ passageQuestions: qs })
                }} />
            </div>
          ))}
        </>
      )}

      {/* ── filword ── */}
      {task.type === 'filword' && (
        <>
          <div>
            <label className={labelCls}>Слова для поиска (через запятую)</label>
            <input className={inputCls} value={task.filwordWords?.join(', ') || ''}
              onChange={(e) => onUpdate({ filwordWords: e.target.value.split(',').map((s) => s.trim()) })} />
          </div>
        </>
      )}

      {/* ── handwriting ── */}
      {task.type === 'handwriting' && (
        <div>
          <label className={labelCls}>Текст для прописи</label>
          <textarea className={`${inputCls} min-h-[60px]`} value={task.handwritingText || ''}
            onChange={(e) => onUpdate({ handwritingText: e.target.value })} />
        </div>
      )}

      {/* ── number-composition ── */}
      {task.type === 'number-composition' && (
        <>
          <div>
            <label className={labelCls}>Целевое число</label>
            <input type="number" className={inputCls} value={task.targetNumber ?? ''}
              onChange={(e) => onUpdate({ targetNumber: parseInt(e.target.value) || 0 })} />
          </div>
          {task.numberParts?.map((part, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="number" className={`w-20 ${inputCls}`} value={part.a}
                onChange={(e) => {
                  const parts = [...(task.numberParts || [])]
                  parts[i] = { ...parts[i], a: parseInt(e.target.value) || 0 }
                  onUpdate({ numberParts: parts })
                }} />
              <span className={theme === 'dark' ? 'text-white/40' : 'text-slate-400'}>+</span>
              <input type="number" className={`w-20 ${inputCls}`} value={part.b}
                onChange={(e) => {
                  const parts = [...(task.numberParts || [])]
                  parts[i] = { ...parts[i], b: parseInt(e.target.value) || 0 }
                  onUpdate({ numberParts: parts })
                }} />
            </div>
          ))}
        </>
      )}

      {/* ── continue-story ── */}
      {task.type === 'continue-story' && (
        <div>
          <label className={labelCls}>Начало рассказа</label>
          <textarea className={`${inputCls} min-h-[80px]`} value={task.storyBeginning || ''}
            onChange={(e) => onUpdate({ storyBeginning: e.target.value })} />
        </div>
      )}

      {/* ── draw-illustration ── */}
      {task.type === 'draw-illustration' && (
        <div>
          <label className={labelCls}>Задание для рисунка</label>
          <textarea className={`${inputCls} min-h-[60px]`} value={task.drawPrompt || ''}
            onChange={(e) => onUpdate({ drawPrompt: e.target.value })} />
        </div>
      )}

      {/* ── unknown-words ── */}
      {task.type === 'unknown-words' && (
        <>
          <div>
            <label className={labelCls}>Текст для чтения</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={task.readingText || ''}
              onChange={(e) => onUpdate({ readingText: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Незнакомые слова (через запятую)</label>
            <input className={inputCls} value={task.unknownWordsList?.join(', ') || ''}
              onChange={(e) => onUpdate({ unknownWordsList: e.target.value.split(',').map((s) => s.trim()) })} />
          </div>
        </>
      )}

      {/* ── maze ── */}
      {task.type === 'maze' && (
        <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
          Лабиринт генерируется автоматически. Размер: {task.mazeGrid?.length || 0}×{task.mazeGrid?.[0]?.length || 0}
        </p>
      )}
    </div>
  )
}
