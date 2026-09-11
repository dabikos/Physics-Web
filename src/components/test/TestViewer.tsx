import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { TestQuestion } from '@/types/test'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'

interface TestViewerProps {
  questions: TestQuestion[]
  onComplete: (answers: number[]) => void
}

export function TestViewer({ questions, onComplete }: TestViewerProps) {
  const { theme } = useTheme()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/70' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const optionBg = theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
  const optionSelected = theme === 'dark' ? 'bg-primary-600 text-white' : 'bg-primary-600 text-white'
  const optionBorder = theme === 'dark' ? 'border-white/20' : 'border-slate-300'

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Завершаем тест (заменяем null на -1 для неотвеченных вопросов)
      const finalAnswers = answers.map(a => a !== null ? a : -1)
      onComplete(finalAnswers)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const question = questions[currentQuestion]
  const selectedAnswer = answers[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1
  const allAnswered = answers.every(a => a !== null)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Прогресс */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-semibold ${textMuted}`}>
              Вопрос {currentQuestion + 1} из {questions.length}
            </span>
            <span className="text-[11px] text-primary-400 font-mono">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Вопрос */}
      <Card className={`${bgCard} ${borderColor} p-5 sm:p-6 rounded-2xl shadow-lg`}>
        <div className="mb-4">
          <h3 className={`text-base sm:text-lg font-bold ${textColor} leading-snug`}>
            <MarkdownRenderer content={question.question} />
          </h3>
        </div>

        {/* Варианты ответов */}
        <div className="space-y-2.5">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const optionLabel = String.fromCharCode(65 + index) // A, B, C, D

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                className={`
                  w-full p-3 rounded-xl border transition-all duration-200 text-left
                  ${isSelected ? optionSelected : `${optionBg} ${optionBorder}`}
                  ${isSelected ? 'ring-2 ring-primary-400' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0
                    ${isSelected 
                      ? 'bg-white/20 text-white' 
                      : theme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-slate-200 text-slate-700'
                    }
                  `}>
                    {optionLabel}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <MarkdownRenderer content={option} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={16} className="text-white shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Навигация */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold"
        >
          <ChevronLeft size={15} />
          <span>Назад</span>
        </Button>

        <div className="flex items-center gap-1.5">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-200
                ${index === currentQuestion 
                  ? 'bg-primary-600 ring-2 ring-primary-400/50 scale-125' 
                  : answers[index] !== null 
                    ? 'bg-emerald-500/80' 
                    : theme === 'dark' ? 'bg-white/20' : 'bg-slate-300'
                }
              `}
              title={`Вопрос ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleNext}
          className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold"
        >
          <span>{isLastQuestion ? 'Завершить' : 'Далее'}</span>
          <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  )
}
