# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Don't run as root
RUN addgroup -S skillproof && adduser -S skillproof -G skillproof

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chown -R skillproof:skillproof /app
USER skillproof

EXPOSE 5001

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5001/health || exit 1

CMD ["node", "server.js"]
