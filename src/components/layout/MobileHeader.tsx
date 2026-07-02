import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { Logo } from '@/components/ui/Logo'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload & Analyze',
  '/analysis': 'My Analysis',
  '/progress': 'Progress',
  '/chat': 'True Adam Assistant',
  '/settings': 'Settings',
}

export function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { avatarUrl } = useProfileStore()
  const title = titles[location.pathname] || 'GetMog'
  const showBack = location.pathname !== '/dashboard'

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="md:hidden sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-xl border-b border-white/[0.05] px-4 py-3 flex items-center gap-3">
      {showBack ? (
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white/60" />
        </button>
      ) : (
        <Logo size={32} />
      )}

      <span className="flex-1 text-base font-semibold text-white">{title}</span>

      {/* Avatar — click navigates to Settings */}
      <button
        onClick={() => navigate('/settings')}
        className="w-8 h-8 rounded-full bg-[#4F8CFF]/20 border-2 border-[#4F8CFF]/30 overflow-hidden flex items-center justify-center hover:border-[#4F8CFF] transition-colors active:scale-95"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-[#4F8CFF]">{initials}</span>
        )}
      </button>
    </header>
  )
}
