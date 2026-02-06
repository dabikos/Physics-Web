import { cn } from '@/lib/utils'

interface SliderProps {
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (value: number) => void
  className?: string
}

export function Slider({ min = 1, max = 40, step = 1, value, onChange, className }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100
  
  return (
    <div className={cn('relative w-full h-3 bg-white/10 rounded-full cursor-pointer', className)}>
      <div
        className="absolute h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-150"
        style={{ width: `${percentage}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg shadow-primary-500/50 transition-all duration-150 pointer-events-none"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  )
}
