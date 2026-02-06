import { useState, useEffect } from 'react'
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
  Plus,
  Check,
  X,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Search
} from 'lucide-react'

const physicsSections = [
  {
    id: 'mechanics',
    title: 'Механика',
    description: 'Движение, силы, энергия, импульс',
    icon: <Gauge size={48} />,
    color: 'from-blue-500 to-cyan-500',
    totalTopics: 22,
  },
  {
    id: 'thermodynamics',
    title: 'Термодинамика',
    description: 'Теплота, температура, энтропия',
    icon: <Thermometer size={48} />,
    color: 'from-orange-500 to-red-500',
    totalTopics: 18,
  },
  {
    id: 'electricity',
    title: 'Электричество и магнетизм',
    description: 'Заряды, поля, цепи, магнетизм',
    icon: <Zap size={48} />,
    color: 'from-yellow-500 to-amber-500',
    totalTopics: 20,
  },
  {
    id: 'optics',
    title: 'Оптика',
    description: 'Свет, линзы, волны, спектры',
    icon: <Eye size={48} />,
    color: 'from-purple-500 to-pink-500',
    totalTopics: 12,
  },
  {
    id: 'atomic',
    title: 'Атомная и ядерная физика',
    description: 'Строение атома, ядерные реакции',
    icon: <Atom size={48} />,
    color: 'from-emerald-500 to-teal-500',
    totalTopics: 14,
  },
]

export function LibraryPage() {
  const { theme } = useTheme()
  const { addTopic, removeTopic, isTopicSelected, selectedTopics } = useLesson()
  const { user } = useAuth()
  const { sectionsData, loading, error, getAllTopics } = useTopics()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set())
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')
  const [learningGoal, setLearningGoal] = useState('')
  const [lessonClass, setLessonClass] = useState('')
  const [createStatus, setCreateStatus] = useState<string | null>(null)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/50' : 'text-slate-600'
  const textMuted40 = theme === 'dark' ? 'text-white/40' : 'text-slate-500'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const modalBackdrop = theme === 'dark' ? 'bg-slate-950/70' : 'bg-slate-900/40'
  const inputBg = theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'

  // Обновление счетчиков выбранных тем
  useEffect(() => {
    async function updateCounts() {
      const counts: Record<string, number> = {}
      for (const sectionId of Object.keys(sectionsData)) {
        const topics = await getAllTopics(sectionId)
        counts[sectionId] = topics.filter(t => isTopicSelected(t.id)).length
      }
      setSelectedCounts(counts)
    }
    if (Object.keys(sectionsData).length > 0) {
      updateCounts()
    }
  }, [sectionsData, isTopicSelected, getAllTopics])

  const handleToggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
    if (expandedSection !== sectionId) {
      setExpandedSubsections(new Set())
    }
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

  const handleToggleTopic = async (topicId: string, sectionId: string) => {
    const allSectionTopics = await getAllTopics(sectionId)
    const topic = allSectionTopics.find(t => t.id === topicId)
    if (!topic) return

    if (isTopicSelected(topicId)) {
      removeTopic(topicId)
    } else {
      addTopic(topic)
    }
  }

  const getSelectedCount = (sectionId: string) => {
    return selectedCounts[sectionId] || 0
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
    <div className="min-h-screen px-6 pb-6 pt-24 lg:px-8 lg:pb-8 lg:pt-28">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-4xl lg:text-5xl font-bold ${textColor} mb-3`}>
            Библиотека
          </h1>
          <p className={`${textMuted} text-xl mb-6`}>
            Выберите раздел физики и темы для добавления в урок
          </p>

          {/* Create Lesson Button */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateLessonOpen(true)}
              className="gap-2"
            >
              Создать урок
            </Button>
            <span className={`${textMuted} text-sm`}>
              Выбрано тем: {selectedTopics.length}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border-2
              ${theme === 'dark' 
                ? 'bg-white/5 border-white/10 focus-within:border-primary-500/50' 
                : 'bg-white border-slate-300 focus-within:border-primary-500'
              }
              transition-colors
            `}>
              <Search size={20} className={textMuted} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск тем по названию или описанию..."
                className={`
                  flex-1 bg-transparent outline-none
                  ${textColor} placeholder:${textMuted}
                `}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`
                    p-1 rounded-lg transition-colors
                    ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}
                  `}
                >
                  <X size={18} className={textMuted} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className={textMuted}>Загрузка данных...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* No Results Message */}
        {!loading && !error && searchQuery.trim() && 
         physicsSections.every(section => !hasMatchesInSection(section.id, searchQuery)) && (
          <Card className={`${bgCard} ${borderColor} p-8 text-center`}>
            <Search size={48} className={`${textMuted} mx-auto mb-4`} />
            <h3 className={`${textColor} text-xl font-semibold mb-2`}>
              Ничего не найдено
            </h3>
            <p className={textMuted}>
              Попробуйте изменить поисковый запрос
            </p>
          </Card>
        )}

        {/* Sections Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {physicsSections
              .filter(section => !searchQuery.trim() || hasMatchesInSection(section.id, searchQuery))
              .map((section) => {
              const isExpanded = expandedSection === section.id
              const selectedCount = getSelectedCount(section.id)
              const subsections = sectionsData[section.id] || []
            
            return (
              <motion.div
                key={section.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card hover className={`overflow-hidden group ${bgCard} ${borderColor} ${isExpanded ? 'ring-2 ring-primary-500' : ''}`}>
                  <CardHeader className="pb-4">
                    <div className={`
                      w-20 h-20 rounded-2xl bg-gradient-to-br ${section.color} 
                      flex items-center justify-center text-white mb-4
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      {section.icon}
                    </div>
                    <h3 className={`text-2xl font-bold ${textColor} mb-2`}>
                      {section.title}
                    </h3>
                    <p className={textMuted}>
                      {section.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`${textMuted40} text-sm`}>
                        {section.totalTopics} тем
                        {selectedCount > 0 && (
                          <span className="text-primary-400 ml-2">
                            ({selectedCount} выбрано)
                          </span>
                        )}
                      </span>
                      <Button 
                        variant={isExpanded ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleSection(section.id)}
                        className="gap-2"
                      >
                        {isExpanded ? (
                          <>
                            <X size={18} />
                            Закрыть
                          </>
                        ) : (
                          <>
                            <ChevronRight size={18} />
                            Открыть
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          </div>
        )}

        {/* Expanded Sections with Topics */}
        <AnimatePresence>
          {expandedSection && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className={`${bgCard} ${borderColor}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className={`text-3xl font-bold ${textColor} mb-2`}>
                        {physicsSections.find(s => s.id === expandedSection)?.title}
                      </h2>
                      <p className={textMuted}>
                        Выберите темы для добавления в урок
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSection(null)}
                    >
                      <X size={20} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(sectionsData[expandedSection] || [])
                      .filter(subsection => hasMatchesInSubsection(subsection, searchQuery))
                      .map((subsection) => {
                      const isSubsectionExpanded = expandedSubsections.has(subsection.id)
                      const selectedInSubsection = subsection.topics.filter(t => isTopicSelected(t.id)).length
                      const filteredTopics = filterTopics(subsection.topics, searchQuery)
                      
                      return (
                        <div key={subsection.id} className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} rounded-xl p-4`}>
                          <button
                            onClick={() => handleToggleSubsection(subsection.id)}
                            className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-3">
                              {isSubsectionExpanded ? (
                                <ChevronDown size={20} className={textMuted} />
                              ) : (
                                <ChevronRight size={20} className={textMuted} />
                              )}
                              <h3 className={`text-xl font-semibold ${textColor}`}>
                                {subsection.title}
                              </h3>
                              <span className={`${textMuted40} text-sm`}>
                                ({filteredTopics.length} {searchQuery ? 'найдено' : 'тем'})
                              </span>
                              {selectedInSubsection > 0 && (
                                <span className="text-primary-400 text-sm font-medium">
                                  {selectedInSubsection} выбрано
                                </span>
                              )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isSubsectionExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3"
                              >
                                {filteredTopics.map((topic) => {
                                  const isSelected = isTopicSelected(topic.id)
                                  return (
                                    <motion.div
                                      key={topic.id}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Card
                                        hover
                                        className={`cursor-pointer transition-all ${
                                          isSelected 
                                            ? 'ring-2 ring-primary-500 bg-primary-500/10' 
                                            : ''
                                        } ${bgCard} ${borderColor}`}
                                        onClick={() => handleToggleTopic(topic.id, expandedSection)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <BookOpen size={16} className="text-primary-400" />
                                                <h4 className={`text-base font-semibold ${textColor}`}>
                                                  {topic.title}
                                                </h4>
                                              </div>
                                              <p className={`${textMuted} text-sm`}>
                                                {topic.description}
                                              </p>
                                            </div>
                                            <div className={`flex-shrink-0 ${isSelected ? 'text-primary-500' : textMuted40}`}>
                                              {isSelected ? (
                                                <Check size={20} className="text-primary-500" />
                                              ) : (
                                                <Plus size={20} />
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Card */}
        <Card className={`mt-10 p-8 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20 ${bgCard} ${borderColor}`}>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Plus size={32} className="text-primary-400" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${textColor} mb-1`}>
                Создайте свой урок
              </h3>
              <p className={textMuted}>
                Выберите раздел, откройте подразделы и добавьте нужные темы в урок. Всего доступно 86 тем по физике.
              </p>
            </div>
          </div>
        </Card>
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
