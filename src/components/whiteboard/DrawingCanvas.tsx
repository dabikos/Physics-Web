import React, { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { PenTool, Eraser, Undo2, Trash2, X, Check, Columns2, Rows2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

export interface DrawingCanvasProps {
  isActive: boolean
  onClose: () => void
  toolbarAnchor?: HTMLElement | null
  position?: 'left' | 'bottom'
  onTogglePosition?: () => void
}

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
  color: string
  width: number
  isEraser: boolean
}

const COLOR_PRESETS = [
  { id: 'red', label: 'Красный', value: '#ef4444', bg: 'bg-red-500' },
  { id: 'yellow', label: 'Желтый', value: '#facc15', bg: 'bg-amber-400' },
  { id: 'cyan', label: 'Синий', value: '#38bdf8', bg: 'bg-sky-400' },
  { id: 'green', label: 'Зеленый', value: '#10b981', bg: 'bg-emerald-500' },
  { id: 'white', label: 'Белый / Мел', value: '#ffffff', bg: 'bg-white' },
]

const WIDTH_PRESETS = [
  { id: 'thin', label: 'Тонкое (2px)', size: 2, dotSize: 'w-1.5 h-1.5' },
  { id: 'medium', label: 'Среднее (4px)', size: 4, dotSize: 'w-2.5 h-2.5' },
  { id: 'thick', label: 'Жирное (8px)', size: 8, dotSize: 'w-3.5 h-3.5' },
]

export function DrawingCanvas({
  isActive,
  onClose,
  toolbarAnchor,
  position = 'bottom',
  onTogglePosition,
}: DrawingCanvasProps) {
  const { theme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState<number>(4)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const currentStrokeRef = useRef<Stroke | null>(null)

  // Re-draw all strokes onto canvas
  const redrawCanvas = useCallback((strokeList: Stroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    strokeList.forEach((stroke) => {
      if (stroke.points.length < 1) return

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = stroke.width * 3
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.width
      }

      ctx.beginPath()
      const pts = stroke.points
      ctx.moveTo(pts[0].x, pts[0].y)

      if (pts.length === 1) {
        ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1)
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2
          const midY = (pts[i].y + pts[i + 1].y) / 2
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      }

      ctx.stroke()
      ctx.restore()
    })
  }, [])

  // Sync canvas dimensions with parent Card container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current?.parentElement
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      redrawCanvas(strokes)
    }
  }, [strokes, redrawCanvas])

  useEffect(() => {
    resizeCanvas()
    const container = containerRef.current?.parentElement
    if (!container) return

    const observer = new ResizeObserver(() => {
      resizeCanvas()
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [resizeCanvas])

  // Get pointer coordinates relative to canvas
  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive) return
    const pos = getPointerPos(e)
    const newStroke: Stroke = {
      points: [pos],
      color: selectedColor,
      width: strokeWidth,
      isEraser: tool === 'eraser',
    }

    currentStrokeRef.current = newStroke
    setIsDrawing(true)

    // Draw single point immediately
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = strokeWidth * 3
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = strokeWidth
    }

    ctx.beginPath()
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? strokeWidth * 1.5 : strokeWidth / 2), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive || !isDrawing || !currentStrokeRef.current) return
    const pos = getPointerPos(e)
    const stroke = currentStrokeRef.current
    stroke.points.push(pos)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (stroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = stroke.width * 3
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
    }

    const pts = stroke.points
    const len = pts.length
    if (len >= 3) {
      const xc = (pts[len - 2].x + pts[len - 1].x) / 2
      const yc = (pts[len - 2].y + pts[len - 1].y) / 2
      ctx.beginPath()
      ctx.moveTo(pts[len - 3].x, pts[len - 3].y)
      ctx.quadraticCurveTo(pts[len - 2].x, pts[len - 2].y, xc, yc)
      ctx.stroke()
    } else if (len === 2) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[1].x, pts[1].y)
      ctx.stroke()
    }

    ctx.restore()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return
    const finishedStroke = currentStrokeRef.current
    setIsDrawing(false)
    currentStrokeRef.current = null

    setStrokes((prev) => [...prev, finishedStroke])

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const handleUndo = () => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev
      const next = prev.slice(0, prev.length - 1)
      redrawCanvas(next)
      return next
    })
  }

  const handleClear = () => {
    setStrokes([])
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const toolbarContent = (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{
            opacity: 0,
            y: position === 'left' ? 0 : -8,
            x: position === 'left' ? 8 : 0,
            scale: 0.96,
          }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: position === 'left' ? 0 : -8,
            x: position === 'left' ? 8 : 0,
            scale: 0.96,
          }}
          transition={{ duration: 0.16 }}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl shadow-xl backdrop-blur-md border
            ${
              theme === 'dark'
                ? 'bg-slate-900/90 border-white/10 text-slate-200 shadow-black/40'
                : 'bg-white/95 border-slate-200 text-slate-700 shadow-slate-500/20'
            }
          `}
        >
          {/* Tool toggles: Pen vs Eraser */}
          <div className="flex items-center bg-black/10 dark:bg-white/10 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setTool('pen')}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                ${
                  tool === 'pen'
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
              title="Ручка (Перо)"
            >
              <PenTool size={13} />
              <span>Перо</span>
            </button>
            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                ${
                  tool === 'eraser'
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
              title="Ластик"
            >
              <Eraser size={13} />
              <span>Ластик</span>
            </button>
          </div>

          <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

          {/* Colors (only relevant when tool is pen) */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map((color) => {
                const isSelected = selectedColor === color.value
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`
                      w-5 h-5 rounded-full flex items-center justify-center transition-transform relative
                      ${color.bg} ${isSelected ? 'scale-110 ring-2 ring-primary-400 ring-offset-2 ring-offset-slate-900' : 'opacity-85 hover:scale-105 hover:opacity-100'}
                    `}
                    title={color.label}
                  >
                    {isSelected && (
                      <Check
                        size={11}
                        className={color.id === 'yellow' || color.id === 'white' ? 'text-slate-900' : 'text-white'}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {tool === 'pen' && (
            <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
          )}

          {/* Stroke Widths */}
          <div className="flex items-center gap-0.5 bg-black/10 dark:bg-white/10 p-0.5 rounded-xl">
            {WIDTH_PRESETS.map((wp) => {
              const isSelected = strokeWidth === wp.size
              return (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setStrokeWidth(wp.size)}
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center transition-all
                    ${
                      isSelected
                        ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }
                  `}
                  title={`Толщина: ${wp.label}`}
                >
                  <span
                    className={`rounded-full ${wp.dotSize} ${
                      tool === 'pen' ? 'bg-current' : 'bg-slate-300'
                    }`}
                    style={{ backgroundColor: tool === 'pen' ? selectedColor : undefined }}
                  />
                </button>
              )
            })}
          </div>

          <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

          {/* Actions: Undo & Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                ${
                  strokes.length > 0
                    ? theme === 'dark'
                      ? 'text-slate-300 hover:bg-white/15 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-200'
                    : 'text-slate-500/40 cursor-not-allowed'
                }
              `}
              title="Отменить последний штрих"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={strokes.length === 0}
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                ${
                  strokes.length > 0
                    ? 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300'
                    : 'text-slate-500/40 cursor-not-allowed'
                }
              `}
              title="Очистить весь холст"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Toggle layout button between left and bottom */}
          {onTogglePosition && (
            <>
              <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
              <button
                type="button"
                onClick={onTogglePosition}
                className={`
                  w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                  ${
                    theme === 'dark'
                      ? 'text-slate-400 hover:bg-white/15 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }
                `}
                title={position === 'left' ? 'Переместить панель под панель управления' : 'Переместить панель слева от управления'}
              >
                {position === 'left' ? <Rows2 size={14} /> : <Columns2 size={14} />}
              </button>
            </>
          )}

          <div className={`w-px h-4 mx-0.5 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

          {/* Close / Finish Drawing button */}
          <button
            type="button"
            onClick={onClose}
            className={`
              px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors
              ${
                theme === 'dark'
                  ? 'hover:bg-white/15 text-slate-300 hover:text-white'
                  : 'hover:bg-slate-200 text-slate-700'
              }
            `}
            title="Завершить рисование (Скрыть панель)"
          >
            <X size={13} />
            <span>Скрыть</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <div
        ref={containerRef}
        className={`absolute inset-0 z-30 transition-opacity duration-200 ${
          isActive ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* HTML5 Canvas overlay */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-full h-full block ${
            isActive
              ? tool === 'pen'
                ? 'cursor-crosshair'
                : 'cursor-cell'
              : 'pointer-events-none'
          }`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Floating Toolbar rendered via Portal */}
      {typeof document !== 'undefined' &&
        (toolbarAnchor
          ? createPortal(toolbarContent, toolbarAnchor)
          : createPortal(
              <div className="fixed top-16 right-6 z-[60]">
                {toolbarContent}
              </div>,
              document.body
            ))}
    </>
  )
}
