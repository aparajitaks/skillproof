# SkillProof Deployment Guide

This guide covers deploying the SkillProof full-stack application for production or staging environments.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed locally or on the deployment server
- [Docker Compose](https://docs.docker.com/compose/install/)
- MongoDB URI (if not using the local container provisioned by compose)
- Groq API Key
- Optional: A domain mapped to your server's IP address

---

## 🚀 1. Quick Start Locally (Development & Testing)

The easiest way to boot up the entire backend stack locally is to run Docker Compose at the root of the project.

```bash
docker-compose up --build
```

This starts:
- **MongoDB** container running on `localhost:27017`
- **Node.js API** running on `localhost:5001` configured to connect to the DB

Ensure your `backend/.env` file is present containing your `JWT_SECRET` and `GROQ_API_KEY`.

---

## 🛠 2. Production Deployment (VPS / Ubuntu Server)

### Step 1: Clone and Configure

1. SSH into the production server.
2. Clone the repository.
3. Configure the `.env` files in both `backend` and `frontend` securely with production targets.
   - Set `NODE_ENV=production` on the backend.
   - Set `CORS_ORIGIN=https://yourdomain.com` on the backend.
   - Set `VITE_API_URL=https://api.yourdomain.com/api` on the frontend.

### Step 2: Build the Backend Container

Using the provided robust multi-stage `Dockerfile`:

```bash
cd backend
docker build -t skillproof-backend:latest .
docker run -d -p 5001:5001 --env-file .env skillproof-backend:latest
```

*Note:* In production, it is highly recommended to manage the container lifecycle through Docker Compose or a Container Orchestration platform (e.g., Kubernetes, AWS ECS) instead of a simple `docker run`.

### Step 3: Serve the Frontend

SkillProof’s frontend is built via Vite as a static Single Page Application (SPA).

1. Cd into the frontend
2. Install dependencies & build:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
3. The resulting `dist/` directory can be deployed cheaply and efficiently via Vercel, Netlify, or served from S3/CloudFront. Alternatively, you can serve it via NGINX.

## Healthchecks & Observability
- **Health Endpoint**: The backend serves a `/health` endpoint to monitor uptime and db connection status.
- **Pino Logs**: The backend prints high-performance structured JSON logs. Forward these logs to services like Datadog, ELK, or Cloudwatch for observability.
- **Graceful Shutdown**: The service captures SIGTERM and SIGINT events to close down DB connections safely before exiting, ensuring zero-downtime rolling deployments when using orchestrators.
