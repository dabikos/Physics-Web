import { useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { InteractiveTask, InteractiveTaskStep } from '@/types'

interface InteractiveTaskCardProps {
  task: InteractiveTask
  index: number
  expanded: boolean
  onToggle: () => void
}

const STEP_LABELS: Record<InteractiveTaskStep['type'], string> = {
  formula: 'Формула',
  substitution: 'Подстановка',
  calculation: 'Расчёт',
  text: 'Пояснение',
}

export function InteractiveTaskCard({ task, index, expanded, onToggle }: InteractiveTaskCardProps) {
  const { theme } = useTheme()

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/70' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'

  const difficultyLabel = useMemo(() => {
    if (task.difficulty === 'basic') return 'Базовый'
    if (task.difficulty === 'advanced') return 'Продвинутый'
    return 'Средний'
  }, [task.difficulty])

  const difficultyStyles = useMemo(() => {
    if (task.difficulty === 'basic') {
      return theme === 'dark'
        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }
    if (task.difficulty === 'advanced') {
      return theme === 'dark'
        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
        : 'bg-rose-50 text-rose-700 border border-rose-200'
    }
    return theme === 'dark'
      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
      : 'bg-amber-50 text-amber-700 border border-amber-200'
  }, [task.difficulty, theme])

  const formatStepContent = (step: InteractiveTaskStep) => {
    const raw = step.content.trim()
    if (!raw) return raw
    const isMathType = step.type === 'formula' || step.type === 'substitution' || step.type === 'calculation'
    if (!isMathType) return raw
    const hasMathWrapper = /\$|\\\(|\\\[/.test(raw)
    return hasMathWrapper ? raw : `$${raw}$`
  }

  const normalizeUnits = (input: string) => {
    if (!input) return input
    return input
      .replace(/([A-Za-zА-Яа-я]+)\/([A-Za-zА-Яа-я]+)(\d)\b/g, '$1/$2^$3')
      .replace(/([A-Za-zА-Яа-я]+)(\d)\b/g, '$1^$2')
  }

  const formatGivenLine = (symbol: string, value: string, unit?: string) => {
    const cleanSymbol = symbol.trim()
    const cleanValue = normalizeUnits(value).trim()
    const cleanUnit = unit ? normalizeUnits(unit).trim() : ''
    const math = cleanUnit ? `${cleanSymbol} = ${cleanValue}\\;${cleanUnit}` : `${cleanSymbol} = ${cleanValue}`
    return `$${math}$`
  }

  const formatFindLine = (symbol: string, unit?: string) => {
    const cleanSymbol = symbol.trim()
    const cleanUnit = unit ? normalizeUnits(unit).trim() : ''
    const math = cleanUnit ? `${cleanSymbol}\\;${cleanUnit}` : cleanSymbol
    return `$${math}$`
  }

  return (
    <Card className={`${bgCard} ${borderColor} p-6 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
            <span className={`font-bold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>{index + 1}</span>
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${textColor}`}>{task.title}</h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${difficultyStyles}`}>{difficultyLabel}</div>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onToggle}>
          {expanded ? 'Скрыть решение' : 'Показать решение'}
        </Button>
      </div>

      <div className="space-y-3">
        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-900/60 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
          <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Условие</p>
          <MarkdownRenderer content={task.condition} className={textColor} />
        </div>

        {task.given && task.given.length > 0 && (
          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-sky-300' : 'text-sky-700'}`}>Дано</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {task.given.map((item, idx) => (
                <div key={`${item.symbol}-${idx}`} className={`${textMuted} text-sm`}>
                  <MarkdownRenderer content={formatGivenLine(item.symbol, item.value, item.unit)} className={textColor} />
                  {item.name ? <span className="ml-2 text-xs opacity-70">({item.name})</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {task.find && (
          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>Найти</p>
            <div className={`${textMuted} text-sm`}>
              <MarkdownRenderer content={formatFindLine(task.find.symbol, task.find.unit)} className={textColor} />
              {task.find.name ? <span className="ml-2 text-xs opacity-70">({task.find.name})</span> : null}
            </div>
          </div>
        )}

        {task.answerType === 'choice' && task.options && task.options.length > 0 && (
          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>Варианты ответа</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {task.options.map((option, idx) => (
                <div key={`${task.id}-opt-${idx}`} className={`text-sm ${textColor}`}>
                  <MarkdownRenderer content={option} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="space-y-4">
          {task.hint && (
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200'}`}>
              <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}`}>Подсказка</p>
              <MarkdownRenderer content={task.hint} className={textColor} />
            </div>
          )}

          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <p className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>Пошаговое решение</p>
            <div className="space-y-3">
              {task.steps.map((step, stepIndex) => (
                <div key={step.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-100 text-amber-700'}`}>
                      <span className="text-xs font-semibold">{stepIndex + 1}</span>
                    </div>
                    <span className={`text-xs font-semibold ${textMuted}`}>{STEP_LABELS[step.type] || 'Шаг'}</span>
                    {step.description && <span className={`text-xs ${textMuted}`}>• {step.description}</span>}
                  </div>
                  <MarkdownRenderer content={formatStepContent(step)} className={textColor} />
                </div>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>Ответ</p>
            <MarkdownRenderer content={task.answer} className={textColor} />
          </div>
        </div>
      )}
    </Card>
  )
}
