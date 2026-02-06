import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'

interface UniformAccelerationSimulationProps {
  topicTitle?: string
  v0?: number
  accel?: number
  timeScale?: number
  onParamsChange?: (params: { v0: number; accel: number; timeScale: number }) => void
}

const MAX_TIME = 10
const CAR_WIDTH = 56
const CAR_HEIGHT = 28

export function UniformAccelerationSimulation({
  topicTitle,
  v0: v0Prop,
  accel: accelProp,
  timeScale: timeScaleProp,
  onParamsChange,
}: UniformAccelerationSimulationProps) {
  const { theme } = useTheme()
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [v0, setV0] = useState(v0Prop ?? 2)
  const [accel, setAccel] = useState(accelProp ?? 1)
  const [timeScale, setTimeScale] = useState(timeScaleProp ?? 1)
  const [trackWidth, setTrackWidth] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef(0)

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'
  const trackBg = theme === 'dark' ? 'bg-slate-900/60 border border-white/10' : 'bg-slate-50 border border-slate-200'
  const valueBg = theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const updateWidth = () => setTrackWidth(el.clientWidth)
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    timeRef.current = time
  }, [time])

  useEffect(() => {
    if (v0Prop != null && v0Prop !== v0) setV0(v0Prop)
  }, [v0Prop])

  useEffect(() => {
    if (accelProp != null && accelProp !== accel) setAccel(accelProp)
  }, [accelProp])

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

      const nextTime = Math.min(MAX_TIME, timeRef.current + delta * timeScale)
      timeRef.current = nextTime
      setTime(nextTime)

      if (nextTime < MAX_TIME) {
        rafId = requestAnimationFrame(step)
      } else {
        setIsRunning(false)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, timeScale])

  const distance = useMemo(() => v0 * time + 0.5 * accel * time * time, [v0, accel, time])
  const velocity = useMemo(() => v0 + accel * time, [v0, accel, time])

  const range = useMemo(() => {
    const values = [0, v0 * MAX_TIME + 0.5 * accel * MAX_TIME * MAX_TIME]
    if (accel !== 0) {
      const tCrit = -v0 / accel
      if (tCrit > 0 && tCrit < MAX_TIME) {
        values.push(v0 * tCrit + 0.5 * accel * tCrit * tCrit)
      }
    }
    const min = Math.min(...values)
    const max = Math.max(...values)
    return { min, max }
  }, [v0, accel])

  const normalized = range.max === range.min ? 0 : (distance - range.min) / (range.max - range.min)
  const travel = Math.max(trackWidth - CAR_WIDTH, 1)
  const position = Math.min(Math.max(normalized, 0), 1) * travel

  const maxVelocity = Math.max(Math.abs(v0), Math.abs(v0 + accel * MAX_TIME), 1)
  const velocityScale = Math.min(Math.abs(velocity) / maxVelocity, 1)
  const arrowWidth = 40 + velocityScale * 80

  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
    timeRef.current = 0
  }

  const handleScrub = (value: number) => {
    setIsRunning(false)
    setTime(value)
    timeRef.current = value
  }

  const updateV0 = (value: number) => {
    setV0(value)
    onParamsChange?.({ v0: value, accel, timeScale })
  }

  const updateAccel = (value: number) => {
    setAccel(value)
    onParamsChange?.({ v0, accel: value, timeScale })
  }

  const updateTimeScale = (value: number) => {
    setTimeScale(value)
    onParamsChange?.({ v0, accel, timeScale: value })
  }

  return (
    <Card className={`w-full p-6 ${panelBg}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className={`text-2xl font-bold ${textColor}`}>{'Равноускоренное движение'}</h3>
          <p className={textMuted}>{'s(t), v(t) и наглядная траектория'}</p>
          {topicTitle && (
            <div className={`${textMuted} text-sm mt-1`}>{'Тема:'} {topicTitle}</div>
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
              <span className={`${textMuted} text-sm`}>{'Траектория'}</span>
              <span className={`${textMuted} text-sm`}>t = {time.toFixed(2)} с</span>
            </div>
            <div ref={trackRef} className="relative h-28">
              <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
              <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${position}px` }}>
                <div className="relative">
                  <svg width={CAR_WIDTH} height={CAR_HEIGHT} viewBox="0 0 56 28" className="drop-shadow-lg">
                    <rect x="8" y="10" width="38" height="10" rx="4" fill={theme === 'dark' ? '#a78bfa' : '#7c3aed'} />
                    <path d="M14 10 L22 4 H34 L40 10 Z" fill={theme === 'dark' ? '#c4b5fd' : '#a855f7'} />
                    <rect x="24" y="6" width="8" height="4" rx="1.5" fill={theme === 'dark' ? '#0f172a' : '#ede9fe'} opacity="0.9" />
                    <circle cx="18" cy="22" r="4.5" fill={theme === 'dark' ? '#111827' : '#1f2937'} />
                    <circle cx="36" cy="22" r="4.5" fill={theme === 'dark' ? '#111827' : '#1f2937'} />
                    <circle cx="18" cy="22" r="2" fill={theme === 'dark' ? '#94a3b8' : '#e2e8f0'} />
                    <circle cx="36" cy="22" r="2" fill={theme === 'dark' ? '#94a3b8' : '#e2e8f0'} />
                  </svg>
                  <div className={`${textMuted} text-xs mt-2 text-center`}>s = {distance.toFixed(2)} м</div>
                </div>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 flex items-center" style={{ left: `${position}px`, transform: `translate(-10px, -50%) scaleX(${velocity < 0 ? -1 : 1})` }}>
                <svg width={arrowWidth} height="12" viewBox={`0 0 ${arrowWidth} 12`}>
                  <line x1="0" y1="6" x2={arrowWidth - 10} y2="6" stroke={theme === 'dark' ? '#a78bfa' : '#7c3aed'} strokeWidth="2" />
                  <polygon points={`${arrowWidth - 10},2 ${arrowWidth},6 ${arrowWidth - 10},10`} fill={theme === 'dark' ? '#a78bfa' : '#7c3aed'} />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mt-3">
              <span className={textMuted}>s(min) = {range.min.toFixed(2)} м</span>
              <span className={textMuted}>s(max) = {range.max.toFixed(2)} м</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-2xl p-4 ${valueBg}`}>
              <div className={`${textMuted} text-xs mb-1`}>{'Скорость'}</div>
              <div className={`text-xl font-semibold ${textColor}`}>{velocity.toFixed(2)} м/с</div>
            </div>
            <div className={`rounded-2xl p-4 ${valueBg}`}>
              <div className={`${textMuted} text-xs mb-1`}>{'Ускорение'}</div>
              <div className={`text-xl font-semibold ${textColor}`}>{accel.toFixed(2)} м/с²</div>
            </div>
            <div className={`rounded-2xl p-4 ${valueBg}`}>
              <div className={`${textMuted} text-xs mb-1`}>{'Время'}</div>
              <div className={`text-xl font-semibold ${textColor}`}>{time.toFixed(2)} с</div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-3`}>{'Формулы'}</div>
            <div className="space-y-2">
              <MarkdownRenderer content="$s = v_0 t + \\frac{1}{2} a t^2$" className={textColor} />
              <MarkdownRenderer content="$v = v_0 + a t$" className={textColor} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-4`}>{'Параметры'}</div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>{'Начальная скорость v₀'}</span>
                  <span className={`${textMuted} text-sm`}>{v0.toFixed(1)} м/с</span>
                </div>
                <Slider min={-5} max={10} step={0.5} value={v0} onChange={updateV0} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>{'Ускорение a'}</span>
                  <span className={`${textMuted} text-sm`}>{accel.toFixed(1)} м/с²</span>
                </div>
                <Slider min={-3} max={5} step={0.2} value={accel} onChange={updateAccel} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>{'Скорость времени'}</span>
                  <span className={`${textMuted} text-sm`}>{timeScale.toFixed(1)}x</span>
                </div>
                <Slider min={0.5} max={3} step={0.1} value={timeScale} onChange={updateTimeScale} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${textColor} text-sm`}>{'Время t'}</span>
                  <span className={`${textMuted} text-sm`}>{time.toFixed(2)} с</span>
                </div>
                <Slider min={0} max={MAX_TIME} step={0.1} value={time} onChange={handleScrub} className={theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${panelBg}`}>
            <div className={`${textMuted} text-sm mb-2`}>{'Подсказка'}</div>
            <p className={`${textMuted} text-sm leading-relaxed`}>
              {'Меняйте параметры и наблюдайте, как меняются скорость и путь. При отрицательном ускорении тело'}
              {'может замедляться и менять направление.'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
