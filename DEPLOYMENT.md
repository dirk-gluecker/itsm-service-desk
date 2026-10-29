# Desk - ITSM Service Deployment Guide

## ✅ Current Status

### Development Environment (Working)
- **API:** http://localhost:3000/ - Running ✅
- **Frontend:** http://localhost:5173/ - Running ✅
- **Database:** SQLite (`apps/api/prisma/dev.db`) with seed data ✅

### Test Credentials
```
Admin:    admin@itsm.local / Admin123!
Staff:    agent.smith@itsm.local / Staff123!
Customer: john.doe@example.com / Customer123!
```

---

## 🐳 Production Deployment Options

### Option A: Docker Compose (Recommended)

#### Prerequisites
- Docker Engine 24+
- Docker Compose v2+

#### Setup Steps

1. **Clone Repository**
```bash
git clone <repo-url>
cd itsm-service-desk
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your production values
nano .env  # or use your preferred editor
```

Key variables to set:
- `POSTGRES_PASSWORD` - Strong password for PostgreSQL
- `JWT_SECRET` - Minimum 32 character random string
- `CORS_ORIGIN` - Your frontend domain (e.g., https://desk.yourcompany.com)
- `SMTP_*` - Email configuration (optional for MVP)

3. **Build & Start (Development Mode)**
```bash
docker-compose up -d

# View logs
docker-compose logs -f

# Access applications:
# Frontend: http://localhost:3001
# API: http://localhost:3000/api/v1
```

4. **Production Mode (with Nginx)**
```bash
# Build all containers including production frontend
docker-compose build

# Start with Nginx serving static files
docker-compose --profile production up -d

# Access:
# Frontend: http://your-server-ip:80
# API: http://your-server-ip:3000/api/v1
```

#### Important Notes

**Docker Build Issue Known:**
The API Dockerfile currently requires local TypeScript compilation before building:
```bash
# Step 1: Build locally first
cd apps/api && npm run build && cd ../..

# Step 2: Then build Docker image
docker-compose build api
```

This limitation is due to Prisma 7 breaking changes in schema configuration. Future versions will include multi-stage builds with native TypeScript support.

---

### Option B: Manual Deployment

#### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- PM2 or similar process manager

#### Setup Steps

1. **Install Dependencies**
```bash
npm install
cd apps/web && npm install && cd ../..
cd apps/api && npm install && cd ../..
```

2. **Database Setup**
```bash
# Create PostgreSQL database
createdb itsm_db

# Update .env with PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/itsm_db?schema=public"

# Generate Prisma client
cd apps/api && npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

3. **Build Applications**
```bash
# Build API
cd apps/api && npm run build

# Build Frontend
cd apps/web && npm run build
```

4. **Start Services**

Using PM2:
```bash
# Start API
pm2 start apps/api/dist/index.js --name "itsm-api"

# Start Frontend (serve built files)
cd apps/web && pm2 start npm --name "itsm-web" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

Or using systemd services (create `/etc/systemd/system/itsm-api.service`):
```ini
[Unit]
Description=Desk ITSM API
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/itsm-service-desk/apps/api
ExecStart=/usr/bin/node dist/index.js
Environment=NODE_ENV=production
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 🔧 Troubleshooting

### Frontend Errors

If you see import errors in browser console:
```bash
# Clear Vite cache
rm -rf apps/web/node_modules/.vite
cd apps/web && npx vite --host
```

### API Connection Issues

Check if API is running:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

### Database Migration Errors

If migrations fail:
```bash
# Reset database (WARNING: deletes all data!)
cd apps/api/prisma
rm dev.db
rm -rf migrations/
npx prisma migrate dev --name init
npx prisma db seed
```

### Port Conflicts

If ports 3000 or 5173 are in use:
```bash
# Find processes on port 3000
lsof -i :3000

# Kill them
kill -9 <PID>

# Or change PORT in apps/api/.env
```

---

## 📊 Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │ ─────►  │   Nginx      │ ─────►  │   React     │
│  Browser    │ ◄─────  │  (Port 80)   │         │  (Static)   │
└─────────────┘         └──────────────┘         └─────────────┘
                                │
                                │ /api/*
                                ▼
                         ┌──────────────┐         ┌─────────────┐
                         │   Fastify    │ ─────►  │  PostgreSQL │
                         │   (API)      │         │  Database   │
                         └──────────────┘         └─────────────┘
                              ▲   │
                              │   └─ Audit Logs
                              │
                    JWT Auth  │
                    RBAC      │
              └───────────────┘
```

---

## 🛡️ Security Checklist

Before deploying to production:

- [ ] Change all default passwords in `.env`
- [ ] Use strong `JWT_SECRET` (minimum 32 characters, random)
- [ ] Enable HTTPS via reverse proxy (nginx/certbot)
- [ ] Configure CORS for your specific domain
- [ ] Set up database backups
- [ ] Enable SMTP for email notifications
- [ ] Review and restrict admin access
- [ ] Set up monitoring/logging
- [ ] Configure firewall rules
- [ ] Update `NODE_ENV=production`

---

## 🚀 Quick Start Summary

For local development/testing:
```bash
cd /home/ubuntu/itsm-service-desk
cp .env.example .env
npm run docker:up
# Access: http://localhost:3001 (frontend), http://localhost:3000/api/v1 (API)
```

For production deployment:
```bash
# Pre-build API
cd apps/api && npm run build && cd ../..

# Deploy with Docker Compose
docker-compose --profile production up -d

# Check status
docker-compose ps
docker-compose logs -f
```
