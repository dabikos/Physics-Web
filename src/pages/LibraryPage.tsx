import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { useLesson } from '@/contexts/LessonContext'
import { useTopics } from '@/hooks/useTopics'
import { useAuth } from '@/contexts/AuthContext'
import { createLessonTemplate } from '@/lib/supabaseLessons'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gauge, 
  Thermometer, 
  Zap, 
  Eye, 
  Atom,
  Compass,
  Telescope,
  Plus,
  Check,
  X,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles
} from 'lucide-react'

const physicsSections = [
  {
    id: 'mechanics',
    title: 'Механика',
    description: 'Движение, силы, энергия, импульс, колебания',
    icon: <Gauge size={22} />,
    color: 'from-blue-500 to-cyan-500',
    totalTopics: 22,
  },
  {
    id: 'thermodynamics',
    title: 'Термодинамика',
    description: 'Теплота, температура, молекулярная физика, газы',
    icon: <Thermometer size={22} />,
    color: 'from-orange-500 to-red-500',
    totalTopics: 18,
  },
  {
    id: 'electromagnetism',
    title: 'Электродинамика',
    description: 'Заряды, электрические поля, постоянный ток, магнетизм',
    icon: <Zap size={22} />,
    color: 'from-yellow-500 to-amber-500',
    totalTopics: 20,
  },
  {
    id: 'optics',
    title: 'Оптика',
    description: 'Геометрическая и волновая оптика, интерференция',
    icon: <Eye size={22} />,
    color: 'from-purple-500 to-pink-500',
    totalTopics: 12,
  },
  {
    id: 'atomic',
    title: 'Атомная и ядерная физика',
    description: 'Строение атома, фотоэффект, радиоактивность',
    icon: <Atom size={22} />,
    color: 'from-emerald-500 to-teal-500',
    totalTopics: 14,
  },
  {
    id: 'relativity',
    title: 'Теория относительности',
    description: 'СТО, релятивистская динамика, пространство и время',
    icon: <Compass size={22} />,
    color: 'from-amber-500 to-orange-600',
    totalTopics: 10,
  },
  {
    id: 'astronomy',
    title: 'Астрономия и астрофизика',
    description: 'Солнечная система, законы Кеплера, звёзды и Вселенная',
    icon: <Telescope size={22} />,
    color: 'from-indigo-500 to-violet-600',
    totalTopics: 12,
  },
]

export function LibraryPage() {
  const { theme } = useTheme()
  const { addTopic, removeTopic, isTopicSelected, selectedTopics } = useLesson()
  const { user } = useAuth()
  const { sectionsData, loading, error } = useTopics()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')
  const [learningGoal, setLearningGoal] = useState('')
  const [lessonClass, setLessonClass] = useState('')
  const [createStatus, setCreateStatus] = useState<string | null>(null)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
  const textMuted40 = theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
  const bgCard = theme === 'dark' ? 'quantum-card' : 'bg-white shadow-md border-slate-200'
  const borderColor = theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
  const modalBackdrop = theme === 'dark' ? 'bg-cosmic-950/80 backdrop-blur-md' : 'bg-slate-900/50 backdrop-blur-sm'
  const inputBg = theme === 'dark' ? 'bg-cosmic-900/90 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'

  // Синхронный мгновенный подсчёт выбранных тем без сетевых задержек и повторных рендеров
  const selectedCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!sectionsData || selectedTopics.length === 0) return counts
    const selectedSet = new Set(selectedTopics.map(t => t.id))
    for (const [secId, subs] of Object.entries(sectionsData)) {
      let count = 0
      for (const sub of subs) {
        for (const t of sub.topics) {
          if (selectedSet.has(t.id)) count++
        }
      }
      counts[secId] = count
    }
    return counts
  }, [sectionsData, selectedTopics])

  const getSelectedCount = (sectionId: string) => {
    return selectedCounts[sectionId] || 0
  }

  const handleToggleSection = (sectionId: string) => {
    setExpandedSection(prev => (prev === sectionId ? null : sectionId))
    setExpandedSubsections(new Set())
  }

  const handleToggleSubsection = (subsectionId: string) => {
    setExpandedSubsections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subsectionId)) {
        newSet.delete(subsectionId)
      } else {
        newSet.add(subsectionId)
      }
      return newSet
    })
  }

  // Мгновенное локальное переключение темы без асинхронных задержек и подвисаний
  const handleToggleTopic = (topic: any) => {
    if (!topic || !topic.id) return
    if (isTopicSelected(topic.id)) {
      removeTopic(topic.id)
    } else {
      addTopic(topic)
    }
  }


  // Фильтрация тем по поисковому запросу
  const filterTopics = (topics: any[], query: string) => {
    if (!query.trim()) return topics
    
    const lowerQuery = query.toLowerCase()
    return topics.filter(topic => 
      topic.title.toLowerCase().includes(lowerQuery) ||
      topic.description?.toLowerCase().includes(lowerQuery)
    )
  }

  // Проверка, есть ли совпадения в подразделе
  const hasMatchesInSubsection = (subsection: any, query: string) => {
    if (!query.trim()) return true
    return filterTopics(subsection.topics, query).length > 0
  }

  // Проверка, есть ли совпадения в разделе
  const hasMatchesInSection = (sectionId: string, query: string) => {
    if (!query.trim()) return true
    const subsections = sectionsData[sectionId] || []
    return subsections.some(sub => hasMatchesInSubsection(sub, query))
  }

  // Автоматически раскрываем раздел при поиске
  useEffect(() => {
    if (searchQuery.trim()) {
      // Находим первый раздел с совпадениями
      const sectionWithMatches = physicsSections.find(s => hasMatchesInSection(s.id, searchQuery))
      if (sectionWithMatches && expandedSection !== sectionWithMatches.id) {
        setExpandedSection(sectionWithMatches.id)
        // Раскрываем все подразделы с совпадениями
        const subsections = sectionsData[sectionWithMatches.id] || []
        const matchingSubsections = subsections
          .filter(sub => hasMatchesInSubsection(sub, searchQuery))
          .map(sub => sub.id)
        setExpandedSubsections(new Set(matchingSubsections))
      }
    }
  }, [searchQuery, sectionsData])

  const handleCreateLesson = async () => {
    if (!lessonTitle.trim() || !lessonTopic.trim() || !learningGoal.trim() || !lessonClass.trim()) {
      setCreateStatus('Заполните все поля')
      return
    }
    setIsCreatingLesson(true)
    setCreateStatus(null)
    const created = await createLessonTemplate({
      title: lessonTitle.trim(),
      lesson_topic: lessonTopic.trim(),
      learning_goal: learningGoal.trim(),
      class_name: lessonClass.trim(),
      topic_ids: selectedTopics.map(t => t.id),
      owner_id: user?.id || null,
      owner_name: user?.name || user?.email || null,
    })
    if (!created) {
      setCreateStatus('Не удалось сохранить урок')
    } else {
      setCreateStatus('Урок сохранён')
      setLessonTitle('')
      setLessonTopic('')
      setLearningGoal('')
      setLessonClass('')
      setIsCreateLessonOpen(false)
    }
    setIsCreatingLesson(false)
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 pb-8 pt-16 lg:px-8">
      <div className="max-w-[1500px] mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl lg:text-3xl font-extrabold ${textColor} tracking-tight`}>
                Библиотека разделов
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/15 text-primary-300 border border-primary-500/30">
                86 тем
              </span>
            </div>
            <p className={`${textMuted} text-xs lg:text-sm mt-1`}>
              Выберите темы для проведения урока или создайте персональный шаблон
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Bar */}
            <div className={`
              flex items-center gap-2.5 px-3 py-1.5 rounded-xl border
              ${theme === 'dark' 
                ? 'bg-slate-900/60 border-white/10 focus-within:border-primary-500/60' 
                : 'bg-white border-slate-300 focus-within:border-primary-500'
              }
              transition-colors w-full sm:w-64
            `}>
              <Search size={16} className={textMuted} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск тем..."
                className={`
                  flex-1 bg-transparent outline-none text-xs
                  ${textColor} placeholder:${textMuted}
                `}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`
                    p-0.5 rounded transition-colors
                    ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}
                  `}
                >
                  <X size={14} className={textMuted} />
                </button>
              )}
            </div>

            {/* Create Lesson Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateLessonOpen(true)}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl gap-1.5 shadow-md shadow-primary-500/20"
            >
              <Plus size={15} />
              <span>Создать урок</span>
              {selectedTopics.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  {selectedTopics.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <p className={`${textMuted} text-xs`}>Загрузка данных...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-rose-400 text-xs">{error}</p>
          </div>
        )}

        {/* No Results Message */}
        {!loading && !error && searchQuery.trim() && 
         physicsSections.every(section => !hasMatchesInSection(section.id, searchQuery)) && (
          <Card className={`${bgCard} ${borderColor} p-6 text-center rounded-2xl mb-6`}>
            <Search size={32} className={`${textMuted} mx-auto mb-2`} />
            <h3 className={`${textColor} text-base font-semibold mb-1`}>
              Ничего не найдено
            </h3>
            <p className={`${textMuted} text-xs`}>
              Попробуйте изменить поисковый запрос
            </p>
          </Card>
        )}

        {/* Sections Grid - 4 columns on large screens for comfortable 100% scale */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mb-6">
            {physicsSections
              .filter(section => !searchQuery.trim() || hasMatchesInSection(section.id, searchQuery))
              .map((section) => {
              const isExpanded = expandedSection === section.id
              const selectedCount = getSelectedCount(section.id)
            
            return (
              <motion.div
                key={section.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
              >
                <div className={`
                  p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full
                  ${isExpanded 
                    ? 'ring-2 ring-primary-500/80 bg-primary-500/10 border-primary-500/50 shadow-lg shadow-primary-500/10' 
                    : theme === 'dark'
                      ? 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }
                `}>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`
                        w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} 
                        flex items-center justify-center text-white shrink-0 shadow-md shadow-black/20
                      `}>
                        {section.icon}
                      </div>
                      {selectedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                          {selectedCount} в уроке
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm lg:text-base font-bold ${textColor} leading-tight mb-1.5`}>
                      {section.title}
                    </h3>
                    <p className={`${textMuted} text-xs line-clamp-2 leading-relaxed mb-4 min-h-[2rem]`}>
                      {section.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                    <span className={`${textMuted40} text-xs font-medium`}>
                      {section.totalTopics} тем
                    </span>
                    <button 
                      onClick={() => handleToggleSection(section.id)}
                      className={`
                        h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all
                        ${isExpanded 
                          ? 'bg-primary-500 text-white shadow-sm' 
                          : theme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }
                      `}
                    >
                      {isExpanded ? (
                        <>
                          <X size={14} />
                          <span>Закрыть</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight size={14} />
                          <span>Открыть</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
          </div>
        )}

        {/* Expanded Sections with Topics */}
        <AnimatePresence>
          {expandedSection && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <div className={`p-5 rounded-3xl border ${borderColor} ${bgCard} shadow-2xl relative overflow-hidden`}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${textColor} leading-tight`}>
                        {physicsSections.find(s => s.id === expandedSection)?.title}
                      </h2>
                      <p className={`${textMuted} text-xs`}>
                        Нажмите на тему, чтобы добавить её в активный урок
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedSection(null)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      theme === 'dark' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    title="Свернуть раздел"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  {(sectionsData[expandedSection] || [])
                    .filter(subsection => hasMatchesInSubsection(subsection, searchQuery))
                    .map((subsection) => {
                    const isSubsectionExpanded = expandedSubsections.has(subsection.id)
                    const selectedInSubsection = subsection.topics.filter(t => isTopicSelected(t.id)).length
                    const filteredTopics = filterTopics(subsection.topics, searchQuery)
                    
                    return (
                      <div key={subsection.id} className={`${theme === 'dark' ? 'bg-white/[0.03] border border-white/5' : 'bg-slate-50 border border-slate-200'} rounded-2xl p-3.5 transition-all`}>
                        <button
                          onClick={() => handleToggleSubsection(subsection.id)}
                          className="w-full flex items-center justify-between hover:opacity-90 transition-opacity"
                        >
                          <div className="flex items-center gap-2.5">
                            {isSubsectionExpanded ? (
                              <ChevronDown size={16} className="text-primary-400" />
                            ) : (
                              <ChevronRight size={16} className={textMuted} />
                            )}
                            <h3 className={`text-sm font-semibold ${textColor}`}>
                              {subsection.title}
                            </h3>
                            <span className={`${textMuted40} text-xs`}>
                              ({filteredTopics.length} тем)
                            </span>
                          </div>
                          {selectedInSubsection > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
                              {selectedInSubsection} в уроке
                            </span>
                          )}
                        </button>

                        <AnimatePresence>
                          {isSubsectionExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 pt-2 border-t border-white/5"
                            >
                              {filteredTopics.map((topic) => {
                                const isSelected = isTopicSelected(topic.id)
                                return (
                                  <div
                                    key={topic.id}
                                    onClick={() => handleToggleTopic(topic)}
                                    className={`
                                      p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-2.5
                                      ${isSelected 
                                        ? 'ring-2 ring-primary-500/70 bg-primary-500/15 border-primary-500/50' 
                                        : theme === 'dark'
                                          ? 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
                                          : 'bg-white border-slate-200 hover:border-slate-300'
                                      }
                                    `}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <h4 className={`text-xs font-semibold ${textColor} truncate`}>
                                          {topic.title}
                                        </h4>
                                      </div>
                                      {topic.description && (
                                        <p className={`${textMuted} text-[11px] truncate mt-0.5`}>
                                          {topic.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                      isSelected 
                                        ? 'bg-primary-500 text-white shadow-sm' 
                                        : 'bg-white/10 text-slate-400'
                                    }`}>
                                      {isSelected ? <Check size={13} /> : <Plus size={13} />}
                                    </div>
                                  </div>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Tip Bar */}
        <div className={`p-4 rounded-2xl border ${borderColor} ${theme === 'dark' ? 'bg-primary-500/5' : 'bg-primary-50'} flex items-center gap-3`}>
          <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <p className={`${textMuted} text-xs leading-relaxed`}>
            Выбранные темы автоматически попадают в меню «Мой урок» для запуска теории, формул, интерактивных симуляций и генерации тестов.
          </p>
        </div>
      </div>

      {/* Create Lesson Modal */}
      <AnimatePresence>
        {isCreateLessonOpen && (
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center ${modalBackdrop}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-xl mx-4`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <Card className={`${bgCard} ${borderColor} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-2xl font-bold ${textColor}`}>Создать урок</h3>
                  <button
                    onClick={() => setIsCreateLessonOpen(false)}
                    className={`${textMuted} hover:${textColor} transition-colors`}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`${textMuted} text-sm`}>Название урока</label>
                    <input
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className={`w-full mt-1 rounded-lg border px-3 py-2 ${inputBg}`}
                      placeholder="Например: Закон сохранения энергии"
                    />
                  </div>
                  <div>
                    <label className={`${textMuted} text-sm`}>Тема урока</label>
                    <input
                      value={lessonTopic}
                      onChange={(e) => setLessonTopic(e.target.value)}
                      className={`w-full mt-1 rounded-lg border px-3 py-2 ${inputBg}`}
                      placeholder="Краткая формулировка темы"
                    />
                  </div>
                  <div>
                    <label className={`${textMuted} text-sm`}>Цель обучения</label>
                    <textarea
                      value={learningGoal}
                      onChange={(e) => setLearningGoal(e.target.value)}
                      className={`w-full mt-1 rounded-lg border px-3 py-2 min-h-[90px] ${inputBg}`}
                      placeholder="Что ученики должны понять/уметь"
                    />
                  </div>
                  <div>
                    <label className={`${textMuted} text-sm`}>Класс</label>
                    <input
                      value={lessonClass}
                      onChange={(e) => setLessonClass(e.target.value)}
                      className={`w-full mt-1 rounded-lg border px-3 py-2 ${inputBg}`}
                      placeholder="Например: 8А"
                    />
                  </div>
                  <div className={`${textMuted} text-sm`}>
                    Выбрано тем: {selectedTopics.length}
                  </div>
                  {createStatus && (
                    <div className={`text-sm ${createStatus === 'Урок сохранён' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {createStatus}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" size="md" onClick={() => setIsCreateLessonOpen(false)}>
                    Отмена
                  </Button>
                  <Button variant="primary" size="md" onClick={handleCreateLesson} disabled={isCreatingLesson}>
                    {isCreatingLesson ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
