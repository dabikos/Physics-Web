import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  Download,
  FlaskConical,
  Globe2,
  GraduationCap,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react'

const features = [
  {
    icon: BrainCircuit,
    title: 'Понятные уроки',
    text: 'Темы по механике, термодинамике, электричеству, оптике, атомной физике, СТО и астрономии.',
  },
  {
    icon: ClipboardCheck,
    title: 'Тесты и задачи',
    text: 'Практика по разделам и подразделам с проверкой знаний, объяснениями и формулами.',
  },
  {
    icon: Bot,
    title: 'AI-помощник',
    text: 'Можно задать вопрос по физике и получить структурированный ответ с формулами.',
  },
  {
    icon: Globe2,
    title: '3 языка',
    text: 'Контент доступен на русском, английском и казахском языках.',
  },
]

const proBenefits = [
  'Расширенный доступ к урокам, тестам, задачам и формулам',
  'Генерация тестов и дополнительных объяснений',
  'Меньше ограничений и больше самостоятельной практики',
  'Удобный формат подготовки к урокам и контрольным',
]

const stats = [
  { value: '700+', label: 'вопросов и задач' },
  { value: '7', label: 'больших разделов физики' },
  { value: '3', label: 'языка обучения' },
]

export function AppShowcasePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08111f] text-white">
      <section className="relative isolate px-5 pb-20 pt-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(132,204,22,0.18),transparent_26%),linear-gradient(135deg,#08111f_0%,#10233c_46%,#041018_100%)]" />
        <div className="absolute left-1/2 top-24 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

        <header className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 via-cyan-300 to-blue-500 shadow-lg shadow-cyan-500/30">
              <FlaskConical className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">Physics AI</p>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">mobile app</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:border-cyan-300/60 hover:text-white"
            >
              Для учителей
            </Link>
            <a
              href="https://play.google.com/store/apps/details?id=com.physicsai.app"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-xl shadow-white/10 transition hover:-translate-y-0.5"
            >
              Google Play
            </a>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-14 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              AI-репетитор по физике в телефоне
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              Учить физику проще, когда рядом есть{' '}
              <span className="bg-gradient-to-r from-emerald-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                Physics AI
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Мобильное приложение помогает разбирать темы, решать задачи, проходить тесты и получать объяснения с формулами.
              Подходит для самостоятельной подготовки и занятий с учителем.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://play.google.com/store/apps/details?id=com.physicsai.app"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-7 py-4 text-base font-black text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-1"
              >
                <Download className="h-5 w-5" />
                Скачать приложение
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-base font-bold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/10"
              >
                <Play className="h-5 w-5" />
                Что внутри
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                  <p className="text-2xl font-black text-white sm:text-3xl">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            className="relative mx-auto w-full max-w-[430px]"
          >
            <div className="absolute -left-12 top-16 h-24 w-24 rounded-full bg-emerald-300/25 blur-2xl" />
            <div className="absolute -right-10 bottom-20 h-32 w-32 rounded-full bg-blue-400/25 blur-2xl" />
            <div className="relative rounded-[42px] border border-white/15 bg-slate-950/80 p-4 shadow-2xl shadow-cyan-950/60 backdrop-blur">
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-300" />
                    <div className="h-3 w-3 rounded-full bg-cyan-300" />
                    <div className="h-3 w-3 rounded-full bg-blue-400" />
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">Physics AI</div>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 p-5 text-slate-950">
                  <div className="flex items-center justify-between">
                    <Crown className="h-8 w-8" />
                    <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-black text-white">PRO</span>
                  </div>
                  <p className="mt-8 text-3xl font-black leading-none">Разбери тему за 10 минут</p>
                  <p className="mt-3 text-sm font-bold text-slate-800">Уроки, формулы, тесты и AI-объяснения в одном месте.</p>
                </div>

                <div className="mt-5 space-y-3">
                  {['Кинематика', 'Законы термодинамики', 'Фотоэффект'].map((topic, index) => (
                    <div key={topic} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                        {index === 0 ? <GraduationCap className="h-5 w-5" /> : index === 1 ? <FlaskConical className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">{topic}</p>
                        <div className="mt-2 h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${62 + index * 12}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 px-5 py-20 text-slate-950 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-700">возможности</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Все нужное для практики по физике</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60"
                >
                  <div className="grid h-13 w-13 place-items-center rounded-2xl bg-slate-950 text-cyan-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-black">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{feature.text}</p>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0b1020] px-5 py-20 text-white sm:px-8 lg:px-12">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">
              <Crown className="h-4 w-4" />
              Physics AI Pro
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Больше практики для тех, кто хочет идти дальше</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Pro-подписка открывает расширенный материал и инструменты для самостоятельного обучения.
              Бесплатная версия остается полезной для знакомства с приложением.
            </p>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              {proBenefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-3xl bg-slate-950/60 p-5">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="font-semibold leading-7 text-slate-100">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-slate-950 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <div className="rounded-[34px] bg-slate-950 p-8 text-white lg:col-span-2">
            <BadgeCheck className="h-10 w-10 text-cyan-300" />
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em]">Для учеников, родителей и учителей</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Приложение помогает ученику тренироваться самостоятельно, а сайт Physics AI используется учителями
              для работы с классами и учебным материалом.
            </p>
          </div>
          <div className="rounded-[34px] border border-slate-200 bg-slate-50 p-8">
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
            <h3 className="mt-6 text-2xl font-black">Безопасно и понятно</h3>
            <p className="mt-4 leading-7 text-slate-600">
              Фокус на учебном контенте, практике и понятных объяснениях, без лишнего шума.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-[#08111f] px-5 py-12 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-black">Physics AI</p>
            <p className="mt-2 text-sm text-slate-400">AI-помощник для изучения физики</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://play.google.com/store/apps/details?id=com.physicsai.app"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3 font-black text-slate-950"
            >
              Google Play
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 font-bold text-white"
            >
              Кабинет учителя
              <Trophy className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
