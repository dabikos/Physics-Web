import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Flame, Snowflake, Gauge, Sparkles, Sliders } from 'lucide-react'

export interface GasLawsParams {
  processType: 'free' | 'isothermal' | 'isobaric' | 'isochoric'
  temperature: number // К
  volume: number // литры
  particleCount: number
}

interface GasLawsSimulationProps {
  topicTitle?: string
  processType?: 'free' | 'isothermal' | 'isobaric' | 'isochoric'
  temperature?: number
  volume?: number
  particleCount?: number
  onParamsChange?: (params: GasLawsParams) => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export function GasLawsSimulation({
  topicTitle,
  processType: procProp,
  temperature: tProp,
  volume: vProp,
  particleCount: nCountProp,
  onParamsChange,
}: GasLawsSimulationProps) {
  const { theme } = useTheme()

  const [processType, setProcessType] = useState<'free' | 'isothermal' | 'isobaric' | 'isochoric'>(
    procProp ?? 'free'
  )
  const [temperature, setTemperature] = useState(tProp ?? 300) // Кельвины (300K = комнатная)
  const [volume, setVolume] = useState(vProp ?? 5) // Литры (1 - 10)
  const [particleCount, setParticleCount] = useState(nCountProp ?? 60)

  // Расчет идеального газа: PV = νRT -> P = (N * T) / (V * constant)
  // При T=300K, V=5л, N=60 пусть P ≈ 1.0 атм (101.3 кПа)
  const pressureAtm = useMemo(() => {
    const k = (1.0 * 5) / (60 * 300)
    return (particleCount * temperature * k) / Math.max(0.5, volume)
  }, [particleCount, temperature, volume])

  const pressureKPa = useMemo(() => pressureAtm * 101.325, [pressureAtm])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number | null>(null)

  // Инициализация частиц при изменении их количества
  useEffect(() => {
    const pts: Particle[] = []
    const speedBase = Math.sqrt(temperature / 300) * 2.2
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const spd = speedBase * (0.6 + Math.random() * 0.8)
      pts.push({
        x: 20 + Math.random() * 120,
        y: 40 + Math.random() * 120,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 3.5,
      })
    }
    particlesRef.current = pts
  }, [particleCount])

  // Масштабирование скоростей частиц при изменении температуры
  useEffect(() => {
    const speedFactor = Math.sqrt(temperature / 300) * 2.2
    particlesRef.current.forEach((p) => {
      const currentSpd = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1
      const angle = Math.atan2(p.vy, p.vx)
      const newSpd = speedFactor * (0.6 + Math.random() * 0.8)
      p.vx = Math.cos(angle) * newSpd
      p.vy = Math.sin(angle) * newSpd
    })
  }, [temperature])

  // Регулировка параметров с учётом изопроцессов
  const handleVolumeChange = (newV: number) => {
    if (processType === 'isochoric') return // V = const
    setVolume(newV)

    if (processType === 'isothermal') {
      // T = const, P изменится автоматически
    } else if (processType === 'isobaric') {
      // P = const: V1/T1 = V2/T2 -> T2 = T1 * (V2 / V1)
      const newT = Math.min(800, Math.max(100, Math.round(temperature * (newV / volume))))
      setTemperature(newT)
    }
  }

  const handleTemperatureChange = (newT: number) => {
    if (processType === 'isothermal') return // T = const
    setTemperature(newT)

    if (processType === 'isobaric') {
      // P = const: V2 = V1 * (T2 / T1)
      const newV = Math.min(10, Math.max(1, +(volume * (newT / temperature)).toFixed(1)))
      setVolume(newV)
    }
  }

  useEffect(() => {
    onParamsChange?.({ processType, temperature, volume, particleCount })
  }, [processType, temperature, volume, particleCount, onParamsChange])

  // Физический цикл движения молекул и отрисовка на Canvas
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

      // ==========================================
      // ЛЕВАЯ ЗОНА: ЦИЛИНДР С ПОРШНЕМ И МОЛЕКУЛАМИ
      // ==========================================
      const cylX = 35
      const cylW = width * 0.45
      const cylBottomY = heightPx - 45
      const maxCylHeight = heightPx - 95

      // Высота поршня зависит от объема V (1..10 л)
      const volumeFraction = volume / 10
      const currentCylHeight = 40 + volumeFraction * (maxCylHeight - 40)
      const pistonY = cylBottomY - currentCylHeight

      // Газ внутри цилиндра (подсветка зависит от температуры: холодный голубой -> горячий красный)
      const tempRatio = Math.min(1, Math.max(0, (temperature - 100) / 600))
      const gasFill = tempRatio > 0.5
        ? `rgba(244, 63, 94, ${0.1 + tempRatio * 0.25})`
        : `rgba(56, 189, 248, ${0.1 + (1 - tempRatio) * 0.25})`

      ctx.fillStyle = gasFill
      ctx.fillRect(cylX, pistonY, cylW, currentCylHeight)

      // Стенки цилиндра (U-образная колба)
      ctx.strokeStyle = isDark ? '#94A3B8' : '#475569'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(cylX, 35)
      ctx.lineTo(cylX, cylBottomY)
      ctx.lineTo(cylX + cylW, cylBottomY)
      ctx.lineTo(cylX + cylW, 35)
      ctx.stroke()

      // Движение и отскок частиц газа
      const pts = particlesRef.current
      ctx.fillStyle = tempRatio > 0.5 ? '#FB7185' : '#38BDF8'

      pts.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        // Отскок от левой и правой стенок
        if (p.x - p.radius <= cylX) {
          p.x = cylX + p.radius
          p.vx = -p.vx
        } else if (p.x + p.radius >= cylX + cylW) {
          p.x = cylX + cylW - p.radius
          p.vx = -p.vx
        }

        // Отскок от дна и поршня
        if (p.y - p.radius <= pistonY) {
          p.y = pistonY + p.radius
          p.vy = Math.abs(p.vy)
        } else if (p.y + p.radius >= cylBottomY) {
          p.y = cylBottomY - p.radius
          p.vy = -Math.abs(p.vy)
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Поршень
      const pistonThickness = 12
      ctx.fillStyle = isDark ? '#E2E8F0' : '#334155'
      ctx.fillRect(cylX, pistonY - pistonThickness, cylW, pistonThickness)
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.5
      ctx.strokeRect(cylX, pistonY - pistonThickness, cylW, pistonThickness)

      // Шток поршня
      const rodW = 14
      ctx.fillStyle = isDark ? '#94A3B8' : '#64748B'
      ctx.fillRect(cylX + cylW / 2 - rodW / 2, 20, rodW, pistonY - 20)

      // Стрелки нагревателя/охладителя снизу
      if (temperature > 300) {
        ctx.fillStyle = '#EF4444'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('🔥🔥🔥', cylX + cylW / 2, cylBottomY + 24)
      } else if (temperature < 250) {
        ctx.fillStyle = '#38BDF8'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('❄️❄️❄️', cylX + cylW / 2, cylBottomY + 24)
      }

      // ==========================================
      // ПРАВАЯ ЗОНА: P-V ДИАГРАММА ИЗОПРОЦЕССОВ
      // ==========================================
      const pvLeft = width * 0.55
      const pvRight = width - 30
      const pvTop = 35
      const pvBottom = heightPx - 45
      const pvW = pvRight - pvLeft
      const pvH = pvBottom - pvTop

      // Оси P и V
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      // Ось P (вертикальная)
      ctx.moveTo(pvLeft, pvTop)
      ctx.lineTo(pvLeft, pvBottom)
      // Ось V (горизонтальная)
      ctx.lineTo(pvRight, pvBottom)
      ctx.stroke()

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('P (атм)', pvLeft + 5, pvTop - 10)
      ctx.fillText('V (л)', pvRight + 12, pvBottom + 4)

      // Идеальная изотерма при текущей температуре: P = C / V
      ctx.strokeStyle = '#A855F7'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      const cIso = (particleCount * temperature * ((1.0 * 5) / (60 * 300)))
      for (let vStep = 1; vStep <= 10; vStep += 0.25) {
        const pVal = cIso / vStep
        const px = pvLeft + (vStep / 10) * pvW
        const py = pvBottom - (Math.min(3, pVal) / 3) * pvH
        if (vStep === 1) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Текущая точка состояния (P, V) на графике
      const pointX = pvLeft + (volume / 10) * pvW
      const pointY = pvBottom - (Math.min(3, pressureAtm) / 3) * pvH

      // Проекции на оси
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(pointX, pvBottom)
      ctx.lineTo(pointX, pointY)
      ctx.lineTo(pvLeft, pointY)
      ctx.stroke()
      ctx.setLineDash([])

      // Точка на графике
      ctx.fillStyle = '#38BDF8'
      ctx.beginPath()
      ctx.arc(pointX, pointY, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`(${volume}л; ${pressureAtm.toFixed(2)}атм)`, pointX + 8, pointY - 6)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [theme, volume, temperature, particleCount, pressureAtm])

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg =
    theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'

  return (
    <div className="space-y-4">
      <Card className="p-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Gauge className="text-purple-400" size={20} />
            <h3 className={`font-semibold ${textColor}`}>
              {topicTitle ? `Термодинамика: ${topicTitle}` : 'Идеальный газ и газовые законы (МКТ)'}
            </h3>
          </div>

          {/* Переключатель изопроцессов */}
          <div className="flex flex-wrap items-center gap-1 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => setProcessType('free')}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                processType === 'free' ? 'bg-purple-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Свободный
            </button>
            <button
              onClick={() => setProcessType('isothermal')}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                processType === 'isothermal' ? 'bg-purple-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Изотерма (T=const)
            </button>
            <button
              onClick={() => setProcessType('isobaric')}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                processType === 'isobaric' ? 'bg-purple-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Изобара (P=const)
            </button>
            <button
              onClick={() => setProcessType('isochoric')}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                processType === 'isochoric' ? 'bg-purple-600 text-white font-medium shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Изохора (V=const)
            </button>
          </div>
        </div>

        {/* Canvas холст */}
        <div className="relative w-full h-[320px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </Card>

      {/* Управление и показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="text-purple-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Макропараметры газа</h4>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Температура T:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{temperature} К ({(temperature - 273.15).toFixed(0)} °C)</span>
            </div>
            <Slider
              min={100}
              max={750}
              step={10}
              value={temperature}
              onChange={handleTemperatureChange}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Объём V (положение поршня):</span>
              <span className={`font-mono font-semibold ${textColor}`}>{volume.toFixed(1)} л</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={0.2}
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Число молекул N:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{particleCount}</span>
            </div>
            <Slider min={20} max={120} step={5} value={particleCount} onChange={setParticleCount} />
          </div>
        </Card>

        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-emerald-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Показания приборов</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Давление (P):</div>
              <div className="text-lg font-mono font-bold text-sky-400">{pressureAtm.toFixed(2)} атм</div>
              <div className="text-[10px] text-white/50">{pressureKPa.toFixed(1)} кПа</div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Ср. скорость молекул:</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {(Math.sqrt(temperature / 300) * 480).toFixed(0)} <span className="text-xs font-normal">м/с</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Внутренняя энергия U:</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                {(0.5 * 3 * pressureKPa * volume).toFixed(0)} <span className="text-xs font-normal">Дж</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Текущий процесс:</div>
              <div className="text-xs font-medium text-purple-300 mt-1">
                {processType === 'free' ? 'Произвольный' : processType === 'isothermal' ? 'Бойля-Мариотта' : processType === 'isobaric' ? 'Гей-Люссака' : 'Шарля'}
              </div>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-white/50 border-t border-white/10 pt-2">
            💡 <strong>Уравнение Менделеева-Клапейрона:</strong> PV = νRT. Температура — мера средней кинетической энергии теплового хаотического движения молекул (Eₖ = 3/2 kT).
          </div>
        </Card>
      </div>
    </div>
  )
}
