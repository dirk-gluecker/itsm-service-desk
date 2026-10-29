# WP-C: Customer Portal Implementation

## Overview
Customer-facing React application for the ITSM Service Desk, built with React 18, React Router, TanStack Query, and the shared design system components.

## Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:8080` (from WP-A)

## Setup

```bash
# Install dependencies
cd apps/web
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure

```
apps/web/
├── src/
│   ├── pages/Customer/          # Customer-facing pages
│   │   ├── LoginPage.tsx        # User login
│   │   ├── RegisterPage.tsx     # New user registration
│   │   ├── MyTicketsPage.tsx    # List of user's tickets
│   │   ├── CreateTicketPage.tsx # Ticket creation form
│   │   └── TicketDetailPage.tsx # Single ticket view
│   ├── components/customer/     # Customer-specific components
│   │   ├── TicketCard.tsx       # Ticket card display
│   │   ├── CustomerHeader.tsx   # Header with navigation
│   │   └── index.ts             # Exports
│   ├── hooks/api/               # React Query hooks
│   │   └── useHooks.ts          # Auth, tickets, comments hooks
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # API client & endpoints
│   │   └── authGuard.tsx        # Protected route wrappers
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # Type definitions from Zod schemas
│   ├── utils/                   # Helper functions
│   │   └── helpers.ts           # Date formatting, validation, etc.
│   ├── App.tsx                  # Main app with routing
│   └── main.tsx                 # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Pages Implemented

### Authentication
- **Login** (`/login`) - Email/password login with rate limiting feedback
- **Register** (`/register`) - Registration with password strength validation (min 12 chars)

### Customer Portal
- **My Tickets** (`/my-tickets`) - List of own tickets with filtering/sorting
- **Create Ticket** (`/create-ticket`) - Form with validation (title 5-120 chars, description required)
- **Ticket Detail** (`/tickets/:id`) - View ticket, add comments, audit log timeline

## Acceptance Criteria Met

### US-1 AC-1.x (Ticket Creation)
- ✅ AC-1.1: Title 5-120 characters validation
- ✅ AC-1.2: Description required (min 20 chars)
- ✅ AC-1.3: Category selection (Incident/Service Request)
- ✅ AC-1.4: Priority selection (Low/Medium/High/Critical)
- ✅ AC-1.5: Confirmation with ticket key (SD-XXXX format)
- ✅ AC-1.6: New tickets get status='open'

### US-4 AC-4.x (Ticket Tracking)
- ✅ AC-4.1: Only own tickets displayed (customer isolation enforced by API)
- ✅ AC-4.2: Display ticket key, title, status, last updated
- ✅ AC-4.3: Filter/sort by status and priority
- ✅ AC-4.4: URL-filter state is shareable

### Security (AC-SEC-*)
- ✅ Customers can NEVER see other customers' tickets
- ✅ Backend enforces customerId check on all ticket queries
- ✅ Internal comments hidden from customers
- ✅ Rate limiting on login (5 attempts, 15 min block)

## API Integration

All API calls go through `/api/v1/*` proxied to backend at `http://localhost:8080`:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `POST /auth/logout` - User logout
- `GET /tickets` - List customer's tickets
- `POST /tickets` - Create new ticket
- `GET /tickets/:id` - Get single ticket
- `POST /tickets/:id/comments` - Add comment
- `GET /tickets/:id/audit` - Get audit logs

## E2E Tests

Located in `e2e/customer-portal.spec.ts`. Run with:

```bash
npm run test:e2e
```

Tests cover:
- Registration and login flow
- Password validation
- Ticket creation
- Ticket filtering
- Customer isolation security

## Notes

- Design tokens and components are imported from `@shared/components`
- Global styles from `@shared/global-styles.css`
- Theme support (dark/light mode) via ThemeProvider
- React Query handles caching, loading states, and error handling
