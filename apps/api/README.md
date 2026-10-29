# ITSM Service Desk API

REST API for the ITSM Service Desk application with JWT authentication, RBAC, and audit logging.

## Tech Stack

- **Framework:** Fastify v5
- **Database:** SQLite (dev) / PostgreSQL (prod-ready)
- **ORM:** Prisma
- **Auth:** JWT (@fastify/jwt)
- **Validation:** Zod (shared schemas)
- **Documentation:** OpenAPI/Swagger

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Initialize Database

```bash
npm run db:push
```

### 4. Seed Database

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Server will be available at `http://localhost:3000`

## API Documentation

Swagger UI is available at: `http://localhost:3000/docs`

## Environment Variables

Create a `.env` file in `apps/api/`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
BASE_URL=http://localhost:3000
```

## API Endpoints (v1)

### Authentication

| Method | Endpoint         | Description                    | Auth Required | Roles              |
|--------|------------------|--------------------------------|---------------|--------------------|
| POST   | `/api/v1/auth/register` | Register new user             | No            | -                  |
| POST   | `/api/v1/auth/login`    | Login and get JWT token       | No            | -                  |
| POST   | `/api/v1/auth/logout`   | Logout (client-side)          | Yes           | All                |
| GET    | `/api/v1/auth/me`       | Get current user info         | Yes           | All                |

### Tickets

| Method | Endpoint         | Description                    | Auth Required | Roles              |
|--------|------------------|--------------------------------|---------------|--------------------|
| GET    | `/api/v1/tickets`        | List tickets (filtered by role)| Yes           | All                |
| GET    | `/api/v1/tickets/:id`    | Get single ticket             | Yes           | All (own for customer) |
| POST   | `/api/v1/tickets`        | Create new ticket             | Yes           | Customer, Staff, Admin |
| PATCH  | `/api/v1/tickets/:id`    | Update ticket                 | Yes           | Staff, Admin       |
| DELETE | `/api/v1/tickets/:id`    | Delete ticket                 | Yes           | Admin              |
| GET    | `/api/v1/tickets/:id/audit` | Get ticket audit logs     | Yes           | All (own for customer) |

### Comments

| Method | Endpoint                   | Description                    | Auth Required | Roles              |
|--------|----------------------------|--------------------------------|---------------|--------------------|
| GET    | `/api/v1/tickets/:id/comments` | Get comments for ticket     | Yes           | All (own for customer) |
| POST   | `/api/v1/tickets/:id/comments` | Add comment to ticket       | Yes           | All (own for customer) |

## Role-Based Access Control (RBAC)

### Roles

- **CUSTOMER**: Can create/view own tickets, add comments (no internal notes)
- **STAFF**: Full ticket management, can view/edit all tickets, internal notes
- **ADMIN**: Full access including user management and ticket deletion

### Permission Matrix

| Action                | CUSTOMER      | STAFF         | ADMIN         |
|-----------------------|---------------|---------------|---------------|
| Create ticket         | ✅ Own only   | ✅ All        | ✅ All        |
| View tickets          | ✅ Own only   | ✅ All        | ✅ All        |
| Edit ticket           | ❌            | ✅ Assigned   | ✅ All        |
| Delete ticket         | ❌            | ❌            | ✅ All        |
| Internal comments     | ❌            | ✅            | ✅            |
| View audit logs       | ✅ Own tickets| ✅ All        | ✅ All        |

## Default Seed Users

After seeding the database:

| Role    | Email                      | Password       |
|---------|----------------------------|----------------|
| Admin   | admin@itsm.local           | Admin123!      |
| Staff   | agent.smith@itsm.local     | Staff123!      |
| Staff   | agent.jones@itsm.local     | Staff123!      |
| Customer| john.doe@example.com       | Customer123!   |
| Customer| jane.smith@example.com     | Customer123!   |

## Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Build
npm run build        # Compile TypeScript
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []  // Optional validation details
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Missing or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource doesn't exist
- `BAD_REQUEST`: Invalid request data
- `VALIDATION_ERROR`: Zod validation failed
- `CONFLICT`: Resource already exists
- `INVALID_CREDENTIALS`: Wrong email/password
