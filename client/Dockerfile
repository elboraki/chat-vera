# syntax=docker/dockerfile:1

# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---------- Development ----------
FROM base AS dev
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Production (nginx, Cloud Run ready) ----------
FROM nginx:alpine AS prod
RUN apk add --no-cache gettext
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.d/40-render-config.sh
RUN chmod +x /docker-entrypoint.d/40-render-config.sh \
 && rm /etc/nginx/conf.d/default.conf
ENV PORT=8080
EXPOSE 8080
# The base nginx image's entrypoint runs everything in /docker-entrypoint.d/
# then execs nginx. Our 40-render-config.sh exec's nginx itself with the
# rendered config — so we override CMD to a no-op safety just in case.
CMD ["nginx", "-g", "daemon off;"]
