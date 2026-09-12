import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Play, Pause, RotateCcw, ArrowRightLeft, Sparkles, Scale } from 'lucide-react'

export interface CollisionsParams {
  m1: number
  v1: number
  m2: number
  v2: number
  elasticity: number // 1 = elastic, 0 = inelastic
  timeScale: number
}

interface CollisionsSimulationProps {
  topicTitle?: string
  m1?: number
  v1?: number
  m2?: number
  v2?: number
  elasticity?: number
  timeScale?: number
  onParamsChange?: (params: CollisionsParams) => void
}

export function CollisionsSimulation({
  topicTitle,
  m1: m1Prop,
  v1: v1Prop,
  m2: m2Prop,
  v2: v2Prop,
  elasticity: eProp,
  timeScale: timeScaleProp,
  onParamsChange,
}: CollisionsSimulationProps) {
  const { theme } = useTheme()

  const [m1, setM1] = useState(m1Prop ?? 2)
  const [v1, setV1] = useState(v1Prop ?? 3)
  const [m2, setM2] = useState(m2Prop ?? 2)
  const [v2, setV2] = useState(v2Prop ?? -2)
  const [elasticity, setElasticity] = useState(eProp ?? 1)
  const [timeScale, setTimeScale] = useState(timeScaleProp ?? 1)
  const [isRunning, setIsRunning] = useState(false)

  // Позиции тележек на треке (в метрах)
  // Трек длиной 10 м: середина = 5м
  const [x1, setX1] = useState(2)
  const [x2, setX2] = useState(7)
  const [curV1, setCurV1] = useState(v1)
  const [curV2, setCurV2] = useState(v2)
  const [hasCollided, setHasCollided] = useState(false)
  const [sparkTime, setSparkTime] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)

  // Расчет импульсов до удара
  const p1Init = useMemo(() => m1 * v1, [m1, v1])
  const p2Init = useMemo(() => m2 * v2, [m2, v2])
  const pTotalInit = useMemo(() => p1Init + p2Init, [p1Init, p2Init])

  const eKInit = useMemo(() => 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2, [m1, v1, m2, v2])

  // Расчет теоретических скоростей после удара по законам сохранения
  const { v1After, v2After } = useMemo(() => {
    const e = elasticity
    // v1' = (m1*v1 + m2*v2 - e*m2*(v1 - v2)) / (m1 + m2)
    const v1Post = (m1 * v1 + m2 * v2 - e * m2 * (v1 - v2)) / (m1 + m2)
    // v2' = (m1*v1 + m2*v2 + e*m1*(v1 - v2)) / (m1 + m2)
    const v2Post = (m1 * v1 + m2 * v2 + e * m1 * (v1 - v2)) / (m1 + m2)
    return { v1After: v1Post, v2After: v2Post }
  }, [m1, v1, m2, v2, elasticity])

  const eKAfter = useMemo(() => 0.5 * m1 * v1After * v1After + 0.5 * m2 * v2After * v2After, [m1, v1After, m2, v2After])
  const heatLost = useMemo(() => Math.max(0, eKInit - eKAfter), [eKInit, eKAfter])

  // Текущие импульсы
  const curP1 = useMemo(() => m1 * curV1, [m1, curV1])
  const curP2 = useMemo(() => m2 * curV2, [m2, curV2])
  const curPTotal = useMemo(() => curP1 + curP2, [curP1, curP2])
  const curEK = useMemo(() => 0.5 * m1 * curV1 * curV1 + 0.5 * m2 * curV2 * curV2, [m1, curV1, m2, curV2])

  useEffect(() => {
    onParamsChange?.({ m1, v1, m2, v2, elasticity, timeScale })
  }, [m1, v1, m2, v2, elasticity, timeScale, onParamsChange])

  // Сброс при изменении параметров во время остановки
  useEffect(() => {
    if (!isRunning) {
      setX1(2)
      setX2(7)
      setCurV1(v1)
      setCurV2(v2)
      setHasCollided(false)
      setSparkTime(0)
    }
  }, [m1, v1, m2, v2, elasticity, isRunning])

  // Физический цикл движения
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

      setX1((prevX1) => {
        setX2((prevX2) => {
          setCurV1((prevV1) => {
            setCurV2((prevV2) => {
              const cartW = 0.8 // ширина тележки в метрах
              let nextX1 = prevX1 + prevV1 * deltaSec
              let nextX2 = prevX2 + prevV2 * deltaSec
              let nextV1 = prevV1
              let nextV2 = prevV2

              // Проверка соударения между тележками
              if (nextX1 + cartW >= nextX2 && !hasCollided) {
                setHasCollided(true)
                setSparkTime(Date.now())
                nextV1 = v1After
                nextV2 = v2After
                // Если слипаются (абсолютно неупругий)
                if (elasticity === 0) {
                  nextX1 = (prevX1 + prevX2 - cartW) / 2
                  nextX2 = nextX1 + cartW
                }
              }

              // Отскок от краев трека (0м и 10м)
              if (nextX1 <= 0.1 && nextV1 < 0) nextV1 = -nextV1
              if (nextX2 >= 9.2 && nextV2 > 0) nextV2 = -nextV2

              return nextV2
            })
            return curV1
          })
          return prevX2 + curV2 * deltaSec
        })
        return prevX1 + curV1 * deltaSec
      })

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isRunning, timeScale, hasCollided, v1After, v2After, elasticity, curV1, curV2])

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

    // Параметры трека
    const margin = 40
    const trackW = width - margin * 2
    const trackY = heightPx - 75
    const toPx = (m: number) => margin + (m / 10) * trackW

    // 1. Воздушный трек (Air track)
    ctx.fillStyle = isDark ? '#1E293B' : '#CBD5E1'
    ctx.fillRect(margin - 10, trackY, trackW + 20, 16)
    ctx.strokeStyle = isDark ? '#475569' : '#94A3B8'
    ctx.lineWidth = 2
    ctx.strokeRect(margin - 10, trackY, trackW + 20, 16)

    // Разметка шкалы на треке
    ctx.font = '10px monospace'
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.5)'
    ctx.textAlign = 'center'
    for (let m = 0; m <= 10; m++) {
      const px = toPx(m)
      ctx.beginPath()
      ctx.moveTo(px, trackY + 16)
      ctx.lineTo(px, trackY + 24)
      ctx.stroke()
      ctx.fillText(`${m}м`, px, trackY + 36)
    }

    // 2. Тележка 1 (Синяя)
    const cartWidthPx = 54
    const cartHeightPx = 30
    const c1Px = toPx(x1)
    const cart1Y = trackY - cartHeightPx

    // Корпус тележки 1
    ctx.fillStyle = '#38BDF8'
    ctx.beginPath()
    ctx.roundRect(c1Px, cart1Y, cartWidthPx, cartHeightPx, 6)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Колеса тележки 1
    ctx.fillStyle = isDark ? '#94A3B8' : '#475569'
    ctx.beginPath()
    ctx.arc(c1Px + 12, trackY, 5, 0, Math.PI * 2)
    ctx.arc(c1Px + cartWidthPx - 12, trackY, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText(`${m1}кг`, c1Px + cartWidthPx / 2, cart1Y + 18)

    // 3. Тележка 2 (Оранжевая)
    const c2Px = toPx(x2)
    const cart2Y = trackY - cartHeightPx

    // Корпус тележки 2
    ctx.fillStyle = '#FB923C'
    ctx.beginPath()
    ctx.roundRect(c2Px, cart2Y, cartWidthPx, cartHeightPx, 6)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Колеса тележки 2
    ctx.fillStyle = isDark ? '#94A3B8' : '#475569'
    ctx.beginPath()
    ctx.arc(c2Px + 12, trackY, 5, 0, Math.PI * 2)
    ctx.arc(c2Px + cartWidthPx - 12, trackY, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#0F172A'
    ctx.fillText(`${m2}кг`, c2Px + cartWidthPx / 2, cart2Y + 18)

    // 4. Векторы скоростей и импульсов над тележками
    const arrowY1 = cart1Y - 14
    const arrowY2 = cart2Y - 14

    // Вектор 1
    drawVector(ctx, c1Px + cartWidthPx / 2, arrowY1, curV1 * 8, '#38BDF8', `p₁=${curP1.toFixed(1)}`)
    // Вектор 2
    drawVector(ctx, c2Px + cartWidthPx / 2, arrowY2, curV2 * 8, '#FB923C', `p₂=${curP2.toFixed(1)}`)

    // Вспышка соударения (Spark)
    if (Date.now() - sparkTime < 350) {
      const midX = (c1Px + cartWidthPx + c2Px) / 2
      ctx.fillStyle = '#FACC15'
      ctx.beginPath()
      ctx.arc(midX, trackY - cartHeightPx / 2, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(midX, trackY - cartHeightPx / 2, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // 5. Вектор суммарного импульса вверху
    const topBarY = 25
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Суммарный импульс P_общ = p₁ + p₂:`, margin, topBarY)

    drawVector(ctx, margin + 250, topBarY - 4, curPTotal * 8, '#A855F7', `${curPTotal.toFixed(1)} кг·м/с`)
  }, [theme, x1, x2, m1, m2, curV1, curV2, curP1, curP2, curPTotal, sparkTime])

  // Вспомогательная функция рисования вектора
  const drawVector = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    color: string,
    label: string
  ) => {
    if (Math.abs(len) < 2) return
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y)
    ctx.stroke()

    // Наконечник стрелки
    const dir = len > 0 ? 1 : -1
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + len, y)
    ctx.lineTo(x + len - dir * 6, y - 4)
    ctx.lineTo(x + len - dir * 6, y + 4)
    ctx.closePath()
    ctx.fill()

    // Подпись
    ctx.fillStyle = color
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, x + len / 2, y - 6)
  }

  const handleReset = () => {
    setIsRunning(false)
    setX1(2)
    setX2(7)
    setCurV1(v1)
    setCurV2(v2)
    setHasCollided(false)
    setSparkTime(0)
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg =
    theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'

  return (
    <div className="space-y-4">
      <Card className="p-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="text-purple-400" size={20} />
            <h3 className={`font-semibold ${textColor}`}>
              {topicTitle ? `Импульс: ${topicTitle}` : 'Закон сохранения импульса и столкновения'}
            </h3>
          </div>

          {/* Переключатель упругости */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => {
                setElasticity(1)
                handleReset()
              }}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                elasticity === 1 ? 'bg-purple-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Абсолютно упругий (e=1)
            </button>
            <button
              onClick={() => {
                setElasticity(0)
                handleReset()
              }}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                elasticity === 0 ? 'bg-purple-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Неупругий (слипание e=0)
            </button>
          </div>
        </div>

        {/* Canvas контейнер */}
        <div className="relative w-full h-[240px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Панель управления */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? 'Пауза' : 'Запустить тележки'}
          </Button>
          <Button onClick={handleReset} variant="secondary" size="sm" className="flex items-center gap-1.5">
            <RotateCcw size={15} />
            Сброс
          </Button>
        </div>
      </Card>

      {/* Параметры двух тел */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Тело 1 */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-400"></div>
            <h4 className={`text-sm font-semibold ${textColor}`}>Тележка 1 (Синяя)</h4>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Масса m₁:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{m1} кг</span>
            </div>
            <Slider min={0.5} max={6} step={0.5} value={m1} onChange={setM1} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Начальная скорость v₁:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{v1} м/с</span>
            </div>
            <Slider min={-6} max={6} step={0.5} value={v1} onChange={setV1} />
          </div>

          <div className="p-2 rounded bg-black/20 text-xs font-mono flex justify-between border border-white/5">
            <span>Скорость после: <strong className="text-sky-400">{v1After.toFixed(2)} м/с</strong></span>
            <span>Импульс p₁: <strong className="text-sky-400">{(m1 * v1After).toFixed(1)}</strong></span>
          </div>
        </Card>

        {/* Тело 2 */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <h4 className={`text-sm font-semibold ${textColor}`}>Тележка 2 (Оранжевая)</h4>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Масса m₂:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{m2} кг</span>
            </div>
            <Slider min={0.5} max={6} step={0.5} value={m2} onChange={setM2} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Начальная скорость v₂:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{v2} м/с</span>
            </div>
            <Slider min={-6} max={6} step={0.5} value={v2} onChange={setV2} />
          </div>

          <div className="p-2 rounded bg-black/20 text-xs font-mono flex justify-between border border-white/5">
            <span>Скорость после: <strong className="text-orange-400">{v2After.toFixed(2)} м/с</strong></span>
            <span>Импульс p₂: <strong className="text-orange-400">{(m2 * v2After).toFixed(1)}</strong></span>
          </div>
        </Card>
      </div>

      {/* Баланс импульса и энергии */}
      <Card className={`p-4 ${panelBg} space-y-2`}>
        <div className="flex items-center gap-2 mb-1">
          <Scale className="text-purple-400" size={18} />
          <h4 className={`text-sm font-semibold ${textColor}`}>Законы сохранения</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <div className={textMuted}>P_общ до удара:</div>
            <div className="font-mono font-bold text-purple-400">{pTotalInit.toFixed(2)} кг·м/с</div>
          </div>

          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <div className={textMuted}>P_общ после удара:</div>
            <div className="font-mono font-bold text-purple-400">{(m1 * v1After + m2 * v2After).toFixed(2)} кг·м/с</div>
          </div>

          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <div className={textMuted}>Кинетическая Eₖ (до):</div>
            <div className="font-mono font-bold text-emerald-400">{eKInit.toFixed(1)} Дж</div>
          </div>

          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <div className={textMuted}>Потеря в тепло Q:</div>
            <div className="font-mono font-bold text-rose-400">{heatLost.toFixed(1)} Дж</div>
          </div>
        </div>

        <div className="text-[11px] leading-relaxed text-white/50 pt-1">
          💡 <strong>Закон сохранения импульса:</strong> В замкнутой системе суммарный импульс тел остаётся постоянным при любых столкновениях. При неупругом ударе часть кинетической энергии переходит во внутреннюю энергию (нагрев тел Q = ΔEₖ).
        </div>
      </Card>
    </div>
  )
}
