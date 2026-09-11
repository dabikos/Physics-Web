import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  User,
  KeyRound,
  LogOut,
  Copy,
  Check,
  Pencil,
  School,
  DoorOpen,
  BookOpen,
  Palette,
  Sun,
  Moon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const roleLabel = (role?: string) => {
  if (role === 'teacher') return 'Учитель'
  if (role === 'admin') return 'Администратор'
  if (role === 'student') return 'Ученик'
  return 'Пользователь'
}

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut, updateProfile, changePassword } = useAuth()
  const navigate = useNavigate()

  // Copy ID state
  const [copiedId, setCopiedId] = useState(false)

  // Edit Profile Modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editSchool, setEditSchool] = useState('')
  const [editClassroom, setEditClassroom] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null)

  // Change Password state
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null)

  // Logout Confirmation Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  // Theme styling helpers
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const textMuted80 = theme === 'dark' ? 'text-white/80' : 'text-slate-700'
  const bgCard = theme === 'dark' ? 'bg-slate-900/60' : 'bg-white/95'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const iconBg = theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'
  const iconColor = theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
  const valueBg = theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-100/80 border border-slate-200'
  const inputBg = theme === 'dark' ? 'bg-slate-800/90 border-white/15 text-white placeholder-white/30' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'

  const teacherName = user?.name || 'Учитель'
  const teacherEmail = user?.email || '—'
  const teacherId = user?.id || '—'
  const teacherClass = user?.class_id || 'Не назначен'
  const teacherSubject = user?.subject || 'Физика'
  const teacherSchool = user?.school || 'Не указана'
  const teacherClassroom = user?.classroom || 'Не указан'
  const teacherRole = roleLabel(user?.role)

  const initials = (teacherName || teacherEmail || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const openEditProfile = () => {
    setEditName(user?.name || '')
    setEditSubject(user?.subject || 'Физика')
    setEditSchool(user?.school || '')
    setEditClassroom(user?.classroom || '')
    setProfileErrorMsg(null)
    setIsEditProfileOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) {
      setProfileErrorMsg('Имя не может быть пустым')
      return
    }

    setIsSavingProfile(true)
    setProfileErrorMsg(null)

    const res = await updateProfile({
      name: editName.trim(),
      subject: editSubject.trim() || 'Физика',
      school: editSchool.trim() || null,
      classroom: editClassroom.trim() || null,
    })

    setIsSavingProfile(false)

    if (res.success) {
      setIsEditProfileOpen(false)
      setProfileSuccessMsg('Профиль успешно обновлён!')
      setTimeout(() => setProfileSuccessMsg(null), 3500)
    } else {
      setProfileErrorMsg(res.error || 'Не удалось сохранить профиль')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrorMsg(null)
    setPasswordSuccessMsg(null)

    if (!oldPassword) {
      setPasswordErrorMsg('Введите текущий пароль')
      return
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Новый пароль должен содержать не менее 6 символов')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Новые пароли не совпадают')
      return
    }

    setIsChangingPassword(true)

    const res = await changePassword(oldPassword, newPassword)
    setIsChangingPassword(false)

    if (res.success) {
      setPasswordSuccessMsg('Пароль успешно изменён!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setPasswordSuccessMsg(null)
        setIsPasswordSectionOpen(false)
      }, 2500)
    } else {
      setPasswordErrorMsg(res.error || 'Не удалось изменить пароль')
    }
  }

  const handleConfirmLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-24">
      <div className="max-w-[1000px] mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold ${textColor} tracking-tight mb-2`}>
              Настройки
            </h1>
            <p className={`${textMuted} text-base sm:text-lg`}>
              Управление профилем учителя, безопасность и оформление платформы
            </p>
          </div>

          {/* Quick Sign Out Button in Header */}
          <Button
            variant="danger"
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-2 self-start sm:self-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2"
          >
            <LogOut size={16} />
            <span>Выйти из аккаунта</span>
          </Button>
        </div>

        {/* Global Success Notification */}
        <AnimatePresence>
          {profileSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 size={20} className="shrink-0" />
              <span className="font-medium text-sm sm:text-base">{profileSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Teacher Profile Card */}
        <Card className={`overflow-hidden backdrop-blur-md shadow-2xl border ${bgCard} ${borderColor}`}>
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} shadow-inner`}>
                  <User size={22} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${textColor}`}>Профиль учителя</h2>
                  <p className={`${textMuted} text-xs`}>Личные данные и информация для уроков</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={openEditProfile}
                className="flex items-center gap-2 text-xs sm:text-sm py-2 px-3.5"
              >
                <Pencil size={15} />
                <span>Редактировать</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Main Info Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-white/5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 via-accent-500 to-amber-400 p-0.5 shadow-xl shadow-primary-500/20 flex items-center justify-center">
                  <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                    {initials || 'U'}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" title="Активный статус">
                  <Check size={12} className="text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className={`text-2xl font-bold ${textColor}`}>{teacherName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/15 text-primary-400 border border-primary-500/30">
                    {teacherRole}
                  </span>
                </div>
                <p className={`${textMuted} text-sm flex items-center gap-2`}>
                  <span>{teacherEmail}</span>
                  <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Подтверждён
                  </span>
                </p>
              </div>
            </div>

            {/* Detailed Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-6">
              {/* Teacher ID */}
              <div className={`rounded-2xl p-4 ${valueBg} flex flex-col justify-between relative group`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`${textMuted} text-xs font-medium uppercase tracking-wider`}>ID Учителя</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className={`p-1.5 rounded-lg transition-colors ${
                      copiedId
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : theme === 'dark'
                          ? 'hover:bg-white/15 text-slate-400 hover:text-white'
                          : 'hover:bg-slate-200 text-slate-600'
                    }`}
                    title="Скопировать ID учителя"
                  >
                    {copiedId ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className={`text-xs font-mono font-semibold ${textColor} truncate`} title={teacherId}>
                  {teacherId}
                </div>
                {copiedId && (
                  <span className="text-[11px] text-emerald-400 font-medium mt-1 animate-pulse">
                    Скопировано в буфер!
                  </span>
                )}
              </div>

              {/* Subject */}
              <div className={`rounded-2xl p-4 ${valueBg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BookOpen size={14} className="text-primary-400" />
                  <span className={`${textMuted} text-xs font-medium uppercase tracking-wider`}>Предмет</span>
                </div>
                <div className={`text-sm font-semibold ${textColor}`}>
                  {teacherSubject}
                </div>
              </div>

              {/* School / Institution */}
              <div className={`rounded-2xl p-4 ${valueBg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <School size={14} className="text-accent-400" />
                  <span className={`${textMuted} text-xs font-medium uppercase tracking-wider`}>Школа / Лицей</span>
                </div>
                <div className={`text-sm font-semibold ${textColor} truncate`} title={teacherSchool}>
                  {teacherSchool}
                </div>
              </div>

              {/* Classroom */}
              <div className={`rounded-2xl p-4 ${valueBg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <DoorOpen size={14} className="text-amber-400" />
                  <span className={`${textMuted} text-xs font-medium uppercase tracking-wider`}>Кабинет</span>
                </div>
                <div className={`text-sm font-semibold ${textColor}`}>
                  {teacherClassroom}
                </div>
              </div>

              {/* Active Class */}
              <div className={`rounded-2xl p-4 ${valueBg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span className={`${textMuted} text-xs font-medium uppercase tracking-wider`}>Класс по умолчанию</span>
                </div>
                <div className={`text-sm font-semibold ${textColor}`}>
                  {teacherClass}
                </div>
              </div>

              {/* Account Role */}
              <div className={`rounded-2xl p-4 ${valueBg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <User size={14} className="text-emerald-400" />
                  <span className={`${textMuted} text-xs font-medium uppercase tracking-wider`}>Уровень доступа</span>
                </div>
                <div className={`text-sm font-semibold ${textColor}`}>
                  Преподаватель (Полный доступ)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Security & Password Card */}
        <Card className={`overflow-hidden backdrop-blur-md shadow-2xl border ${bgCard} ${borderColor}`}>
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center text-amber-400 shadow-inner`}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${textColor}`}>Безопасность и пароль</h2>
                  <p className={`${textMuted} text-xs`}>Смена пароля для входа в учетную запись</p>
                </div>
              </div>
              <Button
                variant={isPasswordSectionOpen ? 'secondary' : 'primary'}
                onClick={() => {
                  setIsPasswordSectionOpen(prev => !prev)
                  setPasswordErrorMsg(null)
                  setPasswordSuccessMsg(null)
                }}
                className="text-xs sm:text-sm py-2 px-3.5"
              >
                {isPasswordSectionOpen ? 'Скрыть форму' : 'Сменить пароль'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {!isPasswordSectionOpen ? (
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <div className={`text-sm font-medium ${textColor}`}>Пароль учетной записи</div>
                  <div className={`${textMuted} text-xs`}>
                    Рекомендуется использовать надежный пароль не короче 6 символов с цифрами и буквами
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                  ••••••••••••
                </span>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <AnimatePresence>
                  {passwordSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{passwordSuccessMsg}</span>
                    </motion.div>
                  )}

                  {passwordErrorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{passwordErrorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Current Password */}
                <div>
                  <label className={`block text-xs font-semibold ${textMuted80} uppercase tracking-wider mb-1.5`}>
                    Текущий пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full h-11 px-3.5 pr-10 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={`block text-xs font-semibold ${textMuted80} uppercase tracking-wider mb-1.5`}>
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      required
                      minLength={6}
                      className={`w-full h-11 px-3.5 pr-10 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={`block text-xs font-semibold ${textMuted80} uppercase tracking-wider mb-1.5`}>
                    Повторите новый пароль
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите новый пароль"
                    required
                    minLength={6}
                    className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBg}`}
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex items-center gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Обновление...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Обновить пароль</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setIsPasswordSectionOpen(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 3. Appearance / Theme Card */}
        <Card className={`overflow-hidden backdrop-blur-md shadow-2xl border ${bgCard} ${borderColor}`}>
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center text-primary-400 shadow-inner`}>
                <Palette size={22} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${textColor}`}>Оформление интерфейса</h2>
                <p className={`${textMuted} text-xs`}>Цветовая схема и комфорт при демонстрации</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className={`text-sm font-semibold ${textColor} block mb-0.5`}>Цветовая тема платформы</span>
                <span className={`${textMuted} text-xs`}>
                  {theme === 'dark'
                    ? 'Тёмная квантовая тема — снижает нагрузку на глаза и идеально подходит для проекторов'
                    : 'Светлая тема — высокая четкость для дневного освещения'}
                </span>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className={`${textColor} font-semibold text-sm`}>
                  {theme === 'dark' ? 'Тёмная' : 'Светлая'}
                </span>
                <button
                  onClick={toggleTheme}
                  type="button"
                  className={`
                    relative w-16 h-8 rounded-full transition-colors duration-300
                    ${theme === 'dark' ? 'bg-primary-600' : 'bg-primary-400'}
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  `}
                  title="Переключить тему"
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                    animate={{ x: theme === 'dark' ? 0 : 28 }}
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
          </CardContent>
        </Card>

        {/* 4. Session & Logout Card */}
        <Card className={`overflow-hidden backdrop-blur-md shadow-2xl border ${bgCard} border-rose-500/20`}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-rose-400 mb-1">Выход из системы</h3>
                <p className={`${textMuted} text-xs max-w-xl`}>
                  Завершить текущую сессию на этом компьютере. Все ваши сохранённые уроки и прикрепленные классы сохраняются в облаке.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-2 self-start sm:self-auto bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 px-5 shadow-lg shadow-rose-500/20"
              >
                <LogOut size={16} />
                <span>Выйти из аккаунта</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border ${bgCard} ${borderColor} relative`}
            >
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className={`absolute top-5 right-5 p-1.5 rounded-xl transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/15 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center text-primary-400`}>
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${textColor}`}>Редактировать профиль</h3>
                  <p className={`${textMuted} text-xs`}>Измените данные учителя, отображаемые на уроках</p>
                </div>
              </div>

              {profileErrorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className={`block text-xs font-semibold ${textMuted80} uppercase tracking-wider mb-1.5`}>
                    ФИО Учителя *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Например: Иванов Иван Иванович"
                    required
                    className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBg}`}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className={`block text-xs font-semibold ${textMuted80} uppercase tracking-wider mb-1.5`}>
                    Преподаваемый предмет
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Например: Физика и Астрономия"
                    className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBg}`}
                  />
                </div>

                {/* School */}
                <div>
                  <label className={`block text-xs font-semibold ${textMuted80} uppercase tracking-wider mb-1.5`}>
                    Школа / Лицей / Гимназия
                  </label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    placeholder="Например: Лицей №15 или Физ-Мат Школа"
                    className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBg}`}
                  />
                </div>

                {/* Classroom */}
                <div>
                  <label className={`block text-xs font-semibold ${textMuted80} uppercase tracking-wider mb-1.5`}>
                    Номер кабинета / Лаборатории
                  </label>
                  <input
                    type="text"
                    value={editClassroom}
                    onChange={(e) => setEditClassroom(e.target.value)}
                    placeholder="Например: Кабинет 304"
                    className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBg}`}
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditProfileOpen(false)}
                    disabled={isSavingProfile}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Сохранить изменения</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border ${bgCard} border-rose-500/30 text-center relative`}
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-4">
                <LogOut size={26} />
              </div>

              <h3 className={`text-xl font-bold ${textColor} mb-2`}>
                Выйти из аккаунта?
              </h3>
              <p className={`${textMuted} text-sm mb-6 leading-relaxed`}>
                Вы уверены, что хотите завершить сессию? Для продолжения работы потребуется снова ввести email и пароль.
              </p>

              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-1/2 py-2.5"
                >
                  Отмена
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmLogout}
                  className="w-1/2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  Да, выйти
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

