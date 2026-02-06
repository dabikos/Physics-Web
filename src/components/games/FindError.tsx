import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { CheckCircle2, XCircle, ArrowRight, Loader2, Search, AlertCircle } from 'lucide-react'
import { generateText } from '@/lib/githubAI'

interface ErrorQuestion {
  problem: string
  steps: string[]
  errorStepIndex: number
  errorDescription: string
  correctSolution: string
}

export function FindError() {
  const { theme } = useTheme()
  const [currentQuestion, setCurrentQuestion] = useState<ErrorQuestion | null>(null)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'

  const topics = [
    'кинематика равномерного движения',
    'кинематика равноускоренного движения',
    'законы Ньютона',
    'закон всемирного тяготения',
    'работа и мощность',
    'кинетическая и потенциальная энергия',
    'закон сохранения импульса',
    'закон Ома для участка цепи',
    'закон Джоуля-Ленца',
    'оптика - преломление света',
    'термодинамика - теплопередача'
  ]

  useEffect(() => {
    generateQuestion()
  }, [])

  const generateQuestion = async () => {
    setIsGenerating(true)
    setError(null)
    setSelectedStep(null)
    setShowAnswer(false)

    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    const errorStep = Math.floor(Math.random() * 3) + 2

    try {
      const prompt = `Создай задачу для игры "Найди ошибку" по физике на тему: ${randomTopic}.

Требования:
1. Создай простую задачу с числами
2. Реши её в 4 шага, сделав ошибку в вычислении в шаге ${errorStep}
3. Ошибка должна быть в арифметике или применении формулы
4. Каждый шаг должен быть понятным и коротким
5. НЕ используй LaTeX - только простой текст
6. ВАЖНО: НЕ пиши слова "ОШИБКА" или пометки в шагах! Шаги должны выглядеть как обычное решение.

Формат:
ЗАДАЧА: [условие]
ШАГ1: [шаг]
ШАГ2: [шаг]
ШАГ3: [шаг]
ШАГ4: [шаг]
ОШИБКА_В_ШАГЕ: ${errorStep}
ОПИСАНИЕ_ОШИБКИ: [что неправильно]
ПРАВИЛЬНОЕ_РЕШЕНИЕ: [как правильно]`

      const response = await generateText({ prompt, maxTokens: 600 })

      const lines = response.split('\n').map(l => l.trim()).filter(l => l)
      let problem = ''
      const steps: string[] = []
      let errorStepIndex = errorStep - 1
      let errorDescription = ''
      let correctSolution = ''

      for (const line of lines) {
        if (line.startsWith('ЗАДАЧА:')) {
          problem = line.replace('ЗАДАЧА:', '').trim()
        } else if (line.match(/^ШАГ\d+:/)) {
          let stepText = line.replace(/^ШАГ\d+:\s*/, '').trim()
          // Убираем любые пометки об ошибках
          stepText = stepText.replace(/\s*\(ОШИБКА[!]*\)\s*/gi, '')
          stepText = stepText.replace(/\s*ОШИБКА[!]*\s*/gi, '')
          steps.push(stepText)
        } else if (line.startsWith('ОШИБКА_В_ШАГЕ:') || line.startsWith('ОШИБКА_В:')) {
          const stepNum = parseInt(line.replace(/ОШИБКА_В[_ШАГЕ]*:\s*/, '').replace(/шаг\s*/i, '').trim())
          if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 4) {
            errorStepIndex = stepNum - 1
          }
        } else if (line.startsWith('ОПИСАНИЕ_ОШИБКИ:')) {
          errorDescription = line.replace('ОПИСАНИЕ_ОШИБКИ:', '').trim()
        } else if (line.startsWith('ПРАВИЛЬНОЕ_РЕШЕНИЕ:') || line.startsWith('ПРАВИЛЬНЫЙ_ОТВЕТ:')) {
          correctSolution = line.replace(/ПРАВИЛЬН[А-Я_]*:/, '').trim()
        }
      }

      while (steps.length < 4) {
        steps.push('Вычисляем результат')
      }

      setCurrentQuestion({
        problem,
        steps,
        errorStepIndex,
        errorDescription: errorDescription || 'В этом шаге допущена ошибка',
        correctSolution: correctSolution || 'Проверьте вычисления'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации вопроса')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStepSelect = (stepIndex: number) => {
    if (selectedStep !== null) return

    setSelectedStep(stepIndex)
    if (stepIndex === currentQuestion?.errorStepIndex) {
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
        <Loader2 className="animate-spin text-red-500" size={32} />
        <span className={`ml-3 ${textMuted}`}>Генерация задания...</span>
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

  const isCorrect = selectedStep === currentQuestion.errorStepIndex

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className={textMuted + ' text-sm'}>Задание {questionNumber}</div>
          <div className={`${textColor} text-2xl font-bold`}>Счёт: {score}</div>
        </div>
        <Button variant="secondary" onClick={handleRestart}>
          Начать заново
        </Button>
      </div>

      <Card className={`${bgCard} ${borderColor} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-red-500" />
          <h3 className={`${textColor} text-lg font-semibold`}>Найдите шаг с ошибкой:</h3>
        </div>

        <div className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-700/80 to-slate-800/80' : 'bg-gradient-to-br from-blue-50 to-slate-50'}`}>
          <p className={`${textColor} font-medium mb-1 text-sm uppercase tracking-wide opacity-60`}>Условие:</p>
          <p className={`${textColor} text-lg`}>{currentQuestion.problem}</p>
        </div>

        <div className="mb-6">
          <p className={`${textColor} font-medium mb-3`}>Решение:</p>
          <div className="space-y-2">
            {currentQuestion.steps.map((step, index) => {
              const isSelected = selectedStep === index
              const isErrorStep = index === currentQuestion.errorStepIndex
              const showResults = selectedStep !== null

              return (
                <motion.button
                  key={index}
                  onClick={() => handleStepSelect(index)}
                  disabled={selectedStep !== null}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${showResults && isErrorStep
                      ? 'bg-red-500/20 border-red-500'
                      : isSelected && !isErrorStep
                        ? 'bg-red-500/10 border-red-500/50'
                        : isSelected
                          ? 'bg-green-500/20 border-green-500'
                          : `${borderColor} hover:border-red-500/50 cursor-pointer`
                    }
                  `}
                  whileHover={selectedStep === null ? { scale: 1.01, x: 4 } : {}}
                  whileTap={selectedStep === null ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-start gap-3">
                    <span className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${showResults && isErrorStep
                        ? 'bg-red-500 text-white'
                        : isSelected && isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-600 text-white'
                      }
                    `}>
                      {index + 1}
                    </span>
                    <span className={`${textColor} flex-1`}>{step}</span>
                    {showResults && isErrorStep && (
                      <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {selectedStep !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="text-green-500" size={24} />
                  <p className="text-green-400 font-bold text-lg">Правильно! Вы нашли ошибку.</p>
                </>
              ) : (
                <>
                  <XCircle className="text-red-500" size={24} />
                  <p className="text-red-400 font-bold text-lg">Неправильно. Ошибка в шаге {currentQuestion.errorStepIndex + 1}.</p>
                </>
              )}
            </div>
            <p className={textMuted}>{currentQuestion.errorDescription}</p>
          </motion.div>
        )}

        {selectedStep !== null && !showAnswer && (
          <Button
            variant="secondary"
            className="w-full mb-4"
            onClick={() => setShowAnswer(true)}
          >
            Показать правильное решение
          </Button>
        )}

        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}
          >
            <p className="text-green-400 font-medium mb-2">Правильное решение:</p>
            <p className={textColor}>{currentQuestion.correctSolution}</p>
          </motion.div>
        )}

        {selectedStep !== null && (
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
              Следующее задание
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  )
}
