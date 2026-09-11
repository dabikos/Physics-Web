import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/icons/Logo'
import { School, Globe, Library, Bot, Settings, Sun, Moon, QrCode, FileSpreadsheet, ShieldCheck, Smartphone } from 'lucide-react'
import { NavItem } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  { id: 'connect', label: 'Подключение', icon: <QrCode size={16} /> },
  { id: 'lesson', label: 'Мой урок', icon: <School size={16} /> },
  { id: 'library', label: 'Библиотека', icon: <Library size={16} /> },
  { id: 'worksheet', label: 'Рабочие листы', icon: <FileSpreadsheet size={16} /> },
  { id: 'world', label: 'Интерактивы', icon: <Globe size={16} /> },
  { id: 'ai', label: 'ИИ-Тьютор', icon: <Bot size={16} /> },
]

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut, isAdmin } = useAuth()
  const isDark = theme === 'dark'

  const visibleNavItems = [
    ...navItems,
    ...(isAdmin ? [{ id: 'admin' as NavItem, label: 'Админ', icon: <ShieldCheck size={16} /> }] : []),
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isDark 
        ? 'bg-cosmic-950/90 border-b border-white/[0.08] shadow-lg shadow-black/30' 
        : 'bg-white/95 border-b border-slate-200/90 shadow-sm shadow-slate-200/40'
    } backdrop-blur-xl`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-3 group select-none">
              <div className="relative w-9 h-9 rounded-xl bg-cosmic-900 border border-white/10 flex items-center justify-center shadow-md group-hover:border-primary-500/40 transition">
                <Logo className="w-6 h-6 transition-transform group-hover:scale-105" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-white dark:text-white">
                    Physics <span className="text-neon-cyan">AI</span>
                  </span>
                  <span className="relative flex h-2 w-2" title="Сервер подключен">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wide">
                  Панель учителя
                </span>
              </div>
            </NavLink>
          </div>

          {/* Navigation Links - Unified single-line pills */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={({ isActive }) => `
                  h-9 px-3.5 rounded-lg text-xs font-medium whitespace-nowrap inline-flex items-center gap-2 transition-all duration-150 border
                  ${isActive 
                    ? isDark
                      ? 'bg-primary-500/20 text-primary-200 border-primary-500/40 shadow-sm shadow-primary-500/20' 
                      : 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm'
                    : isDark 
                      ? 'text-slate-300 border-transparent hover:text-white hover:bg-white/[0.06]' 
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Actions & Profile - Unified h-9 controls */}
          <div className="flex items-center gap-2">
            {/* App Link Button */}
            <NavLink
              to="/app"
              className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border transition-all ${
                isDark 
                  ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20' 
                  : 'border-cyan-300 text-cyan-800 bg-cyan-50 hover:bg-cyan-100'
              }`}
            >
              <Smartphone size={14} />
              <span>Приложение</span>
            </NavLink>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                w-9 h-9 rounded-lg inline-flex items-center justify-center transition-all duration-150 border
                ${isDark 
                  ? 'bg-white/[0.05] border-white/10 hover:border-white/20 text-amber-400 hover:bg-white/[0.08]' 
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                }
              `}
              aria-label="Переключить тему"
              title={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            {/* Settings link */}
            <NavLink
              to="/settings"
              className={`w-9 h-9 rounded-lg inline-flex items-center justify-center transition-all duration-150 border ${
                isDark 
                  ? 'bg-white/[0.05] border-white/10 hover:border-white/20 text-slate-300 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
              title="Настройки"
            >
              <Settings size={16} />
            </NavLink>

            {/* User Profile Avatar / Logout */}
            {user && (
              <button
                onClick={() => signOut()}
                className="group relative flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-lg bg-white/[0.04] border border-white/10 hover:border-rose-500/40 transition-all select-none"
                title="Нажмите, чтобы выйти"
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shadow-primary-500/20">
                  {(user.name || user.email || 'У')[0].toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className={`text-xs font-medium truncate max-w-[90px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {user.name || 'Учитель'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    Выйти
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}