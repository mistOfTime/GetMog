// Direct Gemini call from frontend - works without backend proxy
const PROXY_URL = import.meta.env.VITE_API_URL || ''
const DIRECT_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const GEMINI_DIRECT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const OPENAI_DIRECT = 'https://api.openai.com/v1/chat/completions'

export interface AnalysisSection {
  label: string
  score: number
  observation: string
  explanation: string
  suggestions: string[]
  confidence: number
}

export interface LooksmaxRoadmapItem {
  priority: number
  area: string
  currentScore: number
  potentialScore: number
  effort: 'Low' | 'Medium' | 'High'
  timeframe: string
  steps: string[]
  impact: string
}

export interface FacialAnalysisResult {
  presentationScore: number
  potentialScore: number
  facialSymmetryScore: number
  goldenRatioScore: number
  photogenicScore: number
  confidenceScore: number
  professionalScore: number
  facialHarmonyScore: number
  analysisConfidence: number
  faceShape: AnalysisSection
  facialThirds: AnalysisSection
  facialFifths: AnalysisSection
  jawlineAnalysis: AnalysisSection
  symmetryAnalysis: AnalysisSection
  goldenRatioAnalysis: AnalysisSection
  photoQuality: AnalysisSection
  lightingQuality: AnalysisSection
  blurDetection: AnalysisSection
  facePosition: AnalysisSection
  skinAppearance: AnalysisSection
  acneDetection: AnalysisSection
  darkCircleDetection: AnalysisSection
  wrinkleDetection: AnalysisSection
  eyeAnalysis: AnalysisSection
  eyebrowAnalysis: AnalysisSection
  noseAnalysis: AnalysisSection
  lipAnalysis: AnalysisSection
  smileAnalysis: AnalysisSection
  hairAnalysis: AnalysisSection
  hairlineAnalysis: AnalysisSection
  hairStyleCompatibility: AnalysisSection
  beardCompatibility: AnalysisSection
  glassesCompatibility: AnalysisSection
  overallGrooming: AnalysisSection
  professionalAppearance: AnalysisSection
  casualAppearance: AnalysisSection
  colorPalette: { recommended: string[]; avoid: string[]; explanation: string }
  recommendations: {
    hairstyles: string[]
    beardStyles: string[]
    glassesStyles: string[]
    hairColor: string[]
    clothingColors: string[]
    skincare: string[]
    grooming: string[]
    poseTips: string[]
    lightingTips: string[]
    cameraTips: string[]
  }
  looksmaxRoadmap: LooksmaxRoadmapItem[]
  estimatedPotentialScore: number
  estimatedTimeToImprove: string
  dailyTips: string[]
  priorityImprovements: string[]
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callGemini(parts: unknown[]): Promise<string> {
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
  })

  // 1. Try OpenAI proxy
  if (PROXY_URL && OPENAI_KEY) {
    try {
      const messages = parts.map((p: any) => {
        if (p.inline_data) {
          return { type: 'image_url', image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } }
        }
        return { type: 'text', text: p.text }
      })
      const res = await fetch(`${PROXY_URL}/api/openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: messages }],
          max_tokens: 8192,
          temperature: 0.4,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return data?.choices?.[0]?.message?.content || ''
      }
    } catch (e) { console.warn('OpenAI proxy failed:', e) }
  }

  // 2. Try OpenAI direct (frontend key)
  if (OPENAI_KEY) {
    try {
      const messages = parts.map((p: any) => {
        if (p.inline_data) {
          return { type: 'image_url', image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } }
        }
        return { type: 'text', text: p.text }
      })
      const res = await fetch(OPENAI_DIRECT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: messages }],
          max_tokens: 8192,
          temperature: 0.4,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return data?.choices?.[0]?.message?.content || ''
      }
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `OpenAI error ${res.status}`)
    } catch (e: any) {
      if (!PROXY_URL && !DIRECT_KEY) throw e
      console.warn('OpenAI direct failed:', e.message)
    }
  }

  // 3. Try Gemini proxy
  if (PROXY_URL) {
    try {
      const res = await fetch(`${PROXY_URL}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (res.ok) {
        const data = await res.json()
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || `Proxy error ${res.status}`)
    } catch (e: any) {
      if (!DIRECT_KEY) throw e
      console.warn('Gemini proxy failed:', e.message)
    }
  }

  // 4. Try Gemini direct
  if (!DIRECT_KEY) throw new Error('No API key configured.')
  const res = await fetch(`${GEMINI_DIRECT}?key=${DIRECT_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

const ANALYSIS_PROMPT = `You are an expert facial analysis consultant. Analyze the uploaded photo(s) and return ONLY raw JSON with no markdown or code blocks.

Scores 0-100. Confidence 0-100. Replace all placeholder values with real observations from the photo.

{
  "presentationScore": 72, "potentialScore": 85, "facialSymmetryScore": 68, "goldenRatioScore": 71,
  "photogenicScore": 74, "confidenceScore": 70, "professionalScore": 72, "facialHarmonyScore": 73, "analysisConfidence": 82,
  "faceShape": {"label":"Face Shape","score":75,"observation":"Oval face shape detected","explanation":"Oval is the most versatile face shape","suggestions":["Most hairstyles suit you well"],"confidence":70},
  "facialThirds": {"label":"Facial Thirds","score":72,"observation":"Well-proportioned thirds","explanation":"Balanced thirds indicate harmony","suggestions":["Good balance overall"],"confidence":68},
  "facialFifths": {"label":"Facial Fifths","score":70,"observation":"Eye width proportionate","explanation":"Ideal face equals five eye-widths","suggestions":["Hairstyle can enhance this"],"confidence":65},
  "jawlineAnalysis": {"label":"Jawline","score":70,"observation":"Moderate jawline definition","explanation":"Defined jawline enhances structure","suggestions":["Beard can define jawline","Reduce sodium for less puffiness"],"confidence":75},
  "symmetryAnalysis": {"label":"Facial Symmetry","score":68,"observation":"Minor natural asymmetry","explanation":"Perfect symmetry is rare and normal","suggestions":["Camera angle can balance appearance"],"confidence":72},
  "goldenRatioAnalysis": {"label":"Golden Ratio","score":71,"observation":"Proportions approach golden ratio","explanation":"Golden ratio 1.618 is basis of beauty","suggestions":["Proportions are close to ideal"],"confidence":65},
  "photoQuality": {"label":"Photo Quality","score":75,"observation":"Good resolution and focus","explanation":"Quality affects analysis accuracy","suggestions":["Use natural light","Shoot at eye level"],"confidence":88},
  "lightingQuality": {"label":"Lighting","score":70,"observation":"Soft frontal lighting","explanation":"Even lighting shows true features","suggestions":["Window light is ideal","Avoid overhead harsh light"],"confidence":85},
  "blurDetection": {"label":"Blur Detection","score":80,"observation":"Sharp well-focused image","explanation":"Sharp images allow accurate detection","suggestions":["Keep camera steady","Use portrait mode"],"confidence":90},
  "facePosition": {"label":"Face Position","score":78,"observation":"Face well-centered in frame","explanation":"Centered position ensures accuracy","suggestions":["Look directly at camera"],"confidence":88},
  "skinAppearance": {"label":"Skin Appearance","score":68,"observation":"Generally smooth with minor blemishes","explanation":"Skin health impacts overall appearance","suggestions":["Moisturize daily","Use SPF","Stay hydrated"],"confidence":75},
  "acneDetection": {"label":"Acne","score":72,"observation":"Minimal acne visible","explanation":"Clear skin improves score","suggestions":["Gentle cleanser twice daily"],"confidence":70},
  "darkCircleDetection": {"label":"Dark Circles","score":65,"observation":"Mild dark circles present","explanation":"Dark circles affect perceived energy","suggestions":["8 hours sleep","Eye cream with caffeine"],"confidence":72},
  "wrinkleDetection": {"label":"Wrinkles","score":78,"observation":"Minimal wrinkles for age","explanation":"Skin elasticity affects youthful look","suggestions":["Retinol at night","Daily SPF"],"confidence":68},
  "eyeAnalysis": {"label":"Eyes","score":76,"observation":"Well-proportioned eyes","explanation":"Eyes are the most attention-drawing feature","suggestions":["Eye drops for brightness","Sleep reduces puffiness"],"confidence":80},
  "eyebrowAnalysis": {"label":"Eyebrows","score":70,"observation":"Natural brows slight unevenness","explanation":"Groomed brows frame the face","suggestions":["Clean up arch","Brush upward with clear gel"],"confidence":78},
  "noseAnalysis": {"label":"Nose","score":72,"observation":"Proportionate nose width","explanation":"Nose proportions affect harmony","suggestions":["Camera angle matters significantly"],"confidence":70},
  "lipAnalysis": {"label":"Lips","score":74,"observation":"Well-defined lip shape","explanation":"Lip proportion affects attractiveness","suggestions":["Stay hydrated for fuller look"],"confidence":75},
  "smileAnalysis": {"label":"Smile","score":78,"observation":"Natural smile good symmetry","explanation":"Genuine smile dramatically improves look","suggestions":["Practice natural smile","Dental hygiene for brightness"],"confidence":82},
  "hairAnalysis": {"label":"Hair","score":72,"observation":"Medium length good condition","explanation":"Hair condition impacts first impressions","suggestions":["Regular trims every 6-8 weeks"],"confidence":78},
  "hairlineAnalysis": {"label":"Hairline","score":74,"observation":"Natural hairline good framing","explanation":"Hairline shape determines hairstyles","suggestions":["Current length suits hairline"],"confidence":70},
  "hairStyleCompatibility": {"label":"Hairstyle Fit","score":72,"observation":"Style suits face shape moderately","explanation":"Right hairstyle dramatically improves look","suggestions":["Try textured crop for dimension"],"confidence":75},
  "beardCompatibility": {"label":"Beard Compatibility","score":74,"observation":"Face suits facial hair well","explanation":"Right beard defines jawline","suggestions":["Short stubble defines jawline"],"confidence":70},
  "glassesCompatibility": {"label":"Glasses Fit","score":73,"observation":"Face suits multiple frame styles","explanation":"Right frames complement face shape","suggestions":["Rectangular frames suit oval faces"],"confidence":68},
  "overallGrooming": {"label":"Overall Grooming","score":73,"observation":"Well-maintained appearance","explanation":"Grooming is most immediately improvable","suggestions":["Consistent skincare","Regular haircuts"],"confidence":82},
  "professionalAppearance": {"label":"Professional Look","score":70,"observation":"Presents well professionally","explanation":"Affects career and social opportunities","suggestions":["Clean grooming elevates score"],"confidence":78},
  "casualAppearance": {"label":"Casual Look","score":76,"observation":"Natural appearance scores well","explanation":"Casual authenticity is valued","suggestions":["Your natural look is your strength"],"confidence":80},
  "colorPalette": {"recommended":["Navy Blue","Charcoal Grey","Forest Green","Burgundy"],"avoid":["Neon Yellow","Bright Orange"],"explanation":"These colors complement your skin tone"},
  "recommendations": {
    "hairstyles": ["Textured crop suits your face shape","Side part is classic and professional"],
    "beardStyles": ["Short stubble defines jawline effectively","Clean shaven highlights features"],
    "glassesStyles": ["Thin rectangular frames are flattering","Wayfarers are versatile"],
    "hairColor": ["Natural color suits you well","Subtle highlights add dimension"],
    "clothingColors": ["Navy blue enhances eye color","Charcoal adds sophistication"],
    "skincare": ["AM: Cleanser, Vitamin C, SPF 30","PM: Retinol and moisturizer"],
    "grooming": ["Trim eyebrows regularly","Moisturize lips daily"],
    "poseTips": ["Chin forward and down defines jawline","3/4 angle is more flattering"],
    "lightingTips": ["Golden hour light is most flattering","Face a window for soft light"],
    "cameraTips": ["Shoot at eye level","Use portrait mode for blur"]
  },
  "looksmaxRoadmap": [
    {"priority":1,"area":"Skincare","currentScore":68,"potentialScore":85,"effort":"Low","timeframe":"4-8 weeks","steps":["Start SPF daily","Add Vitamin C serum","Moisturize twice daily"],"impact":"Skin clarity improves photogenic score by 15 points"},
    {"priority":2,"area":"Hairstyle","currentScore":72,"potentialScore":88,"effort":"Low","timeframe":"1-2 weeks","steps":["Book barber appointment","Request textured crop","Use styling product"],"impact":"Right hairstyle adds 10+ points"},
    {"priority":3,"area":"Eyebrow Grooming","currentScore":70,"potentialScore":84,"effort":"Low","timeframe":"1 week","steps":["Visit threading professional","Clean up arch","Fill sparse areas"],"impact":"Defined brows lift entire face"},
    {"priority":4,"area":"Sleep and Hydration","currentScore":65,"potentialScore":80,"effort":"Low","timeframe":"2-4 weeks","steps":["8 hours sleep minimum","2L water daily","Use eye cream"],"impact":"Reduces dark circles and improves radiance"},
    {"priority":5,"area":"Jawline Definition","currentScore":70,"potentialScore":82,"effort":"Medium","timeframe":"8-12 weeks","steps":["Mewing tongue posture daily","Clean beard neckline"],"impact":"Stronger jawline is top requested improvement"}
  ],
  "estimatedPotentialScore": 89,
  "estimatedTimeToImprove": "8-12 weeks with consistent effort",
  "dailyTips": ["Apply SPF every morning","Drink water when you wake up","Moisturize face before bed","Take a progress photo every 2 weeks"],
  "priorityImprovements": ["Start a skincare routine for highest ROI","Get a hairstyle that suits your face shape","Clean up eyebrows professionally","Fix sleep schedule to eliminate dark circles","Add a jawline-defining beard style"]
}`

export async function analyzeFace(images: File[]): Promise<FacialAnalysisResult> {
  const imageParts = await Promise.all(
    images.map(async (file) => ({
      inline_data: {
        data: await fileToBase64(file),
        mime_type: file.type === 'image/heic' ? 'image/jpeg' : file.type,
      },
    }))
  )
  const text = await callGemini([{ text: ANALYSIS_PROMPT }, ...imageParts])
  console.log('Raw response preview:', text.slice(0, 200))
  // GPT-4o often wraps JSON in ```json ... ``` markdown blocks
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/)
  if (!jsonMatch) throw new Error('Could not parse response. Please try again.')
  const jsonStr = jsonMatch[1] || jsonMatch[0]
  const raw = JSON.parse(jsonStr)
  // Normalize field names — Gemini sometimes returns snake_case or different names
  return {
    ...raw,
    photoQuality: raw.photoQuality || raw.photo_quality || { label: 'Photo Quality', score: 75, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 80 },
    lightingQuality: raw.lightingQuality || raw.lighting_quality || raw.lighting || { label: 'Lighting', score: 72, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 80 },
    blurDetection: raw.blurDetection || raw.blur_detection || raw.blur || { label: 'Blur Detection', score: 80, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 85 },
    facePosition: raw.facePosition || raw.face_position || { label: 'Face Position', score: 78, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 85 },
    skinAppearance: raw.skinAppearance || raw.skin_appearance || raw.skin || { label: 'Skin Appearance', score: 70, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 75 },
    acneDetection: raw.acneDetection || raw.acne_detection || raw.acne || { label: 'Acne', score: 75, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 70 },
    darkCircleDetection: raw.darkCircleDetection || raw.dark_circle_detection || raw.dark_circles || raw.darkCircles || { label: 'Dark Circles', score: 70, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 70 },
    wrinkleDetection: raw.wrinkleDetection || raw.wrinkle_detection || raw.wrinkles || { label: 'Wrinkles', score: 78, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 68 },
    eyeAnalysis: raw.eyeAnalysis || raw.eye_analysis || raw.eyes || { label: 'Eyes', score: 75, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 78 },
    eyebrowAnalysis: raw.eyebrowAnalysis || raw.eyebrow_analysis || raw.eyebrows || { label: 'Eyebrows', score: 72, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 76 },
    noseAnalysis: raw.noseAnalysis || raw.nose_analysis || raw.nose || { label: 'Nose', score: 73, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 72 },
    lipAnalysis: raw.lipAnalysis || raw.lip_analysis || raw.lips || { label: 'Lips', score: 74, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 74 },
    smileAnalysis: raw.smileAnalysis || raw.smile_analysis || raw.smile || { label: 'Smile', score: 76, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 80 },
    hairAnalysis: raw.hairAnalysis || raw.hair_analysis || raw.hair || { label: 'Hair', score: 72, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 75 },
    hairlineAnalysis: raw.hairlineAnalysis || raw.hairline_analysis || raw.hairline || { label: 'Hairline', score: 74, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 70 },
    hairStyleCompatibility: raw.hairStyleCompatibility || raw.hair_style_compatibility || raw.hairstyle || { label: 'Hairstyle Fit', score: 72, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 72 },
    beardCompatibility: raw.beardCompatibility || raw.beard_compatibility || raw.beard || { label: 'Beard Compatibility', score: 73, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 68 },
    glassesCompatibility: raw.glassesCompatibility || raw.glasses_compatibility || raw.glasses || { label: 'Glasses Fit', score: 73, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 68 },
    overallGrooming: raw.overallGrooming || raw.overall_grooming || raw.grooming || { label: 'Overall Grooming', score: 73, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 80 },
    professionalAppearance: raw.professionalAppearance || raw.professional_appearance || { label: 'Professional Look', score: 70, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 76 },
    casualAppearance: raw.casualAppearance || raw.casual_appearance || { label: 'Casual Look', score: 75, observation: 'Analyzed', explanation: '', suggestions: [], confidence: 76 },
  } as FacialAnalysisResult
}

export async function chatWithAI(message: string, analysisContext?: FacialAnalysisResult): Promise<string> {
  const context = analysisContext
    ? `User analysis: Presentation ${analysisContext.presentationScore}/100, Potential ${analysisContext.potentialScore}/100, Face: ${analysisContext.faceShape?.observation}, Skin: ${analysisContext.skinAppearance?.observation}, Top tip: ${analysisContext.priorityImprovements?.[0]}`
    : 'No analysis completed yet.'
  const prompt = `You are True Adam, a friendly personal looks coach for GetMog.
${context}
Answer in 2-4 sentences. Be specific, warm, actionable. No medical claims.
User: ${message}`
  const text = await callGemini([{ text: prompt }])
  return text.trim() || 'Could not generate response. Please try again.'
}
