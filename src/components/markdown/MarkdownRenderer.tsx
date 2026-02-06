import { useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface ContentPart {
  type: 'text' | 'block-math' | 'inline-math'
  content: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const { theme } = useTheme()

  // Разбиваем контент на части: текст и формулы
  const parts = useMemo(() => {
    if (!content) return []

    const result: ContentPart[] = []
    let text = content
    let lastIndex = 0

    // Ищем все формулы и их позиции
    const allMatches: Array<{ start: number; end: number; formula: string; type: 'block-math' | 'inline-math' }> = []

    // Блочные формулы \[ ... \]
    const blockFormulaRegex = /\\\[([^\]]+)\\\]/gs
    let match
    while ((match = blockFormulaRegex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        formula: match[1].trim(),
        type: 'block-math'
      })
    }

    // Инлайн формулы \( ... \) и $ ... $
    const inlineFormulaRegex = /\\\(([^)]+)\\\)|\$([^$\n]+)\$/g
    while ((match = inlineFormulaRegex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        formula: (match[1] || match[2] || '').trim(),
        type: 'inline-math'
      })
    }

    // Сортируем по позиции
    allMatches.sort((a, b) => a.start - b.start)

    // Разбиваем текст на части
    let currentIndex = 0
    for (const mathMatch of allMatches) {
      // Добавляем текст до формулы
      if (mathMatch.start > currentIndex) {
        const textPart = text.substring(currentIndex, mathMatch.start)
        if (textPart) {
          result.push({ type: 'text', content: textPart })
        }
      }
      
      // Добавляем формулу
      if (mathMatch.formula) {
        result.push({ type: mathMatch.type, content: mathMatch.formula })
      }
      currentIndex = mathMatch.end
    }

    // Добавляем оставшийся текст
    if (currentIndex < text.length) {
      const textPart = text.substring(currentIndex)
      if (textPart) {
        result.push({ type: 'text', content: textPart })
      }
    }

    // Если нет формул, возвращаем весь текст
    if (result.length === 0) {
      result.push({ type: 'text', content: text })
    }

    return result
  }, [content])

  // Обрабатываем текстовые части (markdown)
  const processText = (text: string): string => {
    let processed = text

    // Заголовки
    processed = processed.replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>')
    processed = processed.replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>')
    processed = processed.replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>')

    // Жирный текст
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="markdown-bold">$1</strong>')

    // Курсив
    processed = processed.replace(/\*([^*\n]+)\*/g, (match, content) => {
      if (match.includes('\\')) return match
      return `<em class="markdown-italic">${content}</em>`
    })

    // Горизонтальная линия
    processed = processed.replace(/^---$/gim, '<hr class="markdown-hr" />')

    // Параграфы
    const paragraphs = processed.split(/\n\n+/)
    processed = paragraphs
      .map(p => {
        const trimmed = p.trim()
        if (!trimmed) return ''
        if (trimmed.startsWith('<h') || trimmed.startsWith('<hr')) {
          return trimmed
        }
        return `<p class="markdown-p">${trimmed}</p>`
      })
      .join('')

    // Переносы строк
    processed = processed.replace(/(?<!<br \/>)\n(?!<)/g, '<br />')

    return processed
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'

  return (
    <div className={`markdown-content ${className} ${textColor}`}>
      {parts.map((part, index) => {
        if (part.type === 'block-math') {
          try {
            return (
              <div key={index} className="latex-block my-4">
                <BlockMath math={part.content} />
              </div>
            )
          } catch (error) {
            return (
              <div key={index} className="latex-block my-4 text-red-300 text-sm">
                {part.content}
              </div>
            )
          }
        } else if (part.type === 'inline-math') {
          try {
            return (
              <span key={index} className="latex-inline mx-1">
                <InlineMath math={part.content} />
              </span>
            )
          } catch (error) {
            return (
              <span key={index} className="latex-inline mx-1 text-red-300 text-sm">
                {part.content}
              </span>
            )
          }
        } else {
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: processText(part.content) }}
            />
          )
        }
      })}
    </div>
  )
}
