import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Database, FileText, FlaskConical, FunctionSquare, Layers3, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2 } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8003'
const ADMIN_PAGE_SIZE = 100

type ContentTab = 'overview' | 'lessons' | 'tests' | 'tasks' | 'formulas'
type LessonKind = 'sections' | 'subsections' | 'topics'
type AdminItem = Record<string, unknown> & { id?: string; title?: string; name?: string; section_id?: string; subsection_id?: string; is_published?: boolean; lesson_kind?: LessonKind }

type TestQuestionDraft = {
  question: string
  options: string[]
  correct: number
  explanation?: string
}

type TestDraft = {
  id: string
  section_id: string
  subsection_id: string
  topic_id: string | null
  title: string
  difficulty: string
  questions: TestQuestionDraft[]
  translations: Record<string, unknown>
  time_limit: number
  order_index: number
  is_published: boolean
}


type TaskDraft = {
  id: string
  section_id: string
  subsection_id: string
  topic_id: string | null
  topic_title: string
  title: string
  problem_text: string
  given_data: string
  find_text: string
  solution: string
  answer: string
  difficulty: string
  translations: Record<string, unknown>
  order_index: number
  is_published: boolean
}


type FormulaDraft = {
  id: string
  section_id: string
  name: string
  formula: string
  description: string
  variablesText: string
  unit: string
  translationsText: string
  order_index: number
  is_published: boolean
}

type LessonDraft = {
  kind: LessonKind
  id: string
  section_id: string
  subsection_id: string
  name: string
  title: string
  brief_info: string
  example_problem: string
  formulasText: string
  videoText: string
  translations: Record<string, unknown>
  icon: string
  color: string
  order_index: number
  is_published: boolean
}

type OverviewTotals = {
  sections: number
  subsections: number
  topics: number
  tests: number
  test_questions: number
  tasks: number
  formulas: number
  settings: number
  ai_prompts: number
  notification_campaigns: number
}

type SectionOverview = {
  id: string
  name: string
  is_published: boolean
  subsection_count: number
  topic_count: number
  test_count: number
  task_count: number
  formula_count: number
}

type OverviewResponse = {
  totals: OverviewTotals
  sections: SectionOverview[]
}

type TranslationLanguage = 'en' | 'kk'

const tabs: { id: ContentTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'tests', label: 'Tests' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'formulas', label: 'Formulas' },
]

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/80 p-5 shadow-xl shadow-slate-200/50 backdrop-blur dark:bg-slate-900/70 dark:shadow-black/20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600">{icon}</div>
      <div className="text-3xl font-black text-slate-900 dark:text-white">{value.toLocaleString('ru-RU')}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}


function normalizeQuestion(raw: unknown): TestQuestionDraft {
  const question = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {}
  const rawOptions = Array.isArray(question.options) ? question.options : []
  const options = rawOptions.map((option) => String(option)).slice(0, 6)
  while (options.length < 4) options.push('')

  return {
    question: String(question.question || ''),
    options,
    correct: Number.isFinite(Number(question.correct)) ? Number(question.correct) : 0,
    explanation: String(question.explanation || ''),
  }
}

function toTestDraft(item: AdminItem): TestDraft {
  const rawQuestions = Array.isArray(item.questions) ? item.questions : []
  return {
    id: String(item.id || ''),
    section_id: String(item.section_id || 'mechanics'),
    subsection_id: String(item.subsection_id || ''),
    topic_id: item.topic_id ? String(item.topic_id) : null,
    title: String(item.title || 'New test'),
    difficulty: String(item.difficulty || 'basic'),
    questions: rawQuestions.length ? rawQuestions.map(normalizeQuestion) : [normalizeQuestion({ question: '', options: ['', '', '', ''], correct: 0 })],
    translations: typeof item.translations === 'object' && item.translations !== null && !Array.isArray(item.translations) ? item.translations as Record<string, unknown> : {},
    time_limit: Number.isFinite(Number(item.time_limit)) ? Number(item.time_limit) : 300,
    order_index: Number.isFinite(Number(item.order_index)) ? Number(item.order_index) : 0,
    is_published: item.is_published !== false,
  }
}

function validateTestDraft(draft: TestDraft) {
  if (!draft.section_id.trim()) return 'Section is required.'
  if (!draft.subsection_id.trim()) return 'Subsection is required.'
  if (!draft.title.trim()) return 'Title is required.'
  if (!draft.questions.length) return 'At least one question is required.'

  for (let questionIndex = 0; questionIndex < draft.questions.length; questionIndex += 1) {
    const question = draft.questions[questionIndex]
    if (!question.question.trim()) return `Question ${questionIndex + 1}: text is required.`
    const filledOptions = question.options.filter((option) => option.trim())
    if (filledOptions.length < 2) return `Question ${questionIndex + 1}: at least two options are required.`
    if (question.correct < 0 || question.correct >= question.options.length || !question.options[question.correct]?.trim()) {
      return `Question ${questionIndex + 1}: correct answer points to an empty option.`
    }
  }

  return null
}

function testDraftToPayload(draft: TestDraft): AdminItem {
  return {
    id: draft.id.trim(),
    section_id: draft.section_id.trim(),
    subsection_id: draft.subsection_id.trim(),
    topic_id: draft.topic_id || null,
    title: draft.title.trim(),
    difficulty: draft.difficulty.trim() || 'basic',
    questions: draft.questions.map((question) => ({
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      correct: question.correct,
      explanation: question.explanation?.trim() || '',
    })),
    translations: draft.translations,
    time_limit: draft.time_limit,
    order_index: draft.order_index,
    is_published: draft.is_published,
  }
}


function toTaskDraft(item: AdminItem): TaskDraft {
  return {
    id: String(item.id || ''),
    section_id: String(item.section_id || 'mechanics'),
    subsection_id: String(item.subsection_id || ''),
    topic_id: item.topic_id ? String(item.topic_id) : null,
    topic_title: String(item.topic_title || ''),
    title: String(item.title || 'New task'),
    problem_text: String(item.problem_text || ''),
    given_data: String(item.given_data || ''),
    find_text: String(item.find_text || ''),
    solution: String(item.solution || ''),
    answer: String(item.answer || ''),
    difficulty: String(item.difficulty || 'medium'),
    translations: typeof item.translations === 'object' && item.translations !== null && !Array.isArray(item.translations) ? item.translations as Record<string, unknown> : {},
    order_index: Number.isFinite(Number(item.order_index)) ? Number(item.order_index) : 0,
    is_published: item.is_published !== false,
  }
}

function validateTaskDraft(draft: TaskDraft) {
  if (!draft.section_id.trim()) return 'Section is required.'
  if (!draft.subsection_id.trim()) return 'Subsection is required.'
  if (!draft.title.trim()) return 'Title is required.'
  if (!draft.problem_text.trim()) return 'Problem text is required.'
  if (!draft.answer.trim()) return 'Answer is required.'
  return null
}

function taskDraftToPayload(draft: TaskDraft): AdminItem {
  return {
    id: draft.id.trim(),
    section_id: draft.section_id.trim(),
    subsection_id: draft.subsection_id.trim(),
    topic_id: draft.topic_id || null,
    topic_title: draft.topic_title.trim(),
    title: draft.title.trim(),
    problem_text: draft.problem_text.trim(),
    given_data: draft.given_data.trim(),
    find_text: draft.find_text.trim(),
    solution: draft.solution.trim(),
    answer: draft.answer.trim(),
    difficulty: draft.difficulty.trim() || 'medium',
    translations: draft.translations,
    order_index: draft.order_index,
    is_published: draft.is_published,
  }
}


function stringifyJsonField(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2)
  return '{}'
}

function parseJsonObject(value: string, fieldName: string) {
  try {
    const parsed = value.trim() ? JSON.parse(value) : {}
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON object.`)
    }
    return parsed as Record<string, unknown>
  } catch (error) {
    if (error instanceof Error && error.message.includes('must be')) throw error
    throw new Error(`${fieldName} contains invalid JSON.`)
  }
}

function toFormulaDraft(item: AdminItem): FormulaDraft {
  return {
    id: String(item.id || ''),
    section_id: String(item.section_id || 'mechanics'),
    name: String(item.name || 'New formula'),
    formula: String(item.formula || ''),
    description: String(item.description || ''),
    variablesText: stringifyJsonField(item.variables),
    unit: String(item.unit || ''),
    translationsText: stringifyJsonField(item.translations),
    order_index: Number.isFinite(Number(item.order_index)) ? Number(item.order_index) : 0,
    is_published: item.is_published !== false,
  }
}

function validateFormulaDraft(draft: FormulaDraft) {
  if (!draft.section_id.trim()) return 'Section is required.'
  if (!draft.name.trim()) return 'Name is required.'
  if (!draft.formula.trim()) return 'Formula is required.'
  parseJsonObject(draft.variablesText, 'Variables')
  parseJsonObject(draft.translationsText, 'Translations')
  return null
}

function formulaDraftToPayload(draft: FormulaDraft): AdminItem {
  return {
    id: draft.id.trim(),
    section_id: draft.section_id.trim(),
    name: draft.name.trim(),
    formula: draft.formula.trim(),
    description: draft.description.trim(),
    variables: parseJsonObject(draft.variablesText, 'Variables'),
    unit: draft.unit.trim(),
    translations: parseJsonObject(draft.translationsText, 'Translations'),
    order_index: draft.order_index,
    is_published: draft.is_published,
  }
}

function parseJsonValue(value: string, fieldName: string) {
  try {
    return value.trim() ? JSON.parse(value) : null
  } catch {
    throw new Error(`${fieldName} contains invalid JSON.`)
  }
}

function toLessonDraft(item: AdminItem): LessonDraft {
  const kind = item.lesson_kind || 'topics'
  return {
    kind,
    id: String(item.id || ''),
    section_id: String(item.section_id || (kind === 'sections' ? item.id || '' : '')),
    subsection_id: String(item.subsection_id || (kind === 'subsections' ? item.id || '' : '')),
    name: String(item.name || ''),
    title: String(item.title || ''),
    brief_info: String(item.brief_info || ''),
    example_problem: String(item.example_problem || ''),
    formulasText: stringifyJsonField(item.formulas || []),
    videoText: stringifyJsonField(item.video),
    translations: typeof item.translations === 'object' && item.translations !== null && !Array.isArray(item.translations) ? item.translations as Record<string, unknown> : {},
    icon: String(item.icon || ''),
    color: String(item.color || ''),
    order_index: Number.isFinite(Number(item.order_index)) ? Number(item.order_index) : 0,
    is_published: item.is_published !== false,
  }
}

function validateLessonDraft(draft: LessonDraft) {
  if (!draft.id.trim()) return 'ID is required.'
  if (draft.kind === 'sections' && !draft.name.trim()) return 'Section name is required.'
  if (draft.kind === 'subsections') {
    if (!draft.section_id.trim()) return 'Section is required.'
    if (!draft.name.trim()) return 'Subsection name is required.'
  }
  if (draft.kind === 'topics') {
    if (!draft.section_id.trim()) return 'Section is required.'
    if (!draft.subsection_id.trim()) return 'Subsection is required.'
    if (!draft.title.trim()) return 'Topic title is required.'
    const formulas = parseJsonValue(draft.formulasText, 'Formulas')
    if (!Array.isArray(formulas)) return 'Formulas must be a JSON array.'
    const video = parseJsonValue(draft.videoText, 'Video')
    if (video !== null && (typeof video !== 'object' || Array.isArray(video))) return 'Video must be a JSON object.'
  }
  return null
}

function lessonDraftToPayload(draft: LessonDraft): AdminItem {
  if (draft.kind === 'sections') {
    return {
      id: draft.id.trim(),
      name: draft.name.trim(),
      translations: draft.translations,
      icon: draft.icon.trim() || null,
      color: draft.color.trim() || null,
      order_index: draft.order_index,
      is_published: draft.is_published,
    }
  }

  if (draft.kind === 'subsections') {
    return {
      id: draft.id.trim(),
      section_id: draft.section_id.trim(),
      name: draft.name.trim(),
      translations: draft.translations,
      order_index: draft.order_index,
      is_published: draft.is_published,
    }
  }

  return {
    id: draft.id.trim(),
    section_id: draft.section_id.trim(),
    subsection_id: draft.subsection_id.trim(),
    title: draft.title.trim(),
    brief_info: draft.brief_info.trim(),
    example_problem: draft.example_problem.trim(),
    formulas: parseJsonValue(draft.formulasText, 'Formulas') || [],
    video: parseJsonValue(draft.videoText, 'Video'),
    translations: draft.translations,
    order_index: draft.order_index,
    is_published: draft.is_published,
  }
}

function createLessonTemplate(kind: LessonKind): AdminItem {
  if (kind === 'sections') {
    return {
      lesson_kind: 'sections',
      id: '',
      name: 'New section',
      translations: {},
      icon: '',
      color: '#6366F1',
      order_index: 0,
      is_published: true,
    }
  }

  if (kind === 'subsections') {
    return {
      lesson_kind: 'subsections',
      id: '',
      section_id: 'mechanics',
      name: 'New subsection',
      translations: {},
      order_index: 0,
      is_published: true,
    }
  }

  return {
    lesson_kind: 'topics',
    id: '',
    section_id: 'mechanics',
    subsection_id: '',
    title: 'New topic',
    brief_info: '',
    example_problem: '',
    formulas: [],
    video: {},
    translations: {},
    order_index: 0,
    is_published: true,
  }
}

function createTemplate(tab: ContentTab): AdminItem {
  if (tab === 'tests') {
    return {
      id: '',
      section_id: 'mechanics',
      subsection_id: '',
      topic_id: null,
      title: 'New test',
      difficulty: 'basic',
      questions: [
        { question: 'Question text', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0, explanation: '' },
      ],
      translations: {},
      time_limit: 300,
      order_index: 0,
      is_published: true,
    }
  }

  if (tab === 'tasks') {
    return {
      id: '',
      section_id: 'mechanics',
      subsection_id: '',
      topic_id: null,
      topic_title: '',
      title: 'New task',
      problem_text: 'Problem text',
      given_data: '',
      find_text: '',
      solution: '',
      answer: '',
      difficulty: 'medium',
      translations: {},
      order_index: 0,
      is_published: true,
    }
  }

  return {
    id: '',
    section_id: 'mechanics',
    name: 'New formula',
    formula: 'F = ma',
    description: '',
    variables: {},
    unit: '',
    translations: {},
    order_index: 0,
    is_published: true,
  }
}

function itemTitle(item: AdminItem) {
  return String(item.title || item.name || item.id || 'Untitled')
}

const translationLanguages: { code: TranslationLanguage; label: string; hint: string }[] = [
  { code: 'en', label: 'English', hint: 'Shown when the app language is English.' },
  { code: 'kk', label: 'Kazakh', hint: 'Shown when the app language is Kazakh.' },
]

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function getTranslation(translations: Record<string, unknown>, language: TranslationLanguage) {
  return asRecord(translations[language])
}

function setTranslation(
  translations: Record<string, unknown>,
  language: TranslationLanguage,
  updater: (current: Record<string, unknown>) => Record<string, unknown>,
) {
  return {
    ...translations,
    [language]: updater(getTranslation(translations, language)),
  }
}

function translationText(translations: Record<string, unknown>, language: TranslationLanguage, key: string) {
  return String(getTranslation(translations, language)[key] || '')
}

function translationQuestions(translations: Record<string, unknown>, language: TranslationLanguage) {
  const questions = getTranslation(translations, language).questions
  return Array.isArray(questions) ? questions.map(asRecord) : []
}

function setTranslationText(
  translations: Record<string, unknown>,
  language: TranslationLanguage,
  key: string,
  value: string,
) {
  return setTranslation(translations, language, (current) => ({ ...current, [key]: value }))
}

function setTranslationVariable(
  translations: Record<string, unknown>,
  language: TranslationLanguage,
  symbol: string,
  value: string,
) {
  return setTranslation(translations, language, (current) => ({
    ...current,
    variables: {
      ...asRecord(current.variables),
      [symbol]: value,
    },
  }))
}

function setTranslationQuestion(
  translations: Record<string, unknown>,
  language: TranslationLanguage,
  questionIndex: number,
  updater: (question: Record<string, unknown>) => Record<string, unknown>,
) {
  return setTranslation(translations, language, (current) => {
    const questions = Array.isArray(current.questions) ? current.questions.map(asRecord) : []
    while (questions.length <= questionIndex) questions.push({})
    questions[questionIndex] = updater(questions[questionIndex])
    return { ...current, questions }
  })
}

function translationQuestionText(translations: Record<string, unknown>, language: TranslationLanguage, questionIndex: number, key: string) {
  return String(translationQuestions(translations, language)[questionIndex]?.[key] || '')
}

function translationOptionText(translations: Record<string, unknown>, language: TranslationLanguage, questionIndex: number, optionIndex: number) {
  const options = translationQuestions(translations, language)[questionIndex]?.options
  return String(Array.isArray(options) ? options[optionIndex] || '' : '')
}

function setTranslationOption(
  translations: Record<string, unknown>,
  language: TranslationLanguage,
  questionIndex: number,
  optionIndex: number,
  value: string,
) {
  return setTranslationQuestion(translations, language, questionIndex, (question) => {
    const options = Array.isArray(question.options) ? question.options.map(String) : []
    while (options.length <= optionIndex) options.push('')
    options[optionIndex] = value
    return { ...question, options }
  })
}


function TestEditor({
  draft,
  saving,
  selectedItem,
  onChange,
  onSave,
  onDelete,
}: {
  draft: TestDraft
  saving: boolean
  selectedItem: AdminItem | null
  onChange: (draft: TestDraft) => void
  onSave: () => void
  onDelete: () => void
}) {
  const updateQuestion = (index: number, updater: (question: TestQuestionDraft) => TestQuestionDraft) => {
    onChange({
      ...draft,
      questions: draft.questions.map((question, questionIndex) => questionIndex === index ? updater(question) : question),
    })
  }

  const addQuestion = () => {
    onChange({
      ...draft,
      questions: [
        ...draft.questions,
        { question: '', options: ['', '', '', ''], correct: 0, explanation: '' },
      ],
    })
  }

  const removeQuestion = (index: number) => {
    const nextQuestions = draft.questions.filter((_, questionIndex) => questionIndex !== index)
    onChange({ ...draft, questions: nextQuestions.length ? nextQuestions : draft.questions })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Test editor</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Edit questions safely without touching JSON indexes.</p>
        </div>
        <div className="flex gap-2">
          <button disabled={saving} onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button disabled={saving || !selectedItem?.id} onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">ID</span>
          <input value={draft.id} onChange={(event) => onChange({ ...draft, id: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Title</span>
          <input value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Section</span>
          <input value={draft.section_id} onChange={(event) => onChange({ ...draft, section_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Subsection</span>
          <input value={draft.subsection_id} onChange={(event) => onChange({ ...draft, subsection_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Difficulty</span>
          <select value={draft.difficulty} onChange={(event) => onChange({ ...draft, difficulty: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            <option value="basic">basic</option>
            <option value="standard">standard</option>
            <option value="advanced">advanced</option>
            <option value="olympiad">olympiad</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Time limit</span>
            <input type="number" value={draft.time_limit} onChange={(event) => onChange({ ...draft, time_limit: Number(event.target.value) || 0 })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Order</span>
            <input type="number" value={draft.order_index} onChange={(event) => onChange({ ...draft, order_index: Number(event.target.value) || 0 })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        <input type="checkbox" checked={draft.is_published} onChange={(event) => onChange({ ...draft, is_published: event.target.checked })} className="h-5 w-5" />
        Published
      </label>

      <div className="space-y-4 rounded-3xl border border-primary-500/20 bg-primary-50/60 p-5 dark:bg-primary-500/10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Test title</h3>
        <MultilingualInputRow
          label="Title"
          russian={draft.title}
          english={translationText(draft.translations, 'en', 'title')}
          kazakh={translationText(draft.translations, 'kk', 'title')}
          onRussianChange={(value) => onChange({ ...draft, title: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'title', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'title', value) })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Questions</h3>
          <button onClick={addQuestion} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 font-bold text-white">
            <Plus size={18} /> Add question
          </button>
        </div>

        {draft.questions.map((question, questionIndex) => (
          <div key={questionIndex} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="font-black text-slate-900 dark:text-white">Question {questionIndex + 1}</h4>
              <button onClick={() => removeQuestion(questionIndex)} className="rounded-xl bg-red-100 px-3 py-2 text-sm font-black text-red-700 disabled:opacity-50" disabled={draft.questions.length <= 1}>Remove</button>
            </div>
            <MultilingualTextareaRow
              label="Question"
              russian={question.question}
              english={translationQuestionText(draft.translations, 'en', questionIndex, 'question')}
              kazakh={translationQuestionText(draft.translations, 'kk', questionIndex, 'question')}
              onRussianChange={(value) => updateQuestion(questionIndex, (current) => ({ ...current, question: value }))}
              onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationQuestion(draft.translations, 'en', questionIndex, (current) => ({ ...current, question: value })) })}
              onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationQuestion(draft.translations, 'kk', questionIndex, (current) => ({ ...current, question: value })) })}
              minHeight="min-h-24"
            />
            <div className="mt-4 space-y-3">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className={`rounded-2xl border p-4 ${question.correct === optionIndex ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950'}`}>
                  <label className="mb-3 flex items-center gap-3 text-sm font-black text-slate-700 dark:text-slate-200">
                    <input type="radio" checked={question.correct === optionIndex} onChange={() => updateQuestion(questionIndex, (current) => ({ ...current, correct: optionIndex }))} />
                    Correct answer: option {optionIndex + 1}
                  </label>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <Field label="Russian"><input value={option} onChange={(event) => updateQuestion(questionIndex, (current) => ({ ...current, options: current.options.map((item, index) => index === optionIndex ? event.target.value : item) }))} className={inputClass} placeholder={`Option ${optionIndex + 1}`} /></Field>
                    <Field label="English"><input value={translationOptionText(draft.translations, 'en', questionIndex, optionIndex)} onChange={(event) => onChange({ ...draft, translations: setTranslationOption(draft.translations, 'en', questionIndex, optionIndex, event.target.value) })} className={inputClass} placeholder={option || `Option ${optionIndex + 1}`} /></Field>
                    <Field label="Kazakh"><input value={translationOptionText(draft.translations, 'kk', questionIndex, optionIndex)} onChange={(event) => onChange({ ...draft, translations: setTranslationOption(draft.translations, 'kk', questionIndex, optionIndex, event.target.value) })} className={inputClass} placeholder={option || `Option ${optionIndex + 1}`} /></Field>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <MultilingualTextareaRow
                label="Explanation"
                russian={question.explanation || ''}
                english={translationQuestionText(draft.translations, 'en', questionIndex, 'explanation')}
                kazakh={translationQuestionText(draft.translations, 'kk', questionIndex, 'explanation')}
                onRussianChange={(value) => updateQuestion(questionIndex, (current) => ({ ...current, explanation: value }))}
                onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationQuestion(draft.translations, 'en', questionIndex, (current) => ({ ...current, explanation: value })) })}
                onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationQuestion(draft.translations, 'kk', questionIndex, (current) => ({ ...current, explanation: value })) })}
                minHeight="min-h-20"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white'
const textareaClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-white'

function MultilingualInputRow({
  label,
  russian,
  english,
  kazakh,
  onRussianChange,
  onEnglishChange,
  onKazakhChange,
}: {
  label: string
  russian: string
  english: string
  kazakh: string
  onRussianChange: (value: string) => void
  onEnglishChange: (value: string) => void
  onKazakhChange: (value: string) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/70">
      <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Field label="Russian"><input value={russian} onChange={(event) => onRussianChange(event.target.value)} className={inputClass} /></Field>
        <Field label="English"><input value={english} onChange={(event) => onEnglishChange(event.target.value)} className={inputClass} placeholder={russian} /></Field>
        <Field label="Kazakh"><input value={kazakh} onChange={(event) => onKazakhChange(event.target.value)} className={inputClass} placeholder={russian} /></Field>
      </div>
    </div>
  )
}

function MultilingualTextareaRow({
  label,
  russian,
  english,
  kazakh,
  onRussianChange,
  onEnglishChange,
  onKazakhChange,
  minHeight = 'min-h-24',
}: {
  label: string
  russian: string
  english: string
  kazakh: string
  onRussianChange: (value: string) => void
  onEnglishChange: (value: string) => void
  onKazakhChange: (value: string) => void
  minHeight?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/70">
      <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Field label="Russian"><textarea value={russian} onChange={(event) => onRussianChange(event.target.value)} className={`${textareaClass} ${minHeight}`} /></Field>
        <Field label="English"><textarea value={english} onChange={(event) => onEnglishChange(event.target.value)} className={`${textareaClass} ${minHeight}`} placeholder={russian} /></Field>
        <Field label="Kazakh"><textarea value={kazakh} onChange={(event) => onKazakhChange(event.target.value)} className={`${textareaClass} ${minHeight}`} placeholder={russian} /></Field>
      </div>
    </div>
  )
}

function LessonEditor({
  draft,
  saving,
  selectedItem,
  onChange,
  onSave,
  onDelete,
}: {
  draft: LessonDraft
  saving: boolean
  selectedItem: AdminItem | null
  onChange: (draft: LessonDraft) => void
  onSave: () => void
  onDelete: () => void
}) {
  const titleKey = draft.kind === 'topics' ? 'title' : 'name'
  const russianTitle = draft.kind === 'topics' ? draft.title : draft.name

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Lesson editor</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Edit sections, subsections and topics in one protected workflow.</p>
        </div>
        <div className="flex gap-2">
          <button disabled={saving} onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button disabled={saving || !selectedItem?.id} onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Type"><input value={draft.kind} disabled className={`${inputClass} opacity-70`} /></Field>
        <Field label="ID"><input value={draft.id} onChange={(event) => onChange({ ...draft, id: event.target.value })} className={inputClass} /></Field>
        {draft.kind !== 'sections' && <Field label="Section"><input value={draft.section_id} onChange={(event) => onChange({ ...draft, section_id: event.target.value })} className={inputClass} /></Field>}
        {draft.kind === 'topics' && <Field label="Subsection"><input value={draft.subsection_id} onChange={(event) => onChange({ ...draft, subsection_id: event.target.value })} className={inputClass} /></Field>}
        {draft.kind === 'sections' && <Field label="Icon"><input value={draft.icon} onChange={(event) => onChange({ ...draft, icon: event.target.value })} className={inputClass} /></Field>}
        {draft.kind === 'sections' && <Field label="Color"><input value={draft.color} onChange={(event) => onChange({ ...draft, color: event.target.value })} className={inputClass} /></Field>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Order"><input type="number" value={draft.order_index} onChange={(event) => onChange({ ...draft, order_index: Number(event.target.value) || 0 })} className={inputClass} /></Field>
        <label className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <input type="checkbox" checked={draft.is_published} onChange={(event) => onChange({ ...draft, is_published: event.target.checked })} className="h-5 w-5" />
          Published
        </label>
      </div>

      <div className="space-y-4 rounded-3xl border border-primary-500/20 bg-primary-50/60 p-5 dark:bg-primary-500/10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Lesson content</h3>
        <MultilingualInputRow
          label={draft.kind === 'topics' ? 'Topic title' : 'Name'}
          russian={russianTitle}
          english={translationText(draft.translations, 'en', titleKey)}
          kazakh={translationText(draft.translations, 'kk', titleKey)}
          onRussianChange={(value) => onChange(draft.kind === 'topics' ? { ...draft, title: value } : { ...draft, name: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', titleKey, value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', titleKey, value) })}
        />

        {draft.kind === 'topics' && (
          <>
            <MultilingualTextareaRow
              label="Brief info"
              russian={draft.brief_info}
              english={translationText(draft.translations, 'en', 'brief_info')}
              kazakh={translationText(draft.translations, 'kk', 'brief_info')}
              onRussianChange={(value) => onChange({ ...draft, brief_info: value })}
              onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'brief_info', value) })}
              onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'brief_info', value) })}
              minHeight="min-h-36"
            />
            <MultilingualTextareaRow
              label="Example problem"
              russian={draft.example_problem}
              english={translationText(draft.translations, 'en', 'example_problem')}
              kazakh={translationText(draft.translations, 'kk', 'example_problem')}
              onRussianChange={(value) => onChange({ ...draft, example_problem: value })}
              onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'example_problem', value) })}
              onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'example_problem', value) })}
              minHeight="min-h-36"
            />
          </>
        )}
      </div>

      {draft.kind === 'topics' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Formulas JSON array"><textarea value={draft.formulasText} onChange={(event) => onChange({ ...draft, formulasText: event.target.value })} className={`${textareaClass} min-h-40 font-mono text-sm`} /></Field>
          <Field label="Video JSON object"><textarea value={draft.videoText} onChange={(event) => onChange({ ...draft, videoText: event.target.value })} className={`${textareaClass} min-h-40 font-mono text-sm`} /></Field>
        </div>
      )}
    </div>
  )
}

function TaskEditor({
  draft,
  saving,
  selectedItem,
  onChange,
  onSave,
  onDelete,
}: {
  draft: TaskDraft
  saving: boolean
  selectedItem: AdminItem | null
  onChange: (draft: TaskDraft) => void
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Task editor</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Edit problem fields safely. Use LaTeX directly in text where needed.</p>
        </div>
        <div className="flex gap-2">
          <button disabled={saving} onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button disabled={saving || !selectedItem?.id} onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="ID"><input value={draft.id} onChange={(event) => onChange({ ...draft, id: event.target.value })} className={inputClass} /></Field>
        <Field label="Section"><input value={draft.section_id} onChange={(event) => onChange({ ...draft, section_id: event.target.value })} className={inputClass} /></Field>
        <Field label="Subsection"><input value={draft.subsection_id} onChange={(event) => onChange({ ...draft, subsection_id: event.target.value })} className={inputClass} /></Field>
        <Field label="Difficulty">
          <select value={draft.difficulty} onChange={(event) => onChange({ ...draft, difficulty: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
            <option value="advanced">advanced</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Order"><input type="number" value={draft.order_index} onChange={(event) => onChange({ ...draft, order_index: Number(event.target.value) || 0 })} className={inputClass} /></Field>
        <label className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <input type="checkbox" checked={draft.is_published} onChange={(event) => onChange({ ...draft, is_published: event.target.checked })} className="h-5 w-5" />
          Published
        </label>
      </div>

      <div className="space-y-4 rounded-3xl border border-primary-500/20 bg-primary-50/60 p-5 dark:bg-primary-500/10">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Task content</h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Edit Russian source and translations side by side. Keep numbers, units, formulas and final answer identical.
          </p>
        </div>
        <MultilingualInputRow
          label="Title"
          russian={draft.title}
          english={translationText(draft.translations, 'en', 'title')}
          kazakh={translationText(draft.translations, 'kk', 'title')}
          onRussianChange={(value) => onChange({ ...draft, title: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'title', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'title', value) })}
        />
        <MultilingualInputRow
          label="Topic title"
          russian={draft.topic_title}
          english={translationText(draft.translations, 'en', 'topic_title')}
          kazakh={translationText(draft.translations, 'kk', 'topic_title')}
          onRussianChange={(value) => onChange({ ...draft, topic_title: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'topic_title', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'topic_title', value) })}
        />
        <MultilingualTextareaRow
          label="Problem text"
          russian={draft.problem_text}
          english={translationText(draft.translations, 'en', 'problem_text')}
          kazakh={translationText(draft.translations, 'kk', 'problem_text')}
          onRussianChange={(value) => onChange({ ...draft, problem_text: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'problem_text', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'problem_text', value) })}
          minHeight="min-h-32"
        />
        <MultilingualTextareaRow
          label="Given"
          russian={draft.given_data}
          english={translationText(draft.translations, 'en', 'given_data')}
          kazakh={translationText(draft.translations, 'kk', 'given_data')}
          onRussianChange={(value) => onChange({ ...draft, given_data: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'given_data', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'given_data', value) })}
        />
        <MultilingualTextareaRow
          label="Find"
          russian={draft.find_text}
          english={translationText(draft.translations, 'en', 'find_text')}
          kazakh={translationText(draft.translations, 'kk', 'find_text')}
          onRussianChange={(value) => onChange({ ...draft, find_text: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'find_text', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'find_text', value) })}
          minHeight="min-h-20"
        />
        <MultilingualTextareaRow
          label="Solution"
          russian={draft.solution}
          english={translationText(draft.translations, 'en', 'solution')}
          kazakh={translationText(draft.translations, 'kk', 'solution')}
          onRussianChange={(value) => onChange({ ...draft, solution: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'solution', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'solution', value) })}
          minHeight="min-h-44"
        />
        <MultilingualTextareaRow
          label="Answer"
          russian={draft.answer}
          english={translationText(draft.translations, 'en', 'answer')}
          kazakh={translationText(draft.translations, 'kk', 'answer')}
          onRussianChange={(value) => onChange({ ...draft, answer: value })}
          onEnglishChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'en', 'answer', value) })}
          onKazakhChange={(value) => onChange({ ...draft, translations: setTranslationText(draft.translations, 'kk', 'answer', value) })}
          minHeight="min-h-20"
        />
      </div>
    </div>
  )
}


function FormulaPreview({ formula }: { formula: string }) {
  if (!formula.trim()) {
    return <div className="rounded-2xl bg-slate-100 p-5 text-sm font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400">Formula preview will appear here.</div>
  }

  try {
    const html = katex.renderToString(formula, {
      displayMode: true,
      throwOnError: false,
      strict: false,
    })

    return (
      <div className="overflow-x-auto rounded-2xl border border-primary-500/20 bg-primary-50 p-5 text-slate-950 dark:bg-primary-500/10 dark:text-white">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  } catch {
    return <div className="rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-200">KaTeX preview failed. Check LaTeX syntax.</div>
  }
}

function FormulaEditor({
  draft,
  saving,
  selectedItem,
  onChange,
  onSave,
  onDelete,
}: {
  draft: FormulaDraft
  saving: boolean
  selectedItem: AdminItem | null
  onChange: (draft: FormulaDraft) => void
  onSave: () => void
  onDelete: () => void
}) {
  const formulaVariables = useMemo(() => {
    try {
      return parseJsonObject(draft.variablesText, 'Variables')
    } catch {
      return {}
    }
  }, [draft.variablesText])
  const formulaTranslations = useMemo(() => {
    try {
      return parseJsonObject(draft.translationsText, 'Translations')
    } catch {
      return {}
    }
  }, [draft.translationsText])

  const updateFormulaTranslation = (language: TranslationLanguage, key: string, value: string) => {
    const translations = setTranslationText(formulaTranslations, language, key, value)
    onChange({ ...draft, translationsText: JSON.stringify(translations, null, 2) })
  }

  const variableSymbols = useMemo(() => {
    const symbols = new Set<string>()
    Object.keys(formulaVariables).forEach((symbol) => symbols.add(symbol))
    translationLanguages.forEach((language) => {
      Object.keys(asRecord(getTranslation(formulaTranslations, language.code).variables)).forEach((symbol) => symbols.add(symbol))
    })
    return [...symbols]
  }, [formulaTranslations, formulaVariables])

  const updateVariableSymbol = (oldSymbol: string, nextSymbol: string) => {
    const trimmedSymbol = nextSymbol.trim()
    if (!trimmedSymbol) return

    const nextVariables = { ...formulaVariables }
    nextVariables[trimmedSymbol] = String(nextVariables[oldSymbol] || '')
    if (trimmedSymbol !== oldSymbol) delete nextVariables[oldSymbol]

    const nextTranslations = translationLanguages.reduce((translations, language) => {
      const languageTranslation = getTranslation(translations, language.code)
      const languageVariables = { ...asRecord(languageTranslation.variables) }
      languageVariables[trimmedSymbol] = String(languageVariables[oldSymbol] || '')
      if (trimmedSymbol !== oldSymbol) delete languageVariables[oldSymbol]
      return setTranslation(translations, language.code, (current) => ({ ...current, variables: languageVariables }))
    }, formulaTranslations)

    onChange({
      ...draft,
      variablesText: JSON.stringify(nextVariables, null, 2),
      translationsText: JSON.stringify(nextTranslations, null, 2),
    })
  }

  const updateVariableValue = (symbol: string, value: string) => {
    onChange({
      ...draft,
      variablesText: JSON.stringify({ ...formulaVariables, [symbol]: value }, null, 2),
    })
  }

  const updateTranslatedVariable = (language: TranslationLanguage, symbol: string, value: string) => {
    const translations = setTranslationVariable(formulaTranslations, language, symbol, value)
    onChange({ ...draft, translationsText: JSON.stringify(translations, null, 2) })
  }

  const addVariable = () => {
    let index = variableSymbols.length + 1
    let symbol = `x${index}`
    while (variableSymbols.includes(symbol)) {
      index += 1
      symbol = `x${index}`
    }
    updateVariableValue(symbol, '')
  }

  const removeVariable = (symbol: string) => {
    const nextVariables = { ...formulaVariables }
    delete nextVariables[symbol]
    const nextTranslations = translationLanguages.reduce((translations, language) => {
      const languageTranslation = getTranslation(translations, language.code)
      const languageVariables = { ...asRecord(languageTranslation.variables) }
      delete languageVariables[symbol]
      return setTranslation(translations, language.code, (current) => ({ ...current, variables: languageVariables }))
    }, formulaTranslations)

    onChange({
      ...draft,
      variablesText: JSON.stringify(nextVariables, null, 2),
      translationsText: JSON.stringify(nextTranslations, null, 2),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Formula editor</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Edit LaTeX and preview rendering before saving.</p>
        </div>
        <div className="flex gap-2">
          <button disabled={saving} onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button disabled={saving || !selectedItem?.id} onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="ID"><input value={draft.id} onChange={(event) => onChange({ ...draft, id: event.target.value })} className={inputClass} /></Field>
        <Field label="Name"><input value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} className={inputClass} /></Field>
        <Field label="Section"><input value={draft.section_id} onChange={(event) => onChange({ ...draft, section_id: event.target.value })} className={inputClass} /></Field>
        <Field label="Unit"><input value={draft.unit} onChange={(event) => onChange({ ...draft, unit: event.target.value })} className={inputClass} /></Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Order"><input type="number" value={draft.order_index} onChange={(event) => onChange({ ...draft, order_index: Number(event.target.value) || 0 })} className={inputClass} /></Field>
        <label className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <input type="checkbox" checked={draft.is_published} onChange={(event) => onChange({ ...draft, is_published: event.target.checked })} className="h-5 w-5" />
          Published
        </label>
      </div>

      <Field label="LaTeX formula"><textarea value={draft.formula} onChange={(event) => onChange({ ...draft, formula: event.target.value })} className={`${textareaClass} min-h-24 font-mono`} /></Field>
      <FormulaPreview formula={draft.formula} />

      <div className="space-y-4 rounded-3xl border border-primary-500/20 bg-primary-50/60 p-5 dark:bg-primary-500/10">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Formula content</h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Edit Russian source and translations side by side. LaTeX formula is shared.</p>
        </div>
        <MultilingualInputRow
          label="Formula name"
          russian={draft.name}
          english={translationText(formulaTranslations, 'en', 'name')}
          kazakh={translationText(formulaTranslations, 'kk', 'name')}
          onRussianChange={(value) => onChange({ ...draft, name: value })}
          onEnglishChange={(value) => updateFormulaTranslation('en', 'name', value)}
          onKazakhChange={(value) => updateFormulaTranslation('kk', 'name', value)}
        />
        <MultilingualTextareaRow
          label="Description"
          russian={draft.description}
          english={translationText(formulaTranslations, 'en', 'description')}
          kazakh={translationText(formulaTranslations, 'kk', 'description')}
          onRussianChange={(value) => onChange({ ...draft, description: value })}
          onEnglishChange={(value) => updateFormulaTranslation('en', 'description', value)}
          onKazakhChange={(value) => updateFormulaTranslation('kk', 'description', value)}
          minHeight="min-h-28"
        />
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Variables</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Edit symbols and explanations in all languages without touching JSON.</p>
          </div>
          <button onClick={addVariable} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 font-bold text-white">
            <Plus size={18} /> Add variable
          </button>
        </div>

        <div className="space-y-3">
          {variableSymbols.map((symbol) => (
            <div key={symbol} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/70">
              <div className="grid gap-3 xl:grid-cols-[130px_1fr_1fr_1fr_auto]">
                <Field label="Symbol">
                  <input value={symbol} onChange={(event) => updateVariableSymbol(symbol, event.target.value)} className={inputClass} />
                </Field>
                <Field label="Russian">
                  <input value={String(formulaVariables[symbol] || '')} onChange={(event) => updateVariableValue(symbol, event.target.value)} className={inputClass} />
                </Field>
                <Field label="English">
                  <input value={String(asRecord(getTranslation(formulaTranslations, 'en').variables)[symbol] || '')} onChange={(event) => updateTranslatedVariable('en', symbol, event.target.value)} className={inputClass} />
                </Field>
                <Field label="Kazakh">
                  <input value={String(asRecord(getTranslation(formulaTranslations, 'kk').variables)[symbol] || '')} onChange={(event) => updateTranslatedVariable('kk', symbol, event.target.value)} className={inputClass} />
                </Field>
                <button onClick={() => removeVariable(symbol)} className="mt-7 rounded-xl bg-red-100 px-3 py-2 text-sm font-black text-red-700 dark:bg-red-500/10 dark:text-red-200">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {!variableSymbols.length && (
            <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500 dark:bg-slate-950/70 dark:text-slate-400">
              No variables yet. Add symbols like F, G, r, m1.
            </div>
          )}
        </div>
      </div>

      <Field label="Advanced variables JSON"><textarea value={draft.variablesText} onChange={(event) => onChange({ ...draft, variablesText: event.target.value })} className={`${textareaClass} min-h-32 font-mono text-sm`} /></Field>
      <Field label="Advanced translations JSON"><textarea value={draft.translationsText} onChange={(event) => onChange({ ...draft, translationsText: event.target.value })} className={`${textareaClass} min-h-32 font-mono text-sm`} /></Field>
    </div>
  )
}

export function AdminPage() {
  const { token, user } = useAuth()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<ContentTab>('overview')
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [items, setItems] = useState<AdminItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null)
  const [lessonKind, setLessonKind] = useState<LessonKind>('topics')
  const [testDraft, setTestDraft] = useState<TestDraft | null>(null)
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null)
  const [formulaDraft, setFormulaDraft] = useState<FormulaDraft | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [subsectionFilter, setSubsectionFilter] = useState('')
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) || null, [items, selectedId])
  const sectionOptions = useMemo(() => {
    const ids = new Set([
      ...(overview?.sections || []).map((section) => section.id),
      ...items.map((item) => String(item.section_id || '')).filter(Boolean),
    ])
    return [...ids].sort()
  }, [items, overview])
  const subsectionOptions = useMemo(() => {
    const ids = new Set(
      items
        .filter((item) => !sectionFilter || item.section_id === sectionFilter)
        .map((item) => String(item.subsection_id || ''))
        .filter(Boolean),
    )
    return [...ids].sort()
  }, [items, sectionFilter])
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      if (sectionFilter && item.section_id !== sectionFilter) return false
      if (subsectionFilter && item.subsection_id !== subsectionFilter) return false
      if (publishFilter === 'published' && !item.is_published) return false
      if (publishFilter === 'draft' && item.is_published) return false
      if (!query) return true

      const haystack = [
        item.id,
        item.title,
        item.name,
        item.section_id,
        item.subsection_id,
        item.topic_title,
      ].map((value) => String(value || '').toLowerCase())

      return haystack.some((value) => value.includes(query))
    })
  }, [items, publishFilter, searchQuery, sectionFilter, subsectionFilter])
  const cards = useMemo(() => {
    if (!overview) return []
    return [
      { label: 'Sections', value: overview.totals.sections, icon: <Layers3 size={24} /> },
      { label: 'Lesson topics', value: overview.totals.topics, icon: <FileText size={24} /> },
      { label: 'Tests', value: overview.totals.tests, icon: <FlaskConical size={24} /> },
      { label: 'Test questions', value: overview.totals.test_questions, icon: <Database size={24} /> },
      { label: 'Tasks', value: overview.totals.tasks, icon: <FileText size={24} /> },
      { label: 'Formulas', value: overview.totals.formulas, icon: <FunctionSquare size={24} /> },
    ]
  }, [overview])

  async function adminFetch(path: string, init?: RequestInit) {
    if (!token) throw new Error('Auth token is missing. Sign out and sign in again.')

    const url = `${API_BASE}${path}`
    let response: Response
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      })
    } catch (fetchError) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown origin'
      throw new Error(`Network/CORS error. Origin: ${origin}. API: ${API_BASE}. ${fetchError instanceof Error ? fetchError.message : ''}`)
    }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.detail || `Admin request failed (${response.status})`)
    return data
  }

  async function loadOverview() {
    setLoading(true)
    setError(null)
    try {
      const data = await adminFetch('/api/admin/content/overview')
      setOverview(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }

  async function loadItems(tab: ContentTab, offset = 0, append = false) {
    if (tab === 'overview') {
      await loadOverview()
      return
    }

    setLoading(!append)
    setLoadingMore(append)
    setError(null)
    setNotice(null)
    try {
      const params = new URLSearchParams({
        limit: String(ADMIN_PAGE_SIZE),
        offset: String(offset),
      })
      if (sectionFilter) params.set('section_id', sectionFilter)
      if ((tab === 'tests' || tab === 'tasks') && subsectionFilter) params.set('subsection_id', subsectionFilter)

      const data = await adminFetch(`/api/admin/content/${tab}?${params.toString()}`)
      const nextItems = tab === 'lessons'
        ? [
            ...(data.sections || []).map((item: AdminItem) => ({ ...item, lesson_kind: 'sections' as LessonKind, section_id: item.id })),
            ...(data.subsections || []).map((item: AdminItem) => ({ ...item, lesson_kind: 'subsections' as LessonKind })),
            ...(data.topics || []).map((item: AdminItem) => ({ ...item, lesson_kind: 'topics' as LessonKind })),
          ]
        : data.items || []
      const mergedItems = append ? [...items, ...nextItems] : nextItems
      setItems(mergedItems)
      setTotalItems(Number(data.total || mergedItems.length))
      if (!append) {
        const first = nextItems[0] || null
        setSelectedId(first?.id || null)
        setEditorValue(first ? JSON.stringify(first, null, 2) : '')
        setLessonDraft(tab === 'lessons' && first ? toLessonDraft(first) : null)
        setTestDraft(tab === 'tests' && first ? toTestDraft(first) : null)
        setTaskDraft(tab === 'tasks' && first ? toTaskDraft(first) : null)
        setFormulaDraft(tab === 'formulas' && first ? toFormulaDraft(first) : null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `Failed to load ${tab}`)
      setItems([])
      setTotalItems(0)
      setSelectedId(null)
      setEditorValue('')
      setLessonDraft(null)
      setTestDraft(null)
      setTaskDraft(null)
      setFormulaDraft(null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  async function loadMoreItems() {
    await loadItems(activeTab, items.length, true)
  }

  function selectItem(item: AdminItem) {
    setSelectedId(item.id || null)
    setEditorValue(JSON.stringify(item, null, 2))
    setLessonDraft(activeTab === 'lessons' ? toLessonDraft(item) : null)
    setTestDraft(activeTab === 'tests' ? toTestDraft(item) : null)
    setTaskDraft(activeTab === 'tasks' ? toTaskDraft(item) : null)
    setFormulaDraft(activeTab === 'formulas' ? toFormulaDraft(item) : null)
    setError(null)
    setNotice(null)
  }

  function createNewItem() {
    const item = activeTab === 'lessons' ? createLessonTemplate(lessonKind) : createTemplate(activeTab)
    setSelectedId(null)
    setEditorValue(JSON.stringify(item, null, 2))
    setLessonDraft(activeTab === 'lessons' ? toLessonDraft(item) : null)
    setTestDraft(activeTab === 'tests' ? toTestDraft(item) : null)
    setTaskDraft(activeTab === 'tasks' ? toTaskDraft(item) : null)
    setFormulaDraft(activeTab === 'formulas' ? toFormulaDraft(item) : null)
    setNotice(activeTab === 'lessons' ? `Fill the form and press Save to create a new lesson ${lessonKind.slice(0, -1)}.` : activeTab === 'tests' ? 'Fill the form and press Save to create a new test.' : activeTab === 'tasks' ? 'Fill the form and press Save to create a new task.' : activeTab === 'formulas' ? 'Fill the form and press Save to create a new formula.' : 'Fill JSON and press Save to create a new item.')
    setError(null)
  }

  async function saveItem() {
    if (activeTab === 'overview') return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const payload = activeTab === 'tests' && testDraft
        ? testDraftToPayload(testDraft)
        : activeTab === 'tasks' && taskDraft
          ? taskDraftToPayload(taskDraft)
          : activeTab === 'formulas' && formulaDraft
            ? formulaDraftToPayload(formulaDraft)
            : activeTab === 'lessons' && lessonDraft
              ? lessonDraftToPayload(lessonDraft)
              : JSON.parse(editorValue) as AdminItem
      if (activeTab === 'lessons' && lessonDraft) {
        const validationError = validateLessonDraft(lessonDraft)
        if (validationError) throw new Error(validationError)
      }
      if (activeTab === 'tests' && testDraft) {
        const validationError = validateTestDraft(testDraft)
        if (validationError) throw new Error(validationError)
      }
      if (activeTab === 'tasks' && taskDraft) {
        const validationError = validateTaskDraft(taskDraft)
        if (validationError) throw new Error(validationError)
      }
      if (activeTab === 'formulas' && formulaDraft) {
        const validationError = validateFormulaDraft(formulaDraft)
        if (validationError) throw new Error(validationError)
      }
      const id = String(payload.id || '').trim()
      const isUpdate = Boolean(id && selectedItem?.id === id)
      const endpoint = activeTab === 'lessons' && lessonDraft
        ? isUpdate
          ? `/api/admin/content/lessons/${lessonDraft.kind}/${encodeURIComponent(id)}`
          : `/api/admin/content/lessons/${lessonDraft.kind}`
        : isUpdate ? `/api/admin/content/${activeTab}/${encodeURIComponent(id)}` : `/api/admin/content/${activeTab}`
      const method = isUpdate ? 'PUT' : 'POST'
      const data = await adminFetch(endpoint, { method, body: JSON.stringify(payload) })
      const savedItem = data.item as AdminItem
      setNotice(isUpdate ? 'Saved.' : 'Created.')
      await loadItems(activeTab)
      if (savedItem?.id) {
        const normalizedSavedItem = activeTab === 'lessons' && lessonDraft ? { ...savedItem, lesson_kind: lessonDraft.kind } : savedItem
        setSelectedId(savedItem.id)
        setEditorValue(JSON.stringify(normalizedSavedItem, null, 2))
        setLessonDraft(activeTab === 'lessons' ? toLessonDraft(normalizedSavedItem) : null)
        setTestDraft(activeTab === 'tests' ? toTestDraft(savedItem) : null)
        setTaskDraft(activeTab === 'tasks' ? toTaskDraft(savedItem) : null)
        setFormulaDraft(activeTab === 'formulas' ? toFormulaDraft(savedItem) : null)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem() {
    if (activeTab === 'overview' || !selectedItem?.id) return
    const shouldDelete = window.confirm(`Delete ${itemTitle(selectedItem)}? This cannot be undone.`)
    if (!shouldDelete) return

    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const endpoint = activeTab === 'lessons' && selectedItem.lesson_kind
        ? `/api/admin/content/lessons/${selectedItem.lesson_kind}/${encodeURIComponent(selectedItem.id)}`
        : `/api/admin/content/${activeTab}/${encodeURIComponent(selectedItem.id)}`
      await adminFetch(endpoint, { method: 'DELETE' })
      setNotice('Deleted.')
      await loadItems(activeTab)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete item')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!token) return
    void loadItems(activeTab)
  }, [activeTab, token, sectionFilter, subsectionFilter])

  return (
    <main className="min-h-screen px-6 pb-12 pt-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 p-8 text-white shadow-2xl shadow-primary-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-primary-100">
                <ShieldCheck size={18} /> Admin access: {user?.email}
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Physics AI Admin</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-300">
                Manage Supabase content through protected backend endpoints. Changes are live immediately and do not require backend redeploy.
              </p>
              <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-400 sm:grid-cols-2">
                <div>API: {API_BASE}</div>
                <div>Token: {token ? 'present' : 'missing'}</div>
              </div>
            </div>
            <button
              onClick={() => void loadItems(activeTab)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-primary-100"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-5 py-3 font-black transition ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</div>}
        {notice && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{notice}</div>}

        {activeTab === 'overview' ? (
          loading ? (
            <div className="rounded-3xl bg-white/80 p-8 text-center font-bold text-slate-500 shadow-xl dark:bg-slate-900/70 dark:text-slate-300">Loading admin data...</div>
          ) : overview ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {cards.map((card) => <StatCard key={card.label} {...card} />)}
              </section>

              <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Content by section</h2>
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                  <table className="w-full min-w-[840px] border-collapse text-left">
                    <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}>
                      <tr className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4">Section</th>
                        <th className="px-5 py-4">Subsections</th>
                        <th className="px-5 py-4">Topics</th>
                        <th className="px-5 py-4">Tests</th>
                        <th className="px-5 py-4">Tasks</th>
                        <th className="px-5 py-4">Formulas</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.sections.map((section) => (
                        <tr key={section.id} className="border-t border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200">
                          <td className="px-5 py-4 font-bold">{section.name}</td>
                          <td className="px-5 py-4">{section.subsection_count}</td>
                          <td className="px-5 py-4">{section.topic_count}</td>
                          <td className="px-5 py-4">{section.test_count}</td>
                          <td className="px-5 py-4">{section.task_count}</td>
                          <td className="px-5 py-4">{section.formula_count}</td>
                          <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${section.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{section.is_published ? 'Published' : 'Draft'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null
        ) : (
          <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black capitalize text-slate-900 dark:text-white">{activeTab}</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Loaded {items.length} of {totalItems || items.length}. Visible {filteredItems.length}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeTab === 'lessons' && (
                    <select
                      value={lessonKind}
                      onChange={(event) => setLessonKind(event.target.value as LessonKind)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="sections">Section</option>
                      <option value="subsections">Subsection</option>
                      <option value="topics">Topic</option>
                    </select>
                  )}
                  <button onClick={createNewItem} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 font-bold text-white">
                    <Plus size={18} /> New
                  </button>
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <Search size={18} />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    placeholder="Search title, id, section..."
                  />
                </label>

                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    value={sectionFilter}
                    onChange={(event) => {
                      setSectionFilter(event.target.value)
                      setSubsectionFilter('')
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="">All sections</option>
                    {sectionOptions.map((sectionId) => <option key={sectionId} value={sectionId}>{sectionId}</option>)}
                  </select>

                  <select
                    value={subsectionFilter}
                    onChange={(event) => setSubsectionFilter(event.target.value)}
                    disabled={activeTab === 'formulas'}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none disabled:opacity-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="">All subsections</option>
                    {subsectionOptions.map((subsectionId) => <option key={subsectionId} value={subsectionId}>{subsectionId}</option>)}
                  </select>

                  <select
                    value={publishFilter}
                    onChange={(event) => setPublishFilter(event.target.value as 'all' | 'published' | 'draft')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="all">All statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-center font-bold text-slate-500 dark:bg-white/5 dark:text-slate-300">Loading...</div>
              ) : (
                <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === item.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`}
                    >
                      <div className="truncate font-black text-slate-900 dark:text-white">{itemTitle(item)}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {activeTab === 'lessons' ? `${item.lesson_kind} / ${item.section_id || item.id}${item.subsection_id ? ` / ${item.subsection_id}` : ''}` : `${item.section_id} / ${item.subsection_id || 'no subsection'}`}
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-400">{item.id}</div>
                    </button>
                  ))}
                  {!filteredItems.length && (
                    <div className="rounded-2xl bg-slate-50 p-5 text-center font-bold text-slate-500 dark:bg-white/5 dark:text-slate-300">
                      No items match current filters.
                    </div>
                  )}
                  {items.length < totalItems && (
                    <button
                      onClick={() => void loadMoreItems()}
                      disabled={loadingMore}
                      className="w-full rounded-2xl border border-dashed border-primary-300 px-4 py-3 font-black text-primary-600 transition hover:bg-primary-50 disabled:opacity-50 dark:border-primary-500/40 dark:hover:bg-primary-500/10"
                    >
                      {loadingMore ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
              {activeTab === 'lessons' && lessonDraft ? (
                <LessonEditor
                  draft={lessonDraft}
                  saving={saving}
                  selectedItem={selectedItem}
                  onChange={(nextDraft) => {
                    setLessonDraft(nextDraft)
                    try {
                      setEditorValue(JSON.stringify(lessonDraftToPayload(nextDraft), null, 2))
                    } catch {
                      setEditorValue(JSON.stringify({ ...nextDraft }, null, 2))
                    }
                  }}
                  onSave={() => void saveItem()}
                  onDelete={() => void deleteItem()}
                />
              ) : activeTab === 'tests' && testDraft ? (
                <TestEditor
                  draft={testDraft}
                  saving={saving}
                  selectedItem={selectedItem}
                  onChange={(nextDraft) => {
                    setTestDraft(nextDraft)
                    setEditorValue(JSON.stringify(testDraftToPayload(nextDraft), null, 2))
                  }}
                  onSave={() => void saveItem()}
                  onDelete={() => void deleteItem()}
                />
              ) : activeTab === 'tasks' && taskDraft ? (
                <TaskEditor
                  draft={taskDraft}
                  saving={saving}
                  selectedItem={selectedItem}
                  onChange={(nextDraft) => {
                    setTaskDraft(nextDraft)
                    setEditorValue(JSON.stringify(taskDraftToPayload(nextDraft), null, 2))
                  }}
                  onSave={() => void saveItem()}
                  onDelete={() => void deleteItem()}
                />
              ) : activeTab === 'formulas' && formulaDraft ? (
                <FormulaEditor
                  draft={formulaDraft}
                  saving={saving}
                  selectedItem={selectedItem}
                  onChange={(nextDraft) => {
                    setFormulaDraft(nextDraft)
                    try {
                      setEditorValue(JSON.stringify(formulaDraftToPayload(nextDraft), null, 2))
                    } catch {
                      setEditorValue(JSON.stringify({ ...nextDraft }, null, 2))
                    }
                  }}
                  onSave={() => void saveItem()}
                  onDelete={() => void deleteItem()}
                />
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">JSON editor</h2>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Keep valid JSON. For formulas use LaTeX strings.</p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={saving || !editorValue} onClick={() => void saveItem()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">
                        <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button disabled={saving || !selectedItem?.id} onClick={() => void deleteItem()} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">
                        <Trash2 size={18} /> Delete
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={editorValue}
                    onChange={(event) => setEditorValue(event.target.value)}
                    spellCheck={false}
                    className="h-[650px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-50 outline-none ring-primary-500 transition focus:ring-4 dark:border-white/10"
                    placeholder="Select an item or create a new one"
                  />
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
