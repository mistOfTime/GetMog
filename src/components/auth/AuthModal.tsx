import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Logo } from '@/components/ui/Logo'

export function AuthModal() {
  const { authModal, setAuthModal } = useAuthStore()

  if (authModal === null) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4F8CFF]/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl"
        />
      </div>

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md my-auto"
      >
        <div className="bg-[#0e0e0e] border border-white/10 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/[0.05]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2.5 mb-5"
            >
              <Logo size={36} />
              <span className="text-xl font-bold text-white tracking-tight">GetMog</span>
            </motion.div>

            <AnimatePresence mode="wait">
              {authModal === 'signup' && (
                <motion.div
                  key="signup-header"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-2xl font-bold text-white mb-2">Discover Your Potential</h1>
                  <p className="text-sm text-white/45 leading-relaxed max-w-xs mx-auto">
                    Personalized grooming, style, and presentation recommendations — built to help you look your best.
                  </p>
                </motion.div>
              )}
              {authModal === 'signin' && (
                <motion.div
                  key="signin-header"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
                  <p className="text-sm text-white/45">Sign in to continue your journey.</p>
                </motion.div>
              )}
              {authModal === 'forgot' && (
                <motion.div
                  key="forgot-header"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                  <p className="text-sm text-white/45">
                    Enter your email and we'll send a secure reset link.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form body */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              {authModal === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignUpForm />
                </motion.div>
              )}
              {authModal === 'signin' && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignInForm />
                </motion.div>
              )}
              {authModal === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ForgotPasswordForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer toggle */}
          <div className="px-8 pb-7 text-center">
            {authModal === 'signup' && (
              <p className="text-sm text-white/40">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthModal('signin')}
                  className="text-[#4F8CFF] hover:text-[#6BA3FF] font-medium transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
            {authModal === 'signin' && (
              <p className="text-sm text-white/40">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setAuthModal('signup')}
                  className="text-[#4F8CFF] hover:text-[#6BA3FF] font-medium transition-colors cursor-pointer"
                >
                  Create one
                </button>
              </p>
            )}
            {authModal === 'forgot' && (
              <button
                onClick={() => setAuthModal('signin')}
                className="text-sm text-[#4F8CFF] hover:text-[#6BA3FF] font-medium transition-colors cursor-pointer"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
