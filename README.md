# SkillProof — AI-Powered Skill Validation Engine

## Overview
SkillProof is a senior-level software engineering project designed to automate the validation of technical skills by analyzing source code directly from GitHub. Using high-performance LLMs (Groq/LLAMA-3), it provides developers with data-driven proficiency scores and qualitative feedback.

## Tech Stack
- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express 5 + MongoDB (Mongoose)
- **AI**: Groq API (LLAMA-3)
- **Deployment**: Vercel (Frontend) + Render (Backend)

## Project Structure
```
skillproof/
├── backend/
│   ├── config/         # Environment & DB configuration
│   ├── controllers/    # API Request handlers
│   ├── middleware/     # Auth, RBAC & Global Error handling
│   ├── models/         # Mongoose Schemas & OOP Methods
│   ├── repositories/   # Data access abstraction layer
│   ├── routes/         # Express API route definitions
│   ├── services/       # Core business logic & AI orchestration
│   ├── utils/          # Shared utilities & helpers
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/        # Axios instance & API calls
│   │   ├── components/ # Reusable React components
│   │   ├── context/    # React Context providers
│   │   ├── pages/      # Page components
│   │   ├── App.jsx     # Main app component
│   │   └── main.jsx    # Entry point
│   └── vite.config.js  # Vite configuration
├── docs/               # Architecture documentation
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API Key ([Get one free](https://console.groq.com/keys))

### 1. Clone & Install
```bash
git clone https://github.com/aparajitaks/skillproof.git
cd skillproof

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values:
# - MONGO_URI: Your MongoDB connection string
# - JWT_SECRET: A secure random string
# - GROQ_API_KEY: Your Groq API key
# - CORS_ORIGIN: http://localhost:5173
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env:
# - VITE_API_URL: http://localhost:5001/api
```

### 3. Run Locally
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5001
- **Health Check**: http://localhost:5001/health

---

## Deployment

### Backend → Render

1. **Create a new Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/health`
4. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGO_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: Secure random string
   - `GROQ_API_KEY`: Your Groq API key
   - `CORS_ORIGIN`: Your Vercel frontend URL

### Frontend → Vercel

1. **Import project** on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL + `/api` (e.g., `https://skillproof-api.onrender.com/api`)

### Production Checklist
- [ ] MongoDB Atlas cluster configured with IP whitelist
- [ ] Strong JWT_SECRET (use `openssl rand -hex 64`)
- [ ] CORS_ORIGIN set to exact Vercel URL
- [ ] All environment variables set in both platforms

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/health` | API health check |
| GET | `/api/test` | Test endpoint |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Add new project |
| GET | `/api/profile/:slug` | Public profile |
| GET | `/api/leaderboard` | Leaderboard |

---

## Architecture

### Design Patterns Used
- **Repository Pattern**: Centralized data access logic
- **Dependency Inversion**: Services depend on repository abstractions
- **Encapsulation**: Domain logic within model methods
- **Singleton Pattern**: Services/repositories exported as singletons

### Security Features
- Helmet.js for HTTP headers
- Rate limiting (auth, evaluation, general)
- JWT authentication
- Input validation with Zod
- CORS with whitelist

---

## Scripts

### Backend
```bash
npm run dev     # Development with nodemon
npm start       # Production start
npm run lint    # ESLint
npm run format  # Prettier
```

### Frontend
```bash
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

---

## License
ISC
new change
