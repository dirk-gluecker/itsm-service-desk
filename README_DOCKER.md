# Desk — ITSM Service Desk

ITIL-compliant ticket management system for service desk operations.

## Tech Stack

- **Language:** TypeScript (strict)
- **Frontend:** React + Vite in `apps/web`
- **Backend:** Fastify in `apps/api`
- **Database:** PostgreSQL (Production), SQLite (Development)
- **ORM:** Prisma
- **Shared Types:** Zod schemas in `packages/shared`
- **Tests:** Vitest (unit), Playwright (E2E)

## Quick Start — Docker Compose

### Development Mode

```bash
# Clone repo
git clone <repo-url>
cd itsm-service-desk

# Copy environment file
cp .env.example .env

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access applications:
# Frontend: http://localhost:3001
# API: http://localhost:3000/api/v1
```

### Production Deployment

```bash
# Build production containers
docker-compose build

# Start with Nginx frontend (production mode)
docker-compose --profile production up -d

# Access applications:
# Frontend: http://localhost (Nginx serving static files + proxying /api)
# API: http://localhost:3000/api/v1
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database!)
docker-compose down -v
```

## Manual Development (without Docker)

### Prerequisites

- Node.js 20+
- npm or yarn
- SQLite (dev) / PostgreSQL (prod)

### Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client
cd apps/api && npx prisma generate && cd ../..

# Run database migrations
cd apps/api && npx prisma migrate dev && cd ../..

# Seed database
cd apps/api && npx prisma db seed && cd ../..

# Start backend (Terminal 1)
cd apps/api && npm run dev

# Start frontend (Terminal 2)
cd apps/web && npm run dev

# Access:
# Frontend: http://localhost:5173
# API: http://localhost:3000/api/v1
```

## Test Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@itsm.local | Admin123! |
| Staff | agent.smith@itsm.local | Staff123! |
| Customer | john.doe@example.com | Customer123! |

## Project Structure

```
itsm-service-desk/
├── apps/
│   ├── api/           # Fastify backend
│   │   ├── src/       # TypeScript source
│   │   ├── prisma/    # Database schema & migrations
│   │   └── dist/      # Compiled output
│   └── web/           # React frontend
│       ├── src/       # TypeScript source
│       └── dist/      # Static build
├── packages/
│   └── shared/        # Shared types & components
├── docker-compose.yml
├── Dockerfile         # Backend multi-stage build
├── Dockerfile.web     # Frontend multi-stage build
└── nginx.conf         # Production Nginx config
```

## Environment Variables

See `.env.example` for full list. Key variables:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<32+ character secret>
SMTP_HOST=smtp.example.com
CORS_ORIGIN=http://localhost:3001
```

## Available Scripts

```bash
npm run test              # Run unit tests
npm run test:e2e          # Run E2E tests
npm run lint              # Lint code
npm run docker:up         # Start Docker services
npm run docker:prod       # Start production deployment
```

## Security Notes

- Change all default passwords in `.env` before production
- Use strong JWT_SECRET (minimum 32 characters)
- Enable HTTPS in production (add SSL/TLS termination via reverse proxy)
- Configure SMTP properly for email notifications
- Review and update CORS_ORIGIN for your domain
