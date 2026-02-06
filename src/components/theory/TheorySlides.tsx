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

  // Если нет теории, показываем красивый экран с кнопкой генерации
  if (slides.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Кнопка генерации - всегда видна */}
        <div className="flex items-center justify-center mb-6">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-3 px-8 py-4 text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Генерация теории...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Сгенерировать теорию
              </>
            )}
          </Button>
        </div>

        {generationError && (
          <Card className={`${bgCard} ${borderColor} p-6`}>
            <div className={`text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
              <p className="font-semibold mb-2">Ошибка генерации</p>
              <p className="text-sm">{generationError}</p>
            </div>
          </Card>
        )}

        {/* Красивая карточка с информацией */}
        <Card className={`${bgCard} ${borderColor} p-12 min-h-[500px] flex flex-col items-center justify-center shadow-xl`}>
          <div className="text-center max-w-2xl">
            <div className={`w-24 h-24 rounded-full ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center mx-auto mb-6`}>
              <BookOpen size={48} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
            </div>
            <h3 className={`text-3xl font-bold ${textColor} mb-4`}>
              {topicTitle}
            </h3>
            {topicDescription && (
              <p className={`text-lg ${textMuted} mb-8`}>
                {topicDescription}
              </p>
            )}
            <div className={`${textMuted50} space-y-2 mb-8`}>
              <p className="text-base">
                Теоретический материал для этой темы пока не создан.
              </p>
              <p className="text-base">
                Нажмите кнопку "Сгенерировать теорию" выше, чтобы создать полный учебный урок с примерами и задачами.
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
              <Sparkles size={18} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
              <span className={`text-sm ${textMuted}`}>
                AI создаст структурированный урок с примерами
              </span>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Кнопка генерации - всегда видна */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Сгенерировать теорию
            </>
          )}
        </Button>
        {generationError && (
          <div className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
            {generationError}
          </div>
        )}
      </div>

      {/* Индикатор слайдов */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              transition-all duration-200 rounded-full
              ${index === currentSlide
                ? 'w-8 h-2 bg-blue-500'
                : 'w-2 h-2 bg-slate-400/50 hover:bg-slate-400'
              }
            `}
            aria-label={`Перейти к слайду ${index + 1}`}
          />
        ))}
      </div>

      {/* Контейнер слайда */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`${bgCard} ${borderColor} p-8 md:p-12 min-h-[500px] max-h-[70vh] flex flex-col shadow-xl`}>
              {/* Заголовок слайда */}
              <div className="mb-8 pb-6 border-b border-slate-300/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <BookOpen size={24} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                  <h3 className={`text-2xl md:text-3xl font-bold ${textColor} leading-tight`}>
                    {slides[currentSlide].title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-sm font-medium ${textMuted}`}>
                    Слайд {currentSlide + 1} из {slides.length}
                  </span>
                </div>
              </div>

              {/* Содержание слайда */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <MarkdownRenderer 
                  content={slides[currentSlide].content}
                  className="text-base md:text-lg lg:text-xl leading-relaxed"
                />
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Кнопки навигации */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            size="lg"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 min-w-[120px]"
          >
            <ChevronLeft size={20} />
            Назад
          </Button>

          <div className="flex items-center gap-4">
            <span className={`${textMuted} text-sm font-medium`}>
              {currentSlide + 1} / {slides.length}
            </span>
            <span className={`${textMuted} text-xs`}>
              Используйте ← → для навигации
            </span>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-2 min-w-[120px]"
          >
            Вперед
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Миниатюры слайдов (опционально) */}
      {slides.length > 1 && (
        <div className="mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  flex-shrink-0 p-3 rounded-lg border transition-all duration-200
                  ${index === currentSlide
                    ? `${borderColor} border-2 ${bgCard}`
                    : `${borderColor} border ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} hover:${bgCard}`
                  }
                `}
              >
                <p className={`text-xs font-medium ${index === currentSlide ? textColor : textMuted} text-left max-w-[120px] truncate`}>
                  {slide.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

