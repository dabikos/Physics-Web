import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { generateTheory } from '@/lib/githubAI'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { extractFormulasFromTheory } from '@/lib/formulaExtractor'

interface TheorySlide {
  title: string
  content: string
}

interface TheorySlidesProps {
  theory: string
  topicTitle: string
  topicDescription?: string
  topicId?: string
  onTheoryGenerated?: (newTheory: string, formulas?: string[]) => void
}

export function TheorySlides({ theory, topicTitle, topicDescription = '', topicId, onTheoryGenerated }: TheorySlidesProps) {
  const { theme } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [displayTheory, setDisplayTheory] = useState(theory)

  // Обновляем отображаемую теорию при изменении пропса
  useEffect(() => {
    setDisplayTheory(theory)
  }, [theory])

  // Разбиваем теорию на слайды по заголовкам
  const slides = useMemo<TheorySlide[]>(() => {
    if (!displayTheory) return []

    let text = displayTheory.trim()
    const parts: TheorySlide[] = []
    const headings: Array<{ title: string; index: number }> = []
    
    // Список известных заголовков (новый формат промпта)
    const knownHeadings = [
      'Введение',
      'Основные понятия',
      'Законы и формулы',
      'Примеры и задачи',
      'Роль и применение в жизни',
      'Заключение',
      // Старые форматы для совместимости
      'Введение в прямолинейное движение',
      'Понятие перемещения',
      'Скорость в прямолинейном движении',
      'Роль времени в анализе движения',
    ]

    // Ищем известные заголовки в тексте
    knownHeadings.forEach(heading => {
      // Ищем заголовок с разными вариантами форматирования
      const patterns = [
        // Заголовок с ** (markdown bold)
        new RegExp(`\\*\\*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`, 'm'),
        // Заголовок с ## (markdown heading)
        new RegExp(`##\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'),
        // Заголовок на отдельной строке
        new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'),
        // Заголовок после переноса строки
        new RegExp(`\\n${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'),
      ]
      
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
          const index = match.index !== undefined ? match.index : text.indexOf(heading)
          if (index !== -1 && !headings.find(h => h.title === heading)) {
            headings.push({ title: heading, index })
            break
          }
        }
      }
    })

    // Если не нашли известные заголовки, ищем заголовки по паттерну
    if (headings.length === 0) {
      // Ищем markdown заголовки **текст** или ## текст
      const markdownHeadings = text.match(/\*\*([^*]+)\*\*/g) || []
      markdownHeadings.forEach(match => {
        const title = match.replace(/\*\*/g, '').trim()
        if (title && title.length < 100) {
          const index = text.indexOf(match)
          if (index !== -1 && !headings.find(h => h.title === title)) {
            headings.push({ title, index })
          }
        }
      })

      // Ищем обычные заголовки (строки, которые выглядят как заголовки)
      if (headings.length === 0) {
        const lines = text.split('\n')
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : ''
          
          // Проверяем, что это может быть заголовок
          if (
            line &&
            /^[А-ЯЁ]/.test(line) &&
            !line.endsWith('.') &&
            line.length < 100 &&
            line.split(' ').length < 15 &&
            (nextLine === '' || /^[А-ЯЁ]/.test(nextLine) || nextLine.length > 50)
          ) {
            const index = text.indexOf(line)
            if (index !== -1 && !headings.find(h => h.title === line)) {
              headings.push({ title: line, index })
            }
          }
        }
      }
    }

    // Сортируем заголовки по позиции в тексте
    headings.sort((a, b) => a.index - b.index)

    // Удаляем дубликаты
    const uniqueHeadings = headings.filter((h, index, self) => 
      index === self.findIndex(t => t.title === h.title)
    )

    // Если заголовки не найдены, создаем один слайд со всем текстом
    if (uniqueHeadings.length === 0) {
      return [{
        title: topicTitle,
        content: text
      }]
    }

    // Создаем слайды на основе найденных заголовков
    uniqueHeadings.forEach((heading, index) => {
      const startIndex = heading.index
      const endIndex = index < uniqueHeadings.length - 1 
        ? uniqueHeadings[index + 1].index 
        : text.length

      // Извлекаем контент между заголовками
      let content = text.substring(startIndex, endIndex)
      
      // Удаляем заголовок из начала контента (разные форматы)
      if (content.startsWith(`**${heading.title}**`)) {
        content = content.substring(heading.title.length + 4).trim()
      } else if (content.startsWith(`## ${heading.title}`)) {
        content = content.substring(heading.title.length + 3).trim()
      } else if (content.startsWith(heading.title)) {
        content = content.substring(heading.title.length).trim()
      }
      
      // Удаляем markdown форматирование и лишние переносы строк
      content = content
        .replace(/^\*\*/g, '') // Убираем ** в начале
        .replace(/\*\*$/g, '') // Убираем ** в конце
        .replace(/^##\s*/g, '') // Убираем ## в начале
        .replace(/^\n+/g, '') // Убираем переносы строк в начале
        .trim()
      
      parts.push({
        title: heading.title,
        content: content || 'Содержание раздела...'
      })
    })

    return parts.length > 0 ? parts : [{ title: topicTitle, content: text }]
  }, [displayTheory, topicTitle])

  // Генерация теории
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationError(null)
    
    try {
      const generatedTheory = await generateTheory(topicTitle, topicDescription)
      setDisplayTheory(generatedTheory)
      
      // Извлекаем формулы из сгенерированной теории
      const extractedFormulas = extractFormulasFromTheory(generatedTheory)
      
      if (onTheoryGenerated) {
        onTheoryGenerated(generatedTheory, extractedFormulas)
      }
      setCurrentSlide(0) // Сбрасываем на первый слайд
    } catch (error: any) {
      console.error('Ошибка генерации теории:', error)
      setGenerationError(error.message || 'Не удалось сгенерировать теорию')
    } finally {
      setIsGenerating(false)
    }
  }

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index)
    }
  }

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  // Клавиатурная навигация
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1)
      } else if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentSlide, slides.length])

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/70' : 'text-slate-600'
  const textMuted50 = theme === 'dark' ? 'text-white/50' : 'text-slate-500'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const buttonBg = theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'

  // Если нет теории, показываем компактный экран с кнопкой генерации
  if (slides.length === 0) {
    return (
      <div className="w-full mx-auto">
        {generationError && (
          <div className={`mb-4 p-3 rounded-xl text-center text-xs ${theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {generationError}
          </div>
        )}

        <div className={`rounded-2xl border ${borderColor} ${bgCard} p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-lg`}>
          <div className={`w-14 h-14 rounded-2xl ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'} flex items-center justify-center mb-4`}>
            <BookOpen size={28} />
          </div>
          
          <h3 className={`text-xl font-bold ${textColor} mb-1.5`}>
            {topicTitle}
          </h3>
          
          {topicDescription && (
            <p className={`text-xs sm:text-sm ${textMuted} max-w-lg mb-6`}>
              {topicDescription}
            </p>
          )}

          <p className={`text-xs ${textMuted50} mb-6 max-w-md`}>
            Теоретический материал для этой темы еще не сгенерирован. Нажмите кнопку ниже, чтобы ИИ составил структурированный интерактивный конспект с формулами и примерами.
          </p>

          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/25"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Генерация теории...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Сгенерировать теорию</span>
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto space-y-3">
      {generationError && (
        <div className={`p-2.5 rounded-xl text-xs text-center ${theme === 'dark' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700'}`}>
          {generationError}
        </div>
      )}

      {/* Верхняя панель слайдера: Название, индикаторы и кнопка перегенерации */}
      <div className={`rounded-2xl border ${borderColor} ${bgCard} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <BookOpen size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold truncate ${textColor}`}>
                {slides[currentSlide].title}
              </h3>
              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Индикатор слайдов */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  transition-all duration-200 rounded-full
                  ${index === currentSlide
                    ? 'w-6 h-1.5 bg-blue-500'
                    : 'w-1.5 h-1.5 bg-slate-400/40 hover:bg-slate-400'
                  }
                `}
                aria-label={`Слайд ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' 
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            } disabled:opacity-50`}
            title="Перегенерировать теорию"
          >
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-blue-400" />}
            <span className="hidden md:inline">Обновить</span>
          </button>
        </div>
      </div>

      {/* Тело слайда */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`rounded-2xl border ${borderColor} ${bgCard} p-5 sm:p-7 shadow-md flex flex-col min-h-[280px] max-h-[62vh]`}>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <MarkdownRenderer 
                  content={slides[currentSlide].content}
                  className="text-sm sm:text-base md:text-lg leading-relaxed"
                />
              </div>

              {/* Навигация слайда */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="flex items-center gap-1.5 text-xs h-8 px-3"
                >
                  <ChevronLeft size={15} />
                  <span>Назад</span>
                </Button>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="hidden sm:inline">Клавиши: [←] [→]</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                  className="flex items-center gap-1.5 text-xs h-8 px-3"
                >
                  <span>Вперед</span>
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Миниатюры тем/слайдов */}
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-xl border text-left transition-all duration-200
                ${index === currentSlide
                  ? 'border-blue-500/60 bg-blue-500/15 text-blue-300 font-semibold'
                  : `${borderColor} ${theme === 'dark' ? 'bg-white/[0.02] text-slate-400' : 'bg-slate-50 text-slate-600'} hover:border-white/20`
                }
              `}
            >
              <p className="text-[11px] max-w-[130px] truncate">
                {index + 1}. {slide.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

