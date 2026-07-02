import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalysisStore } from '@/store/analysisStore'
import { Card } from '@/components/ui/Card'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { SkeletonAnalysis } from '@/components/ui/Skeleton'
import {
  Upload, ChevronDown, ChevronUp, Sparkles, Palette,
  Download, Share2, Trophy, Target, Zap, Clock,
  Star, CheckCircle, AlertCircle, TrendingUp, Eye,
  Smile, Scissors, Sun, Camera
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import type { AnalysisSection, FacialAnalysisResult, LooksmaxRoadmapItem } from '@/lib/gemini'
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { generatePDF } from '@/lib/exportPdf'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

function effortColor(effort: string) {
  if (effort === 'Low') return '#4ade80'
  if (effort === 'Medium') return '#fbbf24'
  return '#f87171'
}

function SectionCard({ section }: { section: AnalysisSection }) {
  const [expanded, setExpanded] = useState(false)
  if (!section?.label) return null
  return (
    <div className="bg-[#181818] border border-white/[0.06] rounded-2xl p-4 hover:border-white/10 transition-colors">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">{section.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">{section.confidence || 0}% conf</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
          </div>
        </div>
        <ProgressBar value={section.score || 0} showValue size="sm" />
        <p className="text-xs text-white/40 mt-1.5 line-clamp-1">{section.observation || '—'}</p>
      </button>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-2.5">
          <p className="text-xs text-white/50 leading-relaxed">{section.explanation || ''}</p>
          <div className="space-y-1">
            {(section.suggestions || []).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-[#4F8CFF] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/60">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RoadmapCard({ item: r, index }: { item: LooksmaxRoadmapItem, index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div variants={item}>
      <Card padding="md" hover>
        <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#4F8CFF]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#4F8CFF]">#{r.priority}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{r.area}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: effortColor(r.effort), backgroundColor: `${effortColor(r.effort)}15` }}>
                  {r.effort}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/30">{r.currentScore} →</span>
                <span className="text-xs font-bold text-[#4F8CFF]">{r.potentialScore}</span>
                <span className="text-xs text-white/30">• {r.timeframe}</span>
              </div>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />}
          </div>
          <ProgressBar value={r.currentScore} size="sm" showValue={false} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-white/[0.05] space-y-2.5 overflow-hidden"
            >
              <p className="text-xs text-[#4F8CFF] font-medium">{r.impact}</p>
              <div className="space-y-1.5">
                {r.steps?.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] text-white/40">{i + 1}</span>
                    </div>
                    <p className="text-xs text-white/60">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

type Tab = 'overview' | 'detailed' | 'roadmap' | 'recommendations'

export function AnalysisPage() {
  const { currentAnalysis, isAnalyzing } = useAnalysisStore()
  const { user } = useAuthStore()
  const { avatarUrl } = useProfileStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const exportPDF = async () => {
    if (!currentAnalysis) return
    setExporting(true)
    try {
      await generatePDF(
        currentAnalysis,
        user?.displayName || user?.email || 'User',
        avatarUrl || undefined
      )
    } catch (e) { console.error(e) }
    setExporting(false)
  }

  if (isAnalyzing) return <div className="space-y-6"><h1 className="text-2xl font-bold text-white">Analysis Results</h1><SkeletonAnalysis /></div>

  if (!currentAnalysis) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 mx-auto mb-5"><Logo size={80} /></div>
      <h2 className="text-xl font-bold text-white mb-2">No Analysis Yet</h2>
      <p className="text-white/40 text-sm mb-6 max-w-xs">Upload your photos to receive a full facial analysis and personalized recommendations.</p>
      <Button onClick={() => navigate('/upload')} icon={<Upload className="w-4 h-4" />}>Upload Photos</Button>
    </div>
  )

  const a = currentAnalysis
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Star },
    { id: 'detailed', label: 'Detailed', icon: Eye },
    { id: 'roadmap', label: 'Roadmap', icon: Target },
    { id: 'recommendations', label: 'Tips', icon: Zap },
  ]

  const radarData = {
    labels: ['Symmetry', 'Grooming', 'Skin', 'Hair', 'Jawline', 'Harmony'],
    datasets: [{
      label: 'Current',
      data: [
        a.facialSymmetryScore, a.overallGrooming?.score || 0,
        a.skinAppearance?.score || 0, a.hairAnalysis?.score || 0,
        a.jawlineAnalysis?.score || 0, a.facialHarmonyScore
      ],
      backgroundColor: 'rgba(79,140,255,0.15)',
      borderColor: '#4F8CFF',
      pointBackgroundColor: '#4F8CFF',
      borderWidth: 2,
    }, {
      label: 'Potential',
      data: [
        Math.min(a.facialSymmetryScore + 10, 100),
        Math.min((a.overallGrooming?.score || 0) + 15, 100),
        Math.min((a.skinAppearance?.score || 0) + 17, 100),
        Math.min((a.hairAnalysis?.score || 0) + 16, 100),
        Math.min((a.jawlineAnalysis?.score || 0) + 12, 100),
        Math.min(a.facialHarmonyScore + 11, 100)
      ],
      backgroundColor: 'rgba(167,139,250,0.1)',
      borderColor: '#a78bfa',
      pointBackgroundColor: '#a78bfa',
      borderWidth: 2,
      borderDash: [4, 4],
    }]
  }

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(255,255,255,0.06)' },
        pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
      }
    },
    plugins: { legend: { labels: { color: 'rgba(255,255,255,0.5)', boxWidth: 12, font: { size: 11 } } } }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Analysis Results</h1>
          <p className="text-white/40 text-sm mt-0.5">Your complete facial analysis report</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportPDF} loading={exporting} icon={<Download className="w-4 h-4" />}>PDF</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/upload')} icon={<Upload className="w-4 h-4" />}>Re-analyze</Button>
        </div>
      </motion.div>

      {/* Top scores */}
      <motion.div variants={item}>
        <Card padding="lg" glow>
          <div className="flex flex-wrap justify-around gap-4">
            <ScoreRing score={a.presentationScore} size={90} strokeWidth={7} label="Presentation" />
            <ScoreRing score={a.potentialScore} size={90} strokeWidth={7} color="#a78bfa" label="Potential" />
            <ScoreRing score={a.facialSymmetryScore} size={90} strokeWidth={7} color="#34d399" label="Symmetry" />
            <ScoreRing score={a.goldenRatioScore} size={90} strokeWidth={7} color="#fbbf24" label="Golden Ratio" />
            <ScoreRing score={a.photogenicScore} size={90} strokeWidth={7} color="#f472b6" label="Photogenic" />
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <div className="flex bg-white/5 rounded-xl p-1 gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#4F8CFF] text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Radar chart */}
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-white mb-4">Facial Analysis Radar</h3>
              <div className="max-w-xs mx-auto">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </Card>
            {/* Key metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Confidence', value: a.confidenceScore, color: '#4F8CFF' },
                { label: 'Professional', value: a.professionalScore, color: '#a78bfa' },
                { label: 'Harmony', value: a.facialHarmonyScore, color: '#34d399' },
                { label: 'Grooming', value: a.overallGrooming?.score || 0, color: '#fbbf24' },
                { label: 'Skin', value: a.skinAppearance?.score || 0, color: '#f472b6' },
                { label: 'Scan Score', value: a.analysisConfidence, color: '#60a5fa' },
              ].map(m => (
                <Card key={m.label} padding="sm">
                  <p className="text-xs text-white/40 mb-2">{m.label}</p>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl font-bold text-white">{m.value}</span>
                    <span className="text-xs" style={{ color: m.color }}>/100</span>
                  </div>
                  <ProgressBar value={m.value} size="sm" color={m.color} showValue={false} />
                </Card>
              ))}
            </div>
            {/* Face shape + geometry */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-white mb-3">Face Geometry</h3>
              <div className="space-y-3">
                {[a.faceShape, a.facialThirds, a.facialFifths, a.symmetryAnalysis, a.goldenRatioAnalysis].filter(Boolean).map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-white/60">{s.label}</span>
                      <span className="text-xs text-white/40">{s.observation}</span>
                    </div>
                    <ProgressBar value={s.score} size="sm" showValue={false} />
                  </div>
                ))}
              </div>
            </Card>
            {/* Priority improvements */}
            {a.priorityImprovements?.length > 0 && (
              <Card padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Priority Improvements</h3>
                </div>
                <div className="space-y-2">
                  {a.priorityImprovements.map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-white/60">{p}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Detailed tab */}
        {activeTab === 'detailed' && (
          <motion.div key="detailed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Photo quality */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">📸 Photo Quality</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[a.photoQuality, a.lightingQuality, a.blurDetection, a.facePosition].filter(s => s?.label && s?.score !== undefined).map(s => <SectionCard key={s.label} section={s} />)}
                {![a.photoQuality, a.lightingQuality, a.blurDetection, a.facePosition].some(s => s?.label) && (
                  <p className="text-sm text-white/30 col-span-2 py-4 text-center">Re-analyze to see photo quality data</p>
                )}
              </div>
            </div>
            {/* Skin */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">🧴 Skin Analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[a.skinAppearance, a.acneDetection, a.darkCircleDetection, a.wrinkleDetection].filter(s => s?.label && s?.score !== undefined).map(s => <SectionCard key={s.label} section={s} />)}
                {![a.skinAppearance, a.acneDetection, a.darkCircleDetection, a.wrinkleDetection].some(s => s?.label) && (
                  <p className="text-sm text-white/30 col-span-2 py-4 text-center">Re-analyze to see skin data</p>
                )}
              </div>
            </div>
            {/* Features */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">👁 Facial Features</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[a.eyeAnalysis, a.eyebrowAnalysis, a.noseAnalysis, a.lipAnalysis, a.smileAnalysis, a.jawlineAnalysis].filter(s => s?.label && s?.score !== undefined).map(s => <SectionCard key={s.label} section={s} />)}
                {![a.eyeAnalysis, a.eyebrowAnalysis, a.noseAnalysis, a.lipAnalysis].some(s => s?.label) && (
                  <p className="text-sm text-white/30 col-span-2 py-4 text-center">Re-analyze to see feature data</p>
                )}
              </div>
            </div>
            {/* Style */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">💈 Style & Grooming</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[a.hairAnalysis, a.hairlineAnalysis, a.hairStyleCompatibility, a.beardCompatibility, a.glassesCompatibility, a.overallGrooming, a.professionalAppearance, a.casualAppearance].filter(s => s?.label && s?.score !== undefined).map(s => <SectionCard key={s.label} section={s} />)}
              </div>
            </div>
            {/* Color palette */}
            {a.colorPalette && (
              <Card padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-[#4F8CFF]" />
                  <h3 className="text-sm font-semibold text-white">Color Palette</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-xs text-white/40 mb-2">Recommended</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.colorPalette.recommended?.map(c => <span key={c} className="px-2 py-1 bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 text-[#4F8CFF] rounded-full text-xs">{c}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-2">Avoid</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.colorPalette.avoid?.map(c => <span key={c} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs">{c}</span>)}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/40">{a.colorPalette.explanation}</p>
              </Card>
            )}
          </motion.div>
        )}

        {/* Roadmap tab */}
        {activeTab === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Potential summary */}
            <Card padding="lg" className="bg-gradient-to-r from-[#4F8CFF]/5 to-purple-500/5 border-[#4F8CFF]/15">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{a.estimatedPotentialScore}</p>
                  <p className="text-xs text-white/40">Est. Potential Score</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#4F8CFF]" />
                    <p className="text-sm font-semibold text-white">Your Glow-Up Potential</p>
                  </div>
                  <p className="text-xs text-white/50 mb-2">{a.estimatedTimeToImprove}</p>
                  <ProgressBar value={a.presentationScore} color="#4F8CFF" size="sm" showValue={false} />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-white/30">Now: {a.presentationScore}</span>
                    <span className="text-xs text-[#4F8CFF]">Potential: {a.estimatedPotentialScore}</span>
                  </div>
                </div>
              </div>
            </Card>
            {/* Roadmap items */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">🎯 Your Personalized Roadmap</p>
              <div className="space-y-2">
                {(a.looksmaxRoadmap || []).map((r, i) => <RoadmapCard key={i} item={r} index={i} />)}
              </div>
            </div>
            {/* Daily tips */}
            {a.dailyTips?.length > 0 && (
              <Card padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Daily Tips</h3>
                </div>
                <div className="space-y-2">
                  {a.dailyTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/60">{tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Recommendations tab */}
        {activeTab === 'recommendations' && (
          <motion.div key="recs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {[
              { label: '💇 Hairstyles', icon: Scissors, items: a.recommendations?.hairstyles },
              { label: '🧔 Beard Styles', icon: Sparkles, items: a.recommendations?.beardStyles },
              { label: '👓 Glasses', icon: Eye, items: a.recommendations?.glassesStyles },
              { label: '🎨 Hair Color', icon: Palette, items: a.recommendations?.hairColor },
              { label: '👕 Clothing Colors', icon: Star, items: a.recommendations?.clothingColors },
              { label: '🧴 Skincare Routine', icon: Sparkles, items: a.recommendations?.skincare },
              { label: '✂️ Grooming', icon: Scissors, items: a.recommendations?.grooming },
              { label: '📸 Pose Tips', icon: Camera, items: a.recommendations?.poseTips },
              { label: '💡 Lighting Tips', icon: Sun, items: a.recommendations?.lightingTips },
              { label: '📷 Camera Tips', icon: Camera, items: a.recommendations?.cameraTips },
            ].filter(c => c.items?.length).map(cat => (
              <Card key={cat.label} padding="md">
                <p className="text-sm font-semibold text-white mb-2.5">{cat.label}</p>
                <div className="space-y-2">
                  {cat.items?.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-white/60">{tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
