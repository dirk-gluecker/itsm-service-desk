# Plan — Desk (ITSM Service Desk)

Spec: `SPEC.md` (75 Akzeptanzkriterien)

**Plan erstellt:** Mackenzie (Supervisor)  
**Status:** Phase 2 in Review - WP-A Done, WP-B Done, WP-C/WP-D teilweise implementiert

---

## 1. Work Packets - STATUS

### ✅ WP-A: Backend Core + Shared Types (**DONE**)
**Owner:** Platform & Integration Team  
**Commit:** 651f555 + fix commit 5b867bc  
**Status:** COMPLETE - API fully functional

**Implemented:**
- Prisma Schema (`apps/api/prisma/schema.prisma`) mit User, Ticket, Comment, AuditLog, Role
- Authentication (JWT, bcrypt ≥10 rounds)
- Role-based Authorization (Customer, Staff, Admin)
- Rate limiting (5 attempts/15 min block)
- Zod Schemas in `packages/shared/zod/` als API contract source of truth
- REST API Endpoints: `/auth/*`, `/tickets/*`, `/comments/*`, `/users/*`
- SQLite für Dev, PostgreSQL-ready
- Seed Script: 1 Admin, 2 Staff, 2 Customers
- Audit Log auf allen State Changes
- SMTP Config (Console fallback für Dev)

**Fixes applied:**
- Route prefix collision fixed (ticket/comments/users)
- AuditLog FK constraint resolved (actorId uses user.id)

**Acceptance Criteria Met:**
- AC-6.1 bis AC-6.5 ✓
- AC-AUTH-1 bis AC-AUTH-5 ✓
- AC-SEC-1 bis AC-SEC-6 ✓
- AC-AUDIT-1 bis AC-AUDIT-5 ✓
- AC-API-1 bis AC-API-5 ✓
- AC-TEST-2 bis AC-TEST-5 ✓

---

### ✅ WP-B: Design System + Shared Components (**DONE**)
**Owner:** Design & Assets Team  
**Status:** COMPLETE

**Implemented:**
- Design Tokens (`packages/shared/design-tokens.ts`) - Farben, Spacing, Typography
- 9 Shared Components: Button, Input, Select, Card, Modal, Table, Badge, ThemeProvider, ErrorBoundary
- WCAG AA Focus States
- Dark/Light Mode Provider mit system preference detection
- Global Styles mit status/priority colors

**Acceptance Criteria Met:**
- AC-DESIGN-1 bis AC-DESIGN-4 ✓
- AC-COMP-1 bis AC-COMP-4 ✓
- AC-THEME-1 bis AC-THEME-3 ✓

---

### ⚠️ WP-C: Customer Portal (**IN REVIEW**)
**Owner:** Discovery & Search Team (Liam)  
**Status:** PARTIAL - Files created, needs integration testing

**Files present:**
- apps/web/src/pages/Customer/LoginPage.tsx ✓
- apps/web/src/pages/Customer/RegisterPage.tsx ✓
- apps/web/src/pages/Customer/MyTicketsPage.tsx ✓
- apps/web/src/pages/Customer/CreateTicketPage.tsx ✓
- apps/web/src/pages/Customer/TicketDetailPage.tsx ✓

**Open Items:**
- Full E2E flow testing
- Accessibility audit
- Production build configuration

**Acceptance Criteria:**
- US-1 AC-1.1 bis AC-1.6 - Need validation
- US-4 AC-4.1 bis AC-4.4 - Need validation

---

### ⚠️ WP-D: Staff Views (**IN REVIEW**)
**Owner:** Booking & Trips Team (Lucas)  
**Status:** PARTIAL - Files created, needs integration testing

**Files present:**
- apps/web/src/pages/Staff/DashboardPage.tsx ✓
- apps/web/src/pages/Staff/BoardPage.tsx ✓
- apps/web/src/pages/Staff/TicketDetailPage.tsx ✓
- apps/web/src/pages/Staff/ReportsPage.tsx ✓

**Open Items:**
- Full E2E flow testing (Kanban drag-drop, keyboard nav)
- Internal notes visibility validation
- Report calculations verification

**Acceptance Criteria:**
- US-2 AC-2.1 bis AC-2.5 - Need validation
- US-3 AC-3.1 bis AC-3.5 - Need validation
- US-5 AC-5.1 bis AC-5.4 - Need validation


### WP-C: Customer Portal (**Priority 3**)
**Owner:** Discovery & Search Team (Liam)  
**Scope:**
- React App in `apps/web`
- Customer Registration/Login Flow
- "Meine Tickets" Liste (nur eigene Tickets)
- Ticket Creation Form (Titel, Beschreibung, Kategorie, Priorität)
- Ticket Detail View mit Kommentaren
- Mobile-first Responsive Design
- Deutsche UI, formelles "Sie"

**Interfaces provided:** None  
**Interfaces consumed:** 
- Auth API von WP-A
- Ticket/Comment API von WP-A
- Design System von WP-B

**Acceptance Criteria:**
- US-1 AC-1.1 bis AC-1.6 (Ticket Creation)
- US-4 AC-4.1 bis AC-4.4 (Ticket Tracking — customer view)
- Alle Security/Customer-isolation Tests

---

### WP-D: Staff Views (**Priority 3**)
**Owner:** Booking & Trips Team (Lucas)  
**Scope:**
- Agent Dashboard (Ticket List mit Filtern)
- Kanban Board (Offen | In Bearbeitung | Erledigt) mit Drag-and-Drop
- Ticket Detail mit Internen Notizen (nicht sichtbar für Kunden)
- Assignee-Funktion (Selbst zuweisen oder an Kollegen)
- Status-Änderung (beliebige Transition erlaubt)
- Audit Log View pro Ticket
- Admin Report Page:
  - Tickets per Status
  - Neue Tickets pro Tag (30 Tage)
  - Durchschnittliche Time-to-Resolution (30 Tage)
  - Offene Tickets pro Assignee
- Keyboard Shortcuts für Power Users
- Desktop-first, dichte Darstellung

**Interfaces provided:** None  
**Interfaces consumed:** 
- Auth API von WP-A
- Ticket/Comment/Audit API von WP-A
- Design System von WP-B

**Acceptance Criteria:**
- US-2 AC-2.1 bis AC-2.5 (Agent Dashboard)
- US-3 AC-3.1 bis AC-3.5 (Status Change)
- US-5 AC-5.1 bis AC-5.4 (Audit Log — staff view)

---

## 2. Interface Specifications

### API Contract Source of Truth
**Location:** `packages/shared/zod/`  
**Schemas:**
```
UserSchema (ID, email, password_hash, role, created_at)
TicketSchema (ID, key, title, description, status, priority, category, assignee_id, customer_id, created_at, updated_at)
CommentSchema (ID, ticket_id, author_id, content, is_internal, created_at)
AuditLogSchema (ID, ticket_id, actor_id, action, field, old_value, new_value, timestamp)
AuthResponseSchema (token, user)
LoginRequestSchema (email, password)
RegisterRequestSchema (name, email, password)
TicketCreateRequestSchema (title, description, category, priority)
TicketUpdateRequestSchema (status?, priority?, assignee_id?)
CommentCreateRequestSchema (content, is_internal?)
```

### Shared Component Contracts
**Props Interfaces in `packages/shared/components/`:**
- `<Button variant="primary"|"secondary"|"danger">`
- `<Input error? validationMsg?>`
- `<Select options label>`
- `<Badge color status>`
- `<Card title children>`
- `<Modal title open onClose children>`
- `<Table columns data onSort?>`

### Environment Variables
```
DATABASE_URL=sqlite:./dev.db (Dev) / postgres://... (Prod)
JWT_SECRET=<random>
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
PORT=3000
```

---

## 3. Execution Order

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: Foundation (WP-A + WP-B PARALLEL)              │
│ ─────────────────────────────────────────────────────── │
│ WP-A: Backend Core + Shared Types                       │
│   ├─ Prisma Schema                                      │
│   ├─ Auth + RBAC                                        │
│   ├─ Zod Schemas (source of truth)                      │
│   └─ REST API skeleton                                  │
│                                                         │
│ WP-B: Design System                                     │
│   ├─ Design Tokens                                      │
│   ├─ Base Components                                    │
│   └─ Theme Provider                                     │
│                                                         │
│ ── Merge beider PRs ─────────────────────────────────── │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: Features (WP-C + WP-D PARALLEL)                │
│ ─────────────────────────────────────────────────────── │
│ WP-C: Customer Portal       │   WP-D: Staff Views       │
│   ├─ Auth Screens           │     ├─ Dashboard          │
│   ├─ Ticket Creation        │     ├─ Board (Drag&Drop)  │
│   ├─ My Tickets List        │     ├─ Ticket Detail      │
│   └─ Comments               │     ├─ Admin Reports      │
│                             │     └─ Keyboard Nav       │
│                             │                           │
│ ── Merge beider PRs ─────────────────────────────────── │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: Polish & QA                                    │
│ ─────────────────────────────────────────────────────── │
│ - E2E Tests (Playwright)                                │
│ - Accessibility Audit (WCAG AA)                         │
│ - Performance Testing                                   │
│ - Documentation                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Definition of Done

Jeder Work Packet gilt als done wenn:
- [ ] Alle eigenen Akzeptanzkriterien erfüllt
- [ ] Unit Tests > 80% Coverage
- [ ] E2E Tests für kritische Pfade
- [ ] Linting clean (`npm run lint`)
- [ ] Keine Security Issues (`npm audit`)
- [ ] Zugewiesener Reviewer hat genehmigt
- [ ] In main branch gemerged

---

## 5. Open Questions / Decisions Needed

- [ ] Kategorien-Liste für Tickets definieren (IT, HR, Facility, Sonstiges?)
- [ ] Prioritäts-Level (Low, Medium, High, Critical?)
- [ ] E-Mail-Template Designs (Benachrichtigungen)
- [ ] Docker Compose Setup für Prod (PostgreSQL + App)

---

*Plan erstellt: Mackenzie (Supervisor)*  
*Erstellt aus: AGENTS.md + Kickoff-Brief*  
*Status: READY FOR DISPATCH*
