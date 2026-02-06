import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function AuthRegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signUp(email.trim(), password, name.trim())
    setLoading(false)

    if (result.success) {
      navigate('/lesson')
    } else {
      setError(result.error || 'Ошибка регистрации')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Регистрация учителя</h1>
        <p className="text-slate-600 dark:text-white/60 mb-6">Создайте учительский аккаунт</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-slate-900 dark:text-white outline-none"
              placeholder="Иван Петров"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-slate-900 dark:text-white outline-none"
              placeholder="teacher@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-slate-900 dark:text-white outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-600 text-white py-3 font-semibold hover:bg-primary-500 transition disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="text-sm text-slate-600 dark:text-white/60 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary-500 font-semibold">Войти</Link>
        </p>
      </div>
    </div>
  )
}
