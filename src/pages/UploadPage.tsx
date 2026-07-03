import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { analyzeFace } from '@/lib/gemini'
import { useAnalysisStore } from '@/store/analysisStore'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { compressImage } from '@/lib/utils'
import { saveAnalysisToCloud } from '@/lib/sync'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Upload, Camera, X, CheckCircle, Lightbulb,
  ArrowRight, Loader2, RotateCcw, FlipHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PHOTO_SLOTS = [
  { id: 'front', label: 'Front', required: true, hint: 'Look straight at camera' },
  { id: 'left', label: 'Left Side', required: true, hint: 'Turn head slightly left' },
  { id: 'right', label: 'Right Side', required: true, hint: 'Turn head slightly right' },
  { id: 'smile', label: 'Smiling', required: false, hint: 'Natural smile' },
  { id: 'neutral', label: 'Neutral', required: false, hint: 'Relaxed expression' },
]

const TIPS = [
  'Remove sunglasses',
  'Even, natural lighting',
  'Face centered in frame',
  'Neutral expression',
  'No heavy filters',
  'Show entire face',
]

export function UploadPage() {
  const navigate = useNavigate()
  const { setCurrentAnalysis, addToHistory, setAnalyzing, isAnalyzing } = useAnalysisStore()
  const { user } = useAuthStore()
  const { avatarUrl } = useProfileStore()
  const [photos, setPhotos] = useState<Record<string, File>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [activeSlot, setActiveSlot] = useState('front')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionLoopRef = useRef<number | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [capturing, setCapturing] = useState(false)
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceInZone, setFaceInZone] = useState(false)

  // Start camera
  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      setCameraReady(false)
      setCapturedPreview(null)
      setFaceDetected(false)
      setFaceInZone(false)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
          startFaceDetection()
        }
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.')
      setMode('upload')
    }
  }, [facingMode])

  const startFaceDetection = useCallback(() => {
    // Use FaceDetector API if available (Chrome/Edge), fallback to canvas heuristic
    const hasFaceDetector = 'FaceDetector' in window

    const detect = async () => {
      const video = videoRef.current
      const overlay = overlayCanvasRef.current
      if (!video || !overlay || video.readyState < 2) {
        detectionLoopRef.current = requestAnimationFrame(detect)
        return
      }

      const vw = video.videoWidth
      const vh = video.videoHeight
      overlay.width = vw
      overlay.height = vh
      const ctx = overlay.getContext('2d')!
      ctx.clearRect(0, 0, vw, vh)

      // Oval guide dimensions (center of frame)
      const cx = vw / 2, cy = vh / 2
      const rx = vw * 0.28, ry = vh * 0.42

      let detected = false
      let inZone = false

      if (hasFaceDetector) {
        try {
          // @ts-ignore — FaceDetector is experimental
          const detector = new window.FaceDetector({ maxDetectedFaces: 1, fastMode: true })
          const faces = await detector.detect(video)
          if (faces.length > 0) {
            detected = true
            const f = faces[0].boundingBox
            const faceCx = f.x + f.width / 2
            const faceCy = f.y + f.height / 2
            // Check if face center is within the oval zone
            const dx = (faceCx - cx) / rx
            const dy = (faceCy - cy) / ry
            inZone = dx * dx + dy * dy < 1.2 && f.width > rx * 0.8
          }
        } catch { detected = false }
      } else {
        // Fallback: assume face present if camera is on (no detection available)
        detected = true
        inZone = true
      }

      setFaceDetected(detected)
      setFaceInZone(detected && inZone)

      // Draw animated oval overlay
      const color = inZone ? '#4F8CFF' : detected ? '#fbbf24' : 'rgba(255,255,255,0.35)'
      const glow = inZone ? 'rgba(79,140,255,0.3)' : 'transparent'

      ctx.save()
      // Glow effect
      if (inZone) {
        ctx.shadowColor = '#4F8CFF'
        ctx.shadowBlur = 18
      }
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = inZone ? 3.5 : 2
      ctx.setLineDash(inZone ? [] : [12, 8])
      ctx.stroke()
      ctx.restore()

      // Corner brackets for style
      const bSize = 28
      const positions = [
        [cx - rx, cy - ry], [cx + rx, cy - ry],
        [cx - rx, cy + ry], [cx + rx, cy + ry],
      ]
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.setLineDash([])
      positions.forEach(([bx, by], i) => {
        ctx.beginPath()
        const sx = i % 2 === 0 ? 1 : -1
        const sy = i < 2 ? 1 : -1
        ctx.moveTo(bx + sx * bSize, by)
        ctx.lineTo(bx, by)
        ctx.lineTo(bx, by + sy * bSize)
        ctx.stroke()
      })

      // Status text
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = color
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 6
      const statusText = inZone ? '✓ Face Detected' : detected ? 'Center your face' : 'No face detected'
      ctx.fillText(statusText, cx, cy + ry + 28)
      ctx.restore()

      if (!capturedPreview) {
        detectionLoopRef.current = requestAnimationFrame(detect)
      }
    }

    detectionLoopRef.current = requestAnimationFrame(detect)
  }, [capturedPreview])

  const stopCamera = useCallback(() => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current)
      detectionLoopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCapturedPreview(null)
    setFaceDetected(false)
    setFaceInZone(false)
  }, [])

  useEffect(() => {
    if (mode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode])

  const flipCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    startCamera(newFacing)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return
    setCapturing(true)
    // Stop detection loop during capture
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current)
      detectionLoopRef.current = null
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')!
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `${activeSlot}.jpg`, { type: 'image/jpeg' })
      const compressed = await compressImage(file)
      const url = URL.createObjectURL(compressed)
      setCapturedPreview(url)
      setCapturing(false)
    }, 'image/jpeg', 0.9)
  }

  const confirmCapture = async () => {
    if (!canvasRef.current || !capturedPreview) return
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `${activeSlot}.jpg`, { type: 'image/jpeg' })
      const compressed = await compressImage(file)
      const url = URL.createObjectURL(compressed)

      setPhotos(p => ({ ...p, [activeSlot]: compressed }))
      setPreviews(p => ({ ...p, [activeSlot]: url }))
      setCapturedPreview(null)

      // Auto advance to next empty required slot
      const next = PHOTO_SLOTS.find(s => s.id !== activeSlot && !photos[s.id])
      if (next) setActiveSlot(next.id)
    }, 'image/jpeg', 0.9)
  }

  const retakePhoto = () => {
    setCapturedPreview(null)
    // Restart detection loop
    setTimeout(() => startFaceDetection(), 100)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setError('')
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.')
      return
    }
    const compressed = await compressImage(file)
    const url = URL.createObjectURL(compressed)
    setPhotos(p => ({ ...p, [activeSlot]: compressed }))
    setPreviews(p => ({ ...p, [activeSlot]: url }))
    const next = PHOTO_SLOTS.find(s => s.id !== activeSlot && !photos[s.id])
    if (next) setActiveSlot(next.id)
  }, [activeSlot, photos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/heic': [], 'image/webp': [] },
    maxFiles: 1,
  })

  const removePhoto = (slotId: string) => {
    setPhotos(p => { const n = { ...p }; delete n[slotId]; return n })
    setPreviews(p => { const n = { ...p }; delete n[slotId]; return n })
  }

  const requiredCount = PHOTO_SLOTS.filter(s => s.required && photos[s.id]).length
  const totalRequired = PHOTO_SLOTS.filter(s => s.required).length
  const canAnalyze = requiredCount === totalRequired

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setError('')
    setAnalyzing(true)
    setProgress(0)
    stopCamera()

    try {
      const files = Object.values(photos)
      const interval = setInterval(() => setProgress(p => Math.min(p + 5, 85)), 600)
      const result = await analyzeFace(files)
      clearInterval(interval)
      setProgress(100)
      setCurrentAnalysis(result)
      const record = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        images: Object.values(previews),
        result,
      }
      addToHistory(record)

      // Sync to Firestore so mobile gets the same data
      if (user) {
        const { analysisHistory } = useAnalysisStore.getState()
        saveAnalysisToCloud(user.uid, result, [record, ...analysisHistory], avatarUrl)
      }
      setTimeout(() => { setAnalyzing(false); navigate('/analysis') }, 500)
    } catch (err: any) {
      setAnalyzing(false)
      setProgress(0)
      setError(err.message || 'Analysis failed. Please try again.')
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Upload Photos</h1>
        <p className="text-white/40 text-sm mt-1">
          {requiredCount}/{totalRequired} required photos added
        </p>
      </div>

      {/* Photo slots */}
      <div className="grid grid-cols-5 gap-2">
        {PHOTO_SLOTS.map(slot => (
          <button
            key={slot.id}
            onClick={() => { setActiveSlot(slot.id); if (mode === 'camera') setCapturedPreview(null) }}
            className={cn(
              'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
              activeSlot === slot.id ? 'border-[#4F8CFF] scale-105' :
              previews[slot.id] ? 'border-green-500/50' : 'border-white/[0.08]'
            )}
          >
            {previews[slot.id] ? (
              <>
                <img src={previews[slot.id]} alt={slot.label} className="w-full h-full object-cover" />
                <button
                  onClick={e => { e.stopPropagation(); removePhoto(slot.id) }}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
                <div className="absolute bottom-0.5 left-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 drop-shadow" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-[#181818] flex flex-col items-center justify-center gap-0.5 p-1">
                <Camera className="w-4 h-4 text-white/20" />
                <span className="text-[9px] text-white/30 text-center leading-tight">{slot.label}</span>
                {slot.required && <span className="text-[8px] text-[#4F8CFF]/60">Required</span>}
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/40 -mt-2">
        Slot: <span className="text-white/70">{PHOTO_SLOTS.find(s => s.id === activeSlot)?.label}</span>
        {' '}— {PHOTO_SLOTS.find(s => s.id === activeSlot)?.hint}
      </p>

      {/* Mode toggle */}
      <div className="flex bg-white/5 rounded-xl p-1 gap-1">
        <button
          onClick={() => setMode('upload')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            mode === 'upload' ? 'bg-[#4F8CFF] text-white' : 'text-white/40 hover:text-white/70'
          )}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <button
          onClick={() => setMode('camera')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            mode === 'camera' ? 'bg-[#4F8CFF] text-white' : 'text-white/40 hover:text-white/70'
          )}
        >
          <Camera className="w-4 h-4" />
          Camera
        </button>
      </div>

      {/* Upload mode */}
      <AnimatePresence mode="wait">
        {mode === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                isDragActive ? 'border-[#4F8CFF] bg-[#4F8CFF]/5' : 'border-white/10 hover:border-white/20 bg-[#181818]'
              )}
            >
              <input {...getInputProps()} />
              <div className="py-10 px-6 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-white/30" />
                </div>
                <p className="text-sm font-medium text-white/70 mb-1">
                  {isDragActive ? 'Drop photo here' : 'Tap or drag to upload'}
                </p>
                <p className="text-xs text-white/30">PNG, JPG, JPEG, HEIC · Max 10MB</p>
              </div>
            </div>

            {/* Mobile file input */}
            <label className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 cursor-pointer hover:bg-white/8 transition-all">
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const compressed = await compressImage(file)
                  const url = URL.createObjectURL(compressed)
                  setPhotos(p => ({ ...p, [activeSlot]: compressed }))
                  setPreviews(p => ({ ...p, [activeSlot]: url }))
                  e.target.value = ''
                }}
              />
              <Camera className="w-4 h-4 text-white/50" />
              <span className="text-sm font-medium text-white/60">Take Photo with Camera</span>
            </label>

            {/* Tips */}
            <Card padding="md">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white/70 mb-2">Tips for best results</p>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-3">
                    {TIPS.map(tip => (
                      <div key={tip} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-amber-400/50 flex-shrink-0" />
                        <span className="text-xs text-white/40">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Camera viewport */}
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] w-full">
              {/* Live preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'w-full h-full object-cover',
                  facingMode === 'user' ? '-scale-x-100' : '',
                  capturedPreview ? 'hidden' : 'block'
                )}
              />

              {/* Captured preview */}
              {capturedPreview && (
                <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover" />
              )}

              {/* Hidden capture canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Face detection overlay canvas */}
              {!capturedPreview && cameraReady && (
                <canvas
                  ref={overlayCanvasRef}
                  className={cn(
                    'absolute inset-0 w-full h-full pointer-events-none',
                    facingMode === 'user' ? '-scale-x-100' : ''
                  )}
                  style={{ mixBlendMode: 'normal' }}
                />
              )}

              {/* Status badge */}
              {!capturedPreview && cameraReady && (
                <div className={cn(
                  'absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-all',
                  faceInZone
                    ? 'bg-[#4F8CFF]/20 border border-[#4F8CFF]/50 text-[#4F8CFF]'
                    : faceDetected
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                    : 'bg-white/10 border border-white/20 text-white/60'
                )}>
                  {faceInZone ? '✓ Ready to capture' : faceDetected ? 'Center your face in the oval' : 'Position face in oval'}
                </div>
              )}

              {/* Loading state */}
              {!cameraReady && !capturedPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-white/50 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-white/40">Starting camera...</p>
                  </div>
                </div>
              )}

              {/* Slot label */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
                <p className="text-xs font-semibold text-white">
                  {PHOTO_SLOTS.find(s => s.id === activeSlot)?.label}
                </p>
              </div>

              {/* Flip button */}
              {!capturedPreview && (
                <button
                  onClick={flipCamera}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all active:scale-95"
                >
                  <FlipHorizontal className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Camera controls */}
            {!capturedPreview ? (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={flipCamera}
                  className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                >
                  <RotateCcw className="w-5 h-5 text-white/70" />
                </button>

                {/* Shutter button */}
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady || capturing}
                  className={cn(
                    'w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95',
                    cameraReady && !capturing ? 'bg-white hover:bg-white/90' : 'bg-white/30 cursor-not-allowed'
                  )}
                >
                  {capturing ? (
                    <Loader2 className="w-7 h-7 text-black animate-spin" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-black/10" />
                  )}
                </button>

                <button
                  onClick={() => setMode('upload')}
                  className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                >
                  <Upload className="w-5 h-5 text-white/70" />
                </button>
              </div>
            ) : (
              /* Confirm / retake */
              <div className="flex gap-3">
                <Button variant="secondary" onClick={retakePhoto} className="flex-1" icon={<RotateCcw className="w-4 h-4" />}>
                  Retake
                </Button>
                <Button onClick={confirmCapture} className="flex-1" icon={<CheckCircle className="w-4 h-4" />}>
                  Use Photo
                </Button>
              </div>
            )}

            {/* Slot selector for camera mode */}
            <div className="grid grid-cols-5 gap-1.5">
              {PHOTO_SLOTS.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => { setActiveSlot(slot.id); setCapturedPreview(null) }}
                  className={cn(
                    'py-2 rounded-lg text-[10px] font-medium transition-all border',
                    activeSlot === slot.id
                      ? 'bg-[#4F8CFF] text-white border-[#4F8CFF]'
                      : previews[slot.id]
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-white/5 text-white/40 border-white/10'
                  )}
                >
                  {previews[slot.id] ? '✓' : slot.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
          >
            <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze button */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <p className="text-sm text-white/30">
          {canAnalyze
            ? `${Object.keys(photos).length} photo${Object.keys(photos).length > 1 ? 's' : ''} ready`
            : `${totalRequired - requiredCount} more required`}
        </p>
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          loading={isAnalyzing}
          size="lg"
          icon={!isAnalyzing ? <ArrowRight className="w-4 h-4" /> : undefined}
        >
          {isAnalyzing ? `Analyzing ${progress}%` : 'Analyze'}
        </Button>
      </div>

      {/* Analysis overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#181818] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-[#4F8CFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-8 h-8 text-[#4F8CFF] animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Analyzing Your Photos</h3>
              <p className="text-sm text-white/40 mb-5">
                Examining your facial features and preparing personalized recommendations...
              </p>
              <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                <motion.div
                  className="h-2 bg-[#4F8CFF] rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-white/30">{progress}% complete</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
