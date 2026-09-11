import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
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
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const buttonActive = theme === 'dark' ? 'bg-primary-600 text-white' : 'bg-primary-600 text-white'
  const buttonInactive = theme === 'dark' ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'

  const handleGenerate = () => {
    onGenerate({ questionCount, difficulty })
  }

  return (
    <Card className={`${bgCard} ${borderColor} p-5 sm:p-6 max-w-xl mx-auto rounded-2xl shadow-lg`}>
      <div className="text-center mb-5">
        <h3 className={`text-xl font-bold ${textColor} mb-1`}>Параметры теста</h3>
        <p className={`text-xs ${textMuted}`}>Тема: {topicTitle}</p>
      </div>

      {/* Количество вопросов */}
      <div className="mb-4">
        <label className={`block text-xs font-semibold ${textColor} mb-2`}>
          Количество вопросов:
        </label>
        <div className="flex gap-2.5">
          {([5, 10, 15] as const).map(count => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              disabled={isGenerating}
              className={`
                flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200
                ${questionCount === count ? buttonActive : buttonInactive}
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {count} вопросов
            </button>
          ))}
        </div>
      </div>

      {/* Сложность */}
      <div className="mb-5">
        <label className={`block text-xs font-semibold ${textColor} mb-2`}>
          Сложность:
        </label>
        <div className="flex gap-2.5">
          {(['easy', 'medium', 'hard'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              disabled={isGenerating}
              className={`
                flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 capitalize
                ${difficulty === diff ? buttonActive : buttonInactive}
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {diff === 'easy' ? 'Легкий' : diff === 'medium' ? 'Средний' : 'Сложный'}
            </button>
          ))}
        </div>
      </div>

      {/* Кнопка генерации */}
      <Button
        variant="primary"
        size="md"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 h-10 text-xs sm:text-sm font-semibold shadow-md shadow-rose-500/20"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Генерация теста...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Сгенерировать тест</span>
          </>
        )}
      </Button>

      {error && (
        <div className={`mt-3 p-3 rounded-xl text-xs ${theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {error}
        </div>
      )}
    </Card>
  )
}





