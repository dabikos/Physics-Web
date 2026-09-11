import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import {
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Download,
  Globe2,
  GraduationCap,
  Layers,
  QrCode,
  School,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { GooglePlayIcon } from '@/components/icons/GooglePlayIcon'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.physicsai.app'

const features = [
  {
    icon: BrainCircuit,
    title: '7 фундаментальных разделов',
    text: 'Механика, термодинамика, электродинамика, оптика, квантовая и ядерная физика, СТО и астрофизика в понятной структуре.',
    tag: 'Полная база',
    color: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
  },
  {
    icon: BookOpen,
    title: '700+ интерактивных задач',
    text: 'Практические задания с мгновенной автопроверкой, разбором решений, формулами и комментариями к ошибкам.',
    tag: 'Практика',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Bot,
    title: 'AI-репетитор 24/7',
    text: 'Задайте любой вопрос по физике текстом или формулой — получите пошаговое объяснение на простом понятном языке.',
    tag: 'Искусственный интеллект',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
    iconColor: 'text-violet-400',
  },
  {
    icon: Globe2,
    title: '3 языка обучения',
    text: 'Полная локализация на русский, казахский (қазақша) и английский (English). Легко переключать терминологию.',
    tag: 'RU / KZ / EN',
    color: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  {
    icon: Users,
    title: 'Синхронизация с учителем',
    text: 'Подключение к уроку на проекторе/доске через PIN или QR-код. Ученик видит слайды и решает тесты со своего смартфона.',
    tag: 'Для классов',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/30',
    iconColor: 'text-pink-400',
  },
  {
    icon: Layers,
    title: 'Офлайн-справочник формул',
    text: 'Быстрый доступ к формулам, физическим постоянным, законам и единицам СИ прямо в кармане без необходимости в сети.',
    tag: 'Справочник',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
]

const proBenefits = [
  'Неограниченные диалоги с AI-репетитором по любым темам',
  'Генерация уникальных тестов и тренировочных вариантов',
  'Пошаговый разбор олимпиадных и экзаменационных задач (ЕНТ/ОГЭ/ЕГЭ)',
  'Глубокая статистика прогресса и персональные рекомендации',
  'Офлайн-режим для повторения формул и конспектов везде',
  'Приоритетный доступ к новым главам и интерактивным симуляциям',
]

const stats = [
  { value: '4.9 ★', label: 'рейтинг в Google Play' },
  { value: '700+', label: 'задач и тестов' },
  { value: '7', label: 'больших разделов' },
  { value: '3', label: 'языка (RU/KZ/EN)' },
]

export function AppShowcasePage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    QRCode.toDataURL(PLAY_STORE_URL, {
      margin: 1,
      width: 240,
      color: {
        dark: '#00f2fe',
        light: '#070f1e',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR generation error:', err))
  }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-[#060c18] text-white selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Gradients & Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 h-[650px] w-[650px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute bottom-10 left-10 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ────────────────── TOP NAVBAR ────────────────── */}
      <header className="relative z-20 border-b border-white/[0.07] bg-[#060c18]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative overflow-hidden rounded-2xl p-0.5 bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <img
                src="/images/icon.png"
                alt="Physics AI"
                className="h-10 w-10 rounded-[14px] object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">Physics AI</span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                  App
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Мобильный AI-репетитор</p>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden items-center gap-8 md:flex text-sm font-semibold text-slate-300">
            <a href="#features" className="transition hover:text-cyan-300">
              Возможности
            </a>
            <a href="#ecosystem" className="transition hover:text-cyan-300">
              Школам и классам
            </a>
            <a href="#pro" className="transition hover:text-cyan-300">
              Physics AI PRO
            </a>
            <Link to="/" className="transition hover:text-cyan-300">
              Веб-платформа
            </Link>
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/lesson"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <School className="h-4 w-4 text-cyan-400" />
              Для учителей
            </Link>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:shadow-cyan-500/40"
            >
              <GooglePlayIcon className="h-4 w-4" />
              <span>Google Play</span>
            </a>
          </div>
        </div>
      </header>

      {/* ────────────────── HERO SECTION ────────────────── */}
      <section className="relative px-5 pt-12 pb-20 sm:px-8 lg:px-12 lg:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Hero Column */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            {/* Rating & App Store pill */}
            <div className="mb-6 inline-flex flex-wrap items-center gap-2.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100 backdrop-blur-md">
              <span className="flex items-center gap-1 text-amber-300 font-extrabold">
                <Star className="h-3.5 w-3.5 fill-amber-300" />
                4.9 в Google Play
              </span>
              <span className="h-1 w-1 rounded-full bg-cyan-400/50" />
              <span className="text-cyan-200/90">AI-репетитор и карманный справочник</span>
              <span className="h-1 w-1 rounded-full bg-cyan-400/50" />
              <span className="text-emerald-300 font-extrabold">Бесплатно</span>
            </div>

            <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Вся физика в кармане: от формул до{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                AI‑репетитора
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Интерактивные уроки по 7 разделам физики, 700+ тестов и задач с мгновенным разбором, умный AI-помощник
              для объяснения сложных тем и бесшовная синхронизация с уроком учителя на проекторе.
            </p>

            {/* Store Button + QR Code Section */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 px-7 py-4 text-slate-950 shadow-2xl shadow-cyan-500/25 transition hover:-translate-y-1 hover:shadow-cyan-500/40"
              >
                <GooglePlayIcon className="h-8 w-8 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Доступно в</p>
                  <p className="text-xl font-black leading-tight">Google Play</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-2 transition group-hover:translate-x-1" />
              </a>

              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.05] px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/[0.09]"
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Смотреть функции
              </a>
            </div>

            {/* Instant Camera QR Code box */}
            <div className="mt-7 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md max-w-md">
              <div className="relative shrink-0 overflow-hidden rounded-xl border border-cyan-400/30 bg-[#070f1e] p-1.5 shadow-md shadow-cyan-500/10">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Google Play QR Code" className="h-16 w-16 rounded-lg" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-lg bg-cyan-950/40 text-cyan-400">
                    <QrCode className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                  Скачайте на телефон за 5 секунд
                </p>
                <p className="mt-1 text-slate-400 leading-normal">
                  Наведите камеру смартфона на QR-код, чтобы сразу открыть страницу приложения в Google Play.
                </p>
              </div>
            </div>

            {/* Metrics counter grid */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur transition hover:border-cyan-400/25"
                >
                  <p className="text-2xl font-black text-white sm:text-3xl bg-gradient-to-r from-white to-slate-300 bg-clip-text">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Hero Column: Interactive Smartphone Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            className="relative mx-auto w-full max-w-[390px] select-none"
          >
            {/* Ambient glows behind phone */}
            <div className="absolute -left-10 top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
            <div className="absolute -right-8 bottom-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            {/* Floating Formula Badge: Newton (Top Left) */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-8 top-16 z-30 hidden sm:flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-cyan-200 shadow-xl shadow-cyan-500/20 backdrop-blur-xl"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-400/20 text-cyan-300 text-[10px] font-mono">
                F
              </span>
              <span>F = m · a</span>
            </motion.div>

            {/* Floating Formula Badge: Einstein (Bottom Right) */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -right-8 bottom-28 z-30 hidden sm:flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-emerald-200 shadow-xl shadow-emerald-500/20 backdrop-blur-xl"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-400/20 text-emerald-300 text-[10px] font-mono">
                E
              </span>
              <span>E = m · c²</span>
            </motion.div>

            {/* Floating Live Sync Badge (Bottom Left) */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -left-6 bottom-8 z-30 hidden sm:flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-slate-900/90 px-3 py-1.5 text-[11px] font-bold text-violet-200 shadow-xl shadow-violet-500/20 backdrop-blur-xl"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Класс подключен • PIN 4812</span>
            </motion.div>

            {/* Smartphone Outer Frame */}
            <div className="relative rounded-[48px] border-[6px] border-slate-700/80 bg-slate-950 p-3 shadow-2xl shadow-cyan-950/80 backdrop-blur-2xl ring-1 ring-white/20">
              {/* Glass Glare Highlight */}
              <div className="pointer-events-none absolute inset-x-8 top-3 h-24 rounded-t-[40px] bg-gradient-to-b from-white/10 to-transparent" />

              {/* Dynamic Island Notch */}
              <div className="mx-auto mb-2 flex h-5 w-28 items-center justify-between rounded-full bg-black px-3">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-900 border border-slate-800" />
                <div className="h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>

              {/* Screen Inner View */}
              <div className="rounded-[36px] border border-white/10 bg-gradient-to-b from-slate-900 via-[#0a1224] to-[#060c18] p-4 text-white overflow-hidden">
                {/* Mobile App Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/images/icon.png"
                      alt="Physics AI App Logo"
                      className="h-8 w-8 rounded-xl object-cover ring-1 ring-cyan-400/30"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                    <div>
                      <p className="text-xs font-black tracking-tight text-white">Physics AI</p>
                      <p className="text-[9px] text-cyan-300 font-semibold">Урок 4 • 9 Класс</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Онлайн
                  </div>
                </div>

                {/* Topic Pill & Progress Card */}
                <div className="mt-3.5 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                      Текущая тема
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">85% изучено</span>
                  </div>
                  <p className="mt-1 text-sm font-black text-white">Закон сохранения энергии</p>
                  <p className="mt-1 font-mono text-[11px] text-cyan-200">
                    E = mgh + (mv²)/2 = const
                  </p>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
                  </div>
                </div>

                {/* AI Assistant Live Chat Bubble */}
                <div className="mt-3 rounded-2xl border border-violet-500/30 bg-violet-950/30 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bot className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-300">
                      AI-репетитор подсказывает:
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-200">
                    «При свободном падении с высоты h потенциальная энергия полностью переходит в кинетическую: v = √(2gh).
                    Показать вывод формулы?»
                  </p>
                </div>

                {/* Interactive Test Snippet */}
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400">Вопрос 3 из 10</span>
                    <span className="text-[10px] font-extrabold text-emerald-400">+100 XP</span>
                  </div>
                  <p className="text-xs font-bold text-white leading-snug">
                    В каких единицах в системе СИ измеряется работа силы?
                  </p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200">
                      <span>B. Джоуль (Дж)</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium text-slate-400">
                      <span>A. Ватт (Вт)</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="mt-3 flex items-center justify-around rounded-2xl border border-white/5 bg-slate-950/80 py-2 text-[10px] text-slate-400">
                  <span className="font-bold text-cyan-300 flex flex-col items-center gap-0.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Уроки
                  </span>
                  <span className="flex flex-col items-center gap-0.5 hover:text-white">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Тесты
                  </span>
                  <span className="flex flex-col items-center gap-0.5 hover:text-white">
                    <Bot className="h-3.5 w-3.5" />
                    AI Чат
                  </span>
                  <span className="flex flex-col items-center gap-0.5 hover:text-white">
                    <Trophy className="h-3.5 w-3.5" />
                    Профиль
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────────────── SECTION: FEATURES ────────────────── */}
      <section id="features" className="relative border-t border-white/[0.08] px-5 py-24 sm:px-8 lg:px-12 bg-[#081120]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-cyan-300">
              <Zap className="h-3.5 w-3.5" />
              Возможности приложения
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Всё необходимое для понимания и высоких баллов
            </h2>
            <p className="mt-4 text-base text-slate-300 sm:text-lg">
              Приложение создано для глубокого освоения физики: от простых понятий для 7 класса до сложных задач ЕНТ, ОГЭ и ЕГЭ.
            </p>
          </div>

          {/* Features Grid with Dark Glassmorphism */}
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${feature.color} border ${feature.border} ${feature.iconColor} shadow-inner`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-black text-white group-hover:text-cyan-200 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.text}</p>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION: ECOSYSTEM (STUDENT + TEACHER) ────────────────── */}
      <section id="ecosystem" className="relative border-t border-white/[0.08] px-5 py-24 sm:px-8 lg:px-12 bg-[#060c18]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-300">
              <School className="h-3.5 w-3.5" />
              Единая система для школ
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Учитель на доске — ученики в приложении
            </h2>
            <p className="mt-4 text-base text-slate-300 sm:text-lg">
              Больше никаких скучных лекций. Веб-платформа для учителя и мобильное приложение для учеников работают в живом тандеме.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 items-stretch">
            {/* Step 1: Teacher Dashboard */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 backdrop-blur-xl">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300">
                <School className="h-6 w-6" />
              </div>
              <span className="mt-5 inline-block text-xs font-black uppercase tracking-wider text-cyan-400">Шаг 1 • Учитель</span>
              <h3 className="mt-2 text-2xl font-black text-white">Запуск на проекторе</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Учитель открывает готовый интерактивный урок на компьютере, выводит теорию, формулы и симуляции на проектор или доску.
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-mono text-xs text-slate-300">
                <p className="text-cyan-300 font-bold">physics-ai.com/lesson</p>
                <p className="mt-1 text-slate-400">PIN класса: <span className="text-white font-bold tracking-widest">4812</span></p>
              </div>
            </div>

            {/* Step 2: Instant QR Bridge */}
            <div className="relative rounded-3xl border border-cyan-400/40 bg-gradient-to-b from-cyan-950/30 via-slate-900/40 to-slate-950/60 p-8 backdrop-blur-xl shadow-xl shadow-cyan-500/10">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950 font-black">
                <QrCode className="h-6 w-6" />
              </div>
              <span className="mt-5 inline-block text-xs font-black uppercase tracking-wider text-emerald-400">Шаг 2 • Подключение</span>
              <h3 className="mt-2 text-2xl font-black text-white">Вход по QR за 5 секунд</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Ученики сканируют QR-код на доске камерой смартфона и мгновенно подключаются к трансляции урока без регистрации и паролей.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-xs font-bold text-emerald-200">Весь класс подключен в один клик</p>
              </div>
            </div>

            {/* Step 3: Interactive Practice */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 backdrop-blur-xl">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-400/15 border border-indigo-400/30 text-indigo-300">
                <Smartphone className="h-6 w-6" />
              </div>
              <span className="mt-5 inline-block text-xs font-black uppercase tracking-wider text-indigo-400">Шаг 3 • Ученики</span>
              <h3 className="mt-2 text-2xl font-black text-white">Живая практика и тесты</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Ученики решают тесты прямо в телефоне, а учитель видит живые результаты класса и тепловую карту ошибок на экране доски.
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300">
                <div className="flex justify-between font-bold text-white mb-1.5">
                  <span>Статистика класса</span>
                  <span className="text-emerald-400">28/30 сдали</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full w-[93%] rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION: PRO SUBSCRIPTION ────────────────── */}
      <section id="pro" className="relative border-t border-white/[0.08] px-5 py-24 sm:px-8 lg:px-12 bg-[#091122]">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[38px] border border-amber-400/30 bg-gradient-to-br from-slate-900/90 via-[#0e172e]/90 to-slate-950/95 p-8 sm:p-14 shadow-2xl shadow-amber-500/5 backdrop-blur-2xl">
            {/* Background glowing orbs */}
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-amber-400/20">
                  <Trophy className="h-4 w-4 text-slate-950" />
                  Physics AI PRO
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Максимум возможностей для тех, кто хочет высший балл
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                  Бесплатная версия содержит всё необходимое для базовых уроков. Подписка PRO открывает неограниченную
                  генерацию тестов, круглосуточную помощь AI и углубленную подготовку к экзаменам.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 px-7 py-4 text-sm font-black text-slate-950 shadow-xl shadow-amber-400/20 transition hover:-translate-y-0.5"
                  >
                    <Download className="h-5 w-5" />
                    Попробовать PRO в приложении
                  </a>
                </div>
              </div>

              {/* Benefits list */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-md">
                <p className="text-sm font-black uppercase tracking-wider text-amber-300 mb-5">
                  Что входит в подписку PRO:
                </p>
                <ul className="space-y-4">
                  {proBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 mt-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-200 leading-snug">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION: DOWNLOAD BANNER ────────────────── */}
      <section className="relative border-t border-white/[0.08] px-5 py-24 sm:px-8 lg:px-12 bg-[#060c18]">
        <div className="mx-auto max-w-5xl text-center">
          <div className="relative overflow-hidden rounded-[40px] border border-cyan-400/30 bg-gradient-to-b from-[#0e1b33] to-[#081120] p-10 sm:p-16 shadow-2xl shadow-cyan-500/15">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.25),transparent_70%)] pointer-events-none" />

            <div className="relative z-10">
              <img
                src="/images/icon.png"
                alt="Physics AI App Logo"
                className="mx-auto h-20 w-20 rounded-3xl object-cover shadow-xl shadow-cyan-500/30 ring-2 ring-cyan-400/40"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
              <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-5xl">
                Скачайте Physics AI прямо сейчас
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                Приложение доступно бесплатно в Google Play. Начните решать задачи и понимать физику с первой минуты!
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 px-8 py-4 text-slate-950 shadow-2xl shadow-cyan-500/30 transition hover:-translate-y-1 hover:shadow-cyan-500/50"
                >
                  <GooglePlayIcon className="h-7 w-7 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Доступно в</p>
                    <p className="text-lg font-black leading-none">Google Play</p>
                  </div>
                  <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </a>

                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
                >
                  <School className="h-4 w-4 text-cyan-400" />
                  Открыть веб-кабинет учителя
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-300" /> 4.9 Оценка
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> Без рекламы
                </span>
                <span>•</span>
                <span className="text-emerald-300 font-bold">1 000+ загрузок</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#050912] px-5 py-12 text-slate-400 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/icon.png"
              alt="Physics AI Logo"
              className="h-8 w-8 rounded-xl object-cover ring-1 ring-white/20"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none'
              }}
            />
            <div>
              <p className="text-base font-black text-white">Physics AI</p>
              <p className="text-xs text-slate-400">Умная платформа и мобильное приложение по физике</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <Link to="/" className="text-slate-300 hover:text-cyan-300 transition">
              Главная страница
            </Link>
            <Link to="/lesson" className="text-slate-300 hover:text-cyan-300 transition">
              Уроки
            </Link>
            <Link to="/login" className="text-slate-300 hover:text-cyan-300 transition">
              Вход
            </Link>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition font-bold"
            >
              Google Play
            </a>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Physics AI. Все права защищены.
          </p>
        </div>
      </footer>
    </main>
  )
}
