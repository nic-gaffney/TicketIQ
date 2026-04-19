# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Development ─────────────────────────────────────────────────────────────
FROM base AS development

COPY . .
EXPOSE 5173

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder

COPY . .
RUN npm run build

# ─── Production (served via nginx in docker-compose) ─────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
