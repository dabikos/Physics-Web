import React, { useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { Lightbulb, Zap, Pin, Sparkles, BookOpen, AlertCircle } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

type CalloutKind = 'definition' | 'law' | 'important' | 'meaning' | 'example' | 'generic'

interface CalloutBlock {
  type: 'callout'
  kind: CalloutKind
  badge: string
  title?: string
  lines: string[]
}

interface MathBlock {
  type: 'math-block'
  formula: string
}

interface HeadingBlock {
  type: 'heading'
  level: number
  text: string
}

interface ListBlock {
  type: 'list'
  ordered: boolean
  items: string[]
}

interface ParagraphBlock {
  type: 'paragraph'
  text: string
}

interface DividerBlock {
  type: 'divider'
}

type ParsedBlock =
  | CalloutBlock
  | MathBlock
  | HeadingBlock
  | ListBlock
  | ParagraphBlock
  | DividerBlock

/**
 * Определяет категорию callout блока по тексту первой строки
 */
function detectCalloutKind(firstLine: string): { kind: CalloutKind; badge: string; cleanedText: string } {
  const lower = firstLine.toLowerCase()

  if (lower.includes('определен') || lower.includes('термин')) {
    const cleaned = firstLine.replace(/^(?:>\s*)?(?:\*\*)?(?:определение|термин):?(?:\*\*)?:?\s*/i, '').trim()
    return { kind: 'definition', badge: 'Определение', cleanedText: cleaned }
  }

  if (lower.includes('закон') || lower.includes('правило') || lower.includes('принцип')) {
    const cleaned = firstLine.replace(/^(?:>\s*)?(?:\*\*)?(?:закон(?:\s+[а-яё]+)?|правило|принцип):?(?:\*\*)?:?\s*/i, '').trim()
    return { kind: 'law', badge: 'Физический закон', cleanedText: cleaned }
  }

  if (lower.includes('важно') || lower.includes('запомните') || lower.includes('внимание') || lower.includes('обратите внимание')) {
    const cleaned = firstLine.replace(/^(?:>\s*)?(?:\*\*)?(?:важно(?:[а-яё\s]+)?|запомните|внимание):?(?:\*\*)?:?\s*/i, '').trim()
    return { kind: 'important', badge: 'Важно запомнить', cleanedText: cleaned }
  }

  if (lower.includes('физический смысл') || lower.includes('смысл:')) {
    const cleaned = firstLine.replace(/^(?:>\s*)?(?:\*\*)?(?:физический смысл|смысл):?(?:\*\*)?:?\s*/i, '').trim()
    return { kind: 'meaning', badge: 'Физический смысл', cleanedText: cleaned }
  }

  if (lower.includes('пример') || lower.includes('задача')) {
    const cleaned = firstLine.replace(/^(?:>\s*)?(?:\*\*)?(?:пример(?:\s+\d+)?:?|задача(?:\s+\d+)?:?)(?:\*\*)?:?\s*/i, '').trim()
    return { kind: 'example', badge: 'Пример решения', cleanedText: cleaned }
  }

  const cleaned = firstLine.replace(/^>\s*/, '').trim()
  return { kind: 'generic', badge: 'Ключевой вывод', cleanedText: cleaned }
}

/**
 * Рендерит инлайн-текст: формулы ($...$), жирный шрифт (**...**), курсив (*...*)
 */
function renderInlineElements(rawText: string, theme: string): React.ReactNode {
  if (!rawText) return null

  // 1. Очистка странных символов
  let sanitized = rawText
    .replace(/\(в формате LaTeX\)/gi, '')
    .replace(/\(в формате latex\)/gi, '')
    .replace(/^·\s*/, '')
    .replace(/⇒/g, '→')

  // 2. Извлекаем инлайн формулы
  const segments: Array<{ type: 'text' | 'math'; content: string }> = []
  const mathRegex = /\$([^$\n]+)\$|\\\(([^)]+)\\\)/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = mathRegex.exec(sanitized)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', content: sanitized.slice(lastIdx, match.index) })
    }
    segments.push({ type: 'math', content: (match[1] || match[2] || '').trim() })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < sanitized.length) {
    segments.push({ type: 'text', content: sanitized.slice(lastIdx) })
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content: sanitized })
  }

  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.type === 'math') {
          try {
            return (
              <span
                key={idx}
                className={`inline-flex items-center px-2 py-0.5 mx-1 my-0.5 rounded-lg border text-[0.95em] font-medium align-middle select-all transition-colors ${
                  theme === 'dark'
                    ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-200 shadow-sm shadow-cyan-950/30'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-900 shadow-sm'
                }`}
              >
                <InlineMath math={seg.content} />
              </span>
            )
          } catch {
            return (
              <code key={idx} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-xs font-mono">
                {seg.content}
              </code>
            )
          }
        }

        // Рендерим Markdown стили внутри текста
        let html = seg.content
          .replace(/\*\*([^*]+)\*\*/g, `<strong class="font-bold ${theme === 'dark' ? 'text-cyan-200' : 'text-slate-900'}">$1</strong>`)
          .replace(/\*([^*\n]+)\*/g, '<em class="italic opacity-90">$1</em>')

        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </>
  )
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const { theme } = useTheme()

  const blocks = useMemo<ParsedBlock[]>(() => {
    if (!content) return []

    // Предварительная очистка
    let normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')

    // 1. Извлекаем блочные формулы: $$ ... $$ и \[ ... \]
    const tokens: Array<{ type: 'raw' | 'math'; content: string }> = []
    const blockMathRegex = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = blockMathRegex.exec(normalized)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'raw', content: normalized.slice(lastIndex, match.index) })
      }
      tokens.push({ type: 'math', content: (match[1] || match[2] || '').trim() })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < normalized.length) {
      tokens.push({ type: 'raw', content: normalized.slice(lastIndex) })
    }

    const resultBlocks: ParsedBlock[] = []

    for (const token of tokens) {
      if (token.type === 'math') {
        if (token.content) {
          resultBlocks.push({ type: 'math-block', formula: token.content })
        }
        continue
      }

      // Разбираем сырой текст на строки и группируем в блоки
      const lines = token.content.split('\n')
      let i = 0

      while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()

        if (!trimmed) {
          i++
          continue
        }

        // Разделитель ---
        if (/^---$/.test(trimmed)) {
          resultBlocks.push({ type: 'divider' })
          i++
          continue
        }

        // Блочная цитата (Callout в рамке)
        if (trimmed.startsWith('>')) {
          const calloutLines: string[] = []
          while (i < lines.length && (lines[i].trim().startsWith('>') || (calloutLines.length > 0 && lines[i].trim() && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('- ') && !lines[i].trim().startsWith('* ')))) {
            const rawCalloutLine = lines[i].trim().replace(/^>\s?/, '')
            if (rawCalloutLine) {
              calloutLines.push(rawCalloutLine)
            }
            i++
          }

          if (calloutLines.length > 0) {
            const { kind, badge, cleanedText } = detectCalloutKind(calloutLines[0])
            const restLines = calloutLines.slice(1)
            const finalLines = cleanedText ? [cleanedText, ...restLines] : restLines

            resultBlocks.push({
              type: 'callout',
              kind,
              badge,
              lines: finalLines.length > 0 ? finalLines : [calloutLines[0]],
            })
          }
          continue
        }

        // Заголовки ###, ##, #
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
        if (headingMatch) {
          resultBlocks.push({
            type: 'heading',
            level: headingMatch[1].length,
            text: headingMatch[2].trim(),
          })
          i++
          continue
        }

        // Списки: ненумерованные (- , * , • )
        const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/)
        if (bulletMatch) {
          const listItems: string[] = []
          while (i < lines.length) {
            const curLine = lines[i].trim()
            const bMatch = curLine.match(/^[-*•]\s+(.+)$/)
            if (bMatch) {
              listItems.push(bMatch[1].trim())
              i++
            } else if (curLine.startsWith('  ') && listItems.length > 0) {
              // Продолжение предыдущего пункта
              listItems[listItems.length - 1] += ' ' + curLine.trim()
              i++
            } else {
              break
            }
          }
          resultBlocks.push({
            type: 'list',
            ordered: false,
            items: listItems,
          })
          continue
        }

        // Списки: нумерованные (1. , 2. )
        const orderedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/)
        if (orderedMatch) {
          const listItems: string[] = []
          while (i < lines.length) {
            const curLine = lines[i].trim()
            const oMatch = curLine.match(/^(\d+)[\.\)]\s+(.+)$/)
            if (oMatch) {
              listItems.push(oMatch[2].trim())
              i++
            } else if (curLine.startsWith('  ') && listItems.length > 0) {
              listItems[listItems.length - 1] += ' ' + curLine.trim()
              i++
            } else {
              break
            }
          }
          resultBlocks.push({
            type: 'list',
            ordered: true,
            items: listItems,
          })
          continue
        }

        // Обычный параграф текста
        const paragraphLines: string[] = [trimmed]
        i++
        while (
          i < lines.length &&
          lines[i].trim() &&
          !lines[i].trim().startsWith('#') &&
          !lines[i].trim().startsWith('>') &&
          !lines[i].trim().startsWith('- ') &&
          !lines[i].trim().startsWith('* ') &&
          !lines[i].trim().startsWith('• ') &&
          !/^\d+[\.\)]\s/.test(lines[i].trim()) &&
          !lines[i].trim().startsWith('---')
        ) {
          paragraphLines.push(lines[i].trim())
          i++
        }

        resultBlocks.push({
          type: 'paragraph',
          text: paragraphLines.join(' '),
        })
      }
    }

    return resultBlocks
  }, [content])

  const textColor = theme === 'dark' ? 'text-slate-100' : 'text-slate-900'

  return (
    <div className={`markdown-content space-y-2.5 ${className} ${textColor}`}>
      {blocks.map((block, index) => {
        // 1. Блочная формула в цветной полупрозрачной карточке
        if (block.type === 'math-block') {
          return (
            <div
              key={index}
              className={`my-3 p-3.5 sm:p-5 rounded-2xl border backdrop-blur-md shadow-lg text-center relative overflow-hidden transition-all group ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border-cyan-400/30 shadow-cyan-950/30 text-cyan-200'
                  : 'bg-gradient-to-r from-cyan-50/90 via-blue-50/80 to-indigo-50/90 border-cyan-300 shadow-blue-900/5 text-cyan-950'
              }`}
            >
              {/* Верхняя панель карточки формулы */}
              <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-cyan-500/20 px-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 dark:text-cyan-300 text-[10px] font-semibold tracking-wider uppercase">
                  <Sparkles size={11} className="text-cyan-400" />
                  <span>Формула</span>
                </div>
                <span className="text-[10px] text-cyan-400/60 font-mono hidden sm:inline">
                  LaTeX Math
                </span>
              </div>

              {/* Само отображение формулы */}
              <div className="py-1.5 text-lg sm:text-2xl font-medium tracking-wide overflow-x-auto custom-scrollbar flex items-center justify-center min-h-[40px]">
                <BlockMath math={block.formula} />
              </div>
            </div>
          )
        }

        // 2. Callout блок ("Главное в стильной рамке")
        if (block.type === 'callout') {
          let badgeBg = ''
          let borderStyle = ''
          let bgGradient = ''
          let IconComponent = Lightbulb
          let iconColor = ''

          switch (block.kind) {
            case 'definition':
              IconComponent = Lightbulb
              iconColor = 'text-cyan-400'
              badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              borderStyle = 'border-l-4 border-l-cyan-400 border-cyan-500/25'
              bgGradient = theme === 'dark'
                ? 'bg-gradient-to-r from-cyan-950/50 via-blue-950/20 to-transparent'
                : 'bg-gradient-to-r from-cyan-50 via-blue-50/40 to-transparent'
              break

            case 'law':
              IconComponent = Zap
              iconColor = 'text-indigo-400'
              badgeBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              borderStyle = 'border-l-4 border-l-indigo-400 border-indigo-500/25'
              bgGradient = theme === 'dark'
                ? 'bg-gradient-to-r from-indigo-950/50 via-purple-950/20 to-transparent'
                : 'bg-gradient-to-r from-indigo-50 via-purple-50/40 to-transparent'
              break

            case 'important':
              IconComponent = Pin
              iconColor = 'text-amber-400'
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              borderStyle = 'border-l-4 border-l-amber-400 border-amber-500/25'
              bgGradient = theme === 'dark'
                ? 'bg-gradient-to-r from-amber-950/50 via-orange-950/20 to-transparent'
                : 'bg-gradient-to-r from-amber-50 via-orange-50/40 to-transparent'
              break

            case 'meaning':
              IconComponent = Sparkles
              iconColor = 'text-emerald-400'
              badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              borderStyle = 'border-l-4 border-l-emerald-400 border-emerald-500/25'
              bgGradient = theme === 'dark'
                ? 'bg-gradient-to-r from-emerald-950/50 via-teal-950/20 to-transparent'
                : 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-transparent'
              break

            case 'example':
              IconComponent = BookOpen
              iconColor = 'text-blue-400'
              badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              borderStyle = 'border-l-4 border-l-blue-400 border-blue-500/25'
              bgGradient = theme === 'dark'
                ? 'bg-gradient-to-r from-blue-950/50 via-sky-950/20 to-transparent'
                : 'bg-gradient-to-r from-blue-50 via-sky-50/40 to-transparent'
              break

            default:
              IconComponent = Lightbulb
              iconColor = 'text-sky-400'
              badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              borderStyle = 'border-l-4 border-l-sky-400 border-sky-500/25'
              bgGradient = theme === 'dark'
                ? 'bg-gradient-to-r from-blue-950/40 to-transparent'
                : 'bg-gradient-to-r from-slate-50 to-transparent'
              break
          }

          return (
            <div
              key={index}
              className={`rounded-2xl border p-4 sm:p-5 my-4 backdrop-blur-md shadow-md transition-all ${borderStyle} ${bgGradient}`}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <IconComponent size={17} className={`${iconColor} shrink-0`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                  {block.badge}
                </span>
              </div>
              <div className="space-y-1.5 text-sm sm:text-base leading-relaxed pl-1">
                {block.lines.map((line, lIdx) => (
                  <p key={lIdx} className="leading-relaxed">
                    {renderInlineElements(line, theme)}
                  </p>
                ))}
              </div>
            </div>
          )
        }

        // 3. Заголовки (h1 - h4)
        if (block.type === 'heading') {
          if (block.level <= 2) {
            return (
              <h2
                key={index}
                className="text-lg sm:text-xl font-bold mt-5 mb-2.5 flex items-center gap-2.5 pb-1 border-b border-white/10"
              >
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-blue-400 to-cyan-400 inline-block" />
                <span>{renderInlineElements(block.text, theme)}</span>
              </h2>
            )
          }

          return (
            <h3
              key={index}
              className="text-base sm:text-lg font-semibold mt-4 mb-2 text-cyan-300 dark:text-cyan-300"
            >
              {renderInlineElements(block.text, theme)}
            </h3>
          )
        }

        // 4. Списки (ненумерованные и нумерованные)
        if (block.type === 'list') {
          if (block.ordered) {
            return (
              <ol key={index} className="my-3 space-y-2 text-left">
                {block.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base leading-relaxed">
                    <span className="shrink-0 w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 pt-0.5">
                      {renderInlineElements(item, theme)}
                    </div>
                  </li>
                ))}
              </ol>
            )
          }

          return (
            <ul key={index} className="my-3 space-y-2 text-left">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm sm:text-base leading-relaxed">
                  <span className="shrink-0 w-2 h-2 rounded-full bg-cyan-400 mt-2.5 shadow-sm shadow-cyan-400/60" />
                  <div className="flex-1">
                    {renderInlineElements(item, theme)}
                  </div>
                </li>
              ))}
            </ul>
          )
        }

        // 5. Разделитель
        if (block.type === 'divider') {
          return <hr key={index} className="my-5 border-t border-white/10" />
        }

        // 6. Обычный параграф
        return (
          <p key={index} className="leading-relaxed text-sm sm:text-base mb-2.5">
            {renderInlineElements(block.text, theme)}
          </p>
        )
      })}
    </div>
  )
}
