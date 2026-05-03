import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/icons/Logo'
import { School, Globe, Library, Bot, Settings, Sun, Moon, QrCode, FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { NavItem } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  { id: 'lesson', label: 'Мой урок', icon: <School size={20} /> },
  { id: 'world', label: 'World', icon: <Globe size={20} /> },
  { id: 'library', label: 'Библиотека', icon: <Library size={20} /> },
  { id: 'ai', label: 'AI', icon: <Bot size={20} /> },
  { id: 'connect', label: '\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435', icon: <QrCode size={20} /> },
  { id: 'worksheet', label: 'Рабочий лист', icon: <FileSpreadsheet size={20} /> },
  { id: 'settings', label: 'Настройки', icon: <Settings size={20} /> },
]

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { isAdmin } = useAuth()
  const headerBg = theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200'
  const visibleNavItems = isAdmin
    ? [...navItems, { id: 'admin' as NavItem, label: 'Admin', icon: <ShieldCheck size={20} /> }]
    : navItems

  const navInactive = theme === 'dark' ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${headerBg} backdrop-blur-xl border-b ${borderColor}`}>
      <div className="max-w-[1920px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <Logo className="w-10 h-10 transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Physics AI
            </span>
          </NavLink>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' 
                    : navInactive
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Theme toggle and User indicator */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${theme === 'dark' 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }
              `}
              aria-label="Переключить тему"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* User indicator */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-primary-500/25">
              У
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}