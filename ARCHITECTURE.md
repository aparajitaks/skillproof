# SkillProof System Architecture

SkillProof is designed using a robust 3-tier architecture, emphasizing strict separation of concerns, high observability, and predictable outcomes for AI-integrated systems. This document outlines the rationale behind the architectural patterns chosen for a production-grade application.

## Core Principles

1. **Separation of Concerns (MVC-Service Pattern):** The backend is modular. Routes map strictly to Controllers. Controllers handle only HTTP I/O (req/res, status codes). Business logic, DB orchestrations, and AI invocations happen purely in the `services/` layer.
2. **Fail Fast:** Environment configuration is validated vigorously on boot (`config/env.js` with `zod`). Missing keys throw immediately, avoiding silent background failures later.
3. **Observability First:** We use `pino` for structured JSON logging. All requests, errors, AI metrics (latency, token usage, confidence scores) are logged deterministically.
4. **Resilient Integrations:** LLM API integration (`aiService.js`) uses explicit retries, exponential backoffs, timeouts, and a fallback state (`FALLBACK_EVALUATION`). This safeguards the system against upstream AI instability.

## Component Breakdown

### API Layer (`controllers/` & `routes/`)
- All incoming requests hit Express.
- Cross-cutting concerns (authentication, authorization, request parsing, standardized API responses) are handled via `middleware/`.
- All payloads are strictly validated using `zod` via `middleware/validators/zodValidation.js` before reaching controllers.
- Routes are wrapped with `asyncHandler`, completely removing boilerplate `try/catch` from the codebase while ensuring asynchronous errors bubble to the centralized `errorMiddleware`.

### Business Layer (`services/`)
- The `projectService` owns the lifecycle of a Project entity (pending -> processing -> evaluated / failed).
- The `aiService` is stateless and owns purely the interaction with Groq SDK to return a guaranteed JSON shape.
- Deterministic scoring (`utils/scoreCalculator.js`) guarantees that final scoring is controlled on the server using stable weights, making the AI's role purely consultative on sub-metrics.

### Data Layer (`models/`)
- MongoDB (via Mongoose).
- `Project.js` relies on an embedded `evaluationSchema` and tracks `evaluationHistory` to support a versioned append-only audit log.
- Complex queries (e.g., getting average scores, finding top users by tech stack) are handled efficiently using Mongoose aggregations combined with Compound Indexes (`{ status: 1, finalScore: -1 }`).

### Frontend Layer (React + Vite)
- The React application is built around single-page navigation.
- Component state is isolated. A robust API abstraction layer `src/api` centralizes all `axios` calls and implements automatic token enrichment and globally catches 401 Unauthorized responses to purge local state.
- UI Polish focuses on the user experience leveraging Skeleton loaders for async data, Toasts (`react-hot-toast`) for optimistic UI success/error rendering, and Error Boundaries for component crash safety.

---

This architecture prevents circular dependencies, allows distinct scaling vectors (i.e. replacing MongoDB with Postgres requires changing only the `models/` layer, swapping Groq for OpenAI requires changing only `aiService.js`), and focuses significantly on developer experience and production robustness over rapid messy iterations.
