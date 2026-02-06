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
    <div className="min-h-screen px-6 pb-6 pt-24 lg:px-8 lg:pb-8 lg:pt-28">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <h1 className={`text-4xl lg:text-5xl font-bold ${textColor}`}>
                AI Ассистент
              </h1>
            </div>
          </div>
          <p className={`${textMuted} text-lg ml-[72px]`}>
            Интеллектуальная помощь для проведения урока
          </p>
        </div>

        {/* Topic Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className={`${textMuted} text-sm`}>Контекст:</label>
            <select
              value={topicMode}
              onChange={(event) => setTopicMode(event.target.value as 'lesson' | 'custom' | 'none')}
              className={`px-3 py-2 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'} dark:[color-scheme:dark]`}
            >
              <option value="lesson" className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Тема урока</option>
              <option value="custom" className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Своя тема</option>
              <option value="none" className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Без темы</option>
            </select>
            {topicMode === 'custom' && (
              <input
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
                placeholder="Введите тему..."
                className={`min-w-[240px] px-3 py-2 rounded-xl border ${theme === 'dark' ? 'bg-white/10 text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'}`}
              />
            )}
            {topicMode === 'lesson' && selectedTopics.length > 0 && (
              <div className={`${textMuted} text-sm`}>
                {selectedTopics.map(t => t.title).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Split Layout */}
        <div className="flex gap-6 h-[calc(100%-8rem)]">
          {/* Left Panel - Shortcuts */}
          <aside className="w-80 lg:w-96 flex-shrink-0">
            <Card className={`h-full ${bgCard} ${borderColor} flex flex-col`}>
              <div className="p-6 border-b border-white/10">
                <h2 className={`text-xl font-bold ${textColor} mb-2`}>
                  Быстрые действия
                </h2>
                <p className={textMuted + ' text-sm'}>
                  Нажмите кнопку или напишите вопрос вручную
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {aiActions.map((action) => (
                  <motion.div
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      hover
                      className={`p-4 cursor-pointer ${bgCard} ${borderColor}`}
                      onClick={() => handleShortcutClick(action.prompt)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`
                          w-12 h-12 rounded-xl bg-gradient-to-br ${action.color}
                          flex items-center justify-center text-white shrink-0
                        `}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-base font-semibold ${textColor} mb-1`}>
                            {action.title}
                          </h3>
                          <p className={`${textMuted} text-sm`}>
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </Card>
          </aside>

          {/* Right Panel - Chat */}
          <main className="flex-1 flex flex-col">
            <Card className={`flex-1 flex flex-col ${bgCard} ${borderColor} overflow-hidden`}>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center shrink-0
                        ${message.isUser 
                          ? 'bg-gradient-to-br from-primary-500 to-accent-500' 
                          : 'bg-gradient-to-br from-slate-600 to-slate-700'
                        }
                      `}>
                        {message.isUser ? (
                          <span className="text-white text-sm font-semibold">У</span>
                        ) : (
                          <Bot size={16} className="text-white" />
                        )}
                      </div>
                      <div className={`
                        rounded-2xl px-4 py-3
                        ${message.isUser 
                          ? `bg-gradient-to-br from-primary-500 to-accent-500 text-white` 
                          : `${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'} ${textColor}`
                        }
                      `}>
                        <MarkdownRenderer content={message.text} className="text-sm leading-relaxed" />
                        <span className={`text-xs mt-1 block ${message.isUser ? 'text-white/70' : textMuted}`}>
                          {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl px-4 py-3 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'} ${textColor}`}>
                      Печатает...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className={`p-6 border-t ${borderColor}`}>
                {error && (
                  <div className="mb-3 text-sm text-red-400">{error}</div>
                )}
                <div className="flex items-end gap-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Напишите вопрос..."
                    className={`
                      flex-1 min-h-[60px] max-h-[120px] px-4 py-3 rounded-xl
                      ${theme === 'dark' ? 'bg-white/10 text-white placeholder-white/40' : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-200'}
                      focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none
                    `}
                    rows={2}
                  />
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="shrink-0"
                  >
                    <Send size={20} />
                  </Button>
                </div>
                <p className={`${textMuted} text-xs mt-2`}>
                  Стиль: спокойный, деловой. Ответы короткие, структурированные.
                </p>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
