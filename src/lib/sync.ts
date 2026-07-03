import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { FacialAnalysisResult } from './gemini'

export interface AnalysisRecord {
  id: string
  date: string
  images: string[]
  result: FacialAnalysisResult
}

// Save analysis to Firestore
export async function saveAnalysisToCloud(
  userId: string,
  currentAnalysis: FacialAnalysisResult,
  history: AnalysisRecord[],
  avatarUrl: string | null
) {
  try {
    await setDoc(doc(db, 'users', userId), {
      currentAnalysis,
      // Only save last 10 history items (Firestore has 1MB doc limit)
      analysisHistory: history.slice(0, 10).map(r => ({
        ...r,
        images: [], // Don't store base64 images in Firestore
      })),
      avatarUrl: avatarUrl || null,
      updatedAt: new Date().toISOString(),
    }, { merge: true })
  } catch (err) {
    console.warn('Failed to sync to cloud:', err)
  }
}

// Load analysis from Firestore
export async function loadAnalysisFromCloud(userId: string): Promise<{
  currentAnalysis: FacialAnalysisResult | null
  analysisHistory: AnalysisRecord[]
  avatarUrl: string | null
} | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      currentAnalysis: data.currentAnalysis || null,
      analysisHistory: data.analysisHistory || [],
      avatarUrl: data.avatarUrl || null,
    }
  } catch (err) {
    console.warn('Failed to load from cloud:', err)
    return null
  }
}
