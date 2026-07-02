import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Upload, BarChart3, MessageSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/chat', icon: MessageSquare, label: 'Adam' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex-1"
          >
            {({ isActive }) => (
              <div className={cn(
                'flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all relative',
                isActive ? 'text-[#4F8CFF]' : 'text-white/35'
              )}>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-[#4F8CFF]/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-[10px] font-medium relative z-10 leading-none">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
