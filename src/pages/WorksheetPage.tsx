import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  FileSpreadsheet, Plus, Clock, Trash2, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WorksheetGenerator } from '@/components/worksheet/WorksheetGenerator'
import { WorksheetPreview } from '@/components/worksheet/WorksheetPreview'
import { WorksheetEditor } from '@/components/worksheet/WorksheetEditor'
import { generateText } from '@/lib/githubAI'
import type {
  Worksheet,
  WorksheetTask,
  GeneratorSettings,
} from '@/types/worksheet'

/* ═══════════════════════════════════════════
   LocalStorage persistence
   ═══════════════════════════════════════════ */
const STORAGE_KEY = 'physics-ai-worksheets'

function loadWorksheets(): Worksheet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveWorksheets(ws: Worksheet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ws))
}

/* ═══════════════════════════════════════════
   AI generation helpers
   ═══════════════════════════════════════════ */

function buildPrompt(s: GeneratorSettings): string {
  const allTypes = [
    'multiple-choice', 'match-columns', 'find-extra', 'true-false', 'short-answer', 'fill-blanks',
    'crossword', 'find-error', 'sequence', 'insert-letter', 'compare-numbers', 'step-by-step',
    'fill-table', 'essay', 'categorize', 'continue-sequence', 'anagram', 'scenario',
    'text-analysis', 'info-work', 'filword', 'handwriting', 'number-composition',
    'continue-story', 'maze', 'draw-illustration', 'unknown-words',
  ]
  const typesStr = s.selectedTypes.length > 0
    ? `Используй следующие типы заданий: ${s.selectedTypes.join(', ')}.`
    : `Используй разные типы из списка: ${allTypes.slice(0, 10).join(', ')}.`

  return `Создай рабочий лист с ${s.taskCount} заданиями по предмету "${s.subject}" для ${s.grade} класса по теме "${s.topic}".
${s.preferences ? `Пожелания: ${s.preferences}.` : ''}
${typesStr}

Верни СТРОГО JSON массив без markdown и лишнего текста. Каждый элемент содержит:
- "type" — тип задания
- "title" — название
- "instruction" — инструкция для ученика

Поля зависят от типа:

multiple-choice: questionText, options (массив), correctIndex (число)
match-columns: leftColumn (массив), rightColumn (массив), pairs (объект {лев:прав})
find-extra: items (массив), correctItem (строка — лишний элемент)
true-false: questionText, isTrue (bool)
short-answer: questionText, answerText
fill-blanks: blankText (текст с ___), blankAnswers (массив)
crossword: crosswordClues (массив {direction:"across"|"down", number:число, clue:"определение", answer:"слово"})
find-error: errorText (текст с ошибкой), correctedText, errorExplanation
sequence: sequenceItems (перемешанные), correctSequence (правильный порядок)
insert-letter: wordWithBlanks (напр. "ф_зика"), correctWord
compare-numbers: comparePairs (массив {left:"5", right:"3", operator:">"})
step-by-step: problemCondition, solutionSteps (массив шагов), problemAnswer
fill-table: tableHeaders (массив), tableRows (2D массив, null для пустых ячеек), tableAnswers (массив {row,col,value})
essay: questionText, answerText (примерный)
categorize: categories (массив {name, items}), allCategoryItems (все элементы перемешаны)
continue-sequence: sequenceStart (массив), sequenceAnswer (массив)
anagram: scrambledWord, anagramAnswer, anagramHint
scenario: passageText, passageQuestions (массив {question, answer})
text-analysis: passageText, passageQuestions (массив {question, answer})
info-work: passageText, passageQuestions (массив {question, answer})
filword: filwordGrid (2D массив букв), filwordWords (массив слов)
handwriting: handwritingText
number-composition: targetNumber (число), numberParts (массив {a,b})
continue-story: storyBeginning
maze: mazeGrid (2D массив: 0=путь, 1=стена, 2=старт, 3=финиш)
draw-illustration: drawPrompt
unknown-words: readingText, unknownWordsList (массив)

Включай ТОЛЬКО поля, относящиеся к типу. Задания должны быть содержательными и соответствовать школьной программе.`
}

function parseGeneratedTasks(text: string): WorksheetTask[] {
  // Extract JSON array from response
  let cleaned = text.trim()
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) cleaned = fenced[1].trim()

  const arrStart = cleaned.indexOf('[')
  const arrEnd = cleaned.lastIndexOf(']')
  if (arrStart !== -1 && arrEnd > arrStart) {
    cleaned = cleaned.slice(arrStart, arrEnd + 1)
  }

  // Normalize quotes
  cleaned = cleaned
    .replace(/[""«»]/g, '"')
    .replace(/['']/g, "'")
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')

  const parsed: any[] = JSON.parse(cleaned)

  return parsed.map((item, i) => ({
    id: `task-${Date.now()}-${i}`,
    type: item.type || 'short-answer',
    title: item.title || 'Задание',
    instruction: item.instruction || '',
    // original 6 types
    questionText: item.questionText,
    options: item.options,
    correctIndex: item.correctIndex,
    leftColumn: item.leftColumn,
    rightColumn: item.rightColumn,
    pairs: item.pairs,
    items: item.items,
    correctItem: item.correctItem,
    isTrue: item.isTrue,
    answerText: item.answerText,
    blankText: item.blankText,
    blankAnswers: item.blankAnswers,
    // new types
    crosswordGrid: item.crosswordGrid,
    crosswordClues: item.crosswordClues,
    errorText: item.errorText,
    correctedText: item.correctedText,
    errorExplanation: item.errorExplanation,
    sequenceItems: item.sequenceItems,
    correctSequence: item.correctSequence,
    wordWithBlanks: item.wordWithBlanks,
    correctWord: item.correctWord,
    comparePairs: item.comparePairs,
    problemCondition: item.problemCondition,
    solutionSteps: item.solutionSteps,
    problemAnswer: item.problemAnswer,
    tableHeaders: item.tableHeaders,
    tableRows: item.tableRows,
    tableAnswers: item.tableAnswers,
    categories: item.categories,
    allCategoryItems: item.allCategoryItems,
    sequenceStart: item.sequenceStart,
    sequenceAnswer: item.sequenceAnswer,
    scrambledWord: item.scrambledWord,
    anagramAnswer: item.anagramAnswer,
    anagramHint: item.anagramHint,
    passageText: item.passageText,
    passageQuestions: item.passageQuestions,
    filwordGrid: item.filwordGrid,
    filwordWords: item.filwordWords,
    handwritingText: item.handwritingText,
    targetNumber: item.targetNumber,
    numberParts: item.numberParts,
    storyBeginning: item.storyBeginning,
    mazeGrid: item.mazeGrid,
    drawPrompt: item.drawPrompt,
    readingText: item.readingText,
    unknownWordsList: item.unknownWordsList,
  }))
}

/* ── sample data fallback ── */
function getSampleTasks(settings: GeneratorSettings): WorksheetTask[] {
  const count = settings.taskCount
  const allSamples: WorksheetTask[] = [
    {
      id: 'sample-1', type: 'multiple-choice', title: 'Множественный выбор',
      instruction: 'Выберите правильный ответ:',
      questionText: `Первый закон термодинамики для замкнутой системы записывается в виде ΔU = .... (Здесь Q — количество теплоты, полученное системой, A — работа, совершенная системой над внешними телами.)`,
      options: ['Q + A', 'Q - A', 'A', 'Q'], correctIndex: 1,
    },
    {
      id: 'sample-2', type: 'match-columns', title: 'Соединение столбцов',
      instruction: 'Соедините термины из левой колонки с их характеристиками из правой колонки линиями или номерами.',
      leftColumn: ['1. Изохорный процесс', '2. Изобарный процесс', '3. Изотермический процесс', '4. Адиабатный процесс'],
      rightColumn: ['Q = 0', 'ΔT = 0', 'p = const, V изменяется', 'V = const, p изменяется'],
      pairs: {
        '1. Изохорный процесс': 'V = const, p изменяется',
        '2. Изобарный процесс': 'p = const, V изменяется',
        '3. Изотермический процесс': 'ΔT = 0',
        '4. Адиабатный процесс': 'Q = 0',
      },
    },
    {
      id: 'sample-3', type: 'find-extra', title: 'Лишнее слово',
      instruction: 'Найдите лишний элемент:',
      items: ['изобарный процесс', 'изохорный процесс', 'изотермический процесс', 'адиабатный процесс', 'конденсация'],
      correctItem: 'конденсация',
    },
    {
      id: 'sample-4', type: 'multiple-choice', title: 'Множественный выбор',
      instruction: 'Выберите правильный ответ:',
      questionText: 'Второй закон термодинамики в формулировке Клаузиуса гласит, что теплота сама по себе не может переходить от...',
      options: ['второго тела к работе', 'холодного тела к нагретому', 'нагретого тела к работе', 'нагретого тела к нагретому'],
      correctIndex: 1,
    },
    {
      id: 'sample-5', type: 'true-false', title: 'Истина/Ложь',
      instruction: 'Определите, верно ли утверждение:',
      questionText: 'Внутренняя энергия идеального газа зависит только от температуры.',
      isTrue: true,
    },
    {
      id: 'sample-6', type: 'short-answer', title: 'Краткий ответ',
      instruction: 'Дайте краткий ответ:',
      questionText: 'Как называется процесс, при котором объём газа остаётся постоянным?',
      answerText: 'Изохорный процесс',
    },
    {
      id: 'sample-7', type: 'fill-blanks', title: 'Заполнение пропусков',
      instruction: 'Заполните пропуски:',
      blankText: 'При ___ процессе давление газа остаётся постоянным, а при ___ процессе объём не меняется.',
      blankAnswers: ['изобарном', 'изохорном'],
    },
    {
      id: 'sample-8', type: 'multiple-choice', title: 'Множественный выбор',
      instruction: 'Выберите правильный ответ:',
      questionText: 'Единица измерения количества теплоты в СИ:',
      options: ['Ватт', 'Джоуль', 'Калория', 'Паскаль'],
      correctIndex: 1,
    },
  ]

  return allSamples.slice(0, count).map((t, i) => ({ ...t, id: `task-${Date.now()}-${i}` }))
}

/* ═══════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════ */
type View = 'list' | 'generator' | 'preview' | 'editor'

export function WorksheetPage() {
  const { theme } = useTheme()
  const [view, setView] = useState<View>('list')
  const [worksheets, setWorksheets] = useState<Worksheet[]>(loadWorksheets)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [generationsLeft, setGenerationsLeft] = useState(10)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark'
    ? 'bg-white/[0.04] border border-white/[0.08]'
    : 'bg-white/80 border border-slate-200'

  const activeWorksheet = worksheets.find((w) => w.id === activeId) || null

  // persist on change
  useEffect(() => { saveWorksheets(worksheets) }, [worksheets])

  /* ── generate worksheet ── */
  const handleGenerate = useCallback(async (settings: GeneratorSettings) => {
    setIsLoading(true)
    let tasks: WorksheetTask[]

    try {
      const prompt = buildPrompt(settings)
      const text = await generateText({ prompt, maxTokens: 3000, temperature: 0.6 })
      tasks = parseGeneratedTasks(text)
    } catch (err) {
      console.warn('AI generation failed, using sample data:', err)
      tasks = getSampleTasks(settings)
    }

    const ws: Worksheet = {
      id: `ws-${Date.now()}`,
      title: '',
      description: '',
      subject: settings.subject.trim() || 'Физика',
      grade: settings.grade.trim() || '9',
      topic: settings.topic.trim() || 'Термодинамика',
      tasks,
      createdAt: Date.now(),
    }

    setWorksheets((prev) => [ws, ...prev])
    setActiveId(ws.id)
    setGenerationsLeft((g) => Math.max(0, g - 1))
    setIsLoading(false)
    setView('preview')
  }, [])

  /* ── update worksheet ── */
  const updateWorksheet = useCallback((updated: Worksheet) => {
    setWorksheets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
  }, [])

  /* ── delete worksheet ── */
  const deleteWorksheet = useCallback((id: string) => {
    setWorksheets((prev) => prev.filter((w) => w.id !== id))
    if (activeId === id) {
      setActiveId(null)
      setView('list')
    }
  }, [activeId])

  /* ── render ── */
  return (
    <div className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
      {/* ═══ LIST VIEW ═══ */}
      {view === 'list' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${textColor}`}>Рабочие листы</h1>
                <p className={`text-sm ${textMuted}`}>Создавайте и управляйте заданиями для учеников</p>
              </div>
            </div>
            <Button variant="primary" onClick={() => setView('generator')}>
              <Plus size={16} /> Создать новый
            </Button>
          </div>

          {worksheets.length === 0 ? (
            <div className={`rounded-2xl p-12 text-center ${panelBg}`}>
              <FileSpreadsheet size={48} className={textMuted} />
              <p className={`mt-4 text-lg font-medium ${textColor}`}>Нет рабочих листов</p>
              <p className={`mt-2 ${textMuted}`}>Создайте первый рабочий лист с помощью AI-генератора</p>
              <Button variant="primary" className="mt-6" onClick={() => setView('generator')}>
                <Plus size={16} /> Создать
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {worksheets.map((ws) => (
                <div key={ws.id}
                  className={`rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-lg ${panelBg} ${
                    theme === 'dark' ? 'hover:bg-white/[0.08]' : 'hover:bg-white'
                  }`}
                  onClick={() => { setActiveId(ws.id); setView('preview') }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    theme === 'dark' ? 'bg-primary-500/20' : 'bg-primary-50'
                  }`}>
                    <FileSpreadsheet size={20} className="text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${textColor}`}>
                      {ws.title || 'Без названия'}
                    </h3>
                    <div className={`text-sm ${textMuted} flex items-center gap-3`}>
                      <span>{ws.subject}, {ws.grade} класс</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(ws.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                      <span>{ws.tasks.length} заданий</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteWorksheet(ws.id) }}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'text-white/30 hover:text-red-400 hover:bg-white/5'
                        : 'text-slate-300 hover:text-red-500 hover:bg-slate-50'
                    }`}>
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className={textMuted} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ GENERATOR VIEW ═══ */}
      {view === 'generator' && (
        <div className="space-y-4">
          <button onClick={() => setView('list')}
            className={`text-sm ${textMuted} hover:text-primary-400 transition-colors flex items-center gap-1`}>
            ← Мои листы
          </button>
          <WorksheetGenerator
            onGenerate={handleGenerate}
            isLoading={isLoading}
            generationsLeft={generationsLeft}
          />
        </div>
      )}

      {/* ═══ PREVIEW VIEW ═══ */}
      {view === 'preview' && activeWorksheet && (
        <WorksheetPreview
          worksheet={activeWorksheet}
          onEdit={() => setView('editor')}
          onBack={() => setView('list')}
          onNewSheet={() => setView('generator')}
          onUpdateWorksheet={updateWorksheet}
        />
      )}

      {/* ═══ EDITOR VIEW ═══ */}
      {view === 'editor' && activeWorksheet && (
        <WorksheetEditor
          worksheet={activeWorksheet}
          onSave={updateWorksheet}
          onBack={() => setView('preview')}
        />
      )}
    </div>
  )
}
