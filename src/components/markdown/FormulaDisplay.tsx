import { useMemo, useEffect, useRef } from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface FormulaDisplayProps {
  formula: string
  className?: string
  displayMode?: boolean
}

export function FormulaDisplay({ formula, className = '', displayMode = false }: FormulaDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const katexRef = useRef<HTMLSpanElement>(null)

  // Очищаем формулу от лишних символов и обёрток
  const cleanedFormula = useMemo(() => {
    if (!formula) return ''

    let cleaned = formula.trim()

    // Убираем LaTeX обёртки если есть
    cleaned = cleaned.replace(/^\\\(|\\\)$/g, '')
    cleaned = cleaned.replace(/^\\\[|\\\]$/g, '')
    cleaned = cleaned.replace(/^\$|\$$/g, '')

    // Убираем лишние пробелы
    cleaned = cleaned.trim()

    return cleaned
  }, [formula])

  // Автоматическое масштабирование длинных формул
  useEffect(() => {
    if (!displayMode || !containerRef.current || !katexRef.current) return

    const container = containerRef.current

    const resizeFormula = () => {
      // Ждем рендеринга KaTeX
      setTimeout(() => {
        const katexElement = katexRef.current?.querySelector('.katex-display') || katexRef.current?.querySelector('.katex')

        if (!katexElement || !container) return

        const containerWidth = container.offsetWidth
        const formulaWidth = (katexElement as HTMLElement).scrollWidth || (katexElement as HTMLElement).offsetWidth

          // Убираем предыдущий transform для правильного измерения
          ; (katexElement as HTMLElement).style.transform = ''
          ; (katexElement as HTMLElement).style.maxWidth = 'none'

        // Пересчитываем после сброса transform
        const actualWidth = (katexElement as HTMLElement).scrollWidth || (katexElement as HTMLElement).offsetWidth

        if (actualWidth > containerWidth && containerWidth > 0) {
          const padding = 40 // Отступы
          const scale = Math.min((containerWidth - padding) / actualWidth, 1)
          if (scale < 1 && scale > 0.25) {
            ; (katexElement as HTMLElement).style.transform = `scale(${scale})`
              ; (katexElement as HTMLElement).style.transformOrigin = 'center'
          } else {
            ; (katexElement as HTMLElement).style.transform = ''
          }
        } else {
          ; (katexElement as HTMLElement).style.transform = ''
        }

        // Устанавливаем max-width для предотвращения переполнения
        ; (katexElement as HTMLElement).style.maxWidth = '100%'
      }, 200)
    }

    // Первоначальная проверка с задержкой для полного рендеринга
    const initialTimeout = setTimeout(resizeFormula, 300)

    // Используем ResizeObserver для отслеживания изменений размера
    const resizeObserver = new ResizeObserver(() => {
      resizeFormula()
    })
    resizeObserver.observe(container)

    // Ресайз при изменении размера окна
    window.addEventListener('resize', resizeFormula)

    return () => {
      clearTimeout(initialTimeout)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resizeFormula)
    }
  }, [cleanedFormula, displayMode])

  if (!cleanedFormula) {
    return null
  }

  try {
    return (
      <div
        ref={containerRef}
        className={`formula-display ${className} ${displayMode ? 'w-full' : 'inline-block'}`}
      >
        <span ref={katexRef}>
          {displayMode ? (
            <BlockMath math={cleanedFormula} />
          ) : (
            <InlineMath math={cleanedFormula} />
          )}
        </span>
      </div>
    )
  } catch (error) {
    // Если KaTeX не может обработать формулу, показываем как есть
    console.warn('Ошибка рендеринга LaTeX:', error, 'Формула:', cleanedFormula)
    return (
      <div className={`formula-display font-mono text-lg ${className}`}>
        {formula}
      </div>
    )
  }
}

