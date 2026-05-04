# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Development ─────────────────────────────────────────────────────────────
FROM base AS development

# Outside /app so `docker compose` bind-mount of ./frontend:/app cannot shadow this script.
COPY docker-entrypoint-dev.sh /docker-entrypoint-dev.sh
RUN chmod +x /docker-entrypoint-dev.sh

COPY . .
EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint-dev.sh"]
CMD ["npm", "run", "dev"]

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Production (standalone) ────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
