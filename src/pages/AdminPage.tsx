import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Database, FileText, FlaskConical, FunctionSquare, Layers3, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8003'

type OverviewTotals = {
  sections: number
  subsections: number
  topics: number
  tests: number
  test_questions: number
  tasks: number
  formulas: number
  settings: number
  ai_prompts: number
  notification_campaigns: number
}

type SectionOverview = {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  is_published: boolean
  subsection_count: number
  topic_count: number
  test_count: number
  task_count: number
  formula_count: number
}

type OverviewResponse = {
  totals: OverviewTotals
  sections: SectionOverview[]
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/80 p-5 shadow-xl shadow-slate-200/50 backdrop-blur dark:bg-slate-900/70 dark:shadow-black/20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600">
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-900 dark:text-white">{value.toLocaleString('ru-RU')}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}

export function AdminPage() {
  const { token, user } = useAuth()
  const { theme } = useTheme()
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cards = useMemo(() => {
    if (!overview) return []
    return [
      { label: 'Sections', value: overview.totals.sections, icon: <Layers3 size={24} /> },
      { label: 'Lesson topics', value: overview.totals.topics, icon: <FileText size={24} /> },
      { label: 'Tests', value: overview.totals.tests, icon: <FlaskConical size={24} /> },
      { label: 'Test questions', value: overview.totals.test_questions, icon: <Database size={24} /> },
      { label: 'Tasks', value: overview.totals.tasks, icon: <FileText size={24} /> },
      { label: 'Formulas', value: overview.totals.formulas, icon: <FunctionSquare size={24} /> },
    ]
  }, [overview])

  async function loadOverview() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/admin/content/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.detail || 'Failed to load admin content')
      setOverview(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load admin content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
  }, [token])

  return (
    <main className="min-h-screen px-6 pb-12 pt-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 p-8 text-white shadow-2xl shadow-primary-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-primary-100">
                <ShieldCheck size={18} /> Admin access: {user?.email}
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Physics AI Admin</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-300">
                Protected panel for Supabase content. This version reads live content counts and prepares the workspace for safe CRUD forms through the backend.
              </p>
            </div>
            <button
              onClick={() => void loadOverview()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-primary-100"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white/80 p-8 text-center font-bold text-slate-500 shadow-xl dark:bg-slate-900/70 dark:text-slate-300">
            Loading admin data...
          </div>
        ) : overview ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {cards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </section>

            <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Content by section</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Lessons, tests, tasks and formulas are read from Supabase through protected backend endpoints.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <table className="w-full min-w-[840px] border-collapse text-left">
                  <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}>
                    <tr className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="px-5 py-4">Section</th>
                      <th className="px-5 py-4">Subsections</th>
                      <th className="px-5 py-4">Topics</th>
                      <th className="px-5 py-4">Tests</th>
                      <th className="px-5 py-4">Tasks</th>
                      <th className="px-5 py-4">Formulas</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.sections.map((section) => (
                      <tr key={section.id} className="border-t border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200">
                        <td className="px-5 py-4 font-bold">{section.name}</td>
                        <td className="px-5 py-4">{section.subsection_count}</td>
                        <td className="px-5 py-4">{section.topic_count}</td>
                        <td className="px-5 py-4">{section.test_count}</td>
                        <td className="px-5 py-4">{section.task_count}</td>
                        <td className="px-5 py-4">{section.formula_count}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${section.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {section.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}
