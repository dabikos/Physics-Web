import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { Eye, Sparkles, Sliders, Focus } from 'lucide-react'

export interface OpticsLensParams {
  lensType: 'converging' | 'diverging'
  focalLength: number
  objectDistance: number
  objectHeight: number
}

interface OpticsLensSimulationProps {
  topicTitle?: string
  lensType?: 'converging' | 'diverging'
  focalLength?: number
  objectDistance?: number
  objectHeight?: number
  onParamsChange?: (params: OpticsLensParams) => void
}

export function OpticsLensSimulation({
  topicTitle,
  lensType: typeProp,
  focalLength: fProp,
  objectDistance: dProp,
  objectHeight: hProp,
  onParamsChange,
}: OpticsLensSimulationProps) {
  const { theme } = useTheme()

  const [lensType, setLensType] = useState<'converging' | 'diverging'>(typeProp ?? 'converging')
  const [focalLength, setFocalLength] = useState(fProp ?? 60) // Фокусное расстояние F (мм)
  const [objectDistance, setObjectDistance] = useState(dProp ?? 110) // Расстояние до предмета d (мм)
  const [objectHeight, setObjectHeight] = useState(hProp ?? 45) // Высота предмета h (мм)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Физический фокус (собирающая: F > 0, рассеивающая: F < 0)
  const F = useMemo(() => {
    return lensType === 'converging' ? focalLength : -focalLength
  }, [lensType, focalLength])

  const d = objectDistance
  const h = objectHeight

  // Расстояние до изображения f по формуле тонкой линзы: 1/F = 1/d + 1/f  => f = (F * d) / (d - F)
  const f = useMemo(() => {
    if (Math.abs(d - F) < 0.001) return Infinity
    return (F * d) / (d - F)
  }, [F, d])

  // Линейное увеличение: Г = -f / d (минус означает перевёрнутое изображение)
  const magnification = useMemo(() => {
    if (!isFinite(f)) return 0
    return -f / d
  }, [f, d])

  // Высота изображения: H = Г * h
  const imageHeight = useMemo(() => {
    if (!isFinite(f)) return 0
    return magnification * h
  }, [magnification, h])

  // Оптическая сила D = 1 / (F в метрах)
  const opticalPower = useMemo(() => {
    const fMeters = F / 1000
    return 1 / fMeters
  }, [F])

  // Классификация изображения
  const imageInfo = useMemo(() => {
    if (!isFinite(f)) {
      return {
        type: 'В бесконечности',
        orientation: 'Лучи параллельны',
        size: 'Изображения нет',
        app: 'Прожектор',
        color: 'text-amber-400',
        badge: 'bg-amber-500/20 border-amber-500/30',
      }
    }

    const isReal = f > 0
    const isUpright = magnification > 0
    const absMag = Math.abs(magnification)

    const typeText = isReal ? 'Действительное' : 'Мнимое'
    const orientText = isUpright ? 'Прямое' : 'Перевёрнутое'
    const sizeText =
      Math.abs(absMag - 1) < 0.05
        ? 'Равное по размеру (1:1)'
        : absMag > 1
        ? `Увеличенное (в ${absMag.toFixed(1)}x)`
        : `Уменьшенное (в ${(1 / absMag).toFixed(1)}x)`

    let app = ''
    if (lensType === 'diverging') {
      app = 'Очки для близорукости (рассеивающая)'
    } else if (d > 2 * focalLength) {
      app = 'Фотоаппарат, человеческий глаз'
    } else if (Math.abs(d - 2 * focalLength) <= 2) {
      app = 'Копир (масштаб 1:1)'
    } else if (d > focalLength) {
      app = 'Проектор, киноаппарат'
    } else {
      app = 'Лупа (увеличительное стекло)'
    }

    return {
      type: typeText,
      orientation: orientText,
      size: sizeText,
      app,
      color: isReal ? 'text-emerald-400' : 'text-sky-400',
      badge: isReal
        ? 'bg-emerald-500/20 border-emerald-500/30'
        : 'bg-sky-500/20 border-sky-500/30',
    }
  }, [f, magnification, lensType, d, focalLength])

  useEffect(() => {
    onParamsChange?.({
      lensType,
      focalLength,
      objectDistance,
      objectHeight,
    })
  }, [lensType, focalLength, objectDistance, objectHeight, onParamsChange])

  // Отрисовка хода оптических лучей на Canvas
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

    // Координаты центра линзы на экране
    const lensX = width * 0.44
    const axisY = heightPx / 2

    // Масштаб: пиксели экрана на 1 мм физической оптической схемы
    const scale = Math.min(width / 320, 1.6)

    // 1. Главная оптическая ось (горизонтальная)
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(15, axisY)
    ctx.lineTo(width - 15, axisY)
    ctx.stroke()

    // 2. Сама линза (вертикальная плоскость x = lensX)
    const lensRadius = heightPx * 0.42
    ctx.strokeStyle = '#38BDF8'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(lensX, axisY - lensRadius)
    ctx.lineTo(lensX, axisY + lensRadius)
    ctx.stroke()

    // Стрелочки линзы (собирающая наружу, рассеивающая внутрь)
    const arrSize = 10
    ctx.lineWidth = 2.5
    if (lensType === 'converging') {
      // Стрелки наружу
      ctx.beginPath()
      ctx.moveTo(lensX - arrSize, axisY - lensRadius + arrSize)
      ctx.lineTo(lensX, axisY - lensRadius)
      ctx.lineTo(lensX + arrSize, axisY - lensRadius + arrSize)
      ctx.moveTo(lensX - arrSize, axisY + lensRadius - arrSize)
      ctx.lineTo(lensX, axisY + lensRadius)
      ctx.lineTo(lensX + arrSize, axisY + lensRadius - arrSize)
      ctx.stroke()
    } else {
      // Стрелки внутрь
      ctx.beginPath()
      ctx.moveTo(lensX - arrSize, axisY - lensRadius - arrSize)
      ctx.lineTo(lensX, axisY - lensRadius)
      ctx.lineTo(lensX + arrSize, axisY - lensRadius - arrSize)
      ctx.moveTo(lensX - arrSize, axisY + lensRadius + arrSize)
      ctx.lineTo(lensX, axisY + lensRadius)
      ctx.lineTo(lensX + arrSize, axisY + lensRadius + arrSize)
      ctx.stroke()
    }

    // 3. Фокусы F и 2F слева и справа
    const fPx = focalLength * scale
    const focalPoints = [
      { x: lensX - fPx, label: 'F₁', color: '#EAB308' },
      { x: lensX - 2 * fPx, label: '2F₁', color: '#CA8A04' },
      { x: lensX + fPx, label: 'F₂', color: '#EAB308' },
      { x: lensX + 2 * fPx, label: '2F₂', color: '#CA8A04' },
    ]

    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    focalPoints.forEach((fp) => {
      ctx.fillStyle = fp.color
      ctx.beginPath()
      ctx.arc(fp.x, axisY, 3.5, 0, Math.PI * 2)
      ctx.fill()

      // Тонкая пунктирная вертикаль через фокус
      ctx.strokeStyle = isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(202, 138, 4, 0.2)'
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(fp.x, axisY - 30)
      ctx.lineTo(fp.x, axisY + 30)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillText(fp.label, fp.x, axisY + 16)
    })

    // 4. Предмет (Стрелка) слева от линзы
    const objX = lensX - d * scale
    const objTopY = axisY - h * scale

    // Линия стрелки предмета
    ctx.strokeStyle = '#F43F5E'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(objX, axisY)
    ctx.lineTo(objX, objTopY)
    ctx.stroke()

    // Наконечник стрелки предмета
    ctx.fillStyle = '#F43F5E'
    ctx.beginPath()
    ctx.moveTo(objX, objTopY - 4)
    ctx.lineTo(objX - 5, objTopY + 7)
    ctx.lineTo(objX + 5, objTopY + 7)
    ctx.closePath()
    ctx.fill()

    ctx.fillText('Предмет', objX, axisY - h * scale - 10)

    // 5. Построение изображения и хода 3 главных лучей
    if (isFinite(f)) {
      const imgX = lensX + f * scale
      const imgTopY = axisY - imageHeight * scale
      const isReal = f > 0

      // ЛУЧ 1 (Красный): Параллельно главной оси -> через задний фокус
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#F43F5E'
      ctx.beginPath()
      ctx.moveTo(objX, objTopY)
      ctx.lineTo(lensX, objTopY) // до линзы
      ctx.stroke()

      if (lensType === 'converging') {
        // После собирающей линзы проходит через задний фокус F2 (lensX + fPx, axisY)
        const slope1 = (axisY - objTopY) / fPx
        const ray1EndX = isReal ? Math.max(imgX + 40, width - 20) : width - 20
        const ray1EndY = objTopY + slope1 * (ray1EndX - lensX)

        ctx.beginPath()
        ctx.moveTo(lensX, objTopY)
        ctx.lineTo(ray1EndX, ray1EndY)
        ctx.stroke()

        // Пунктирное продолжение назад для мнимого изображения (лупа d < F)
        if (!isReal) {
          ctx.setLineDash([3, 3])
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)'
          ctx.beginPath()
          ctx.moveTo(lensX, objTopY)
          ctx.lineTo(imgX, imgTopY)
          ctx.stroke()
          ctx.setLineDash([])
        }
      } else {
        // Рассеивающая линза: луч 1 расходится так, будто выходит из переднего фокуса F1 (lensX - fPx, axisY)
        const slopeDiv = (objTopY - axisY) / fPx
        const ray1EndX = width - 20
        const ray1EndY = objTopY + slopeDiv * (ray1EndX - lensX)

        ctx.beginPath()
        ctx.moveTo(lensX, objTopY)
        ctx.lineTo(ray1EndX, ray1EndY)
        ctx.stroke()

        // Пунктирное продолжение в мнимый фокус F1
        ctx.setLineDash([3, 3])
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)'
        ctx.beginPath()
        ctx.moveTo(lensX, objTopY)
        ctx.lineTo(imgX, imgTopY)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // ЛУЧ 2 (Голубой): Через оптический центр (lensX, axisY) без преломления
      ctx.strokeStyle = '#38BDF8'
      ctx.lineWidth = 1.5
      const slope2 = (axisY - objTopY) / (lensX - objX)
      const ray2EndX = isReal ? Math.max(imgX + 40, width - 20) : width - 20
      const ray2EndY = axisY + slope2 * (ray2EndX - lensX)

      ctx.beginPath()
      ctx.moveTo(objX, objTopY)
      ctx.lineTo(lensX, axisY)
      ctx.lineTo(ray2EndX, ray2EndY)
      ctx.stroke()

      // Пунктирное продолжение назад если изображение мнимое
      if (!isReal) {
        ctx.setLineDash([3, 3])
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
        ctx.beginPath()
        ctx.moveTo(lensX, axisY)
        ctx.lineTo(imgX, imgTopY)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // 6. Само изображение (Стрелка)
      ctx.lineWidth = 3
      if (!isReal) ctx.setLineDash([4, 4])
      ctx.strokeStyle = isReal ? '#10B981' : '#A855F7'
      ctx.beginPath()
      ctx.moveTo(imgX, axisY)
      ctx.lineTo(imgX, imgTopY)
      ctx.stroke()
      ctx.setLineDash([])

      // Наконечник стрелки изображения
      ctx.fillStyle = isReal ? '#10B981' : '#A855F7'
      const dirY = imageHeight >= 0 ? -1 : 1
      ctx.beginPath()
      ctx.moveTo(imgX, imgTopY - dirY * 4)
      ctx.lineTo(imgX - 5, imgTopY + dirY * 7)
      ctx.lineTo(imgX + 5, imgTopY + dirY * 7)
      ctx.closePath()
      ctx.fill()

      ctx.fillText('Изображение', imgX, imgTopY - dirY * 12)
    }
  }, [theme, lensType, focalLength, objectDistance, objectHeight, F, d, h, f, imageHeight])

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg =
    theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'

  return (
    <div className="space-y-4">
      <Card className="p-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Focus className="text-purple-400" size={20} />
            <h3 className={`font-semibold ${textColor}`}>
              {topicTitle ? `Оптика: ${topicTitle}` : 'Тонкая линза и геометрическая оптика'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Переключатель типа линзы */}
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
              <button
                onClick={() => setLensType('converging')}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  lensType === 'converging'
                    ? 'bg-purple-600 text-white font-medium shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Собирающая (+)
              </button>
              <button
                onClick={() => setLensType('diverging')}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  lensType === 'diverging'
                    ? 'bg-purple-600 text-white font-medium shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Рассеивающая (−)
              </button>
            </div>

            <div className={`px-2.5 py-1 rounded-full border text-xs font-medium ${imageInfo.badge} ${imageInfo.color}`}>
              {imageInfo.type} ({imageInfo.orientation})
            </div>
          </div>
        </div>

        {/* Canvas холст построения лучей */}
        <div className="relative w-full h-[320px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Легенда лучей */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-xs space-y-1 text-white">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-rose-500"></div>
              <span>Луч || оси через фокус F</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-sky-400"></div>
              <span>Луч через оптический центр O</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-emerald-400"></div>
              <span>Действительное изобр.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 border-t-2 border-dashed border-purple-400"></div>
              <span>Мнимое изобр.</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Параметры и оптические характеристики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ползунки */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="text-purple-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Геометрические параметры</h4>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Расстояние до предмета (d):</span>
              <span className={`font-mono font-semibold ${textColor}`}>{objectDistance} мм</span>
            </div>
            <Slider min={20} max={200} step={2} value={objectDistance} onChange={setObjectDistance} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Фокусное расстояние (|F|):</span>
              <span className={`font-mono font-semibold ${textColor}`}>{focalLength} мм</span>
            </div>
            <Slider min={30} max={100} step={2} value={focalLength} onChange={setFocalLength} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={textMuted}>Высота предмета (h):</span>
              <span className={`font-mono font-semibold ${textColor}`}>{objectHeight} мм</span>
            </div>
            <Slider min={15} max={70} step={1} value={objectHeight} onChange={setObjectHeight} />
          </div>
        </Card>

        {/* Анализ и формула */}
        <Card className={`p-4 ${panelBg} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-emerald-400" size={18} />
            <h4 className={`text-sm font-semibold ${textColor}`}>Оптический расчёт</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Расстояние до экрана (f):</div>
              <div className="text-lg font-mono font-bold text-sky-400">
                {isFinite(f) ? `${f.toFixed(1)} мм` : '∞'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Оптическая сила (D):</div>
              <div className="text-lg font-mono font-bold text-purple-400">
                {opticalPower.toFixed(2)} <span className="text-xs font-normal">дптр</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Увеличение (Г):</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                {isFinite(magnification) ? `${Math.abs(magnification).toFixed(2)}x` : '—'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <div className={textMuted}>Применение:</div>
              <div className="text-xs font-medium text-emerald-300 truncate mt-1">
                {imageInfo.app}
              </div>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-white/50 border-t border-white/10 pt-2">
            💡 <strong>Формула тонкой линзы:</strong> 1/F = 1/d + 1/f. Если изображение получается
            по ту же сторону, что и предмет (f &lt; 0), оно является мнимым и прямым (принцип работы лупы).
          </div>
        </Card>
      </div>
    </div>
  )
}
