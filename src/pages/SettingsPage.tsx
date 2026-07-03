import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile, updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useAnalysisStore } from '@/store/analysisStore'
import { useProfileStore } from '@/store/profileStore'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { User, Bell, Shield, Trash2, Key, CheckCircle, Plus, Camera, LogOut } from 'lucide-react'

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name too short'),
})
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { clearCurrent } = useAnalysisStore()
  const { avatarUrl, setAvatarUrl, uploadAvatar, uploading } = useProfileStore()
  const navigate = useNavigate()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [error, setError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    // Show local preview instantly
    const localUrl = URL.createObjectURL(file)
    setAvatarUrl(localUrl)
    // Upload to Firebase in background for cross-device sync
    await uploadAvatar(file, user.uid)
    e.target.value = ''
  }

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.displayName || '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onUpdateProfile = async (data: ProfileForm) => {
    if (!auth.currentUser) return
    await updateProfile(auth.currentUser, { displayName: data.displayName })
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 3000)
  }

  const onUpdatePassword = async (data: PasswordForm) => {
    if (!auth.currentUser || !user?.email) return
    setError('')
    try {
      const cred = EmailAuthProvider.credential(user.email, data.currentPassword)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, data.newPassword)
      setPasswordSuccess(true)
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setError('Current password is incorrect')
    }
  }

  const onDeleteAccount = async () => {
    if (!auth.currentUser) return
    try {
      await deleteUser(auth.currentUser)
      clearCurrent()
      setUser(null)
      navigate('/')
    } catch {
      setError('Please sign in again before deleting your account.')
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and preferences.</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item}>
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-[#4F8CFF]/10 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-[#4F8CFF]" />
            </div>
            <h2 className="text-sm font-semibold text-white">Profile</h2>
          </div>

          <div className="flex items-center gap-4 mb-5 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            {/* Clickable avatar with + icon */}
            <div className="relative flex-shrink-0 cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-16 h-16 rounded-full bg-[#4F8CFF]/20 border-2 border-[#4F8CFF]/30 group-hover:border-[#4F8CFF] transition-colors overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[#4F8CFF]">{initials}</span>
                )}
              </div>
              {/* Overlay on hover or uploading */}
              <div className={`absolute inset-0 rounded-full bg-black/50 transition-opacity flex items-center justify-center ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
              {/* + badge */}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#4F8CFF] rounded-full flex items-center justify-center border-2 border-[#181818]">
                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>

            <div>
              <p className="font-semibold text-white">{user?.displayName || 'User'}</p>
              <p className="text-sm text-white/40">{user?.email}</p>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-[#4F8CFF] hover:text-[#6BA3FF] transition-colors mt-1"
              >
                {uploading ? 'Uploading...' : 'Change photo'}
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <Input
              label="Display Name"
              placeholder="Your name"
              error={profileForm.formState.errors.displayName?.message}
              {...profileForm.register('displayName')}
            />
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              className="opacity-50 cursor-not-allowed"
            />
            <div className="flex items-center gap-3">
              <Button type="submit" loading={profileForm.formState.isSubmitting}>
                Save Changes
              </Button>
              {profileSuccess && (
                <div className="flex items-center gap-1.5 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </div>
              )}
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Password */}
      <motion.div variants={item}>
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Change Password</h2>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" variant="secondary" loading={passwordForm.formState.isSubmitting}>
                Update Password
              </Button>
              {passwordSuccess && (
                <div className="flex items-center gap-1.5 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Updated
                </div>
              )}
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item}>
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Weekly progress summaries', desc: 'Get a weekly email with your progress' },
              { label: 'New recommendations', desc: 'When AI has new tips for you' },
              { label: 'Streak reminders', desc: 'Stay on track with monthly check-ins' },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-white/80">{n.label}</p>
                  <p className="text-xs text-white/30">{n.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-10 h-5 bg-white/10 peer-checked:bg-[#4F8CFF] rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Privacy */}
      <motion.div variants={item}>
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Privacy</h2>
          </div>
          <div className="space-y-3 text-sm text-white/50 leading-relaxed">
            <p>Your photos are processed securely and never shared with third parties.</p>
            <p>Analysis data is stored privately under your account and can be deleted at any time.</p>
            <p>We use Google Gemini AI to process your images. Images are sent to Google's API for analysis only.</p>
          </div>
        </Card>
      </motion.div>

      {/* Sign Out — visible on mobile only */}
      <motion.div variants={item} className="md:hidden">
        <Card padding="md">
          <button
            onClick={async () => { await signOut(auth); setUser(null); navigate('/') }}
            className="w-full flex items-center gap-3 py-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </Card>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={item}>
        <Card padding="lg" className="border-red-500/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Danger Zone</h2>
          </div>
          <p className="text-sm text-white/40 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!deleteConfirm ? (
            <Button variant="danger" onClick={() => setDeleteConfirm(true)}>
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-400 font-medium">Are you absolutely sure?</p>
              <div className="flex gap-3">
                <Button variant="danger" onClick={onDeleteAccount}>
                  Yes, Delete Everything
                </Button>
                <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
