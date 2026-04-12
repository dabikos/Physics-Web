/* ─── Task type IDs ─── */
export type TaskType =
  | 'multiple-choice'
  | 'match-columns'
  | 'find-extra'
  | 'fill-blanks'
  | 'short-answer'
  | 'true-false'
  | 'find-error'
  | 'sequence'
  | 'crossword'
  | 'insert-letter'
  | 'compare-numbers'
  | 'step-by-step'
  | 'fill-table'
  | 'essay'
  | 'categorize'
  | 'continue-sequence'
  | 'anagram'
  | 'scenario'
  | 'text-analysis'
  | 'info-work'
  | 'filword'
  | 'handwriting'
  | 'number-composition'
  | 'continue-story'
  | 'maze'
  | 'draw-illustration'
  | 'unknown-words'

/* ─── Human-readable labels for each task type ─── */
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  'fill-blanks': 'Заполнение пропусков',
  'match-columns': 'Соединение столбцов',
  'crossword': 'Кроссворд',
  'multiple-choice': 'Множественный выбор',
  'short-answer': 'Краткий ответ',
  'insert-letter': 'Вставить букву',
  'compare-numbers': 'Сравни числа',
  'sequence': 'Установление последовательности',
  'true-false': 'Истина/Ложь',
  'find-error': 'Найти ошибку',
  'step-by-step': 'Задача с пошаговым объяснением',
  'fill-table': 'Заполнение таблицы',
  'essay': 'Развернутый ответ / Эссе',
  'info-work': 'Работа с информацией',
  'filword': 'Филворд',
  'handwriting': 'Прописи',
  'continue-sequence': 'Продолжите ряд',
  'anagram': 'Анаграммы / ребусы',
  'categorize': 'Распределение по категориям',
  'number-composition': 'Состав числа',
  'find-extra': 'Найти лишнее',
  'text-analysis': 'Анализ текста',
  'scenario': 'Сценарная задача',
  'continue-story': 'Продолжить рассказ',
  'maze': 'Лабиринт',
  'draw-illustration': 'Нарисовать иллюстрацию',
  'unknown-words': 'Прочитай текст и выпиши незнакомые слова',
}

/* ─── Task type groups for the generator UI ─── */
export const TASK_TYPE_ORDER: TaskType[] = [
  'fill-blanks', 'match-columns', 'crossword', 'multiple-choice', 'short-answer',
  'insert-letter', 'compare-numbers', 'sequence', 'true-false', 'find-error',
  'step-by-step', 'fill-table', 'essay',
  'info-work', 'filword', 'handwriting', 'continue-sequence', 'anagram',
  'categorize', 'number-composition', 'find-extra', 'text-analysis', 'scenario',
  'continue-story', 'maze', 'draw-illustration', 'unknown-words',
]

export const IMAGE_TASK_TYPES = [
  'Раскраски', 'Найди отличия', 'Соедини слова и картинки', 'Найди лишнюю картинку',
]

/* ─── Task data model (flexible) ─── */
export interface WorksheetTask {
  id: string
  type: TaskType
  title: string
  instruction: string

  /* ── multiple-choice / true-false / find-extra ── */
  questionText?: string
  options?: string[]
  correctIndex?: number

  /* ── match-columns ── */
  leftColumn?: string[]
  rightColumn?: string[]
  pairs?: Record<string, string>

  /* ── fill-blanks ── */
  blankText?: string
  blankAnswers?: string[]

  /* ── short-answer / essay ── */
  answerText?: string

  /* ── find-extra ── */
  items?: string[]
  correctItem?: string

  /* ── true-false ── */
  isTrue?: boolean

  /* ── crossword ── */
  crosswordGrid?: string[][]           // 2D: letter or '#' (black)
  crosswordClues?: { direction: 'across' | 'down'; number: number; clue: string; answer: string }[]

  /* ── find-error ── */
  errorText?: string
  correctedText?: string
  errorExplanation?: string

  /* ── sequence ── */
  sequenceItems?: string[]             // shuffled
  correctSequence?: string[]           // correct order

  /* ── insert-letter ── */
  wordWithBlanks?: string              // e.g. 'ф_зика'
  correctWord?: string

  /* ── compare-numbers ── */
  comparePairs?: { left: string; right: string; operator: '>' | '<' | '=' }[]

  /* ── step-by-step ── */
  problemCondition?: string
  solutionSteps?: string[]
  problemAnswer?: string

  /* ── fill-table ── */
  tableHeaders?: string[]
  tableRows?: (string | null)[][]      // null = blank cell
  tableAnswers?: { row: number; col: number; value: string }[]

  /* ── categorize ── */
  categories?: { name: string; items: string[] }[]
  allCategoryItems?: string[]          // shuffled pool

  /* ── continue-sequence ── */
  sequenceStart?: string[]
  sequenceAnswer?: string[]

  /* ── anagram ── */
  scrambledWord?: string
  anagramAnswer?: string
  anagramHint?: string

  /* ── scenario / text-analysis / info-work ── */
  passageText?: string
  passageQuestions?: { question: string; answer: string }[]

  /* ── filword ── */
  filwordGrid?: string[][]
  filwordWords?: string[]

  /* ── handwriting ── */
  handwritingText?: string

  /* ── number-composition ── */
  targetNumber?: number
  numberParts?: { a: number; b: number }[]

  /* ── continue-story ── */
  storyBeginning?: string

  /* ── maze ── */
  mazeGrid?: number[][]                // 0=path, 1=wall, 2=start, 3=end

  /* ── draw-illustration ── */
  drawPrompt?: string

  /* ── unknown-words ── */
  readingText?: string
  unknownWordsList?: string[]
}

/* ─── Worksheet ─── */
export interface Worksheet {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  topic: string
  tasks: WorksheetTask[]
  createdAt: number
}

/* ─── Generator settings ─── */
export interface GeneratorSettings {
  subject: string
  grade: string
  topic: string
  preferences: string
  taskCount: number
  selectedTypes: TaskType[]
}
