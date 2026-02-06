import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  Monitor,
  Volume2,
  Palette,
  Bell,
  User,
  Info,
  Moon,
  Sun,
} from 'lucide-react'
import { motion } from 'framer-motion'

const settingsSections = [
  {
    id: 'display',
    title: 'Отображение',
    icon: <Monitor size={24} />,
    items: [
      { label: 'Размер шрифта', value: 'Крупный' },
      { label: 'Яркость экрана', value: '100%' },
      { label: 'Режим проекта', value: 'Включён' },
    ],
  },
  {
    id: 'sound',
    title: 'Звук',
    icon: <Volume2 size={24} />,
    items: [
      { label: 'Громкость', value: '80%' },
      { label: 'Звуковые эффекты', value: 'Включены' },
    ],
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    icon: <Bell size={24} />,
    items: [
      { label: 'Напоминания', value: 'Включены' },
      { label: 'Звук уведомлений', value: 'Включён' },
    ],
  },
]

const roleLabel = (role?: string) => {
  if (role === 'teacher') return 'Учитель'
  if (role === 'student') return 'Ученик'
  return '—'
}

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/50' : 'text-slate-600'
  const textMuted70 = theme === 'dark' ? 'text-white/70' : 'text-slate-700'
  const bgCard = theme === 'dark' ? 'bg-white/5' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const iconBg = theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'
  const iconColor = theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
  const valueBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'

  const teacherName = user?.name || 'Учитель'
  const teacherEmail = user?.email || '—'
  const teacherId = user?.id || '—'
  const teacherClass = user?.class_id || 'Не назначен'
  const teacherRole = roleLabel(user?.role)
  const initials = (teacherName || teacherEmail || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen px-6 pb-6 pt-24 lg:px-8 lg:pb-8 lg:pt-28">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <h1 className={`text-4xl lg:text-5xl font-bold ${textColor} mb-3`}>
            {'Настройки'}
          </h1>
          <p className={`${textMuted} text-xl`}>
            {'Настройте интерфейс под свои предпочтения'}
          </p>
        </div>

        <Card className={`mb-8 ${bgCard} ${borderColor}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                <User size={24} />
              </div>
              <h3 className={`text-xl font-bold ${textColor}`}>
                {'Профиль учителя'}
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold">
                {initials || 'U'}
              </div>
              <div className="flex-1 min-w-[220px]">
                <div className={`text-2xl font-bold ${textColor} mb-1`}>{teacherName}</div>
                <div className={textMuted}>{teacherEmail}</div>
              </div>
              <Button variant="secondary">{'Редактировать'}</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className={`rounded-xl p-4 ${valueBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>{'ID учителя'}</div>
                <div className={`text-sm font-semibold ${textColor}`}>{teacherId}</div>
              </div>
              <div className={`rounded-xl p-4 ${valueBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>{'Роль'}</div>
                <div className={`text-sm font-semibold ${textColor}`}>{teacherRole}</div>
              </div>
              <div className={`rounded-xl p-4 ${valueBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>{'Класс'}</div>
                <div className={`text-sm font-semibold ${textColor}`}>{teacherClass}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {settingsSections.map((section) => (
            <Card key={section.id} className={`overflow-hidden ${bgCard} ${borderColor}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                    {section.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${textColor}`}>
                    {section.title}
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between py-3 ${theme === 'dark' ? 'border-b border-white/10' : 'border-b border-slate-200'} last:border-0`}
                    >
                      <span className={textMuted70}>{item.label}</span>
                      <span className={`${textColor} font-medium`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className={`overflow-hidden ${bgCard} ${borderColor}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                  <Palette size={24} />
                </div>
                <h3 className={`text-xl font-bold ${textColor}`}>
                  {'Оформление'}
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`flex items-center justify-between py-3 ${theme === 'dark' ? 'border-b border-white/10' : 'border-b border-slate-200'}`}>
                  <span className={textMuted70}>{'Тема'}</span>
                  <div className="flex items-center gap-3">
                    <span className={`${textColor} font-medium`}>
                      {theme === 'dark' ? 'Темная' : 'Светлая'}
                    </span>
                    <button
                      onClick={toggleTheme}
                      className={`
                        relative w-16 h-8 rounded-full transition-colors duration-300
                        ${theme === 'dark' ? 'bg-primary-600' : 'bg-primary-400'}
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                      `}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                        animate={{
                          x: theme === 'dark' ? 0 : 28,
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        {theme === 'dark' ? (
                          <Moon size={14} className="text-primary-600" />
                        ) : (
                          <Sun size={14} className="text-primary-400" />
                        )}
                      </motion.div>
                    </button>
                  </div>
                </div>
                <div className="py-3">
                  <span className={textMuted70}>{'Акцентный цвет'}</span>
                  <span className={`${textColor} font-medium ml-4`}>{'Фиолетовый'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`flex items-center justify-between ${textMuted} text-sm`}>
          <div className="flex items-center gap-2">
            <Info size={18} />
            <span>Physics AI v1.0.0</span>
          </div>
          <div className="flex items-center gap-6">
            <span>{'Политика конфиденциальности'}</span>
            <span>{'Условия использования'}</span>
            <span>{'Поддержка'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
