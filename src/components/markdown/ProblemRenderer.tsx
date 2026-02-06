import { useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { MarkdownRenderer } from './MarkdownRenderer'

interface ProblemRendererProps {
  problem: string
  className?: string
}

export function ProblemRenderer({ problem, className = '' }: ProblemRendererProps) {
  const { theme } = useTheme()

  const problemParts = useMemo(() => {
    if (!problem) return null

    // Разбиваем задачу на части: Условие, Решение, Ответ
    const parts: { type: 'condition' | 'solution' | 'answer' | 'other'; content: string }[] = []
    
    const lines = problem.split('\n')
    let currentType: 'condition' | 'solution' | 'answer' | 'other' = 'other'
    let currentContent: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      
      // Определяем тип раздела
      if (trimmed.match(/^[*#]*\s*Условие[:\s]/i) || trimmed.match(/^[*#]*\s*Задача\s*\d+/i)) {
        if (currentContent.length > 0) {
          parts.push({ type: currentType, content: currentContent.join('\n') })
          currentContent = []
        }
        currentType = 'condition'
        // Убираем заголовок из контента
        const content = trimmed.replace(/^[*#]*\s*(Условие[:\s]|Задача\s*\d+[:\s])/i, '').trim()
        if (content) currentContent.push(content)
      } else if (trimmed.match(/^[*#]*\s*Решение[:\s]/i)) {
        if (currentContent.length > 0) {
          parts.push({ type: currentType, content: currentContent.join('\n') })
          currentContent = []
        }
        currentType = 'solution'
        const content = trimmed.replace(/^[*#]*\s*Решение[:\s]/i, '').trim()
        if (content) currentContent.push(content)
      } else if (trimmed.match(/^[*#]*\s*Ответ[:\s]/i)) {
        if (currentContent.length > 0) {
          parts.push({ type: currentType, content: currentContent.join('\n') })
          currentContent = []
        }
        currentType = 'answer'
        const content = trimmed.replace(/^[*#]*\s*Ответ[:\s]/i, '').trim()
        if (content) currentContent.push(content)
      } else if (trimmed === '---' || trimmed === '') {
        // Пропускаем разделители и пустые строки
        if (currentContent.length > 0) {
          currentContent.push('')
        }
      } else {
        currentContent.push(line)
      }
    }

    // Добавляем последнюю часть
    if (currentContent.length > 0) {
      parts.push({ type: currentType, content: currentContent.join('\n') })
    }

    // Если не нашли структурированные части, возвращаем весь текст как условие
    if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'other')) {
      return [{ type: 'other' as const, content: problem }]
    }

    return parts
  }, [problem])

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/70' : 'text-slate-600'
  const bgCondition = theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
  const bgSolution = theme === 'dark' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
  const bgAnswer = theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'

  if (!problemParts || problemParts.length === 0) {
    return (
      <div className={className}>
        <MarkdownRenderer content={problem} />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {problemParts.map((part, index) => {
        if (part.type === 'condition') {
          return (
            <div key={index} className={`p-4 rounded-lg border ${bgCondition}`}>
              <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                Условие:
              </h4>
              <MarkdownRenderer content={part.content} className={textColor} />
            </div>
          )
        } else if (part.type === 'solution') {
          return (
            <div key={index} className={`p-4 rounded-lg border ${bgSolution}`}>
              <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                Решение:
              </h4>
              <MarkdownRenderer content={part.content} className={textColor} />
            </div>
          )
        } else if (part.type === 'answer') {
          return (
            <div key={index} className={`p-4 rounded-lg border ${bgAnswer}`}>
              <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                Ответ:
              </h4>
              <MarkdownRenderer content={part.content} className={textColor} />
            </div>
          )
        } else {
          return (
            <div key={index}>
              <MarkdownRenderer content={part.content} className={textColor} />
            </div>
          )
        }
      })}
    </div>
  )
}





