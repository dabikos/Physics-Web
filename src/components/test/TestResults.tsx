import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Award,
  Sparkles,
  AlertCircle,
  Check,
  X,
  BookOpen,
  Lightbulb,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/Button'
import { TestQuestion, TestResult } from '@/types/test'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'

interface TestResultsProps {
  questions: TestQuestion[]
  result: TestResult
  onRestart: () => void
}

export function TestResults({ questions, result, onRestart }: TestResultsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect'>('all')

  const score = result.score
  const isExcellent = score >= 85
  const isGood = score >= 70 && score < 85
  const isFair = score >= 50 && score < 70

  const correctCount = result.correctAnswers
  const totalCount = result.totalQuestions
  const incorrectCount = totalCount - correctCount

  // Trigger celebration confetti on high score
  useEffect(() => {
    if (score >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#22d3ee', '#10b981', '#facc15', '#6366f1'],
        })
      } catch {
        // ignore if not supported
      }
    }
  }, [score])

  // Circular gauge calculations
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Color schemes
  const getThemeColors = () => {
    if (isExcellent) {
      return {
        gradient: 'from-emerald-400 via-teal-300 to-cyan-400',
        stroke: '#10b981',
        strokeEnd: '#06b6d4',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/20',
        bgPill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        title: 'Превосходный результат!',
        subtitle: 'Вы отлично усвоили материал этой темы и безошибочно ориентируетесь в формулах.',
        badgeIcon: Trophy,
      }
    }
    if (isGood) {
      return {
        gradient: 'from-cyan-400 via-blue-400 to-indigo-400',
        stroke: '#06b6d4',
        strokeEnd: '#6366f1',
        border: 'border-cyan-500/30',
        glow: 'shadow-cyan-500/20',
        bgPill: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        title: 'Хорошая работа!',
        subtitle: 'Тема освоена уверенно. Обратите внимание на несколько деталей в разборе ниже.',
        badgeIcon: Award,
      }
    }
    if (isFair) {
      return {
        gradient: 'from-amber-400 via-orange-400 to-amber-500',
        stroke: '#f59e0b',
        strokeEnd: '#f97316',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/20',
        bgPill: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        title: 'Базовый уровень освоен',
        subtitle: 'Часть ответов верна, но рекомендуется повторить формулы и законы в слайдах теории.',
        badgeIcon: Sparkles,
      }
    }
    return {
      gradient: 'from-rose-400 via-pink-400 to-rose-500',
      stroke: '#f43f5e',
      strokeEnd: '#fb7185',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
      bgPill: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      title: 'Нужно повторить материал',
      subtitle: 'Не расстраивайтесь: разберите подробные объяснения к ошибкам ниже и пройдите тест заново.',
      badgeIcon: AlertCircle,
    }
  }

  const colorScheme = getThemeColors()
  const StatusIcon = colorScheme.badgeIcon

  // Filtered questions
  const filteredQuestions = questions
    .map((question, index) => ({ question, index, answerResult: result.answers[index] }))
    .filter(({ answerResult }) => {
      if (activeFilter === 'correct') return answerResult?.isCorrect
      if (activeFilter === 'incorrect') return !answerResult?.isCorrect
      return true
    })

  return (
    <div className="w-full max-w-4xl mx-auto space-y-7 pb-10">
      {/* ────────────────── 1. SUMMARY HERO CARD ────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={`relative overflow-hidden rounded-3xl border ${colorScheme.border} bg-gradient-to-br from-slate-900/90 via-[#0a1226]/90 to-slate-950/95 p-6 sm:p-9 backdrop-blur-2xl shadow-2xl ${colorScheme.glow}`}
      >
        {/* Ambient background glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center md:flex-row md:items-center md:justify-between gap-8 text-center md:text-left">
          {/* Left: Badge, Title, Subtitle */}
          <div className="flex-1 max-w-xl">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold ${colorScheme.bgPill} mb-4`}>
              <StatusIcon className="h-4 w-4 shrink-0" />
              <span>{colorScheme.title}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Результаты тестирования
            </h2>

            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300">
              {colorScheme.subtitle}
            </p>

            {/* Quick Metrics Bar */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold text-slate-400">Правильно</p>
                <p className="mt-1 text-xl font-black text-emerald-400">
                  {correctCount} <span className="text-xs font-normal text-slate-400">/ {totalCount}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold text-slate-400">Ошибок</p>
                <p className="mt-1 text-xl font-black text-rose-400">
                  {incorrectCount}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold text-slate-400">Успешность</p>
                <p className="mt-1 text-xl font-black text-cyan-300">
                  {score}%
                </p>
              </div>
            </div>
          </div>

          {/* Right: Circular SVG Gauge */}
          <div className="relative flex flex-col items-center justify-center shrink-0">
            <div className="relative h-40 w-40 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
                <defs>
                  <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colorScheme.stroke} />
                    <stop offset="100%" stopColor={colorScheme.strokeEnd} />
                  </linearGradient>
                </defs>
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Animated Progress Ring */}
                <motion.circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="url(#scoreGaugeGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{
                    strokeDasharray: circumference,
                  }}
                />
              </svg>

              {/* Center percentage label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className={`text-4xl font-black tracking-tight bg-gradient-to-r ${colorScheme.gradient} bg-clip-text text-transparent`}>
                  {score}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  Балл теста
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ────────────────── 2. FILTER TABS & HEADING ────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            Разбор ответов и пояснения
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Проверьте правильность каждого ответа и прочитайте теоретические пояснения с формулами
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/60 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Все ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('correct')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'correct'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-white/5'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Верно ({correctCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('incorrect')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'incorrect'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-rose-300 hover:bg-white/5'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Ошибки ({incorrectCount})
          </button>
        </div>
      </div>

      {/* ────────────────── 3. DETAILED QUESTION CARDS ────────────────── */}
      <div className="space-y-5">
        <AnimatePresence mode="popLayout">
          {filteredQuestions.map(({ question, index, answerResult }) => {
            const isCorrect = answerResult?.isCorrect
            const selectedIdx = answerResult?.selectedAnswer
            const selectedOption =
              selectedIdx !== null && selectedIdx !== undefined && selectedIdx >= 0
                ? question.options[selectedIdx]
                : 'Ответ не был выбран'
            const correctOption = question.options[answerResult?.correctAnswer ?? question.correctAnswer]
            const explanation = answerResult?.explanation || question.explanation

            return (
              <motion.div
                key={question.id || index}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={`group relative rounded-2xl border backdrop-blur-xl p-5 sm:p-7 transition-all ${
                  isCorrect
                    ? 'border-emerald-500/25 bg-gradient-to-b from-emerald-950/15 via-slate-900/60 to-slate-950/70 hover:border-emerald-500/40'
                    : 'border-rose-500/25 bg-gradient-to-b from-rose-950/15 via-slate-900/60 to-slate-950/70 hover:border-rose-500/40'
                }`}
              >
                {/* Header: Question Number & Badge */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/10 text-xs font-black text-white">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-300">
                      Вопрос {index + 1} из {totalCount}
                    </span>
                  </div>

                  {isCorrect ? (
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Верно (+1 балл)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-extrabold text-rose-300">
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Неправильно</span>
                    </div>
                  )}
                </div>

                {/* Question Body */}
                <div className="text-base sm:text-lg font-bold text-white leading-relaxed mb-5">
                  <MarkdownRenderer content={question.question} />
                </div>

                {/* Comparison Grid: User Answer vs Correct Answer */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* User Answer */}
                  <div
                    className={`rounded-xl border p-3.5 backdrop-blur-sm ${
                      isCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-400">Ваш ответ:</span>
                      {isCorrect ? (
                        <span className="text-emerald-300 flex items-center gap-1 text-[11px]">
                          <Check className="h-3 w-3" /> Совпадает
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                          <X className="h-3 w-3" /> Неверно
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm">
                      <MarkdownRenderer content={selectedOption} />
                    </div>
                  </div>

                  {/* Correct Answer (always shown so student learns) */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-100 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-emerald-300">
                      <span>Правильный ответ:</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="font-semibold text-sm text-emerald-200">
                      <MarkdownRenderer content={correctOption} />
                    </div>
                  </div>
                </div>

                {/* Theoretical Solution & Formula Explanation */}
                {explanation && (
                  <div className="mt-4 rounded-xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-indigo-950/30 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300 mb-2">
                      <Lightbulb className="h-4 w-4 text-cyan-400" />
                      <span>Пояснение и формула решения:</span>
                    </div>
                    <div className="text-sm leading-relaxed text-slate-200">
                      <MarkdownRenderer content={explanation} />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredQuestions.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-slate-400">
            Вопросов в этой категории не найдено.
          </div>
        )}
      </div>

      {/* ────────────────── 4. ACTION BAR ────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Button
          variant="primary"
          size="lg"
          onClick={onRestart}
          className="group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 px-8 py-4 text-base font-black text-slate-950 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition hover:-translate-y-0.5"
        >
          <RotateCcw className="h-5 w-5 transition group-hover:-rotate-90 duration-300" />
          <span>Пройти тест заново</span>
        </Button>
      </div>
    </div>
  )
}
