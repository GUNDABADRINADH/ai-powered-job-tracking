# AI-Powered Job Tracker 🚀

## Quick Local Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Production Deployment

### 1. Vercel (Frontend)
- Connect GitHub repo to Vercel
- Vercel auto-deploys frontend from root `vercel.json`
- Set `VITE_API_URL` to your Render backend URL

### 2. Render (Backend)
- New Web Service → GitHub repo → `backend/` root
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Vars**:
  ```
  JWT_SECRET=your-very-secure-secret-key-change-this
  NODE_ENV=production
  ```

### API Endpoints (all `/api/*`)
- `POST /auth/login`, `POST /auth/register` (JWT)
- `GET /jobs`, `POST /applications`
- `POST /resume/upload`, `GET /resume`
- `GET /locations/nearby`, `POST /assistant`

## Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS, Zustand, Framer Motion
- **Backend**: Fastify, JSON file store, Google Gemini AI
- **Deployment**: Vercel + Render (serverless ready)

**All APIs & auth fully compatible!**
