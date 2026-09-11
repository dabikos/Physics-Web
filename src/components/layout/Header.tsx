import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/icons/Logo'
import { School, Globe, Library, Bot, Settings, Sun, Moon, QrCode, FileSpreadsheet, ShieldCheck, Activity, Smartphone } from 'lucide-react'
import { NavItem } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  { id: 'connect', label: 'Подключение', icon: <QrCode size={18} /> },
  { id: 'lesson', label: 'Мой урок', icon: <School size={18} /> },
  { id: 'library', label: 'Библиотека', icon: <Library size={18} /> },
  { id: 'worksheet', label: 'Рабочие листы', icon: <FileSpreadsheet size={18} /> },
  { id: 'world', label: 'Интерактивы', icon: <Globe size={18} /> },
  { id: 'ai', label: 'ИИ-Тьютор', icon: <Bot size={18} /> },
]

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const isDark = theme === 'dark'

  const visibleNavItems = [
    ...navItems,
    { id: 'admin' as NavItem, label: 'Админ', icon: <ShieldCheck size={18} /> },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isDark 
        ? 'bg-cosmic-950/80 border-b border-white/[0.08] shadow-2xl shadow-black/40' 
        : 'bg-white/85 border-b border-slate-200/80 shadow-sm shadow-slate-200/50'
    } backdrop-blur-2xl`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-3.5 group">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-500 to-neon-cyan opacity-40 blur group-hover:opacity-75 transition duration-300" />
                <div className="relative w-11 h-11 rounded-xl bg-cosmic-900 border border-white/10 flex items-center justify-center shadow-lg">
                  <Logo className="w-8 h-8 transition-transform group-hover:scale-110" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-primary-200 to-neon-cyan bg-clip-text text-transparent">
                  Physics AI
                </span>
                <span className="text-[11px] font-semibold text-primary-400/90 tracking-wider uppercase -mt-0.5">
                  Панель учителя
                </span>
              </div>
            </NavLink>

            {/* Server Online Status Pill */}
            <div className={`hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
              isDark 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Activity size={13} />
              <span>Railway Online</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5 p-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-600/30 border border-white/20' 
                    : isDark 
                      ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* App Link Button */}
            <NavLink
              to="/app"
              className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isDark 
                  ? 'border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20' 
                  : 'border-cyan-300 text-cyan-800 bg-cyan-50 hover:bg-cyan-100'
              }`}
            >
              <Smartphone size={15} />
              <span>Приложение</span>
            </NavLink>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border
                ${isDark 
                  ? 'bg-cosmic-800/80 border-white/10 hover:border-white/20 text-amber-400 hover:bg-cosmic-700' 
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                }
              `}
              aria-label="Переключить тему"
              title={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* Settings link */}
            <NavLink
              to="/settings"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                isDark 
                  ? 'bg-cosmic-800/80 border-white/10 hover:border-white/20 text-slate-300 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
              title="Настройки"
            >
              <Settings size={18} />
            </NavLink>

            {/* User Profile Avatar / Logout */}
            {user && (
              <button
                onClick={() => signOut()}
                className="group relative flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 hover:border-rose-500/40 transition-all"
                title="Нажмите, чтобы выйти"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-neon-violet flex items-center justify-center text-white text-xs font-bold shadow-md shadow-primary-500/25">
                  {(user.name || user.email || 'У')[0].toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className={`text-xs font-medium truncate max-w-[100px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user.name || 'Учитель'}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
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