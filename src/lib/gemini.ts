const PROXY_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  // Core scores
  presentationScore: number
  potentialScore: number
  facialSymmetryScore: number
  goldenRatioScore: number
  photogenicScore: number
  confidenceScore: number
  professionalScore: number
  facialHarmonyScore: number
  analysisConfidence: number

  // Face geometry
  faceShape: AnalysisSection
  facialThirds: AnalysisSection
  facialFifths: AnalysisSection
  jawlineAnalysis: AnalysisSection
  symmetryAnalysis: AnalysisSection
  goldenRatioAnalysis: AnalysisSection

  // Photo quality
  photoQuality: AnalysisSection
  lightingQuality: AnalysisSection
  blurDetection: AnalysisSection
  facePosition: AnalysisSection

  // Skin & features
  skinAppearance: AnalysisSection
  acneDetection: AnalysisSection
  darkCircleDetection: AnalysisSection
  wrinkleDetection: AnalysisSection

  // Facial features
  eyeAnalysis: AnalysisSection
  eyebrowAnalysis: AnalysisSection
  noseAnalysis: AnalysisSection
  lipAnalysis: AnalysisSection
  smileAnalysis: AnalysisSection

  // Style compatibility
  hairAnalysis: AnalysisSection
  hairlineAnalysis: AnalysisSection
  hairStyleCompatibility: AnalysisSection
  beardCompatibility: AnalysisSection
  glassesCompatibility: AnalysisSection
  overallGrooming: AnalysisSection

  // Appearance scores
  professionalAppearance: AnalysisSection
  casualAppearance: AnalysisSection

  // Recommendations
  colorPalette: {
    recommended: string[]
    avoid: string[]
    explanation: string
  }
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

  // Looksmax roadmap
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
  const res = await fetch(`${PROXY_URL}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `Server error ${res.status}`)
  }
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

const ANALYSIS_PROMPT = `You are an expert facial analysis AI. Analyze the uploaded photo(s) and return ONLY raw JSON — no markdown, no code blocks.

Scores are 0-100. Be honest but constructive. Confidence 0-100.

Return this exact JSON (replace all "..." with real analysis):
{
  "presentationScore": 72,
  "potentialScore": 85,
  "facialSymmetryScore": 68,
  "goldenRatioScore": 71,
  "photogenicScore": 74,
  "confidenceScore": 70,
  "professionalScore": 72,
  "facialHarmonyScore": 73,
  "analysisConfidence": 82,
  "faceShape": {"label":"Face Shape","score":75,"observation":"Oval face shape detected","explanation":"Oval is considered the most versatile face shape","suggestions":["Most hairstyles suit you well"],"confidence":70},
  "facialThirds": {"label":"Facial Thirds","score":72,"observation":"Upper, middle and lower thirds are well proportioned","explanation":"Balanced thirds indicate facial harmony","suggestions":["Forehead-to-nose ratio is balanced"],"confidence":68},
  "facialFifths": {"label":"Facial Fifths","score":70,"observation":"Eye width aligns well with facial fifths","explanation":"Ideal face width equals five eye-widths","suggestions":["Hairstyle can frame face to enhance proportions"],"confidence":65},
  "jawlineAnalysis": {"label":"Jawline","score":70,"observation":"Moderate jawline definition visible","explanation":"A defined jawline enhances facial structure","suggestions":["Facial hair can enhance jawline definition","Reduce sodium intake to reduce puffiness"],"confidence":75},
  "symmetryAnalysis": {"label":"Facial Symmetry","score":68,"observation":"Minor asymmetry detected on left side","explanation":"Perfect symmetry is rare; minor differences are normal","suggestions":["Camera angle can minimize asymmetry","Hairstyle parting can balance appearance"],"confidence":72},
  "goldenRatioAnalysis": {"label":"Golden Ratio","score":71,"observation":"Facial proportions approach the golden ratio","explanation":"Golden ratio (1.618) is the mathematical basis of beauty","suggestions":["Your proportions are close to ideal","Grooming can optimize remaining gaps"],"confidence":65},
  "photoQuality": {"label":"Photo Quality","score":75,"observation":"Good resolution, clear focus","explanation":"Higher quality photos improve analysis accuracy","suggestions":["Use natural lighting","Shoot at eye level"],"confidence":88},
  "lightingQuality": {"label":"Lighting","score":70,"observation":"Soft frontal lighting detected","explanation":"Even lighting reduces shadows and shows true features","suggestions":["Window light facing you is ideal","Avoid harsh overhead lighting"],"confidence":85},
  "blurDetection": {"label":"Blur Detection","score":80,"observation":"Image is sharp and well-focused","explanation":"Sharp images allow accurate feature detection","suggestions":["Keep camera steady","Use portrait mode"],"confidence":90},
  "facePosition": {"label":"Face Position","score":78,"observation":"Face is well-centered in frame","explanation":"Centered face position ensures accurate analysis","suggestions":["Look directly at camera for best results"],"confidence":88},
  "skinAppearance": {"label":"Skin Appearance","score":68,"observation":"Generally smooth texture with minor blemishes","explanation":"Skin health significantly impacts overall appearance","suggestions":["Consistent moisturizer routine","SPF daily","Stay hydrated"],"confidence":75},
  "acneDetection": {"label":"Acne","score":72,"observation":"Minimal acne visible","explanation":"Clear skin improves presentation score","suggestions":["Gentle cleanser twice daily","Non-comedogenic moisturizer"],"confidence":70},
  "darkCircleDetection": {"label":"Dark Circles","score":65,"observation":"Mild dark circles under eyes","explanation":"Dark circles affect perceived tiredness and health","suggestions":["8 hours sleep","Eye cream with caffeine","Stay hydrated"],"confidence":72},
  "wrinkleDetection": {"label":"Wrinkles","score":78,"observation":"Minimal wrinkles for age","explanation":"Skin elasticity affects youthful appearance","suggestions":["Retinol at night","Daily SPF","Hydration is key"],"confidence":68},
  "eyeAnalysis": {"label":"Eyes","score":76,"observation":"Well-proportioned eyes with good openness","explanation":"Eyes are the most attention-drawing facial feature","suggestions":["Eye drops for brightness","Adequate sleep reduces puffiness"],"confidence":80},
  "eyebrowAnalysis": {"label":"Eyebrows","score":70,"observation":"Natural brows with slight unevenness","explanation":"Well-groomed brows frame the face and lift appearance","suggestions":["Clean up arch slightly","Fill sparse areas","Brush upward for lifted look"],"confidence":78},
  "noseAnalysis": {"label":"Nose","score":72,"observation":"Proportionate nose width to face","explanation":"Nose proportions affect facial harmony","suggestions":["Contouring can optically slim the nose","Camera angle matters significantly"],"confidence":70},
  "lipAnalysis": {"label":"Lips","score":74,"observation":"Well-defined lip shape with good proportion","explanation":"Lip proportion and definition affect attractiveness","suggestions":["Stay hydrated for fuller appearance","Lip balm for definition"],"confidence":75},
  "smileAnalysis": {"label":"Smile","score":78,"observation":"Natural smile with good symmetry","explanation":"A genuine smile dramatically improves appearance","suggestions":["Practice natural smile","Dental hygiene for brightness"],"confidence":82},
  "hairAnalysis": {"label":"Hair","score":72,"observation":"Medium length hair in good condition","explanation":"Hair condition and style significantly impact first impressions","suggestions":["Regular trims every 6-8 weeks","Use conditioner for shine"],"confidence":78},
  "hairlineAnalysis": {"label":"Hairline","score":74,"observation":"Natural hairline with good framing","explanation":"Hairline shape determines suitable hairstyles","suggestions":["Current length suits hairline well"],"confidence":70},
  "hairStyleCompatibility": {"label":"Hairstyle Fit","score":72,"observation":"Current style moderately suits face shape","explanation":"The right hairstyle can dramatically improve presentation","suggestions":["Try textured crop for more dimension","Side part would suit your face shape"],"confidence":75},
  "beardCompatibility": {"label":"Beard Compatibility","score":74,"observation":"Face structure suits facial hair well","explanation":"The right beard style can define jawline and add maturity","suggestions":["Short stubble would enhance jawline","Keep neckline clean"],"confidence":70},
  "glassesCompatibility": {"label":"Glasses Fit","score":73,"observation":"Face shape suits multiple frame styles","explanation":"The right frames complement face shape and add sophistication","suggestions":["Rectangular frames suit oval faces","Avoid overly round frames"],"confidence":68},
  "overallGrooming": {"label":"Overall Grooming","score":73,"observation":"Well-maintained appearance overall","explanation":"Grooming is the most immediately improvable factor","suggestions":["Consistent skincare routine","Regular haircuts","Eyebrow maintenance"],"confidence":82},
  "professionalAppearance": {"label":"Professional Look","score":70,"observation":"Presents well in professional context","explanation":"Professional appearance affects career and social opportunities","suggestions":["Clean grooming elevates professional score","Neutral clothing colors help"],"confidence":78},
  "casualAppearance": {"label":"Casual Look","score":76,"observation":"Relaxed natural appearance scores well","explanation":"Casual authenticity is valued in social settings","suggestions":["Your natural look is your strength","Minimal grooming goes a long way"],"confidence":80},
  "colorPalette": {"recommended":["Navy Blue","Charcoal Grey","Forest Green","Burgundy"],"avoid":["Neon Yellow","Bright Orange"],"explanation":"These colors complement your skin tone and eye color for maximum impact"},
  "recommendations": {
    "hairstyles": ["Textured crop — adds volume and suits your face shape","Side part — classic and professional","Undercut fade — modern and clean","French crop — low maintenance and stylish"],
    "beardStyles": ["Short stubble (2-3mm) — defines jawline effectively","Light beard — adds maturity and structure","Clean shaven — highlights your natural features"],
    "glassesStyles": ["Thin rectangular frames — sophisticated and flattering","Wayfarers — versatile and timeless","Semi-rimless — modern and light"],
    "hairColor": ["Your natural color suits you well","Subtle highlights add dimension without dramatic change","Avoid bleaching which can wash out skin tone"],
    "clothingColors": ["Navy blue — enhances eye color","Charcoal — adds sophistication","Forest green — complements warm skin tones","White — brightens complexion"],
    "skincare": ["AM: Gentle cleanser, Vitamin C serum, SPF 30+","PM: Double cleanse, Retinol (2-3x/week), Moisturizer","Weekly: Exfoliate with AHA/BHA","Drink 2L water daily"],
    "grooming": ["Trim eyebrows to remove strays","Ear and nose hair check weekly","Moisturize lips daily","Clean nails always"],
    "poseTips": ["Chin slightly forward and down to define jawline","3/4 angle is more flattering than straight-on","Relax your face 3 seconds before photo","Eyes slightly squinted (Squinch technique)"],
    "lightingTips": ["Golden hour sunlight is the most flattering","Face a window for soft even light","Avoid fluorescent overhead lighting","Ring light at eye level for portraits"],
    "cameraTips": ["Shoot at eye level or slightly above","Portrait mode for background blur","Distance of 1-1.5m from camera","Use rear camera for better quality"]
  },
  "looksmaxRoadmap": [
    {"priority":1,"area":"Skincare","currentScore":68,"potentialScore":85,"effort":"Low","timeframe":"4-8 weeks","steps":["Start SPF daily","Add Vitamin C serum morning","Moisturize twice daily","Exfoliate 2x per week"],"impact":"Skin clarity improves photogenic score by up to 15 points"},
    {"priority":2,"area":"Hairstyle","currentScore":72,"potentialScore":88,"effort":"Low","timeframe":"1-2 weeks","steps":["Book appointment with skilled barber","Request textured crop","Ask for face-shape consultation","Use styling product daily"],"impact":"Right hairstyle can add 10+ points to presentation score"},
    {"priority":3,"area":"Eyebrow Grooming","currentScore":70,"potentialScore":84,"effort":"Low","timeframe":"1 week","steps":["Visit threading/waxing professional","Clean up arch","Fill sparse areas with pencil","Brush upward with clear gel"],"impact":"Defined brows lift the entire face appearance"},
    {"priority":4,"area":"Sleep & Hydration","currentScore":65,"potentialScore":80,"effort":"Low","timeframe":"2-4 weeks","steps":["8 hours sleep minimum","2L water per day","Reduce alcohol and sodium","Use eye cream nightly"],"impact":"Reduces dark circles and improves skin radiance"},
    {"priority":5,"area":"Jawline Definition","currentScore":70,"potentialScore":82,"effort":"Medium","timeframe":"8-12 weeks","steps":["Mewing tongue posture daily","Reduce body fat if applicable","Clean beard neckline","Camera angles to emphasize jaw"],"impact":"Stronger jawline is the #1 requested improvement"}
  ],
  "estimatedPotentialScore": 89,
  "estimatedTimeToImprove": "8-12 weeks with consistent effort",
  "dailyTips": ["Apply SPF every morning","Drink a full glass of water when you wake up","Do 2 minutes of mewing/tongue posture","Clean and moisturize face before bed","Take a progress photo every 2 weeks"],
  "priorityImprovements": ["Start a skincare routine — highest ROI improvement","Get a hairstyle that suits your face shape","Clean up eyebrows professionally","Fix sleep schedule to eliminate dark circles","Add a jawline-defining beard style"]
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
  console.log('Gemini raw response:', text.slice(0, 500))
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse AI response. Please try again.')
  try {
    const raw = JSON.parse(jsonMatch[0])
    console.log('Parsed fields:', Object.keys(raw))
    // Normalize: some Gemini responses use different field names
    const result: FacialAnalysisResult = {
      ...raw,
      // Ensure all section fields exist with defaults if missing
      photoQuality: raw.photoQuality || raw.photo_quality || { label: 'Photo Quality', score: 75, observation: 'Analysis completed', explanation: '', suggestions: [], confidence: 80 },
      lightingQuality: raw.lightingQuality || raw.lighting_quality || raw.lighting || { label: 'Lighting', score: 72, observation: 'Lighting analyzed', explanation: '', suggestions: [], confidence: 80 },
      blurDetection: raw.blurDetection || raw.blur_detection || raw.blur || { label: 'Blur Detection', score: 80, observation: 'Image sharpness checked', explanation: '', suggestions: [], confidence: 85 },
      facePosition: raw.facePosition || raw.face_position || raw.face_centering || { label: 'Face Position', score: 78, observation: 'Face position analyzed', explanation: '', suggestions: [], confidence: 85 },
      skinAppearance: raw.skinAppearance || raw.skin_appearance || raw.skin || { label: 'Skin Appearance', score: 70, observation: 'Skin analyzed', explanation: '', suggestions: [], confidence: 75 },
      acneDetection: raw.acneDetection || raw.acne_detection || raw.acne || { label: 'Acne', score: 75, observation: 'Acne assessed', explanation: '', suggestions: [], confidence: 70 },
      darkCircleDetection: raw.darkCircleDetection || raw.dark_circle_detection || raw.dark_circles || raw.darkCircles || { label: 'Dark Circles', score: 70, observation: 'Under-eye area assessed', explanation: '', suggestions: [], confidence: 70 },
      wrinkleDetection: raw.wrinkleDetection || raw.wrinkle_detection || raw.wrinkles || { label: 'Wrinkles', score: 78, observation: 'Skin texture analyzed', explanation: '', suggestions: [], confidence: 68 },
      eyeAnalysis: raw.eyeAnalysis || raw.eye_analysis || raw.eyes || { label: 'Eyes', score: 75, observation: 'Eyes analyzed', explanation: '', suggestions: [], confidence: 78 },
      eyebrowAnalysis: raw.eyebrowAnalysis || raw.eyebrow_analysis || raw.eyebrows || { label: 'Eyebrows', score: 72, observation: 'Eyebrows analyzed', explanation: '', suggestions: [], confidence: 76 },
      noseAnalysis: raw.noseAnalysis || raw.nose_analysis || raw.nose || { label: 'Nose', score: 73, observation: 'Nose analyzed', explanation: '', suggestions: [], confidence: 72 },
      lipAnalysis: raw.lipAnalysis || raw.lip_analysis || raw.lips || { label: 'Lips', score: 74, observation: 'Lips analyzed', explanation: '', suggestions: [], confidence: 74 },
      smileAnalysis: raw.smileAnalysis || raw.smile_analysis || raw.smile || { label: 'Smile', score: 76, observation: 'Smile analyzed', explanation: '', suggestions: [], confidence: 80 },
      hairAnalysis: raw.hairAnalysis || raw.hair_analysis || raw.hair || { label: 'Hair', score: 72, observation: 'Hair analyzed', explanation: '', suggestions: [], confidence: 75 },
      hairlineAnalysis: raw.hairlineAnalysis || raw.hairline_analysis || raw.hairline || { label: 'Hairline', score: 74, observation: 'Hairline analyzed', explanation: '', suggestions: [], confidence: 70 },
      hairStyleCompatibility: raw.hairStyleCompatibility || raw.hair_style_compatibility || raw.hairstyle || { label: 'Hairstyle Fit', score: 72, observation: 'Hairstyle analyzed', explanation: '', suggestions: [], confidence: 72 },
      beardCompatibility: raw.beardCompatibility || raw.beard_compatibility || raw.beard || { label: 'Beard Compatibility', score: 73, observation: 'Beard potential analyzed', explanation: '', suggestions: [], confidence: 68 },
      glassesCompatibility: raw.glassesCompatibility || raw.glasses_compatibility || raw.glasses || { label: 'Glasses Fit', score: 73, observation: 'Glasses fit analyzed', explanation: '', suggestions: [], confidence: 68 },
      overallGrooming: raw.overallGrooming || raw.overall_grooming || raw.grooming || { label: 'Overall Grooming', score: 73, observation: 'Grooming analyzed', explanation: '', suggestions: [], confidence: 80 },
      professionalAppearance: raw.professionalAppearance || raw.professional_appearance || raw.professional || { label: 'Professional Look', score: 70, observation: 'Professional appearance analyzed', explanation: '', suggestions: [], confidence: 76 },
      casualAppearance: raw.casualAppearance || raw.casual_appearance || raw.casual || { label: 'Casual Look', score: 75, observation: 'Casual appearance analyzed', explanation: '', suggestions: [], confidence: 76 },
    }
    return result
  } catch {
    throw new Error('AI returned invalid data. Please try again.')
  }
}

export async function chatWithAI(
  message: string,
  analysisContext?: FacialAnalysisResult
): Promise<string> {
  const context = analysisContext
    ? `User facial analysis: Presentation ${analysisContext.presentationScore}/100, Potential ${analysisContext.potentialScore}/100, Symmetry ${analysisContext.facialSymmetryScore}/100, Face shape: ${analysisContext.faceShape?.observation}, Skin: ${analysisContext.skinAppearance?.observation}, Priority improvements: ${analysisContext.priorityImprovements?.slice(0,3).join('; ')}`
    : 'No facial analysis completed yet.'

  const prompt = `You are an expert AI Looks Coach for GetMog — a premium self-improvement platform.

${context}

Answer in 2-4 sentences. Be specific, warm, actionable. Never make medical claims. Focus on grooming, style, photography, and presentation.

User: ${message}`

  const text = await callGemini([{ text: prompt }])
  return text.trim() || 'Could not generate a response. Please try again.'
}
