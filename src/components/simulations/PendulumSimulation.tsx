import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Play, Pause, RotateCcw, Activity, Sparkles, Sliders } from 'lucide-react'

export interface PendulumParams {
  type: 'thread' | 'spring'
  length: number
  mass: number
  stiffness: number
  initDisplacement: number
  damping: number
  timeScale: number
}

interface PendulumSimulationProps {
  topicTitle?: string
  pendulumType?: 'thread' | 'spring'
  length?: number
  mass?: number
  stiffness?: number
  initDisplacement?: number
  damping?: number
  timeScale?: number
  onParamsChange?: (params: PendulumParams) => void
}

export function PendulumSimulation({
  topicTitle,
  pendulumType: typeProp,
  length: lengthProp,
  mass: massProp,
  stiffness: stiffnessProp,
  initDisplacement: initDispProp,
  damping: dampingProp,
  timeScale: timeScaleProp,
  onParamsChange,
}: PendulumSimulationProps) {
  const { theme } = useTheme()

  const [pendulumType, setPendulumType] = useState<'thread' | 'spring'>(typeProp ?? 'thread')
  const [length, setLength] = useState(lengthProp ?? 2) // Длина нити (м)
  const [mass, setMass] = useState(massProp ?? 1) // Масса груза (кг)
  const [stiffness, setStiffness] = useState(stiffnessProp ?? 50) // Жесткость пружины k (Н/м)
  const [initDisplacement, setInitDisplacement] = useState(initDispProp ?? 30) // Угол (град) или смещение (см)
  const [damping, setDamping] = useState(dampingProp ?? 0.02) // Коэффициент затухания
  const [timeScale, setTimeScale] = useState(timeScaleProp ?? 1)
  const [isRunning, setIsRunning] = useState(false)
  const [simTime, setSimTime] = useState(0)

  // История смещений x(t) для графика волны
  const waveHistoryRef = useRef<number[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)

  const G = 9.81

  // Физические параметры колебаний
  const omega0 = useMemo(() => {
    if (pendulumType === 'thread') {
      return Math.sqrt(G / Math.max(0.1, length))
    }
    return Math.sqrt(stiffness / Math.max(0.05, mass))
  }, [pendulumType, length, stiffness, mass])

  const period = useMemo(() => (2 * Math.PI) / omega0, [omega0])
  const frequency = useMemo(() => 1 / period, [period])

  // Текущее состояние при заданном simTime
  const decayFactor = useMemo(() => Math.exp(-damping * simTime), [damping, simTime])

  // Угол для нитяного (рад) или смещение для пружинного (м)
  const initAmp = useMemo(() => {
    if (pendulumType === 'thread') return (initDisplacement * Math.PI) / 180
    return initDisplacement / 100 // см -> м
  }, [pendulumType, initDisplacement])

  const currentVal = useMemo(() => {
    return initAmp * decayFactor * Math.cos(omega0 * simTime)
  }, [initAmp, decayFactor, omega0, simTime])

  // Скорость v(t)
  const currentSpeed = useMemo(() => {
    const deriv = -initAmp * decayFactor * (omega0 * Math.sin(omega0 * simTime) + damping * Math.cos(omega0 * simTime))
    if (pendulumType === 'thread') {
      return Math.abs(deriv * length)
    }
    return Math.abs(deriv)
  }, [initAmp, decayFactor, omega0, simTime, damping, pendulumType, length])

  // Энергии
  const { eK, eP, eTotal } = useMemo(() => {
    const kEnergy = 0.5 * mass * currentSpeed * currentSpeed
    let pEnergy = 0

    if (pendulumType === 'thread') {
      // Ep = m*g*h = m*g*L*(1 - cos(theta))
      pEnergy = mass * G * length * (1 - Math.cos(currentVal))
    } else {
      // Ep = 0.5 * k * x^2
      pEnergy = 0.5 * stiffness * currentVal * currentVal
    }

    return {
      eK: Math.max(0, kEnergy),
      eP: Math.max(0, pEnergy),
      eTotal: Math.max(0, kEnergy + pEnergy),
    }
  }, [mass, currentSpeed, pendulumType, length, currentVal, stiffness])

  // Уведомление внешнего контекста
  useEffect(() => {
    onParamsChange?.({
      type: pendulumType,
      length,
      mass,
      stiffness,
      initDisplacement,
      damping,
      timeScale,
    })
  }, [pendulumType, length, mass, stiffness, initDisplacement, damping, timeScale, onParamsChange])

  // Сброс при смене параметров во время паузы
  useEffect(() => {
    if (!isRunning) {
      setSimTime(0)
      waveHistoryRef.current = []
    }
  }, [pendulumType, length, mass, stiffness, initDisplacement, damping, isRunning])

  // Анимационный цикл
  useEffect(() => {
    if (!isRunning) {
      lastTimestampRef.current = null
      return
    }

    const loop = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
      }
      const deltaSec = ((timestamp - lastTimestampRef.current) / 1000) * timeScale
      lastTimestampRef.current = timestamp

      setSimTime((prev) => prev + deltaSec)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isRunning, timeScale])

  // Запись истории для графика синусоиды
  useEffect(() => {
    if (isRunning) {
      const hist = waveHistoryRef.current
      hist.push(currentVal / initAmp)
      if (hist.length > 280) hist.shift()
    }
  }, [currentVal, initAmp, isRunning])

  // Отрисовка на Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const heightPx = canvas.clientHeight
    canvas.width = width * dpr
    canvas.height = heightPx * dpr
    ctx.scale(dpr, dpr)

    const isDark = theme === 'dark'
    ctx.clearRect(0, 0, width, heightPx)

    // Разделение холста:
    // Левая зона (45% ширины): сам маятник
    // Правая зона (55% ширины): синусоида x(t) + столбики энергии
    const leftZoneWidth = width * 0.44
    const rightZoneX = width * 0.47
    const rightZoneWidth = width * 0.51

    // Разделитель между зонами
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(leftZoneWidth + 10, 15)
    ctx.lineTo(leftZoneWidth + 10, heightPx - 15)
    ctx.stroke()
    ctx.setLineDash([])

    // ==========================================
    // ЛЕВАЯ ЗОНА: АНИМАЦИЯ МАЯТНИКА
    // ==========================================
    if (pendulumType === 'thread') {
      const originX = leftZoneWidth / 2
      const originY = 35
      const visualLength = Math.min(heightPx - 80, 50 + length * 40)

      const theta = currentVal
      const bobX = originX + visualLength * Math.sin(theta)
      const bobY = originY + visualLength * Math.cos(theta)

      // Потолок (крепление)
      ctx.fillStyle = isDark ? '#475569' : '#94A3B8'
      ctx.fillRect(originX - 35, originY - 10, 70, 10)
      ctx.strokeStyle = isDark ? '#64748B' : '#64748B'
      ctx.lineWidth = 1.5
      ctx.strokeRect(originX - 35, originY - 10, 70, 10)

      // Штриховка подвеса
      for (let s = -30; s < 35; s += 10) {
        ctx.beginPath()
        ctx.moveTo(originX + s, originY - 10)
        ctx.lineTo(originX + s - 6, originY - 18)
        ctx.stroke()
      }

      // Вертикальная пунктирная линия равновесия
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(originX, originY + visualLength + 20)
      ctx.stroke()
      ctx.setLineDash([])

      // Нить маятника
      ctx.lineWidth = 2
      ctx.strokeStyle = isDark ? '#E2E8F0' : '#334155'
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(bobX, bobY)
      ctx.stroke()

      // Подвесной шар (Bob)
      const bobRadius = 12 + Math.min(10, mass * 2)
      const bobGrad = ctx.createRadialGradient(
        bobX - bobRadius * 0.3,
        bobY - bobRadius * 0.3,
        2,
        bobX,
        bobY,
        bobRadius
      )
      bobGrad.addColorStop(0, '#C084FC')
      bobGrad.addColorStop(1, '#7E22CE')

      ctx.fillStyle = bobGrad
      ctx.beginPath()
      ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#FFFFFF'
      ctx.stroke()

      // Вектор скорости (зеленая стрелка)
      if (currentSpeed > 0.05) {
        const speedScale = 14
        const tangentAngle = theta + (Math.cos(omega0 * simTime) >= 0 ? Math.PI / 2 : -Math.PI / 2)
        const vEndX = bobX + currentSpeed * Math.cos(tangentAngle) * speedScale
        const vEndY = bobY + currentSpeed * Math.sin(tangentAngle) * speedScale

        ctx.strokeStyle = '#34D399'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(bobX, bobY)
        ctx.lineTo(vEndX, vEndY)
        ctx.stroke()
      }
    } else {
      // Пружинный маятник
      const originX = leftZoneWidth / 2
      const originY = 30
      const restLen = 90
      const visualDisp = currentVal * 120 // масштаб смещения
      const massY = originY + restLen + visualDisp
      const massW = 48
      const massH = 34

      // Подвес вверху
      ctx.fillStyle = isDark ? '#475569' : '#94A3B8'
      ctx.fillRect(originX - 35, originY - 10, 70, 10)

      // Линия равновесия
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(originX - 50, originY + restLen + massH / 2)
      ctx.lineTo(originX + 50, originY + restLen + massH / 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Пружина (зигзагообразная)
      const springCoils = 14
      const coilH = (massY - originY) / springCoils
      ctx.strokeStyle = isDark ? '#A855F7' : '#9333EA'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      for (let i = 0; i < springCoils; i++) {
        const cy = originY + (i + 0.5) * coilH
        const offset = i % 2 === 0 ? 12 : -12
        ctx.lineTo(originX + offset, cy)
      }
      ctx.lineTo(originX, massY)
      ctx.stroke()

      // Груз (брусок)
      ctx.fillStyle = isDark ? '#6366F1' : '#4F46E5'
      ctx.fillRect(originX - massW / 2, massY, massW, massH)
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.5
      ctx.strokeRect(originX - massW / 2, massY, massW, massH)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${mass} кг`, originX, massY + 21)
    }

    // ==========================================
    // ПРАВАЯ ЗОНА: ГРАФИК ВОЛНЫ x(t) И СТОЛБИКИ ЭНЕРГИИ
    // ==========================================
    const graphYCenter = 85
    const graphH = 55

    // Фон графика
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)'
    ctx.fillRect(rightZoneX, 20, rightZoneWidth, 130)
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
    ctx.strokeRect(rightZoneX, 20, rightZoneWidth, 130)

    // Нулевая ось графика
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(rightZoneX, graphYCenter)
    ctx.lineTo(rightZoneX + rightZoneWidth, graphYCenter)
    ctx.stroke()

    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('График волны x(t)', rightZoneX + 8, 35)

    // Отрисовка бегущей волны
    const history = waveHistoryRef.current
    if (history.length > 1) {
      ctx.strokeStyle = '#38BDF8'
      ctx.lineWidth = 2
      ctx.beginPath()
      const stepX = rightZoneWidth / 280
      for (let i = 0; i < history.length; i++) {
        const px = rightZoneX + i * stepX
        const py = graphYCenter - history[i] * graphH
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }

    // ==========================================
    // СТОЛБИКИ ПЕРЕТЕКАНИЯ ЭНЕРГИИ (E_k vs E_p)
    // ==========================================
    const energyY = 165
    const energyH = heightPx - energyY - 15

    ctx.font = '11px sans-serif'
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
    ctx.fillText('Диаграмма энергии (E_k ↔ E_p):', rightZoneX, energyY + 12)

    const maxEnergyRef = Math.max(0.01, eTotal * 1.05)
    const barWidth = 36
    const barSpacing = 65
    const barMaxH = energyH - 35
    const baseEnergyY = heightPx - 18

    // 1. Столбик E_k (кинетическая, изумрудный)
    const ekH = (eK / maxEnergyRef) * barMaxH
    ctx.fillStyle = '#10B981'
    ctx.fillRect(rightZoneX + 25, baseEnergyY - ekH, barWidth, ekH)
    ctx.fillStyle = isDark ? '#A7F3D0' : '#047857'
    ctx.textAlign = 'center'
    ctx.fillText('Eₖ', rightZoneX + 25 + barWidth / 2, baseEnergyY + 13)
    ctx.fillText(`${eK.toFixed(1)} Дж`, rightZoneX + 25 + barWidth / 2, baseEnergyY - ekH - 5)

    // 2. Столбик E_p (потенциальная, янтарный)
    const epH = (eP / maxEnergyRef) * barMaxH
    ctx.fillStyle = '#F59E0B'
    ctx.fillRect(rightZoneX + 25 + barSpacing, baseEnergyY - epH, barWidth, epH)
    ctx.fillStyle = isDark ? '#FDE68A' : '#B45309'
    ctx.fillText('Eₚ', rightZoneX + 25 + barSpacing + barWidth / 2, baseEnergyY + 13)
    ctx.fillText(`${eP.toFixed(1)} Дж`, rightZoneX + 25 + barSpacing + barWidth / 2, baseEnergyY - epH - 5)

    // 3. Столбик E_полн (полная, фиолетовый)
    const etH = (eTotal / maxEnergyRef) * barMaxH
    ctx.fillStyle = '#8B5CF6'
    ctx.fillRect(rightZoneX + 25 + barSpacing * 2, baseEnergyY - etH, barWidth, etH)
    ctx.fillStyle = isDark ? '#DDD6FE' : '#6D28D9'
    ctx.fillText('E_полн', rightZoneX + 25 + barSpacing * 2 + barWidth / 2, baseEnergyY + 13)
    ctx.fillText(`${eTotal.toFixed(1)} Дж`, rightZoneX + 25 + barSpacing * 2 + barWidth / 2, baseEnergyY - etH - 5)
  }, [
    theme,
    pendulumType,
    length,
    mass,
    stiffness,
    currentVal,
    currentSpeed,
    eK,
    eP,
    eTotal,
    omega0,
    simTime,
    initAmp,
  ])

  const handleReset = () => {
    setIsRunning(false)
    setSimTime(0)
    waveHistoryRef.current = []
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg =
    theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'

  return (
    <div className="space-y-4">
      {/* Холст симуляции */}
      <Card className="p-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="text-purple-400" size={20} />
            <h3 className={`font-semibold ${textColor}`}>
              {topicTitle ? `Колебания: ${topicTitle}` : 'Маятники и гармонические колебания'}
            </h3>
          </div>

          {/* Переключатель типа маятника */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => {
                setPendulumType('thread')
                handleReset()
              }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                pendulumType === 'thread'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🧵 Нитяной (математический)
            </button>
            <button
              onClick={() => {
                setPendulumType('spring')
                handleReset()
              }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                pendulumType === 'spring'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🌀 Пружинный
            </button>
          </div>
        </div>

        {/* Canvas контейнер */}
        <div className="relative w-full h-[320px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Панель управления воспроизведением */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Пауза' : 'Качнуть маятник'}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <RotateCcw size={15} />
              Сброс
            </Button>

            <div className="flex items-center gap-1 ml-2 text-xs">
              <span className={textMuted}>Скорость:</span>
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setTimeScale(s)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    timeScale === s
                      ? 'bg-purple-500/30 text-purple-300 font-bold'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Панель параметров и аналитики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ползунки параметров */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="text-purple-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Параметры колебаний</h4>
          </div>

          {pendulumType === 'thread' ? (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={textMuted}>Длина нити L:</span>
                  <span className={`font-mono font-semibold ${textColor}`}>{length.toFixed(2)} м</span>
                </div>
                <Slider min={0.5} max={4} step={0.1} value={length} onChange={setLength} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={textMuted}>Начальный угол отклонения α₀:</span>
                  <span className={`font-mono font-semibold ${textColor}`}>{initDisplacement}°</span>
                </div>
                <Slider min={5} max={60} step={1} value={initDisplacement} onChange={setInitDisplacement} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={textMuted}>Жесткость пружины k:</span>
                  <span className={`font-mono font-semibold ${textColor}`}>{stiffness} Н/м</span>
                </div>
                <Slider min={10} max={200} step={5} value={stiffness} onChange={setStiffness} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={textMuted}>Начальное смещение x₀:</span>
                  <span className={`font-mono font-semibold ${textColor}`}>{initDisplacement} см</span>
                </div>
                <Slider min={5} max={40} step={1} value={initDisplacement} onChange={setInitDisplacement} />
              </div>
            </>
          )}

          {/* Масса груза */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Масса груза m:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{mass.toFixed(1)} кг</span>
            </div>
            <Slider min={0.2} max={5} step={0.1} value={mass} onChange={setMass} />
          </div>

          {/* Затухание (трение) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Коэффициент затухания γ:</span>
              <span className={`font-mono font-semibold ${textColor}`}>
                {damping === 0 ? 'Без трения' : damping.toFixed(3)}
              </span>
            </div>
            <Slider min={0} max={0.1} step={0.005} value={damping} onChange={setDamping} />
          </div>
        </Card>

        {/* Расчётные характеристики */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-emerald-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Характеристики колебаний</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Период колебаний (T):</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {period.toFixed(2)} <span className="text-xs font-normal">с</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Частота (ν):</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                {frequency.toFixed(2)} <span className="text-xs font-normal">Гц</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Циклическая частота (ω):</div>
              <div className="text-lg font-mono font-bold text-purple-400">
                {omega0.toFixed(2)} <span className="text-xs font-normal">рад/с</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Текущая скорость (v):</div>
              <div className="text-lg font-mono font-bold text-sky-400">
                {currentSpeed.toFixed(2)} <span className="text-xs font-normal">м/с</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-white/50 border-t border-white/10 pt-2">
            💡 <strong>Формула Гюйгенса / Томсона:</strong> Для нитяного маятника период T = 2π√(L/g)
            не зависит от массы груза. В крайних точках вся энергия потенциальная (E_p = max), в точке
            равновесия — кинетическая (E_k = max).
          </div>
        </Card>
      </div>
    </div>
  )
}
