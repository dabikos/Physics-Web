import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { Trophy, RotateCcw } from 'lucide-react'

interface Question {
    question: string
    answer: number
}

// SVG персонаж тянущий канат
const TugPerson = ({
    teamColor,
    direction,
    isPulling
}: {
    teamColor: 'blue' | 'red'
    direction: 'left' | 'right'
    isPulling: boolean
}) => {
    const skinColor = '#FFDAB9'
    const shirtColor = teamColor === 'blue' ? '#3B82F6' : '#EF4444'
    const pantsColor = teamColor === 'blue' ? '#1E40AF' : '#991B1B'
    const hairColor = '#4A3728'
    const flip = direction === 'right' ? -1 : 1

    return (
        <motion.svg
            width="60"
            height="100"
            viewBox="0 0 60 100"
            animate={{
                rotate: isPulling ? [0, -8, 0, -5, 0] : [0, -2, 0],
                x: isPulling ? [0, -3, 0] : 0
            }}
            transition={{
                duration: isPulling ? 0.4 : 0.8,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            style={{ transform: `scaleX(${flip})` }}
        >
            {/* Голова */}
            <ellipse cx="30" cy="18" rx="12" ry="14" fill={skinColor} />

            {/* Волосы */}
            <ellipse cx="30" cy="12" rx="12" ry="8" fill={hairColor} />

            {/* Глаза */}
            <circle cx="26" cy="18" r="2" fill="#333" />
            <circle cx="34" cy="18" r="2" fill="#333" />

            {/* Брови (напряжённые) */}
            <motion.line
                x1="23" y1="14" x2="28" y2="15"
                stroke="#333"
                strokeWidth="2"
                animate={{ y1: isPulling ? [14, 12, 14] : 14 }}
                transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.line
                x1="32" y1="15" x2="37" y2="14"
                stroke="#333"
                strokeWidth="2"
                animate={{ y1: isPulling ? [15, 13, 15] : 15 }}
                transition={{ duration: 0.3, repeat: Infinity }}
            />

            {/* Рот (напряжение) */}
            <motion.path
                d="M 26 24 Q 30 26 34 24"
                stroke="#333"
                strokeWidth="2"
                fill="none"
                animate={{
                    d: isPulling
                        ? ["M 26 24 Q 30 28 34 24", "M 26 24 Q 30 26 34 24"]
                        : "M 26 24 Q 30 26 34 24"
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
            />

            {/* Тело (рубашка) */}
            <rect x="20" y="32" width="20" height="28" rx="3" fill={shirtColor} />

            {/* Руки вытянуты вперёд */}
            <motion.g
                animate={{
                    rotate: isPulling ? [-15, -25, -15] : [-15, -18, -15]
                }}
                transition={{ duration: 0.4, repeat: Infinity }}
                style={{ transformOrigin: '20px 38px' }}
            >
                {/* Левая рука */}
                <rect x="5" y="35" width="18" height="8" rx="4" fill={skinColor} />
                <rect x="0" y="36" width="8" height="6" rx="3" fill={skinColor} /> {/* Кисть */}
            </motion.g>

            <motion.g
                animate={{
                    rotate: isPulling ? [-15, -25, -15] : [-15, -18, -15]
                }}
                transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }}
                style={{ transformOrigin: '40px 38px' }}
            >
                {/* Правая рука */}
                <rect x="37" y="35" width="18" height="8" rx="4" fill={skinColor} />
                <rect x="52" y="36" width="8" height="6" rx="3" fill={skinColor} /> {/* Кисть */}
            </motion.g>

            {/* Ноги в позе упора */}
            <motion.g
                animate={{
                    rotate: isPulling ? [5, 15, 5] : [5, 8, 5]
                }}
                transition={{ duration: 0.4, repeat: Infinity }}
                style={{ transformOrigin: '25px 60px' }}
            >
                <rect x="20" y="60" width="9" height="25" rx="3" fill={pantsColor} />
                <rect x="18" y="82" width="12" height="8" rx="2" fill="#333" /> {/* Ботинок */}
            </motion.g>

            <motion.g
                animate={{
                    rotate: isPulling ? [-10, -20, -10] : [-10, -12, -10]
                }}
                transition={{ duration: 0.4, repeat: Infinity, delay: 0.15 }}
                style={{ transformOrigin: '35px 60px' }}
            >
                <rect x="31" y="60" width="9" height="25" rx="3" fill={pantsColor} />
                <rect x="30" y="82" width="12" height="8" rx="2" fill="#333" /> {/* Ботинок */}
            </motion.g>
        </motion.svg>
    )
}

// Группа персонажей команды
const TeamCharacters = ({
    teamColor,
    direction,
    isPulling
}: {
    teamColor: 'blue' | 'red'
    direction: 'left' | 'right'
    isPulling: boolean
}) => {
    return (
        <div className={`flex items-end ${direction === 'right' ? 'flex-row-reverse' : ''}`}>
            <TugPerson teamColor={teamColor} direction={direction} isPulling={isPulling} />
            <div className={direction === 'right' ? 'mr-[-15px]' : 'ml-[-15px]'}>
                <TugPerson teamColor={teamColor} direction={direction} isPulling={isPulling} />
            </div>
        </div>
    )
}

export function TugOfWar() {
    const { theme } = useTheme()
    const [position, setPosition] = useState(50)
    const [team1Question, setTeam1Question] = useState<Question | null>(null)
    const [team2Question, setTeam2Question] = useState<Question | null>(null)
    const [team1Input, setTeam1Input] = useState('')
    const [team2Input, setTeam2Input] = useState('')
    const [team1Score, setTeam1Score] = useState(0)
    const [team2Score, setTeam2Score] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [winner, setWinner] = useState<1 | 2 | null>(null)
    const [team1Feedback, setTeam1Feedback] = useState<'correct' | 'wrong' | null>(null)
    const [team2Feedback, setTeam2Feedback] = useState<'correct' | 'wrong' | null>(null)
    const [team1Pulling, setTeam1Pulling] = useState(false)
    const [team2Pulling, setTeam2Pulling] = useState(false)

    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
    const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'

    const MOVE_AMOUNT = 8
    const WIN_THRESHOLD = 15

    const generateSimpleQuestion = (): Question => {
        const types = ['add', 'subtract', 'multiply', 'physics']
        const type = types[Math.floor(Math.random() * types.length)]

        switch (type) {
            case 'add': {
                const a = Math.floor(Math.random() * 50) + 10
                const b = Math.floor(Math.random() * 50) + 10
                return { question: `${a} + ${b} = ?`, answer: a + b }
            }
            case 'subtract': {
                const a = Math.floor(Math.random() * 50) + 30
                const b = Math.floor(Math.random() * 30) + 1
                return { question: `${a} - ${b} = ?`, answer: a - b }
            }
            case 'multiply': {
                const a = Math.floor(Math.random() * 12) + 2
                const b = Math.floor(Math.random() * 12) + 2
                return { question: `${a} × ${b} = ?`, answer: a * b }
            }
            case 'physics': {
                const physicsQuestions = [
                    () => {
                        const v = Math.floor(Math.random() * 10) + 2
                        const t = Math.floor(Math.random() * 10) + 1
                        return { question: `S = v×t\nv=${v}, t=${t}\nS = ?`, answer: v * t }
                    },
                    () => {
                        const m = Math.floor(Math.random() * 10) + 1
                        const a = Math.floor(Math.random() * 10) + 1
                        return { question: `F = m×a\nm=${m}, a=${a}\nF = ?`, answer: m * a }
                    },
                    () => {
                        const p = Math.floor(Math.random() * 100) + 20
                        const t = Math.floor(Math.random() * 5) + 1
                        return { question: `A = P×t\nP=${p}, t=${t}\nA = ?`, answer: p * t }
                    }
                ]
                return physicsQuestions[Math.floor(Math.random() * physicsQuestions.length)]()
            }
            default: {
                const a = Math.floor(Math.random() * 50) + 10
                const b = Math.floor(Math.random() * 50) + 10
                return { question: `${a} + ${b} = ?`, answer: a + b }
            }
        }
    }

    const generateQuestions = useCallback(() => {
        setTeam1Question(generateSimpleQuestion())
        setTeam2Question(generateSimpleQuestion())
        setTeam1Input('')
        setTeam2Input('')
        setTeam1Feedback(null)
        setTeam2Feedback(null)
    }, [])

    useEffect(() => {
        generateQuestions()
    }, [generateQuestions])

    const handleTeam1Submit = () => {
        if (!team1Question || team1Input === '') return

        const isCorrect = parseInt(team1Input) === team1Question.answer
        setTeam1Feedback(isCorrect ? 'correct' : 'wrong')

        if (isCorrect) {
            setTeam1Pulling(true)
            setTeam1Score(prev => prev + 1)
            setPosition(prev => {
                const newPos = prev - MOVE_AMOUNT
                if (newPos <= WIN_THRESHOLD) {
                    setGameOver(true)
                    setWinner(1)
                    return WIN_THRESHOLD
                }
                return newPos
            })
            setTimeout(() => setTeam1Pulling(false), 800)
        }

        setTimeout(() => {
            setTeam1Question(generateSimpleQuestion())
            setTeam1Input('')
            setTeam1Feedback(null)
        }, 600)
    }

    const handleTeam2Submit = () => {
        if (!team2Question || team2Input === '') return

        const isCorrect = parseInt(team2Input) === team2Question.answer
        setTeam2Feedback(isCorrect ? 'correct' : 'wrong')

        if (isCorrect) {
            setTeam2Pulling(true)
            setTeam2Score(prev => prev + 1)
            setPosition(prev => {
                const newPos = prev + MOVE_AMOUNT
                if (newPos >= 100 - WIN_THRESHOLD) {
                    setGameOver(true)
                    setWinner(2)
                    return 100 - WIN_THRESHOLD
                }
                return newPos
            })
            setTimeout(() => setTeam2Pulling(false), 800)
        }

        setTimeout(() => {
            setTeam2Question(generateSimpleQuestion())
            setTeam2Input('')
            setTeam2Feedback(null)
        }, 600)
    }

    const handleRestart = () => {
        setPosition(50)
        setTeam1Score(0)
        setTeam2Score(0)
        setGameOver(false)
        setWinner(null)
        setTeam1Pulling(false)
        setTeam2Pulling(false)
        generateQuestions()
    }

    const NumberPad = ({
        value,
        onChange,
        onSubmit,
        teamColor
    }: {
        value: string
        onChange: (val: string) => void
        onSubmit: () => void
        teamColor: 'blue' | 'red'
    }) => {
        const bgBtn = 'bg-slate-700 hover:bg-slate-600 active:bg-slate-500'
        const submitBg = teamColor === 'blue'
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-green-500 hover:bg-green-600'

        return (
            <div className="grid grid-cols-3 gap-2 mt-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => onChange(value + num)}
                        className={`${bgBtn} text-white font-bold py-2.5 px-3 rounded-lg text-lg transition-all active:scale-95`}
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={() => onChange('')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-all active:scale-95"
                >
                    C
                </button>
                <button
                    onClick={() => onChange(value + '0')}
                    className={`${bgBtn} text-white font-bold py-2.5 px-3 rounded-lg text-lg transition-all active:scale-95`}
                >
                    0
                </button>
                <button
                    onClick={onSubmit}
                    className={`${submitBg} text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-all active:scale-95`}
                >
                    Алга!
                </button>
            </div>
        )
    }

    // Victory screen
    if (gameOver && winner) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <Card className={`p-10 ${theme === 'dark' ? 'bg-slate-800/90' : 'bg-white'}`}>
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                            <Trophy className={`mx-auto mb-4 ${winner === 1 ? 'text-blue-500' : 'text-red-500'}`} size={80} />
                        </motion.div>

                        <h2 className={`${textColor} text-3xl font-bold mb-3`}>
                            🎉 {winner}-Команда победила! 🎉
                        </h2>
                        <p className={textMuted + ' text-lg mb-6'}>
                            Синие {team1Score} — {team2Score} Красные
                        </p>

                        <Button variant="primary" size="lg" onClick={handleRestart} className="px-10">
                            <RotateCcw size={20} className="mr-2" />
                            Играть снова
                        </Button>
                    </Card>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Title */}
            <h2 className={`${textColor} text-2xl font-bold mb-4 text-center`}>
                🏆 ПЕРЕТЯГИВАНИЕ КАНАТА 🏆
            </h2>

            {/* Main Layout */}
            <div className="grid grid-cols-[1fr_2fr_1fr] gap-3 items-start">

                {/* Team 1 */}
                <motion.div
                    animate={{
                        boxShadow: team1Feedback === 'correct'
                            ? '0 0 30px rgba(34, 197, 94, 0.8)'
                            : team1Feedback === 'wrong'
                                ? '0 0 30px rgba(239, 68, 68, 0.8)'
                                : 'none'
                    }}
                    className="bg-blue-600 rounded-xl p-3 shadow-lg"
                >
                    <div className="text-center mb-3">
                        <h3 className="text-white text-lg font-bold">1-Команда</h3>
                        <div className="text-blue-200 text-sm">Очки: {team1Score}</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 mb-3 min-h-[70px] flex items-center justify-center">
                        <p className="text-slate-900 text-lg font-bold text-center whitespace-pre-line">
                            {team1Question?.question || '...'}
                        </p>
                    </div>

                    <div className={`
            bg-white rounded-lg p-3 text-center text-xl font-bold text-slate-900 min-h-[48px]
            ${team1Feedback === 'correct' ? 'bg-green-200' : team1Feedback === 'wrong' ? 'bg-red-200' : ''}
          `}>
                        {team1Input || '—'}
                    </div>

                    <NumberPad value={team1Input} onChange={setTeam1Input} onSubmit={handleTeam1Submit} teamColor="blue" />
                </motion.div>

                {/* Center - Characters and Rope */}
                <div className="flex flex-col items-center">
                    <div className="relative w-full h-[200px] flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-green-200 to-green-300">

                        {/* Grass */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-500" />

                        {/* Rope */}
                        <motion.div
                            animate={{ x: (50 - position) * 4 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            className="absolute w-[120%] h-3 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 rounded-full top-[55%]"
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                        />

                        {/* Team 1 Characters */}
                        <motion.div
                            animate={{ x: (50 - position) * 3 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            className="absolute left-[10%] bottom-8"
                        >
                            <TeamCharacters teamColor="blue" direction="left" isPulling={team1Pulling || position < 50} />
                        </motion.div>

                        {/* Flag marker */}
                        <motion.div
                            animate={{ left: `${position}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            className="absolute bottom-12 -translate-x-1/2 z-10"
                        >
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-8 h-10 bg-white rounded shadow-lg border-2 border-slate-300 flex items-center justify-center text-xl">
                                    🚩
                                </div>
                                <div className="w-1 h-6 bg-slate-600 rounded" />
                            </motion.div>
                        </motion.div>

                        {/* Team 2 Characters */}
                        <motion.div
                            animate={{ x: (50 - position) * 3 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            className="absolute right-[10%] bottom-8"
                        >
                            <TeamCharacters teamColor="red" direction="right" isPulling={team2Pulling || position > 50} />
                        </motion.div>

                        {/* Center line */}
                        <div className="absolute w-0.5 h-full bg-white/50 left-1/2 -translate-x-1/2" />
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full mt-4 px-4">
                        <div className="h-5 bg-gradient-to-r from-blue-500 via-slate-400 to-red-500 rounded-full relative overflow-hidden shadow-inner">
                            <motion.div
                                animate={{ left: `${position}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                className="absolute w-5 h-5 bg-white rounded-full shadow-lg -translate-x-1/2 border-2 border-slate-700"
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm font-bold">
                            <span className="text-blue-500">🏆 ПОБЕДА</span>
                            <span className={textMuted}>{Math.abs(50 - position)}%</span>
                            <span className="text-red-500">ПОБЕДА 🏆</span>
                        </div>
                    </div>

                    <Button variant="secondary" onClick={handleRestart} className="mt-4">
                        <RotateCcw size={16} className="mr-2" />
                        Заново
                    </Button>
                </div>

                {/* Team 2 */}
                <motion.div
                    animate={{
                        boxShadow: team2Feedback === 'correct'
                            ? '0 0 30px rgba(34, 197, 94, 0.8)'
                            : team2Feedback === 'wrong'
                                ? '0 0 30px rgba(239, 68, 68, 0.8)'
                                : 'none'
                    }}
                    className="bg-red-600 rounded-xl p-3 shadow-lg"
                >
                    <div className="text-center mb-3">
                        <h3 className="text-white text-lg font-bold">2-Команда</h3>
                        <div className="text-red-200 text-sm">Очки: {team2Score}</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 mb-3 min-h-[70px] flex items-center justify-center">
                        <p className="text-slate-900 text-lg font-bold text-center whitespace-pre-line">
                            {team2Question?.question || '...'}
                        </p>
                    </div>

                    <div className={`
            bg-white rounded-lg p-3 text-center text-xl font-bold text-slate-900 min-h-[48px]
            ${team2Feedback === 'correct' ? 'bg-green-200' : team2Feedback === 'wrong' ? 'bg-red-200' : ''}
          `}>
                        {team2Input || '—'}
                    </div>

                    <NumberPad value={team2Input} onChange={setTeam2Input} onSubmit={handleTeam2Submit} teamColor="red" />
                </motion.div>
            </div>
        </div>
    )
}
