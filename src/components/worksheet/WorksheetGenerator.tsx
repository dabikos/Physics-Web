import { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Layers, Sparkles, CheckSquare, Zap, Image, Paperclip, ChevronDown, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  type GeneratorSettings,
  type TaskType,
  TASK_TYPE_ORDER,
  TASK_TYPE_LABELS,
  IMAGE_TASK_TYPES,
} from '@/types/worksheet'

interface Props {
  onGenerate: (settings: GeneratorSettings) => void
  isLoading: boolean
  generationsLeft: number
}

const TASK_COUNTS = [5, 10, 15, 20]

/* inline editable field — defined outside component to keep stable reference */
function InlineInput({
  value,
  onChange,
  italic = true,
  placeholder = '',
}: {
  value: string
  onChange: (v: string) => void
  italic?: boolean
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent border-b-2 border-primary-400/60 outline-none px-1 py-0.5 ${italic ? 'italic' : 'font-bold'} text-primary-300 focus:border-primary-400 transition-colors placeholder:text-primary-300/30 min-w-[80px]`}
      style={{ width: Math.max(value.length * 11 + 20, 80) }}
    />
  )
}

export function WorksheetGenerator({ onGenerate, isLoading, generationsLeft }: Props) {
  const { theme } = useTheme()

  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [topic, setTopic] = useState('')
  const [preferences, setPreferences] = useState('')
  const [taskCount, setTaskCount] = useState(5)
  const [selectedTypes, setSelectedTypes] = useState<TaskType[]>([])
  const [showCountDropdown, setShowCountDropdown] = useState(false)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark'
    ? 'bg-white/[0.04] border border-white/[0.08]'
    : 'bg-white/80 border border-slate-200'
  const chipDefault = theme === 'dark'
    ? 'bg-white/[0.06] border border-white/[0.1] text-white/70 hover:bg-white/[0.12] hover:text-white'
    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
  const chipActive = theme === 'dark'
    ? 'bg-primary-500/20 border border-primary-400/40 text-primary-300'
    : 'bg-primary-50 border border-primary-300 text-primary-700'

  const toggleType = useCallback((type: TaskType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const handleGenerate = () => {
    onGenerate({ subject, grade, topic, preferences, taskCount, selectedTypes })
  }

  return (
    <div className="space-y-4">
      {/* ─── Generations counter ─── */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${panelBg}`}>
          <Zap size={16} className="text-primary-400" />
          <span className={`text-sm ${textColor}`}>Генераций: {generationsLeft}</span>
        </div>
        <button className={`w-8 h-8 rounded-full flex items-center justify-center ${panelBg} ${textMuted} hover:text-primary-400 transition-colors`}>
          <Plus size={16} />
        </button>
      </div>

      {/* ─── Prompt template ─── */}
      <div className={`rounded-2xl p-6 ${panelBg}`}>
        <p className={`text-lg leading-relaxed ${textColor}`}>
          Я хочу сделать{' '}
          <span className="font-bold text-primary-300">задания</span>
          <sup className="text-primary-400">*</sup>{' '}
          по предмету{' '}
          <InlineInput value={subject} onChange={setSubject} placeholder="Предмет" />{' '}
          для{' '}
          <InlineInput value={grade} onChange={setGrade} italic={false} placeholder="1-11" />{' '}
          класса по теме{' '}
          <InlineInput value={topic} onChange={setTopic} placeholder="Тема" />.
        </p>
        <p className={`text-lg leading-relaxed ${textColor} mt-1`}>
          Учитывай мои пожелания:{' '}
          <InlineInput value={preferences} onChange={setPreferences} placeholder="формат, сложность" />.
        </p>
      </div>

      {/* ─── Controls row ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${panelBg} ${textColor} transition-colors`}
            onClick={() => setShowCountDropdown(!showCountDropdown)}
          >
            {taskCount} заданий <ChevronDown size={14} />
          </button>
          {showCountDropdown && (
            <div className={`absolute top-full mt-1 left-0 rounded-xl ${panelBg} shadow-xl z-20 py-1 min-w-[120px]`}>
              {TASK_COUNTS.map((n) => (
                <button key={n}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${n === taskCount ? 'text-primary-400 font-semibold' : textMuted} ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  onClick={() => { setTaskCount(n); setShowCountDropdown(false) }}>
                  {n} заданий
                </button>
              ))}
            </div>
          )}
        </div>

        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${panelBg} ${textColor} transition-colors`}>
          <Image size={16} /> Картинка
        </button>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${panelBg} ${textColor} transition-colors`}>
          <Paperclip size={16} /> Файл
        </button>

        <div className="flex-1" />

        <Button variant="primary" onClick={handleGenerate} disabled={isLoading}>
          <span className="flex items-center gap-2">
            {isLoading ? 'Генерация...' : 'Создать'} <Zap size={14} />1
          </span>
        </Button>
      </div>

      {/* ─── Task count section ─── */}
      <div className={`rounded-2xl p-6 ${panelBg}`}>
        <div className="flex items-center gap-3 mb-4">
          <Layers size={20} className="text-primary-400" />
          <span className={`font-semibold ${textColor}`}>Изменить количество заданий</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TASK_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setTaskCount(n)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                n === taskCount ? chipActive : chipDefault
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Image tasks section (Pro) ─── */}
      <div className={`rounded-2xl p-6 ${panelBg}`}>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles size={20} className="text-primary-400" />
          <span className={`font-semibold ${textColor}`}>Добавить задания с генерацией изображений</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 font-semibold">Профи</span>
        </div>
        <p className={`text-sm mb-4 ${textMuted}`}>Стоимость: +<Zap size={12} className="inline" />0</p>
        <div className="flex flex-wrap gap-2">
          {IMAGE_TASK_TYPES.map((label) => (
            <button key={label}
              className={`px-4 py-2 rounded-full text-sm transition-all ${chipDefault} cursor-default opacity-60`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Task type selection ─── */}
      <div className={`rounded-2xl p-6 ${panelBg}`}>
        <div className="flex items-center gap-3 mb-4">
          <CheckSquare size={20} className="text-primary-400" />
          <span className={`font-semibold ${textColor}`}>Выбрать нужные задания</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TASK_TYPE_ORDER.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedTypes.includes(type) ? chipActive : chipDefault
              }`}
            >
              {TASK_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
