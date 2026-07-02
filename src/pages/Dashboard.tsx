import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAnalysisStore } from '@/store/analysisStore'
import { getGreeting, scoreToLabel } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import {
  Upload, Camera, BarChart3, TrendingUp, MessageSquare,
  ChevronRight, Clock, ArrowUpRight
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { currentAnalysis, analysisHistory } = useAnalysisStore()
  const navigate = useNavigate()

  const firstName = user?.displayName?.split(' ')[0] || 'there'
  const greeting = getGreeting()

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Greeting */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-white/40 mt-1 text-sm">
          {currentAnalysis
            ? "Your latest analysis is ready. Here's your overview."
            : 'Ready to analyze your facial presentation today?'}
        </p>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Upload, label: 'Upload Photos', color: '#4F8CFF', bg: '#4F8CFF/10', to: '/upload' },
          { icon: Camera, label: 'Take Selfie', color: '#a78bfa', bg: 'purple-500/10', to: '/upload' },
          { icon: BarChart3, label: 'View Analysis', color: '#34d399', bg: 'emerald-500/10', to: '/analysis' },
          { icon: MessageSquare, label: 'True Adam', color: '#fb923c', bg: 'orange-500/10', to: '/chat' },
        ].map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(action.to)}
            className="bg-[#181818] border border-white/[0.06] rounded-2xl p-4 text-left hover:border-white/10 transition-colors group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${action.color}15` }}
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Scores */}
      {currentAnalysis ? (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="lg" glow>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-white/40 font-medium">Presentation Score</p>
                <p className="text-sm text-white/60 mt-0.5">
                  {scoreToLabel(currentAnalysis.presentationScore).label}
                </p>
              </div>
              <ScoreRing score={currentAnalysis.presentationScore} size={72} strokeWidth={6} />
            </div>
            <ProgressBar value={currentAnalysis.presentationScore} size="sm" />
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-white/40 font-medium">Potential Score</p>
                <p className="text-sm text-white/60 mt-0.5">
                  {scoreToLabel(currentAnalysis.potentialScore).label}
                </p>
              </div>
              <ScoreRing
                score={currentAnalysis.potentialScore}
                size={72}
                strokeWidth={6}
                color="#a78bfa"
              />
            </div>
            <ProgressBar value={currentAnalysis.potentialScore} size="sm" color="#a78bfa" />
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-white/40 font-medium">Analysis Confidence</p>
                <p className="text-sm text-white/60 mt-0.5">Scan Precision</p>
              </div>
              <ScoreRing
                score={currentAnalysis.analysisConfidence}
                size={72}
                strokeWidth={6}
                color="#34d399"
              />
            </div>
            <ProgressBar value={currentAnalysis.analysisConfidence} size="sm" color="#34d399" />
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <Card padding="lg" className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-4">
              <Logo size={64} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Analysis Yet</h3>
            <p className="text-sm text-white/40 mb-5 max-w-xs mx-auto">
              Upload your photos to get a full facial analysis and personalized recommendations.
            </p>
            <Button onClick={() => navigate('/upload')} icon={<Upload className="w-4 h-4" />}>
              Upload Photos
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Quick insights */}
      {currentAnalysis && (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Key Metrics</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/analysis')} icon={<ChevronRight className="w-4 h-4" />}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Overall Grooming', value: currentAnalysis.overallGrooming?.score || 0 },
                { label: 'Skin Appearance', value: currentAnalysis.skinAppearance?.score || 0 },
                { label: 'Hair Style', value: currentAnalysis.hairStyleCompatibility?.score || 0 },
                { label: 'Professional Look', value: currentAnalysis.professionalAppearance?.score || 0 },
              ].map((m) => (
                <ProgressBar key={m.label} label={m.label} value={m.value} size="sm" />
              ))}
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Top Recommendations</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/analysis')} icon={<ArrowUpRight className="w-4 h-4" />}>
                Details
              </Button>
            </div>
            <div className="space-y-2">
              {(currentAnalysis.recommendations?.hairstyles?.slice(0, 3) || currentAnalysis.recommendations?.haircuts?.slice(0, 3) || []).map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] mt-2 flex-shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">{rec}</p>
                </div>
              ))}
              {(!currentAnalysis.recommendations?.hairstyles?.length && !currentAnalysis.recommendations?.haircuts?.length) && (
                <p className="text-sm text-white/30">No recommendations available yet.</p>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent History */}
      {analysisHistory.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/progress')}>
              View History
            </Button>
          </div>
          <div className="space-y-2">
            {analysisHistory.slice(0, 3).map((record) => (
              <Card key={record.id} padding="sm" hover className="flex items-center gap-4">
                <div className="w-8 h-8 bg-[#4F8CFF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[#4F8CFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Facial Analysis</p>
                  <p className="text-xs text-white/30 truncate">{record.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#4F8CFF]">{record.result.presentationScore}</p>
                  <p className="text-xs text-white/30">score</p>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
