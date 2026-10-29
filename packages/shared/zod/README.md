# Zod Schemas

## Overview

This package contains Zod schemas that serve as the **single source of truth** for all API contracts in the ITSM Service Desk application.

## Structure

All schemas are defined in `index.ts` and exported for use across the monorepo:

### Core Entities

- **UserSchema** - User entity with id, email, password_hash, role, timestamps
- **TicketSchema** - Ticket entity with status, priority, category, assignee relations
- **CommentSchema** - Comment entity with internal/external visibility flag
- **AuditLogSchema** - Immutable audit trail for all ticket changes

### Enums

- `RoleEnum` - END_USER | AGENT | ADMIN
- `StatusEnum` - open | in_progress | done
- `CategoryEnum` - incident | service_request
- `PriorityEnum` - low | medium | high | critical
- `ActionEnum` - create | update | delete | assign | comment

### Authentication

- `LoginRequestSchema` - Email + password login
- `RegisterRequestSchema` - New user registration with password validation
- `AuthResponseSchema` - JWT token + user info response
- `RefreshTokenRequestSchema` - Token refresh flow

### Request/Response Schemas

- `TicketCreateRequestSchema` - New ticket creation
- `TicketUpdateRequestSchema` - Staff-only ticket modification
- `TicketListQuerySchema` - Pagination and filter params
- `CommentCreateRequestSchema` - Comment posting
- `PaginatedResponseSchema<T>` - Generic pagination wrapper
- `ErrorResponseSchema` - Standard error format (AC-API-3)

## Usage

```typescript
import { 
  TicketCreateRequestSchema,
  LoginRequestSchema,
  parseInput 
} from '@itsm/shared/zod';

// Validate incoming request body
const validatedData = parseInput(TicketCreateRequestSchema, requestBody);

// Or safe parse without throwing
const result = TicketCreateRequestSchema.safeParse(requestBody);
if (!result.success) {
  return res.status(400).json({ 
    error: { code: 'VALIDATION_ERROR', details: result.error.errors } 
  });
}
```

## Dependencies

- `zod` ^3.23.0

## Acceptance Criteria Reference

These schemas satisfy:
- SPEC.md AC-API-2: Request/Response validated against Zod Schemas
- SPEC.md AC-SEC-6: Input Validation via Zod before database operations
- SPEC.md AC-TEST-3: API Contract Testing via Zod Schema Validation
- PLAN.md WP-A: Zod Schemas as single source of truth
