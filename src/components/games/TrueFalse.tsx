import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { generateText } from '@/lib/githubAI'

interface TrueFalseQuestion {
  statement: string
  isTrue: boolean
  explanation: string
}

export function TrueFalse() {
  const { theme } = useTheme()
  const [currentQuestion, setCurrentQuestion] = useState<TrueFalseQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'

  // Темы для разнообразия
  const topics = [
    'механика', 'термодинамика', 'электричество', 'магнетизм',
    'оптика', 'атомная физика', 'ядерная физика', 'волны',
    'гравитация', 'специальная теория относительности', 'квантовая механика',
    'молекулярная физика', 'кинематика', 'динамика', 'статика'
  ]

  useEffect(() => {
    generateQuestion()
  }, [])

  const generateQuestion = async () => {
    setIsGenerating(true)
    setError(null)
    setSelectedAnswer(null)

    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    const shouldBeTrue = Math.random() > 0.5

    try {
      const prompt = `Создай ${shouldBeTrue ? 'ПРАВИЛЬНОЕ' : 'НЕПРАВИЛЬНОЕ'} утверждение для игры "Правда или Ложь" по физике на тему: ${randomTopic}.

Требования:
1. Утверждение должно быть ${shouldBeTrue ? 'ВЕРНЫМ' : 'ЗАВЕДОМО ЛОЖНЫМ'} фактом о физике
2. Утверждение должно быть на русском языке
3. Не используй LaTeX/математические формулы - только простой текст
4. Дай краткое объяснение (1-2 предложения)

Формат вывода:
УТВЕРЖДЕНИЕ: [текст утверждения]
ОТВЕТ: ${shouldBeTrue ? 'ПРАВДА' : 'ЛОЖЬ'}
ОБЪЯСНЕНИЕ: [краткое объяснение почему это ${shouldBeTrue ? 'правда' : 'ложь'}]

Пример:
УТВЕРЖДЕНИЕ: Скорость света в вакууме составляет примерно 300 000 км/с
ОТВЕТ: ПРАВДА
ОБЪЯСНЕНИЕ: Скорость света в вакууме действительно составляет около 299 792 км/с, что округляется до 300 000 км/с.`

      const response = await generateText({ prompt, maxTokens: 300 })

      // Парсим ответ
      const lines = response.split('\n').map(l => l.trim()).filter(l => l)
      let statement = ''
      let isTrue = shouldBeTrue
      let explanation = ''

      for (const line of lines) {
        if (line.startsWith('УТВЕРЖДЕНИЕ:')) {
          statement = line.replace('УТВЕРЖДЕНИЕ:', '').trim()
        } else if (line.startsWith('ОТВЕТ:')) {
          const answer = line.replace('ОТВЕТ:', '').trim().toUpperCase()
          isTrue = answer.includes('ПРАВДА') || answer.includes('ВЕРНО') || answer.includes('TRUE')
        } else if (line.startsWith('ОБЪЯСНЕНИЕ:')) {
          explanation = line.replace('ОБЪЯСНЕНИЕ:', '').trim()
        }
      }

      setCurrentQuestion({
        statement,
        isTrue,
        explanation: explanation || 'Это интересный факт физики!'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации вопроса')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = (answer: boolean) => {
    if (selectedAnswer !== null) return

    setSelectedAnswer(answer)
    if (answer === currentQuestion?.isTrue) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    setQuestionNumber(prev => prev + 1)
    generateQuestion()
  }

  const handleRestart = () => {
    setScore(0)
    setQuestionNumber(1)
    generateQuestion()
  }

  if (isGenerating && !currentQuestion) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-green-500" size={32} />
        <span className={`ml-3 ${textMuted}`}>Генерация вопроса...</span>
      </div>
    )
  }

  if (error && !currentQuestion) {
    return (
      <Card className={`${bgCard} ${borderColor} p-6`}>
        <div className="text-center">
          <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-4`}>{error}</p>
          <Button onClick={generateQuestion}>Попробовать снова</Button>
        </div>
      </Card>
    )
  }

  if (!currentQuestion) return null

  const isCorrect = selectedAnswer === currentQuestion.isTrue

  return (
    <div className="space-y-6">
      {/* Score and Question Number */}
      <div className="flex items-center justify-between">
        <div>
          <div className={textMuted + ' text-sm'}>Вопрос {questionNumber}</div>
          <div className={`${textColor} text-2xl font-bold`}>Счёт: {score}</div>
        </div>
        <Button variant="secondary" onClick={handleRestart}>
          Начать заново
        </Button>
      </div>

      {/* Question */}
      <Card className={`${bgCard} ${borderColor} p-6`}>
        <h3 className={`${textColor} text-lg font-semibold mb-4`}>Оцените верность утверждения:</h3>
        <div className={`p-6 rounded-xl mb-6 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-700/80 to-slate-800/80' : 'bg-gradient-to-br from-slate-100 to-slate-50'}`}>
          <p className={`${textColor} text-xl leading-relaxed font-medium text-center`}>
            "{currentQuestion.statement}"
          </p>
        </div>

        {/* Answer Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            onClick={() => handleAnswer(true)}
            disabled={selectedAnswer !== null}
            className={`
              ${bgCard} ${borderColor} border-2 p-6 rounded-xl transition-all duration-200
              ${selectedAnswer === true
                ? isCorrect
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-red-500/20 border-red-500'
                : selectedAnswer !== null && currentQuestion.isTrue
                  ? 'bg-green-500/20 border-green-500'
                  : 'hover:border-green-500/50 cursor-pointer'
              }
            `}
            whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
            whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
          >
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2
                size={40}
                className={
                  selectedAnswer !== null && currentQuestion.isTrue
                    ? 'text-green-500'
                    : selectedAnswer === true && !isCorrect
                      ? 'text-red-500'
                      : 'text-green-400/60'
                }
              />
              <span className={`${textColor} font-bold text-xl`}>Правда</span>
            </div>
          </motion.button>

          <motion.button
            onClick={() => handleAnswer(false)}
            disabled={selectedAnswer !== null}
            className={`
              ${bgCard} ${borderColor} border-2 p-6 rounded-xl transition-all duration-200
              ${selectedAnswer === false
                ? isCorrect
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-red-500/20 border-red-500'
                : selectedAnswer !== null && !currentQuestion.isTrue
                  ? 'bg-green-500/20 border-green-500'
                  : 'hover:border-red-500/50 cursor-pointer'
              }
            `}
            whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
            whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
          >
            <div className="flex flex-col items-center gap-3">
              <XCircle
                size={40}
                className={
                  selectedAnswer !== null && !currentQuestion.isTrue
                    ? 'text-green-500'
                    : selectedAnswer === false && !isCorrect
                      ? 'text-red-500'
                      : 'text-red-400/60'
                }
              />
              <span className={`${textColor} font-bold text-xl`}>Ложь</span>
            </div>
          </motion.button>
        </div>

        {/* Explanation */}
        {selectedAnswer !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle2 className="text-green-500" size={24} />
              ) : (
                <XCircle className="text-red-500" size={24} />
              )}
              <p className={`${isCorrect ? 'text-green-400' : 'text-red-400'} font-bold text-lg`}>
                {isCorrect ? 'Правильно!' : 'Неправильно!'}
              </p>
            </div>
            <p className={`${textMuted} text-base leading-relaxed`}>{currentQuestion.explanation}</p>
          </motion.div>
        )}

        {/* Next Button */}
        {selectedAnswer !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleNext}
            >
              Следующий вопрос
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  )
}
