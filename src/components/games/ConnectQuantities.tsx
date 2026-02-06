import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { CheckCircle2, XCircle, ArrowRight, Loader2, Link2 } from 'lucide-react'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface Quantity {
  id: number
  name: string
  symbol: string
  unit: string
  unitSymbol: string
}

export function ConnectQuantities() {
  const { theme } = useTheme()
  const [quantities, setQuantities] = useState<Quantity[]>([])
  const [units, setUnits] = useState<{ name: string, symbol: string }[]>([])
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [connections, setConnections] = useState<Map<number, string>>(new Map())
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'

  // Заготовленные наборы с LaTeX символами
  const topicSets = [
    {
      name: 'Механика',
      quantities: [
        { name: 'Сила', symbol: 'F', unit: 'Ньютон', unitSymbol: 'Н' },
        { name: 'Импульс', symbol: 'p', unit: 'Килограмм-метр в секунду', unitSymbol: 'кг \\cdot м/с' },
        { name: 'Работа', symbol: 'A', unit: 'Джоуль', unitSymbol: 'Дж' },
        { name: 'Мощность', symbol: 'P', unit: 'Ватт', unitSymbol: 'Вт' }
      ],
      extra: [
        { name: 'Метр в секунду', symbol: 'м/с' },
        { name: 'Килограмм', symbol: 'кг' }
      ]
    },
    {
      name: 'Электричество',
      quantities: [
        { name: 'Сила тока', symbol: 'I', unit: 'Ампер', unitSymbol: 'А' },
        { name: 'Напряжение', symbol: 'U', unit: 'Вольт', unitSymbol: 'В' },
        { name: 'Сопротивление', symbol: 'R', unit: 'Ом', unitSymbol: '\\Omega' },
        { name: 'Ёмкость', symbol: 'C', unit: 'Фарад', unitSymbol: 'Ф' }
      ],
      extra: [
        { name: 'Кулон', symbol: 'Кл' },
        { name: 'Ватт', symbol: 'Вт' }
      ]
    },
    {
      name: 'Кинематика',
      quantities: [
        { name: 'Скорость', symbol: 'v', unit: 'Метр в секунду', unitSymbol: 'м/с' },
        { name: 'Ускорение', symbol: 'a', unit: 'Метр в секунду²', unitSymbol: 'м/с^2' },
        { name: 'Путь', symbol: 's', unit: 'Метр', unitSymbol: 'м' },
        { name: 'Время', symbol: 't', unit: 'Секунда', unitSymbol: 'с' }
      ],
      extra: [
        { name: 'Радиан', symbol: 'рад' },
        { name: 'Герц', symbol: 'Гц' }
      ]
    },
    {
      name: 'Термодинамика',
      quantities: [
        { name: 'Температура', symbol: 'T', unit: 'Кельвин', unitSymbol: 'К' },
        { name: 'Теплота', symbol: 'Q', unit: 'Джоуль', unitSymbol: 'Дж' },
        { name: 'Давление', symbol: 'p', unit: 'Паскаль', unitSymbol: 'Па' },
        { name: 'Объём', symbol: 'V', unit: 'Кубический метр', unitSymbol: 'м^3' }
      ],
      extra: [
        { name: 'Моль', symbol: 'моль' },
        { name: 'Атмосфера', symbol: 'атм' }
      ]
    },
    {
      name: 'Волны и оптика',
      quantities: [
        { name: 'Длина волны', symbol: '\\lambda', unit: 'Метр', unitSymbol: 'м' },
        { name: 'Частота', symbol: '\\nu', unit: 'Герц', unitSymbol: 'Гц' },
        { name: 'Период', symbol: 'T', unit: 'Секунда', unitSymbol: 'с' },
        { name: 'Скорость света', symbol: 'c', unit: 'Метр в секунду', unitSymbol: 'м/с' }
      ],
      extra: [
        { name: 'Кандела', symbol: 'кд' },
        { name: 'Люмен', symbol: 'лм' }
      ]
    },
    {
      name: 'Магнетизм',
      quantities: [
        { name: 'Магнитная индукция', symbol: 'B', unit: 'Тесла', unitSymbol: 'Тл' },
        { name: 'Магнитный поток', symbol: '\\Phi', unit: 'Вебер', unitSymbol: 'Вб' },
        { name: 'Индуктивность', symbol: 'L', unit: 'Генри', unitSymbol: 'Гн' },
        { name: 'ЭДС', symbol: '\\varepsilon', unit: 'Вольт', unitSymbol: 'В' }
      ],
      extra: [
        { name: 'Ампер', symbol: 'А' },
        { name: 'Ом', symbol: '\\Omega' }
      ]
    },
    {
      name: 'Гравитация',
      quantities: [
        { name: 'Масса', symbol: 'm', unit: 'Килограмм', unitSymbol: 'кг' },
        { name: 'Сила тяжести', symbol: 'F_g', unit: 'Ньютон', unitSymbol: 'Н' },
        { name: 'Ускорение свободного падения', symbol: 'g', unit: 'Метр в секунду²', unitSymbol: 'м/с^2' },
        { name: 'Гравитационная постоянная', symbol: 'G', unit: 'Н·м²/кг²', unitSymbol: 'Н \\cdot м^2/кг^2' }
      ],
      extra: [
        { name: 'Джоуль', symbol: 'Дж' },
        { name: 'Ватт', symbol: 'Вт' }
      ]
    },
    {
      name: 'Колебания',
      quantities: [
        { name: 'Амплитуда', symbol: 'A', unit: 'Метр', unitSymbol: 'м' },
        { name: 'Циклическая частота', symbol: '\\omega', unit: 'Радиан в секунду', unitSymbol: 'рад/с' },
        { name: 'Фаза', symbol: '\\varphi', unit: 'Радиан', unitSymbol: 'рад' },
        { name: 'Период', symbol: 'T', unit: 'Секунда', unitSymbol: 'с' }
      ],
      extra: [
        { name: 'Герц', symbol: 'Гц' },
        { name: 'Градус', symbol: '°' }
      ]
    }
  ]

  useEffect(() => {
    generateQuestion()
  }, [])

  const generateQuestion = async () => {
    setIsGenerating(true)
    setError(null)
    setSelectedQuantity(null)
    setSelectedUnit(null)
    setConnections(new Map())
    setIsComplete(false)

    // Выбираем случайный набор
    const randomSet = topicSets[Math.floor(Math.random() * topicSets.length)]

    const newQuantities: Quantity[] = randomSet.quantities.map((q, i) => ({
      id: i,
      name: q.name,
      symbol: q.symbol,
      unit: q.unit,
      unitSymbol: q.unitSymbol
    }))

    const allUnits = [
      ...randomSet.quantities.map(q => ({ name: q.unit, symbol: q.unitSymbol })),
      ...randomSet.extra
    ]

    // Перемешиваем единицы
    const shuffledUnits = [...allUnits].sort(() => Math.random() - 0.5)

    setQuantities(newQuantities)
    setUnits(shuffledUnits)
    setIsGenerating(false)
  }

  const handleQuantityClick = (quantityId: number) => {
    if (connections.has(quantityId)) return

    if (selectedQuantity === quantityId) {
      setSelectedQuantity(null)
    } else {
      setSelectedQuantity(quantityId)
      if (selectedUnit) {
        makeConnection(quantityId, selectedUnit)
      }
    }
  }

  const handleUnitClick = (unitSymbol: string) => {
    if (Array.from(connections.values()).includes(unitSymbol)) return

    if (selectedUnit === unitSymbol) {
      setSelectedUnit(null)
    } else {
      setSelectedUnit(unitSymbol)
      if (selectedQuantity !== null) {
        makeConnection(selectedQuantity, unitSymbol)
      }
    }
  }

  const makeConnection = (quantityId: number, unitSymbol: string) => {
    const quantity = quantities.find(q => q.id === quantityId)
    if (!quantity) return

    const newConnections = new Map(connections)
    newConnections.set(quantityId, unitSymbol)
    setConnections(newConnections)
    setSelectedQuantity(null)
    setSelectedUnit(null)

    // Проверяем правильность
    if (quantity.unitSymbol === unitSymbol) {
      setScore(prev => prev + 1)
    }

    // Проверяем завершение
    if (newConnections.size === quantities.length) {
      setIsComplete(true)
    }
  }

  const handleNext = () => {
    setQuestionNumber(prev => prev + 1)
    setScore(0)
    generateQuestion()
  }

  const handleRestart = () => {
    setScore(0)
    setQuestionNumber(1)
    generateQuestion()
  }

  const isCorrect = (quantityId: number) => {
    const quantity = quantities.find(q => q.id === quantityId)
    const connectedUnit = connections.get(quantityId)
    return quantity && connectedUnit === quantity.unitSymbol
  }

  if (isGenerating && quantities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className={`ml-3 ${textMuted}`}>Генерация задания...</span>
      </div>
    )
  }

  if (error && quantities.length === 0) {
    return (
      <Card className={`${bgCard} ${borderColor} p-6`}>
        <div className="text-center">
          <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-4`}>{error}</p>
          <Button onClick={generateQuestion}>Попробовать снова</Button>
        </div>
      </Card>
    )
  }

  if (quantities.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Score and Question Number */}
      <div className="flex items-center justify-between">
        <div>
          <div className={textMuted + ' text-sm'}>Задание {questionNumber}</div>
          <div className={`${textColor} text-2xl font-bold`}>Счёт: {score}/{quantities.length}</div>
        </div>
        <Button variant="secondary" onClick={handleRestart}>
          Начать заново
        </Button>
      </div>

      {/* Instructions */}
      <Card className={`${bgCard} ${borderColor} p-4`}>
        <div className="flex items-center gap-2">
          <Link2 size={20} className="text-blue-500" />
          <p className={textMuted}>
            Соедините физическую величину с её единицей измерения в системе СИ.
          </p>
        </div>
      </Card>

      {/* Quantities and Units */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quantities */}
        <Card className={`${bgCard} ${borderColor} p-6`}>
          <h3 className={`${textColor} font-semibold mb-4`}>Физические величины:</h3>
          <div className="space-y-3">
            {quantities.map((quantity) => {
              const connectedUnit = connections.get(quantity.id)
              const isSelected = selectedQuantity === quantity.id
              const correct = isCorrect(quantity.id)
              const isConnected = connections.has(quantity.id)

              return (
                <motion.button
                  key={quantity.id}
                  onClick={() => handleQuantityClick(quantity.id)}
                  disabled={isConnected}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${isConnected
                      ? correct
                        ? 'bg-green-500/20 border-green-500'
                        : 'bg-red-500/20 border-red-500'
                      : isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : `${borderColor} hover:border-blue-500/50 cursor-pointer`
                    }
                  `}
                  whileHover={!isConnected ? { scale: 1.02 } : {}}
                  whileTap={!isConnected ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-purple-400">
                        <InlineMath math={quantity.symbol} />
                      </span>
                      <span className={`${textColor} font-medium`}>({quantity.name})</span>
                    </div>
                    {isConnected && (
                      <AnimatePresence>
                        {correct ? (
                          <CheckCircle2 className="text-green-500" size={20} />
                        ) : (
                          <XCircle className="text-red-500" size={20} />
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                  {connectedUnit && (
                    <p className={`${textMuted} text-sm mt-1 ml-8`}>
                      → <InlineMath math={connectedUnit} />
                    </p>
                  )}
                </motion.button>
              )
            })}
          </div>
        </Card>

        {/* Units */}
        <Card className={`${bgCard} ${borderColor} p-6`}>
          <h3 className={`${textColor} font-semibold mb-4`}>Единицы измерения:</h3>
          <div className="space-y-3">
            {units.map((unit, index) => {
              const isSelected = selectedUnit === unit.symbol
              const isConnected = Array.from(connections.values()).includes(unit.symbol)

              return (
                <motion.button
                  key={index}
                  onClick={() => handleUnitClick(unit.symbol)}
                  disabled={isConnected}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${isConnected
                      ? 'bg-slate-500/20 border-slate-500 opacity-50'
                      : isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : `${borderColor} hover:border-blue-500/50 cursor-pointer`
                    }
                  `}
                  whileHover={!isConnected ? { scale: 1.02 } : {}}
                  whileTap={!isConnected ? { scale: 0.98 } : {}}
                >
                  <span className={`${textColor} font-medium text-lg`}>
                    <InlineMath math={unit.symbol} />
                  </span>
                </motion.button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Next Button */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`${bgCard} ${borderColor} p-6`}>
            <div className="text-center mb-4">
              <p className={`${textColor} text-xl font-bold mb-2`}>
                Задание завершено!
              </p>
              <p className={textMuted}>
                Правильных соединений: {score} из {quantities.length}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleNext}
            >
              Следующее задание
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
