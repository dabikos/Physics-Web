import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { Sparkles, Home, ArrowRight, Star, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'

interface LessonCompleteProps {
    topicTitle: string
    onGoHome: () => void
    onContinue: () => void
}

// SVG Дерево с анимацией роста
const GrowingTree = ({ stage }: { stage: number }) => {
    return (
        <svg width="200" height="280" viewBox="0 0 200 280">
            {/* Земля */}
            <ellipse cx="100" cy="270" rx="80" ry="15" fill="#8B4513" opacity="0.6" />

            {/* Ствол - появляется на stage >= 1 */}
            <motion.rect
                x="90"
                y="180"
                width="20"
                height="90"
                rx="5"
                fill="#8B4513"
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: stage >= 1 ? 1 : 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Левая ветка */}
            <motion.path
                d="M 95 200 Q 60 180 50 150"
                stroke="#8B4513"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: stage >= 2 ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            />

            {/* Правая ветка */}
            <motion.path
                d="M 105 200 Q 140 180 150 150"
                stroke="#8B4513"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: stage >= 2 ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            />

            {/* Крона - центр */}
            <motion.ellipse
                cx="100"
                cy="120"
                rx="50"
                ry="45"
                fill="#22C55E"
                initial={{ scale: 0 }}
                animate={{ scale: stage >= 3 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.5, type: "spring" }}
            />

            {/* Крона - левая */}
            <motion.ellipse
                cx="55"
                cy="140"
                rx="35"
                ry="30"
                fill="#16A34A"
                initial={{ scale: 0 }}
                animate={{ scale: stage >= 3 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.6, type: "spring" }}
            />

            {/* Крона - правая */}
            <motion.ellipse
                cx="145"
                cy="140"
                rx="35"
                ry="30"
                fill="#16A34A"
                initial={{ scale: 0 }}
                animate={{ scale: stage >= 3 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.7, type: "spring" }}
            />

            {/* Крона - верх */}
            <motion.ellipse
                cx="100"
                cy="85"
                rx="40"
                ry="35"
                fill="#4ADE80"
                initial={{ scale: 0 }}
                animate={{ scale: stage >= 4 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
            />

            {/* Яблоки/плоды */}
            {stage >= 5 && (
                <>
                    <motion.circle
                        cx="70"
                        cy="110"
                        r="8"
                        fill="#EF4444"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                    />
                    <motion.circle
                        cx="130"
                        cy="105"
                        r="8"
                        fill="#EF4444"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                    />
                    <motion.circle
                        cx="100"
                        cy="75"
                        r="8"
                        fill="#EF4444"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                    />
                    <motion.circle
                        cx="55"
                        cy="135"
                        r="7"
                        fill="#F59E0B"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                    />
                    <motion.circle
                        cx="145"
                        cy="130"
                        r="7"
                        fill="#F59E0B"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                    />
                </>
            )}

            {/* Звёздочки/искры */}
            {stage >= 5 && (
                <>
                    <motion.g
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -20, -40] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                        <text x="60" y="60" fontSize="16">✨</text>
                    </motion.g>
                    <motion.g
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -15, -30] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, delay: 0.5 }}
                    >
                        <text x="140" y="70" fontSize="16">✨</text>
                    </motion.g>
                    <motion.g
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -25, -50] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2, delay: 1 }}
                    >
                        <text x="100" y="50" fontSize="20">⭐</text>
                    </motion.g>
                </>
            )}
        </svg>
    )
}

// Маленький росток
const Sprout = ({ delay = 0 }: { delay?: number }) => {
    return (
        <motion.svg
            width="40"
            height="60"
            viewBox="0 0 40 60"
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay, duration: 0.5, type: "spring" }}
        >
            {/* Земля */}
            <ellipse cx="20" cy="55" rx="15" ry="5" fill="#8B4513" opacity="0.5" />

            {/* Стебель */}
            <motion.path
                d="M 20 55 Q 20 40 20 30"
                stroke="#22C55E"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: delay + 0.2, duration: 0.4 }}
            />

            {/* Левый листик */}
            <motion.ellipse
                cx="14"
                cy="25"
                rx="8"
                ry="12"
                fill="#4ADE80"
                transform="rotate(-30 14 25)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.4, type: "spring" }}
            />

            {/* Правый листик */}
            <motion.ellipse
                cx="26"
                cy="25"
                rx="8"
                ry="12"
                fill="#22C55E"
                transform="rotate(30 26 25)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.5, type: "spring" }}
            />
        </motion.svg>
    )
}

export function LessonComplete({ topicTitle, onGoHome, onContinue }: LessonCompleteProps) {
    const { theme } = useTheme()
    const [treeStage, setTreeStage] = useState(0)
    const [showButtons, setShowButtons] = useState(false)
    const [xpEarned] = useState(Math.floor(Math.random() * 50) + 50)

    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
    const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
    const bgOverlay = theme === 'dark'
        ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-green-900/30'
        : 'bg-gradient-to-b from-blue-100 via-white to-green-100'

    useEffect(() => {
        // Анимация роста дерева
        const stages = [1, 2, 3, 4, 5]
        stages.forEach((stage, index) => {
            setTimeout(() => {
                setTreeStage(stage)
                if (stage === 5) {
                    // Конфетти при завершении
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    })
                    setTimeout(() => setShowButtons(true), 500)
                }
            }, (index + 1) * 600)
        })
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bgOverlay}`}
        >
            {/* Заголовок */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
            >
                <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block"
                >
                    <Trophy className="text-yellow-500 mx-auto mb-2" size={48} />
                </motion.div>
                <h1 className={`${textColor} text-3xl font-bold mb-2`}>
                    🎉 Урок завершён! 🎉
                </h1>
                <p className={textMuted + ' text-lg'}>{topicTitle}</p>
            </motion.div>

            {/* Дерево и ростки */}
            <div className="relative flex items-end justify-center gap-4 mb-8">
                {/* Левые ростки */}
                <div className="flex gap-2 items-end">
                    <Sprout delay={0.5} />
                    <Sprout delay={0.7} />
                </div>

                {/* Главное дерево */}
                <GrowingTree stage={treeStage} />

                {/* Правые ростки */}
                <div className="flex gap-2 items-end">
                    <Sprout delay={0.9} />
                    <Sprout delay={1.1} />
                </div>
            </div>

            {/* XP награда */}
            <AnimatePresence>
                {treeStage >= 5 && (
                    <motion.div
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className={`
              flex items-center gap-3 px-6 py-3 rounded-full
              ${theme === 'dark' ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-yellow-100 border border-yellow-300'}
            `}>
                            <Star className="text-yellow-500" fill="currentColor" size={24} />
                            <span className={`${textColor} font-bold text-xl`}>+{xpEarned} XP</span>
                            <Sparkles className="text-yellow-500" size={20} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Кнопки */}
            <AnimatePresence>
                {showButtons && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex gap-4"
                    >
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={onGoHome}
                            className="px-6"
                        >
                            <Home size={20} className="mr-2" />
                            На главную
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={onContinue}
                            className="px-6"
                        >
                            Продолжить обучение
                            <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Фоновая трава */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-600/30 to-transparent" />
        </motion.div>
    )
}
