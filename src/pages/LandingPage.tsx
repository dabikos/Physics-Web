import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useScroll,
  animate,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion'
import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import {
  BookOpen,
  ClipboardList,
  Sparkles,
  PlayCircle,
  Smartphone,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle2,
  QrCode,
  BarChart3,
  ChevronDown,
  Star,
  ArrowRight,
  Heart,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════
   CUSTOM HOOKS  (from ANIMATIONS_GUIDE.md)
   ═══════════════════════════════════════════════════ */

/* ───── animated counter ───── */
function useAnimatedCounter(target: number, duration = 2, startOnView = true) {
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (v) => Math.round(v))
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!startOnView || inView) {
      const c = animate(motionVal, target, { duration, ease: 'easeOut' })
      return c.stop
    }
  }, [inView, target, duration, startOnView, motionVal])

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v))
    return unsub
  }, [rounded])

  return { ref, display }
}

/* ───── 3D tilt hook (§2 3D Трансформации — tilt) ───── */
function use3DTilt(intensity = 15) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const shineX = useMotionValue(50)
  const shineY = useMotionValue(50)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      rotateX.set((y - 0.5) * -intensity)
      rotateY.set((x - 0.5) * intensity)
      shineX.set(x * 100)
      shineY.set(y * 100)
    },
    [intensity, rotateX, rotateY, shineX, shineY],
  )

  const handleMouseLeave = useCallback(() => {
    animate(rotateX, 0, { duration: 0.5, ease: 'easeOut' })
    animate(rotateY, 0, { duration: 0.5, ease: 'easeOut' })
    shineX.set(50)
    shineY.set(50)
  }, [rotateX, rotateY, shineX, shineY])

  return { ref, rotateX, rotateY, shineX, shineY, handleMouseMove, handleMouseLeave }
}

/* ───── typewriter hook (§6 Эффект печатания) ───── */
function useTypewriter(text: string, speed = 60, startOnView = true) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!startOnView || inView) {
      let i = 0
      setDisplayed('')
      setDone(false)
      const iv = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(iv); setDone(true) }
      }, speed)
      return () => clearInterval(iv)
    }
  }, [inView, text, speed, startOnView])

  return { ref, displayed, done }
}

/* ───── magnetic hook (§4 Магнитные кнопки) ───── */
function useMagnetic(strength = 0.3) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      x.set((e.clientX - (r.left + r.width / 2)) * strength)
      y.set((e.clientY - (r.top + r.height / 2)) * strength)
    },
    [strength, x, y],
  )

  const handleMouseLeave = useCallback(() => {
    animate(x, 0, { duration: 0.4, ease: 'easeOut' })
    animate(y, 0, { duration: 0.4, ease: 'easeOut' })
  }, [x, y])

  return { ref, x, y, handleMouseMove, handleMouseLeave }
}

/* ═══════════════════════════════════════════════════
   ANIMATION VARIANT PRESETS
   (§1 Scroll Animations, §8 Специальные анимации)
   ═══════════════════════════════════════════════════ */

/* stagger */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const staggerItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

/* §1 — directional fade-in variants */
type Dir = 'up' | 'down' | 'left' | 'right'
const fadeOffset: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: 50 },
  down: { x: 0, y: -50 },
  left: { x: 50, y: 0 },
  right: { x: -50, y: 0 },
}

/* §1 — scale-in */
const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

/* §1 — rotate-in */
const rotateInVariant = {
  hidden: { opacity: 0, rotate: -15, scale: 0.85 },
  visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

/* §1 — zoom-in (fast scale) */
const zoomInVariant = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
}

/* §1 — flip variants */
const flipInXVariant = {
  hidden: { opacity: 0, rotateX: 90 },
  visible: { opacity: 1, rotateX: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}
const flipInYVariant = {
  hidden: { opacity: 0, rotateY: 90 },
  visible: { opacity: 1, rotateY: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

/* §8 — special micro-animation keyframes */
const pulseAnimation = { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
const bounceAnimation = { y: [0, -12, 0, -6, 0], transition: { duration: 1.5, repeat: Infinity, ease: 'easeOut' } }
const heartbeatAnimation = { scale: [1, 1.15, 1, 1.1, 1], transition: { duration: 1.2, repeat: Infinity } }
const swingAnimation = { rotate: [0, 8, -8, 4, -4, 0], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
const waveAnimation = { rotate: [0, 14, -8, 14, -4, 10, 0], transition: { duration: 2.5, repeat: Infinity } }
const shakeAnimation = { x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.5 } }
const jelloAnimation = { skewX: [0, -12, 6, -4, 2, 0], skewY: [0, -12, 6, -4, 2, 0], transition: { duration: 0.9 } }

/* ═══════════════════════════════════════════════════
   DECORATIVE & WRAPPER COMPONENTS
   ═══════════════════════════════════════════════════ */

/* §7 — cursor glow follower */
function CursorGlow({ theme }: { theme: string }) {
  const cursorX = useMotionValue(-200)
  const cursorY = useMotionValue(-200)
  const glowX = useTransform(cursorX, (v) => v - 150)
  const glowY = useTransform(cursorY, (v) => v - 150)

  useEffect(() => {
    const move = (e: MouseEvent) => { cursorX.set(e.clientX); cursorY.set(e.clientY) }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [cursorX, cursorY])

  return (
    <motion.div
      className="fixed pointer-events-none z-[99] mix-blend-screen"
      style={{
        x: glowX, y: glowY, width: 300, height: 300, borderRadius: '50%',
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 40%, transparent 70%)',
        filter: 'blur(2px)',
      }}
      aria-hidden
    />
  )
}

/* §5 — floating particles */
function FloatingParticles({ count = 30, theme }: { count?: number; theme: string }) {
  const particles = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 4 + 1, duration: Math.random() * 20 + 15, delay: Math.random() * 10,
    })),
    [count],
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${theme === 'dark' ? 'bg-primary-400/20' : 'bg-primary-500/10'}`}
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -60, 20, -40, 0], x: [0, 30, -20, 10, 0], opacity: [0.2, 0.6, 0.3, 0.5, 0.2], scale: [1, 1.4, 0.8, 1.2, 1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

/* §5 — glow orbs (blob анимации) */
function GlowOrbs({ theme }: { theme: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div
        className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-primary-500/15' : 'bg-primary-400/10'}`}
        animate={{ x: [0, 60, -30, 0], y: [0, 40, -20, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] ${theme === 'dark' ? 'bg-accent-500/15' : 'bg-accent-400/8'}`}
        animate={{ x: [0, -50, 30, 0], y: [0, -30, 50, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute bottom-20 left-1/4 w-[350px] h-[350px] rounded-full blur-[100px] ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-400/8'}`}
        animate={{ x: [0, 40, -40, 0], y: [0, -50, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* §1 — directional blur reveal (fade-in-up / down / left / right + blur-in) */
function DirectionalReveal({
  children, className = '', delay = 0, direction = 'up',
}: {
  children: React.ReactNode; className?: string; delay?: number; direction?: Dir
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const off = fadeOffset[direction]

  return (
    <motion.div
      ref={ref} className={className}
      initial={{ opacity: 0, x: off.x, y: off.y, filter: 'blur(12px)' }}
      animate={inView ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

/* glassmorphism panel (§ Автоматические улучшения — Header glass morphism) */
function GlassPanel({ children, className = '', theme }: { children: React.ReactNode; className?: string; theme: string }) {
  return (
    <div className={`${className} ${
      theme === 'dark'
        ? 'bg-white/[0.06] border border-white/[0.12] shadow-lg shadow-black/10'
        : 'bg-white/70 border border-white/50 shadow-lg shadow-slate-200/40'
    } backdrop-blur-xl rounded-2xl`}>
      {children}
    </div>
  )
}

/* §6 — neon-glow heading */
function NeonHeading({ children, className = '', theme }: { children: React.ReactNode; className?: string; theme: string }) {
  return (
    <motion.h2
      className={`${className} relative`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        className="inline-block"
        animate={{
          textShadow: theme === 'dark'
            ? ['0 0 10px rgba(99,102,241,0.3), 0 0 40px rgba(99,102,241,0.1)', '0 0 20px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2)', '0 0 10px rgba(99,102,241,0.3), 0 0 40px rgba(99,102,241,0.1)']
            : ['0 0 10px rgba(99,102,241,0.1)', '0 0 25px rgba(99,102,241,0.2)', '0 0 10px rgba(99,102,241,0.1)'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.span>
    </motion.h2>
  )
}

/* §4 — magnetic button wrapper */
function MagneticButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, x, y, handleMouseMove, handleMouseLeave } = useMagnetic(0.35)
  return (
    <motion.div ref={ref} className={`inline-block ${className}`} style={{ x, y }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
      {children}
    </motion.div>
  )
}

/* §7 — ripple click effect */
function RippleButton({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const nid = useRef(0)

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const id = nid.current++
    setRipples((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples((p) => p.filter((v) => v.id !== id)), 700)
    onClick?.()
  }, [onClick])

  return (
    <div className={`relative overflow-hidden inline-block ${className}`} onClick={handleClick}>
      {children}
      {ripples.map((r) => (
        <motion.span key={r.id} className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x, top: r.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
          initial={{ scale: 0, opacity: 0.7 }} animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }} />
      ))}
    </div>
  )
}

/* §2+§4 — 3D tilt card + card-shine hover */
function TiltCard({
  children, className = '', theme, gradient,
}: {
  children: React.ReactNode; className?: string; theme: string; gradient?: string
}) {
  const { ref, rotateX, rotateY, shineX, shineY, handleMouseMove, handleMouseLeave } = use3DTilt(12)
  const shineBg = useTransform(
    [shineX, shineY] as const,
    ([sx, sy]: number[]) =>
      `radial-gradient(circle at ${sx}% ${sy}%, ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'} 0%, transparent 60%)`,
  )

  return (
    <motion.div ref={ref} className={`group relative overflow-hidden ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 800, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      whileHover={{ y: -6, scale: 1.02 }}>
      <motion.div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: shineBg }} />
      {gradient && <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded-2xl z-10`} />}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

/* §2 — flip card (front / back) */
function FlipCard({
  front, back, className = '',
}: {
  front: React.ReactNode; back: React.ReactNode; className?: string
}) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className={`relative cursor-pointer ${className}`} style={{ perspective: 800 }}
      onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)}>
      <motion.div style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        {/* front */}
        <div style={{ backfaceVisibility: 'hidden' }}>{front}</div>
        {/* back */}
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {back}
        </div>
      </motion.div>
    </div>
  )
}

/* §3 — gradient border pulse */
function GradientBorderPulse({ children, className = '', active = true }: { children: React.ReactNode; className?: string; active?: boolean }) {
  if (!active) return <div className={className}>{children}</div>
  return (
    <div className={`relative ${className}`}>
      <motion.div className="absolute -inset-[2px] rounded-3xl z-0"
        style={{ background: 'linear-gradient(135deg, #6366F1, #EC4899, #8B5CF6, #6366F1)', backgroundSize: '300% 300%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
      <div className="relative z-10 rounded-3xl">{children}</div>
    </div>
  )
}

/* §5 — parallax wrapper */
function ParallaxSection({ children, className = '', speed = 0.3 }: { children: React.ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100])
  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}

/* §9 — shimmer overlay for cards */
function ShimmerOverlay({ theme }: { theme: string }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none rounded-2xl overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.3)'} 50%, transparent 100%)`,
          width: '200%',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

/* §9 — typing indicator dots */
function TypingIndicator({ theme }: { theme: string }) {
  const dotColor = theme === 'dark' ? 'bg-primary-400' : 'bg-primary-500'
  return (
    <span className="inline-flex items-center gap-1 ml-2 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════ */

const strings = {
  navFeatures: 'Возможности', navHow: 'Как работает', navApp: 'Приложение',
  navPricing: 'Тарифы', navFaq: 'FAQ', navContacts: 'Контакты',
  heroEyebrow: 'Платформа для уроков физики',
  heroTitle: 'Интерактивные уроки за 15 минут',
  heroSubtitle: 'Готовые темы, задачи, симуляции, тесты и AI‑помощник. Учитель управляет уроком, ученики видят всё в приложении.',
  ctaPrimary: 'Попробовать бесплатно', ctaSecondary: 'Смотреть возможности',
  sectionFeatures: 'Что есть на сайте', sectionHow: 'Как проходит урок',
  sectionApp: 'Приложение для учеников', sectionPricing: 'Тарифы',
  sectionFaq: 'Частые вопросы', sectionContacts: 'Контакты',
  appTitle: 'Всё для ученика — в одном приложении',
  appDesc: 'Ученики видят трансляцию, отвечают на тесты, решают задачи и получают объяснения по теме урока.',
  contactDesc: 'Остались вопросы? Напишите — поможем подключиться и провести первый урок.',
  footerNote: '© Physics AI. Все права защищены.',
}

const statsData = [
  { label: 'Тем в библиотеке', numericValue: 86, suffix: '+' },
  { label: 'Интерактивные задачи', numericValue: 1000, suffix: '+' },
  { label: 'Симуляции', numericValue: 24, suffix: '' },
  { label: 'AI‑подсказки', numericValue: 24, suffix: '/7' },
]

const features = [
  { title: 'Библиотека тем', description: 'Готовые темы, теория, формулы и примеры для уроков.', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', backText: 'Более 86 готовых тем по всем разделам школьной физики.' },
  { title: 'Интерактивные задачи', description: 'Пошаговые решения, латекс и автопроверка.', icon: ClipboardList, gradient: 'from-orange-500 to-amber-500', backText: '1000+ задач с подробными пошаговыми решениями.' },
  { title: 'Симуляции', description: 'Наглядные демонстрации для формирования понятий.', icon: PlayCircle, gradient: 'from-purple-500 to-pink-500', backText: 'Реалистичные физические эксперименты в браузере.' },
  { title: 'AI‑помощник', description: 'Объясняет сложные темы простым языком.', icon: Sparkles, gradient: 'from-violet-500 to-fuchsia-500', backText: 'ИИ объяснит любую тему на языке ученика.' },
  { title: 'Подключение по QR', description: 'Быстрое подключение класса через QR или PIN‑код.', icon: QrCode, gradient: 'from-emerald-500 to-teal-500', backText: 'Класс подключается за 30 секунд через телефон.' },
  { title: 'Тесты и аналитика', description: 'Автоматическая проверка и отчёты по результатам.', icon: BarChart3, gradient: 'from-rose-500 to-red-500', backText: 'Мгновенные отчёты по каждому ученику класса.' },
]

const steps = [
  { title: 'Соберите урок', text: 'Выберите темы, добавьте теорию, формулы и задачи.' },
  { title: 'Подключите учеников', text: 'Сгенерируйте PIN или QR и пригласите класс.' },
  { title: 'Проведите урок', text: 'Транслируйте материал и управляйте шагами.' },
  { title: 'Получите результаты', text: 'Соберите ответы и аналитику по тестам.' },
]

const appBenefits = [
  'Просмотр трансляции и слайдов', 'Ответы на тесты и задачи',
  'AI‑объяснения по темам урока', 'Доступ к формулам и подсказкам',
]

const pricing = [
  { name: 'Старт', price: '0₸', period: 'для знакомства', features: ['Доступ к библиотеке тем', '3 симуляции', 'Базовые тесты'], cta: 'Начать', highlight: false },
  { name: 'Профи', price: '29 900₸', period: 'в месяц', features: ['Все темы и симуляции', 'AI‑объяснения и задачи', 'Отчёты по классу', 'Подключение по QR'], cta: 'Выбрать', highlight: true },
  { name: 'Школа', price: 'по запросу', period: 'для всей школы', features: ['Мульти‑классы', 'Админ‑панель', 'Обучение учителей', 'Приоритетная поддержка'], cta: 'Связаться', highlight: false },
]

const reviews = [
  { name: 'Алина, учитель физики', text: 'Собрала урок за 10 минут. Дети в восторге от симуляций.', stars: 5 },
  { name: 'Данияр, методист', text: 'Отчёты по тестам экономят много времени на проверке.', stars: 5 },
  { name: 'Айгерим, классный руководитель', text: 'Понравилось, что ученики сразу видят материал в приложении.', stars: 4 },
]

const faqs = [
  { q: 'Нужна ли установка на компьютеры?', a: 'Нет, учитель работает в браузере, ученики подключаются через приложение.' },
  { q: 'Можно ли добавить свои темы?', a: 'Да, учитель может создавать свои уроки и шаблоны.' },
  { q: 'Как подключить класс?', a: 'Сгенерируйте PIN или QR — ученики подключатся за минуту.' },
  { q: 'Есть ли поддержка?', a: 'Да, мы помогаем с запуском и обучаем работе с платформой.' },
]

const contacts = [
  { label: 'support@physics.ai', icon: Mail },
  { label: '+7 (900) 000‑00‑00', icon: Phone },
  { label: '@physics_ai', icon: MessageCircle },
]

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

/* stat card — scale-in (§1) + shimmer (§9) */
function StatCard({ item, theme }: { item: (typeof statsData)[number]; theme: string }) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelStrong = theme === 'dark' ? 'bg-white/10 border border-white/15' : 'bg-white border border-slate-200'
  const { ref, display } = useAnimatedCounter(item.numericValue, 2)

  return (
    <motion.div
      variants={scaleInVariant}
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative rounded-2xl px-4 py-4 ${panelStrong} backdrop-blur-sm transition-shadow hover:shadow-xl hover:shadow-primary-500/10 cursor-default overflow-hidden`}
    >
      <ShimmerOverlay theme={theme} />
      <span ref={ref} className={`text-2xl font-bold ${textColor}`}>{display}{item.suffix}</span>
      <div className={`text-xs mt-1 ${textMuted}`}>{item.label}</div>
    </motion.div>
  )
}

/* FAQ accordion item — glassmorphism, swing chevron (§8) */
function FaqItem({ item, theme }: { item: (typeof faqs)[number]; theme: string }) {
  const [open, setOpen] = useState(false)
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'

  return (
    <motion.div variants={staggerItem} className="cursor-pointer"
      onClick={() => setOpen(!open)} whileHover={{ scale: 1.01 }}>
      <GlassPanel theme={theme} className="p-6 transition-shadow hover:shadow-lg hover:shadow-primary-500/5">
        <div className="flex items-center justify-between gap-3">
          <h3 className={`text-base font-semibold ${textColor}`}>{item.q}</h3>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            whileHover={swingAnimation}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={18} className={textMuted} />
          </motion.div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.p
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
              className={`text-sm ${textMuted} overflow-hidden`}
            >{item.a}</motion.p>
          )}
        </AnimatePresence>
      </GlassPanel>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function LandingPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const prefersReduced = useReducedMotion()

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'
  const accent = theme === 'dark' ? 'text-primary-300' : 'text-primary-700'

  /* scroll progress (§7) */
  const [scrollY, setScrollY] = useState(0)
  const handleScroll = useCallback(() => setScrollY(window.scrollY), [])
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  const scrollProgress = typeof document !== 'undefined'
    ? Math.min(scrollY / (document.body.scrollHeight - window.innerHeight || 1), 1) : 0

  /* hero typewriter (§6) */
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })
  const { ref: twRef, displayed: twDisplayed, done: twDone } = useTypewriter('за 15 минут', 80)

  /* if user prefers reduced motion, skip heavy animations */

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* §7 scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 z-[100]"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* §7 cursor glow */}
      {!prefersReduced && <CursorGlow theme={theme} />}

      {/* §5 background effects */}
      <GlowOrbs theme={theme} />
      <FloatingParticles count={25} theme={theme} />

      <div className="relative max-w-[1200px] mx-auto px-6 pb-20 pt-10 lg:px-8">

        {/* ────────────────── HEADER (glassmorphism §auto) ────────────────── */}
        <motion.header
          className="flex flex-wrap items-center justify-between gap-6 mb-14"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3 group cursor-default">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-500/30"
              whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >PH</motion.div>
            <div>
              <div className={`text-lg font-semibold ${textColor}`}>Physics AI</div>
              <div className={`text-sm ${textMuted}`}>{strings.heroEyebrow}</div>
            </div>
          </div>

          {/* nav with underline hover (§auto Navigation) */}
          <nav className="flex flex-wrap items-center gap-5 text-sm">
            {[
              { href: '#features', label: strings.navFeatures },
              { href: '#how', label: strings.navHow },
              { href: '#app', label: strings.navApp },
              { href: '#pricing', label: strings.navPricing },
              { href: '#faq', label: strings.navFaq },
              { href: '#contacts', label: strings.navContacts },
            ].map((link) => (
              <motion.a key={link.href} className={`relative ${textMuted} transition-colors`}
                href={link.href} whileHover={{ y: -2 }}>
                {link.label}
                <motion.span className="absolute -bottom-1 left-0 h-0.5 bg-primary-400 rounded-full"
                  initial={{ width: 0 }} whileHover={{ width: '100%' }} transition={{ duration: 0.25 }} />
              </motion.a>
            ))}
          </nav>

          {/* buttons — magnetic + ripple (§4, §7) */}
          <div className="flex items-center gap-3">
            {user ? (
              <MagneticButton>
                <RippleButton onClick={() => { window.location.href = '/lesson' }}>
                  <Button variant="primary">Войти в кабинет</Button>
                </RippleButton>
              </MagneticButton>
            ) : (
              <>
                <MagneticButton>
                  <RippleButton onClick={() => { window.location.href = '/login' }}>
                    <Button variant="secondary">Войти</Button>
                  </RippleButton>
                </MagneticButton>
                <MagneticButton>
                  <RippleButton onClick={() => { window.location.href = '/register' }}>
                    <Button variant="primary">Создать аккаунт</Button>
                  </RippleButton>
                </MagneticButton>
              </>
            )}
          </div>
        </motion.header>

        {/* ────────────────── HERO ────────────────── */}
        <section ref={heroRef} className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center mb-24 relative">
          <div>
            {/* eyebrow — fade-in-left (§1) */}
            <motion.div
              className={`inline-block text-xs uppercase tracking-[0.3em] ${accent} mb-3 px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-primary-50 border border-primary-200'}`}
              initial={{ opacity: 0, x: -30 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >{strings.heroEyebrow}</motion.div>

            {/* §6 typewriter hero + §3 animated gradient text */}
            <motion.h1 className="text-4xl lg:text-6xl font-bold mb-5 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}>
              <span className={textColor}>Интерактивные уроки{' '}</span>
              <span ref={twRef}>
                <motion.span
                  className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-500 bg-clip-text text-transparent inline-block"
                  style={{ backgroundSize: '200% 100%' }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                >{twDisplayed}</motion.span>
                {!twDone && (
                  <motion.span className={accent}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}>|</motion.span>
                )}
              </span>
            </motion.h1>

            {/* subtitle — blur-in (§6) */}
            <motion.p
              className={`text-lg leading-relaxed ${textMuted} mb-8 max-w-lg`}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={heroInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
            >{strings.heroSubtitle}</motion.p>

            {/* CTA — magnetic (§4) + ripple (§7) + pulse (§8) */}
            <motion.div className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.45 }}>
              <MagneticButton>
                <motion.div animate={pulseAnimation}>
                  <RippleButton onClick={() => { window.location.href = '/register' }}>
                    <Button variant="primary">
                      <span className="flex items-center gap-2">{strings.ctaPrimary} <ArrowRight size={16} /></span>
                    </Button>
                  </RippleButton>
                </motion.div>
              </MagneticButton>
              <MagneticButton>
                <a href="#features"><Button variant="secondary">{strings.ctaSecondary}</Button></a>
              </MagneticButton>
            </motion.div>

            {/* stats — scale-in (§1) + shimmer (§9) */}
            <motion.div className="grid grid-cols-2 gap-4 mt-10"
              variants={staggerContainer} initial="hidden"
              animate={heroInView ? 'visible' : 'hidden'}>
              {statsData.map((item) => <StatCard key={item.label} item={item} theme={theme} />)}
            </motion.div>
          </div>

          {/* hero right panel — flip cards (§2) + floating (§8) + glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: 10 }}
            animate={heroInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}>
            <GlassPanel theme={theme} className="p-6">
              <motion.div className="grid grid-cols-2 gap-4"
                animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                {[
                  { label: 'Уроки', title: 'Сценарий урока', desc: 'Готовые темы и шаблоны', backDesc: 'Более 50 шаблонов уроков', grad: 'from-primary-500/20 via-primary-500/10 to-transparent', tag: 'text-primary-300' },
                  { label: 'Тесты', title: 'Отслеживание', desc: 'Результаты и аналитика', backDesc: 'Моментальные отчёты по классу', grad: 'from-emerald-400/20 via-emerald-400/10 to-transparent', tag: 'text-emerald-300' },
                  { label: 'Симуляции', title: 'Наглядность', desc: 'Интерактив на уроке', backDesc: '24 интерактивных эксперимента', grad: 'from-sky-400/20 via-sky-400/10 to-transparent', tag: 'text-sky-300' },
                  { label: 'AI', title: 'Помощь', desc: 'Быстрые ответы и подсказки', backDesc: 'ИИ работает 24/7 для учеников', grad: 'from-fuchsia-400/20 via-fuchsia-400/10 to-transparent', tag: 'text-fuchsia-300' },
                ].map((card, i) => (
                  <motion.div key={card.label}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}>
                    <FlipCard className="h-full"
                      front={
                        <div className={`rounded-2xl bg-gradient-to-br ${card.grad} p-4 h-full`}>
                          <div className={`text-xs uppercase tracking-widest ${card.tag}`}>{card.label}</div>
                          <div className={`text-lg font-semibold ${textColor} mt-2`}>{card.title}</div>
                          <div className={`text-sm ${textMuted} mt-2`}>{card.desc}</div>
                        </div>
                      }
                      back={
                        <div className={`rounded-2xl bg-gradient-to-br ${card.grad} p-4 h-full flex flex-col items-center justify-center text-center`}>
                          <motion.div animate={heartbeatAnimation}>
                            <Sparkles className={card.tag} size={28} />
                          </motion.div>
                          <div className={`text-sm font-medium ${textColor} mt-3`}>{card.backDesc}</div>
                        </div>
                      }
                    />
                  </motion.div>
                ))}
              </motion.div>
            </GlassPanel>
          </motion.div>

          {/* bounce scroll indicator (§8) */}
          <motion.div className="absolute -bottom-12 left-1/2 -translate-x-1/2 hidden lg:block"
            animate={bounceAnimation}>
            <ChevronDown size={24} className={textMuted} />
          </motion.div>
        </section>

        {/* ────────────────── FEATURES — 3D tilt + card-shine + flip (§2, §4) ────────────────── */}
        <ParallaxSection speed={0.15} className="mb-24">
          <DirectionalReveal direction="up">
            <section id="features">
              <NeonHeading theme={theme} className={`text-3xl font-bold ${textColor} mb-10 text-center`}>
                {strings.sectionFeatures}
              </NeonHeading>

              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainer} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}>
                {features.map((item, idx) => (
                  <motion.div key={item.title} variants={idx % 2 === 0 ? flipInYVariant : staggerItem}>
                    <TiltCard theme={theme} gradient={item.gradient}
                      className={`rounded-2xl ${panelBg} backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-primary-500/10 h-full`}>
                      <FlipCard className="h-full"
                        front={
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <motion.div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg`}
                                whileHover={jelloAnimation}
                                transition={{ duration: 0.4 }}
                              ><item.icon size={24} /></motion.div>
                              <h3 className={`text-xl font-semibold ${textColor}`}>{item.title}</h3>
                            </div>
                            <p className={`leading-relaxed ${textMuted}`}>{item.description}</p>
                          </div>
                        }
                        back={
                          <div className={`p-6 h-full flex flex-col items-center justify-center text-center rounded-2xl bg-gradient-to-br ${item.gradient} bg-opacity-10`}>
                            <motion.div animate={pulseAnimation}>
                              <item.icon size={36} className="text-white mb-3" />
                            </motion.div>
                            <p className={`text-sm font-medium ${textColor}`}>{item.backText}</p>
                          </div>
                        }
                      />
                    </TiltCard>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          </DirectionalReveal>
        </ParallaxSection>

        {/* ────────────────── HOW IT WORKS — rotate-in step numbers (§1), alternating directions ────────────────── */}
        <ParallaxSection speed={0.1} className="mb-24">
          <DirectionalReveal direction="left">
            <section id="how">
              <NeonHeading theme={theme} className={`text-3xl font-bold ${textColor} mb-10 text-center`}>
                {strings.sectionHow}
              </NeonHeading>

              <div className="relative">
                {/* connecting line */}
                <div className="hidden lg:block absolute top-14 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-0.5">
                  <motion.div
                    className={`h-full ${theme === 'dark' ? 'bg-gradient-to-r from-primary-500/40 via-primary-500/60 to-primary-500/40' : 'bg-gradient-to-r from-primary-300/40 via-primary-300/60 to-primary-300/40'}`}
                    initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }}
                    style={{ transformOrigin: 'left' }} />
                </div>

                <motion.div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10"
                  variants={staggerContainer} initial="hidden" whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}>
                  {steps.map((step, index) => {
                    /* alternate fade directions: left, right, left, right */
                    const dirs: Dir[] = ['left', 'right', 'left', 'right']
                    return (
                      <DirectionalReveal key={step.title} direction={dirs[index]} delay={index * 0.1}>
                        <div className={`p-6 h-full rounded-2xl backdrop-blur-xl transition-all hover:shadow-xl hover:shadow-primary-500/10 ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-white/70'}`}>
                          <motion.div whileHover={{ y: -8, scale: 1.03 }}>
                            <div className="flex items-center gap-3 mb-4">
                              {/* rotate-in number (§1) */}
                              <motion.div
                                className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30"
                                variants={rotateInVariant}
                                initial="hidden" whileInView="visible" viewport={{ once: true }}
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                transition={{ duration: 0.5 }}
                              >{index + 1}</motion.div>
                              <h3 className={`text-lg font-semibold ${textColor}`}>{step.title}</h3>
                            </div>
                            <p className={`leading-relaxed ${textMuted}`}>{step.text}</p>
                          </motion.div>
                        </div>
                      </DirectionalReveal>
                    )
                  })}
                </motion.div>
              </div>
            </section>
          </DirectionalReveal>
        </ParallaxSection>

        {/* ────────────────── APP — fade-in-right, typing indicator (§9) ────────────────── */}
        <ParallaxSection speed={0.12} className="mb-24">
          <DirectionalReveal direction="right">
            <section id="app" className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div>
                <motion.div
                  className={`inline-block text-xs uppercase tracking-[0.3em] ${accent} mb-3 px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-primary-50 border border-primary-200'}`}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5 }}
                >{strings.sectionApp}</motion.div>

                <NeonHeading theme={theme} className={`text-3xl font-bold ${textColor} mb-4`}>
                  {strings.appTitle}
                </NeonHeading>

                {/* description with typing indicator for AI mention (§9) */}
                <motion.p className={`leading-relaxed ${textMuted} mb-6`}
                  initial={{ opacity: 0, y: 15, filter: 'blur(6px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                  {strings.appDesc}
                  <TypingIndicator theme={theme} />
                </motion.p>

                {/* benefits — hover-grow (§4) + wave icon (§8) */}
                <motion.ul className="space-y-3" variants={staggerContainer}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {appBenefits.map((benefit, idx) => (
                    <motion.li key={benefit} variants={staggerItem}
                      className={`flex items-start gap-3 ${textMuted}`}
                      whileHover={{ x: 6, scale: 1.02 }} transition={{ duration: 0.2 }}>
                      <motion.div whileHover={idx === 2 ? waveAnimation : { scale: 1.3, rotate: 20 }}>
                        <CheckCircle2 className="text-primary-400" size={20} />
                      </motion.div>
                      <span>{benefit}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              {/* phone mockup — glassmorphism + floating (§8) */}
              <DirectionalReveal direction="right" delay={0.2}>
                <GlassPanel theme={theme} className="p-6">
                  <motion.div
                    className="rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 p-6 shadow-2xl shadow-primary-500/10"
                    animate={prefersReduced ? {} : { y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                    <div className="flex items-center justify-between mb-4">
                      <motion.div className="text-white font-semibold"
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                        viewport={{ once: true }} transition={{ delay: 0.4 }}>
                        Physics AI
                      </motion.div>
                      <motion.div whileHover={shakeAnimation}>
                        <Smartphone className="text-white/70" size={20} />
                      </motion.div>
                    </div>
                    <motion.div className="rounded-2xl bg-white/10 p-4 mb-4 hover:bg-white/15 transition-colors cursor-default"
                      whileHover={{ scale: 1.03 }}>
                      <div className="text-white text-lg font-semibold mb-2">Урок сегодня</div>
                      <div className="text-white/70 text-sm">Физика — наука о природе</div>
                    </motion.div>
                    <motion.div className="rounded-2xl bg-white/10 p-4 hover:bg-white/15 transition-colors cursor-default"
                      whileHover={{ scale: 1.03 }}>
                      <div className="text-white/80 text-sm mb-1">Тесты</div>
                      <div className="flex items-center gap-3">
                        <div className="text-white font-semibold">Пройдено 7/10</div>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full"
                            initial={{ width: 0 }} whileInView={{ width: '70%' }}
                            viewport={{ once: true }} transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }} />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </GlassPanel>
              </DirectionalReveal>
            </section>
          </DirectionalReveal>
        </ParallaxSection>

        {/* ────────────────── PRICING — gradient border pulse (§3), animated gradient bg (§3), zoom-in (§1) ────────────────── */}
        <ParallaxSection speed={0.08} className="mb-24">
          <DirectionalReveal direction="down">
            <section id="pricing">
              <NeonHeading theme={theme} className={`text-3xl font-bold ${textColor} mb-10 text-center`}>
                {strings.sectionPricing}
              </NeonHeading>

              <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                variants={staggerContainer} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}>
                {pricing.map((plan) => {
                  const cardContent = (
                    <GlassPanel theme={theme}
                      className={`p-6 relative overflow-hidden transition-all h-full ${plan.highlight ? 'shadow-xl shadow-primary-500/10' : ''}`}>
                      {/* §3 animated gradient bg on highlighted */}
                      {plan.highlight && (
                        <motion.div className="absolute inset-0 rounded-2xl z-0"
                          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.05), rgba(139,92,246,0.05))', backgroundSize: '200% 200%' }}
                          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 5, repeat: Infinity }} />
                      )}
                      {/* shimmer on highlighted (§9) */}
                      {plan.highlight && <ShimmerOverlay theme={theme} />}

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-xl font-semibold ${textColor}`}>{plan.name}</h3>
                          {plan.highlight && (
                            <motion.span className="text-xs uppercase tracking-widest text-primary-300 px-2 py-1 bg-primary-500/10 rounded-full"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}>
                              Выбор школ
                            </motion.span>
                          )}
                        </div>
                        <div className={`text-3xl font-bold ${textColor}`}>{plan.price}</div>
                        <div className={`text-sm ${textMuted} mb-4`}>{plan.period}</div>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="text-primary-400" size={16} />
                              <span className={textMuted}>{feat}</span>
                            </li>
                          ))}
                        </ul>
                        <MagneticButton className="w-full">
                          <RippleButton className="w-full">
                            <Button variant={plan.highlight ? 'primary' : 'secondary'} className="w-full">{plan.cta}</Button>
                          </RippleButton>
                        </MagneticButton>
                      </div>
                    </GlassPanel>
                  )

                  return (
                    <motion.div key={plan.name} variants={plan.highlight ? zoomInVariant : staggerItem}
                      whileHover={{ y: -8, scale: 1.02 }}>
                      {plan.highlight
                        ? <GradientBorderPulse>{cardContent}</GradientBorderPulse>
                        : cardContent}
                    </motion.div>
                  )
                })}
              </motion.div>
            </section>
          </DirectionalReveal>
        </ParallaxSection>

        {/* ────────────────── REVIEWS — 3D tilt (§2), fade-in-right (§1), jello hover (§8) ────────────────── */}
        <ParallaxSection speed={0.1} className="mb-24">
          <DirectionalReveal direction="right">
            <section>
              <NeonHeading theme={theme} className={`text-3xl font-bold ${textColor} mb-10 text-center`}>
                Отзывы
              </NeonHeading>

              <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={staggerContainer} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}>
                {reviews.map((item) => (
                  <motion.div key={item.name} variants={flipInXVariant}>
                    <TiltCard theme={theme}
                      className={`rounded-2xl p-6 ${panelBg} backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-primary-500/5`}>
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <motion.div key={i}
                            initial={{ opacity: 0, scale: 0, rotate: -90 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}>
                            <Star size={16} className={i < item.stars ? 'text-yellow-400 fill-yellow-400' : textMuted} />
                          </motion.div>
                        ))}
                      </div>
                      <p className={`text-sm leading-relaxed ${textMuted} mb-4`}>&ldquo;{item.text}&rdquo;</p>
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-semibold ${textColor}`}>{item.name}</div>
                        <motion.span whileHover={waveAnimation} className="inline-block cursor-default">
                          <Heart size={14} className="text-rose-400 fill-rose-400" />
                        </motion.span>
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          </DirectionalReveal>
        </ParallaxSection>

        {/* ────────────────── FAQ — glassmorphism, swing (§8) ────────────────── */}
        <ParallaxSection speed={0.06} className="mb-24">
          <DirectionalReveal direction="up">
            <section id="faq">
              <NeonHeading theme={theme} className={`text-3xl font-bold ${textColor} mb-10 text-center`}>
                {strings.sectionFaq}
              </NeonHeading>

              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto"
                variants={staggerContainer} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}>
                {faqs.map((item) => <FaqItem key={item.q} item={item} theme={theme} />)}
              </motion.div>
            </section>
          </DirectionalReveal>
        </ParallaxSection>

        {/* ────────────────── CONTACTS — glassmorphism, heartbeat icon (§8) ────────────────── */}
        <DirectionalReveal direction="down" className="mb-12">
          <section id="contacts">
            <GlassPanel theme={theme} className="p-8 relative overflow-hidden">
              <motion.div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 6, repeat: Infinity }} />
              <div className="relative z-10">
                <NeonHeading theme={theme} className={`text-3xl font-bold ${textColor} mb-4`}>
                  {strings.sectionContacts}
                </NeonHeading>
                <motion.p className={`mb-6 ${textMuted}`}
                  initial={{ opacity: 0, filter: 'blur(6px)' }}
                  whileInView={{ opacity: 1, filter: 'blur(0px)' }}
                  viewport={{ once: true }} transition={{ delay: 0.2 }}>
                  {strings.contactDesc}
                </motion.p>
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {contacts.map((item, idx) => (
                    <motion.div key={item.label} variants={staggerItem}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-default ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                      whileHover={{ x: 4, scale: 1.02 }}>
                      <motion.div whileHover={idx === 0 ? heartbeatAnimation : idx === 1 ? shakeAnimation : waveAnimation}>
                        <item.icon className="text-primary-300" size={20} />
                      </motion.div>
                      <span className={textMuted}>{item.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </GlassPanel>
          </section>
        </DirectionalReveal>

        {/* ────────────────── FOOTER — wave (§8) ────────────────── */}
        <motion.footer
          className={`text-xs ${textMuted} text-center pt-8 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.3 }}>
          <span>{strings.footerNote}</span>
          <motion.span className="inline-block ml-2" animate={waveAnimation}>👋</motion.span>
        </motion.footer>
      </div>
    </div>
  )
}
