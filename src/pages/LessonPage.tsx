import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Puzzle, Cpu, FunctionSquare, ClipboardCheck, Sparkles, CheckCircle2, Play, X, Loader2, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Users, Trash2, Gauge, Zap, Triangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLesson } from '@/contexts/LessonContext'
import { motion, AnimatePresence } from 'framer-motion'
import { TheorySlides } from '@/components/theory/TheorySlides'
import { generateProblems, generateTest, generateInteractiveTasks, generateAiExplainQuestions, AiExplainQA } from '@/lib/githubAI'
import { FormulaDisplay } from '@/components/markdown/FormulaDisplay'
import { ProblemRenderer } from '@/components/markdown/ProblemRenderer'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { TestGenerator } from '@/components/test/TestGenerator'
import { TestViewer } from '@/components/test/TestViewer'
import { TestResults } from '@/components/test/TestResults'
import { TestQuestion, TestConfig, TestResult } from '@/types/test'
import { FormulaModal } from '@/components/formulas/FormulaModal'
import { Slider } from '@/components/ui/Slider'
import { LessonComplete } from '@/components/lesson/LessonComplete'
import { ClassGarden } from '@/components/lesson/ClassGarden'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { UniformAccelerationSimulation } from '@/components/simulations/UniformAccelerationSimulation'
import { OhmsLawSimulation } from '@/components/simulations/OhmsLawSimulation'
import { EnergyOnInclineSimulation } from '@/components/simulations/EnergyOnInclineSimulation'
import { simulationCatalog, SimulationId } from '@/data/simulations'
import { LessonTemplateRow, listLessonTemplates, deleteLessonTemplate } from '@/lib/supabaseLessons'
import { getTopicById as getSupabaseTopicById, getTopicByTitle as getSupabaseTopicByTitle } from '@/lib/supabaseTopics'
import { allTopics } from '@/data/allTopics'
import { LessonTopic, InteractiveTask } from '@/types'
import { InteractiveTaskCard } from '@/components/tasks/InteractiveTaskCard'

type DemoState = 'idle' | 'theory' | 'problems' | 'simulations' | 'formulas' | 'test' | 'ai-explain'

const controlButtons = [
  { id: 'theory' as DemoState, label: 'Теория', icon: <BookOpen size={32} />, color: 'from-blue-500 to-cyan-500' },
  { id: 'problems' as DemoState, label: 'Задачи', icon: <Puzzle size={32} />, color: 'from-orange-500 to-amber-500' },
  { id: 'simulations' as DemoState, label: 'Симуляции', icon: <Cpu size={32} />, color: 'from-purple-500 to-pink-500' },
  { id: 'formulas' as DemoState, label: 'Формулы', icon: <FunctionSquare size={32} />, color: 'from-emerald-500 to-teal-500' },
  { id: 'test' as DemoState, label: 'Тест', icon: <ClipboardCheck size={32} />, color: 'from-rose-500 to-red-500' },
  { id: 'ai-explain' as DemoState, label: 'AI объясни', icon: <Sparkles size={32} />, color: 'from-violet-500 to-purple-500', accent: true },
]

const API_BASE = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8003`

const getDemoContent = (theme: 'dark' | 'light'): Record<DemoState, { title: string; description: string; icon: React.ReactNode; hint: string }> => ({
  idle: {
    title: 'Экран демонстрации',
    description: 'Выберите раздел в пульте учителя для начала урока',
    icon: <BookOpen size={48} className={theme === 'dark' ? 'text-white/30' : 'text-slate-400'} />,
    hint: '💡 Выберите раздел урока слева',
  },
  theory: {
    title: 'Теория',
    description: 'Теоретический материал урока',
    icon: <BookOpen size={64} className="text-blue-400" />,
    hint: '📖 Теоретический материал готов к показу',
  },
  problems: {
    title: 'Задачи',
    description: 'Интерактивные задачи с пошаговым решением',
    icon: <Puzzle size={64} className="text-orange-400" />,
    hint: '🧩 Задачи для самостоятельного решения',
  },
  simulations: {
    title: 'Симуляции',
    description: 'Интерактивные симуляции физических процессов',
    icon: <Cpu size={64} className="text-purple-400" />,
    hint: '🔬 Симуляции для визуализации процессов',
  },
  formulas: {
    title: 'Формулы',
    description: 'Справочник по формулам с примерами применения',
    icon: <FunctionSquare size={64} className="text-emerald-400" />,
    hint: '📐 Формулы и определения',
  },
  test: {
    title: 'Тест',
    description: 'Проверочные вопросы для оценки понимания материала',
    icon: <ClipboardCheck size={64} className="text-rose-400" />,
    hint: '✅ Тест для проверки знаний',
  },
  'ai-explain': {
    title: 'AI Объяснение',
    description: 'Умное объяснение сложных концепций простым языком',
    icon: <Sparkles size={64} className="text-violet-400" />,
    hint: '🤖 AI готов объяснить любой вопрос',
  },
})

export function LessonPage() {
  const { theme } = useTheme()
  const { token, user } = useAuth()
  const { selectedTopics, removeTopic, updateTopic, addTopic, clearTopics } = useLesson()
  const [activeState, setActiveState] = useState<DemoState>('idle')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
const [selectedSimulationId, setSelectedSimulationId] = useState<SimulationId | null>(null)
const [simulationParams, setSimulationParams] = useState({
  'uniform-acceleration': { v0: 2, accel: 1, timeScale: 1 },
  'ohms-law': { voltage: 12, resistance: 6 },
  'energy-incline': { mass: 2, height: 2, angle: 30, mu: 0.1, timeScale: 1 },
})
  const [generatedProblems, setGeneratedProblems] = useState<string[]>([])
  const [isGeneratingProblems, setIsGeneratingProblems] = useState(false)
  const [problemsError, setProblemsError] = useState<string | null>(null)
  const [interactiveTasks, setInteractiveTasks] = useState<InteractiveTask[]>([])
  const [isGeneratingInteractive, setIsGeneratingInteractive] = useState(false)
  const [interactiveError, setInteractiveError] = useState<string | null>(null)
  const [expandedInteractiveTasks, setExpandedInteractiveTasks] = useState<Record<string, boolean>>({})
  const [customProblemTopic, setCustomProblemTopic] = useState('')
  const [aiExplainItems, setAiExplainItems] = useState<AiExplainQA[]>([])
  const [isGeneratingAiExplain, setIsGeneratingAiExplain] = useState(false)
  const [aiExplainError, setAiExplainError] = useState<string | null>(null)
  const [expandedAiExplain, setExpandedAiExplain] = useState<Record<number, boolean>>({})

  // Test state
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [testAnswers, setTestAnswers] = useState<number[]>([])
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isGeneratingTest, setIsGeneratingTest] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [assignTitle, setAssignTitle] = useState('')
  const [assignDate, setAssignDate] = useState('')
  const [assignClass, setAssignClass] = useState('')
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isSavingTest, setIsSavingTest] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [demoTestResults, setDemoTestResults] = useState<Record<string, { score: number; correct: number; total: number; variant_index?: number }>>({})
  const [demoTestSummary, setDemoTestSummary] = useState<{ count: number; average: number } | null>(null)
  const [variantMap, setVariantMap] = useState<Record<string, number>>({})
  const [isClassPanelOpen, setIsClassPanelOpen] = useState(false)
  const [selectedClassForPanel, setSelectedClassForPanel] = useState<string | null>(null)
  const [connectedStudents, setConnectedStudents] = useState<Array<{ id: string; name: string; class_id?: string | null }>>([])
  const [lessonTemplates, setLessonTemplates] = useState<LessonTemplateRow[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonsError, setLessonsError] = useState<string | null>(null)
  const demoScreenRef = useRef<HTMLElement>(null)

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(100) // 50% to 200% (50-200)
  const contentRef = useRef<HTMLDivElement>(null)

  // Formula modal state
  const [selectedFormula, setSelectedFormula] = useState<string | null>(null)
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState<number>(-1)
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false)

  // Lesson complete state
  const [showLessonComplete, setShowLessonComplete] = useState(false)

  const navigate = useNavigate()

  // Zoom functions
  const handleZoomChange = (value: number) => {
    setZoomLevel(value)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(200, prev + 10))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(50, prev - 10))
  }

  const handleZoomReset = () => {
    setZoomLevel(100)
  }

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Plus или Ctrl + =
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        setZoomLevel(prev => Math.min(200, prev + 10))
      }
      // Ctrl + Minus
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        setZoomLevel(prev => Math.max(50, prev - 10))
      }
      // Ctrl + 0 для сброса
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setZoomLevel(100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleFullscreen = async () => {
    if (!demoScreenRef.current) return

    try {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )

      if (!isCurrentlyFullscreen) {
        // Вход в полноэкранный режим
        if (demoScreenRef.current.requestFullscreen) {
          await demoScreenRef.current.requestFullscreen()
        } else if ((demoScreenRef.current as any).webkitRequestFullscreen) {
          await (demoScreenRef.current as any).webkitRequestFullscreen()
        } else if ((demoScreenRef.current as any).mozRequestFullScreen) {
          await (demoScreenRef.current as any).mozRequestFullScreen()
        } else if ((demoScreenRef.current as any).msRequestFullscreen) {
          await (demoScreenRef.current as any).msRequestFullscreen()
        }
      } else {
        // Выход из полноэкранного режима
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (error) {
      console.error('Ошибка переключения полноэкранного режима:', error)
    }
  }

  // Обработка полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isFullscreenActive)
    }

    // Проверяем начальное состояние
    handleFullscreenChange()

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    // Обработка клавиши F11
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [toggleFullscreen])

  const activeButton = controlButtons.find(btn => btn.id === activeState)
  const demoContent = useMemo(() => getDemoContent(theme), [theme])
  const content = demoContent[activeState]
  const selectedTopic = selectedTopics.find(t => t.id === selectedTopicId)
  const classGroups = useMemo(() => {
    const groups: Record<string, Array<{ id: string; name: string; class_id?: string | null }>> = {}
    connectedStudents.forEach((student) => {
      const classId = student.class_id || 'Без класса'
      if (!groups[classId]) {
        groups[classId] = []
      }
      groups[classId].push(student)
    })
    return groups
  }, [connectedStudents])
  const classList = useMemo(() => Object.keys(classGroups).sort(), [classGroups])

  const [showClassGarden, setShowClassGarden] = useState(false)

  const handleFinishLesson = () => {
    setShowClassGarden(true)
  }

  const handleClassGardenFinish = () => {
    setShowClassGarden(false)
    setShowLessonComplete(true)
  }

  const handleGoHome = () => {
    setShowLessonComplete(false)
    navigate('/')
  }

  const handleContinueLearning = () => {
    setShowLessonComplete(false)
    navigate('/world')
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/50' : 'text-slate-600'
  const textMuted60 = theme === 'dark' ? 'text-white/60' : 'text-slate-500'
  const textMuted70 = theme === 'dark' ? 'text-white/70' : 'text-slate-700'
  const sidebarBg = theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/50'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const buttonInactive = theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
  const useSupabase = !!import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_USE_SUPABASE !== 'false'
  const testVariantCount = 3


  useEffect(() => {
    const loadClassesForAssign = async () => {
      if (!token) return
      try {
        const response = await fetch(`${API_BASE}/api/teacher/classes`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()
        if (response.ok && Array.isArray(data?.classes)) {
          setAvailableClasses(data.classes)
          if (!assignClass && data.classes.length > 0) {
            setAssignClass(data.classes[0])
          }
        }
      } catch (error) {
        console.error('Classes load error', error)
      }
    }

    if (testQuestions.length > 0 && availableClasses.length === 0) {
      loadClassesForAssign()
    }
  }, [testQuestions.length, token])

  useEffect(() => {
    const loadActiveSession = async () => {
      if (!token) return
      try {
        const response = await fetch(`${API_BASE}/api/teacher/pairing-sessions/active`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (response.ok) {
          setActiveSessionId(data.session?.id || null)
          setConnectedStudents(Array.isArray(data.students) ? data.students : [])
        }
      } catch {
        // ignore
      }
    }
    loadActiveSession()
  }, [token])

  useEffect(() => {
    const loadDemoResults = async () => {
      if (!token || !activeSessionId) return
      try {
        const response = await fetch(`${API_BASE}/api/teacher/pairing-sessions/${activeSessionId}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (response.ok) {
          const map: Record<string, { score: number; correct: number; total: number; variant_index?: number }> = {}
          ;(data?.results || []).forEach((item: any) => {
            map[item.student_id] = {
              score: item.score,
              correct: item.correct,
              total: item.total,
              variant_index: item.variant_index
            }
          })
          setDemoTestResults(map)
          setDemoTestSummary(data?.summary || null)
        }
      } catch {
        // ignore
      }
    }

    if (activeState === 'test' && testQuestions.length > 0) {
      loadDemoResults()
      const interval = setInterval(loadDemoResults, 5000)
      return () => clearInterval(interval)
    }
  }, [activeState, testQuestions.length, activeSessionId, token])

  useEffect(() => {
    const computeVariants = async () => {
      if (!activeSessionId || connectedStudents.length === 0) {
        setVariantMap({})
        return
      }

      const encode = (value: string) => new TextEncoder().encode(value)
      const fallbackHash = (input: string) => {
        let hash = 0
        for (let i = 0; i < input.length; i += 1) {
          hash = (hash << 5) - hash + input.charCodeAt(i)
          hash |= 0
        }
        return Math.abs(hash)
      }

      const nextMap: Record<string, number> = {}
      await Promise.all(connectedStudents.map(async (student) => {
        const payload = `${activeSessionId}:${student.id}`
        try {
          if (window.crypto?.subtle) {
            const digest = await window.crypto.subtle.digest('SHA-256', encode(payload))
            const hashArray = Array.from(new Uint8Array(digest))
            const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
            const hashInt = BigInt(`0x${hex}`)
            const index = Number(hashInt % BigInt(Math.max(1, testVariantCount)))
            nextMap[student.id] = index + 1
            return
          }
        } catch {
          // fallback below
        }
        const index = fallbackHash(payload) % Math.max(1, testVariantCount)
        nextMap[student.id] = index + 1
      }))
      setVariantMap(nextMap)
    }

    computeVariants()
  }, [activeSessionId, connectedStudents, testVariantCount])

  useEffect(() => {
    const loadLessonTemplates = async () => {
      if (!user) return
      setLessonsLoading(true)
      setLessonsError(null)
      const lessons = await listLessonTemplates(user.id)
      setLessonTemplates(lessons)
      setLessonsLoading(false)
    }
    loadLessonTemplates()
  }, [user?.id])

  useEffect(() => {
    setGeneratedProblems([])
    setInteractiveTasks([])
    setExpandedInteractiveTasks({})
    setProblemsError(null)
    setInteractiveError(null)
    setCustomProblemTopic('')
    setAiExplainItems([])
    setAiExplainError(null)
    setExpandedAiExplain({})
  }, [selectedTopicId])

  useEffect(() => {
    if (activeState !== 'simulations') {
      setSelectedSimulationId(null)
    }
  }, [activeState])

  const resolveLocalTopicById = (topicId: string): LessonTopic | null => {
    for (const subsections of Object.values(allTopics)) {
      for (const subsection of subsections) {
        const found = subsection.topics.find(t => t.id === topicId)
        if (found) return found
      }
    }
    return null
  }

  const resolveLocalTopicByTitle = (title: string): LessonTopic | null => {
    const cleanTitle = title.trim().toLowerCase()
    if (!cleanTitle) return null
    for (const subsections of Object.values(allTopics)) {
      for (const subsection of subsections) {
        const found = subsection.topics.find(t => t.title.trim().toLowerCase() === cleanTitle)
        if (found) return found
      }
    }
    return null
  }

  const handleApplyTemplate = async (template: LessonTemplateRow) => {
    clearTopics()
    const ids = Array.isArray(template.topic_ids) ? template.topic_ids : []
    const resolvedTopics: LessonTopic[] = []
    for (const id of ids) {
      if (useSupabase) {
        const supaTopic = await getSupabaseTopicById(id)
        if (supaTopic) resolvedTopics.push(supaTopic)
      } else {
        const localTopic = resolveLocalTopicById(id)
      if (localTopic) resolvedTopics.push(localTopic)
    }
  }
    if (resolvedTopics.length === 0 && template.lesson_topic) {
      if (useSupabase) {
        const supaTopic = await getSupabaseTopicByTitle(template.lesson_topic)
        if (supaTopic) resolvedTopics.push(supaTopic)
      } else {
        const localTopic = resolveLocalTopicByTitle(template.lesson_topic)
        if (localTopic) resolvedTopics.push(localTopic)
      }
    }
    if (resolvedTopics.length === 0) {
      resolvedTopics.push({
        id: template.id,
        title: template.lesson_topic || template.title,
        description: template.learning_goal || template.title,
        theory: '',
        formulas: [],
        examples: [],
        problems: [],
      })
    }
    resolvedTopics.forEach(topic => addTopic(topic))
    if (resolvedTopics.length > 0) {
      setSelectedTopicId(resolvedTopics[0].id)
      setActiveState('theory')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmed = window.confirm('Удалить этот урок?')
    if (!confirmed) return
    const ok = await deleteLessonTemplate(templateId)
    if (ok) {
      setLessonTemplates(prev => prev.filter(t => t.id !== templateId))
    }
  }

  useEffect(() => {
    if (classList.length === 0) {
      setSelectedClassForPanel(null)
      return
    }
    if (!selectedClassForPanel || !classList.includes(selectedClassForPanel)) {
      setSelectedClassForPanel(classList[0])
    }
  }, [classList, selectedClassForPanel])

  useEffect(() => {
    if (!token || !activeSessionId) return
    const meta = demoContent[activeState]
    const payload = (() => {
      if (activeState === 'theory') {
        if (!selectedTopic) return {}
        return {
          topicTitle: selectedTopic.title,
          topicDescription: selectedTopic.description,
          theory: selectedTopic.theory || '',
        }
      }
      if (activeState === 'problems') {
        const generationTopicTitle = customProblemTopic.trim() || selectedTopic?.title || 'Тема'
        const displayProblems = generatedProblems.length > 0
          ? generatedProblems
          : (selectedTopic?.problems || [])
        return {
          topicTitle: generationTopicTitle,
          topicDescription: selectedTopic?.description || '',
          problems: displayProblems,
          interactive_tasks: interactiveTasks,
        }
      }
      if (activeState === 'simulations') {
        if (!selectedTopic) return {}
        return {
          topicTitle: selectedTopic.title,
          topicDescription: selectedTopic.description,
          simulation_id: selectedSimulationId,
          simulation_params: selectedSimulationId ? (simulationParams as any)[selectedSimulationId] : null,
        }
      }
      if (activeState === 'formulas') {
        if (!selectedTopic) return {}
        return {
          topicTitle: selectedTopic.title,
          topicDescription: selectedTopic.description,
          formulas: selectedTopic.formulas || [],
        }
      }
      if (activeState === 'test') {
        if (!selectedTopic) return {}
        return {
          topicTitle: selectedTopic.title,
          topicDescription: selectedTopic.description,
          questions: testQuestions.map(question => ({
            question: question.question,
            options: question.options,
            correctIndex: question.correctAnswer,
          })),
          variant_count: 3,
        }
      }
      if (activeState === 'ai-explain') {
        if (!selectedTopic) return {}
        return {
          topicTitle: selectedTopic.title,
          topicDescription: selectedTopic.description,
          ai_questions: aiExplainItems,
        }
      }
      if (!selectedTopic) return {}
      return {
        topicTitle: selectedTopic.title,
        topicDescription: selectedTopic.description,
      }
    })()
    fetch(`${API_BASE}/api/teacher/pairing-sessions/${activeSessionId}/demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mode: activeState,
        title: meta.title,
        subtitle: meta.description,
        payload,
      }),
    }).catch(() => {})
  }, [activeState, activeSessionId, token, demoContent, selectedTopic, selectedSimulationId, simulationParams, generatedProblems, testQuestions, interactiveTasks, customProblemTopic, aiExplainItems])


  const handleSaveAssignedTest = async () => {
    if (!token || testQuestions.length === 0) return
    if (!assignClass) {
      setSaveStatus('Укажите класс')
      return
    }
    setIsSavingTest(true)
    setSaveStatus(null)
    try {
      const title = assignTitle.trim() || `Тест: ${selectedTopic?.title || 'Физика'}`
      const payload = {
        title,
        class_id: assignClass,
        scheduled_for: assignDate || null,
        section: selectedTopic?.id || null,
        difficulty: 'generated',
        questions: testQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correct: q.correctAnswer,
        })),
        time_limit: testQuestions.length * 60,
      }

      const response = await fetch(`${API_BASE}/api/teacher/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        setSaveStatus(data?.detail || 'Ошибка сохранения')
      } else {
        setSaveStatus('Тест сохранен')
      }
    } catch (error) {
      setSaveStatus('Ошибка сети')
    } finally {
      setIsSavingTest(false)
    }
  }

  const renderContent = () => {
    if (activeState === 'idle') {
      return (
        <div className="text-center">
          <p className={`${textMuted} text-lg mb-4`}>
            {selectedTopics.length === 0
              ? 'Добавьте темы из библиотеки для начала урока'
              : `Выбрано тем: ${selectedTopics.length}`
            }
          </p>
          {selectedTopics.length > 0 && (
            <div className="mt-6 space-y-2">
              {selectedTopics.map(topic => (
                <Button
                  key={topic.id}
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setSelectedTopicId(topic.id)
                    setActiveState('theory')
                  }}
                  className="w-full justify-start"
                >
                  <BookOpen size={18} className="mr-2" />
                  {topic.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (!selectedTopic && selectedTopics.length > 0) {
      setSelectedTopicId(selectedTopics[0].id)
      return null
    }

    if (!selectedTopic) {
      return (
        <div className="text-center">
          <p className={textMuted}>Выберите тему из списка</p>
        </div>
      )
    }

      switch (activeState) {
        case 'theory':
          return (
            <div className="w-full mx-auto text-left space-y-6">
            {/* Иконка */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className={`w-20 h-20 rounded-2xl ${theme === 'dark' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'} flex items-center justify-center`}>
                <BookOpen size={40} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
              </div>
            </motion.div>

            <div className="text-center mb-6">
              <h2 className={`text-3xl font-bold ${textColor} mb-2`}>{selectedTopic.title}</h2>
              <p className={`${textMuted} text-lg`}>{selectedTopic.description}</p>
            </div>
            <TheorySlides
              theory={selectedTopic.theory || ''}
              topicTitle={selectedTopic.title}
              topicDescription={selectedTopic.description}
              topicId={selectedTopic.id}
              onTheoryGenerated={(newTheory, formulas) => {
                // Обновляем теорию и формулы в теме
                updateTopic(selectedTopic.id, {
                  theory: newTheory,
                  formulas: formulas && formulas.length > 0 ? formulas : selectedTopic.formulas
                })
              }}
            />
            {selectedTopics.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center mt-6">
                {selectedTopics.map(topic => (
                  <Button
                    key={topic.id}
                    variant={selectedTopicId === topic.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedTopicId(topic.id)}
                  >
                    {topic.title}
                  </Button>
                ))}
              </div>
            )}
            </div>
          )

        case 'simulations': {
  const simulationIconMap: Record<SimulationId, React.ReactNode> = {
    'uniform-acceleration': <Gauge size={28} />,
    'ohms-law': <Zap size={28} />,
    'energy-incline': <Triangle size={28} />,
  }

  const simulationPreviewMap: Record<SimulationId, React.ReactNode> = {
    'uniform-acceleration': (
      <svg viewBox="0 0 360 120" className="w-full h-full">
        <defs>
          <linearGradient id="uaBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6a8bff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9b7bff" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="uaTrack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#bcd0ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e6ddff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="344" height="104" rx="18" fill="url(#uaBg)" />
        <rect x="24" y="66" width="312" height="14" rx="7" fill="url(#uaTrack)" />
        <rect x="42" y="38" width="74" height="26" rx="8" fill="#6a8bff" opacity="0.75" />
        <rect x="52" y="30" width="20" height="10" rx="5" fill="#bcd0ff" opacity="0.8" />
        <circle cx="64" cy="72" r="9" fill="#e9f0ff" />
        <circle cx="94" cy="72" r="9" fill="#e9f0ff" />
        <path d="M150 44h130" stroke="#bcd0ff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <circle cx="280" cy="44" r="6" fill="#bcd0ff" opacity="0.9" />
      </svg>
    ),
    'ohms-law': (
      <svg viewBox="0 0 360 120" className="w-full h-full">
        <defs>
          <linearGradient id="ohmBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd58a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffb86a" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="344" height="104" rx="18" fill="url(#ohmBg)" />
        <circle cx="70" cy="60" r="18" fill="#ffd58a" opacity="0.8" />
        <rect x="108" y="50" width="86" height="20" rx="10" fill="#ffd58a" opacity="0.6" />
        <rect x="210" y="50" width="50" height="20" rx="10" fill="#ffd58a" opacity="0.45" />
        <path d="M260 60h60" stroke="#ffd58a" strokeWidth="6" strokeLinecap="round" />
        <path d="M288 42l12 18-12 18" fill="#ffd58a" opacity="0.85" />
        <circle cx="310" cy="60" r="6" fill="#fff1d6" />
      </svg>
    ),
    'energy-incline': (
      <svg viewBox="0 0 360 120" className="w-full h-full">
        <defs>
          <linearGradient id="incBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7ee3c7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5fc7d7" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="344" height="104" rx="18" fill="url(#incBg)" />
        <polygon points="40,92 298,92 298,34" fill="#7ee3c7" opacity="0.22" />
        <line x1="40" y1="92" x2="298" y2="34" stroke="#7ee3c7" strokeWidth="6" strokeLinecap="round" />
        <circle cx="212" cy="58" r="11" fill="#7ee3c7" opacity="0.85" />
        <circle cx="212" cy="58" r="5" fill="#f1fffb" />
        <line x1="298" y1="34" x2="330" y2="34" stroke="#7ee3c7" strokeWidth="4" strokeLinecap="round" />
        <line x1="298" y1="34" x2="298" y2="8" stroke="#7ee3c7" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
  }

  const uniformParams = simulationParams['uniform-acceleration']
  const ohmParams = simulationParams['ohms-law']
  const inclineParams = simulationParams['energy-incline']

  if (selectedSimulationId) {
    const selectedMeta = simulationCatalog.find((item) => item.id === selectedSimulationId)
    return (
      <div className="w-full mx-auto text-left space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-bold ${textColor} mb-2`}>
              {selectedMeta?.title || ''}
            </h2>
            <p className={`${textMuted} text-lg`}>
              {selectedMeta?.description || ''}
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setSelectedSimulationId(null)}
          >
            {'\u041d\u0430\u0437\u0430\u0434 \u043a \u0441\u043f\u0438\u0441\u043a\u0443'}
          </Button>
        </div>

        <div className="space-y-8">
          {selectedSimulationId === 'uniform-acceleration' && (
            <UniformAccelerationSimulation
              topicTitle={selectedTopic.title}
              v0={uniformParams.v0}
              accel={uniformParams.accel}
              timeScale={uniformParams.timeScale}
              onParamsChange={(params) =>
                setSimulationParams((prev) => ({
                  ...prev,
                  'uniform-acceleration': { ...prev['uniform-acceleration'], ...params },
                }))
              }
            />
          )}
          {selectedSimulationId === 'ohms-law' && (
            <OhmsLawSimulation
              topicTitle={selectedTopic.title}
              voltage={ohmParams.voltage}
              resistance={ohmParams.resistance}
              onParamsChange={(params) =>
                setSimulationParams((prev) => ({
                  ...prev,
                  'ohms-law': { ...prev['ohms-law'], ...params },
                }))
              }
            />
          )}
          {selectedSimulationId === 'energy-incline' && (
            <EnergyOnInclineSimulation
              topicTitle={selectedTopic.title}
              mass={inclineParams.mass}
              height={inclineParams.height}
              angle={inclineParams.angle}
              mu={inclineParams.mu}
              timeScale={inclineParams.timeScale}
              onParamsChange={(params) =>
                setSimulationParams((prev) => ({
                  ...prev,
                  'energy-incline': { ...prev['energy-incline'], ...params },
                }))
              }
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto text-left space-y-8">
      <div className="text-center">
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className={`w-20 h-20 rounded-2xl ${
              theme === 'dark'
                ? 'bg-purple-500/20 border border-purple-500/30'
                : 'bg-purple-100 border border-purple-200'
            } flex items-center justify-center`}
          >
            <Cpu size={40} className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} />
          </div>
        </motion.div>
        <h2 className={`text-3xl font-bold ${textColor} mb-2`}>
          {'\u0421\u0438\u043c\u0443\u043b\u044f\u0446\u0438\u0438: '} {selectedTopic.title}
        </h2>
        <p className={`${textMuted} text-lg`}>
          {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043d\u0443\u0436\u043d\u0443\u044e \u0441\u0438\u043c\u0443\u043b\u044f\u0446\u0438\u044e \u0438 \u043e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u0435\u0435 \u0432 \u044d\u0442\u043e\u043c \u0436\u0435 \u044d\u043a\u0440\u0430\u043d\u0435.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {simulationCatalog.map((simulation) => (
          <Card
            key={simulation.id}
            className={`${bgCard} ${borderColor} p-6 h-full flex flex-col`}
            hover
            onClick={() => setSelectedSimulationId(simulation.id)}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                theme === 'dark'
                  ? 'bg-white/10 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {simulationIconMap[simulation.id]}
            </div>
            <div
              className={`h-24 rounded-xl mb-4 flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-slate-100 border border-slate-200'
              }`}
            >
              {simulationPreviewMap[simulation.id]}
            </div>
            <h3 className={`text-xl font-semibold ${textColor} mb-2`}>
              {simulation.title}
            </h3>
            <p className={`${textMuted} text-sm mb-4 flex-1`}>
              {simulation.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {simulation.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-1 rounded-full ${
                    theme === 'dark'
                      ? 'bg-white/10 text-white/70'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <Button variant="primary" size="md" className="w-full">
              {'\u041e\u0442\u043a\u0440\u044b\u0442\u044c'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

        case 'formulas':
          return (
            <div className="w-full max-w-5xl mx-auto text-left space-y-6">
            {/* Иконка */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className={`w-20 h-20 rounded-2xl ${theme === 'dark' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-100 border border-emerald-200'} flex items-center justify-center`}>
                <FunctionSquare size={40} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
              </div>
            </motion.div>

            <div className="text-center mb-6">
              <h2 className={`text-3xl font-bold ${textColor} mb-2`}>Формулы: {selectedTopic.title}</h2>
              <p className={`${textMuted} text-lg`}>{selectedTopic.description}</p>
            </div>
            {selectedTopic.formulas && selectedTopic.formulas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {selectedTopic.formulas.map((formula, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`${bgCard} ${borderColor} p-6 hover:shadow-xl transition-all duration-300 hover:border-emerald-500/50 group cursor-pointer h-full flex flex-col min-h-[160px] relative z-10`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFormula(formula)
                        setSelectedFormulaIndex(index)
                        setIsFormulaModalOpen(true)
                      }}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="flex flex-col items-center text-center gap-4 h-full">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' : 'bg-emerald-100 group-hover:bg-emerald-200'} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                          <span className={`text-base font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="w-full flex justify-center items-center flex-1 py-3 overflow-hidden">
                          <FormulaDisplay formula={formula} className={`${textColor} text-center w-full`} displayMode={true} />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className={`${bgCard} ${borderColor} p-8 text-center`}>
                <p className={textMuted}>
                  Формулы для этой темы находятся в разработке.
                  Вы можете использовать AI-ассистента для получения формул.
                </p>
              </Card>
            )}
            {selectedTopics.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center mt-6">
                {selectedTopics.map(topic => (
                  <Button
                    key={topic.id}
                    variant={selectedTopicId === topic.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedTopicId(topic.id)}
                  >
                    {topic.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )

      case 'problems':
        if (!selectedTopic && !customProblemTopic.trim()) {
          return (
            <div className="text-center">
              <p className={textMuted}>Выберите тему из списка или введите свою</p>
            </div>
          )
        }

        const generationTopicTitle = customProblemTopic.trim() || selectedTopic?.title || 'Тема'
        const displayProblems = generatedProblems.length > 0 ? generatedProblems : (selectedTopic?.problems || [])

        const handleGenerateProblems = async () => {
          setIsGeneratingProblems(true)
          setProblemsError(null)

          try {
            const problems = await generateProblems(generationTopicTitle, 5)
            setGeneratedProblems(problems)
          } catch (error: any) {
            console.error('Ошибка генерации задач:', error)
            setProblemsError(error.message || 'Не удалось сгенерировать задачи')
          } finally {
            setIsGeneratingProblems(false)
          }
        }

        const handleGenerateInteractiveTasks = async () => {
          setIsGeneratingInteractive(true)
          setInteractiveError(null)

          try {
            const tasks = await generateInteractiveTasks(generationTopicTitle, 3)
            setInteractiveTasks(tasks)
            setExpandedInteractiveTasks({})
          } catch (error: any) {
            console.error('Ошибка генерации интерактивных задач:', error)
            setInteractiveError(error.message || 'Не удалось сгенерировать интерактивные задачи')
          } finally {
            setIsGeneratingInteractive(false)
          }
        }

        const toggleInteractiveTask = (taskId: string) => {
          setExpandedInteractiveTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId],
          }))
        }

        return (
          <div className="w-full max-w-4xl mx-auto text-left space-y-6">
            {/* Иконка */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className={`w-20 h-20 rounded-2xl ${theme === 'dark' ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-orange-100 border border-orange-200'} flex items-center justify-center`}>
                <Puzzle size={40} className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} />
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className={`text-3xl font-bold ${textColor}`}>Задачи: {generationTopicTitle}</h2>
                <p className={`${textMuted} text-sm mt-1`}>Выберите тему из списка или введите свою</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleGenerateInteractiveTasks}
                  disabled={isGeneratingInteractive}
                  className="flex items-center gap-2"
                >
                  {isGeneratingInteractive ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Интерактивные задачи
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateProblems}
                  disabled={isGeneratingProblems}
                  className="flex items-center gap-2"
                >
                  {isGeneratingProblems ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Сгенерировать задачи
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Card className={`${bgCard} ${borderColor} p-4`}>
              <div className="grid gap-3 md:grid-cols-[240px,1fr] items-center">
                <div>
                  <label className={`${textMuted} text-xs uppercase tracking-wide`}>Тема из списка</label>
                  <select
                    className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${theme === 'dark' ? 'bg-slate-900/60 text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-200'}`}
                    value={selectedTopicId || ''}
                    onChange={(e) => {
                      setSelectedTopicId(e.target.value)
                      setCustomProblemTopic('')
                      setGeneratedProblems([])
                      setInteractiveTasks([])
                      setExpandedInteractiveTasks({})
                    }}
                  >
                    {selectedTopics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`${textMuted} text-xs uppercase tracking-wide`}>Своя тема</label>
                  <input
                    className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${theme === 'dark' ? 'bg-slate-900/60 text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-200'}`}
                    placeholder="Например: Второй закон Ньютона"
                    value={customProblemTopic}
                    onChange={(e) => setCustomProblemTopic(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {problemsError && (
              <Card className={`${bgCard} ${borderColor} p-4`}>
                <p className={theme === 'dark' ? 'text-red-400' : 'text-red-700'}>
                  {problemsError}
                </p>
              </Card>
            )}

            {displayProblems.length > 0 ? (
              <div className="space-y-6">
                {displayProblems.map((problem, index) => (
                  <Card key={index} className={`${bgCard} ${borderColor} p-6 hover:shadow-lg transition-shadow`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'} flex items-center justify-center`}>
                        <span className={`font-bold text-xl ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <ProblemRenderer
                          problem={problem}
                          className="text-lg leading-relaxed"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className={`${bgCard} ${borderColor} p-6`}>
                <div className="text-center space-y-4">
                  <p className={textMuted}>Задачи для этой темы пока не добавлены</p>
                  <Button
                    variant="primary"
                    onClick={handleGenerateProblems}
                    disabled={isGeneratingProblems}
                    className="flex items-center gap-2 mx-auto"
                  >
                    {isGeneratingProblems ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Генерация...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Сгенерировать задачи
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-2xl font-bold ${textColor}`}>Интерактивные задачи</h3>
                <span className={`${textMuted} text-sm`}>
                  {interactiveTasks.length > 0 ? `Сгенерировано: ${interactiveTasks.length}` : 'Пока нет'}
                </span>
              </div>

              {interactiveError && (
                <Card className={`${bgCard} ${borderColor} p-4`}>
                  <p className={theme === 'dark' ? 'text-red-400' : 'text-red-700'}>
                    {interactiveError}
                  </p>
                </Card>
              )}

              {interactiveTasks.length > 0 ? (
                <div className="space-y-6">
                  {interactiveTasks.map((task, index) => (
                    <InteractiveTaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      expanded={!!expandedInteractiveTasks[task.id]}
                      onToggle={() => toggleInteractiveTask(task.id)}
                    />
                  ))}
                </div>
              ) : (
                <Card className={`${bgCard} ${borderColor} p-6`}>
                  <div className="text-center space-y-3">
                    <p className={textMuted}>Интерактивные задачи пока не сгенерированы</p>
                    <Button
                      variant="secondary"
                      onClick={handleGenerateInteractiveTasks}
                      disabled={isGeneratingInteractive}
                      className="flex items-center gap-2 mx-auto"
                    >
                      {isGeneratingInteractive ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Генерация...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Сгенерировать интерактивные задачи
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {selectedTopics.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {selectedTopics.map(topic => (
                  <Button
                    key={topic.id}
                    variant={selectedTopicId === topic.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      setSelectedTopicId(topic.id)
                      setGeneratedProblems([]) // Сбрасываем сгенерированные задачи при смене темы
                      setInteractiveTasks([])
                      setExpandedInteractiveTasks({})
                    }}
                  >
                    {topic.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )

      case 'test':
        if (!selectedTopic) {
          return (
            <div className="text-center">
              <p className={textMuted}>Выберите тему из списка</p>
            </div>
          )
        }

        // Показываем результаты теста
        if (testResult) {
          return (
            <TestResults
              questions={testQuestions}
              result={testResult}
              onRestart={() => {
                setTestQuestions([])
                setTestAnswers([])
                setTestResult(null)
              }}
            />
          )
        }

        // Показываем тест, если он сгенерирован
          if (testQuestions.length > 0) {
            return (
              <div className="space-y-6">
                <TestViewer
                  questions={testQuestions}
                  onComplete={(answers) => {
                    // Вычисляем результаты
                    const correctAnswers = answers.reduce((count, answer, index) => {
                      // Считаем правильным только если ответ дан и он правильный
                      if (answer >= 0 && answer === testQuestions[index].correctAnswer) {
                        return count + 1
                      }
                      return count
                    }, 0)

                    const score = Math.round((correctAnswers / testQuestions.length) * 100)

                    const result: TestResult = {
                      totalQuestions: testQuestions.length,
                      correctAnswers,
                      score,
                      answers: testQuestions.map((question, index) => ({
                        questionId: index,
                        selectedAnswer: answers[index] >= 0 ? answers[index] : null,
                        correctAnswer: question.correctAnswer,
                        isCorrect: answers[index] >= 0 && answers[index] === question.correctAnswer,
                        explanation: question.explanation
                      }))
                    }

                    setTestResult(result)
                    setTestAnswers(answers)
                  }}
                />

                <Card className={`w-full p-6 ${bgCard} ${borderColor}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`text-lg font-semibold ${textColor}`}>Ученики и варианты теста</h3>
                      <p className={textMuted}>Показываются подключенные ученики и их вариант</p>
                    </div>
                    {demoTestSummary && (
                      <div className={`text-sm ${textMuted}`}>
                        Средний: {demoTestSummary.average}% • Всего: {demoTestSummary.count}
                      </div>
                    )}
                  </div>

                  {connectedStudents.length === 0 ? (
                    <div className={textMuted}>Пока никто не подключился.</div>
                  ) : (
                    <div className="space-y-3">
                      {connectedStudents.map((student) => {
                        const result = demoTestResults[student.id]
                        const variantIndex =
                          (typeof result?.variant_index === 'number' ? result.variant_index + 1 : null) ??
                          variantMap[student.id] ??
                          1
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between rounded-xl px-4 py-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}
                          >
                            <div>
                              <div className={`${textColor} font-medium`}>
                                {student.name || 'Ученик'}
                              </div>
                              <div className={`${textMuted} text-sm`}>
                                Вариант {variantIndex}
                              </div>
                            </div>
                            <div className="text-right">
                              {result ? (
                                <div className="text-emerald-500 font-semibold">
                                  {result.score}% ({result.correct}/{result.total})
                                </div>
                              ) : (
                                <div className={textMuted}>Ожидает</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )
          }

        // Показываем генератор теста
        const handleGenerateTest = async (config: TestConfig) => {
          setIsGeneratingTest(true)
          setTestError(null)

          try {
            const questions = await generateTest(selectedTopic.title, config.questionCount, config.difficulty)
            setTestQuestions(questions)
          } catch (error: any) {
            console.error('Ошибка генерации теста:', error)
            setTestError(error.message || 'Не удалось сгенерировать тест')
          } finally {
            setIsGeneratingTest(false)
          }
        }

        return (
          <div className="w-full">
            {/* Иконка */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className={`w-20 h-20 rounded-2xl ${theme === 'dark' ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-rose-100 border border-rose-200'} flex items-center justify-center`}>
                <ClipboardCheck size={40} className={theme === 'dark' ? 'text-rose-400' : 'text-rose-600'} />
              </div>
            </motion.div>

            <div className="text-center mb-6">
              <h2 className={`text-3xl font-bold ${textColor} mb-2`}>Тест: {selectedTopic.title}</h2>
              <p className={`${textMuted} text-lg`}>{selectedTopic.description}</p>
            </div>
            <TestGenerator
              topicTitle={selectedTopic.title}
              onGenerate={handleGenerateTest}
              isGenerating={isGeneratingTest}
              error={testError}
            />
            {selectedTopics.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center mt-6">
                {selectedTopics.map(topic => (
                  <Button
                    key={topic.id}
                    variant={selectedTopicId === topic.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      setSelectedTopicId(topic.id)
                      setTestQuestions([])
                      setTestResult(null)
                      setTestAnswers([])
                    }}
                  >
                    {topic.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )

      case 'ai-explain':
        if (!selectedTopic) {
          return (
            <div className="text-center">
              <p className={textMuted}>Выберите тему из списка</p>
            </div>
          )
        }

        const handleGenerateAiExplain = async () => {
          setIsGeneratingAiExplain(true)
          setAiExplainError(null)
          try {
            const items = await generateAiExplainQuestions(selectedTopic.title, 6)
            setAiExplainItems(items)
            setExpandedAiExplain({})
          } catch (error: any) {
            console.error('Ошибка генерации AI объяснений:', error)
            setAiExplainError(error.message || 'Не удалось сгенерировать вопросы')
          } finally {
            setIsGeneratingAiExplain(false)
          }
        }

        return (
          <div className="w-full max-w-4xl mx-auto text-left space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-3xl font-bold ${textColor}`}>AI объясни: {selectedTopic.title}</h2>
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerateAiExplain}
                disabled={isGeneratingAiExplain}
                className="flex items-center gap-2"
              >
                {isGeneratingAiExplain ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Сгенерировать вопросы
                  </>
                )}
              </Button>
            </div>

            {aiExplainError && (
              <Card className={`${bgCard} ${borderColor} p-4`}>
                <p className={theme === 'dark' ? 'text-red-400' : 'text-red-700'}>
                  {aiExplainError}
                </p>
              </Card>
            )}

            {(!Array.isArray(aiExplainItems) || aiExplainItems.length === 0) ? (
              <Card className={`${bgCard} ${borderColor} p-6`}>
                <div className="text-center space-y-3">
                  <p className={textMuted}>Вопросы пока не сгенерированы</p>
                  <Button
                    variant="secondary"
                    onClick={handleGenerateAiExplain}
                    disabled={isGeneratingAiExplain}
                    className="flex items-center gap-2 mx-auto"
                  >
                    {isGeneratingAiExplain ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Генерация...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Сгенерировать вопросы
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {aiExplainItems.map((item, index) => {
                  const questionText = typeof item?.question === 'string' ? item.question : String(item?.question ?? '')
                  const answerText = typeof item?.answer === 'string' ? item.answer : String(item?.answer ?? '')
                  return (
                  <Card key={index} className={`${bgCard} ${borderColor} p-5`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-full ${theme === 'dark' ? 'bg-violet-500/20' : 'bg-violet-100'} flex items-center justify-center flex-shrink-0`}>
                        <span className={`${theme === 'dark' ? 'text-violet-300' : 'text-violet-700'} font-semibold`}>{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`${textColor} font-semibold`}>{questionText}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandedAiExplain(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="flex-shrink-0"
                      >
                        {expandedAiExplain[index] ? 'Скрыть' : 'Показать'}
                      </Button>
                    </div>
                    {expandedAiExplain[index] && (
                      <div className="mt-4">
                        <ErrorBoundary fallback={<div className={textColor}>{answerText}</div>}>
                          <MarkdownRenderer content={answerText} className={textColor} />
                        </ErrorBoundary>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
            )}
          </div>
        )

      default:
        return (
          <div className="text-center">
            <p className={textMuted}>{content.description}</p>
          </div>
        )
    }
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="flex h-[calc(100vh-5rem)] relative">
        {/* Left Panel - Teacher Control */}
        <aside className={`w-80 lg:w-96 ${sidebarBg} border-r ${borderColor} p-6 flex flex-col overflow-y-auto`}>
          <div className="mb-6">
            <h2 className={`text-2xl font-bold ${textColor} mb-2`}>Пульт учителя</h2>
            <p className={`${textMuted} text-sm`}>Выберите раздел урока</p>
          </div>

          {/* Selected Topics */}
          {selectedTopics.length > 0 && (
            <Card className={`mb-4 p-4 ${bgCard} ${borderColor}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`${textMuted60} text-sm font-semibold`}>Выбранные темы</span>
                <span className={`${textMuted60} text-xs`}>{selectedTopics.length}</span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedTopics.map(topic => (
                  <div
                    key={topic.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}
                  >
                    <span className={`${textColor} text-sm truncate flex-1`}>{topic.title}</span>
                    <button
                      onClick={() => removeTopic(topic.id)}
                      className={`${textMuted} hover:${textColor} transition-colors`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Lesson Templates */}
          <Card className={`mb-4 p-4 ${bgCard} ${borderColor}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${textMuted60} text-sm font-semibold`}>Мои уроки</span>
              <span className={`${textMuted60} text-xs`}>{lessonTemplates.length}</span>
            </div>
            {lessonsLoading && (
              <div className={`${textMuted} text-sm`}>Загрузка...</div>
            )}
            {!lessonsLoading && lessonTemplates.length === 0 && (
              <div className={`${textMuted} text-sm`}>Пока нет сохранённых уроков</div>
            )}
            {lessonsError && (
              <div className="text-rose-500 text-sm">{lessonsError}</div>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lessonTemplates.map((lesson) => (
                <div key={lesson.id} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => handleApplyTemplate(lesson)}
                      className={`text-left ${textColor} text-sm font-medium flex-1`}
                    >
                      {lesson.title}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(lesson.id)}
                      className={`${textMuted} hover:${textColor} transition-colors`}
                      aria-label="Удалить урок"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className={`${textMuted} text-xs mt-1`}>
                    {lesson.lesson_topic} • {lesson.class_name}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Control Buttons */}
          <div className="flex-1 space-y-3">
            {controlButtons.map((btn) => {
              const isActive = activeState === btn.id
              return (
                <motion.button
                  key={btn.id}
                  onClick={() => setActiveState(btn.id)}
                  className={`
                    w-full h-20 rounded-xl flex items-center gap-4 px-4 text-left
                    transition-all duration-200 relative overflow-hidden
                    ${isActive
                      ? 'bg-gradient-to-r ' + btn.color + ' text-white shadow-lg scale-[1.02]'
                      : buttonInactive
                    }
                  `}
                  whileHover={{ scale: isActive ? 1.02 : 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`
                    p-3 rounded-xl transition-all duration-200
                    ${isActive ? 'bg-white/20' : 'bg-white/10'}
                  `}>
                    {btn.icon}
                  </div>
                  <span className="text-xl font-medium">{btn.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute right-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <CheckCircle2 size={20} className="text-white/80" />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Lesson Info */}
          <Card className={`mt-6 p-4 ${bgCard} ${borderColor}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${textMuted60} text-sm`}>Тема урока</span>
              <button
                onClick={() => navigate('/library')}
                className="text-primary-400 text-sm font-medium cursor-pointer hover:text-primary-300 transition-colors"
              >
                Изменить
              </button>
            </div>
            <p className={`${textColor} font-medium`}>
              {selectedTopics.length > 0 ? selectedTopics.map(t => t.title).join(', ') : 'Введение в механику'}
            </p>
          </Card>

          {/* Finish Lesson Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-4"
            onClick={handleFinishLesson}
          >
            <Play size={20} className="mr-2" />
            Завершить урок
          </Button>
        </aside>

        {/* Right Zone - Demonstration Screen */}
        <main ref={demoScreenRef} className="flex-1 p-8 flex items-start justify-center overflow-y-auto relative">
          {/* Панель управления зумом */}
          <div className={`
            absolute top-4 left-4 z-50
            flex items-center gap-3 px-4 py-2 rounded-xl
            ${theme === 'dark'
              ? 'bg-white/10 border border-white/20 backdrop-blur-sm'
              : 'bg-white/90 border border-slate-300 backdrop-blur-sm'
            }
            shadow-lg
          `}>
            <button
              onClick={handleZoomOut}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${theme === 'dark'
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-slate-200 text-slate-700'
                }
              `}
              title="Уменьшить (Ctrl + -)"
            >
              <ZoomOut size={18} />
            </button>

            <div className="w-32">
              <Slider
                min={50}
                max={200}
                value={zoomLevel}
                onChange={handleZoomChange}
                className={theme === 'dark' ? 'bg-white/20' : 'bg-slate-200'}
              />
            </div>

            <button
              onClick={handleZoomIn}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${theme === 'dark'
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-slate-200 text-slate-700'
                }
              `}
              title="Увеличить (Ctrl + +)"
            >
              <ZoomIn size={18} />
            </button>

            <div className={`
              min-w-[3rem] text-center text-sm font-medium
              ${theme === 'dark' ? 'text-white' : 'text-slate-700'}
            `}>
              {zoomLevel}%
            </div>

            <button
              onClick={handleZoomReset}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${theme === 'dark'
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-slate-200 text-slate-700'
                }
              `}
              title="Сбросить масштаб"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Кнопка панели класса */}
          <button
            onClick={() => setIsClassPanelOpen(prev => !prev)}
            className={`
              absolute top-4 right-20 z-50
              w-12 h-12 rounded-xl flex items-center justify-center
              transition-all duration-200
              ${theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }
              shadow-lg hover:shadow-xl
            `}
            aria-label={isClassPanelOpen ? 'Закрыть панель класса' : 'Открыть панель класса'}
            title={isClassPanelOpen ? 'Закрыть панель класса' : 'Открыть панель класса'}
          >
            <Users size={20} />
          </button>

          {/* Кнопка полноэкранного режима */}
          <button
            onClick={toggleFullscreen}
            className={`
              absolute top-4 right-4 z-50
              w-12 h-12 rounded-xl flex items-center justify-center
              transition-all duration-200
              ${theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }
              shadow-lg hover:shadow-xl
            `}
            aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
            title={isFullscreen ? 'Выйти из полноэкранного режима (F11)' : 'Полноэкранный режим (F11)'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <div
            ref={contentRef}
            className="w-full flex justify-center transition-transform duration-300 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <Card className={`w-full flex flex-col items-center justify-start p-12 border-2 border-dashed ${theme === 'dark' ? 'border-white/20 bg-gradient-to-br from-white/[0.02] to-white/[0.05]' : 'border-slate-300 bg-gradient-to-br from-slate-50 to-white'} relative overflow-hidden ${bgCard} ${borderColor}`}>
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeState + selectedTopicId}
                  className="relative z-10 w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeState === 'idle' ? (
                    <>
                      {/* Icon */}
                      <motion.div
                        className={`w-32 h-32 mx-auto mb-8 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'} flex items-center justify-center`}
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      >
                        {content.icon}
                      </motion.div>

                      {/* Title */}
                      <motion.h1
                        className={`text-4xl lg:text-5xl font-bold ${textColor} mb-4 text-center`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {content.title}
                      </motion.h1>

                      {/* Description */}
                      <motion.p
                        className={`text-xl ${textMuted} max-w-lg mx-auto mb-8 text-center`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {content.description}
                      </motion.p>

                      {/* Hint */}
                      {activeState !== 'idle' && (
                        <motion.div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'} ${textMuted60} text-sm mx-auto`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          {content.hint}
                        </motion.div>
                      )}

                      {/* Active indicator */}
                      {activeState !== 'idle' && activeButton && (
                        <motion.div
                          className="mt-12 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-r from-white/10 to-white/5 border border-white/10' : 'bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200'}`}>
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${activeButton.color} animate-pulse`} />
                            <span className={textMuted70}>Демонстрация активна</span>
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    renderContent()
                  )}
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </main>

        {/* Right Panel - Class Panel */}
        <aside
          className={`
            absolute right-0 top-0 h-full w-80 lg:w-96 ${sidebarBg} border-l ${borderColor}
            transition-transform duration-300 z-40
            ${isClassPanelOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${textColor} mb-1`}>Класс</h2>
                <p className={`${textMuted} text-sm`}>Подключенные ученики</p>
              </div>
              <button
                onClick={() => setIsClassPanelOpen(false)}
                className={`${textMuted} hover:${textColor} transition-colors`}
                aria-label="Закрыть панель"
              >
                <X size={18} />
              </button>
            </div>

            {classList.length === 0 ? (
              <Card className={`p-4 ${bgCard} ${borderColor}`}>
                <p className={textMuted}>Нет подключенных учеников</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className={`p-4 ${bgCard} ${borderColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`${textMuted60} text-sm font-semibold`}>Классы</span>
                    <span className={`${textMuted60} text-xs`}>{classList.length}</span>
                  </div>
                  <div className="space-y-2">
                    {classList.map((classId) => (
                      <button
                        key={classId}
                        onClick={() => setSelectedClassForPanel(classId)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
                          transition-colors
                          ${selectedClassForPanel === classId
                            ? theme === 'dark'
                              ? 'bg-white/10 text-white'
                              : 'bg-slate-200 text-slate-900'
                            : theme === 'dark'
                              ? 'bg-white/5 text-white/70 hover:bg-white/10'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }
                        `}
                      >
                        <span className="text-sm font-medium truncate">{classId}</span>
                        <span className={`${textMuted60} text-xs`}>
                          {classGroups[classId]?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className={`p-4 ${bgCard} ${borderColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`${textMuted60} text-sm font-semibold`}>Ученики</span>
                    <span className={`${textMuted60} text-xs`}>
                      {selectedClassForPanel ? (classGroups[selectedClassForPanel]?.length || 0) : 0}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {selectedClassForPanel && classGroups[selectedClassForPanel]?.length ? (
                      classGroups[selectedClassForPanel].map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}
                        >
                          <span className={`${textColor} text-sm truncate flex-1`}>{student.name || 'Ученик'}</span>
                        </div>
                      ))
                    ) : (
                      <p className={textMuted}>Нет учеников в этом классе</p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Formula Modal */}
      {selectedFormula && selectedTopic && (
        <FormulaModal
          isOpen={isFormulaModalOpen}
          onClose={() => {
            setIsFormulaModalOpen(false)
            setSelectedFormula(null)
            setSelectedFormulaIndex(-1)
          }}
          formula={selectedFormula}
          topicTitle={selectedTopic.title}
          formulaIndex={selectedFormulaIndex}
          containerRef={demoScreenRef}
        />
      )}

      {/* Class Garden Modal */}
      <ClassGarden
        isOpen={showClassGarden}
        onClose={() => setShowClassGarden(false)}
        onFinish={handleClassGardenFinish}
      />

      {/* Lesson Complete Animation */}
      <AnimatePresence>
        {showLessonComplete && (
          <LessonComplete
            topicTitle={selectedTopics.length > 0 ? selectedTopics.map(t => t.title).join(', ') : 'Урок'}
            onGoHome={handleGoHome}
            onContinue={handleContinueLearning}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
