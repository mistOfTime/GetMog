import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
  authModal: 'signin' | 'signup' | 'forgot' | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setAuthModal: (mode: 'signin' | 'signup' | 'forgot' | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      authModal: null,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setAuthModal: (authModal) => set({ authModal }),
    }),
    {
      name: 'faceiq-auth',
      partialize: (state) => ({ authModal: state.authModal }),
    }
  )
)
