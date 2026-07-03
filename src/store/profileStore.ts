import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileState {
  avatarUrl: string | null
  uploading: boolean
  setAvatarUrl: (url: string | null) => void
  uploadAvatar: (file: File, userId: string) => Promise<void>
  loadAvatar: (userId: string) => Promise<void>
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      avatarUrl: null,
      uploading: false,

      setAvatarUrl: (url) => set({ avatarUrl: url }),

      // Store avatar as base64 in localStorage AND Firestore for cross-device sync
      uploadAvatar: async (file: File, userId: string) => {
        set({ uploading: true })
        try {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          set({ avatarUrl: base64, uploading: false })
          // Save to Firestore for cross-device sync
          try {
            const { setDoc, doc } = await import('firebase/firestore')
            const { db } = await import('./firebase')
            await setDoc(doc(db, 'users', userId), { avatarUrl: base64 }, { merge: true })
          } catch { /* ignore if Firestore fails */ }
        } catch {
          set({ uploading: false })
        }
      },

      // No-op since we store locally
      loadAvatar: async (_userId: string) => {},
    }),
    {
      name: 'faceiq-profile',
      partialize: (state) => ({ avatarUrl: state.avatarUrl }),
    }
  )
)
