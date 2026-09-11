import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { useLesson } from '@/contexts/LessonContext'
import { motion } from 'framer-motion'
import { generateText } from '@/lib/githubAI'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { 
  Lightbulb, 
  LifeBuoy, 
  AlertTriangle, 
  MessageSquareQuote,
  Sparkles,
  Send,
  Bot
} from 'lucide-react'

const aiActions = [
  {
    id: 'simplify',
    title: 'Объясни проще',
    description: 'Упростите сложную тему для лучшего понимания',
    icon: <Lightbulb size={24} />,
    color: 'from-amber-500 to-orange-500',
    prompt: 'Объясни эту тему проще и понятнее для учеников',
  },
  {
    id: 'example',
    title: 'Пример из жизни',
    description: 'Покажите связь физики с реальным миром',
    icon: <LifeBuoy size={24} />,
    color: 'from-blue-500 to-cyan-500',
    prompt: 'Приведи пример из реальной жизни для этой темы',
  },
  {
    id: 'mistake',
    title: 'Типичная ошибка',
    description: 'Покажите типичные ошибки и как их избежать',
    icon: <AlertTriangle size={24} />,
    color: 'from-red-500 to-pink-500',
    prompt: 'Какие типичные ошибки делают ученики в этой теме?',
  },
  {
    id: 'question',
    title: 'Вопрос классу',
    description: 'Сгенерируйте вопрос для проверки понимания',
    icon: <MessageSquareQuote size={24} />,
    color: 'from-purple-500 to-violet-500',
    prompt: 'Придумай вопрос для проверки понимания этой темы',
  },
]

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export function AIPage() {
  const { theme } = useTheme()
  const { selectedTopics } = useLesson()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Здравствуйте! Я ваш AI-ассистент. Чем могу помочь с уроком?',
      isUser: false,
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topicMode, setTopicMode] = useState<'lesson' | 'custom' | 'none'>('lesson')
  const [customTopic, setCustomTopic] = useState('')

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/50' : 'text-slate-600'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const buildPrompt = (historyMessages: Message[]) => {
    let topicContext = 'Тема не задана.'
    if (topicMode === 'lesson') {
      topicContext = selectedTopics.length
        ? `Текущая тема урока: ${selectedTopics.map(t => t.title).join(', ')}.`
        : 'Тема урока не выбрана.'
    } else if (topicMode === 'custom') {
      topicContext = customTopic.trim()
        ? `Текущая тема: ${customTopic.trim()}.`
        : 'Тема не задана.'
    }
    const header = [
      'Ты — дружелюбный AI-ассистент учителя физики.',
      'Отвечай по-русски, кратко и понятно, можно списками.',
      'Если нужно, используй LaTeX для формул (оборачивай в $...$ или \\(...\\)).',
      topicContext,
      'Ниже диалог:'
    ].join('\n')

    const history = historyMessages
      .slice(-8)
      .map(msg => `${msg.isUser ? 'Учитель' : 'AI'}: ${msg.text}`)
      .join('\n')

    return `${header}\n${history}\nAI:`
  }

  const handleShortcutClick = (prompt: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      isUser: true,
      timestamp: new Date(),
    }
    const nextMessages = [...messages, newMessage]
    setMessages(nextMessages)
    setInputValue('')
    setError(null)
    handleGenerateResponse(nextMessages)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }
    const nextMessages = [...messages, newMessage]
    setMessages(nextMessages)
    setInputValue('')
    setError(null)

    await handleGenerateResponse(nextMessages)
  }

  const handleGenerateResponse = async (historyMessages: Message[]) => {
    setIsLoading(true)
    try {
      const reply = await generateText({
        prompt: buildPrompt(historyMessages),
        maxTokens: 1200,
        temperature: 0.6
      })

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: reply.trim(),
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
    } catch (err: any) {
      setError(err?.message || 'Не удалось получить ответ от AI')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 pb-4 pt-16 lg:px-8">
      <div className="max-w-[1500px] mx-auto h-[calc(100vh-5rem)] flex flex-col">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className={`text-xl lg:text-2xl font-bold ${textColor} leading-tight`}>
                ИИ-Тьютор учителя
              </h1>
              <p className={`${textMuted} text-xs`}>
                Генерация объяснений, примеров и контрольных вопросов
              </p>
            </div>
          </div>

          {/* Context selector inline */}
          <div className="flex items-center gap-2">
            <span className={`${textMuted} text-xs font-medium`}>Контекст:</span>
            <select
              value={topicMode}
              onChange={(event) => setTopicMode(event.target.value as 'lesson' | 'custom' | 'none')}
              className={`h-8 px-2.5 rounded-lg text-xs font-medium border ${
                theme === 'dark' ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
              } dark:[color-scheme:dark]`}
            >
              <option value="lesson">Тема урока</option>
              <option value="custom">Своя тема</option>
              <option value="none">Без темы</option>
            </select>
            {topicMode === 'custom' && (
              <input
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
                placeholder="Введите тему..."
                className={`h-8 min-w-[180px] px-2.5 text-xs rounded-lg border ${
                  theme === 'dark' ? 'bg-white/5 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
                }`}
              />
            )}
            {topicMode === 'lesson' && selectedTopics.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-500/15 text-primary-300 border border-primary-500/30 truncate max-w-[200px]">
                {selectedTopics.map(t => t.title).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Main Content: Split Layout */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left Panel - Shortcuts */}
          <aside className="w-72 lg:w-80 flex-shrink-0 flex flex-col">
            <Card className={`h-full ${bgCard} ${borderColor} flex flex-col overflow-hidden`}>
              <div className="p-3.5 border-b border-white/10 shrink-0">
                <h2 className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>
                  Быстрые сценарии
                </h2>
                <p className={`${textMuted} text-[11px] mt-0.5`}>
                  Нажмите на карточку для мгновенного запроса
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {aiActions.map((action) => (
                  <div
                    key={action.id}
                    onClick={() => handleShortcutClick(action.prompt)}
                    className={`
                      p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-2.5
                      ${theme === 'dark'
                        ? 'bg-white/[0.03] border-white/10 hover:border-primary-500/40 hover:bg-white/[0.07]'
                        : 'bg-white border-slate-200 hover:border-primary-400 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg bg-gradient-to-br ${action.color}
                      flex items-center justify-center text-white shrink-0 shadow-sm
                    `}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold ${textColor} leading-tight mb-0.5`}>
                        {action.title}
                      </h3>
                      <p className={`${textMuted} text-[11px] line-clamp-2 leading-relaxed`}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </aside>

          {/* Right Panel - Chat */}
          <main className="flex-1 flex flex-col min-w-0">
            <Card className={`flex-1 flex flex-col ${bgCard} ${borderColor} overflow-hidden`}>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2.5 max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`
                        w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                        ${message.isUser 
                          ? 'bg-gradient-to-br from-primary-500 to-accent-500' 
                          : 'bg-slate-700'
                        }
                      `}>
                        {message.isUser ? (
                          <span className="text-white text-xs font-bold">У</span>
                        ) : (
                          <Bot size={14} className="text-white" />
                        )}
                      </div>
                      <div className={`
                        rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed
                        ${message.isUser 
                          ? `bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md shadow-primary-500/15` 
                          : `${theme === 'dark' ? 'bg-white/10 text-slate-100' : 'bg-slate-100 text-slate-800'}`
                        }
                      `}>
                        <MarkdownRenderer content={message.text} className="text-xs leading-relaxed" />
                        <span className={`text-[10px] mt-1 block ${message.isUser ? 'text-white/70' : textMuted}`}>
                          {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl px-3.5 py-2 text-xs flex items-center gap-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'} ${textColor}`}>
                      <Sparkles size={13} className="animate-spin text-primary-400" />
                      <span>ИИ готовит ответ...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className={`p-3 border-t ${borderColor} shrink-0 bg-black/10`}>
                {error && (
                  <div className="mb-2 text-xs text-rose-400">{error}</div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Задайте любой вопрос или выберите сценарий слева..."
                    className={`
                      flex-1 h-10 px-3.5 rounded-xl text-xs
                      ${theme === 'dark' ? 'bg-white/5 text-white placeholder-white/40 border border-white/10' : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300'}
                      focus:outline-none focus:ring-2 focus:ring-primary-500
                    `}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="h-10 px-3.5 rounded-xl shrink-0 gap-1.5 shadow-md shadow-primary-500/20"
                  >
                    <Send size={14} />
                    <span className="hidden sm:inline text-xs">Отправить</span>
                  </Button>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
