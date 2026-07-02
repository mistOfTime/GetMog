import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { User, Mail, Lock, AtSign, Chrome } from 'lucide-react'
import { motion } from 'framer-motion'

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Lowercase, numbers and underscores only'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, 'You must agree to the terms'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      await updateProfile(cred.user, { displayName: data.fullName })
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        createdAt: new Date().toISOString(),
      })
      setUser(cred.user)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Something went wrong')
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Full Name"
          placeholder="John Doe"
          icon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Username"
          placeholder="john_doe"
          icon={<AtSign className="w-4 h-4" />}
          error={errors.username?.message}
          {...register('username')}
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        placeholder="hello@example.com"
        icon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          className="mt-0.5 w-4 h-4 rounded border border-white/20 bg-white/5 accent-[#4F8CFF] cursor-pointer"
          {...register('terms')}
        />
        <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors leading-relaxed">
          I agree to the{' '}
          <span className="text-[#4F8CFF] hover:underline cursor-pointer">Terms of Service</span>{' '}
          and{' '}
          <span className="text-[#4F8CFF] hover:underline cursor-pointer">Privacy Policy</span>
        </span>
      </label>
      {errors.terms && <p className="text-xs text-red-400 -mt-2">{errors.terms.message}</p>}

      <Button type="submit" className="w-full mt-1" loading={loading} size="lg">
        Create Account
      </Button>

      <div className="flex items-center gap-3 my-1">
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
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5c-.3.45-.65.85-1.05 1.2-.4.35-.85.65-1.35.85-.5.2-1.05.3-1.6.3-.55 0-1.1-.1-1.6-.3-.5-.2-.95-.5-1.35-.85-.4-.35-.75-.75-1.05-1.2-.3-.45-.5-.95-.6-1.5H6.5v-2h1.5c.1-.55.3-1.05.6-1.5.3-.45.65-.85 1.05-1.2.4-.35.85-.65 1.35-.85.5-.2 1.05-.3 1.6-.3.55 0 1.1.1 1.6.3.5.2.95.5 1.35.85.4.35.75.75 1.05 1.2.3.45.5.95.6 1.5H17.5v2h-1.4c-.1.55-.3 1.05-.6 1.5z" />
            </svg>
          }
        >
          Apple
        </Button>
      </div>
    </form>
  )
}
