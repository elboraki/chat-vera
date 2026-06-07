# syntax=docker/dockerfile:1

# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- Dependencies (prod only) ----------
FROM base AS deps
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Development ----------
FROM base AS dev
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "--watch", "src/index.js"]

# ---------- Production (Cloud Run ready) ----------
FROM base AS prod
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
EXPOSE 8080
USER node
CMD ["node", "src/index.js"]
