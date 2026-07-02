import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { Star, Eye, Zap, Shield } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

type ModalView = 'signup' | 'signin' | 'forgot'

export function LandingPage() {
  const [view, setView] = useState<ModalView>('signup')

  return (
    <div className="min-h-screen bg-[#080808] relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#4F8CFF]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-500/6 rounded-full blur-3xl" />
      </div>

      {/* Blurred BG content — decorative only */}
      <div className="blur-md brightness-50 pointer-events-none select-none absolute inset-0">
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 rounded-full px-4 py-1.5 mb-8">
            <Star className="w-3.5 h-3.5 text-[#4F8CFF]" />
            <span className="text-xs font-medium text-[#4F8CFF]">Smart Facial Analysis</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
            Discover Your<br />
            <span className="text-[#4F8CFF]">Facial Potential</span>
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10">
            Professional-grade AI analysis for grooming, style, and presentation.
          </p>
          <div className="flex items-center justify-center gap-4 mb-20">
            <div className="bg-[#4F8CFF] text-white font-semibold rounded-xl px-7 py-3.5">Get Started Free</div>
            <div className="bg-white/5 border border-white/10 text-white rounded-xl px-7 py-3.5">Sign In</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Eye, title: 'Deep Analysis', desc: '15+ facial feature categories' },
              { icon: Zap, title: 'Instant Results', desc: 'Analysis in under 30 seconds' },
              { icon: Shield, title: 'Private & Secure', desc: 'Photos never shared' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#181818] border border-white/[0.06] rounded-2xl p-5 text-left">
                <div className="w-10 h-10 bg-[#4F8CFF]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#4F8CFF]" />
                </div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-white/40">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL — always on top, always interactive ── */}
      <div className="relative z-50 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#0e0e0e]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/80">

            {/* Logo + heading */}
            <div className="px-8 pt-8 pb-5 text-center border-b border-white/[0.05]">
              <div className="inline-flex items-center gap-2.5 mb-5">
                <Logo size={36} />
                <span className="text-xl font-bold text-white tracking-tight">GetMog</span>
              </div>

              <AnimatePresence mode="wait">
                {view === 'signup' && (
                  <motion.div key="sh" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                    <h2 className="text-2xl font-bold text-white mb-1.5">Discover Your Potential</h2>
                    <p className="text-sm text-white/45 leading-relaxed max-w-xs mx-auto">
                      Personalized grooming, style, and presentation recommendations — built to help you look your best.
                    </p>
                  </motion.div>
                )}
                {view === 'signin' && (
                  <motion.div key="ih" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                    <h2 className="text-2xl font-bold text-white mb-1.5">Welcome back</h2>
                    <p className="text-sm text-white/45">Sign in to continue your journey.</p>
                  </motion.div>
                )}
                {view === 'forgot' && (
                  <motion.div key="fh" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                    <h2 className="text-2xl font-bold text-white mb-1.5">Reset Password</h2>
                    <p className="text-sm text-white/45">Enter your email to get a reset link.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Form */}
            <div className="px-8 py-6">
              <AnimatePresence mode="wait">
                {view === 'signup' && (
                  <motion.div key="sf" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                    <SignUpForm onSuccess={() => {}} />
                  </motion.div>
                )}
                {view === 'signin' && (
                  <motion.div key="if" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                    <SignInForm onForgot={() => setView('forgot')} onSuccess={() => {}} />
                  </motion.div>
                )}
                {view === 'forgot' && (
                  <motion.div key="ff" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
                    <ForgotPasswordForm onBack={() => setView('signin')} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 pb-7 text-center">
              {view === 'signup' && (
                <p className="text-sm text-white/40">
                  Already have an account?{' '}
                  <button onClick={() => setView('signin')} className="text-[#4F8CFF] hover:text-[#6BA3FF] font-medium transition-colors">
                    Sign In
                  </button>
                </p>
              )}
              {view === 'signin' && (
                <p className="text-sm text-white/40">
                  Don't have an account?{' '}
                  <button onClick={() => setView('signup')} className="text-[#4F8CFF] hover:text-[#6BA3FF] font-medium transition-colors">
                    Create one
                  </button>
                </p>
              )}
              {view === 'forgot' && (
                <button onClick={() => setView('signin')} className="text-sm text-[#4F8CFF] hover:text-[#6BA3FF] font-medium transition-colors">
                  ← Back to Sign In
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
