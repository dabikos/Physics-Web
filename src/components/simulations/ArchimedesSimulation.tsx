import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Waves, Sparkles, Anchor, Scale } from 'lucide-react'

export interface ArchimedesParams {
  fluidDensity: number
  bodyDensity: number
  bodyVolume: number
  immersionFraction: number
}

interface ArchimedesSimulationProps {
  topicTitle?: string
  fluidDensity?: number
  bodyDensity?: number
  bodyVolume?: number
  immersionFraction?: number
  onParamsChange?: (params: ArchimedesParams) => void
}

const FLUIDS = [
  { id: 'water', name: '💧 Вода', density: 1000 },
  { id: 'oil', name: '🌻 Масло', density: 800 },
  { id: 'seawater', name: '🌊 Морская вода', density: 1030 },
  { id: 'mercury', name: '🔘 Ртуть', density: 13600 },
]

const MATERIALS = [
  { id: 'wood', name: '🪵 Дерево', density: 600 },
  { id: 'ice', name: '🧊 Лёд', density: 900 },
  { id: 'aluminum', name: '🧱 Алюминий', density: 2700 },
  { id: 'steel', name: '🔩 Сталь', density: 7800 },
]

export function ArchimedesSimulation({
  topicTitle,
  fluidDensity: fluidProp,
  bodyDensity: bodyProp,
  bodyVolume: volProp,
  immersionFraction: immProp,
  onParamsChange,
}: ArchimedesSimulationProps) {
  const { theme } = useTheme()

  const [fluidDensity, setFluidDensity] = useState(fluidProp ?? 1000) // кг/м³
  const [bodyDensity, setBodyDensity] = useState(bodyProp ?? 600) // кг/м³
  const [bodyVolumeLitres, setBodyVolumeLitres] = useState(volProp ? volProp * 1000 : 5) // в литрах (дм³)
  const [manualImmersion, setManualImmersion] = useState<number | null>(immProp ?? null) // null = свободное плавание

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const G = 9.81

  // Физические вычисления
  const bodyVolumeM3 = useMemo(() => bodyVolumeLitres / 1000, [bodyVolumeLitres])
  const bodyMass = useMemo(() => bodyDensity * bodyVolumeM3, [bodyDensity, bodyVolumeM3])
  const gravityForce = useMemo(() => bodyMass * G, [bodyMass])

  // Равновесная доля погружения при свободном плавании
  const equilibriumFraction = useMemo(() => {
    return Math.min(1, Math.max(0, bodyDensity / fluidDensity))
  }, [bodyDensity, fluidDensity])

  // Фактическая доля погружения (ручная или равновесная)
  const actualImmersion = useMemo(() => {
    if (manualImmersion !== null) return manualImmersion
    return equilibriumFraction
  }, [manualImmersion, equilibriumFraction])

  // Сила Архимеда
  const archimedesForce = useMemo(() => {
    const immersedVol = bodyVolumeM3 * actualImmersion
    return fluidDensity * G * immersedVol
  }, [fluidDensity, bodyVolumeM3, actualImmersion])

  // Вес тела в жидкости (показание динамометра)
  const apparentWeight = useMemo(() => {
    return Math.max(0, gravityForce - archimedesForce)
  }, [gravityForce, archimedesForce])

  // Статус плавания
  const buoyancyStatus = useMemo(() => {
    if (bodyDensity < fluidDensity - 5) return { text: 'Всплывает / Плавает на поверхности', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' }
    if (Math.abs(bodyDensity - fluidDensity) <= 5) return { text: 'Плавает в толще (зависает)', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' }
    return { text: 'Тонет на дно (тяжелее жидкости)', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/30' }
  }, [bodyDensity, fluidDensity])

  useEffect(() => {
    onParamsChange?.({
      fluidDensity,
      bodyDensity,
      bodyVolume: bodyVolumeM3,
      immersionFraction: actualImmersion,
    })
  }, [fluidDensity, bodyDensity, bodyVolumeM3, actualImmersion, onParamsChange])

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

    // Аквариум
    const tankX = width * 0.18
    const tankW = width * 0.64
    const tankY = 55
    const tankH = heightPx - 75
    const waterSurfaceY = tankY + tankH * 0.42

    // 1. Динамометр вверху
    const dynaX = tankX + tankW / 2
    const dynaY = 15
    ctx.fillStyle = isDark ? '#475569' : '#94A3B8'
    ctx.fillRect(dynaX - 16, dynaY, 32, 28)
    ctx.strokeStyle = '#CBD5E1'
    ctx.lineWidth = 1.5
    ctx.strokeRect(dynaX - 16, dynaY, 32, 28)

    // Шкала динамометра
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${apparentWeight.toFixed(1)}Н`, dynaX, dynaY + 18)

    // 2. Жидкость в аквариуме
    ctx.fillStyle = fluidDensity > 5000
      ? (isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.4)') // ртуть
      : fluidDensity < 900
      ? 'rgba(234, 179, 8, 0.25)' // масло
      : 'rgba(56, 189, 248, 0.25)' // вода

    ctx.fillRect(tankX, waterSurfaceY, tankW, tankY + tankH - waterSurfaceY)

    // Поверхность воды (волнистая линия)
    ctx.strokeStyle = fluidDensity < 900 ? '#F59E0B' : '#0284C7'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(tankX, waterSurfaceY)
    ctx.lineTo(tankX + tankW, waterSurfaceY)
    ctx.stroke()

    // 3. Стенки аквариума (стекло)
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
    ctx.lineWidth = 3
    ctx.strokeRect(tankX, tankY, tankW, tankH)

    // 4. Погружаемый брусок
    const blockSize = Math.min(80, 40 + Math.sqrt(bodyVolumeLitres) * 12)
    // Положение бруска по высоте в зависимости от actualImmersion
    const immersedH = blockSize * actualImmersion
    const blockTopY = waterSurfaceY - (blockSize - immersedH)
    const blockX = dynaX - blockSize / 2

    // Нить от динамометра к бруску
    ctx.strokeStyle = isDark ? '#E2E8F0' : '#475569'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(dynaX, dynaY + 28)
    ctx.lineTo(dynaX, blockTopY)
    ctx.stroke()

    // Корпус бруска
    ctx.fillStyle = bodyDensity < 800 ? '#B45309' : bodyDensity < 1500 ? '#67E8F9' : '#64748B'
    ctx.fillRect(blockX, blockTopY, blockSize, blockSize)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.strokeRect(blockX, blockTopY, blockSize, blockSize)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText(`${bodyMass.toFixed(2)} кг`, dynaX, blockTopY + blockSize / 2 + 4)

    // 5. Векторы сил: Сила тяжести (вниз) и сила Архимеда (вверх)
    const vectorScale = 1.2
    const centerBlockY = blockTopY + blockSize / 2

    // Сила тяжести F_T (красная стрелка вниз)
    const ftLen = gravityForce * vectorScale
    drawForceArrow(ctx, dynaX + 22, centerBlockY, ftLen, '#F43F5E', `Fт=${gravityForce.toFixed(1)}Н`, 1)

    // Сила Архимеда F_A (синяя стрелка вверх)
    const faLen = archimedesForce * vectorScale
    drawForceArrow(ctx, dynaX - 22, centerBlockY, faLen, '#38BDF8', `Fа=${archimedesForce.toFixed(1)}Н`, -1)
  }, [theme, fluidDensity, bodyDensity, bodyVolumeLitres, actualImmersion, apparentWeight, gravityForce, archimedesForce, bodyMass])

  const drawForceArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    color: string,
    label: string,
    dir: 1 | -1
  ) => {
    if (len < 2) return
    const endY = y + len * dir
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, endY)
    ctx.stroke()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x, endY)
    ctx.lineTo(x - 4, endY - dir * 7)
    ctx.lineTo(x + 4, endY - dir * 7)
    ctx.closePath()
    ctx.fill()

    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, x, endY + dir * 13)
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
            <Waves className="text-sky-400" size={20} />
            <h3 className={`font-semibold ${textColor}`}>
              {topicTitle ? `Гидростатика: ${topicTitle}` : 'Закон Архимеда и плавание тел'}
            </h3>
          </div>

          <div className={`px-2.5 py-1 rounded-full border text-xs font-medium ${buoyancyStatus.badge} ${buoyancyStatus.color}`}>
            {buoyancyStatus.text}
          </div>
        </div>

        {/* Canvas контейнер */}
        <div className="relative w-full h-[290px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Переключатели пресетов жидкостей и материалов */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <span className={`text-xs ${textMuted} mb-1 block`}>Жидкость в сосуде:</span>
            <div className="flex flex-wrap gap-1.5">
              {FLUIDS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFluidDensity(f.density)}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    fluidDensity === f.density
                      ? 'bg-sky-600 text-white font-medium shadow'
                      : 'bg-black/20 text-white/60 hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={`text-xs ${textMuted} mb-1 block`}>Материал тела:</span>
            <div className="flex flex-wrap gap-1.5">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setBodyDensity(m.density)
                    setManualImmersion(null)
                  }}
                  className={`px-2.5 py-1 text-xs rounded transition-all ${
                    bodyDensity === m.density
                      ? 'bg-purple-600 text-white font-medium shadow'
                      : 'bg-black/20 text-white/60 hover:text-white'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Параметры и показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2">
            <Anchor className="text-sky-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Параметры системы</h4>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Плотность жидкости ρ_ж:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{fluidDensity} кг/м³</span>
            </div>
            <Slider min={600} max={14000} step={100} value={fluidDensity} onChange={setFluidDensity} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Плотность тела ρ_т:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{bodyDensity} кг/м³</span>
            </div>
            <Slider min={200} max={12000} step={50} value={bodyDensity} onChange={(v) => { setBodyDensity(v); setManualImmersion(null); }} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Объём тела V:</span>
              <span className={`font-mono font-semibold ${textColor}`}>{bodyVolumeLitres} л (дм³)</span>
            </div>
            <Slider min={1} max={20} step={1} value={bodyVolumeLitres} onChange={setBodyVolumeLitres} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Принудительное погружение:</span>
              <span className={`font-mono font-semibold ${textColor}`}>
                {manualImmersion === null ? 'Свободное плавание' : `${Math.round(manualImmersion * 100)}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={actualImmersion}
                onChange={(v) => setManualImmersion(v)}
              />
              {manualImmersion !== null && (
                <button
                  onClick={() => setManualImmersion(null)}
                  className="text-xs text-sky-400 hover:underline shrink-0"
                >
                  Авто
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2">
            <Scale className="text-purple-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Расчётные силы и показания</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Сила тяжести Fт:</div>
              <div className="text-lg font-mono font-bold text-rose-400">{gravityForce.toFixed(1)} Н</div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Выталкивающая Fа:</div>
              <div className="text-lg font-mono font-bold text-sky-400">{archimedesForce.toFixed(1)} Н</div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Вес в жидкости (динамометр):</div>
              <div className="text-lg font-mono font-bold text-amber-400">{apparentWeight.toFixed(1)} Н</div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Погружённая часть:</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {(actualImmersion * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-white/50 border-t border-white/10 pt-2">
            💡 <strong>Закон Архимеда:</strong> На тело, погружённое в жидкость, действует выталкивающая
            сила, равная весу вытесненной жидкости: F_a = ρ_ж · g · V_погр. Тело плавает на поверхности,
            когда F_a = F_т.
          </div>
        </Card>
      </div>
    </div>
  )
}
