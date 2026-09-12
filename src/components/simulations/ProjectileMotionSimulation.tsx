import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Play, Pause, RotateCcw, Target, Sparkles, Compass } from 'lucide-react'

export interface ProjectileParams {
  angle: number
  v0: number
  height: number
  g: number
  timeScale: number
}

interface ProjectileMotionSimulationProps {
  topicTitle?: string
  angle?: number
  v0?: number
  height?: number
  g?: number
  timeScale?: number
  onParamsChange?: (params: ProjectileParams) => void
}

const PLANETS = [
  { id: 'earth', name: '🌍 Земля', g: 9.81 },
  { id: 'moon', name: '🌕 Луна', g: 1.62 },
  { id: 'mars', name: '🪐 Марс', g: 3.71 },
  { id: 'jupiter', name: '☀️ Юпитер', g: 24.79 },
]

interface TrajectoryPoint {
  x: number
  y: number
}

export function ProjectileMotionSimulation({
  topicTitle,
  angle: angleProp,
  v0: v0Prop,
  height: heightProp,
  g: gProp,
  timeScale: timeScaleProp,
  onParamsChange,
}: ProjectileMotionSimulationProps) {
  const { theme } = useTheme()

  const [angle, setAngle] = useState(angleProp ?? 45)
  const [v0, setV0] = useState(v0Prop ?? 25)
  const [height, setHeight] = useState(heightProp ?? 0)
  const [g, setG] = useState(gProp ?? 9.81)
  const [timeScale, setTimeScale] = useState(timeScaleProp ?? 1)
  const [showVectors, setShowVectors] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [simTime, setSimTime] = useState(0)

  // Предыдущие траектории для наглядного сравнения
  const [pastTrajectories, setPastTrajectories] = useState<TrajectoryPoint[][]>([])
  const currentPathRef = useRef<TrajectoryPoint[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)

  // Физические вычисления
  const rad = useMemo(() => (angle * Math.PI) / 180, [angle])
  const v0x = useMemo(() => v0 * Math.cos(rad), [v0, rad])
  const v0y = useMemo(() => v0 * Math.sin(rad), [v0, rad])

  // Максимальная высота H_max
  const hMax = useMemo(() => height + (v0y * v0y) / (2 * g), [height, v0y, g])
  const tApex = useMemo(() => v0y / g, [v0y, g])

  // Полное время полета
  const tTotal = useMemo(() => {
    const disc = v0y * v0y + 2 * g * height
    return (v0y + Math.sqrt(Math.max(0, disc))) / g
  }, [v0y, g, height])

  // Полная дальность полета
  const lMax = useMemo(() => v0x * tTotal, [v0x, tTotal])

  // Текущее состояние в момент simTime
  const currentX = useMemo(() => v0x * simTime, [v0x, simTime])
  const currentY = useMemo(
    () => Math.max(0, height + v0y * simTime - 0.5 * g * simTime * simTime),
    [height, v0y, g, simTime]
  )
  const currentVx = v0x
  const currentVy = v0y - g * simTime
  const currentV = useMemo(
    () => Math.sqrt(currentVx * currentVx + currentVy * currentVy),
    [currentVx, currentVy]
  )

  // Уведомление внешнего контекста (для синхронизации)
  useEffect(() => {
    onParamsChange?.({ angle, v0, height, g, timeScale })
  }, [angle, v0, height, g, timeScale, onParamsChange])

  // Сброс при изменении параметров выстрела во время паузы
  useEffect(() => {
    if (!isRunning) {
      setSimTime(0)
      currentPathRef.current = []
    }
  }, [angle, v0, height, g, isRunning])

  // Игровой цикл физики (requestAnimationFrame)
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

      setSimTime((prevTime) => {
        const nextTime = prevTime + deltaSec
        if (nextTime >= tTotal) {
          setIsRunning(false)
          // Сохраняем завершенную траекторию в историю
          if (currentPathRef.current.length > 0) {
            setPastTrajectories((prev) => [
              ...prev.slice(-2),
              [...currentPathRef.current, { x: lMax, y: 0 }],
            ])
          }
          return tTotal
        }
        return nextTime
      })

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isRunning, timeScale, tTotal, lMax])

  // Накапливаем точки текущей траектории
  useEffect(() => {
    if (simTime > 0) {
      currentPathRef.current.push({ x: currentX, y: currentY })
    }
  }, [simTime, currentX, currentY])

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

    // Очистка холста
    ctx.clearRect(0, 0, width, heightPx)

    // Масштабирование координат: физические метры -> пиксели экрана
    // Оставляем отступы по краям
    const margin = { top: 40, right: 50, bottom: 45, left: 55 }
    const plotWidth = width - margin.left - margin.right
    const plotHeight = heightPx - margin.top - margin.bottom

    const maxPhysicalX = Math.max(lMax * 1.15, 30)
    const maxPhysicalY = Math.max(hMax * 1.3, 15)

    const scaleX = plotWidth / maxPhysicalX
    const scaleY = plotHeight / maxPhysicalY
    const scale = Math.min(scaleX, scaleY)

    const toCanvasX = (physX: number) => margin.left + physX * scale
    const toCanvasY = (physY: number) => heightPx - margin.bottom - physY * scale

    // 1. Отрисовка координатной сетки
    ctx.lineWidth = 1
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.5)'
    ctx.font = '11px sans-serif'

    // Шаг сетки (10, 20 или 50 м в зависимости от масштаба)
    let gridStep = 10
    if (maxPhysicalX > 150) gridStep = 25
    if (maxPhysicalX > 300) gridStep = 50

    // Вертикальные линии (по X)
    for (let gx = 0; gx <= maxPhysicalX; gx += gridStep) {
      const cx = toCanvasX(gx)
      if (cx > width - margin.right) break
      ctx.beginPath()
      ctx.moveTo(cx, margin.top)
      ctx.lineTo(cx, heightPx - margin.bottom)
      ctx.stroke()
      ctx.fillText(`${gx}м`, cx - 10, heightPx - margin.bottom + 18)
    }

    // Горизонтальные линии (по Y)
    for (let gy = 0; gy <= maxPhysicalY; gy += gridStep) {
      const cy = toCanvasY(gy)
      if (cy < margin.top) break
      ctx.beginPath()
      ctx.moveTo(margin.left, cy)
      ctx.lineTo(width - margin.right, cy)
      ctx.stroke()
      ctx.fillText(`${gy}м`, margin.left - 30, cy + 4)
    }

    // Земля (Ground line)
    ctx.lineWidth = 3
    ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7'
    ctx.beginPath()
    ctx.moveTo(margin.left - 15, toCanvasY(0))
    ctx.lineTo(width - margin.right + 25, toCanvasY(0))
    ctx.stroke()

    // 2. Платформа начальной высоты, если h > 0
    if (height > 0) {
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)'
      ctx.strokeStyle = isDark ? '#0284C7' : '#0369A1'
      ctx.lineWidth = 2
      const platW = 24
      const platH = height * scale
      ctx.fillRect(toCanvasX(0) - platW, toCanvasY(height), platW, platH)
      ctx.strokeRect(toCanvasX(0) - platW, toCanvasY(height), platW, platH)
    }

    // 3. Предыдущие траектории (полупрозрачные пунктирные линии)
    pastTrajectories.forEach((pts) => {
      if (pts.length < 2) return
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)'
      ctx.beginPath()
      ctx.moveTo(toCanvasX(pts[0].x), toCanvasY(pts[0].y))
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(toCanvasX(pts[i].x), toCanvasY(pts[i].y))
      }
      ctx.stroke()
      ctx.setLineDash([])
    })

    // 4. Теоретическая идеальная траектория (тонкий контур)
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.4)' : 'rgba(147, 51, 234, 0.35)'
    ctx.beginPath()
    const steps = 60
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tTotal
      const tx = v0x * t
      const ty = Math.max(0, height + v0y * t - 0.5 * g * t * t)
      if (i === 0) ctx.moveTo(toCanvasX(tx), toCanvasY(ty))
      else ctx.lineTo(toCanvasX(tx), toCanvasY(ty))
    }
    ctx.stroke()
    ctx.setLineDash([])

    // 5. Текущая фактическая траектория (яркая сплошная линия)
    if (currentPathRef.current.length > 0) {
      ctx.lineWidth = 3
      ctx.strokeStyle = '#A855F7'
      ctx.beginPath()
      ctx.moveTo(toCanvasX(currentPathRef.current[0].x), toCanvasY(currentPathRef.current[0].y))
      for (let i = 1; i < currentPathRef.current.length; i++) {
        ctx.lineTo(toCanvasX(currentPathRef.current[i].x), toCanvasY(currentPathRef.current[i].y))
      }
      ctx.stroke()
    }

    // 6. Метка высшей точки (Apex)
    const apexCanvasX = toCanvasX(v0x * tApex)
    const apexCanvasY = toCanvasY(hMax)
    ctx.setLineDash([2, 3])
    ctx.lineWidth = 1
    ctx.strokeStyle = isDark ? 'rgba(234, 179, 8, 0.6)' : 'rgba(202, 138, 4, 0.6)'
    ctx.beginPath()
    ctx.moveTo(apexCanvasX, toCanvasY(0))
    ctx.lineTo(apexCanvasX, apexCanvasY)
    ctx.moveTo(margin.left, apexCanvasY)
    ctx.lineTo(apexCanvasX, apexCanvasY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#EAB308'
    ctx.beginPath()
    ctx.arc(apexCanvasX, apexCanvasY, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = '10px sans-serif'
    ctx.fillText(`H = ${hMax.toFixed(1)}м`, apexCanvasX + 6, apexCanvasY - 6)

    // Метка точки приземления (Дальность)
    const landX = toCanvasX(lMax)
    ctx.fillStyle = '#10B981'
    ctx.beginPath()
    ctx.arc(landX, toCanvasY(0), 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillText(`L = ${lMax.toFixed(1)}м`, landX - 18, toCanvasY(0) + 16)

    // 7. Пушка на позиции старта (0, height)
    const cannonBaseX = toCanvasX(0)
    const cannonBaseY = toCanvasY(height)

    ctx.save()
    ctx.translate(cannonBaseX, cannonBaseY)
    // Дуло пушки повернуто на угол -rad (вверх)
    ctx.rotate(-rad)
    ctx.fillStyle = isDark ? '#94A3B8' : '#475569'
    ctx.fillRect(0, -6, 26, 12)
    ctx.strokeStyle = isDark ? '#CBD5E1' : '#334155'
    ctx.lineWidth = 2
    ctx.strokeRect(0, -6, 26, 12)
    ctx.restore()

    // Основание пушки
    ctx.fillStyle = isDark ? '#64748B' : '#64748B'
    ctx.beginPath()
    ctx.arc(cannonBaseX, cannonBaseY, 9, 0, Math.PI, false)
    ctx.fill()

    // 8. Снаряд (Cannonball) в текущей точке
    const ballX = toCanvasX(currentX)
    const ballY = toCanvasY(currentY)

    ctx.fillStyle = '#F43F5E'
    ctx.beginPath()
    ctx.arc(ballX, ballY, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#FFFFFF'
    ctx.stroke()

    // 9. Векторы скоростей (v, vx, vy)
    if (showVectors && simTime < tTotal) {
      const vScale = 1.6 // пикселей на м/с

      // Вектор Vx (горизонтальный, синий)
      const vxLen = currentVx * vScale
      ctx.lineWidth = 2
      ctx.strokeStyle = '#38BDF8'
      ctx.beginPath()
      ctx.moveTo(ballX, ballY)
      ctx.lineTo(ballX + vxLen, ballY)
      ctx.stroke()
      drawArrowHead(ctx, ballX + vxLen, ballY, 0, '#38BDF8')

      // Вектор Vy (вертикальный, оранжевый)
      const vyLen = -currentVy * vScale // минус, т.к. в Canvas Y направлен вниз
      ctx.strokeStyle = '#FB923C'
      ctx.beginPath()
      ctx.moveTo(ballX, ballY)
      ctx.lineTo(ballX, ballY + vyLen)
      ctx.stroke()
      drawArrowHead(ctx, ballX, ballY + vyLen, currentVy >= 0 ? -Math.PI / 2 : Math.PI / 2, '#FB923C')

      // Результирующий вектор V (зеленый)
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#34D399'
      ctx.beginPath()
      ctx.moveTo(ballX, ballY)
      ctx.lineTo(ballX + vxLen, ballY + vyLen)
      ctx.stroke()
      drawArrowHead(
        ctx,
        ballX + vxLen,
        ballY + vyLen,
        Math.atan2(vyLen, vxLen),
        '#34D399'
      )
    }
  }, [
    theme,
    angle,
    v0,
    height,
    g,
    simTime,
    hMax,
    lMax,
    tApex,
    tTotal,
    currentX,
    currentY,
    currentVx,
    currentVy,
    rad,
    v0x,
    v0y,
    showVectors,
    pastTrajectories,
  ])

  // Вспомогательная функция отрисовки стрелки
  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rot: number,
    color: string
  ) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-7, -4)
    ctx.lineTo(-7, 4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Сброс симуляции
  const handleReset = () => {
    setIsRunning(false)
    setSimTime(0)
    currentPathRef.current = []
  }

  // Запуск / продолжение
  const handleToggleRun = () => {
    if (simTime >= tTotal) {
      setSimTime(0)
      currentPathRef.current = []
    }
    setIsRunning(!isRunning)
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg =
    theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'

  return (
    <div className="space-y-4">
      {/* Холст симуляции */}
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="text-purple-400" size={20} />
            <h3 className={`font-semibold ${textColor}`}>
              {topicTitle ? `Баллистика: ${topicTitle}` : 'Движение тела под углом к горизонту'}
            </h3>
          </div>

          {/* Быстрый выбор планеты */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-lg">
            {PLANETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setG(p.g)}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  Math.abs(g - p.g) < 0.05
                    ? 'bg-purple-600 text-white font-medium shadow'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas контейнер */}
        <div className="relative w-full h-[320px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Легенда векторов */}
          {showVectors && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-xs space-y-1 text-white">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-emerald-400"></div>
                <span>Полная скорость v</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-sky-400"></div>
                <span>Горизонтальная v_x</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-amber-400"></div>
                <span>Вертикальная v_y</span>
              </div>
            </div>
          )}
        </div>

        {/* Панель кнопок управления воспроизведением */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleRun}
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Пауза' : simTime >= tTotal ? 'Выстрелить снова' : 'Запустить'}
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

            {/* Замедление времени */}
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

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showVectors}
                onChange={(e) => setShowVectors(e.target.checked)}
                className="rounded border-white/20 text-purple-600 focus:ring-0"
              />
              <span className={textMuted}>Векторы скоростей</span>
            </label>

            {pastTrajectories.length > 0 && (
              <button
                onClick={() => setPastTrajectories([])}
                className="text-xs text-purple-400 hover:underline"
              >
                Очистить прошлые траектории
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Панель параметров и аналитики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Настройка параметров ползунками */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="text-purple-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Параметры запуска</h4>
          </div>

          {/* Угол выстрела */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Угол к горизонту α:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{angle}°</span>
            </div>
            <Slider min={0} max={90} step={1} value={angle} onChange={setAngle} />
          </div>

          {/* Начальная скорость */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Начальная скорость v₀:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{v0} м/с</span>
            </div>
            <Slider min={5} max={60} step={1} value={v0} onChange={setV0} />
          </div>

          {/* Начальная высота */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Начальная высота h₀:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{height} м</span>
            </div>
            <Slider min={0} max={25} step={1} value={height} onChange={setHeight} />
          </div>

          {/* Гравитационное ускорение */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Ускорение g:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{g.toFixed(2)} м/с²</span>
            </div>
            <Slider min={1} max={30} step={0.1} value={g} onChange={setG} />
          </div>
        </Card>

        {/* Текущие показания и расчетные величины */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-emerald-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Физические показатели</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Дальность полёта (L):</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {lMax.toFixed(2)} <span className="text-xs font-normal">м</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Макс. высота (Hₘₐₓ):</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                {hMax.toFixed(2)} <span className="text-xs font-normal">м</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Время полёта (t_полн):</div>
              <div className="text-lg font-mono font-bold text-purple-400">
                {tTotal.toFixed(2)} <span className="text-xs font-normal">с</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Текущая скорость (v):</div>
              <div className="text-lg font-mono font-bold text-sky-400">
                {currentV.toFixed(2)} <span className="text-xs font-normal">м/с</span>
              </div>
            </div>
          </div>

          {/* Текущее положение */}
          <div className="p-2 rounded bg-black/20 text-xs font-mono flex justify-between border border-white/5">
            <span className={textMuted}>
              Время: <strong className={textColor}>{simTime.toFixed(2)} с</strong>
            </span>
            <span className={textMuted}>
              x: <strong className={textColor}>{currentX.toFixed(1)} м</strong>
            </span>
            <span className={textMuted}>
              y: <strong className={textColor}>{currentY.toFixed(1)} м</strong>
            </span>
          </div>

          {/* Теоретическая подсказка */}
          <div className="text-[11px] leading-relaxed text-white/50 border-t border-white/10 pt-2">
            💡 <strong>Закон физики:</strong> Движение по оси X равномерное (v_x = const),
            а по оси Y — равноускоренное под действием силы тяжести (a_y = -g). Максимальная
            дальность достигается при угле 45° (если h₀ = 0).
          </div>
        </Card>
      </div>
    </div>
  )
}
