FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_URL="postgresql://itsm_user:itsm_password@db:5432/itsm?schema=public"

# Install dependencies
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
RUN npm install --legacy-peer-deps && \
    npm uninstall @prisma/client prisma && \
    npm install @prisma/client@5.14.0 prisma@5.14.0 --legacy-peer-deps

# Copy Prisma schema and generate client (uses DATABASE_URL above)
COPY apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema=/app/apps/api/prisma/schema.prisma

# Copy pre-built API dist from local build  
COPY apps/api/dist ./apps/api/dist

# Remove unnecessary dev packages to reduce size  
RUN rm -rf apps/api/node_modules/vitest apps/api/node_modules/@types/vitest apps/api/node_modules/esbuild 2>/dev/null || true

EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
