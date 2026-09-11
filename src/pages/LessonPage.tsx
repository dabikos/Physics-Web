import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Puzzle, Cpu, FunctionSquare, ClipboardCheck, Sparkles, CheckCircle2, Play, X, Loader2, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Users, Trash2, Gauge, Zap, Triangle, PanelLeftClose, PanelLeftOpen, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLesson } from '@/contexts/LessonContext'
import { motion, AnimatePresence } from 'framer-motion'
import { TheorySlides } from '@/components/theory/TheorySlides'
import { DrawingCanvas } from '@/components/whiteboard/DrawingCanvas'
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
  { id: 'theory' as DemoState, label: 'Теория', icon: <BookOpen size={18} />, color: 'from-blue-500 to-cyan-500' },
  { id: 'problems' as DemoState, label: 'Задачи', icon: <Puzzle size={18} />, color: 'from-orange-500 to-amber-500' },
  { id: 'simulations' as DemoState, label: 'Симуляции', icon: <Cpu size={18} />, color: 'from-purple-500 to-pink-500' },
  { id: 'formulas' as DemoState, label: 'Формулы', icon: <FunctionSquare size={18} />, color: 'from-emerald-500 to-teal-500' },
  { id: 'test' as DemoState, label: 'Тест', icon: <ClipboardCheck size={18} />, color: 'from-rose-500 to-red-500' },
  { id: 'ai-explain' as DemoState, label: 'AI объясни', icon: <Sparkles size={18} />, color: 'from-violet-500 to-purple-500', accent: true },
]

import { API_BASE } from '@/lib/api'

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('teacher_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('teacher_sidebar_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const [isDrawingActive, setIsDrawingActive] = useState<boolean>(false)

  // Hotkey 'P' / 'З' to toggle pen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        setIsDrawingActive(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
  const [problemsTab, setProblemsTab] = useState<'classic' | 'interactive'>('classic')
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
        (document as any).msFullscreenElement ||
        isFullscreen
      )

      if (!isCurrentlyFullscreen) {
        setIsFullscreen(true)
        try {
          if (demoScreenRef.current.requestFullscreen) {
            await demoScreenRef.current.requestFullscreen()
          } else if ((demoScreenRef.current as any).webkitRequestFullscreen) {
            await (demoScreenRef.current as any).webkitRequestFullscreen()
          } else if ((demoScreenRef.current as any).mozRequestFullScreen) {
            await (demoScreenRef.current as any).mozRequestFullScreen()
          } else if ((demoScreenRef.current as any).msRequestFullscreen) {
            await (demoScreenRef.current as any).msRequestFullscreen()
          }
        } catch {
          // Native fullscreen rejected, in-app fullscreen is active!
        }
      } else {
        setIsFullscreen(false)
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen()
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen()
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen()
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen()
          }
        } catch {
          // Ignore
        }
      }
    } catch (error) {
      console.error('Ошибка переключения полноэкранного режима:', error)
      setIsFullscreen(prev => !prev)
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
      if (isFullscreenActive) {
        setIsFullscreen(true)
      }
    }

    handleFullscreenChange()

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    // Обработка клавиш F11 и Escape
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'Escape' && isFullscreen) {
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
  }, [isFullscreen])

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

    const renderSectionHeader = (
      icon: React.ReactNode,
      title: string,
      badgeColor: string,
      actions?: React.ReactNode,
      subtitle?: string
    ) => (
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${badgeColor}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base sm:text-lg font-bold truncate ${textColor}`}>{title}</h2>
              {selectedTopics.length > 1 && (
                <select
                  value={selectedTopicId || ''}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value)
                    setGeneratedProblems([])
                    setInteractiveTasks([])
                  }}
                  className={`text-xs px-2 py-0.5 rounded-lg border font-medium cursor-pointer ${
                    theme === 'dark' ? 'bg-slate-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {selectedTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              )}
            </div>
            {subtitle && <p className={`${textMuted} text-[11px] truncate max-w-lg`}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">{actions}</div>}
      </div>
    )

    switch (activeState) {
      case 'theory':
        return (
          <div className="w-full mx-auto text-left space-y-3">
            {renderSectionHeader(
              <BookOpen size={16} />,
              `Теория: ${selectedTopic.title}`,
              theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
              null,
              selectedTopic.description
            )}
            <TheorySlides
              theory={selectedTopic.theory || ''}
              topicTitle={selectedTopic.title}
              topicDescription={selectedTopic.description}
              topicId={selectedTopic.id}
              isFullscreen={isFullscreen}
              onTheoryGenerated={(newTheory, formulas) => {
                updateTopic(selectedTopic.id, {
                  theory: newTheory,
                  formulas: formulas && formulas.length > 0 ? formulas : selectedTopic.formulas
                })
              }}
            />
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
      <div className="w-full mx-auto text-left space-y-4">
        {renderSectionHeader(
          <Cpu size={16} />,
          selectedMeta?.title || 'Симуляция',
          theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedSimulationId(null)}
            className="h-8 text-xs px-3"
          >
            ← К каталогу
          </Button>,
          selectedMeta?.description
        )}

        <div className="space-y-4">
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
    <div className="w-full mx-auto text-left space-y-4">
      {renderSectionHeader(
        <Cpu size={16} />,
        `Симуляции: ${selectedTopic.title}`,
        theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
        null,
        'Интерактивные виртуальные опыты для демонстрации физических законов'
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {simulationCatalog.map((simulation) => (
          <div
            key={simulation.id}
            onClick={() => setSelectedSimulationId(simulation.id)}
            className={`rounded-2xl border ${borderColor} ${bgCard} p-4 flex flex-col cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-lg group`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                {simulationIconMap[simulation.id]}
              </div>
              <h3 className={`text-sm font-bold ${textColor} truncate`}>
                {simulation.title}
              </h3>
            </div>
            <div className={`h-20 rounded-xl mb-3 flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
              {simulationPreviewMap[simulation.id]}
            </div>
            <p className={`${textMuted} text-xs mb-3 flex-1 line-clamp-2`}>
              {simulation.description}
            </p>
            <div className="flex flex-wrap gap-1 mb-3">
              {simulation.tags.map((tag) => (
                <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'}`}>
                  {tag}
                </span>
              ))}
            </div>
            <Button variant="primary" size="sm" className="w-full h-8 text-xs font-semibold">
              Запустить
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

        case 'formulas':
          return (
            <div className="w-full mx-auto text-left space-y-4">
              {renderSectionHeader(
                <FunctionSquare size={16} />,
                `Формулы: ${selectedTopic.title}`,
                theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {selectedTopic.formulas?.length || 0} формул
                </span>,
                selectedTopic.description
              )}

              {selectedTopic.formulas && selectedTopic.formulas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedTopic.formulas.map((formula, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl border ${borderColor} ${bgCard} p-3.5 hover:shadow-lg transition-all hover:border-emerald-500/50 group cursor-pointer flex flex-col justify-between`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFormula(formula)
                        setSelectedFormulaIndex(index)
                        setIsFormulaModalOpen(true)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                          {index + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Подробнее →</span>
                      </div>
                      <div className="py-2 flex justify-center items-center">
                        <FormulaDisplay formula={formula} className={`${textColor} text-center w-full text-sm sm:text-base`} displayMode={true} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-2xl border ${borderColor} ${bgCard} p-8 text-center space-y-3`}>
                  <p className={`text-xs ${textMuted}`}>
                    Формулы для этой темы пока не извлечены. Сгенерируйте теорию — формулы будут автоматически добавлены сюда.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setActiveState('theory')}>
                    Перейти к теории
                  </Button>
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
          <div className="w-full mx-auto text-left space-y-3">
            {renderSectionHeader(
              <Puzzle size={16} />,
              `Задачи: ${generationTopicTitle}`,
              theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600',
              <div className="flex items-center gap-2">
                {/* Вкладки: Обычные / Интерактивные */}
                <div className={`p-0.5 rounded-xl border flex items-center ${theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() => setProblemsTab('classic')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      problemsTab === 'classic'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : `${textMuted} hover:${textColor}`
                    }`}
                  >
                    Задачи ({displayProblems.length})
                  </button>
                  <button
                    onClick={() => setProblemsTab('interactive')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      problemsTab === 'interactive'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : `${textMuted} hover:${textColor}`
                    }`}
                  >
                    Интерактивные ({interactiveTasks.length})
                  </button>
                </div>

                {problemsTab === 'classic' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateProblems}
                    disabled={isGeneratingProblems}
                    className="h-8 text-xs px-3 flex items-center gap-1.5 shadow-sm"
                  >
                    {isGeneratingProblems ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    <span>{displayProblems.length > 0 ? 'Обновить' : 'Создать'}</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateInteractiveTasks}
                    disabled={isGeneratingInteractive}
                    className="h-8 text-xs px-3 flex items-center gap-1.5 shadow-sm"
                  >
                    {isGeneratingInteractive ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    <span>{interactiveTasks.length > 0 ? 'Обновить' : 'Создать'}</span>
                  </Button>
                )}
              </div>
            )}

            {/* Компактная полоса выбора темы */}
            <div className={`rounded-xl border ${borderColor} ${bgCard} p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`${textMuted} text-[11px] whitespace-nowrap`}>Тема урока:</span>
                <select
                  className={`rounded-lg px-2.5 py-1 text-xs flex-1 ${theme === 'dark' ? 'bg-slate-900 text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-200'}`}
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
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`${textMuted} text-[11px] whitespace-nowrap`}>Своя тема:</span>
                <input
                  className={`rounded-lg px-2.5 py-1 text-xs flex-1 ${theme === 'dark' ? 'bg-slate-900 text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-200'}`}
                  placeholder="Например: Закон всемирного тяготения"
                  value={customProblemTopic}
                  onChange={(e) => setCustomProblemTopic(e.target.value)}
                />
              </div>
            </div>

            {problemsError && (
              <div className={`p-2.5 rounded-xl text-xs ${theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700'}`}>
                {problemsError}
              </div>
            )}

            {interactiveError && (
              <div className={`p-2.5 rounded-xl text-xs ${theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700'}`}>
                {interactiveError}
              </div>
            )}

            {/* Контент: Классические задачи */}
            {problemsTab === 'classic' && (
              displayProblems.length > 0 ? (
                <div className="space-y-2.5">
                  {displayProblems.map((problem, index) => (
                    <div key={index} className={`rounded-2xl border ${borderColor} ${bgCard} p-4 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <ProblemRenderer
                            problem={problem}
                            className="text-xs sm:text-sm leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-2xl border ${borderColor} ${bgCard} p-8 text-center space-y-3`}>
                  <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                    <Puzzle size={24} />
                  </div>
                  <h3 className={`text-sm font-bold ${textColor}`}>Задачи еще не добавлены</h3>
                  <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>
                    Нажмите кнопку ниже, чтобы сгенерировать практические задачи с пошаговыми решениями по теме «{generationTopicTitle}».
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateProblems}
                    disabled={isGeneratingProblems}
                    className="mx-auto h-8 px-4 text-xs font-semibold"
                  >
                    {isGeneratingProblems ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Sparkles size={13} className="mr-1.5" />}
                    Сгенерировать задачи
                  </Button>
                </div>
              )
            )}

            {/* Контент: Интерактивные задачи */}
            {problemsTab === 'interactive' && (
              interactiveTasks.length > 0 ? (
                <div className="space-y-3">
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
                <div className={`rounded-2xl border ${borderColor} ${bgCard} p-8 text-center space-y-3`}>
                  <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                    <Sparkles size={24} />
                  </div>
                  <h3 className={`text-sm font-bold ${textColor}`}>Интерактивные задачи не созданы</h3>
                  <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>
                    Интерактивные задачи содержат разбор Дано / Найти, варианты ответов, подсказки и расчетные шаги.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateInteractiveTasks}
                    disabled={isGeneratingInteractive}
                    className="mx-auto h-8 px-4 text-xs font-semibold"
                  >
                    {isGeneratingInteractive ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Sparkles size={13} className="mr-1.5" />}
                    Сгенерировать интерактивные задачи
                  </Button>
                </div>
              )
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
            <div className="space-y-4">
              {renderSectionHeader(
                <ClipboardCheck size={16} />,
                `Тест: ${selectedTopic.title}`,
                theme === 'dark' ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600',
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTestQuestions([])
                    setTestAnswers([])
                    setTestResult(null)
                  }}
                  className="h-8 text-xs px-3"
                >
                  Пересоздать тест
                </Button>
              )}

              <TestViewer
                questions={testQuestions}
                onComplete={(answers) => {
                  const correctAnswers = answers.reduce((count, answer, index) => {
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

              <div className={`rounded-2xl border ${borderColor} ${bgCard} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`text-xs font-bold ${textColor}`}>Подключенные ученики и варианты</h4>
                    <p className={`text-[11px] ${textMuted}`}>Результаты прохождения в реальном времени</p>
                  </div>
                  {demoTestSummary && (
                    <div className="text-xs font-mono text-emerald-400">
                      Средний балл: {demoTestSummary.average}% • Сдали: {demoTestSummary.count}
                    </div>
                  )}
                </div>

                {connectedStudents.length === 0 ? (
                  <div className={`text-xs ${textMuted}`}>Пока никто не подключился к сессии.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {connectedStudents.map((student) => {
                      const result = demoTestResults[student.id]
                      const variantIndex =
                        (typeof result?.variant_index === 'number' ? result.variant_index + 1 : null) ??
                        variantMap[student.id] ??
                        1
                      return (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div>
                            <div className={`${textColor} font-semibold truncate`}>
                              {student.name || 'Ученик'}
                            </div>
                            <div className={`${textMuted} text-[10px]`}>
                              Вариант {variantIndex}
                            </div>
                          </div>
                          <div className="text-right">
                            {result ? (
                              <div className="text-emerald-400 font-mono font-bold text-xs">
                                {result.score}%
                              </div>
                            ) : (
                              <div className={`text-[11px] ${textMuted}`}>Ожидает</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
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
          <div className="w-full mx-auto text-left space-y-4">
            {renderSectionHeader(
              <ClipboardCheck size={16} />,
              `Тест: ${selectedTopic.title}`,
              theme === 'dark' ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600',
              null,
              selectedTopic.description
            )}
            <TestGenerator
              topicTitle={selectedTopic.title}
              onGenerate={handleGenerateTest}
              isGenerating={isGeneratingTest}
              error={testError}
            />
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
    <div className="pt-16 min-h-screen">
      <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden">
        {/* Left Panel - Teacher Control */}
        {isSidebarCollapsed ? (
          <aside className={`w-[68px] min-w-[68px] ${sidebarBg} border-r ${borderColor} py-4 px-2 flex flex-col items-center justify-between transition-all duration-300 z-20 shrink-0`}>
            <div className="flex flex-col items-center w-full">
              <button
                onClick={toggleSidebar}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
                }`}
                title="Развернуть пульт учителя"
              >
                <PanelLeftOpen size={18} />
              </button>
              <div className={`w-8 h-px my-3 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
            </div>

            {/* Compact Control Icons */}
            <div className="flex flex-col items-center gap-2.5 w-full my-auto">
              {controlButtons.map((btn) => {
                const isActive = activeState === btn.id
                return (
                  <div key={btn.id} className="relative group flex items-center justify-center">
                    <button
                      onClick={() => setActiveState(btn.id)}
                      aria-label={btn.label}
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-br ' + btn.color + ' text-white shadow-md shadow-primary-500/20 ring-2 ring-primary-400/50 scale-105'
                          : buttonInactive
                        }
                      `}
                    >
                      {btn.icon}
                    </button>
                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10">
                      {btn.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Collapsed Actions */}
            <div className="flex flex-col items-center gap-2 w-full pt-2">
              <div className={`w-8 h-px mb-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
              <div className="relative group">
                <button
                  onClick={handleFinishLesson}
                  aria-label="Завершить урок"
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors border border-rose-500/20"
                >
                  <Play size={16} />
                </button>
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10">
                  Завершить урок
                </div>
              </div>
            </div>
          </aside>
        ) : (
          <aside className={`w-72 lg:w-80 min-w-[280px] max-w-[320px] ${sidebarBg} border-r ${borderColor} p-4 flex flex-col justify-between overflow-y-auto transition-all duration-300 z-20 shrink-0`}>
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold ${textColor} leading-tight`}>Пульт учителя</h2>
                    <p className={`${textMuted} text-[11px]`}>Разделы и сценарии урока</p>
                  </div>
                </div>
                <button
                  onClick={toggleSidebar}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                  title="Свернуть пульт учителя"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              {/* Selected Topics */}
              {selectedTopics.length > 0 && (
                <Card className={`mb-3 p-3 ${bgCard} ${borderColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${textMuted60} text-xs font-semibold uppercase tracking-wider`}>Выбранные темы</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary-500/20 text-primary-300 font-bold">{selectedTopics.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {selectedTopics.map(topic => (
                      <div
                        key={topic.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}
                      >
                        <span className={`${textColor} truncate flex-1 font-medium`}>{topic.title}</span>
                        <button
                          onClick={() => removeTopic(topic.id)}
                          className={`${textMuted} hover:${textColor} ml-1 transition-colors`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Lesson Templates */}
              <Card className={`mb-3 p-3 ${bgCard} ${borderColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textMuted60} text-xs font-semibold uppercase tracking-wider`}>Мои уроки</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-slate-400 font-bold">{lessonTemplates.length}</span>
                </div>
                {lessonsLoading && (
                  <div className={`${textMuted} text-xs py-1`}>Загрузка...</div>
                )}
                {!lessonsLoading && lessonTemplates.length === 0 && (
                  <div className={`${textMuted} text-xs py-1`}>Пока нет сохранённых уроков</div>
                )}
                {lessonsError && (
                  <div className="text-rose-400 text-xs py-1">{lessonsError}</div>
                )}
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {lessonTemplates.map((lesson) => (
                    <div key={lesson.id} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} text-xs`}>
                      <div className="flex items-start justify-between gap-1">
                        <button
                          onClick={() => handleApplyTemplate(lesson)}
                          className={`text-left ${textColor} font-medium truncate flex-1 hover:underline`}
                        >
                          {lesson.title}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(lesson.id)}
                          className={`${textMuted} hover:${textColor} transition-colors shrink-0`}
                          aria-label="Удалить урок"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className={`${textMuted} text-[10px] mt-0.5 truncate`}>
                        {lesson.lesson_topic} • {lesson.class_name}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Control Buttons */}
              <div className="space-y-2 mb-4">
                {controlButtons.map((btn) => {
                  const isActive = activeState === btn.id
                  return (
                    <button
                      key={btn.id}
                      onClick={() => setActiveState(btn.id)}
                      className={`
                        w-full h-11 rounded-xl flex items-center gap-3 px-3 text-left
                        transition-all duration-200 relative overflow-hidden text-sm font-medium
                        ${isActive
                          ? 'bg-gradient-to-r ' + btn.color + ' text-white shadow-md shadow-primary-500/20 scale-[1.01]'
                          : buttonInactive
                        }
                      `}
                    >
                      <div className={`
                        w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200
                        ${isActive ? 'bg-white/20' : 'bg-white/10'}
                      `}>
                        {btn.icon}
                      </div>
                      <span className="flex-1 truncate">{btn.label}</span>
                      {isActive && (
                        <CheckCircle2 size={16} className="text-white/90 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="pt-3 mt-auto border-t border-white/5 space-y-2.5">
              <div className={`p-2.5 rounded-xl ${bgCard} border ${borderColor} text-xs`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`${textMuted60} text-[11px]`}>Текущая тема:</span>
                  <button
                    onClick={() => navigate('/library')}
                    className="text-primary-400 hover:text-primary-300 font-medium text-[11px] transition-colors"
                  >
                    Изменить
                  </button>
                </div>
                <p className={`${textColor} font-semibold truncate`}>
                  {selectedTopics.length > 0 ? selectedTopics.map(t => t.title).join(', ') : 'Введение в механику'}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full h-10 text-xs font-semibold shadow-lg shadow-primary-500/20"
                onClick={handleFinishLesson}
              >
                <Play size={15} className="mr-1.5" />
                Завершить урок
              </Button>
            </div>
          </aside>
        )}

        {/* Right Zone - Demonstration Screen */}
        <main
          ref={demoScreenRef}
          className={`flex-1 flex justify-center relative overflow-y-auto transition-all ${
            isFullscreen
              ? 'fixed inset-0 z-50 w-screen h-screen p-3 sm:p-5 lg:p-6 items-center bg-slate-950'
              : 'p-4 lg:p-6 items-start'
          }`}
        >
          {/* Top Floating Glass Toolbar */}
          <div className={`
            absolute top-3 right-4 z-30
            flex items-center gap-1.5 p-1.5 rounded-2xl
            ${theme === 'dark'
              ? 'bg-slate-900/80 border border-white/10 backdrop-blur-md text-slate-200'
              : 'bg-white/90 border border-slate-200 backdrop-blur-md text-slate-700'
            }
            shadow-xl shadow-black/20
          `}>
            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
                title="Уменьшить масштаб"
              >
                <ZoomOut size={15} />
              </button>
              <button
                onClick={handleZoomReset}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10 text-slate-200 bg-white/5' : 'hover:bg-slate-200 text-slate-700 bg-slate-100'
                }`}
                title="Сбросить на 100%"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
                title="Увеличить масштаб"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Class Panel Button */}
            <button
              onClick={() => setIsClassPanelOpen(prev => !prev)}
              className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
                isClassPanelOpen
                  ? 'bg-primary-500 text-white shadow-sm'
                  : theme === 'dark'
                    ? 'hover:bg-white/10 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
              }`}
              title={isClassPanelOpen ? 'Закрыть панель класса' : 'Открыть панель класса'}
            >
              <Users size={14} />
              <span>Класс</span>
            </button>

            <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Whiteboard Pen Button */}
            <button
              onClick={() => setIsDrawingActive(prev => !prev)}
              className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
                isDrawingActive
                  ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400'
                  : theme === 'dark'
                    ? 'hover:bg-white/10 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
              }`}
              title={isDrawingActive ? 'Выключить перо (P)' : 'Перо для заметок (P)'}
            >
              <PenTool size={14} />
              <span>Перо</span>
            </button>

            <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                theme === 'dark' ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>

          <div
            ref={contentRef}
            className={`w-full flex justify-center transition-transform duration-300 origin-top ${
              isFullscreen ? 'h-full items-center' : ''
            }`}
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <Card className={`
              w-full flex flex-col items-center border backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300
              ${isFullscreen
                ? 'max-w-none h-[calc(100vh-2.5rem)] rounded-2xl p-6 lg:p-10 justify-between'
                : 'max-w-5xl min-h-[560px] rounded-3xl p-6 lg:p-8 justify-start'
              }
              ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/95'}
            `}>
              {/* Whiteboard Drawing Layer */}
              <DrawingCanvas
                isActive={isDrawingActive}
                onClose={() => setIsDrawingActive(false)}
              />

              {/* Background decoration */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeState + selectedTopicId}
                  className={`relative z-10 w-full ${isFullscreen ? 'h-full flex flex-col justify-center' : ''}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeState === 'idle' ? (
                    <div className={`flex flex-col items-center text-center mx-auto my-auto ${isFullscreen ? 'py-10 max-w-3xl' : 'py-12 max-w-xl'}`}>
                      <motion.div
                        className={`${isFullscreen ? 'w-24 h-24 mb-8' : 'w-20 h-20 mb-6'} mx-auto rounded-3xl ${theme === 'dark' ? 'bg-primary-500/10 border border-primary-500/20 text-primary-400' : 'bg-primary-50 border border-primary-100 text-primary-600'} flex items-center justify-center shadow-lg shadow-primary-500/10`}
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      >
                        <BookOpen size={isFullscreen ? 44 : 36} />
                      </motion.div>

                      <motion.h1
                        className={`${isFullscreen ? 'text-4xl sm:text-5xl mb-4' : 'text-3xl lg:text-4xl mb-3'} font-extrabold ${textColor}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        Интерактивная доска
                      </motion.h1>

                      <motion.p
                        className={`${isFullscreen ? 'text-lg sm:text-xl mb-10 max-w-xl' : 'text-base mb-8 max-w-md'} ${textMuted} leading-relaxed`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Выберите раздел в пульте учителя для показа теории, интерактивных симуляций, решения задач или проведения тестирования.
                      </motion.p>

                      {/* Quick launch shortcuts */}
                      <div className={`grid grid-cols-3 gap-4 w-full ${isFullscreen ? 'max-w-2xl' : ''}`}>
                        <button
                          onClick={() => setActiveState('theory')}
                          className={`${isFullscreen ? 'p-5' : 'p-3.5'} rounded-2xl border text-left transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`${isFullscreen ? 'w-10 h-10 mb-3' : 'w-8 h-8 mb-2'} rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center`}>
                            <BookOpen size={isFullscreen ? 20 : 16} />
                          </div>
                          <div className={`${isFullscreen ? 'text-sm' : 'text-xs'} font-semibold ${textColor}`}>Теория</div>
                          <div className={`${isFullscreen ? 'text-xs' : 'text-[11px]'} ${textMuted}`}>Интерактивные слайды</div>
                        </button>

                        <button
                          onClick={() => setActiveState('simulations')}
                          className={`${isFullscreen ? 'p-5' : 'p-3.5'} rounded-2xl border text-left transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`${isFullscreen ? 'w-10 h-10 mb-3' : 'w-8 h-8 mb-2'} rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center`}>
                            <Cpu size={isFullscreen ? 20 : 16} />
                          </div>
                          <div className={`${isFullscreen ? 'text-sm' : 'text-xs'} font-semibold ${textColor}`}>Симуляции</div>
                          <div className={`${isFullscreen ? 'text-xs' : 'text-[11px]'} ${textMuted}`}>Лабораторные опыты</div>
                        </button>

                        <button
                          onClick={() => setActiveState('test')}
                          className={`${isFullscreen ? 'p-5' : 'p-3.5'} rounded-2xl border text-left transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`${isFullscreen ? 'w-10 h-10 mb-3' : 'w-8 h-8 mb-2'} rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center`}>
                            <ClipboardCheck size={isFullscreen ? 20 : 16} />
                          </div>
                          <div className={`${isFullscreen ? 'text-sm' : 'text-xs'} font-semibold ${textColor}`}>Экспресс-тест</div>
                          <div className={`${isFullscreen ? 'text-xs' : 'text-[11px]'} ${textMuted}`}>Проверка знаний</div>
                        </button>
                      </div>
                    </div>
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
