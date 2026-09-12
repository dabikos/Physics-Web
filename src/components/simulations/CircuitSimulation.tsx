import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Zap, Sparkles, Sliders, Lightbulb } from 'lucide-react'

export interface CircuitParams {
  circuitType: 'single' | 'series' | 'parallel'
  voltage: number
  r1: number
  r2: number
}

interface CircuitSimulationProps {
  topicTitle?: string
  circuitType?: 'single' | 'series' | 'parallel'
  voltage?: number
  r1?: number
  r2?: number
  onParamsChange?: (params: CircuitParams) => void
}

export function CircuitSimulation({
  topicTitle,
  circuitType: typeProp,
  voltage: uProp,
  r1: r1Prop,
  r2: r2Prop,
  onParamsChange,
}: CircuitSimulationProps) {
  const { theme } = useTheme()

  const [circuitType, setCircuitType] = useState<'single' | 'series' | 'parallel'>(typeProp ?? 'series')
  const [voltage, setVoltage] = useState(uProp ?? 12) // Вольты
  const [r1, setR1] = useState(r1Prop ?? 6) // Ом
  const [r2, setR2] = useState(r2Prop ?? 4) // Ом

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const electronOffsetRef = useRef(0)

  // Расчет электрических параметров
  const { rTotal, iTotal, u1, u2, i1, i2, pTotal } = useMemo(() => {
    let rTot = r1
    let iTot = 0
    let v1 = voltage
    let v2 = 0
    let cur1 = 0
    let cur2 = 0

    if (circuitType === 'single') {
      rTot = Math.max(0.1, r1)
      iTot = voltage / rTot
      v1 = voltage
      v2 = 0
      cur1 = iTot
      cur2 = 0
    } else if (circuitType === 'series') {
      rTot = Math.max(0.1, r1 + r2)
      iTot = voltage / rTot
      cur1 = iTot
      cur2 = iTot
      v1 = iTot * r1
      v2 = iTot * r2
    } else {
      // parallel
      rTot = Math.max(0.1, (r1 * r2) / (r1 + r2))
      cur1 = voltage / Math.max(0.1, r1)
      cur2 = voltage / Math.max(0.1, r2)
      iTot = cur1 + cur2
      v1 = voltage
      v2 = voltage
    }

    const power = voltage * iTot

    return {
      rTotal: rTot,
      iTotal: iTot,
      u1: v1,
      u2: v2,
      i1: cur1,
      i2: cur2,
      pTotal: power,
    }
  }, [circuitType, voltage, r1, r2])

  useEffect(() => {
    onParamsChange?.({ circuitType, voltage, r1, r2 })
  }, [circuitType, voltage, r1, r2, onParamsChange])

  // Отрисовка схемы и бегущего тока (электронов) на Canvas
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

    const loop = () => {
      ctx.clearRect(0, 0, width, heightPx)

      // Скорость движения электронов пропорциональна току
      electronOffsetRef.current = (electronOffsetRef.current + Math.min(6, iTotal * 1.8)) % 40

      // Параметры прямоугольного контура цепи
      const padX = 60
      const padY = 45
      const rectW = width - padX * 2
      const rectH = heightPx - padY * 2
      const wireLeft = padX
      const wireRight = padX + rectW
      const wireTop = padY
      const wireBottom = padY + rectH

      // Провода цепи (основной контур)
      ctx.strokeStyle = isDark ? '#475569' : '#94A3B8'
      ctx.lineWidth = 4
      ctx.beginPath()

      if (circuitType === 'parallel') {
        // Контур с развилкой
        ctx.strokeRect(wireLeft, wireTop, rectW, rectH)
        // Средняя перемычка для параллельного второго резистора
        const midY = wireTop + rectH * 0.5
        ctx.moveTo(wireLeft + rectW * 0.35, midY)
        ctx.lineTo(wireRight, midY)
        ctx.stroke()
      } else {
        ctx.strokeRect(wireLeft, wireTop, rectW, rectH)
      }

      // Бегущие точки тока (электроны / ток)
      ctx.fillStyle = '#FACC15'
      const electronSpacing = 35

      // Верхняя ветвь (слева направо)
      for (let x = wireLeft + (electronOffsetRef.current % electronSpacing); x < wireRight; x += electronSpacing) {
        ctx.beginPath()
        ctx.arc(x, wireTop, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      // Правая ветвь (сверху вниз)
      for (let y = wireTop + (electronOffsetRef.current % electronSpacing); y < wireBottom; y += electronSpacing) {
        ctx.beginPath()
        ctx.arc(wireRight, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      // Нижняя ветвь (справа налево)
      for (let x = wireRight - (electronOffsetRef.current % electronSpacing); x > wireLeft; x -= electronSpacing) {
        ctx.beginPath()
        ctx.arc(x, wireBottom, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      // Левая ветвь (снизу вверх)
      for (let y = wireBottom - (electronOffsetRef.current % electronSpacing); y > wireTop; y -= electronSpacing) {
        ctx.beginPath()
        ctx.arc(wireLeft, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // 1. Источник питания (Батарея) на левой стороне
      const batY = wireTop + rectH / 2
      ctx.fillStyle = isDark ? '#0F172A' : '#F8FAFC'
      ctx.fillRect(wireLeft - 18, batY - 24, 36, 48)

      // Длинная и короткая пластины батареи
      ctx.lineWidth = 3
      ctx.strokeStyle = '#EF4444' // Плюс
      ctx.beginPath()
      ctx.moveTo(wireLeft - 14, batY - 10)
      ctx.lineTo(wireLeft + 14, batY - 10)
      ctx.stroke()

      ctx.strokeStyle = '#38BDF8' // Минус
      ctx.beginPath()
      ctx.moveTo(wireLeft - 8, batY + 10)
      ctx.lineTo(wireLeft + 8, batY + 10)
      ctx.stroke()

      ctx.font = 'bold 11px sans-serif'
      ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A'
      ctx.textAlign = 'right'
      ctx.fillText(`${voltage}В`, wireLeft - 22, batY + 4)

      // 2. Отрисовка компонентов в зависимости от типа цепи
      if (circuitType === 'single') {
        // Один резистор на верхней ветви
        const r1X = wireLeft + rectW / 2
        drawResistor(ctx, r1X, wireTop, r1, `R = ${r1} Ом`, isDark)
      } else if (circuitType === 'series') {
        // Два резистора последовательно на верхней ветви
        const r1X = wireLeft + rectW * 0.35
        const r2X = wireLeft + rectW * 0.7
        drawResistor(ctx, r1X, wireTop, r1, `R₁ = ${r1} Ом (${u1.toFixed(1)}В)`, isDark)
        drawResistor(ctx, r2X, wireTop, r2, `R₂ = ${r2} Ом (${u2.toFixed(1)}В)`, isDark)
      } else {
        // Параллельное соединение
        const r1X = wireLeft + rectW * 0.65
        const midY = wireTop + rectH * 0.5
        drawResistor(ctx, r1X, wireTop, r1, `R₁ = ${r1} Ом (I₁=${i1.toFixed(1)}А)`, isDark)
        drawResistor(ctx, r1X, midY, r2, `R₂ = ${r2} Ом (I₂=${i2.toFixed(1)}А)`, isDark)
      }

      // 3. Лампочка нагрузки на правой ветви
      const lampY = wireTop + rectH / 2
      const lampBrightness = Math.min(1, Math.max(0.15, pTotal / 60))

      ctx.fillStyle = isDark ? '#0F172A' : '#F8FAFC'
      ctx.fillRect(wireRight - 16, lampY - 16, 32, 32)

      // Ореол свечения лампы
      const glowGrad = ctx.createRadialGradient(wireRight, lampY, 4, wireRight, lampY, 26)
      glowGrad.addColorStop(0, `rgba(250, 204, 21, ${lampBrightness})`)
      glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)')
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(wireRight, lampY, 26, 0, Math.PI * 2)
      ctx.fill()

      // Кружок лампы с крестиком внутри (ГОСТ)
      ctx.strokeStyle = '#FACC15'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(wireRight, lampY, 14, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(wireRight - 10, lampY - 10)
      ctx.lineTo(wireRight + 10, lampY + 10)
      ctx.moveTo(wireRight + 10, lampY - 10)
      ctx.lineTo(wireRight - 10, lampY + 10)
      ctx.stroke()

      // 4. Амперметр на нижней ветви
      const aX = wireLeft + rectW / 2
      ctx.fillStyle = isDark ? '#0F172A' : '#F8FAFC'
      ctx.fillRect(aX - 16, wireBottom - 16, 32, 32)

      ctx.strokeStyle = '#38BDF8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(aX, wireBottom, 14, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('A', aX, wireBottom + 4)
      ctx.font = '10px monospace'
      ctx.fillText(`${iTotal.toFixed(2)} А`, aX, wireBottom + 26)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [theme, circuitType, voltage, r1, r2, iTotal, u1, u2, i1, i2, pTotal])

  // Вспомогательная функция отрисовки резистора (прямоугольник)
  const drawResistor = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rVal: number,
    label: string,
    isDark: boolean
  ) => {
    const rW = 60
    const rH = 22

    ctx.fillStyle = isDark ? '#1E293B' : '#E2E8F0'
    ctx.fillRect(x - rW / 2, y - rH / 2, rW, rH)
    ctx.strokeStyle = '#A855F7'
    ctx.lineWidth = 2
    ctx.strokeRect(x - rW / 2, y - rH / 2, rW, rH)

    ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, x, y - 16)
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
            <Zap className="text-amber-400" size={20} />
            <h3 className={`font-semibold ${textColor}`}>
              {topicTitle ? `Схемотехника: ${topicTitle}` : 'Электрические цепи (последовательное и параллельное соединение)'}
            </h3>
          </div>

          {/* Переключатель соединения */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => setCircuitType('single')}
              className={`px-3 py-1 text-xs rounded transition-all ${
                circuitType === 'single' ? 'bg-amber-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              1 резистор
            </button>
            <button
              onClick={() => setCircuitType('series')}
              className={`px-3 py-1 text-xs rounded transition-all ${
                circuitType === 'series' ? 'bg-amber-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Последовательное
            </button>
            <button
              onClick={() => setCircuitType('parallel')}
              className={`px-3 py-1 text-xs rounded transition-all ${
                circuitType === 'parallel' ? 'bg-amber-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Параллельное
            </button>
          </div>
        </div>

        {/* Canvas схема */}
        <div className="relative w-full h-[290px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </Card>

      {/* Параметры и результаты измерений */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="text-amber-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Параметры источника и резисторов</h4>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Напряжение источника (U):</span>
              <span className={`font-mono font-semibold ${textColor}`}>{voltage} В</span>
            </div>
            <Slider min={1} max={24} step={1} value={voltage} onChange={setVoltage} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Сопротивление R₁:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{r1} Ом</span>
            </div>
            <Slider min={1} max={30} step={1} value={r1} onChange={setR1} />
          </div>

          {circuitType !== 'single' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={textMuted}>Сопротивление R₂:</span>
                <span className={`font-mono font-semibold ${textColor}`}>{r2} Ом</span>
              </div>
              <Slider min={1} max={30} step={1} value={r2} onChange={setR2} />
            </div>
          )}
        </Card>

        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-emerald-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Показания приборов</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Общий ток (I_общ):</div>
              <div className="text-lg font-mono font-bold text-sky-400">{iTotal.toFixed(2)} А</div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Общее сопротивление:</div>
              <div className="text-lg font-mono font-bold text-purple-400">{rTotal.toFixed(2)} Ом</div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Мощность ламп (P):</div>
              <div className="text-lg font-mono font-bold text-amber-400">{pTotal.toFixed(1)} Вт</div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Закон соединения:</div>
              <div className="text-xs font-medium text-emerald-300 truncate mt-1">
                {circuitType === 'series' ? 'R = R₁ + R₂' : circuitType === 'parallel' ? '1/R = 1/R₁ + 1/R₂' : 'I = U / R'}
              </div>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-white/50 border-t border-white/10 pt-2">
            💡 <strong>Законы цепей:</strong> При последовательном соединении ток одинаков на всех участках (I₁ = I₂), а напряжения складываются. При параллельном напряжение одинаково (U₁ = U₂), а токи разветвляются.
          </div>
        </Card>
      </div>
    </div>
  )
}
