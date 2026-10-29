# Prisma Database Setup Guide

## Quick Start (Development - SQLite)

1. **Install dependencies:**
   ```bash
   cd apps/api
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Push schema to SQLite (dev only):**
   ```bash
   npx prisma db push
   ```

4. **Seed the database:**
   ```bash
   npm run db:seed
   ```

5. **Open Prisma Studio (visual DB editor):**
   ```bash
   npx prisma studio
   ```

## Production Setup (PostgreSQL)

1. **Configure DATABASE_URL in `.env`:**
   ```
   DATABASE_URL="postgresql://user:password@host:5432/itsm_db?schema=public"
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   # In production:
   npx prisma migrate deploy
   ```

3. **Seed only on fresh deployments:**
   ```bash
   npm run db:seed
   ```

## Schema Models

### User
- `ADMIN`: Full system access
- `STAFF`: Service desk agents  
- `CUSTOMER`: End users who create tickets

### Ticket
- Status: OPEN → IN_PROGRESS → DONE (optional: CLOSED)
- Priority: LOW, MEDIUM, HIGH, CRITICAL
- Category: INCIDENT, SERVICE_REQUEST, QUERY, OTHER

### Comment
- Public comments visible to all
- Internal notes (`isInternal=true`) only visible to staff/admin

### AuditLog
- Immutable record of all entity changes
- Tracks: action, field, old/new values, actor, timestamp

## Default Credentials (after seeding)

| Role     | Email                      | Password    |
|----------|----------------------------|-------------|
| Admin    | admin@itsm.local           | Admin123!   |
| Staff 1  | agent.smith@itsm.local     | Staff123!   |
| Staff 2  | agent.jones@itsm.local     | Staff123!   |
| Customer 1 | john.doe@example.com     | Customer123!|
| Customer 2 | jane.smith@example.com   | Customer123!|

## Environment Variables

See `.env.example` for full configuration options.

```bash
cp .env.example .env
# Edit .env with your settings
```

## Useful Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Interactive database browser
npx prisma studio

# Create a new migration
npx prisma migrate dev --name <description>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View current schema
npx prisma validate
```
