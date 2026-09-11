import { useState } from 'react'
import { Sparkles, Loader2, ClipboardCheck, Smartphone, CheckCircle2, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { TestConfig } from '@/types/test'

interface TestGeneratorProps {
  topicTitle: string
  onGenerate: (config: TestConfig) => Promise<void>
  isGenerating: boolean
  error: string | null
}

export function TestGenerator({ topicTitle, onGenerate, isGenerating, error }: TestGeneratorProps) {
  const { theme } = useTheme()
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/70' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/90'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'

  const buttonActive = theme === 'dark'
    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
    : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'

  const buttonInactive = theme === 'dark'
    ? 'bg-white/10 text-white/70 hover:bg-white/15'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'

  const handleGenerate = () => {
    onGenerate({ questionCount, difficulty })
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Test Configuration (7 cols) */}
        <Card className={`md:col-span-7 ${bgCard} ${borderColor} p-6 rounded-2xl shadow-lg flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textColor}`}>Параметры теста</h3>
                <p className={`text-xs ${textMuted}`}>Тема: {topicTitle}</p>
              </div>
            </div>

            {/* Количество вопросов */}
            <div className="mb-5">
              <label className={`block text-xs font-semibold ${textColor} mb-2`}>
                Количество вопросов:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 5 as const, label: '5 вопросов', desc: 'Экспресс ~5 мин' },
                  { count: 10 as const, label: '10 вопросов', desc: 'Урок ~15 мин' },
                  { count: 15 as const, label: '15 вопросов', desc: 'Контроль ~25 мин' },
                ].map(({ count, label, desc }) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    disabled={isGenerating}
                    className={`
                      p-2.5 rounded-xl text-left transition-all duration-200 flex flex-col justify-between
                      ${questionCount === count ? buttonActive : buttonInactive}
                      ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] opacity-75 mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Сложность */}
            <div className="mb-6">
              <label className={`block text-xs font-semibold ${textColor} mb-2`}>
                Уровень сложности:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { diff: 'easy' as const, label: 'Легкий', desc: 'Базовые законы' },
                  { diff: 'medium' as const, label: 'Средний', desc: 'Формулы и расчеты' },
                  { diff: 'hard' as const, label: 'Сложный', desc: 'Комбинированные' },
                ].map(({ diff, label, desc }) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    disabled={isGenerating}
                    className={`
                      p-2.5 rounded-xl text-left transition-all duration-200 flex flex-col justify-between
                      ${difficulty === diff ? buttonActive : buttonInactive}
                      ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] opacity-75 mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Кнопка генерации */}
          <div>
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 h-11 text-sm font-semibold shadow-lg shadow-rose-500/25 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Генерация теста ИИ...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Сгенерировать тест по теме</span>
                </>
              )}
            </Button>

            {error && (
              <div className={`mt-3 p-3 rounded-xl text-xs ${theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {error}
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Classroom Info & Live Quiz Highlights (5 cols) */}
        <Card className={`md:col-span-5 ${bgCard} ${borderColor} p-6 rounded-2xl shadow-lg flex flex-col justify-between`}>
          <div>
            <h4 className={`text-sm font-bold ${textColor} mb-3 flex items-center gap-2`}>
              <Zap size={16} className="text-amber-400" />
              Как проходит тестирование
            </h4>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone size={13} />
                </div>
                <div>
                  <p className={`font-semibold ${textColor}`}>Синхронизация со смартфонами</p>
                  <p className={`${textMuted} text-[11px] leading-relaxed`}>Ученики подключаются по QR-коду и отвечают прямо со своих телефонов.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <p className={`font-semibold ${textColor}`}>Автоматическая проверка</p>
                  <p className={`${textMuted} text-[11px] leading-relaxed`}>Баллы и правильные варианты вычисляются мгновенно без ручной проверки.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award size={13} />
                </div>
                <div>
                  <p className={`font-semibold ${textColor}`}>Аналитика класса в реальном времени</p>
                  <p className={`${textMuted} text-[11px] leading-relaxed`}>На пульте учителя отображается сводная таблица успеваемости класса.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Формат: тестовые вопросы + расчет</span>
            <span className="text-emerald-400 font-semibold">Готово к запуску</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
