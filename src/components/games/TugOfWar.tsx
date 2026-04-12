import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { Trophy, RotateCcw, Zap } from 'lucide-react'

interface Question {
  question: string
  answer: number
}

/* ─────────────────────────────────────────────────
   Character SVG — arms extended forward to grab rope
   ───────────────────────────────────────────────── */
const TugPerson = ({
  teamColor,
  direction,
  isPulling,
  variant = 0,
}: {
  teamColor: 'blue' | 'red'
  direction: 'left' | 'right'
  isPulling: boolean
  variant?: number
}) => {
  const isBlue = teamColor === 'blue'
  const flip = direction === 'right' ? -1 : 1

  const palette = isBlue
    ? { shirt: '#6366F1', shirtLight: '#818CF8', pants: '#312E81', shoe: '#1E1B4B', accent: '#A5B4FC', headband: '#6366F1' }
    : { shirt: '#F43F5E', shirtLight: '#FB7185', pants: '#881337', shoe: '#4C0519', accent: '#FDA4AF', headband: '#F43F5E' }

  const skins = ['#F5D0A9', '#E8B88A', '#D4A574', '#C19660']
  const skinColor = skins[variant % skins.length]
  const hairs = ['#2C1810', '#5C3317', '#8B6914', '#1A1A2E']
  const hairColor = hairs[variant % hairs.length]

  return (
    <motion.svg
      width="56"
      height="90"
      viewBox="0 0 56 90"
      animate={{
        rotate: isPulling ? [0, -10, 2, -8, 0] : [0, -2, 0],
        x: isPulling ? (direction === 'left' ? [0, -4, 0] : [0, 4, 0]) : 0,
      }}
      transition={{ duration: isPulling ? 0.35 : 1.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transform: `scaleX(${flip})`, overflow: 'visible' }}
    >
      {/* Body */}
      <rect x="17" y="30" width="22" height="26" rx="8" fill={palette.shirt} />
      <rect x="17" y="38" width="22" height="3" rx="1" fill={palette.shirtLight} opacity={0.5} />
      <text x="28" y="42" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" opacity={0.7}>
        {variant + 1}
      </text>

      {/* Head */}
      <circle cx="28" cy="17" r="13" fill={skinColor} />
      <rect x="15" y="11" width="26" height="4" rx="2" fill={palette.headband} />
      <ellipse cx="28" cy="9" rx="12" ry="7" fill={hairColor} />
      <circle cx="17" cy="13" r="3" fill={hairColor} />
      <circle cx="39" cy="13" r="3" fill={hairColor} />

      {/* Eyes */}
      <ellipse cx="23" cy="18" rx="3.5" ry="3" fill="white" />
      <ellipse cx="33" cy="18" rx="3.5" ry="3" fill="white" />
      <motion.circle cx="23" cy="18" r="2" fill="#1A1A2E"
        animate={isPulling ? { cx: [23, 22, 23] } : {}} transition={{ duration: 0.4, repeat: Infinity }}
      />
      <motion.circle cx="33" cy="18" r="2" fill="#1A1A2E"
        animate={isPulling ? { cx: [33, 32, 33] } : {}} transition={{ duration: 0.4, repeat: Infinity }}
      />
      <circle cx="22" cy="17" r="0.8" fill="white" />
      <circle cx="32" cy="17" r="0.8" fill="white" />

      {/* Eyebrows */}
      <motion.g animate={isPulling ? { y: [0, -2, 0] } : {}} transition={{ duration: 0.25, repeat: Infinity }}>
        <line x1="20" y1="13" x2="26" y2="14.5" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="14.5" x2="36" y2="13" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Mouth */}
      <motion.path
        d={isPulling ? 'M 24 24 Q 28 20 32 24' : 'M 24 23 Q 28 26 32 23'}
        stroke="#C0392B" strokeWidth="1.5" fill={isPulling ? '#E74C3C' : 'none'} strokeLinecap="round"
        animate={isPulling ? { d: ['M 24 24 Q 28 20 32 24', 'M 24 23 Q 28 21 32 23'] } : {}}
        transition={{ duration: 0.3, repeat: Infinity }}
      />
      <circle cx="19" cy="22" r="2.5" fill="#F5A0A0" opacity={isPulling ? 0.7 : 0.3} />
      <circle cx="37" cy="22" r="2.5" fill="#F5A0A0" opacity={isPulling ? 0.7 : 0.3} />

      {/* Arms — both extended forward (toward rope) */}
      <motion.g
        animate={{ rotate: isPulling ? [-18, -28, -18] : [-12, -15, -12] }}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '17px 36px' }}
      >
        <rect x="2" y="33" width="18" height="7" rx="3.5" fill={skinColor} />
        <rect x="-2" y="33.5" width="7" height="6" rx="3" fill={palette.accent} />
      </motion.g>
      <motion.g
        animate={{ rotate: isPulling ? [-18, -28, -18] : [-12, -15, -12] }}
        transition={{ duration: 0.35, repeat: Infinity, delay: 0.08 }}
        style={{ transformOrigin: '39px 36px' }}
      >
        <rect x="36" y="33" width="18" height="7" rx="3.5" fill={skinColor} />
        <rect x="51" y="33.5" width="7" height="6" rx="3" fill={palette.accent} />
      </motion.g>

      {/* Legs — braced stance */}
      <motion.g
        animate={{ rotate: isPulling ? [8, 18, 8] : [5, 8, 5] }}
        transition={{ duration: 0.35, repeat: Infinity }}
        style={{ transformOrigin: '23px 56px' }}
      >
        <rect x="18" y="55" width="10" height="22" rx="4" fill={palette.pants} />
        <rect x="16" y="74" width="13" height="7" rx="3" fill={palette.shoe} />
      </motion.g>
      <motion.g
        animate={{ rotate: isPulling ? [-12, -22, -12] : [-8, -10, -8] }}
        transition={{ duration: 0.35, repeat: Infinity, delay: 0.12 }}
        style={{ transformOrigin: '33px 56px' }}
      >
        <rect x="28" y="55" width="10" height="22" rx="4" fill={palette.pants} />
        <rect x="27" y="74" width="13" height="7" rx="3" fill={palette.shoe} />
      </motion.g>

      {/* Effort lines */}
      {isPulling && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>
          <line x1="6" y1="8" x2="2" y2="4" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="5" x2="8" y2="0" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
          <line x1="46" y1="5" x2="48" y2="0" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      )}
    </motion.svg>
  )
}

/* ── Team group of 3 chars ── */
const TeamCharacters = ({ teamColor, direction, isPulling }: {
  teamColor: 'blue' | 'red'; direction: 'left' | 'right'; isPulling: boolean
}) => (
  <div className={`flex items-end ${direction === 'right' ? 'flex-row-reverse' : ''}`}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          marginLeft: i > 0 && direction === 'left' ? -14 : 0,
          marginRight: i > 0 && direction === 'right' ? -14 : 0,
          zIndex: 3 - i,
        }}
      >
        <TugPerson teamColor={teamColor} direction={direction} isPulling={isPulling} variant={i} />
      </div>
    ))}
  </div>
)

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function TugOfWar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const textMuted = isDark ? 'text-white/60' : 'text-slate-600'

  // ── Game state ──
  const [position, setPosition] = useState(50)         // 0–100, 50=center
  const [team1Question, setTeam1Question] = useState<Question | null>(null)
  const [team2Question, setTeam2Question] = useState<Question | null>(null)
  const [team1Input, setTeam1Input] = useState('')
  const [team2Input, setTeam2Input] = useState('')
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<1 | 2 | null>(null)
  const [team1Feedback, setTeam1Feedback] = useState<'correct' | 'wrong' | null>(null)
  const [team2Feedback, setTeam2Feedback] = useState<'correct' | 'wrong' | null>(null)
  const [team1Pulling, setTeam1Pulling] = useState(false)
  const [team2Pulling, setTeam2Pulling] = useState(false)
  const [combo1, setCombo1] = useState(0)
  const [combo2, setCombo2] = useState(0)

  const PULL_AMOUNT = 7       // how much each correct answer moves
  const WIN_ZONE = 15         // position ≤ WIN_ZONE → team1 wins, ≥ 100-WIN_ZONE → team2 wins

  /* ── Question generator ── */
  const generateQuestion = (): Question => {
    const types = ['add', 'subtract', 'multiply', 'physics']
    const type = types[Math.floor(Math.random() * types.length)]
    switch (type) {
      case 'add': {
        const a = Math.floor(Math.random() * 50) + 10
        const b = Math.floor(Math.random() * 50) + 10
        return { question: `${a} + ${b} = ?`, answer: a + b }
      }
      case 'subtract': {
        const a = Math.floor(Math.random() * 50) + 30
        const b = Math.floor(Math.random() * 30) + 1
        return { question: `${a} - ${b} = ?`, answer: a - b }
      }
      case 'multiply': {
        const a = Math.floor(Math.random() * 12) + 2
        const b = Math.floor(Math.random() * 12) + 2
        return { question: `${a} × ${b} = ?`, answer: a * b }
      }
      default: {
        const variants = [
          () => { const v = Math.floor(Math.random() * 10) + 2, t = Math.floor(Math.random() * 10) + 1; return { question: `S = v·t\nv=${v}, t=${t}\nS = ?`, answer: v * t } },
          () => { const m = Math.floor(Math.random() * 10) + 1, a = Math.floor(Math.random() * 10) + 1; return { question: `F = m·a\nm=${m}, a=${a}\nF = ?`, answer: m * a } },
          () => { const p = Math.floor(Math.random() * 100) + 20, t = Math.floor(Math.random() * 5) + 1; return { question: `A = P·t\nP=${p}, t=${t}\nA = ?`, answer: p * t } },
        ]
        return variants[Math.floor(Math.random() * variants.length)]()
      }
    }
  }

  const resetQuestions = useCallback(() => {
    setTeam1Question(generateQuestion())
    setTeam2Question(generateQuestion())
    setTeam1Input('')
    setTeam2Input('')
    setTeam1Feedback(null)
    setTeam2Feedback(null)
  }, [])

  useEffect(() => { resetQuestions() }, [resetQuestions])

  /* ── Handlers ── */
  const handleSubmit = (team: 1 | 2) => {
    const question = team === 1 ? team1Question : team2Question
    const input = team === 1 ? team1Input : team2Input
    if (!question || input === '' || gameOver) return

    const isCorrect = parseInt(input) === question.answer
    const setFeedback = team === 1 ? setTeam1Feedback : setTeam2Feedback
    const setPulling = team === 1 ? setTeam1Pulling : setTeam2Pulling
    const setScore = team === 1 ? setTeam1Score : setTeam2Score
    const setCombo = team === 1 ? setCombo1 : setCombo2
    const setInput = team === 1 ? setTeam1Input : setTeam2Input
    const setQuestion = team === 1 ? setTeam1Question : setTeam2Question

    setFeedback(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      setCombo(c => c + 1)
      setPulling(true)
      setScore(s => s + 1)
      setPosition(prev => {
        // Team 1 pulls LEFT (decrease position), Team 2 pulls RIGHT (increase position)
        const newPos = team === 1 ? prev - PULL_AMOUNT : prev + PULL_AMOUNT
        const clamped = Math.max(0, Math.min(100, newPos))
        if (clamped <= WIN_ZONE) { setGameOver(true); setWinner(1); return WIN_ZONE }
        if (clamped >= 100 - WIN_ZONE) { setGameOver(true); setWinner(2); return 100 - WIN_ZONE }
        return clamped
      })
      setTimeout(() => setPulling(false), 800)
    } else {
      setCombo(0)
    }

    setTimeout(() => {
      setQuestion(generateQuestion())
      setInput('')
      setFeedback(null)
    }, 600)
  }

  const handleRestart = () => {
    setPosition(50)
    setTeam1Score(0); setTeam2Score(0)
    setGameOver(false); setWinner(null)
    setTeam1Pulling(false); setTeam2Pulling(false)
    setCombo1(0); setCombo2(0)
    resetQuestions()
  }

  /* ── Stable grass positions ── */
  const grassBlades = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      left: `${4 + i * 4}%`,
      height: `${8 + Math.random() * 12}px`,
      rotate: `${-6 + Math.random() * 12}deg`,
    })), [])

  /* ── Number Pad ── */
  const NumberPad = ({ value, onChange, onSubmit }: {
    value: string; onChange: (v: string) => void; onSubmit: () => void
  }) => {
    const numBg = isDark
      ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/5'
      : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200'
    const numText = isDark ? 'text-white' : 'text-slate-800'

    return (
      <div className="grid grid-cols-3 gap-1 mt-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <motion.button key={n} whileTap={{ scale: 0.9 }}
            onClick={() => !gameOver && onChange(value + n)}
            className={`${numBg} ${numText} font-bold py-2 rounded-lg text-base transition-all select-none`}
          >{n}</motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => !gameOver && onChange('')}
          className="bg-orange-500/90 hover:bg-orange-500 text-white font-bold py-2 rounded-lg text-sm select-none"
        >C</motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => !gameOver && onChange(value + '0')}
          className={`${numBg} ${numText} font-bold py-2 rounded-lg text-base select-none`}
        >0</motion.button>
        <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}
          onClick={() => !gameOver && onSubmit()}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-lg text-sm shadow-lg shadow-emerald-500/30 select-none"
        >Алга!</motion.button>
      </div>
    )
  }

  /* ── Team Panel ── */
  const TeamPanel = ({ team, question, input, setInput, onSubmit, score, feedback, combo, teamColor }: {
    team: 1 | 2; question: Question | null; input: string; setInput: (v: string) => void
    onSubmit: () => void; score: number; feedback: 'correct' | 'wrong' | null
    combo: number; teamColor: 'blue' | 'red'
  }) => {
    const gradient = teamColor === 'blue'
      ? 'from-indigo-600 via-indigo-500 to-blue-500'
      : 'from-rose-600 via-rose-500 to-red-500'
    const glow = teamColor === 'blue' ? 'shadow-indigo-500/30' : 'shadow-rose-500/30'
    const fbRing = feedback === 'correct' ? 'ring-2 ring-emerald-400' : feedback === 'wrong' ? 'ring-2 ring-red-400' : ''

    return (
      <motion.div
        animate={{ scale: feedback === 'correct' ? [1, 1.02, 1] : feedback === 'wrong' ? [1, 0.98, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl overflow-hidden shadow-xl ${glow} bg-gradient-to-br ${gradient}`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white text-lg font-bold">{team}-Команда</h3>
              <div className="text-white/70 text-xs flex items-center gap-1"><Trophy size={12} /> Очки: {score}</div>
            </div>
            <AnimatePresence>
              {combo >= 2 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="flex items-center gap-1 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full"
                ><Zap size={12} /> x{combo}</motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Question */}
          <motion.div
            className={`bg-white rounded-xl p-3 mb-2 min-h-[60px] flex items-center justify-center shadow-inner ${fbRing}`}
            animate={feedback === 'wrong' ? { x: [0, -4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <p className="text-slate-900 text-lg font-bold text-center whitespace-pre-line leading-snug">
              {question?.question || '...'}
            </p>
          </motion.div>

          {/* Answer */}
          <div className={`rounded-xl p-2 text-center text-xl font-bold min-h-[40px] flex items-center justify-center transition-colors ${
            feedback === 'correct' ? 'bg-emerald-100 text-emerald-700'
              : feedback === 'wrong' ? 'bg-red-100 text-red-700'
                : 'bg-white/90 text-slate-900'
          }`}>
            {input || <span className="text-slate-300">—</span>}
            {feedback === 'correct' && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2">✓</motion.span>}
            {feedback === 'wrong' && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2">✗</motion.span>}
          </div>

          <NumberPad value={input} onChange={setInput} onSubmit={onSubmit} />
        </div>
      </motion.div>
    )
  }

  /* ═══════════════════════════════ VICTORY ═══════════════════════════════ */
  if (gameOver && winner) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }} className="text-center relative"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i} className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: ['#FCD34D', '#6366F1', '#F43F5E', '#34D399', '#818CF8', '#FB7185'][i % 6], left: '50%', top: '50%' }}
              animate={{ x: [0, (Math.random() - 0.5) * 300], y: [0, (Math.random() - 0.5) * 300], opacity: [1, 0], scale: [1, 0] }}
              transition={{ duration: 1.5, delay: i * 0.05, ease: 'easeOut' }}
            />
          ))}
          <Card className={`p-10 ${isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white border-slate-200'} shadow-2xl`}>
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}>
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${winner === 1 ? 'from-indigo-600 to-blue-500' : 'from-rose-600 to-red-500'} flex items-center justify-center shadow-xl`}>
                <Trophy className="text-white" size={48} />
              </div>
            </motion.div>
            <h2 className={`${textColor} text-3xl font-bold mb-3`}>🎉 {winner}-Команда победила! 🎉</h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-indigo-500 font-bold text-2xl">{team1Score}</div>
                <div className={`text-xs ${textMuted}`}>Синие</div>
              </div>
              <div className={`text-2xl ${textMuted}`}>—</div>
              <div className="text-center">
                <div className="text-rose-500 font-bold text-2xl">{team2Score}</div>
                <div className={`text-xs ${textMuted}`}>Красные</div>
              </div>
            </div>
            <Button variant="primary" size="lg" onClick={handleRestart} className="px-10">
              <RotateCcw size={20} className="mr-2" /> Играть снова
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  /* ═══════════════════════════════ MAIN GAME ═══════════════════════════════ */

  // Rope offset: maps position (0-100) so that the entire assembly slides
  // (50-position) gives range -35 to +35 within playable area
  // Multiply by 3 to get pixel offset for visible movement
  const ropeOffset = (50 - position) * 3

  return (
    <div className="w-full select-none">
      {/* Title */}
      <motion.div className="text-center mb-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className={`${textColor} text-2xl font-bold flex items-center justify-center gap-2`}>
          <motion.span animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>🏆</motion.span>
          ПЕРЕТЯГИВАНИЕ КАНАТА
          <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>🏆</motion.span>
        </h2>
        <p className={`${textMuted} text-sm mt-1`}>Правильный ответ тянет канат на вашу сторону!</p>
      </motion.div>

      {/* 3-column layout */}
      <div className="grid grid-cols-[1fr_1.6fr_1fr] gap-3 items-start">

        {/* ── Team 1 Panel ── */}
        <TeamPanel team={1} question={team1Question} input={team1Input} setInput={setTeam1Input}
          onSubmit={() => handleSubmit(1)} score={team1Score} feedback={team1Feedback} combo={combo1} teamColor="blue" />

        {/* ── Center: Arena + Progress ── */}
        <div className="flex flex-col items-center gap-3">

          {/* ─── ARENA ─── */}
          <div className={`relative w-full rounded-2xl overflow-hidden shadow-lg ${
            isDark
              ? 'bg-gradient-to-b from-slate-800 via-emerald-900 to-emerald-950 border border-emerald-600/40'
              : 'bg-gradient-to-b from-sky-200 via-green-200 to-green-400 border border-green-300'
          }`} style={{ height: 260 }}>

            {/* ── Sky decorations (FIXED) ── */}
            <motion.div className={`absolute top-4 right-6 w-8 h-8 rounded-full ${isDark ? 'bg-slate-300 shadow-slate-300/30' : 'bg-yellow-300 shadow-yellow-300/50'} shadow-lg`}
              animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className={`absolute top-5 left-[12%] ${isDark ? 'opacity-20' : 'opacity-50'}`}
              animate={{ x: [0, 40, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}>
              <div className="flex">
                <div className="w-8 h-4 bg-white rounded-full" />
                <div className="w-10 h-6 bg-white rounded-full -mt-2 -ml-3" />
                <div className="w-7 h-4 bg-white rounded-full -ml-2" />
              </div>
            </motion.div>

            {/* ── Grass (FIXED) ── */}
            <div className={`absolute bottom-0 left-0 right-0 h-10 ${isDark ? 'bg-emerald-800' : 'bg-green-500'}`}>
              {grassBlades.map((g, i) => (
                <div key={i} className={`absolute bottom-0 w-[2px] ${isDark ? 'bg-emerald-600/50' : 'bg-green-600/40'}`}
                  style={{ left: g.left, height: g.height, transform: `rotate(${g.rotate})` }} />
              ))}
            </div>

            {/* ── Win zones (FIXED on the field) ── */}
            <div className={`absolute left-0 top-0 bottom-0 rounded-l-2xl ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-400/20'}`} style={{ width: `${WIN_ZONE}%` }}>
              <div className={`absolute right-0 top-0 bottom-0 w-px ${isDark ? 'bg-indigo-400/50' : 'bg-indigo-500/40'}`}
                style={{ borderRight: '2px dashed', borderColor: isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.4)' }} />
            </div>
            <div className={`absolute right-0 top-0 bottom-0 rounded-r-2xl ${isDark ? 'bg-rose-500/15' : 'bg-rose-400/20'}`} style={{ width: `${WIN_ZONE}%` }}>
              <div className={`absolute left-0 top-0 bottom-0 w-px`}
                style={{ borderLeft: '2px dashed', borderColor: isDark ? 'rgba(251,113,133,0.4)' : 'rgba(244,63,94,0.4)' }} />
            </div>

            {/* ── Center line (FIXED) ── */}
            <div className={`absolute w-0.5 h-full left-1/2 -translate-x-1/2 z-10 ${isDark ? 'bg-white/25' : 'bg-white/60'}`} />

            {/* ═══ MOVING GROUP — everything slides together ═══ */}
            <motion.div
              className="absolute inset-0"
              animate={{ x: ropeOffset }}
              transition={{ type: 'spring', stiffness: 80, damping: 14 }}
            >
              {/* ── ROPE — at character hand height ── */}
              {/* Chars: 90px tall, bottom-10 (40px). Hand SVG y=36. From arena top: (260-40-90)+36 = 166px ≈ 64% */}
              <div className="absolute left-[-15%] right-[-15%]" style={{ top: '64%' }}>
                <div className="absolute w-full h-[6px] rounded-full bg-black/15 top-[3px] blur-[1px]" />
                <div className="relative w-full h-[6px] rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, #D4A040 0%, #B8860B 35%, #8B6914 65%, #6B4F10 100%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
                  }}
                >
                  {/* Rope twist texture */}
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} className="absolute top-0 h-full opacity-20"
                      style={{ left: `${i * 2}%`, width: 1, background: i % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.15)' }} />
                  ))}
                </div>
              </div>

              {/* ── Team 1 Characters (left side, pulling LEFT) ── */}
              <div className="absolute left-[8%] bottom-10">
                <TeamCharacters teamColor="blue" direction="left" isPulling={team1Pulling || position < 48} />
              </div>

              {/* ── Flag / Ribbon on the rope (center of the rope group) ── */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: '52%' }}>
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex flex-col items-center">
                  <motion.div className="w-7 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-sm shadow-lg"
                    style={{ clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)' }}
                    animate={{ scaleX: [1, 0.9, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  <div className="w-1 h-8 bg-slate-500 rounded-full shadow" />
                </motion.div>
              </div>

              {/* ── Team 2 Characters (right side, pulling RIGHT) ── */}
              <div className="absolute right-[8%] bottom-10">
                <TeamCharacters teamColor="red" direction="right" isPulling={team2Pulling || position > 52} />
              </div>
            </motion.div>
          </div>

          {/* ─── PROGRESS BAR ─── */}
          <div className="w-full px-1">
            <div className={`h-6 rounded-full relative overflow-hidden shadow-inner ${
              isDark ? 'bg-slate-700/80 border border-slate-600/50' : 'bg-slate-200 border border-slate-300'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/50 via-transparent to-rose-500/50" />
              {/* Win zones on bar */}
              <div className="absolute left-0 top-0 bottom-0 bg-indigo-500/20 rounded-l-full" style={{ width: `${WIN_ZONE}%` }} />
              <div className="absolute right-0 top-0 bottom-0 bg-rose-500/20 rounded-r-full" style={{ width: `${WIN_ZONE}%` }} />
              {/* Indicator */}
              <motion.div animate={{ left: `${position}%` }} transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                <div className="w-7 h-7 rounded-full bg-white shadow-lg border-2 border-slate-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                </div>
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5 text-sm font-bold px-1">
              <span className="text-indigo-500 flex items-center gap-1"><Trophy size={14} /> ПОБЕДА</span>
              <motion.span className={textMuted} key={position} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                {position < 50 ? `← ${50 - position}%` : position > 50 ? `${position - 50}% →` : '0%'}
              </motion.span>
              <span className="text-rose-500 flex items-center gap-1">ПОБЕДА <Trophy size={14} /></span>
            </div>
          </div>

          {/* Restart */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="secondary" onClick={handleRestart}>
              <RotateCcw size={16} className="mr-2" /> Заново
            </Button>
          </motion.div>
        </div>

        {/* ── Team 2 Panel ── */}
        <TeamPanel team={2} question={team2Question} input={team2Input} setInput={setTeam2Input}
          onSubmit={() => handleSubmit(2)} score={team2Score} feedback={team2Feedback} combo={combo2} teamColor="red" />
      </div>
    </div>
  )
}
