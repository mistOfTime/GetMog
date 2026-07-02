import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, Chrome } from 'lucide-react'
import { motion } from 'framer-motion'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export function SignInForm({ onForgot, onSuccess }: { onForgot?: () => void; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser, setAuthModal } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password)
      setUser(cred.user)
      onSuccess?.()
    } catch (err: any) {
      const msg = err.code
      if (msg === 'auth/user-not-found' || msg === 'auth/wrong-password' || msg === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else {
        setError(err.message?.replace('Firebase: ', '') || 'Sign in failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      setUser(cred.user)
      onSuccess?.()
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="hello@example.com"
        icon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        icon={<Lock className="w-4 h-4" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border border-white/20 bg-white/5 accent-[#4F8CFF]"
            {...register('rememberMe')}
          />
          <span className="text-xs text-white/40">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => onForgot ? onForgot() : setAuthModal('forgot')}
          className="text-xs text-[#4F8CFF] hover:text-[#6BA3FF] transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" loading={loading} size="lg">
        Sign In
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-white/25 font-medium">OR</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleGoogle}
          loading={googleLoading}
          icon={<Chrome className="w-4 h-4" />}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.24.82 3.01.82.76 0 2.2-.97 3.71-.83 1.32.12 2.56.7 3.37 1.93-3.27 1.97-2.69 6.14.47 7.52-.47 1.28-1.1 2.52-2.56 3.44zM12 7.32C11.82 5.02 13.7 3.12 15.88 3c.26 2.45-2.22 4.39-3.88 4.32z" />
            </svg>
          }
        >
          Apple
        </Button>
      </div>
    </form>
  )
}
