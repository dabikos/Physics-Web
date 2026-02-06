import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { PlantIcon, PlantStage, STAGE_NAMES } from './PlantStages'
import { X, RefreshCw, Shuffle, TreeDeciduous, Sprout, Leaf, Minus, Plus } from 'lucide-react'

interface ClassGardenProps {
    isOpen: boolean
    onClose: () => void
    onFinish: () => void
}

interface StudentData {
    id: string
    name: string
    email: string
    class_id?: string | null
    total_score: number
    manual_adjustment: number
    total_with_adjustment: number
    stage: PlantStage
}

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8003'

export function ClassGarden({ isOpen, onClose, onFinish }: ClassGardenProps) {
    const { theme } = useTheme()
    const { token } = useAuth()
    const [studentCount, setStudentCount] = useState(20)
    const [students, setStudents] = useState<StudentData[]>([])
    const [classes, setClasses] = useState<string[]>([])
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const scoreToStage = (score: number): PlantStage => {
        const stage = Math.max(0, Math.min(9, Math.floor(score / 10)))
        return stage as PlantStage
    }

    const fetchJson = async (path: string) => {
        const response = await fetch(`${API_BASE}/api${path}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            throw new Error(data?.detail || 'Ошибка загрузки')
        }
        return response.json()
    }

    const loadClasses = async () => {
        const data = await fetchJson('/teacher/classes')
        const list = Array.isArray(data?.classes) ? data.classes : []
        setClasses(list)
        if (!selectedClass && list.length > 0) {
            setSelectedClass(list[0])
        }
    }

    const loadStudents = async (classId?: string) => {
        const query = classId ? `?class_id=${encodeURIComponent(classId)}` : ''
        const data = await fetchJson(`/teacher/students${query}`)
        const mapped: StudentData[] = (Array.isArray(data) ? data : []).map((s: any) => {
            const total = Number(s.total_with_adjustment || 0)
            return {
                id: s.id,
                name: s.name || s.email || 'Ученик',
                email: s.email || '',
                class_id: s.class_id,
                total_score: Number(s.total_score || 0),
                manual_adjustment: Number(s.manual_adjustment || 0),
                total_with_adjustment: total,
                stage: scoreToStage(total),
            }
        })
        setStudents(mapped)
    }

    useEffect(() => {
        if (!isOpen || !token) return
        setLoading(true)
        Promise.all([loadClasses()]).finally(() => setLoading(false))
    }, [isOpen, token])

    useEffect(() => {
        if (!isOpen || !token) return
        setLoading(true)
        loadStudents(selectedClass || undefined)
            .finally(() => setLoading(false))
    }, [isOpen, token, selectedClass])

    const visibleStudents = useMemo(() =>
        students.slice(0, studentCount),
        [students, studentCount]
    )

    // Статистика
    const stats = useMemo(() => {
        const seeds = visibleStudents.filter(s => s.stage <= 1).length
        const sprouts = visibleStudents.filter(s => s.stage >= 2 && s.stage <= 6).length
        const trees = visibleStudents.filter(s => s.stage >= 7).length
        return { seeds, sprouts, trees }
    }, [visibleStudents])

    const applyAdjustment = async (studentId: string, delta: number) => {
        const student = students.find(s => s.id === studentId)
        if (!student) return
        const nextAdjustment = student.manual_adjustment + delta
        try {
            await fetch(`${API_BASE}/api/teacher/students/${studentId}/adjustment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ manual_adjustment: nextAdjustment }),
            })
            setStudents(prev => prev.map(s => {
                if (s.id !== studentId) return s
                const total = s.total_score + nextAdjustment
                return {
                    ...s,
                    manual_adjustment: nextAdjustment,
                    total_with_adjustment: total,
                    stage: scoreToStage(total),
                }
            }))
        } catch (error) {
            console.error('Adjustment error', error)
        }
    }

    const handleReset = () => {
        setStudents(prev => prev.map(s => ({ ...s, stage: 0 as PlantStage })))
    }

    const handleRandomize = () => {
        setStudents(prev => prev.map(s => ({
            ...s,
            stage: Math.floor(Math.random() * 10) as PlantStage
        })))
    }

    const handleSetAllTrees = () => {
        setStudents(prev => prev.map(s => ({ ...s, stage: 9 as PlantStage })))
    }

    const handleSetAllSprouts = () => {
        setStudents(prev => prev.map(s => ({
            ...s,
            stage: (Math.floor(Math.random() * 5) + 2) as PlantStage
        })))
    }

    // Theme styles
    const bgOverlay = theme === 'dark'
        ? 'bg-slate-900/95'
        : 'bg-white/95'
    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
    const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
    const cardBg = theme === 'dark'
        ? 'bg-slate-800/80 border-slate-700/50'
        : 'bg-white border-slate-200'
    const studentCardBg = theme === 'dark'
        ? 'bg-slate-800/60 hover:bg-slate-700/60 border-slate-700/30'
        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-50 ${bgOverlay} backdrop-blur-sm overflow-auto`}
            >
                <div className="min-h-screen p-6">
                    {/* Header */}
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className={`text-3xl font-bold ${textColor}`}>
                                    🌱 Классный сад
                                </h1>
                                <p className={`${textMuted} mt-1`}>
                                    Отслеживайте прогресс учеников
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleSetAllTrees}
                                    className="flex items-center gap-2"
                                >
                                    <TreeDeciduous size={16} />
                                    Все деревья
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleSetAllSprouts}
                                    className="flex items-center gap-2"
                                >
                                    <Sprout size={16} />
                                    Все ростки
                                </Button>
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'} transition-colors`}
                                >
                                    <X size={24} className={textColor} />
                                </button>
                            </div>
                        </div>

                        {/* Class select */}
                        <div className={`p-4 rounded-xl border ${cardBg} mb-6 flex items-center gap-4`}>
                            <span className={`${textMuted} text-sm`}>Класс</span>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="rounded-lg px-3 py-2 bg-transparent border border-slate-300 dark:border-white/10 text-sm"
                            >
                                {classes.length === 0 && <option value="">—</option>}
                                {classes.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            {loading && <span className={`${textMuted} text-sm`}>Загрузка...</span>}
                        </div>

                        {/* Student count slider */}
                        <div className={`p-4 rounded-xl border ${cardBg} mb-6`}>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setStudentCount(Math.max(1, studentCount - 1))}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} transition-colors`}
                                    >
                                        −
                                    </button>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${textColor}`}>{studentCount}</div>
                                        <div className={`text-xs ${textMuted}`}>учеников</div>
                                    </div>
                                    <button
                                        onClick={() => setStudentCount(Math.min(30, studentCount + 1))}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} transition-colors`}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <Slider
                                        min={1}
                                        max={30}
                                        value={studentCount}
                                        onChange={setStudentCount}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Students grid */}
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 mb-6">
                            <AnimatePresence mode="popLayout">
                                {visibleStudents.map((student) => (
                                    <motion.div
                                        key={student.id}
                                        layout
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`
                                            p-3 rounded-xl border
                                            transition-all duration-200 hover:scale-105
                                            ${studentCardBg}
                                        `}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <PlantIcon stage={student.stage} size={50} />
                                            <span className={`text-xs font-medium ${textMuted} text-center`}>
                                                {student.name}
                                            </span>
                                            <span className={`text-[11px] ${textMuted}`}>
                                                {student.total_with_adjustment} баллов
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => applyAdjustment(student.id, -5)}
                                                    className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <button
                                                    onClick={() => applyAdjustment(student.id, 5)}
                                                    className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <span className={`text-[10px] ${textMuted}`}>
                                                {STAGE_NAMES[student.stage]}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Bottom bar with stats and actions */}
                        <div className={`fixed bottom-0 left-0 right-0 p-4 ${theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'} border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} backdrop-blur-sm`}>
                            <div className="max-w-7xl mx-auto flex items-center justify-between">
                                {/* Stats */}
                                <div className="flex items-center gap-6">
                                    <div className={`flex items-center gap-2 ${textMuted}`}>
                                        <Leaf size={18} />
                                        <span className="text-sm">Уровень класса</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'} font-semibold`}>
                                        Начальный
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                                {stats.seeds}
                                            </span>
                                            <span className={`text-xs ${textMuted}`}>Семена</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                                {stats.sprouts}
                                            </span>
                                            <span className={`text-xs ${textMuted}`}>Ростки</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                {stats.trees}
                                            </span>
                                            <span className={`text-xs ${textMuted}`}>Деревья</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        onClick={handleReset}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw size={18} />
                                        Сбросить
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        onClick={handleRandomize}
                                        className="flex items-center gap-2"
                                    >
                                        <Shuffle size={18} />
                                        Случайно
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={onFinish}
                                        className="px-8"
                                    >
                                        Итог урока
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
