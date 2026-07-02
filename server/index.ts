import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'

const app = new Hono()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

app.use('/*', cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', process.env.FRONTEND_URL || ''],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/health', (c) => c.json({ ok: true }))

app.post('/api/gemini', async (c) => {
  if (!GEMINI_API_KEY) {
    return c.json({ error: 'API key not configured on server' }, 500)
  }

  const body = await c.req.json()

  // Retry once after quota reset wait
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (res.status === 429) {
      // Extract retry delay from error message
      const match = JSON.stringify(data).match(/retry in ([\d.]+)s/)
      const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 : 10000

      if (attempt === 0 && waitMs <= 65000) {
        // Wait and retry once
        await new Promise((r) => setTimeout(r, waitMs + 500))
        continue
      }
      return c.json({ error: data?.error?.message || 'Rate limit exceeded. Please wait a moment and try again.' }, 429)
    }

    if (!res.ok) {
      return c.json({ error: data?.error?.message || 'Gemini API error', status: res.status }, res.status as any)
    }

    return c.json(data)
  }

  return c.json({ error: 'Rate limit exceeded after retry. Please try again shortly.' }, 429)
})

const port = parseInt(process.env.PORT || '3001')
console.log(`FaceIQ API server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
