import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { generateText } from '@/lib/githubAI'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface FormulaQuestion {
  description: string
  correctFormula: string
  options: string[]
}

// Функция для очистки LaTeX формулы
const cleanLatex = (formula: string): string => {
  if (!formula) return ''
  let cleaned = formula.trim()
  // Убираем LaTeX обёртки
  cleaned = cleaned.replace(/^\\\(|\\\)$/g, '')
  cleaned = cleaned.replace(/^\\\[|\\\]$/g, '')
  cleaned = cleaned.replace(/^\$\$?|\$\$?$/g, '')
  return cleaned.trim()
}

// Функция для проверки содержит ли текст LaTeX
const containsLatex = (text: string): boolean => {
  return /\\[a-zA-Z]+|\\frac|\\sqrt|\^|_|\{|\}/.test(text)
}

// Компонент для рендеринга текста с формулами
const RenderWithFormulas = ({ text, className = '' }: { text: string, className?: string }) => {
  if (!text) return null

  // Ищем inline формулы \( ... \) или $ ... $
  const parts = text.split(/(\\\(.*?\\\)|\$[^$]+\$)/g)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(/^\\\(.*\\\)$/)) {
          const formula = cleanLatex(part)
          try {
            return <InlineMath key={index} math={formula} />
          } catch {
            return <span key={index} className="font-mono text-purple-400">{formula}</span>
          }
        } else if (part.match(/^\$[^$]+\$$/)) {
          const formula = cleanLatex(part)
          try {
            return <InlineMath key={index} math={formula} />
          } catch {
            return <span key={index} className="font-mono text-purple-400">{formula}</span>
          }
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}

export function GuessFormula() {
  const { theme } = useTheme()
  const [currentQuestion, setCurrentQuestion] = useState<FormulaQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null)
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
    'кинематика', 'динамика', 'законы Ньютона', 'работа и энергия',
    'импульс', 'законы сохранения', 'колебания', 'волны',
    'электростатика', 'электрический ток', 'магнетизм', 'оптика',
    'термодинамика', 'молекулярная физика', 'гравитация'
  ]

  useEffect(() => {
    generateQuestion()
  }, [])

  const generateQuestion = async () => {
    setIsGenerating(true)
    setError(null)
    setSelectedAnswer(null)
    setIsCorrectAnswer(null)

    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    try {
      const prompt = `Создай вопрос для игры "Угадай формулу" по физике на тему: ${randomTopic}.

Требования:
1. Опиши физическое явление или ситуацию (2-3 предложения) БЕЗ использования LaTeX в описании
2. Дай правильную формулу в чистом LaTeX формате (без обёрток \\( \\) или $)
3. Создай 4 варианта ответа - один правильный, три похожих но неправильных

Формат вывода (строго соблюдай):
ОПИСАНИЕ: [описание явления простым текстом без формул]
ПРАВИЛЬНАЯ: [формула LaTeX без обёрток]
A) [формула 1]
B) [формула 2]
C) [формула 3]
D) [формула 4]

Пример правильного формата:
ОПИСАНИЕ: Тело массой m движется с ускорением a. Найдите действующую на него силу.
ПРАВИЛЬНАЯ: F = ma
A) F = ma
B) F = m/a
C) F = a/m
D) F = m + a

Создай вопрос на русском языке.`

      const response = await generateText({ prompt, maxTokens: 500 })

      // Парсим ответ
      const lines = response.split('\n').map(l => l.trim()).filter(l => l)
      let description = ''
      let correctFormula = ''
      const options: string[] = []

      for (const line of lines) {
        if (line.startsWith('ОПИСАНИЕ:')) {
          description = line.replace('ОПИСАНИЕ:', '').trim()
        } else if (line.startsWith('ПРАВИЛЬНАЯ:') || line.startsWith('ПРАВИЛЬНАЯ_ФОРМУЛА:')) {
          correctFormula = line.replace(/ПРАВИЛЬНАЯ[_ФОРМУЛА]*:/, '').trim()
          correctFormula = cleanLatex(correctFormula)
        } else if (line.match(/^[A-D]\)/)) {
          const option = line.replace(/^[A-D]\)\s*/, '').trim()
          options.push(cleanLatex(option))
        }
      }

      // Находим правильный вариант
      let correctIndex = options.findIndex(opt =>
        opt.replace(/\s/g, '') === correctFormula.replace(/\s/g, '')
      )

      // Если не нашли совпадение, заменяем первый вариант на правильный
      if (correctIndex === -1 && options.length > 0) {
        options[0] = correctFormula
        correctIndex = 0
      }

      // Перемешиваем варианты
      const shuffled = [...options]
      const correctAnswer = correctFormula
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      setCurrentQuestion({
        description,
        correctFormula: correctAnswer,
        options: shuffled
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации вопроса')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return

    setSelectedAnswer(index)
    const correct = currentQuestion?.options[index].replace(/\s/g, '') === currentQuestion?.correctFormula.replace(/\s/g, '')
    setIsCorrectAnswer(correct)

    if (correct) {
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
        <Loader2 className="animate-spin text-yellow-500" size={32} />
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
        <h3 className={`${textColor} text-lg font-semibold mb-4`}>Выберите правильную формулу:</h3>
        <p className={`${textMuted} text-base leading-relaxed mb-6`}>
          <RenderWithFormulas text={currentQuestion.description} />
        </p>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isRightAnswer = option.replace(/\s/g, '') === currentQuestion.correctFormula.replace(/\s/g, '')
            const showResult = selectedAnswer !== null

            let buttonClass = `${bgCard} ${borderColor} border-2 p-4 rounded-xl transition-all duration-200 text-left w-full`

            if (showResult) {
              if (isRightAnswer) {
                buttonClass += ' bg-green-500/20 border-green-500'
              } else if (isSelected && !isRightAnswer) {
                buttonClass += ' bg-red-500/20 border-red-500'
              }
            } else {
              buttonClass += ' hover:border-yellow-500/50 cursor-pointer'
            }

            return (
              <motion.button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={buttonClass}
                whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className={`${textColor} font-medium flex items-center gap-3`}>
                    <span className="text-lg font-bold text-purple-400">{String.fromCharCode(65 + index)})</span>
                    <span className="text-xl">
                      {containsLatex(option) ? (
                        <InlineMath math={option} />
                      ) : (
                        option
                      )}
                    </span>
                  </div>
                  {showResult && (
                    <AnimatePresence>
                      {isRightAnswer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <CheckCircle2 className="text-green-500" size={24} />
                        </motion.div>
                      )}
                      {isSelected && !isRightAnswer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <XCircle className="text-red-500" size={24} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

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
