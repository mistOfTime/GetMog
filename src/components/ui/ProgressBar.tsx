import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label?: string
  showValue?: boolean
  color?: string
  className?: string
  size?: 'sm' | 'md'
}

function getColor(value: number) {
  if (value >= 80) return '#4ade80'
  if (value >= 65) return '#86efac'
  if (value >= 50) return '#fbbf24'
  if (value >= 35) return '#fb923c'
  return '#f87171'
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  color,
  className,
  size = 'md',
}: ProgressBarProps) {
  const barColor = color || getColor(value)
  const height = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-white/50">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold" style={{ color: barColor }}>
              {value}
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-white/5 rounded-full overflow-hidden', height)}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  )
}
