# SkillProof — AI-Powered Skill Validation Engine (Milestone-1)

## Problem Statement
In the modern software engineering landscape, traditional resumes fail to provide proof of actual technical proficiency. Recruiters struggle to filter candidates based on true skill depth, while developers lack a centralized, verifiable way to showcase their project-based competence.

## Solution
SkillProof automates technical skill validation by analyzing a developer's actual source code. By integrating directly with GitHub and using advanced LLM-based evaluation, SkillProof provides a detailed, data-driven score and qualitative feedback for projects, turning static code into verifiable proof of skill.

## Scope
- **Automated Code Analysis**: Direct integration with GitHub repositories to fetch source code.
- **AI-Driven Evaluation**: Multi-dimensional scoring (Clean Code, Performance, Security, Tech Stack usage).
- **Verifiable Identity**: Role-based system for Students (Developers) and Recruiters.
- **Clean Architecture**: A robust backend designed for scalability and semester-long maintenance.

## Core Features
1. **GitHub Context Extraction**: Service-layer logic to pull and preprocess repository code.
2. **AI Orchestration**: Integration with Groq (LLM) for high-speed, intelligent project evaluation.
3. **Layered Backend Architecture**: Strict separation of concerns using Controllers, Services, Repositories, and Models.
4. **JWT Security & RBAC**: Secure authentication with role-based authorization for different system actors.
5. **Leaderboard & Talent Search**: Publicly verifiable profiles and searchability for recruiters.

## Tech Stack
- **Backend**: Node.js, Express.js (Clean Architecture).
- **Database**: MongoDB (Mongoose) for flexible evaluation data storage.
- **AI**: Groq API (LLAMA-3) for evaluation logic.
- **Infrastructure**: GitHub API for code fetching.

## Backend Architecture (Milestone-1)
- **Controller Layer**: [controllers/](file:///Users/galaxy_grid/Acads/Projects/dev/skillproof/backend/controllers) — Pure request/response handling.
- **Service Layer**: [services/](file:///Users/galaxy_grid/Acads/Projects/dev/skillproof/backend/services) — Orchestrates business logic and AI flows.
- **Repository Layer**: [repositories/](file:///Users/galaxy_grid/Acads/Projects/dev/skillproof/backend/repositories) — Abstracts database queries (Repository Pattern).
- **Model Layer**: [models/](file:///Users/galaxy_grid/Acads/Projects/dev/skillproof/backend/models) — Defines data structure and OOP relationships.
- **Middlewares**: [middlewares/](file:///Users/galaxy_grid/Acads/Projects/dev/skillproof/backend/middlewares) — Centralized auth and validation.
