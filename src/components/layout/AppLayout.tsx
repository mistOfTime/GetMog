import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { MobileHeader } from './MobileHeader'
import { motion } from 'framer-motion'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#080808]">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <MobileHeader />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 px-4 sm:px-6 py-4 pb-24 md:pb-8 max-w-5xl w-full mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
      <MobileNav />
    </div>
  )
}
