import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 36, className = '' }: LogoProps) {
  const [imgError, setImgError] = useState(false)

  if (imgError) {
    return (
      <div
        className={`rounded-xl bg-[#4F8CFF] flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <Sparkles style={{ width: size * 0.55, height: size * 0.55 }} className="text-white" />
      </div>
    )
  }

  return (
    <img
      src="/mog.png"
      alt="GetMog"
      className={`rounded-xl object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size }}
      draggable={false}
      onError={() => setImgError(true)}
    />
  )
}
