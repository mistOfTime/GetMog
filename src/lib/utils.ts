import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  if (hour < 21) return 'Good Evening'
  return 'Good Night'
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function scoreToLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Excellent', color: '#4ade80' }
  if (score >= 70) return { label: 'Good', color: '#86efac' }
  if (score >= 55) return { label: 'Average', color: '#fbbf24' }
  if (score >= 40) return { label: 'Fair', color: '#fb923c' }
  return { label: 'Needs Work', color: '#f87171' }
}

export function compressImage(file: File, maxSizeMB = 2): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      const maxDim = 1200
      let { width, height } = img

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim
          width = maxDim
        } else {
          width = (width / height) * maxDim
          height = maxDim
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressed = new File([blob], file.name, { type: 'image/jpeg' })
            if (compressed.size > maxSizeMB * 1024 * 1024) {
              canvas.toBlob(
                (b2) => {
                  resolve(b2 ? new File([b2], file.name, { type: 'image/jpeg' }) : file)
                },
                'image/jpeg',
                0.6
              )
            } else {
              resolve(compressed)
            }
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        0.8
      )
    }

    img.src = URL.createObjectURL(file)
  })
}
