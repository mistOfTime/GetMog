import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { useAnalysisStore } from '@/store/analysisStore'
import { loadAnalysisFromCloud } from '@/lib/sync'

import { LandingPage } from '@/pages/LandingPage'
import { Dashboard } from '@/pages/Dashboard'
import { UploadPage } from '@/pages/UploadPage'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { ChatPage } from '@/pages/ChatPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AppLayout } from '@/components/layout/AppLayout'

export default function App() {
  const { user, setUser, setLoading } = useAuthStore()
  const { setAvatarUrl } = useProfileStore()
  const { setCurrentAnalysis, addToHistory, currentAnalysis } = useAnalysisStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      setChecked(true)

      if (u) {
        // Load synced data from Firestore on login
        const cloud = await loadAnalysisFromCloud(u.uid)
        if (cloud) {
          if (cloud.avatarUrl) setAvatarUrl(cloud.avatarUrl)
          if (cloud.currentAnalysis) setCurrentAnalysis(cloud.currentAnalysis)
          if (cloud.analysisHistory?.length) {
            cloud.analysisHistory.forEach(r => addToHistory(r))
          }
        } else {
          // First time syncing — push local data to cloud
          const { currentAnalysis: localAnalysis, analysisHistory: localHistory } = useAnalysisStore.getState()
          const { avatarUrl: localAvatar } = useProfileStore.getState()
          if (localAnalysis) {
            const { saveAnalysisToCloud } = await import('@/lib/sync')
            saveAnalysisToCloud(u.uid, localAnalysis, localHistory, localAvatar)
          }
        }
      }
    })
    return unsub
  }, [])

  // Still checking auth state — show spinner
  if (!checked) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* If user is logged in, redirect / to /dashboard */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />

      {/* Protected app routes */}
      {user ? (
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  )
}
