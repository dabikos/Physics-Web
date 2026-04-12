import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    Gamepad2,
    Search,
    CheckSquare,
    FunctionSquare,
    Link2,
    Trophy,
    Sparkles,
    ArrowLeft,
    Zap,
    Target,
    Brain,
    Flame,
    Sword
} from 'lucide-react'

// Импортируем игровые компоненты
import { FindError } from '@/components/games/FindError'
import { TrueFalse } from '@/components/games/TrueFalse'
import { GuessFormula } from '@/components/games/GuessFormula'
import { ConnectQuantities } from '@/components/games/ConnectQuantities'
import { TugOfWar } from '@/components/games/TugOfWar'

type GameType = 'find-error' | 'true-false' | 'guess-formula' | 'connect-quantities' | 'tug-of-war' | null

interface GameInfo {
    id: GameType
    title: string
    description: string
    icon: React.ReactNode
    color: string
    gradient: string
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedTime: string
}

const games: GameInfo[] = [
    {
        id: 'true-false',
        title: 'Правда или Ложь',
        description: 'Определите, верно ли утверждение о физических законах и явлениях',
        icon: <CheckSquare size={32} />,
        color: 'text-green-400',
        gradient: 'from-green-500 to-emerald-600',
        difficulty: 'easy',
        estimatedTime: '2-3 мин'
    },
    {
        id: 'guess-formula',
        title: 'Угадай формулу',
        description: 'Выберите правильную формулу для описанного физического явления',
        icon: <FunctionSquare size={32} />,
        color: 'text-yellow-400',
        gradient: 'from-yellow-500 to-orange-500',
        difficulty: 'medium',
        estimatedTime: '3-5 мин'
    },
    {
        id: 'connect-quantities',
        title: 'Соедини величины',
        description: 'Сопоставьте физические величины с их единицами измерения',
        icon: <Link2 size={32} />,
        color: 'text-blue-400',
        gradient: 'from-blue-500 to-cyan-500',
        difficulty: 'medium',
        estimatedTime: '3-4 мин'
    },
    {
        id: 'find-error',
        title: 'Найди ошибку',
        description: 'Найдите ошибку в решении физической задачи',
        icon: <Search size={32} />,
        color: 'text-red-400',
        gradient: 'from-red-500 to-rose-600',
        difficulty: 'hard',
        estimatedTime: '5-7 мин'
    },
    {
        id: 'tug-of-war',
        title: 'Перетягивание каната',
        description: 'Соревнуйтесь двумя командами! Правильные ответы тянут канат на вашу сторону',
        icon: <Sword size={32} />,
        color: 'text-purple-400',
        gradient: 'from-purple-500 to-pink-500',
        difficulty: 'medium',
        estimatedTime: '5-10 мин'
    }
]

const difficultyConfig = {
    easy: { label: 'Легко', color: 'text-green-400', bg: 'bg-green-500/20', icon: <Zap size={14} /> },
    medium: { label: 'Средне', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Target size={14} /> },
    hard: { label: 'Сложно', color: 'text-red-400', bg: 'bg-red-500/20', icon: <Flame size={14} /> }
}

export function WorldPage() {
    const { theme } = useTheme()
    const [selectedGame, setSelectedGame] = useState<GameType>(null)

    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
    const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
    const bgCard = theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/80'
    const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'

    const renderGame = () => {
        switch (selectedGame) {
            case 'find-error':
                return <FindError />
            case 'true-false':
                return <TrueFalse />
            case 'guess-formula':
                return <GuessFormula />
            case 'connect-quantities':
                return <ConnectQuantities />
            case 'tug-of-war':
                return <TugOfWar />
            default:
                return null
        }
    }

    const selectedGameInfo = games.find(g => g.id === selectedGame)

    return (
        <div className="pt-24 px-6 lg:px-8 min-h-screen pb-12">
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {selectedGame ? (
                        // Активная игра
                        <motion.div
                            key="game"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Заголовок игры */}
                            <div className="mb-8">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedGame(null)}
                                    className="mb-4"
                                >
                                    <ArrowLeft size={18} className="mr-2" />
                                    Назад к играм
                                </Button>

                                {selectedGameInfo && (
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedGameInfo.gradient} flex items-center justify-center text-white shadow-lg`}>
                                            {selectedGameInfo.icon}
                                        </div>
                                        <div>
                                            <h1 className={`text-3xl font-bold ${textColor}`}>
                                                {selectedGameInfo.title}
                                            </h1>
                                            <p className={textMuted}>{selectedGameInfo.description}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Игровой контент */}
                            <div className={selectedGame === 'tug-of-war' ? 'max-w-7xl mx-auto' : 'max-w-4xl mx-auto'}>
                                {renderGame()}
                            </div>
                        </motion.div>
                    ) : (
                        // Выбор игры
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Заголовок */}
                            <div className="text-center mb-12">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-2xl shadow-purple-500/30"
                                >
                                    <Gamepad2 size={40} className="text-white" />
                                </motion.div>
                                <h1 className={`text-4xl lg:text-5xl font-bold ${textColor} mb-4`}>
                                    World of Physics
                                </h1>
                                <p className={`text-xl ${textMuted} max-w-2xl mx-auto`}>
                                    Интерактивные игры для изучения физики. Проверьте свои знания и получите удовольствие!
                                </p>
                            </div>

                            {/* Статистика */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                {[
                                    { icon: <Trophy className="text-yellow-400" size={24} />, value: '4', label: 'Игры' },
                                    { icon: <Brain className="text-purple-400" size={24} />, value: 'AI', label: 'Генерация' },
                                    { icon: <Sparkles className="text-cyan-400" size={24} />, value: '∞', label: 'Вопросов' },
                                    { icon: <Zap className="text-green-400" size={24} />, value: '24/7', label: 'Доступ' }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                    >
                                        <Card className={`${bgCard} ${borderColor} p-4 text-center backdrop-blur-sm`}>
                                            <div className="flex items-center justify-center mb-2">
                                                {stat.icon}
                                            </div>
                                            <div className={`text-2xl font-bold ${textColor}`}>{stat.value}</div>
                                            <div className={`text-sm ${textMuted}`}>{stat.label}</div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Сетка игр */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {games.map((game, index) => {
                                    const difficulty = difficultyConfig[game.difficulty]

                                    return (
                                        <motion.div
                                            key={game.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                        >
                                            <Card
                                                className={`
                          ${bgCard} ${borderColor} p-6 cursor-pointer
                          transition-all duration-300 hover:scale-[1.02]
                          hover:shadow-2xl hover:shadow-purple-500/10
                          backdrop-blur-sm group relative overflow-hidden
                        `}
                                                onClick={() => setSelectedGame(game.id)}
                                            >
                                                {/* Градиентный фон при наведении */}
                                                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                                <div className="relative z-10">
                                                    {/* Заголовок */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                            {game.icon}
                                                        </div>

                                                        {/* Сложность */}
                                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${difficulty.bg}`}>
                                                            {difficulty.icon}
                                                            <span className={`text-xs font-medium ${difficulty.color}`}>
                                                                {difficulty.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Информация */}
                                                    <h3 className={`text-xl font-bold ${textColor} mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${game.gradient} transition-all duration-300`}>
                                                        {game.title}
                                                    </h3>
                                                    <p className={`${textMuted} text-sm mb-4 line-clamp-2`}>
                                                        {game.description}
                                                    </p>

                                                    {/* Нижняя часть */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles size={16} className="text-purple-400" />
                                                            <span className={`text-sm ${textMuted}`}>
                                                                AI генерация
                                                            </span>
                                                        </div>
                                                        <span className={`text-sm ${textMuted}`}>
                                                            ~{game.estimatedTime}
                                                        </span>
                                                    </div>

                                                    {/* Кнопка играть */}
                                                    <motion.div
                                                        className="mt-4 overflow-hidden"
                                                        initial={{ height: 0, opacity: 0 }}
                                                        whileHover={{ height: 'auto', opacity: 1 }}
                                                    >
                                                        <Button
                                                            variant="primary"
                                                            className={`w-full bg-gradient-to-r ${game.gradient} border-0`}
                                                        >
                                                            <Gamepad2 size={18} className="mr-2" />
                                                            Играть
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Информационный блок */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-12"
                            >
                                <Card className={`${bgCard} ${borderColor} p-8 text-center backdrop-blur-sm`}>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <Sparkles className="text-purple-400" size={24} />
                                        <h3 className={`text-xl font-bold ${textColor}`}>
                                            Powered by AI
                                        </h3>
                                    </div>
                                    <p className={`${textMuted} max-w-2xl mx-auto`}>
                                        Все вопросы и задания генерируются искусственным интеллектом в реальном времени.
                                        Каждый раз вы получаете уникальные задачи, адаптированные под темы физики.
                                    </p>
                                </Card>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
