import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatWithAI } from '@/lib/gemini'
import { useAnalysisStore } from '@/store/analysisStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Send, Sparkles, User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED = [
  'What hairstyle suits my face shape?',
  'Would round glasses look good on me?',
  'How can I improve my selfies?',
  'What clothing colors work for me?',
  'How can I improve my skin appearance?',
  'What beard style would suit me?',
]

export function ChatPage() {
  const { currentAnalysis } = useAnalysisStore()

  const buildGreeting = (analysis: typeof currentAnalysis) => {
    if (!analysis) {
      return "Hi! I'm your True Adam assistant. Upload your photos first for personalized advice, or feel free to ask me general grooming and style questions!"
    }
    const score = analysis.presentationScore
    const potential = analysis.potentialScore
    const faceShape = analysis.faceShape?.observation || ''
    const topTip = analysis.priorityImprovements?.[0] || ''

    return `Hi! I've reviewed your latest analysis. Your presentation score is **${score}/100** with a potential of **${potential}/100**. ${faceShape ? `Your face shape is estimated as ${faceShape.toLowerCase()}.` : ''} ${topTip ? `Top priority: ${topTip}` : ''} What would you like to know?`
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: buildGreeting(currentAnalysis),
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevScoreRef = useRef<number | null>(currentAnalysis?.presentationScore ?? null)

  // Update greeting whenever a new analysis comes in
  useEffect(() => {
    const newScore = currentAnalysis?.presentationScore ?? null
    const prevScore = prevScoreRef.current

    if (newScore === null) return
    if (newScore === prevScore) return // same analysis, no update needed

    prevScoreRef.current = newScore

    const diff = prevScore !== null ? newScore - prevScore : null
    let msg = buildGreeting(currentAnalysis)

    if (diff !== null && diff !== 0) {
      const change = diff > 0
        ? `🔥 Your score went up by **+${diff} points** since your last analysis!`
        : `Your score changed by **${diff} points** since last time.`
      msg = `${change} ${msg}`
    }

    setMessages(prev => {
      // Replace only the first greeting message
      const rest = prev.filter(m => m.id !== '0')
      return [
        { id: '0', role: 'assistant', content: msg, timestamp: new Date() },
        ...rest,
      ]
    })
  }, [currentAnalysis?.presentationScore])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await chatWithAI(text.trim(), currentAnalysis || undefined)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages((m) => [...m, botMsg])
    } catch (err: any) {
      const msg = err?.message || ''
      const isQuota = msg.includes('quota') || msg.includes('429') || msg.includes('rate')
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isQuota
          ? "I'm a little busy right now — the AI quota is at its limit. Please wait a few seconds and try again! 🙂"
          : `Error: ${msg || 'Something went wrong. Please try again.'}`,
        timestamp: new Date(),
      }
      setMessages((m) => [...m, errMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)] max-w-2xl mx-auto">
      {/* Header with avatar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#4F8CFF]/40" style={{ background: '#fff' }}>
            <img
              src="/adam.jpg"
              alt="True Adam"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#080808]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">True Adam <span className="text-white/40 font-normal text-sm">your assistant</span></h1>
          <p className="text-white/40 text-xs">Your personal looks coach • Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden',
                  msg.role === 'assistant'
                    ? 'border border-[#4F8CFF]/30'
                    : 'bg-white/5 border border-white/10'
                )}
                style={msg.role === 'assistant' ? { background: '#fff' } : {}}
              >
                {msg.role === 'assistant' ? (
                  <img src="/adam.jpg" alt="Adam" className="w-full h-full object-cover object-top" />
                ) : (
                  <User className="w-4 h-4 text-white/60" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-[#181818] border border-white/[0.06] text-white/80'
                    : 'bg-[#4F8CFF] text-white'
                )}
              >
                {msg.content.split(/\*\*(.+?)\*\*/g).map((part, i) =>
                  i % 2 === 1
                    ? <span key={i} className="font-bold text-white">{part}</span>
                    : <span key={i}>{part}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#4F8CFF]/30 flex-shrink-0">
              <img src="/adam.jpg" alt="Adam" className="w-full h-full object-cover"  />
            </div>
            <div className="bg-[#181818] border border-white/[0.06] rounded-2xl px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-white/30 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-xs text-white/30 mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 rounded-full text-xs text-white/60 hover:text-white/80 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Ask about your style, grooming, or presentation..."
          className="flex-1 bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4F8CFF]/40 transition-colors"
        />
        <Button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          icon={<Send className="w-4 h-4" />}
        >
          Send
        </Button>
      </div>
    </div>
  )
}
