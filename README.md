<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Groq_AI-FF6B6B?style=for-the-badge&logo=groq&logoColor=white" />
</div>

<h1 align="center">SkillProof - AI-Powered Developer Portfolio Evaluator</h1>

SkillProof is a full-stack SaaS application built to evaluate open-source software projects. By submitting a GitHub repository URL and a brief description, the Groq LLM analyzes architecture, code quality, and real-world impact to generate deterministic developer scores and professional resume bullets.

This project demonstrates scalable backend architecture, LLM API integration, deterministic evaluation pipelines, and a modern frontend dashboard.

---

## Key Features

- **Automated AI Project Evaluation:** Submits project details to Groq LLM to generate normalized scores across five dimensions (Architecture, Scalability, Code Quality, Innovation, Impact).
- **Deterministic Scoring Engine:** Uses a server-calculated weighted algorithm to ensure stable and reproducible 0–100 global scores.
- **Robust API with JWT Authentication:** Express-based REST API using Zod for validation, jsonwebtoken for stateless authentication, and rate-limiting for abuse prevention.
- **Company-Fit Analysis:** Calculates role-fit percentages for enterprise, startup, and big-tech roles.
- **Global Leaderboard:** Uses MongoDB compound indexes for efficient aggregation and ranking.
- **Modern React Dashboard:** Built with Vite, React Router DOM, Recharts, and skeleton loaders for improved user experience.

---

## System Architecture (MVC-S)

The backend follows a strict Model-View-Controller-Service structure.

### Routing Layer (`/routes`)
Maps HTTP verbs to controllers.

### Controller Layer (`/controllers`)
Handles HTTP context and delegates business logic to services.  
Wrapped with `asyncHandler` to remove repetitive try/catch blocks.

### Service Layer (`/services`)
Contains core business logic.

- `projectService.js` – Handles MongoDB transactions and evaluation logic.
- `aiService.js` – Manages Groq LLM integration with:
  - Exponential backoff retries
  - Deterministic fallback state if the LLM fails

### Validation & Observability
- Zod schema validation for incoming payloads
- Structured Pino logging for observability

---

## Local Development Setup

### Requirements

- Node.js 20+
- MongoDB (Local or Atlas)
- Groq API Key

---

### 1. Clone Repository

```bash
git clone https://github.com/your-username/skillproof.git
cd skillproof
```

---

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Inside `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb+srv://pragyaksingh4_db_user:Lsa75goIAxfl5Guv@cluster0.okqbmpg.mongodb.net/?appName=Cluster0
JWT_SECRET=e98a124772e66711058845ceddd0bbc1692615564de7b87eef56c3a983344115afdb20607e827831568079ba578f87c1f3347c16f7ee93e8a709daf2935bb9a1
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

```

---

### 3. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

### 4. Run Full Stack

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```

Application runs at:

```
http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/projects` | Yes | Submit project for AI evaluation |
| GET | `/api/projects` | Yes | Get user projects |
| GET | `/api/projects/:id` | Yes | Get project evaluation |
| GET | `/api/leaderboard` | No | Global leaderboard |

---

## Fix: MongoDB ECONNREFUSED / Connection Refused

If MongoDB Compass disconnects or shows:

```
ECONNREFUSED
```

It means `mongod` is not running on port `27017`.

### Check if MongoDB is running

```bash
ps aux | grep mongod
```

### Check if port 27017 is active

```bash
netstat -an | grep 27017
```

If nothing appears, MongoDB is not running.

### Start MongoDB

```bash
mongod --dbpath ~/mongodb-data
```

Replace `~/mongodb-data` with your actual data directory.

### If MongoDB will not start

Kill stuck processes:

```bash
pkill mongod
```

Then restart `mongod`.

Once running on:

```
127.0.0.1:27017
```

MongoDB Compass should connect successfully.

---

## Future Roadmap

- Redis caching for leaderboard endpoint
- GitHub OAuth for one-click login
- Stripe billing with usage-based quotas

---

## Author

Built using production-grade backend architecture and defensive LLM engineering principles.
