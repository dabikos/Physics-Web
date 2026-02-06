import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { FormulaDisplay } from '@/components/markdown/FormulaDisplay'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { generateFormulaExplanation } from '@/lib/githubAI'

interface FormulaModalProps {
  isOpen: boolean
  onClose: () => void
  formula: string
  topicTitle: string
  formulaIndex: number
  containerRef?: React.RefObject<HTMLElement>
}

export function FormulaModal({ isOpen, onClose, formula, topicTitle, formulaIndex, containerRef }: FormulaModalProps) {
  const { theme } = useTheme()
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bgOverlay = theme === 'dark' ? 'bg-black/80' : 'bg-black/60'
  const bgModal = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
    : 'bg-gradient-to-br from-white via-slate-50 to-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'

  useEffect(() => {
    if (isOpen && !explanation && !isGenerating) {
      generateExplanation()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const generateExplanation = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const result = await generateFormulaExplanation(formula, topicTitle)
      setExplanation(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации объяснения')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  // Определяем контейнер для рендеринга и стиль позиционирования
  const fullscreenElement = document.fullscreenElement || 
                             (document as any).webkitFullscreenElement || 
                             (document as any).mozFullScreenElement || 
                             (document as any).msFullscreenElement

  const isInFullscreen = !!fullscreenElement

  // Если в полноэкранном режиме, используем absolute и рендерим в полноэкранный элемент
  // Иначе используем fixed и рендерим в body
  const getPortalTarget = (): HTMLElement => {
    if (isInFullscreen) {
      return fullscreenElement as HTMLElement
    }
    
    if (containerRef?.current) {
      return containerRef.current
    }
    
    return document.body
  }

  const portalTarget = getPortalTarget()

  // Обновляем стиль позиционирования в зависимости от режима
  const positionStyle = isInFullscreen 
    ? { position: 'absolute' as const, zIndex: 99999 }
    : { position: 'fixed' as const, zIndex: 99999 }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`inset-0 ${bgOverlay} flex items-center justify-center p-4`}
        style={{ 
          ...positionStyle,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className={`${bgModal} ${borderColor} border-2 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
            <div>
              <h2 className={`text-2xl font-bold ${textColor} mb-1`}>
                Формула {formulaIndex + 1}
              </h2>
              <p className={`${textMuted} text-sm`}>{topicTitle}</p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} transition-colors`}
            >
              <X size={24} className={textColor} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Formula */}
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} border ${borderColor}`}>
              <h3 className={`text-lg font-semibold ${textColor} mb-4`}>Формула:</h3>
              <div className="flex justify-center items-center min-h-[120px]">
                <FormulaDisplay 
                  formula={formula} 
                  className={`${textColor} text-3xl`} 
                  displayMode={true} 
                />
              </div>
            </div>

            {/* Explanation */}
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} border ${borderColor}`}>
              <h3 className={`text-lg font-semibold ${textColor} mb-4`}>Объяснение:</h3>
              {isGenerating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-emerald-500" size={32} />
                  <span className={`ml-3 ${textMuted}`}>Генерация объяснения...</span>
                </div>
              ) : error ? (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} border ${theme === 'dark' ? 'border-red-800' : 'border-red-200'}`}>
                  <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                    {error}
                  </p>
                  <button
                    onClick={generateExplanation}
                    className={`mt-3 px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white transition-colors`}
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : explanation ? (
                <div className={`${textColor} prose prose-invert max-w-none`}>
                  <MarkdownRenderer content={explanation} />
                </div>
              ) : (
                <p className={textMuted}>Нажмите кнопку для генерации объяснения</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t ${borderColor} flex justify-end`}>
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} ${textColor} transition-colors font-medium`}
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modalContent, portalTarget)
}

