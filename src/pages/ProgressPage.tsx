import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAnalysisStore } from '@/store/analysisStore'
import { Card } from '@/components/ui/Card'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { Upload, TrendingUp, Calendar, Trophy, Star, Zap } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function ProgressPage() {
  const { analysisHistory } = useAnalysisStore()
  const navigate = useNavigate()
  const [compareIndex, setCompareIndex] = useState(0)

  if (!analysisHistory.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-[#4F8CFF]/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <TrendingUp className="w-10 h-10 text-[#4F8CFF]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Progress Data Yet</h2>
        <p className="text-white/40 text-sm mb-6 max-w-xs">Complete your first analysis to start tracking progress.</p>
        <Button onClick={() => navigate('/upload')} icon={<Upload className="w-4 h-4" />}>Start Analysis</Button>
      </div>
    )
  }

  const chartData = [...analysisHistory].reverse().map((r) => ({
    name: r.date.split(',')[0],
    score: r.result.presentationScore,
    potential: r.result.potentialScore,
    symmetry: r.result.facialSymmetryScore || 0,
    grooming: r.result.overallGrooming?.score || 0,
  }))

  const latest = analysisHistory[0]
  const previous = analysisHistory[Math.min(compareIndex + 1, analysisHistory.length - 1)]
  const best = analysisHistory.reduce((max, r) => r.result.presentationScore > max.result.presentationScore ? r : max, analysisHistory[0])
  const improvement = analysisHistory.length > 1 ? latest.result.presentationScore - analysisHistory[analysisHistory.length - 1].result.presentationScore : null

  const radarData = [
    { subject: 'Symmetry', current: latest.result.facialSymmetryScore || 0, previous: previous?.result.facialSymmetryScore || 0 },
    { subject: 'Grooming', current: latest.result.overallGrooming?.score || 0, previous: previous?.result.overallGrooming?.score || 0 },
    { subject: 'Skin', current: latest.result.skinAppearance?.score || 0, previous: previous?.result.skinAppearance?.score || 0 },
    { subject: 'Hair', current: latest.result.hairAnalysis?.score || 0, previous: previous?.result.hairAnalysis?.score || 0 },
    { subject: 'Jawline', current: latest.result.jawlineAnalysis?.score || 0, previous: previous?.result.jawlineAnalysis?.score || 0 },
    { subject: 'Harmony', current: latest.result.facialHarmonyScore || 0, previous: previous?.result.facialHarmonyScore || 0 },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-white/40 text-sm mt-1">{analysisHistory.length} analysis session{analysisHistory.length > 1 ? 's' : ''}</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Analyses', value: analysisHistory.length, icon: Calendar, color: '#4F8CFF' },
          { label: 'Best Score', value: best?.result.presentationScore, icon: Trophy, color: '#fbbf24' },
          { label: 'Latest', value: latest?.result.presentationScore, icon: TrendingUp, color: '#34d399' },
          { label: 'Overall Gain', value: improvement !== null ? `${improvement > 0 ? '+' : ''}${improvement}` : 'N/A', icon: Zap, color: improvement && improvement > 0 ? '#34d399' : '#f87171' },
        ].map(s => (
          <Card key={s.label} padding="md">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Score trend chart */}
      {chartData.length > 1 && (
        <motion.div variants={item}>
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-white mb-4">Score Trend</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }} />
                <Line type="monotone" dataKey="score" stroke="#4F8CFF" strokeWidth={2} dot={{ fill: '#4F8CFF', r: 3 }} name="Presentation" />
                <Line type="monotone" dataKey="potential" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} name="Potential" />
                <Line type="monotone" dataKey="grooming" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Grooming" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Before/After Radar */}
      {analysisHistory.length > 1 && (
        <motion.div variants={item}>
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Before vs After</h2>
              <select
                value={compareIndex}
                onChange={e => setCompareIndex(Number(e.target.value))}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/60"
              >
                {analysisHistory.slice(1).map((r, i) => (
                  <option key={i} value={i} className="bg-[#181818]">vs Session {analysisHistory.length - i - 1}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Latest" dataKey="current" stroke="#4F8CFF" fill="#4F8CFF" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Previous" dataKey="previous" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* History list */}
      <motion.div variants={item}>
        <h2 className="text-sm font-semibold text-white mb-3">History</h2>
        <div className="space-y-2">
          {analysisHistory.map((record, idx) => (
            <Card key={record.id} padding="md" hover>
              <div className="flex items-center gap-4">
                <ScoreRing score={record.result.presentationScore} size={56} strokeWidth={5} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white">Session #{analysisHistory.length - idx}</p>
                    {idx === 0 && <span className="px-1.5 py-0.5 bg-[#4F8CFF]/15 text-[#4F8CFF] text-[10px] font-semibold rounded-full">Latest</span>}
                  </div>
                  <p className="text-xs text-white/30">{record.date}</p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-white/40">Potential: <span className="text-white/60">{record.result.potentialScore}</span></span>
                    <span className="text-xs text-white/40">Symmetry: <span className="text-white/60">{record.result.facialSymmetryScore || 'N/A'}</span></span>
                  </div>
                </div>
                {idx > 0 && (() => {
                  const diff = record.result.presentationScore - analysisHistory[idx - 1].result.presentationScore
                  return diff !== 0 ? (
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: diff > 0 ? '#34d399' : '#f87171' }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  ) : null
                })()}
              </div>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
