import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Loader2, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
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
  isFullscreen?: boolean
  onTheoryGenerated?: (newTheory: string, formulas?: string[]) => void
}

export function TheorySlides({
  theory,
  topicTitle,
  topicDescription = '',
  topicId,
  isFullscreen = false,
  onTheoryGenerated,
}: TheorySlidesProps) {
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

    // Нормализация и очистка нежелательных артефактов
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\(в формате LaTeX\)/gi, '')
      .replace(/\(в формате latex\)/gi, '')
      .replace(/Newton's законы/gi, 'Законы Ньютона')

    const lines = text.split('\n')
    const sections: Array<{ title: string; lineIndex: number }> = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // 1. Markdown заголовки ## Заголовок или # Заголовок
      const mdHeadingMatch = line.match(/^#{1,3}\s+(.+)$/)
      if (mdHeadingMatch) {
        let title = mdHeadingMatch[1].replace(/\*\*/g, '').trim()
        title = title.replace(/^\d+[\.\)]\s*/, '').trim() // убираем "1. " или "2) "
        if (title.length >= 2 && title.length < 80) {
          sections.push({ title, lineIndex: i })
          continue
        }
      }

      // 2. Жирные заголовки на отдельной строке **Заголовок**
      const boldHeadingMatch = line.match(/^\*\*(?:(?:\d+[\.\)]\s*)?([^*]+))\*\*$/)
      if (boldHeadingMatch) {
        let title = boldHeadingMatch[1].trim()
        title = title.replace(/^\d+[\.\)]\s*/, '').trim()
        if (title.length >= 2 && title.length < 80) {
          sections.push({ title, lineIndex: i })
          continue
        }
      }

      // 3. Заголовки типа "ПЕРВЫЙ ЗАКОН НЬЮТОНА:"
      const upperMatch = line.match(/^([А-ЯЁ\s\(\)]+):$/)
      if (upperMatch && line.length < 60 && line.split(' ').length < 8) {
        let title = upperMatch[1].trim()
        if (title.length > 3) {
          sections.push({ title, lineIndex: i })
          continue
        }
      }
    }

    // Если секции найдены, формируем слайды
    if (sections.length > 0) {
      const parts: TheorySlide[] = []

      // Текст до первого заголовка (если есть)
      if (sections[0].lineIndex > 0) {
        const introText = lines.slice(0, sections[0].lineIndex).join('\n').trim()
        if (introText.length > 30) {
          parts.push({
            title: 'Введение',
            content: introText,
          })
        }
      }

      for (let s = 0; s < sections.length; s++) {
        const sec = sections[s]
        const nextSec = sections[s + 1]
        const startLine = sec.lineIndex + 1
        const endLine = nextSec ? nextSec.lineIndex : lines.length

        let content = lines.slice(startLine, endLine).join('\n').trim()

        // Очищаем повтор заголовка в начале текста слайда
        content = content
          .replace(new RegExp(`^#{1,3}\\s*${sec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n?`, 'i'), '')
          .replace(new RegExp(`^\\*\\*${sec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*\\s*\\n?`, 'i'), '')
          .trim()

        parts.push({
          title: sec.title,
          content: content || 'Содержание раздела...',
        })
      }

      if (parts.length > 0) {
        return parts
      }
    }

    return [{
      title: topicTitle,
      content: text,
    }]
  }, [displayTheory, topicTitle])

  // Генерация теории через ИИ
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
      setCurrentSlide(0)
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

  // Если нет теории, показываем интерактивный приветственный экран с кнопкой генерации
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
            Теоретический материал для этой темы еще не сгенерирован. Нажмите кнопку ниже, чтобы ИИ составил структурированный интерактивный конспект с цветными рамками и формулами.
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
        <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 ${theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          <div className="flex items-center gap-2">
            <Info size={14} className="shrink-0" />
            <span>{generationError}</span>
          </div>
          <button
            onClick={() => setGenerationError(null)}
            className="text-[10px] underline opacity-75 hover:opacity-100"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Верхняя панель слайдера: Название, индикаторы и кнопка перегенерации */}
      <div className={`rounded-2xl border ${borderColor} ${bgCard} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md backdrop-blur-md`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-base sm:text-lg font-bold truncate ${textColor}`}>
                {slides[currentSlide].title}
              </h3>
              <span className="shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
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
                    ? 'w-7 h-2 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 h-2 bg-slate-400/30 hover:bg-slate-400/60'
                  }
                `}
                aria-label={`Слайд ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`h-8 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            } disabled:opacity-50 shadow-sm`}
            title="Перегенерировать теорию через ИИ"
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin text-blue-400" /> : <Sparkles size={13} className="text-cyan-400" />}
            <span className="hidden md:inline">{isGenerating ? 'Генерация...' : 'Обновить'}</span>
          </button>
        </div>
      </div>

      {/* Тело слайда */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`rounded-2xl border ${borderColor} ${bgCard} p-5 sm:p-7 shadow-xl flex flex-col backdrop-blur-md transition-all ${
                isFullscreen
                  ? 'min-h-[480px] max-h-[78vh]'
                  : 'min-h-[360px] max-h-[70vh]'
              }`}
            >
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <MarkdownRenderer
                  content={slides[currentSlide].content}
                  className={`${isFullscreen ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} leading-relaxed`}
                />
              </div>

              {/* Нижняя навигация слайда */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className={`flex items-center gap-1.5 font-medium transition-all ${
                    isFullscreen ? 'h-9 px-4 text-xs' : 'h-8 px-3 text-xs'
                  }`}
                >
                  <ChevronLeft size={16} />
                  <span>Назад</span>
                </Button>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="hidden sm:inline opacity-70">Клавиши: [←] [→]</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                  className={`flex items-center gap-1.5 font-medium shadow-md shadow-blue-500/20 transition-all ${
                    isFullscreen ? 'h-9 px-4 text-xs' : 'h-8 px-3 text-xs'
                  }`}
                >
                  <span>Вперед</span>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Миниатюры разделов/слайдов внизу */}
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-1.5 scrollbar-none">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                flex-shrink-0 px-3.5 py-1.5 rounded-xl border text-left transition-all duration-200 shadow-sm
                ${index === currentSlide
                  ? 'border-cyan-400/60 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 font-semibold shadow-cyan-950/20'
                  : `${borderColor} ${theme === 'dark' ? 'bg-white/[0.03] text-slate-400' : 'bg-slate-50 text-slate-600'} hover:border-white/20 hover:text-slate-200`
                }
              `}
            >
              <p className="text-[11px] max-w-[140px] truncate">
                {index + 1}. {slide.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
