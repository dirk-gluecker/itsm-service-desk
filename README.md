# ITSM Service Desk

ITIL-compliant ticket management system for service desk operations.

## Tech Stack

- Language: TypeScript (strict)
- Frontend: React + Vite in `apps/web`
- Backend: Fastify in `apps/api`
- Database: SQLite via Prisma
- Shared types: Zod schemas in `packages/shared`

## Commands

```bash
npm install        # Install dependencies
npm test           # Run unit tests (Vitest)
npm run test:e2e   # Run E2E tests (Playwright)
npm run lint       # Run linter
```

See `AGENTS.md` for development guidelines and team structure.