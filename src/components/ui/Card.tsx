import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  glow?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ children, hover = false, glow = false, padding = 'md', className, ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  const content = (
    <div
      className={cn(
        'bg-[#181818] border border-white/[0.06] rounded-2xl',
        paddings[padding],
        glow && 'shadow-lg shadow-blue-500/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        transition={{ duration: 0.2 }}
        className={cn(
          'bg-[#181818] border border-white/[0.06] rounded-2xl transition-colors hover:border-white/10',
          paddings[padding],
          glow && 'shadow-lg shadow-blue-500/5',
          className
        )}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }

  return content
}
