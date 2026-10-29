# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Build API
FROM node:20-alpine AS builder-api
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm ci --legacy-peer-deps

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Stage 3: Build Web
FROM node:20-alpine AS builder-web
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm ci --legacy-peer-deps

WORKDIR /app/apps/web
RUN npm run build

# Stage 4: Production API
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy Prisma schema and generated client
COPY --from=builder-api /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder-api /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder-api /app/apps/api/prisma ./apps/api/prisma

# Copy built API
COPY --from=builder-api /app/apps/api/dist ./apps/api/dist
COPY --from=builder-api /app/apps/api/package.json ./apps/api/

# Copy shared types
COPY --from=builder-api /app/packages/shared/zod ./packages/shared/zod

COPY .env.example .env

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
