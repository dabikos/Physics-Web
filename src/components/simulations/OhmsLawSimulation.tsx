import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface OhmsLawSimulationProps {
  topicTitle?: string
  voltage?: number
  resistance?: number
  onParamsChange?: (params: { voltage: number; resistance: number }) => void
}

export function OhmsLawSimulation({
  topicTitle,
  voltage: voltageProp,
  resistance: resistanceProp,
  onParamsChange,
}: OhmsLawSimulationProps) {
  const { theme } = useTheme()
  const [voltage, setVoltage] = useState(voltageProp ?? 12)
  const [resistance, setResistance] = useState(resistanceProp ?? 6)
  const [isRunning, setIsRunning] = useState(false)
  const [timeScale, setTimeScale] = useState(1)
  const [phase, setPhase] = useState(0)
  const phaseRef = useRef(0)

  const current = useMemo(() => (resistance === 0 ? 0 : voltage / resistance), [voltage, resistance])
  const power = useMemo(() => voltage * current, [voltage, current])
  const glow = Math.min(Math.max(current / 4, 0), 1)
  const arrowLength = 80 + glow * 80
  const speed = 0.3 + glow * 1.2

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'
  const trackBg = theme === 'dark' ? 'bg-slate-900/60 border border-white/10' : 'bg-slate-50 border border-slate-200'
  const valueBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'

  useEffect(() => {
    if (voltageProp != null && voltageProp !== voltage) setVoltage(voltageProp)
  }, [voltageProp])

  useEffect(() => {
    if (resistanceProp != null && resistanceProp !== resistance) setResistance(resistanceProp)
  }, [resistanceProp])

  const updateVoltage = (value: number) => {
    setVoltage(value)
    onParamsChange?.({ voltage: value, resistance })
  }

  const updateResistance = (value: number) => {
    setResistance(value)
    onParamsChange?.({ voltage, resistance: value })
  }

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (!isRunning) return
    let rafId = 0
    let last = 0

    const step = (timestamp: number) => {
      if (!last) last = timestamp
      const delta = (timestamp - last) / 1000
      last = timestamp
      const next = (phaseRef.current + delta * speed * timeScale) % 1
      phaseRef.current = next
      setPhase(next)
      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, speed, timeScale])

  const handleReset = () => {
    setIsRunning(false)
    setPhase(0)
    phaseRef.current = 0
  }

  const dotOffsets = [0, 0.22, 0.44, 0.66, 0.88]

  return (
    <Card className={`w-full p-6 ${panelBg}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className={`text-2xl font-bold ${textColor}`}>Закон Ома</h3>
          <p className={textMuted}>Связь напряжения, сопротивления и тока</p>
          {topicTitle && (
            <div className={`${textMuted} text-sm mt-1`}>Тема: {topicTitle}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRunning(prev => !prev)}
            className={theme === 'dark' ? '' : 'bg-slate-900 text-white hover:bg-slate-800'}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? 'Пауза' : 'Старт'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className={theme === 'dark' ? '' : 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200'}
          >
            <RotateCcw size={16} />
            Сброс
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <div className={`rounded-2xl p-5 ${trackBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${textMuted} text-sm`}>Схема цепи</span>
              <span className={`${textMuted} text-sm`}>I = {current.toFixed(2)} A</span>
            </div>
            <div className={`rounded-2xl p-4 ${valueBg}`}>
              <svg viewBox="0 0 520 180" className="w-full h-48 md:h-52">
                <defs>
                  <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#facc15" stopOpacity={0.2 + glow * 0.6} />
                    <stop offset="70%" stopColor="#f59e0b" stopOpacity={0.1 + glow * 0.4} />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect x="40" y="40" width="440" height="100" rx="24" fill={theme === 'dark' ? '#0f172a' : '#f8fafc'} stroke={theme === 'dark' ? '#334155' : '#cbd5f5'} strokeWidth="2" />

                <line x1="120" y1="90" x2="230" y2="90" stroke={theme === 'dark' ? '#94a3b8' : '#475569'} strokeWidth="6" strokeLinecap="round" />
                <line x1="300" y1="90" x2="410" y2="90" stroke={theme === 'dark' ? '#94a3b8' : '#475569'} strokeWidth="6" strokeLinecap="round" />

                <rect x="235" y="70" width="60" height="40" rx="10" fill={theme === 'dark' ? '#1e293b' : '#e2e8f0'} stroke={theme === 'dark' ? '#475569' : '#94a3b8'} strokeWidth="2" />
                <text x="265" y="96" textAnchor="middle" fill={theme === 'dark' ? '#e2e8f0' : '#334155'} fontSize="16" fontWeight="600">R</text>

                <circle cx="90" cy="90" r="28" fill="url(#bulbGlow)" />
                <circle cx="90" cy="90" r="20" fill={theme === 'dark' ? '#fbbf24' : '#f59e0b'} opacity={0.35 + glow * 0.65} />
                <circle cx="90" cy="90" r="12" fill={theme === 'dark' ? '#fde68a' : '#fef3c7'} opacity={0.35 + glow * 0.65} />

                <line x1="420" y1="90" x2={420 + arrowLength} y2="90" stroke={theme === 'dark' ? '#a78bfa' : '#7c3aed'} strokeWidth="4" strokeLinecap="round" />
                <polygon points={`${420 + arrowLength},90 ${420 + arrowLength - 14},82 ${420 + arrowLength - 14},98`} fill={theme === 'dark' ? '#a78bfa' : '#7c3aed'} />
                <text x={420 + arrowLength - 10} y="70" textAnchor="end" fill={theme === 'dark' ? '#e2e8f0' : '#475569'} fontSize="12">I</text>

                {dotOffsets.map((offset, index) => {
                  const t = (phase + offset) % 1
                  const x = 120 + t * 290
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={90}
                      r={4}
                      fill={theme === 'dark' ? '#38bdf8' : '#0ea5e9'}
                      opacity={0.4 + glow * 0.6}
                    />
                  )
                })}
              </svg>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${valueBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${textMuted} text-sm`}>Параметры цепи</span>
              <span className={`${textMuted} text-sm`}>P = {power.toFixed(2)} Вт</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-xl p-4 ${panelBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>Напряжение</div>
                <div className={`text-xl font-semibold ${textColor}`}>{voltage.toFixed(1)} В</div>
              </div>
              <div className={`rounded-xl p-4 ${panelBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>Ток</div>
                <div className={`text-xl font-semibold ${textColor}`}>{current.toFixed(2)} A</div>
              </div>
              <div className={`rounded-xl p-4 ${panelBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>Сопротивление</div>
                <div className={`text-xl font-semibold ${textColor}`}>{resistance.toFixed(1)} Ом</div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-2`}>Формулы</div>
            <div className="space-y-2">
              <MarkdownRenderer content="$I = \frac{U}{R}$" className={textColor} />
              <MarkdownRenderer content="$P = U \cdot I$" className={textColor} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-4`}>Параметры</div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>U (напряжение)</span>
                  <span className={`${textMuted} text-sm`}>{voltage.toFixed(1)} В</span>
                </div>
                <Slider min={0} max={24} step={0.5} value={voltage} onChange={updateVoltage} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>R (сопротивление)</span>
                  <span className={`${textMuted} text-sm`}>{resistance.toFixed(1)} Ом</span>
                </div>
                <Slider min={1} max={20} step={0.5} value={resistance} onChange={updateResistance} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>Скорость анимации</span>
                  <span className={`${textMuted} text-sm`}>{timeScale.toFixed(1)}x</span>
                </div>
                <Slider min={0.5} max={3} step={0.1} value={timeScale} onChange={setTimeScale} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-2`}>Подсказка</div>
            <p className={`${textMuted} text-sm leading-relaxed`}>Увеличьте напряжение — ток растёт. Увеличьте сопротивление — ток падает. Это основа анализа электрических цепей.</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
