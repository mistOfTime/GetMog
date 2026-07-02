import jsPDF from 'jspdf'
import type { FacialAnalysisResult } from './gemini'

function scoreColor(score: number): [number, number, number] {
  if (score >= 80) return [74, 222, 128]
  if (score >= 65) return [79, 140, 255]
  if (score >= 50) return [251, 191, 36]
  return [248, 113, 113]
}

function drawScoreCard(
  pdf: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, score: number, observation: string
) {
  const [r, g, b] = scoreColor(score)

  // Card background
  pdf.setFillColor(20, 20, 30)
  pdf.roundedRect(x, y, w, h, 3, 3, 'F')

  // Score circle
  pdf.setFillColor(r, g, b)
  pdf.circle(x + 14, y + h / 2, 10, 'F')
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text(String(score), x + 14, y + h / 2 + 3.5, { align: 'center' })

  // Label
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text(label, x + 28, y + 10)

  // Observation - clean ASCII only
  const clean = observation.replace(/[^\x20-\x7E]/g, '').slice(0, 60)
  pdf.setTextColor(160, 160, 160)
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'normal')
  pdf.text(clean, x + 28, y + 17)

  // Score bar
  const barX = x + 28
  const barY = y + h - 6
  const barW = w - 32
  pdf.setFillColor(40, 40, 50)
  pdf.roundedRect(barX, barY, barW, 3, 1.5, 1.5, 'F')
  pdf.setFillColor(r, g, b)
  pdf.roundedRect(barX, barY, Math.max(2, (score / 100) * barW), 3, 1.5, 1.5, 'F')
}

function drawGroupHeader(pdf: jsPDF, x: number, y: number, w: number, label: string) {
  pdf.setFillColor(15, 25, 50)
  pdf.roundedRect(x, y, w, 9, 2, 2, 'F')
  pdf.setDrawColor(79, 140, 255)
  pdf.setLineWidth(0.4)
  pdf.line(x + 3, y + 4.5, x + 3, y + 4.5)
  pdf.setTextColor(79, 140, 255)
  pdf.setFontSize(8.5)
  pdf.setFont('helvetica', 'bold')
  const cleanLabel = label.replace(/[^\x20-\x7E]/g, '').trim()
  pdf.text(cleanLabel, x + 5, y + 6.5)
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  // blob: URLs can't be fetched — use canvas instead
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 200
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, 200, 200)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  }
  // Remote URLs
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generatePDF(
  analysis: FacialAnalysisResult,
  userName?: string,
  avatarUrl?: string
) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const W = 210
  const M = 12
  const cardW = (W - M * 2 - 5) / 2
  const cardH = 28
  let y = 0

  // ─── PAGE 1: COVER ───────────────────────────────────
  pdf.setFillColor(8, 8, 12)
  pdf.rect(0, 0, W, 297, 'F')

  // Top accent bar
  pdf.setFillColor(79, 140, 255)
  pdf.rect(0, 0, W, 4, 'F')

  // Load and draw avatar or fallback circle
  let avatarDrawn = false
  if (avatarUrl) {
    const imgData = await loadImageAsBase64(avatarUrl)
    if (imgData) {
      try {
        // Draw circular clipped avatar using canvas
        const circleCanvas = document.createElement('canvas')
        const size = 200
        circleCanvas.width = size
        circleCanvas.height = size
        const ctx = circleCanvas.getContext('2d')!
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        const img = new Image()
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = imgData
        })
        const circularData = circleCanvas.toDataURL('image/png')
        const r = 22
        pdf.addImage(circularData, 'PNG', W / 2 - r, 16, r * 2, r * 2)
        // Blue border ring
        pdf.setDrawColor(79, 140, 255)
        pdf.setLineWidth(1.5)
        pdf.circle(W / 2, 16 + r, r, 'S')
        avatarDrawn = true
      } catch { avatarDrawn = false }
    }
  }

  if (!avatarDrawn) {
    // Initials circle fallback
    pdf.setFillColor(79, 140, 255)
    pdf.circle(W / 2, 38, 22, 'F')
    const initials = (userName || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(initials, W / 2, 38 + 7, { align: 'center' })
  }

  // Name
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.text(userName || 'User', W / 2, 70, { align: 'center' })

  // Subtitle
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 130)
  pdf.text('GetMog Facial Analysis Report', W / 2, 78, { align: 'center' })

  // Date
  pdf.setFontSize(8)
  pdf.setTextColor(70, 70, 90)
  pdf.text(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    W / 2, 84, { align: 'center' }
  )

  // Divider
  pdf.setDrawColor(30, 30, 50)
  pdf.setLineWidth(0.4)
  pdf.line(M + 15, 88, W - M - 15, 88)

  // ─── 5 SCORE RINGS ───────────────────────────────────
  const scoreItems = [
    { label: 'Presentation', value: analysis.presentationScore, color: [79, 140, 255] as [number, number, number] },
    { label: 'Potential', value: analysis.potentialScore, color: [167, 139, 250] as [number, number, number] },
    { label: 'Symmetry', value: analysis.facialSymmetryScore || 0, color: [52, 211, 153] as [number, number, number] },
    { label: 'Golden Ratio', value: analysis.goldenRatioScore || 0, color: [251, 191, 36] as [number, number, number] },
    { label: 'Photogenic', value: analysis.photogenicScore || 0, color: [244, 114, 182] as [number, number, number] },
  ]

  const ringY = 102
  const ringSpacing = (W - M * 2) / 5
  scoreItems.forEach((s, i) => {
    const cx = M + ringSpacing * i + ringSpacing / 2
    const [r, g, b] = s.color
    // Ring track
    pdf.setDrawColor(30, 30, 45)
    pdf.setLineWidth(4)
    pdf.circle(cx, ringY, 14, 'S')
    // Ring fill color
    pdf.setDrawColor(r, g, b)
    pdf.setLineWidth(4)
    pdf.circle(cx, ringY, 14, 'S')
    // Score
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(String(s.value), cx, ringY + 4, { align: 'center' })
    // Label
    pdf.setFontSize(6.5)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(130, 130, 150)
    pdf.text(s.label, cx, ringY + 20, { align: 'center' })
  })

  // Potential score banner
  const bannerY = ringY + 28
  pdf.setFillColor(10, 20, 45)
  pdf.roundedRect(M, bannerY, W - M * 2, 22, 3, 3, 'F')
  pdf.setDrawColor(79, 140, 255)
  pdf.setLineWidth(0.5)
  pdf.roundedRect(M, bannerY, W - M * 2, 22, 3, 3, 'S')
  pdf.setTextColor(79, 140, 255)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ESTIMATED POTENTIAL SCORE', M + 6, bannerY + 7)
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(16)
  pdf.text(`${analysis.estimatedPotentialScore || analysis.potentialScore} / 100`, M + 6, bannerY + 17)
  pdf.setTextColor(100, 100, 130)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  const timeStr = (analysis.estimatedTimeToImprove || 'With consistent effort').replace(/[^\x20-\x7E]/g, '')
  pdf.text(timeStr, W - M - 6, bannerY + 12, { align: 'right' })

  // Priority improvements
  const prioY = bannerY + 30
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Priority Improvements', M, prioY)
  ;(analysis.priorityImprovements || []).slice(0, 5).forEach((p, i) => {
    const py = prioY + 8 + i * 9
    pdf.setFillColor(20, 20, 35)
    pdf.roundedRect(M, py, W - M * 2, 7.5, 2, 2, 'F')
    pdf.setFillColor(79, 140, 255)
    pdf.circle(M + 5, py + 3.8, 2.5, 'F')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.text(String(i + 1), M + 5, py + 5, { align: 'center' })
    pdf.setTextColor(210, 210, 230)
    pdf.setFontSize(7.5)
    pdf.setFont('helvetica', 'normal')
    const clean = p.replace(/[^\x20-\x7E]/g, '').slice(0, 90)
    pdf.text(clean, M + 11, py + 5.2)
  })

  // ─── PAGE 2: DETAILED ANALYSIS ───────────────────────
  pdf.addPage()
  pdf.setFillColor(8, 8, 12)
  pdf.rect(0, 0, W, 297, 'F')
  pdf.setFillColor(79, 140, 255)
  pdf.rect(0, 0, W, 4, 'F')

  y = 13
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Detailed Analysis', M, y)
  pdf.setTextColor(79, 80, 100)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('GetMog Report', W - M, y, { align: 'right' })
  y += 7

  const groups = [
    { title: 'Photo Quality', items: [analysis.photoQuality, analysis.lightingQuality, analysis.blurDetection, analysis.facePosition] },
    { title: 'Skin Analysis', items: [analysis.skinAppearance, analysis.acneDetection, analysis.darkCircleDetection, analysis.wrinkleDetection] },
    { title: 'Facial Features', items: [analysis.eyeAnalysis, analysis.eyebrowAnalysis, analysis.noseAnalysis, analysis.lipAnalysis, analysis.smileAnalysis, analysis.jawlineAnalysis] },
    { title: 'Style and Grooming', items: [analysis.hairAnalysis, analysis.hairStyleCompatibility, analysis.beardCompatibility, analysis.glassesCompatibility, analysis.overallGrooming] },
  ]

  for (const group of groups) {
    if (y > 255) { pdf.addPage(); pdf.setFillColor(8,8,12); pdf.rect(0,0,W,297,'F'); y = 14 }
    drawGroupHeader(pdf, M, y, W - M * 2, group.title)
    y += 12

    const valid = group.items.filter(s => s?.label)
    for (let i = 0; i < valid.length; i += 2) {
      if (y + cardH > 280) { pdf.addPage(); pdf.setFillColor(8,8,12); pdf.rect(0,0,W,297,'F'); y = 14 }
      drawScoreCard(pdf, M, y, cardW, cardH, valid[i].label, valid[i].score || 0, valid[i].observation || '')
      if (valid[i + 1]) {
        drawScoreCard(pdf, M + cardW + 5, y, cardW, cardH, valid[i+1].label, valid[i+1].score || 0, valid[i+1].observation || '')
      }
      y += cardH + 3
    }
    y += 4
  }

  // ─── PAGE 3: RECOMMENDATIONS ─────────────────────────
  pdf.addPage()
  pdf.setFillColor(8, 8, 12)
  pdf.rect(0, 0, W, 297, 'F')
  pdf.setFillColor(167, 139, 250)
  pdf.rect(0, 0, W, 4, 'F')

  y = 13
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Recommendations', M, y)
  y += 8

  const recSections = [
    { title: 'Hairstyles', items: analysis.recommendations?.hairstyles },
    { title: 'Beard Styles', items: analysis.recommendations?.beardStyles },
    { title: 'Skincare Routine', items: analysis.recommendations?.skincare },
    { title: 'Clothing Colors', items: analysis.recommendations?.clothingColors },
    { title: 'Photo Tips', items: analysis.recommendations?.poseTips },
    { title: 'Glasses', items: analysis.recommendations?.glassesStyles },
  ]

  for (const sec of recSections) {
    if (!sec.items?.length) continue
    if (y > 255) { pdf.addPage(); pdf.setFillColor(8,8,12); pdf.rect(0,0,W,297,'F'); y = 14 }
    drawGroupHeader(pdf, M, y, W - M * 2, sec.title)
    y += 11
    sec.items.slice(0, 4).forEach(tip => {
      if (y > 270) return
      const clean = tip.replace(/[^\x20-\x7E]/g, '').slice(0, 100)
      pdf.setFillColor(18, 18, 28)
      pdf.roundedRect(M, y, W - M * 2, 8, 1.5, 1.5, 'F')
      pdf.setFillColor(79, 140, 255)
      pdf.circle(M + 4.5, y + 4, 2, 'F')
      pdf.setTextColor(200, 200, 220)
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'normal')
      pdf.text(clean, M + 9, y + 5.5)
      y += 9.5
    })
    y += 3
  }

  // Roadmap
  if ((analysis.looksmaxRoadmap || []).length > 0 && y < 230) {
    if (y > 200) { pdf.addPage(); pdf.setFillColor(8,8,12); pdf.rect(0,0,W,297,'F'); y = 14 }
    drawGroupHeader(pdf, M, y, W - M * 2, 'Looksmax Roadmap')
    y += 11
    analysis.looksmaxRoadmap.slice(0, 5).forEach(r => {
      if (y > 270) return
      const [er, eg, eb] = r.effort === 'Low' ? [74,222,128] : r.effort === 'Medium' ? [251,191,36] : [248,113,113]
      pdf.setFillColor(15, 18, 30)
      pdf.roundedRect(M, y, W - M * 2, 12, 2, 2, 'F')
      pdf.setFillColor(79, 140, 255)
      pdf.circle(M + 6, y + 6, 4.5, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.text(String(r.priority), M + 6, y + 8, { align: 'center' })
      pdf.setTextColor(240, 240, 255)
      pdf.setFontSize(9)
      pdf.text(r.area, M + 14, y + 6)
      pdf.setTextColor(120, 120, 150)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${r.currentScore} to ${r.potentialScore} pts  |  ${r.timeframe}`, M + 14, y + 10.5)
      pdf.setFillColor(er, eg, eb)
      pdf.roundedRect(W - M - 18, y + 3.5, 16, 5, 2, 2, 'F')
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text(r.effort, W - M - 10, y + 7.5, { align: 'center' })
      y += 14
    })
  }

  // ─── FOOTER on all pages ─────────────────────────────
  const pages = (pdf as any).internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    pdf.setFillColor(12, 12, 20)
    pdf.rect(0, 289, W, 8, 'F')
    pdf.setDrawColor(25, 25, 40)
    pdf.setLineWidth(0.3)
    pdf.line(M, 289.5, W - M, 289.5)
    pdf.setTextColor(60, 60, 80)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text('GetMog  |  Facial Analysis Report  |  getmog.app', M, 294)
    pdf.text(`Page ${i} of ${pages}`, W - M, 294, { align: 'right' })
  }

  pdf.save(`GetMog-${(userName || 'Report').replace(/\s/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
