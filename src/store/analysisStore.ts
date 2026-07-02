import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FacialAnalysisResult } from '@/lib/gemini'

export interface AnalysisRecord {
  id: string
  date: string
  images: string[]
  result: FacialAnalysisResult
}

interface AnalysisState {
  currentAnalysis: FacialAnalysisResult | null
  analysisHistory: AnalysisRecord[]
  isAnalyzing: boolean
  uploadedImages: File[]
  setCurrentAnalysis: (result: FacialAnalysisResult | null) => void
  addToHistory: (record: AnalysisRecord) => void
  setAnalyzing: (v: boolean) => void
  setUploadedImages: (files: File[]) => void
  clearCurrent: () => void
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentAnalysis: null,
      analysisHistory: [],
      isAnalyzing: false,
      uploadedImages: [],
      setCurrentAnalysis: (result) => set({ currentAnalysis: result }),
      addToHistory: (record) =>
        set((state) => ({
          analysisHistory: [record, ...state.analysisHistory].slice(0, 20),
        })),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      setUploadedImages: (files) => set({ uploadedImages: files }),
      clearCurrent: () => set({ currentAnalysis: null, uploadedImages: [] }),
    }),
    {
      name: 'faceiq-analysis-v4',  // new key = fresh start, old data ignored
      partialize: (state) => ({
        currentAnalysis: state.currentAnalysis,
        analysisHistory: state.analysisHistory,
      }),
    }
  )
)
