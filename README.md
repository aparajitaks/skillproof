<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Groq_AI-FF6B6B?style=for-the-badge&logo=groq&logoColor=white" />
</div>

<h1 align="center">SkillProof - AI-Powered Developer Portfolio Evaluator</h1>

**SkillProof** is a full-stack SaaS application built to evaluate open-source software projects. By simply submitting a GitHub repository URL and a brief description, the underlying **Groq LLM** instantly analyzes the architecture, code quality, and real-world impact to generate deterministic developer scores and professional resume bullets.

This project was built to demonstrate proficiency in scalable backend architecture, LLM API integration, deterministic machine learning evaluation pipelines, and robust frontend design.

---

## ⚡ Key Features

- **Automated AI Project Evaluation:** Submits project details to Groq LLM to yield normalized scores across 5 dimensions (Architecture, Scalability, Code Quality, Innovation, Impact).
- **Deterministic Scoring Engine:** Employs a server-calculated weighted algorithm over raw AI outputs to ensure that all 0–100 global scores remain stable and reproducible across evaluations.
- **Robust API with JWT Auth:** A strictly typed RESTful API built on Express utilizing `Zod` for payload validation, `jsonwebtoken` for stateless auth, and rate-limiting to prevent abuse.
- **Company-Fit Analysis:** Calculates percentage fit for enterprise, startup, or big-tech roles based on technical stacks and architectural decisions.
- **Global Leaderboard:** Utilizes MongoDB compound indexes to rapidly aggregate and sort top-performing developers globally.
- **Modern React Dashboard:** Built with Vite, using React Router DOM for single-page routing, Recharts for dynamic radar charts, and asynchronous Skeleton loaders for polished UI UX.

---

## 🏗️ System Architecture & Engineering Decisions

To ensure production-grade reliability, the backend eschews rapid-prototyping spaghetti code in favor of a strict **MVC-S (Model-View-Controller-Service) architecture**:

1. **Routing Layer (`/routes`)**: Purely maps HTTP verbs to controllers.
2. **Controller Layer (`/controllers`)**: Manages HTTP context, extracts parameters, and normalizes output shapes via a centralized `responseHandler`. All routes are cleanly wrapped in `asyncHandler` to eliminate repetitive `try/catch` boilerplate.
3. **Service Layer (`/services`)**: The core brain. 
   - `projectService.js` handles MongoDB transactions and core business logic.
   - `aiService.js` manages LLM interactions. Because AI APIs often throttle or fail, this layer implements **exponential backoff retries** and automatic degradation to a deterministic "fallback state" if the LLM crashes. This ensures the app never throws unhandled exceptions.
4. **Validation & Observability**: Every incoming request payload is scanned by **Zod** schema validators before execution. All system actions are logged using structured **Pino JSON logging** for scalable observability.

---

## ⚙️ Local Development Setup

To run this application locally, you will need **Node.js 20+**, **MongoDB** (local daemon or Atlas cluster), and a free **Groq API Key**.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/skillproof.git
cd skillproof
```

### 2. Configure Environment Variables
Copy the example environment file in the backend directory:
```bash
cp backend/.env.example backend/.env
```
Inside `backend/.env`, populate the variables:
```env
PORT=5001
CORS_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/skillproof # Or your Atlas URL
JWT_SECRET=your_super_secret_jwt_signature_key
GROQ_API_KEY=gsk_your_groq_api_token_here
NODE_ENV=development
```

### 3. Install Dependencies
Install packages for both the backend and frontend at the same time:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run the Full Stack
Open two terminal instances.

**Terminal 1 (Backend API):**
Runs heavily optimized nodemon with live-reload.
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend UI):**
Bootstraps the Vite dev server.
```bash
cd frontend
npm run dev
```

The application will now be running at **`http://localhost:5173`**.

---

## 🐳 Running with Docker

If you have Docker installed, you can skip local dependency management and spin up the entire cluster (MongoDB + Node API) instantly.

```bash
docker-compose up --build
```
*Note: The frontend currently runs separately out-of-container for development ease, or you can build it static via `npm run build`.*

---

## 📚 API Endpoint Reference

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Registers a new user, hashes password via bcrypt |
| `POST` | `/api/auth/login` | No | Authenticates user and returns a signed JWT |
| `GET` | `/api/auth/me` | Yes (`Bearer`) | Fetches the current authenticated user profile |
| `POST` | `/api/projects` | Yes | Submits a project repository for AI Evaluation |
| `GET` | `/api/projects` | Yes | Retrieves list of projects submitted by user |
| `GET` | `/api/projects/:id` | Yes | Retrieves deep AI review dimensions for a specific ID |
| `GET` | `/api/leaderboard` | No | Fetches a paginated, sorted list of highest-scoring devs|

---

## 🚀 Learnings & Future Roadmap

Building this project sharpened my understanding of asynchronous error boundary handling, stateless API design, and defensive LLM engineering. 

**Upcoming Features:**
- **Redis Caching:** Implement caching for the `/leaderboard` endpoint to drastically reduce identical MongoDB aggregation queries on hot paths.
- **GitHub OAuth:** Replace email/password login with one-click GitHub SSO, simultaneously auto-fetching the user's repository list to simplify the insertion pipeline.
- **Stripe Billing:** Introduce usage quotas and tiered token subscriptions.
