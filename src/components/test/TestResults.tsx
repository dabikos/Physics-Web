import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { TestQuestion, TestResult } from '@/types/test'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'

interface TestResultsProps {
  questions: TestQuestion[]
  result: TestResult
  onRestart: () => void
}

export function TestResults({ questions, result, onRestart }: TestResultsProps) {
  const { theme } = useTheme()

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/70' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const correctBg = theme === 'dark' ? 'bg-green-500/20 border-green-500/30' : 'bg-green-50 border-green-200'
  const incorrectBg = theme === 'dark' ? 'bg-red-500/20 border-red-500/30' : 'bg-red-50 border-red-200'

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme === 'dark' ? 'text-green-400' : 'text-green-600'
    if (score >= 60) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
    return theme === 'dark' ? 'text-red-400' : 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Отлично!'
    if (score >= 80) return 'Хорошо!'
    if (score >= 60) return 'Удовлетворительно'
    return 'Нужно повторить материал'
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Общий результат */}
      <Card className={`${bgCard} ${borderColor} p-8 text-center`}>
        <div className="mb-6">
          <h2 className={`text-3xl font-bold ${textColor} mb-4`}>Результаты теста</h2>
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
            {result.score}%
          </div>
          <p className={`text-xl font-semibold ${getScoreColor(result.score)}`}>
            {getScoreLabel(result.score)}
          </p>
        </div>
        <div className="flex items-center justify-center gap-8">
          <div>
            <div className={`text-2xl font-bold ${textColor}`}>
              {result.correctAnswers} / {result.totalQuestions}
            </div>
            <div className={textMuted}>Правильных ответов</div>
          </div>
        </div>
      </Card>

      {/* Детальные результаты */}
      <div className="space-y-4">
        <h3 className={`text-2xl font-bold ${textColor} mb-4`}>Проверка ответов</h3>
        {questions.map((question, index) => {
          const answerResult = result.answers[index]
          const isCorrect = answerResult.isCorrect
          const selectedOption = answerResult.selectedAnswer !== null && answerResult.selectedAnswer >= 0
            ? question.options[answerResult.selectedAnswer] 
            : 'Не отвечено'
          const correctOption = question.options[answerResult.correctAnswer]

          return (
            <Card
              key={index}
              className={`${isCorrect ? correctBg : incorrectBg} ${borderColor} p-6`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 size={24} className="text-green-500" />
                  ) : (
                    <XCircle size={24} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`font-semibold ${textColor}`}>
                      Вопрос {index + 1}:
                    </span>
                    {isCorrect ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Правильно
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Неправильно
                      </span>
                    )}
                  </div>
                  <div className={`mb-4 ${textColor}`}>
                    <MarkdownRenderer content={question.question} />
                  </div>
                  
                  {!isCorrect && (
                    <div className="mb-3">
                      <div className={`text-sm font-semibold mb-1 ${textMuted}`}>
                        Ваш ответ:
                      </div>
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-red-500/10' : 'bg-red-100'}`}>
                        <MarkdownRenderer content={selectedOption} />
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <div className={`text-sm font-semibold mb-1 ${textMuted}`}>
                      Правильный ответ:
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-500/10' : 'bg-green-100'}`}>
                      <MarkdownRenderer content={correctOption} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className={`text-sm font-semibold mb-2 ${textMuted}`}>
                      Пояснение:
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <MarkdownRenderer content={answerResult.explanation} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Кнопка перезапуска */}
      <div className="flex justify-center pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={onRestart}
          className="flex items-center gap-2"
        >
          <RotateCcw size={20} />
          Пройти тест заново
        </Button>
      </div>
    </div>
  )
}

