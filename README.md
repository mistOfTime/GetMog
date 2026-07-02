# GetMog — Facial Analysis Platform

> Upload your photos. Get real feedback on grooming, style, and presentation.

![GetMog Banner](public/mog.png)

---

## 🚀 Live Demo

> **[getmog.vercel.app](https://getmog.vercel.app)** ← deploy to Vercel to get this link

---

## ✨ Features

### 📊 Core Analysis
- **Presentation Score** — Overall appearance score based on visible features
- **Potential Score** — Estimated score after implementing recommendations
- **Facial Symmetry Score** — Symmetry analysis from uploaded photos
- **Golden Ratio Score** — Facial proportion analysis
- **Photogenic Score** — How well features translate to photos
- **Confidence & Professional Scores**

### 🔬 Detailed Analysis (30+ Categories)
- Photo Quality, Lighting, Blur Detection, Face Position
- Skin Appearance, Acne, Dark Circles, Wrinkles
- Eyes, Eyebrows, Nose, Lips, Smile, Jawline
- Hair, Hairline, Hairstyle Compatibility
- Beard & Glasses Compatibility
- Professional & Casual Appearance

### 🎯 Looksmax Roadmap
- Personalized priority improvement plan
- Effort level (Low / Medium / High) per category
- Estimated score gain and timeframe
- Step-by-step action items

### 💬 True Adam — Your Assistant
- Personal AI looks coach
- Answers questions about your grooming, style, and presentation
- Context-aware — updates based on your latest analysis
- Shows score changes between sessions

### 📈 Progress Tracking
- Full analysis history
- Score trend chart
- Before vs. After radar comparison
- Session-by-session improvement tracking

### 📄 PDF Report
- Professional 3-page report
- Profile photo on cover page
- All analysis cards with scores
- Recommendations & roadmap
- Downloadable as `GetMog-[Name]-[Date].pdf`

### 📸 Smart Camera
- Live camera capture with face detection overlay
- Oval guide turns **blue** when face is correctly positioned
- Front/back camera flip
- Multi-angle photo slots (Front, Left, Right + optional)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 + custom design system |
| Animations | Framer Motion |
| Routing | React Router v7 |
| State | Zustand (with localStorage persistence) |
| Forms | React Hook Form + Zod |
| Charts | Recharts + Chart.js (Radar) |
| PDF | jsPDF |
| Auth | Firebase Authentication |
| Database | Firestore |
| AI | Google Gemini 2.5 Flash (via Hono proxy server) |
| Backend | Hono + Node.js (API key proxy) |
| Camera | Web MediaDevices API + FaceDetector API |

---

## 📁 Project Structure

```
getmog/
├── src/
│   ├── components/
│   │   ├── auth/          # Sign in, Sign up, Forgot password
│   │   ├── layout/        # Sidebar, MobileNav, MobileHeader
│   │   └── ui/            # Button, Card, Input, ScoreRing, ProgressBar, Logo
│   ├── pages/
│   │   ├── LandingPage    # Auth modal on blurred background
│   │   ├── Dashboard      # Overview, quick actions, scores
│   │   ├── UploadPage     # Camera + file upload with face detection
│   │   ├── AnalysisPage   # Full results with 4 tabs
│   │   ├── ChatPage       # True Adam AI assistant
│   │   ├── ProgressPage   # History, radar chart, trend graph
│   │   └── SettingsPage   # Profile, password, avatar
│   ├── lib/
│   │   ├── gemini.ts      # Gemini API integration + normalization
│   │   ├── exportPdf.ts   # Professional PDF report generator
│   │   └── utils.ts       # Helpers, image compression
│   └── store/
│       ├── authStore.ts   # Firebase auth state
│       ├── analysisStore  # Analysis results + history
│       └── profileStore   # Avatar (base64 localStorage)
└── server/
    └── index.ts           # Hono proxy — keeps Gemini API key server-side
```

---

## ⚙️ Setup

### 1. Clone
```bash
git clone https://github.com/mistOfTime/GetMog.git
cd GetMog
```

### 2. Install frontend dependencies
```bash
cd faceiq-ai
npm install
```

### 3. Install backend dependencies
```bash
cd server
npm install
```

### 4. Configure environment variables

**`faceiq-ai/.env`**
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```

**`faceiq-ai/server/.env`**
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 5. Firebase setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password + Google
3. Create **Firestore** database (test mode)
4. Copy config values to `.env`

### 6. Gemini API key
Get your key from [Google AI Studio](https://aistudio.google.com/apikey)

### 7. Run

**Terminal 1 — Backend**
```bash
cd faceiq-ai/server
npm run dev
```

**Terminal 2 — Frontend**
```bash
cd faceiq-ai
npm run dev
```

Open **http://localhost:5173**

---

## 🌐 Deploy

### Vercel (Frontend)
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Set root directory to `faceiq-ai`
4. Add all `VITE_*` environment variables
5. Deploy

### Railway (Backend)
1. New project → Deploy from GitHub
2. Set root directory to `faceiq-ai/server`
3. Add `GEMINI_API_KEY` and `FRONTEND_URL` env vars
4. Deploy → copy the Railway URL
5. Update `VITE_API_URL` in Vercel to the Railway URL

---

## 📸 Live Preview

> To add a live demo GIF/video to this README:
> 1. Record your screen using [OBS](https://obsproject.com/) or Windows Game Bar (`Win+G`)
> 2. Convert to GIF using [Ezgif](https://ezgif.com/video-to-gif) (keep under 10MB)
> 3. Upload the GIF to the repo and add it here:
>
> ```markdown
> ![Demo](demo.gif)
> ```

---

## 🔒 Security

- Gemini API key is **never** exposed to the browser — all AI calls go through the Hono proxy server
- Firebase Auth handles all authentication
- Images are processed client-side and never stored without user action

---

## 📄 License

MIT — free to use and modify.

---

Built with ❤️ by **mistOfTime**
