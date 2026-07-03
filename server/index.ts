import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'

const app = new Hono()

// Rotate through multiple Gemini keys — when one hits quota, use next
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY || '',
  process.env.GEMINI_API_KEY_2 || '',
  process.env.GEMINI_API_KEY_3 || '',
].filter(k => k.length > 0)

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

// Track which keys are exhausted (resets daily)
const exhaustedKeys = new Set<string>()
let keyIndex = 0

function getNextKey(): string | null {
  const available = GEMINI_KEYS.filter(k => !exhaustedKeys.has(k))
  if (available.length === 0) return null
  // Round-robin through available keys
  const key = available[keyIndex % available.length]
  keyIndex++
  return key
}

app.use('/*', cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', process.env.FRONTEND_URL || '', 'https://get-mog.vercel.app'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/health', (c) => c.json({
  ok: true,
  geminiKeys: GEMINI_KEYS.length,
  exhausted: exhaustedKeys.size,
  openai: !!OPENAI_API_KEY,
}))

// Redirect root to the frontend website
app.get('/', (c) => c.redirect('https://get-mog.vercel.app', 302))

// OpenAI endpoint
app.post('/api/openai', async (c) => {
  if (!OPENAI_API_KEY) return c.json({ error: 'OpenAI not configured' }, 500)
  const body = await c.req.json()
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) return c.json({ error: data?.error?.message || 'OpenAI error' }, res.status as any)
  return c.json(data)
})

// Gemini endpoint with automatic key rotation
app.post('/api/gemini', async (c) => {
  if (GEMINI_KEYS.length === 0) return c.json({ error: 'No Gemini keys configured' }, 500)

  const body = await c.req.json()
  let lastError = ''

  // Try each available key
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const key = getNextKey()
    if (!key) {
      return c.json({ error: `All ${GEMINI_KEYS.length} API keys have exceeded quota. Try again tomorrow.` }, 429)
    }

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (res.status === 429) {
      console.log(`Key ${key.slice(-8)} exhausted, trying next...`)
      exhaustedKeys.add(key)
      lastError = data?.error?.message || 'Quota exceeded'
      continue
    }

    if (!res.ok) {
      return c.json({ error: data?.error?.message || `Gemini error ${res.status}` }, res.status as any)
    }

    return c.json(data)
  }

  return c.json({ error: lastError || 'All keys exhausted' }, 429)
})

const port = parseInt(process.env.PORT || '3001')
console.log(`GetMog API server running — ${GEMINI_KEYS.length} Gemini keys loaded`)

// Keep-alive ping every 10 minutes to prevent Render free tier sleep
const SELF_URL = process.env.RENDER_EXTERNAL_URL || ''
if (SELF_URL) {
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/health`)
      console.log('Keep-alive ping sent')
    } catch { /* ignore */ }
  }, 10 * 60 * 1000)
}

serve({ fetch: app.fetch, port })
