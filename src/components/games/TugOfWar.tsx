import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Trophy,
  RotateCcw,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  Users,
  Bot,
  Swords,
  Sparkles,
  ShieldAlert,
  Gauge,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

/* ═════════════════════════════════════════════════════════════════
   SOUND SYNTHESIZER (Web Audio API - Zero External Dependencies)
   ═════════════════════════════════════════════════════════════════ */
class SoundEngine {
  private ctx: AudioContext | null = null
  public enabled = true

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  playCorrect() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12) // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.22) // C6

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.35)
  }

  playWrong() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.linearRampToValueAtTime(110, now + 0.18)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.25)
  }

  playPull() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.22)
  }

  playVictory() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.12
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.45)
    })
  }
}

const sounds = new SoundEngine()

/* ═════════════════════════════════════════════════════════════════
   PHYSICS QUESTIONS DATABASE & GENERATOR
   ═════════════════════════════════════════════════════════════════ */
export type QuestionCategory = 'all' | 'mechanics' | 'electric' | 'thermo' | 'units'

interface PhysicsQuestion {
  question: string
  formulaBadge?: string
  options: string[]
  correctIndex: number
  explanation: string
  category: QuestionCategory
}

const QUESTION_BANK: PhysicsQuestion[] = [
  // --- Механика ---
  {
    question: 'Тело массой 4 кг ускоряется с a = 3 м/с². Чему равна сила F?',
    formulaBadge: 'F = m · a',
    options: ['12 Н', '7 Н', '1.3 Н', '24 Н'],
    correctIndex: 0,
    explanation: 'F = 4 кг · 3 м/с² = 12 Н',
    category: 'mechanics',
  },
  {
    question: 'Автомобиль проехал 180 м за 6 секунд. Какова средняя скорость?',
    formulaBadge: 'v = s / t',
    options: ['30 м/с', '25 м/с', '108 м/с', '18 м/с'],
    correctIndex: 0,
    explanation: 'v = 180 / 6 = 30 м/с',
    category: 'mechanics',
  },
  {
    question: 'Тележка массой 2 кг движется со скоростью 5 м/с. Каков её импульс p?',
    formulaBadge: 'p = m · v',
    options: ['10 кг·м/с', '2.5 кг·м/с', '7 кг·м/с', '25 кг·м/с'],
    correctIndex: 0,
    explanation: 'p = 2 · 5 = 10 кг·м/с',
    category: 'mechanics',
  },
  {
    question: 'Сила 15 Н переместила груз на 4 метра. Какая работа совершена?',
    formulaBadge: 'A = F · s',
    options: ['60 Дж', '19 Дж', '3.75 Дж', '120 Дж'],
    correctIndex: 0,
    explanation: 'A = 15 · 4 = 60 Дж',
    category: 'mechanics',
  },
  {
    question: 'Груз массой 3 кг поднят на высоту 5 м (g = 10 м/с²). Какова потенциальная энергия?',
    formulaBadge: 'E_p = m · g · h',
    options: ['150 Дж', '15 Дж', '80 Дж', '300 Дж'],
    correctIndex: 0,
    explanation: 'E_p = 3 · 10 · 5 = 150 Дж',
    category: 'mechanics',
  },
  {
    question: 'Как изменится кинетическая энергия тела, если его скорость удвоится?',
    formulaBadge: 'E_k = (m·v²)/2',
    options: ['Увеличится в 4 раза', 'Увеличится в 2 раза', 'Не изменится', 'Уменьшится в 2 раза'],
    correctIndex: 0,
    explanation: 'Кинетическая энергия пропорциональна квадрату скорости: (2v)² = 4v²',
    category: 'mechanics',
  },

  // --- Электричество ---
  {
    question: 'Напряжение в цепи U = 24 В, сопротивление R = 8 Ом. Какова сила тока I?',
    formulaBadge: 'I = U / R',
    options: ['3 А', '192 А', '0.33 А', '16 А'],
    correctIndex: 0,
    explanation: 'I = 24 / 8 = 3 А (Закон Ома)',
    category: 'electric',
  },
  {
    question: 'Сила тока 2 А, напряжение 220 В. Какова мощность потребителя P?',
    formulaBadge: 'P = U · I',
    options: ['440 Вт', '110 Вт', '222 Вт', '880 Вт'],
    correctIndex: 0,
    explanation: 'P = 220 · 2 = 440 Вт',
    category: 'electric',
  },
  {
    question: 'Два одинаковых резистора по 10 Ом соединены последовательно. Чему равно R_общ?',
    formulaBadge: 'R_посл = R₁ + R₂',
    options: ['20 Ом', '5 Ом', '10 Ом', '100 Ом'],
    correctIndex: 0,
    explanation: 'При последовательном соединении сопротивления складываются: 10 + 10 = 20 Ом',
    category: 'electric',
  },
  {
    question: 'Два резистора по 12 Ом соединены параллельно. Чему равно их общее сопротивление?',
    formulaBadge: '1/R = 1/R₁ + 1/R₂',
    options: ['6 Ом', '24 Ом', '12 Ом', '1 Ом'],
    correctIndex: 0,
    explanation: 'При параллельном одинаковых резисторов: 12 / 2 = 6 Ом',
    category: 'electric',
  },
  {
    question: 'За 5 секунд через проводник прошёл заряд 20 Кл. Какова сила тока?',
    formulaBadge: 'I = q / t',
    options: ['4 А', '100 А', '0.25 А', '15 А'],
    correctIndex: 0,
    explanation: 'I = 20 / 5 = 4 А',
    category: 'electric',
  },

  // --- Термодинамика и МКТ ---
  {
    question: 'Температура газа равна 27 °C. Какова абсолютная температура в Кельвинах?',
    formulaBadge: 'T = t + 273',
    options: ['300 К', '273 К', '246 К', '327 К'],
    correctIndex: 0,
    explanation: 'T = 27 + 273.15 ≈ 300 К',
    category: 'thermo',
  },
  {
    question: 'Какой изопроцесс описывает закон Бойля — Мариотта при T = const?',
    formulaBadge: 'P · V = const',
    options: ['Изотермический', 'Изобарный', 'Изохорный', 'Адиабатный'],
    correctIndex: 0,
    explanation: 'Процесс при постоянной температуре называется изотермическим',
    category: 'thermo',
  },
  {
    question: 'При каком процессе объём газа остаётся неизменным (V = const)?',
    formulaBadge: 'P / T = const',
    options: ['Изохорный', 'Изобарный', 'Изотермический', 'Квазистатический'],
    correctIndex: 0,
    explanation: 'Изохорный процесс протекает при неизменном объёме',
    category: 'thermo',
  },
  {
    question: 'В каком агрегатном состоянии вещество не имеет собственной формы, но сохраняет объём?',
    formulaBadge: 'МКТ',
    options: ['Жидкость', 'Газ', 'Твёрдое тело', 'Плазма'],
    correctIndex: 0,
    explanation: 'Жидкость сохраняет объём, но принимает форму сосуда',
    category: 'thermo',
  },

  // --- Единицы измерения СИ ---
  {
    question: 'В каких единицах международной системы (СИ) измеряется сила?',
    formulaBadge: 'СИ',
    options: ['Ньютон (Н)', 'Джоуль (Дж)', 'Паскаль (Па)', 'Ватт (Вт)'],
    correctIndex: 0,
    explanation: 'Единица силы — Ньютон [Н = кг·м/с²]',
    category: 'units',
  },
  {
    question: 'В каких единицах измеряется давление?',
    formulaBadge: 'СИ',
    options: ['Паскаль (Па)', 'Ньютон (Н)', 'Ом (Ом)', 'Тесла (Тл)'],
    correctIndex: 0,
    explanation: 'Давление измеряется в Паскалях [1 Па = 1 Н/м²]',
    category: 'units',
  },
  {
    question: 'В каких единицах измеряется электрическое сопротивление?',
    formulaBadge: 'СИ',
    options: ['Ом (Ом)', 'Вольт (В)', 'Ампер (А)', 'Фарад (Ф)'],
    correctIndex: 0,
    explanation: 'Сопротивление измеряется в Омах (Ом)',
    category: 'units',
  },
  {
    question: 'В каких единицах измеряется частота колебаний?',
    formulaBadge: 'СИ',
    options: ['Герц (Гц)', 'Секунда (с)', 'Радиан (рад)', 'Метр (м)'],
    correctIndex: 0,
    explanation: 'Частота измеряется в Герцах (1 Гц = 1/с)',
    category: 'units',
  },
  {
    question: 'В каких единицах измеряется механическая и тепловая энергия?',
    formulaBadge: 'СИ',
    options: ['Джоуль (Дж)', 'Ватт (Вт)', 'Ньютон (Н)', 'Кулон (Кл)'],
    correctIndex: 0,
    explanation: 'Энергия и работа измеряются в Джоулях (Дж)',
    category: 'units',
  },
  {
    question: 'В каких единицах измеряется оптическая сила линзы?',
    formulaBadge: 'D = 1 / F',
    options: ['Диоптрия (дптр)', 'Метр (м)', 'Градус (°)', 'Люмен (лм)'],
    correctIndex: 0,
    explanation: 'Оптическая сила измеряется в диоптриях [1 дптр = 1 м⁻¹]',
    category: 'units',
  },
]

function prepareQuestion(q: PhysicsQuestion): {
  question: string
  formulaBadge?: string
  options: string[]
  correctIndex: number
  explanation: string
} {
  const indices = [0, 1, 2, 3]
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const shuffledOptions = indices.map((idx) => q.options[idx])
  const newCorrectIndex = indices.indexOf(q.correctIndex)
  return {
    question: q.question,
    formulaBadge: q.formulaBadge,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
    explanation: q.explanation,
  }
}

function getRandomQuestion(category: QuestionCategory, excludeIndex = -1) {
  let pool = QUESTION_BANK
  if (category !== 'all') {
    pool = QUESTION_BANK.filter((q) => q.category === category)
    if (pool.length === 0) pool = QUESTION_BANK
  }
  let randIdx = Math.floor(Math.random() * pool.length)
  if (pool.length > 1 && randIdx === excludeIndex) {
    randIdx = (randIdx + 1) % pool.length
  }
  return prepareQuestion(pool[randIdx])
}

/* ═════════════════════════════════════════════════════════════════
   HIGH-TECH ATHLETE CHARACTER SVG (CYBER ATHLETE)
   ═════════════════════════════════════════════════════════════════ */
interface CyberPersonProps {
  team: 'blue' | 'red'
  direction: 'left' | 'right'
  isPulling: boolean
  hasCombo: boolean
  index: number
}

function CyberPerson({ team, direction, isPulling, hasCombo, index }: CyberPersonProps) {
  const isBlue = team === 'blue'
  const isRight = direction === 'right'

  const colors = isBlue
    ? {
        primary: '#38bdf8',
        secondary: '#0284c7',
        armor: '#1e293b',
        armorLight: '#334155',
        visor: '#67e8f9',
        glow: 'rgba(56, 189, 248, 0.4)',
        skin: index === 0 ? '#f5d0a9' : index === 1 ? '#e8b88a' : '#d4a574',
        accent: '#38bdf8',
      }
    : {
        primary: '#f43f5e',
        secondary: '#e11d48',
        armor: '#2a1724',
        armorLight: '#4c1d35',
        visor: '#fda4af',
        glow: 'rgba(244, 63, 94, 0.4)',
        skin: index === 0 ? '#e8b88a' : index === 1 ? '#f5d0a9' : '#c19660',
        accent: '#fb7185',
      }

  const flip = isRight ? -1 : 1

  return (
    <motion.svg
      width="72"
      height="105"
      viewBox="0 0 72 105"
      className="overflow-visible select-none drop-shadow-md"
      animate={{
        rotate: isPulling ? (isRight ? [0, 8, -2, 6, 0] : [0, -8, 2, -6, 0]) : [0, -1.5, 0],
        y: isPulling ? [0, -4, 0] : 0,
      }}
      transition={{
        duration: isPulling ? 0.32 : 1.4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        transform: `scaleX(${flip})`,
        transformOrigin: '36px 95px',
      }}
    >
      <defs>
        <radialGradient id={`glow-${team}-${index}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity={hasCombo ? '0.7' : '0.3'} />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {(isPulling || hasCombo) && (
        <motion.ellipse
          cx="36"
          cy="50"
          rx="34"
          ry="44"
          fill={`url(#glow-${team}-${index})`}
          animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      )}

      {/* Back leg */}
      <motion.g
        animate={isPulling ? { rotate: [0, 8, 0] } : {}}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '46px 60px' }}
      >
        <path d="M 46 62 L 60 84 L 64 96" stroke={colors.armor} strokeWidth="10" strokeLinecap="round" />
        <path d="M 46 62 L 60 84" stroke={colors.armorLight} strokeWidth="6" strokeLinecap="round" />
        <path d="M 58 93 L 70 97 L 68 102 L 54 100 Z" fill={colors.armor} stroke={colors.primary} strokeWidth="1.5" />
      </motion.g>

      {/* Front leg */}
      <motion.g
        animate={isPulling ? { rotate: [0, -6, 0] } : {}}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '30px 60px' }}
      >
        <path d="M 30 62 L 18 78 L 12 96" stroke={colors.armor} strokeWidth="10" strokeLinecap="round" />
        <path d="M 30 62 L 18 78" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M 6 93 L 20 95 L 18 102 L 4 101 Z" fill={colors.armor} stroke={colors.primary} strokeWidth="1.5" />
      </motion.g>

      {/* Torso & Head */}
      <motion.g
        animate={isPulling ? { rotate: [-2, -6, -2] } : {}}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '36px 65px' }}
      >
        <path
          d="M 22 34 L 50 34 L 46 64 L 26 64 Z"
          fill={colors.armor}
          stroke={colors.armorLight}
          strokeWidth="2"
        />
        <path d="M 32 36 L 40 36 L 38 60 L 34 60 Z" fill={colors.primary} opacity="0.9" />
        <circle cx="36" cy="46" r="3" fill="#ffffff" />
        <rect x="25" y="60" width="22" height="5" rx="2" fill={colors.armorLight} />
        <rect x="33" y="60.5" width="6" height="4" rx="1" fill={colors.primary} />

        <ellipse cx="36" cy="20" rx="11" ry="13" fill={colors.skin} />
        <path
          d="M 25 18 C 25 8 47 8 47 18 C 47 12 43 7 36 7 C 29 7 25 12 25 18 Z"
          fill={colors.armor}
        />
        <path
          d="M 23 16 Q 36 13 49 16 L 47 23 Q 36 20 25 23 Z"
          fill={colors.visor}
          stroke={colors.primary}
          strokeWidth="1.2"
        />
        <line x1="28" y1="18" x2="43" y2="18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />

        {/* Arms */}
        <motion.path
          d="M 44 38 L 16 46 L -6 48"
          stroke={colors.armor}
          strokeWidth="8"
          strokeLinecap="round"
          animate={isPulling ? { d: ['M 44 38 L 16 46 L -6 48', 'M 44 38 L 18 48 L -4 50', 'M 44 38 L 16 46 L -6 48'] } : {}}
          transition={{ duration: 0.35, repeat: Infinity }}
        />
        <motion.path
          d="M 26 40 L 4 48 L -10 50"
          stroke={colors.armorLight}
          strokeWidth="8"
          strokeLinecap="round"
          animate={isPulling ? { d: ['M 26 40 L 4 48 L -10 50', 'M 26 40 L 6 50 L -8 52', 'M 26 40 L 4 48 L -10 50'] } : {}}
          transition={{ duration: 0.35, repeat: Infinity, delay: 0.05 }}
        />
        <circle cx="-7" cy="49" r="5" fill={colors.primary} stroke={colors.armor} strokeWidth="2" />
        <circle cx="-1" cy="48" r="4.5" fill={colors.primary} stroke={colors.armor} strokeWidth="1.5" />
      </motion.g>

      {isPulling && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.25, repeat: Infinity }}
        >
          <line x1="62" y1="98" x2="72" y2="94" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="99" x2="8" y2="95" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
          <circle cx="68" cy="95" r="1.5" fill="#ffffff" />
        </motion.g>
      )}
    </motion.svg>
  )
}

/* ═════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════════ */
export function TugOfWar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('pvp')
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [category, setCategory] = useState<QuestionCategory>('all')
  const [soundOn, setSoundOn] = useState(true)

  const [position, setPosition] = useState(50)
  const [team1Question, setTeam1Question] = useState(() => getRandomQuestion('all'))
  const [team2Question, setTeam2Question] = useState(() => getRandomQuestion('all'))
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
  const [team1CorrectCount, setTeam1CorrectCount] = useState(0)
  const [team2CorrectCount, setTeam2CorrectCount] = useState(0)
  const [team1Combo, setTeam1Combo] = useState(0)
  const [team2Combo, setTeam2Combo] = useState(0)
  const [maxCombo1, setMaxCombo1] = useState(0)
  const [maxCombo2, setMaxCombo2] = useState(0)

  const [team1Feedback, setTeam1Feedback] = useState<{ selected: number; isCorrect: boolean } | null>(null)
  const [team2Feedback, setTeam2Feedback] = useState<{ selected: number; isCorrect: boolean } | null>(null)
  const [team1Pulling, setTeam1Pulling] = useState(false)
  const [team2Pulling, setTeam2Pulling] = useState(false)
  const [team1Locked, setTeam1Locked] = useState(false)
  const [team2Locked, setTeam2Locked] = useState(false)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<1 | 2 | null>(null)

  const botTimerRef = useRef<NodeJS.Timeout | null>(null)

  const BASE_PULL = 6.5
  const WIN_THRESHOLD = 14

  useEffect(() => {
    sounds.enabled = soundOn
  }, [soundOn])

  const handleRestart = useCallback(() => {
    setPosition(50)
    setTeam1Score(0)
    setTeam2Score(0)
    setTeam1CorrectCount(0)
    setTeam2CorrectCount(0)
    setTeam1Combo(0)
    setTeam2Combo(0)
    setMaxCombo1(0)
    setMaxCombo2(0)
    setGameOver(false)
    setWinner(null)
    setTeam1Pulling(false)
    setTeam2Pulling(false)
    setTeam1Feedback(null)
    setTeam2Feedback(null)
    setTeam1Locked(false)
    setTeam2Locked(false)
    setTeam1Question(getRandomQuestion(category))
    setTeam2Question(getRandomQuestion(category))
    if (botTimerRef.current) clearInterval(botTimerRef.current)
  }, [category])

  const handleCategoryChange = (newCat: QuestionCategory) => {
    setCategory(newCat)
    setTeam1Question(getRandomQuestion(newCat))
    setTeam2Question(getRandomQuestion(newCat))
  }

  const handleTeam1Answer = useCallback(
    (index: number) => {
      if (team1Locked || gameOver) return
      const isCorrect = index === team1Question.correctIndex
      setTeam1Feedback({ selected: index, isCorrect })
      setTeam1Locked(true)

      if (isCorrect) {
        sounds.playCorrect()
        sounds.playPull()
        setTeam1Pulling(true)
        setTeam1CorrectCount((prev) => prev + 1)
        const nextCombo = team1Combo + 1
        setTeam1Combo(nextCombo)
        setMaxCombo1((prev) => Math.max(prev, nextCombo))

        const comboMultiplier = nextCombo >= 3 ? 1.5 : nextCombo === 2 ? 1.25 : 1
        const pullDelta = BASE_PULL * comboMultiplier
        setTeam1Score((s) => s + Math.round(10 * comboMultiplier))

        setPosition((prev) => {
          const next = Math.max(0, prev - pullDelta)
          if (next <= WIN_THRESHOLD) {
            setGameOver(true)
            setWinner(1)
            sounds.playVictory()
            return WIN_THRESHOLD
          }
          return next
        })

        setTimeout(() => setTeam1Pulling(false), 600)
      } else {
        sounds.playWrong()
        setTeam1Combo(0)
      }

      setTimeout(() => {
        setTeam1Question(getRandomQuestion(category))
        setTeam1Feedback(null)
        setTeam1Locked(false)
      }, 550)
    },
    [team1Locked, gameOver, team1Question, team1Combo, category]
  )

  const handleTeam2Answer = useCallback(
    (index: number) => {
      if (team2Locked || gameOver) return
      const isCorrect = index === team2Question.correctIndex
      setTeam2Feedback({ selected: index, isCorrect })
      setTeam2Locked(true)

      if (isCorrect) {
        sounds.playCorrect()
        sounds.playPull()
        setTeam2Pulling(true)
        setTeam2CorrectCount((prev) => prev + 1)
        const nextCombo = team2Combo + 1
        setTeam2Combo(nextCombo)
        setMaxCombo2((prev) => Math.max(prev, nextCombo))

        const comboMultiplier = nextCombo >= 3 ? 1.5 : nextCombo === 2 ? 1.25 : 1
        const pullDelta = BASE_PULL * comboMultiplier
        setTeam2Score((s) => s + Math.round(10 * comboMultiplier))

        setPosition((prev) => {
          const next = Math.min(100, prev + pullDelta)
          if (next >= 100 - WIN_THRESHOLD) {
            setGameOver(true)
            setWinner(2)
            sounds.playVictory()
            return 100 - WIN_THRESHOLD
          }
          return next
        })

        setTimeout(() => setTeam2Pulling(false), 600)
      } else {
        sounds.playWrong()
        setTeam2Combo(0)
      }

      setTimeout(() => {
        setTeam2Question(getRandomQuestion(category))
        setTeam2Feedback(null)
        setTeam2Locked(false)
      }, 550)
    },
    [team2Locked, gameOver, team2Question, team2Combo, category]
  )

  useEffect(() => {
    if (gameMode !== 'ai' || gameOver) {
      if (botTimerRef.current) clearInterval(botTimerRef.current)
      return
    }

    const botConfig = {
      easy: { delay: 3800, accuracy: 0.55 },
      medium: { delay: 3000, accuracy: 0.75 },
      hard: { delay: 2200, accuracy: 0.9 },
    }[botDifficulty]

    const interval = setInterval(() => {
      if (team2Locked || gameOver) return
      const willSucceed = Math.random() < botConfig.accuracy
      if (willSucceed) {
        handleTeam2Answer(team2Question.correctIndex)
      } else {
        const wrongIndices = [0, 1, 2, 3].filter((i) => i !== team2Question.correctIndex)
        const randomWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
        handleTeam2Answer(randomWrong)
      }
    }, botConfig.delay)

    botTimerRef.current = interval
    return () => clearInterval(interval)
  }, [gameMode, botDifficulty, gameOver, team2Locked, team2Question, handleTeam2Answer])

  const cableOffset = (50 - position) * 3.6

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 select-none pb-8">
      {/* ── TOP CONTROL BAR ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        } shadow-sm`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center text-white shadow-md">
            <Swords size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              БИТВА КВАНТОВ
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                Перетягивание каната
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Отвечайте на вопросы по физике быстрее соперника, чтобы перетянуть силовой кабель!
            </p>
          </div>
        </div>

        {/* Game Mode & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switch */}
          <div
            className={`flex items-center rounded-xl p-1 border text-xs font-semibold ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => {
                setGameMode('pvp')
                handleRestart()
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                gameMode === 'pvp'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users size={14} /> 2 Игрока
            </button>
            <button
              onClick={() => {
                setGameMode('ai')
                handleRestart()
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                gameMode === 'ai'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot size={14} /> Против AI
            </button>
          </div>

          {/* AI Difficulty Selector */}
          {gameMode === 'ai' && (
            <select
              value={botDifficulty}
              onChange={(e) => setBotDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="easy">Бот: Новичок (55%)</option>
              <option value="medium">Бот: Студент (75%)</option>
              <option value="hard">Бот: Архимед (90%)</option>
            </select>
          )}

          {/* Topic filter */}
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as QuestionCategory)}
            className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="all">⚡ Все темы (Микс)</option>
            <option value="mechanics">🚀 Механика и движение</option>
            <option value="electric">💡 Электричество</option>
            <option value="thermo">🔥 Термодинамика</option>
            <option value="units">📏 Единицы СИ</option>
          </select>

          {/* Sound Toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSoundOn(!soundOn)}
            className="h-8 w-8 p-0 rounded-xl"
            title={soundOn ? 'Выключить звук' : 'Включить звук'}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} className="text-slate-400" />}
          </Button>

          {/* Restart */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestart}
            className="h-8 px-3 rounded-xl text-xs font-semibold"
          >
            <RotateCcw size={14} className="mr-1.5" /> Сброс
          </Button>
        </div>
      </div>

      {/* ── ARENA + CYBER VISUALIZATION ── */}
      <div
        className={`relative w-full rounded-3xl overflow-hidden border shadow-2xl ${
          isDark
            ? 'bg-gradient-to-b from-[#0a0f1d] via-[#0d1527] to-[#080c16] border-slate-800'
            : 'bg-gradient-to-b from-slate-100 via-sky-50 to-slate-200 border-slate-300'
        }`}
        style={{ minHeight: 270 }}
      >
        {/* Holographic Arena Grid (Floor Perspective) */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stadiumGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? '#38bdf8' : '#0284c7'} strokeWidth="0.5" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stadiumGrid)" />
          </svg>
        </div>

        {/* Ambient Team Glow Lights on sides */}
        <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-cyan-500/15 via-blue-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-1/3 bg-gradient-to-l from-rose-500/15 via-red-500/5 to-transparent pointer-events-none" />

        {/* WIN ZONES (Demarcated on Arena) */}
        <div
          className="absolute left-0 top-0 bottom-0 border-r-2 border-dashed border-cyan-400/40 bg-cyan-500/10 pointer-events-none z-0"
          style={{ width: `${WIN_THRESHOLD}%` }}
        >
          <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold text-cyan-400 tracking-wider">
            ЗОНА ПОБЕДЫ 1
          </span>
        </div>
        <div
          className="absolute right-0 top-0 bottom-0 border-l-2 border-dashed border-rose-400/40 bg-rose-500/10 pointer-events-none z-0"
          style={{ width: `${WIN_THRESHOLD}%` }}
        >
          <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-rose-400 tracking-wider">
            ЗОНА ПОБЕДЫ 2
          </span>
        </div>

        {/* CENTER LASER LINE (THE EQUILIBRIUM ZERO MARK) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-white to-purple-400 z-10 shadow-[0_0_12px_rgba(168,85,247,0.8)]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500/40 blur-sm" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500/40 blur-sm" />
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-500/40">
            0.0 m
          </span>
        </div>

        {/* ═══ MOVING ASSEMBLY (CABLE + CHARACTERS + TENSION CORE) ═══ */}
        <motion.div
          className="absolute inset-0"
          animate={{ x: cableOffset }}
          transition={{ type: 'spring', stiffness: 75, damping: 13 }}
        >
          {/* ── THE ENERGY CABLE / ROPE ── */}
          <div className="absolute left-[-20%] right-[-20%]" style={{ top: '51%' }}>
            <div className="absolute w-full h-3 rounded-full bg-black/30 top-1 blur-sm" />
            <div
              className="relative w-full h-2.5 rounded-full overflow-hidden"
              style={{
                background: isDark
                  ? 'linear-gradient(180deg, #64748b 0%, #334155 50%, #0f172a 100%)'
                  : 'linear-gradient(180deg, #94a3b8 0%, #64748b 50%, #334155 100%)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    position < 50
                      ? 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #f43f5e 100%)'
                      : 'linear-gradient(90deg, #38bdf8 0%, #f43f5e 50%, #fb7185 100%)',
                  opacity: 0.7,
                }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)',
                }}
              />
            </div>
          </div>

          {/* ── TEAM 1 (BLUE QUANTUMS) CHARACTERS ── */}
          <div className="absolute left-[7%] bottom-4 flex items-end -space-x-4">
            {[0, 1, 2].map((idx) => (
              <div key={idx} style={{ zIndex: 3 - idx }}>
                <CyberPerson
                  team="blue"
                  direction="left"
                  isPulling={team1Pulling || position < 47}
                  hasCombo={team1Combo >= 2}
                  index={idx}
                />
              </div>
            ))}
          </div>

          {/* ── CENTER TENSION CORE (MARKER) ── */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: '40%' }}>
            <motion.div
              animate={{
                y: [0, -3, 0],
                rotate: position < 50 ? -8 : position > 50 ? 8 : 0,
              }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border-2 backdrop-blur-sm ${
                  position < 48
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-cyan-500/50'
                    : position > 52
                      ? 'bg-rose-500/30 border-rose-400 text-rose-300 shadow-rose-500/50'
                      : 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-purple-500/50'
                }`}
              >
                <Zap size={20} className={team1Pulling || team2Pulling ? 'animate-bounce' : ''} />
              </div>
              <div className="w-1.5 h-6 bg-gradient-to-b from-white to-purple-400 rounded-full shadow" />
            </motion.div>
          </div>

          {/* ── TEAM 2 (RED PHOTONS) CHARACTERS ── */}
          <div className="absolute right-[7%] bottom-4 flex items-end -space-x-4 flex-row-reverse">
            {[0, 1, 2].map((idx) => (
              <div key={idx} style={{ zIndex: 3 - idx }}>
                <CyberPerson
                  team="red"
                  direction="right"
                  isPulling={team2Pulling || position > 53}
                  hasCombo={team2Combo >= 2}
                  index={idx}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── REAL-TIME TENSION GAUGE / PROGRESS BAR ── */}
      <div
        className={`p-3 rounded-2xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        } shadow-sm`}
      >
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="flex items-center gap-2 text-cyan-500 dark:text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>СИНИЕ КВАНТЫ</span>
            {team1Combo >= 2 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-extrabold flex items-center gap-1">
                <Flame size={12} /> x{team1Combo} РЫВОК!
              </span>
            )}
          </div>

          <div className="font-mono text-slate-500 dark:text-slate-400 text-xs">
            {position < 50
              ? `← ПРЕИМУЩЕСТВО СИНИХ: ${Math.round(50 - position)}%`
              : position > 50
                ? `ПРЕИМУЩЕСТВО КРАСНЫХ: ${Math.round(position - 50)}% →`
                : 'БАЛАНС 50 : 50'}
          </div>

          <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
            {team2Combo >= 2 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-extrabold flex items-center gap-1">
                <Flame size={12} /> x{team2Combo} РЫВОК!
              </span>
            )}
            <span>{gameMode === 'ai' ? 'КИБЕР-БОТ' : 'КРАСНЫЕ ФОТОНЫ'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
          </div>
        </div>

        {/* Dual Color Track */}
        <div
          className={`h-5 rounded-full relative overflow-hidden p-0.5 border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-purple-500/20 to-rose-500/40" />

          <div
            className="absolute left-0 top-0 bottom-0 bg-cyan-500/30 border-r border-cyan-400/60"
            style={{ width: `${WIN_THRESHOLD}%` }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 bg-rose-500/30 border-l border-rose-400/60"
            style={{ width: `${WIN_THRESHOLD}%` }}
          />

          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40 -translate-x-1/2" />

          <motion.div
            className="absolute top-0.5 bottom-0.5 w-6 -ml-3 rounded-full bg-white shadow-md border-2 border-slate-400 flex items-center justify-center z-10"
            animate={{ left: `${position}%` }}
            transition={{ type: 'spring', stiffness: 85, damping: 13 }}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                position < 50 ? 'bg-cyan-500' : position > 50 ? 'bg-rose-500' : 'bg-slate-600'
              }`}
            />
          </motion.div>
        </div>
      </div>

      {/* ── QUESTION PANELS (2 TEAMS / PLAYER VS BOT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── TEAM 1 (BLUE) ── */}
        <Card
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-cyan-500/30 shadow-cyan-950/30'
              : 'bg-white border-cyan-300 shadow-cyan-100'
          } shadow-lg relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Команда «Синие Кванты»</h3>
                <span className="text-[11px] text-cyan-500 font-medium">Счёт: {team1Score} очков</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {team1Question.formulaBadge && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  {team1Question.formulaBadge}
                </span>
              )}
            </div>
          </div>

          <div
            className={`min-h-[72px] p-3.5 rounded-xl border flex items-center justify-center mb-3.5 text-center transition-all ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {team1Question.question}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {team1Question.options.map((option, idx) => {
              const letters = ['A', 'B', 'C', 'D']
              const isSelected = team1Feedback?.selected === idx
              const isCorrectOpt = idx === team1Question.correctIndex
              const showResult = team1Feedback !== null

              let btnStyle = isDark
                ? 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-cyan-500/50'
                : 'bg-slate-100 hover:bg-slate-150 text-slate-800 border-slate-200 hover:border-cyan-400'

              if (showResult) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                } else if (isSelected && !team1Feedback.isCorrect) {
                  btnStyle = 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                } else {
                  btnStyle = 'opacity-40 bg-slate-800 text-slate-400 border-transparent'
                }
              }

              return (
                <button
                  key={idx}
                  disabled={team1Locked || gameOver}
                  onClick={() => handleTeam1Answer(idx)}
                  className={`p-3 rounded-xl border font-medium text-xs sm:text-sm text-left flex items-center gap-2.5 transition-all active:scale-[0.98] ${btnStyle}`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      showResult && isCorrectOpt
                        ? 'bg-white text-emerald-600'
                        : 'bg-cyan-500/20 text-cyan-400 dark:bg-white/10 dark:text-white'
                    }`}
                  >
                    {letters[idx]}
                  </span>
                  <span className="truncate flex-1 font-semibold">{option}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* ── TEAM 2 (RED OR BOT) ── */}
        <Card
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-rose-500/30 shadow-rose-950/30'
              : 'bg-white border-rose-300 shadow-rose-100'
          } shadow-lg relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
                {gameMode === 'ai' ? <Bot size={16} /> : '2'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {gameMode === 'ai' ? 'Кибер-Бот (ИИ)' : 'Команда «Красные Фотоны»'}
                </h3>
                <span className="text-[11px] text-rose-500 font-medium">Счёт: {team2Score} очков</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {team2Question.formulaBadge && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/25">
                  {team2Question.formulaBadge}
                </span>
              )}
            </div>
          </div>

          <div
            className={`min-h-[72px] p-3.5 rounded-xl border flex items-center justify-center mb-3.5 text-center transition-all ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {team2Question.question}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {team2Question.options.map((option, idx) => {
              const letters = ['A', 'B', 'C', 'D']
              const isSelected = team2Feedback?.selected === idx
              const isCorrectOpt = idx === team2Question.correctIndex
              const showResult = team2Feedback !== null

              let btnStyle = isDark
                ? 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-rose-500/50'
                : 'bg-slate-100 hover:bg-slate-150 text-slate-800 border-slate-200 hover:border-rose-400'

              if (showResult) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                } else if (isSelected && !team2Feedback.isCorrect) {
                  btnStyle = 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                } else {
                  btnStyle = 'opacity-40 bg-slate-800 text-slate-400 border-transparent'
                }
              }

              return (
                <button
                  key={idx}
                  disabled={gameMode === 'ai' || team2Locked || gameOver}
                  onClick={() => handleTeam2Answer(idx)}
                  className={`p-3 rounded-xl border font-medium text-xs sm:text-sm text-left flex items-center gap-2.5 transition-all active:scale-[0.98] ${btnStyle} ${
                    gameMode === 'ai' ? 'cursor-default' : ''
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      showResult && isCorrectOpt
                        ? 'bg-white text-emerald-600'
                        : 'bg-rose-500/20 text-rose-400 dark:bg-white/10 dark:text-white'
                    }`}
                  >
                    {letters[idx]}
                  </span>
                  <span className="truncate flex-1 font-semibold">{option}</span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── VICTORY MODAL OVERLAY ── */}
      <AnimatePresence>
        {gameOver && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl text-center relative overflow-hidden ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 18 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: ['#38bdf8', '#f43f5e', '#facc15', '#a855f7', '#34d399'][i % 5],
                      left: `${10 + (i * 14) % 80}%`,
                      top: '40%',
                    }}
                    animate={{
                      y: [-20, (Math.random() - 0.5) * 260],
                      x: [(Math.random() - 0.5) * 220],
                      opacity: [1, 0],
                      scale: [1, 0.4],
                    }}
                    transition={{ duration: 1.4, delay: i * 0.04, ease: 'easeOut' }}
                  />
                ))}
              </div>

              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 shadow-xl ${
                  winner === 1
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-cyan-500/30'
                    : 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/30'
                }`}
              >
                <Trophy size={42} />
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                {winner === 1 ? '🎉 ПОБЕДА СИНИХ КВАНТОВ! 🎉' : '🎉 ПОБЕДА КРАСНЫХ! 🎉'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                {winner === 1
                  ? 'Команда 1 успешно перетянула силовой кабель на свою сторону!'
                  : gameMode === 'ai'
                    ? 'Кибер-Бот перетянул кабель. Тренируйтесь ещё!'
                    : 'Команда 2 одержала победу в физической дуэли!'}
              </p>

              <div
                className={`p-3.5 rounded-2xl border mb-6 text-xs grid grid-cols-2 gap-3 ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="text-left space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" /> Синие
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Правильных: <b className="text-slate-900 dark:text-white">{team1CorrectCount}</b>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Макс. комбо: <b className="text-slate-900 dark:text-white">x{maxCombo1}</b>
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Красные
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Правильных: <b className="text-slate-900 dark:text-white">{team2CorrectCount}</b>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Макс. комбо: <b className="text-slate-900 dark:text-white">x{maxCombo2}</b>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRestart}
                  className="w-full h-11 text-sm font-bold shadow-lg"
                >
                  <RotateCcw size={16} className="mr-2" /> Сыграть реванш
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
