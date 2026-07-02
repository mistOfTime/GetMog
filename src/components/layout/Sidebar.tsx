import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Upload, BarChart3, MessageSquare,
  TrendingUp, Settings, LogOut,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload & Analyze' },
  { to: '/analysis', icon: BarChart3, label: 'My Analysis' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/chat', icon: MessageSquare, label: 'True Adam' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, setUser } = useAuthStore()
  const { avatarUrl } = useProfileStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
    navigate('/')
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen bg-[#0d0d0d] border-r border-white/[0.06] sticky top-0 z-30 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.05]">
        <Logo size={32} className="flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-base font-bold text-white whitespace-nowrap overflow-hidden"
            >
              GetMog
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#4F8CFF]/15 text-[#4F8CFF]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[#4F8CFF]')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/[0.05] space-y-1">
        {/* Avatar + name — click goes to settings */}
          <button
            onClick={() => navigate('/settings')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group',
              collapsed ? 'justify-center' : ''
            )}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#4F8CFF]/20 border-2 border-[#4F8CFF]/30 group-hover:border-[#4F8CFF] flex items-center justify-center overflow-hidden transition-colors">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-[#4F8CFF]">{initials}</span>
                )}
              </div>
            </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden text-left"
              >
                <p className="text-xs font-semibold text-white whitespace-nowrap group-hover:text-white/90">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-[11px] text-white/30 truncate max-w-[140px]">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Hidden file input — removed, upload is in Settings only */}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
