import { useState, type ReactNode } from 'react'
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  GraduationCap,
  Layers,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

export type AnalyticsOverviewData = {
  totals: {
    total_users: number
    new_users_7d: number
    new_users_30d: number
    total_test_attempts: number
    avg_platform_score: number
  }
  timeline: {
    date: string
    label: string
    registrations: number
    tests_taken: number
  }[]
  class_distribution: {
    name: string
    value: number
  }[]
  section_performance: {
    section: string
    avg_score: number
    tests_count: number
  }[]
  score_brackets: {
    name: string
    value: number
    color?: string
  }[]
}

export type AnalyticsUserData = {
  id: string
  email: string
  name: string
  role: string
  class_id?: string
  school?: string
  created_at?: string
  completed_lessons_count: number
  completed_tasks_count: number
  completed_tests_count: number
  avg_score: number
}

export type AnalyticsUsersResponse = {
  users: AnalyticsUserData[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export type UserTestResult = {
  test_id: string
  test_title: string
  section?: string
  score: number
  total_questions: number
  percentage: number
  time_spent?: number
  completed_at?: string
}

export type UserDetailData = {
  user: AnalyticsUserData & {
    stats: {
      completed_lessons_count: number
      completed_tasks_count: number
      completed_tests_count: number
      avg_score: number
    }
  }
  recent_tests: UserTestResult[]
  section_breakdown: {
    section: string
    avg_score: number
    tests_taken: number
  }[]
}

interface UserAnalyticsViewProps {
  overview: AnalyticsOverviewData | null
  usersData: AnalyticsUsersResponse | null
  loading: boolean
  usersTableLoading: boolean
  selectedUserDetail: UserDetailData | null
  userDetailLoading: boolean
  searchQuery: string
  roleFilter: string
  classFilter: string
  currentPage: number
  theme: 'dark' | 'light'
  onSearchChange: (val: string) => void
  onRoleFilterChange: (val: string) => void
  onClassFilterChange: (val: string) => void
  onPageChange: (page: number) => void
  onViewUserDetails: (userId: string) => void
  onCloseUserDetails: () => void
  onRefresh: () => void
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

function formatSeconds(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs} сек`
  return `${mins} мин ${secs > 0 ? `${secs} сек` : ''}`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function RoleBadge({ role }: { role: string }) {
  switch (role?.toLowerCase()) {
    case 'admin':
      return (
        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
          Админ
        </span>
      )
    case 'teacher':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
          Учитель
        </span>
      )
    case 'student':
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
          Ученик
        </span>
      )
  }
}

function ScoreBadge({ score }: { score: number }) {
  if (score <= 0) {
    return <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">—</span>
  }
  let colorClass = 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300'
  if (score >= 80) {
    colorClass = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
  } else if (score >= 60) {
    colorClass = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
  }

  return (
    <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-black ${colorClass}`}>
      {score}%
    </span>
  )
}

function MetricCard({
  icon,
  label,
  value,
  sublabel,
  accentColor,
}: {
  icon: ReactNode
  label: string
  value: string | number
  sublabel?: string
  accentColor: string
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur transition hover:translate-y-[-2px] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{value}</div>
      {sublabel && (
        <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {sublabel}
        </div>
      )}
    </div>
  )
}

export function UserAnalyticsView({
  overview,
  usersData,
  loading,
  usersTableLoading,
  selectedUserDetail,
  userDetailLoading,
  searchQuery,
  roleFilter,
  classFilter,
  currentPage,
  theme,
  onSearchChange,
  onRoleFilterChange,
  onClassFilterChange,
  onPageChange,
  onViewUserDetails,
  onCloseUserDetails,
}: UserAnalyticsViewProps) {
  const isDark = theme === 'dark'
  const gridStroke = isDark ? '#334155' : '#E2E8F0'
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF'
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0'
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A'

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white/80 p-16 shadow-xl dark:border-white/10 dark:bg-slate-900/70">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        <p className="mt-4 font-bold text-slate-600 dark:text-slate-300">
          Сбор и агрегация аналитики пользователей...
        </p>
      </div>
    )
  }

  const totals = overview?.totals || {
    total_users: 0,
    new_users_7d: 0,
    new_users_30d: 0,
    total_test_attempts: 0,
    avg_platform_score: 0,
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label="Всего пользователей"
          value={totals.total_users.toLocaleString('ru-RU')}
          sublabel={`+${totals.new_users_7d} новых за 7 дней`}
          accentColor="bg-blue-500/10 dark:bg-blue-500/20"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          label="Новые за 30 дней"
          value={totals.new_users_30d.toLocaleString('ru-RU')}
          sublabel="динамика прироста аудитории"
          accentColor="bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <MetricCard
          icon={<Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label="Сдано тестов"
          value={totals.total_test_attempts.toLocaleString('ru-RU')}
          sublabel="всего решений в приложении"
          accentColor="bg-purple-500/10 dark:bg-purple-500/20"
        />
        <MetricCard
          icon={<GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          label="Средний балл платформы"
          value={`${totals.avg_platform_score}%`}
          sublabel="средняя точность прохождения"
          accentColor="bg-amber-500/10 dark:bg-amber-500/20"
        />
      </section>

      {/* Charts Grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Timeline Chart (30 Days) */}
        <div className="rounded-[2.5rem] border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20 lg:col-span-2">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Динамика активности за последние 30 дней
              </h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Новые регистрации и количество решенных тестов по дням
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="h-3 w-3 rounded-full bg-blue-500" /> Регистрации
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-3 w-3 rounded-full bg-emerald-500" /> Пройдено тестов
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {overview?.timeline && overview.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={overview.timeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '1rem',
                      color: tooltipText,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    name="Регистрации"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReg)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tests_taken"
                    name="Пройдено тестов"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTests)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
                Нет данных за выбранный период
              </div>
            )}
          </div>
        </div>

        {/* Section Performance Bar Chart */}
        <div className="rounded-[2.5rem] border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Успеваемость по разделам физики
            </h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Средний процент верных ответов в тестах
            </p>
          </div>

          <div className="h-64 w-full">
            {overview?.section_performance && overview.section_performance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={overview.section_performance}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="section"
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94A3B8"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(val: unknown) => [`${val}%`, 'Средний балл']}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '1rem',
                      color: tooltipText,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="avg_score"
                    name="Средний балл"
                    fill="#8B5CF6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
                Нет данных по разделам
              </div>
            )}
          </div>
        </div>

        {/* Distribution Charts (Class + Score Brackets) */}
        <div className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20 sm:grid-cols-2">
          {/* Classes distribution */}
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              По классам
            </h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Распределение аудитории
            </p>
            <div className="mt-2 h-52 w-full">
              {overview?.class_distribution && overview.class_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview.class_distribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {overview.class_distribution.map((_, index) => (
                        <Cell
                          key={`cell-class-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '0.75rem',
                        color: tooltipText,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-bold text-slate-400">
                  Нет данных
                </div>
              )}
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2 text-xs font-bold">
              {(overview?.class_distribution || []).map((item, idx) => (
                <span key={item.name} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {item.name}: {item.value}
                </span>
              ))}
            </div>
          </div>

          {/* Score brackets distribution */}
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              По успеваемости
            </h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Градация результатов тестов
            </p>
            <div className="mt-2 h-52 w-full">
              {overview?.score_brackets && overview.score_brackets.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview.score_brackets}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {overview.score_brackets.map((item, index) => (
                        <Cell
                          key={`cell-score-${index}`}
                          fill={item.color || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '0.75rem',
                        color: tooltipText,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-bold text-slate-400">
                  Нет данных
                </div>
              )}
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2 text-xs font-bold">
              {(overview?.score_brackets || []).map((item) => (
                <span key={item.name} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color || '#3B82F6' }}
                  />
                  {item.name}: {item.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Users Directory & Individual Progress Section */}
      <section className="rounded-[2.5rem] border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Пользователи и индивидуальный прогресс
            </h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Всего пользователей в системе: {usersData?.total ?? 0}
            </p>
          </div>

          {/* Filters and search row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-primary-500 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-primary-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Все роли</option>
              <option value="student">Ученики</option>
              <option value="teacher">Учителя</option>
              <option value="admin">Администраторы</option>
            </select>

            <select
              value={classFilter}
              onChange={(e) => onClassFilterChange(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-primary-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Все классы</option>
              <option value="7">7 класс</option>
              <option value="8">8 класс</option>
              <option value="9">9 класс</option>
              <option value="10">10 класс</option>
              <option value="11">11 класс</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}>
              <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-5 py-4 font-black">Пользователь</th>
                <th className="px-5 py-4 font-black">Роль</th>
                <th className="px-5 py-4 font-black">Класс / Школа</th>
                <th className="px-5 py-4 font-black">Уроков</th>
                <th className="px-5 py-4 font-black">Задач</th>
                <th className="px-5 py-4 font-black">Тестов</th>
                <th className="px-5 py-4 font-black">Ср. балл</th>
                <th className="px-5 py-4 font-black">Регистрация</th>
                <th className="px-5 py-4 font-black text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {usersTableLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center font-bold text-slate-400">
                    Загрузка списка пользователей...
                  </td>
                </tr>
              ) : !usersData?.users || usersData.users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center font-bold text-slate-400">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                usersData.users.map((u) => (
                  <tr
                    key={u.id}
                    className="transition hover:bg-slate-50/50 dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.name || 'Без имени'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <div>{u.class_id ? `${u.class_id} класс` : '—'}</div>
                      {u.school && <div className="text-xs text-slate-400">{u.school}</div>}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {u.completed_lessons_count || 0}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {u.completed_tasks_count || 0}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {u.completed_tests_count || 0}
                    </td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={u.avg_score} />
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onViewUserDetails(u.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-primary-600 hover:text-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-primary-600 dark:hover:text-white"
                      >
                        Подробнее
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData && usersData.total_pages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Страница {usersData.page} из {usersData.total_pages} (всего {usersData.total})
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || usersTableLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <ChevronLeft size={14} /> Назад
              </button>
              <span className="px-2 text-xs font-black text-slate-900 dark:text-white">
                {currentPage}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= usersData.total_pages || usersTableLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Вперед <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* User Details Modal */}
      {(selectedUserDetail || userDetailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2.5rem] border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-950/40 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            {/* Close button */}
            <button
              onClick={onCloseUserDetails}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
            >
              <X size={20} />
            </button>

            {userDetailLoading ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                <p className="mt-4 font-bold text-slate-500">Загрузка карточки пользователя...</p>
              </div>
            ) : selectedUserDetail ? (
              <div className="space-y-6">
                {/* Header Profile */}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {selectedUserDetail.user.name || 'Без имени'}
                    </h3>
                    <RoleBadge role={selectedUserDetail.user.role} />
                    {selectedUserDetail.user.class_id && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                        {selectedUserDetail.user.class_id} класс
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Почта: {selectedUserDetail.user.email}</span>
                    {selectedUserDetail.user.school && (
                      <span>Школа: {selectedUserDetail.user.school}</span>
                    )}
                    <span>Регистрация: {formatDate(selectedUserDetail.user.created_at)}</span>
                  </div>
                </div>

                {/* KPI stats for this user */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Уроков пройдено
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {selectedUserDetail.user.stats?.completed_lessons_count || 0}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Задач решено
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {selectedUserDetail.user.stats?.completed_tasks_count || 0}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Тестов сдано
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {selectedUserDetail.user.stats?.completed_tests_count || 0}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Средний результат
                    </div>
                    <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {selectedUserDetail.user.stats?.avg_score || 0}%
                    </div>
                  </div>
                </div>

                {/* Section Breakdown */}
                {selectedUserDetail.section_breakdown &&
                  selectedUserDetail.section_breakdown.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                      <h4 className="mb-4 text-base font-black text-slate-900 dark:text-white">
                        Успеваемость по разделам физики
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedUserDetail.section_breakdown.map((sec) => (
                          <div
                            key={sec.section}
                            className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-white/5 dark:bg-slate-800/50"
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-800 dark:text-slate-200">
                                {sec.section}
                              </span>
                              <span className="text-primary-600 dark:text-primary-400">
                                {sec.avg_score}% ({sec.tests_taken} тестов)
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                              <div
                                className="h-full rounded-full bg-primary-500"
                                style={{ width: `${Math.min(100, Math.max(0, sec.avg_score))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Test Attempts History */}
                <div>
                  <h4 className="mb-3 text-base font-black text-slate-900 dark:text-white">
                    История прохождения тестов
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                    <table className="w-full min-w-[600px] border-collapse text-left">
                      <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}>
                        <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <th className="px-4 py-3 font-black">Тест</th>
                          <th className="px-4 py-3 font-black">Раздел</th>
                          <th className="px-4 py-3 font-black">Балл</th>
                          <th className="px-4 py-3 font-black">Точность</th>
                          <th className="px-4 py-3 font-black">Время</th>
                          <th className="px-4 py-3 font-black">Дата сдачи</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {selectedUserDetail.recent_tests &&
                        selectedUserDetail.recent_tests.length > 0 ? (
                          selectedUserDetail.recent_tests.map((t, idx) => (
                            <tr
                              key={idx}
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                {t.test_title || t.test_id}
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                {t.section || '—'}
                              </td>
                              <td className="px-4 py-3 font-bold">
                                {t.score} / {t.total_questions}
                              </td>
                              <td className="px-4 py-3">
                                <ScoreBadge score={t.percentage} />
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                {formatSeconds(t.time_spent)}
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                {formatDate(t.completed_at)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-8 text-center text-xs font-bold text-slate-400"
                            >
                              Пользователь пока не проходил тесты
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
