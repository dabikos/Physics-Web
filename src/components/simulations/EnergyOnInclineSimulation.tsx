import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { Play, Pause, RotateCcw } from 'lucide-react'

const G = 9.8

interface EnergyOnInclineSimulationProps {
  topicTitle?: string
  mass?: number
  height?: number
  angle?: number
  mu?: number
  timeScale?: number
  onParamsChange?: (params: { mass: number; height: number; angle: number; mu: number; timeScale: number }) => void
}

export function EnergyOnInclineSimulation({
  topicTitle,
  mass: massProp,
  height: heightProp,
  angle: angleProp,
  mu: muProp,
  timeScale: timeScaleProp,
  onParamsChange,
}: EnergyOnInclineSimulationProps) {
  const { theme } = useTheme()
  const [mass, setMass] = useState(massProp ?? 2)
  const [height, setHeight] = useState(heightProp ?? 2)
  const [angle, setAngle] = useState(angleProp ?? 30)
  const [mu, setMu] = useState(muProp ?? 0.1)
  const [isRunning, setIsRunning] = useState(false)
  const [timeScale, setTimeScale] = useState(timeScaleProp ?? 1)
  const [position, setPosition] = useState(0)
  const positionRef = useRef(0)

  const rad = (angle * Math.PI) / 180
  const length = height / Math.max(Math.sin(rad), 0.1)
  const potential = useMemo(() => mass * G * height, [mass, height])
  const friction = useMemo(() => mu * mass * G * Math.cos(rad) * length, [mu, mass, rad, length])
  const kinetic = Math.max(0, potential - friction)
  const speed = Math.sqrt((2 * kinetic) / Math.max(mass, 0.1))
  const progress = potential > 0 ? Math.min(Math.max(kinetic / potential, 0), 1) : 0
  const speedFactor = Math.min(Math.max(speed / 6, 0.15), 1.2)
  const displayProgress = isRunning ? position : progress
  const massNorm = Math.min(Math.max((mass - 0.5) / 9.5, 0), 1)
  const heightNorm = Math.min(Math.max((height - 0.5) / 5.5, 0), 1)
  const angleNorm = Math.min(Math.max((angle - 15) / 45, 0), 1)
  const sizeScale = 0.9 + 0.3 * massNorm
  const ballRadius = 16 * sizeScale
  const ballInner = 8 * sizeScale

  const baseY = 150
  const leftX = 90
  const rightX = 430
  const rampLen = 120 + heightNorm * 60
  const tan = Math.max(Math.tan(rad), 0.2)
  const rawTopY = baseY - rampLen * Math.sin(rad)
  const topY = Math.max(rawTopY, 20)
  const topX = leftX + (baseY - topY) / tan

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'
  const trackBg = theme === 'dark' ? 'bg-slate-900/60 border border-white/10' : 'bg-slate-50 border border-slate-200'
  const valueBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    if (massProp != null && massProp !== mass) setMass(massProp)
  }, [massProp])

  useEffect(() => {
    if (heightProp != null && heightProp !== height) setHeight(heightProp)
  }, [heightProp])

  useEffect(() => {
    if (angleProp != null && angleProp !== angle) setAngle(angleProp)
  }, [angleProp])

  useEffect(() => {
    if (muProp != null && muProp !== mu) setMu(muProp)
  }, [muProp])

  useEffect(() => {
    if (timeScaleProp != null && timeScaleProp !== timeScale) setTimeScale(timeScaleProp)
  }, [timeScaleProp])

  useEffect(() => {
    if (!isRunning) return
    let rafId = 0
    let last = 0

    const step = (timestamp: number) => {
      if (!last) last = timestamp
      const delta = (timestamp - last) / 1000
      last = timestamp
      let next = positionRef.current + delta * speedFactor * timeScale
      if (next >= 1) next = 0
      positionRef.current = next
      setPosition(next)
      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, speedFactor, timeScale])

  const handleReset = () => {
    setIsRunning(false)
    setPosition(0)
    positionRef.current = 0
  }

  const updateMass = (value: number) => {
    setMass(value)
    onParamsChange?.({ mass: value, height, angle, mu, timeScale })
  }

  const updateHeight = (value: number) => {
    setHeight(value)
    onParamsChange?.({ mass, height: value, angle, mu, timeScale })
  }

  const updateAngle = (value: number) => {
    setAngle(value)
    onParamsChange?.({ mass, height, angle: value, mu, timeScale })
  }

  const updateMu = (value: number) => {
    setMu(value)
    onParamsChange?.({ mass, height, angle, mu: value, timeScale })
  }

  const updateTimeScale = (value: number) => {
    setTimeScale(value)
    onParamsChange?.({ mass, height, angle, mu, timeScale: value })
  }

  return (
    <Card className={`w-full p-6 ${panelBg}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className={`text-2xl font-bold ${textColor}`}>Энергия на наклонной плоскости</h3>
          <p className={textMuted}>Переход потенциальной энергии в кинетическую</p>
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
              <span className={`${textMuted} text-sm`}>Наклонная плоскость</span>
              <span className={`${textMuted} text-sm`}>v = {speed.toFixed(2)} м/с</span>
            </div>
            <div className={`rounded-2xl p-4 ${valueBg}`}>
              <svg viewBox="0 0 520 200" className="w-full h-56 md:h-64">
                <rect x="30" y="30" width="460" height="140" rx="20" fill={theme === 'dark' ? '#0f172a' : '#f8fafc'} stroke={theme === 'dark' ? '#334155' : '#cbd5f5'} strokeWidth="2" />
                <polygon points={`${leftX},${baseY} ${rightX},${baseY} ${topX},${topY}`} fill={theme === 'dark' ? '#1e293b' : '#e2e8f0'} stroke={theme === 'dark' ? '#475569' : '#94a3b8'} strokeWidth="2" />

                <line x1={leftX} y1={baseY} x2={rightX} y2={baseY} stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} strokeWidth="4" />
                <line x1={leftX} y1={baseY} x2={topX} y2={topY} stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} strokeWidth="4" />
                <line x1={topX} y1={topY} x2={rightX} y2={baseY} stroke={theme === 'dark' ? '#cbd5f5' : '#64748b'} strokeWidth="6" />

                {(() => {
                  const x = topX + (rightX - topX) * displayProgress
                  const y = topY + (baseY - topY) * displayProgress
                  const centerY = y - ballRadius
                  return (
                    <>
                      <circle cx={x} cy={centerY} r={ballRadius} fill={theme === 'dark' ? '#38bdf8' : '#0ea5e9'} stroke={theme === 'dark' ? '#e0f2fe' : '#0f172a'} strokeWidth="2" />
                      <circle cx={x} cy={centerY} r={ballInner} fill={theme === 'dark' ? '#bae6fd' : '#e0f2fe'} opacity="0.9" />
                    </>
                  )
                })()}
                <text x="420" y="60" textAnchor="end" fill={theme === 'dark' ? '#e2e8f0' : '#475569'} fontSize="12">h</text>
                <text x="420" y="170" textAnchor="end" fill={theme === 'dark' ? '#e2e8f0' : '#475569'} fontSize="12">L</text>
              </svg>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${valueBg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${textMuted} text-sm`}>Энергии</span>
              <span className={`${textMuted} text-sm`}>L = {length.toFixed(2)} м</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-xl p-4 ${panelBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>E_p</div>
                <div className={`text-lg font-semibold ${textColor}`}>{potential.toFixed(1)} Дж</div>
              </div>
              <div className={`rounded-xl p-4 ${panelBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>A_f</div>
                <div className={`text-lg font-semibold ${textColor}`}>{friction.toFixed(1)} Дж</div>
              </div>
              <div className={`rounded-xl p-4 ${panelBg}`}>
                <div className={`${textMuted} text-xs mb-1`}>E_k</div>
                <div className={`text-lg font-semibold ${textColor}`}>{kinetic.toFixed(1)} Дж</div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-2`}>Формулы</div>
            <div className="space-y-2">
              <MarkdownRenderer content="$E_p = mgh$" className={textColor} />
              <MarkdownRenderer content="$A_f = \mu m g \cos \alpha \cdot L$" className={textColor} />
              <MarkdownRenderer content="$E_k = E_p - A_f$" className={textColor} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-4`}>Параметры</div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>Масса</span>
                  <span className={`${textMuted} text-sm`}>{mass.toFixed(1)} кг</span>
                </div>
                <Slider min={0.5} max={10} step={0.5} value={mass} onChange={updateMass} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>Высота</span>
                  <span className={`${textMuted} text-sm`}>{height.toFixed(1)} м</span>
                </div>
                <Slider min={0.5} max={6} step={0.2} value={height} onChange={updateHeight} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>Угол</span>
                  <span className={`${textMuted} text-sm`}>{angle.toFixed(0)}°</span>
                </div>
                <Slider min={15} max={60} step={1} value={angle} onChange={updateAngle} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>Коэф. трения μ</span>
                  <span className={`${textMuted} text-sm`}>{mu.toFixed(2)}</span>
                </div>
                <Slider min={0} max={0.6} step={0.05} value={mu} onChange={updateMu} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>Скорость анимации</span>
                  <span className={`${textMuted} text-sm`}>{timeScale.toFixed(1)}x</span>
                </div>
                <Slider min={0.5} max={3} step={0.1} value={timeScale} onChange={updateTimeScale} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-2`}>Подсказка</div>
            <p className={`${textMuted} text-sm leading-relaxed`}>Если трение велико, вся потенциальная энергия уходит на работу трения, и скорость внизу может стать близкой к нулю.</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
