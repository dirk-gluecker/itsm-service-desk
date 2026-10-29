# ITSM Service Desk "Desk" - Spezifikation

**Version:** 1.0  
**Status:** DRAFT  
**Last Updated:** 2026-10-29

---

## 1) Vision & Scope

### Produktvision
Ein ITIL-konformes Ticket-Management-System ("Desk") für Service-Desk-Operationen, das Agenten befähigt, Incident- und Service-Requests effizient zu bearbeiten, mit vollständigem Audit-Trail und transparentem Status-Fortschritt.

### In Scope
- Ticket-Erstellung durch Endnutzer
- Ticket-Zuweisung und Bearbeitung durch Agenten
- Status-Workflow: `open` → `in_progress` → `done`
- Vollständiger Audit-Log aller Status-Änderungen
- Benutzer-Authentifizierung und Rollenverwaltung
- Real-time Status-Updates

### Out of Scope
- Automatisiertes Ticket-Routing (ML-basiert)
- Integration mit externen ITSM-Tools (ServiceNow, Jira)
- Mobile Native Apps
- SLA-Berechnung und Eskalationsworkflows
- Knowledge Base / Self-Service Portal

---

## 2) User Stories mit Akzeptanzkriterien

### US-1: Als Endnutzer möchte ich ein neues Ticket erstellen können

**Beschreibung:** Ein registrierter Benutzer kann ein Inciden oder Service Request mit erforderlichen Details anmelden.

**Akzeptanzkriterien:**
- [x] **AC-1.1:** Ein formularbasiertes Interface erlaubt Eingabe von: Titel (必填, max 200 Zeichen), Beschreibung (必填, min 20 Zeichen), Kategorie (dropdown: Incident/Service Request)
- [x] **AC-1.2:** Nach Absenden wird eine eindeutige Ticket-ID generiert und angezeigt
- [x] **AC-1.3:** Das Ticket erhält initialen Status `open`
- [x] **AC-1.4:** Der Erstellungszeitpunkt und der Ersteller werden im Audit Log protokolliert
- [x] **AC-1.5:** Validierung verhindert Submission bei leeren Pflichtfeldern
- [x] **AC-1.6:** Erfolgsnachricht bestätigt die Ticket-Erstellung mit ID

---

### US-2: Als Agent möchte ich alle mir zugewiesenen Tickets sehen

**Beschreibung:** Ein Service-Agent kann eine Liste seiner zugewiesenen Tickets einsehen, gefiltert nach Status.

**Akzeptanzkriterien:**
- [x] **AC-2.1:** Dashboard zeigt mindestens: Ticket-ID, Titel, aktueller Status, Erstelldatum
- [x] **AC-2.2:** Filter nach Status (`open`, `in_progress`, `done`) funktioniert korrekt
- [x] **AC-2.3:** Sortierung nach Erstelldatum (neueste zuerst) ist standardmäßig aktiv
- [x] **AC-2.4:** Nur Tickets des authentisierten Benutzers werden angezeigt
- [x] **AC-2.5:** Pagination bei >20 Tickets (standardmäßig 20 pro Seite)

---

### US-3: Als Agent möchte ich einen Ticket-Status ändern können

**Beschreibung:** Ein Agent kann den Status eines Tickets gemäß dem Workflow vorantreiben.

**Akzeptanzkriterien:**
- [x] **AC-3.1:** Gültige Status-Übergänge: `open` → `in_progress`, `in_progress` → `done`
- [x] **AC-3.2:** Invalid transition (z.B. `done` → `open`) wird abgelehnt mit Fehlermeldung
- [x] **AC-3.3:** Jede Statusänderung protokolliert: Zeitstempel, Agent-ID, alter Status, neuer Status
- [x] **AC-3.4:** Die Statusänderung ist sofort für andere Viewer sichtbar (real-time)
- [x] **AC-3.5:** Dropdown oder Buttons bieten nur gültige nächste Status als Option

---

### US-4: Als Endnutzer möchte ich den Status meines Tickets verfolgen

**Beschreibung:** Ein Benutzer kann den Fortschritt seiner Tickets in Echtzeit einsehen.

**Akzeptanzkriterien:**
- [x] **AC-4.1:** Jeder Ticket-Detailseite wird der aktuelle Status prominent angezeigt
- [x] **AC-4.2:** Ein Audit-Log zeigt chronologische Historie aller Statusänderungen
- [x] **AC-4.3:** Der Benutzer sieht nur Tickets, die er erstellt hat
- [x] **AC-4.4:** Status-Indikator verwendet konsistente Farbcodierung (open=blau, in_progress=gelb, done=grün)

---

### US-5: Als Systemadministrator möchte ich den Audit-Log einsehen

**Beschreibung:** Vollständiger Nachweis aller Ticket-Änderungen für Compliance und Debugging.

**Akzeptanzkriterien:**
- [x] **AC-5.1:** Audit-Log enthält für jeden Eintrag: timestamp, user_id, action, entity_type, old_value, new_value
- [x] **AC-5.2:** Audit-Einträge sind immutable (kein Update/Delete möglich)
- [x] **AC-5.3:** Filter nach Ticket-ID und Zeitraum unterstützt große Datenmengen
- [x] **AC-5.4:** Export als CSV ermöglicht externe Analyse

---

### US-6: Als Benutzer möchte ich mich sicher authentifizieren

**Beschreibung:** Sichere Anmeldung mit JWT-basierten Tokens für API-Zugriff.

**Akzeptanzkriterien:**
- [x] **AC-6.1:** Login mit E-Mail und Passwort führt zu signiertem JWT
- [x] **AC-6.2:** Token gilt maximal 24 Stunden
- [x] **AC-6.3:** Geschützte Endpunkte lehnen fehlende/ungültige Tokens mit HTTP 401 ab
- [x] **AC-6.4:** Passwörter werden gehasht (bcrypt, cost factor ≥10) gespeichert
- [x] **AC-6.5:** Rate Limiting: Maximal 5 Login-Versuche pro Minute pro IP

---

## 3) Technische Anforderungen

### 3.1 Tech Stack
| Komponente | Technologie | Version/Note |
|------------|-------------|--------------|
| Language | TypeScript | strict mode enabled |
| Frontend Framework | React + Vite | apps/web |
| Backend Framework | Fastify | apps/api |
| Database | SQLite | Development/Testing |
| ORM | Prisma | schema.prisma |
| API Validation | Zod | packages/shared (Source of Truth) |
| Test Runner | Vitest | Unit Tests |
| E2E Testing | Playwright | npm run test:e2e |
| Linting | ESLint + TypeScript | npm run lint |

### 3.2 Authentifizierung & Autorisierung
- **AC-AUTH-1:** JWT-basierte Stateless Authentication
- **AC-AUTH-2:** Role-based Access Control (RBAC): `end_user`, `agent`, `admin`
- **AC-AUTH-3:** Password Hashing mit bcrypt (cost ≥10)
- **AC-AUTH-4:** Token Refresh Mechanismus vor Ablauf
- **AC-AUTH-5:** CORS-Konfiguration erlaubt nur konfigurierte Origin(s)

### 3.3 Sicherheit
- **AC-SEC-1:** Alle Passwörter gehasht mit bcrypt, niemals Klartext
- **AC-SEC-2:** HTTPS-only Kommunikation in Production (TLS 1.3)
- **AC-SEC-3:** SQL Injection Prevention durch Prisma Parameterized Queries
- **AC-SEC-4:** XSS Prevention durch React Escaping + Content Security Policy Headers
- **AC-SEC-5:** Rate Limiting auf allen API-Endpunkten (max 100 req/min/IP)
- **AC-SEC-6:** Input Validation via Zod Schemas vor jeder Datenbankoperation

### 3.4 Audit Log Anforderungen
- **AC-AUDIT-1:** Jede Ticket-Status-Änderung erzeugt Audit-Eintrag
- **AC-AUDIT-2:** Jede Benutzererstellung wird protokolliert
- **AC-AUDIT-3:** Audit-Einträge enthalten: id, timestamp (ISO 8601), actor_id, action, entity_type, entity_id, old_state, new_state, metadata (JSON)
- **AC-AUDIT-4:** Audit-Tabelle wächst monoton (keine Updates/Deletes)
- [x] **AC-AUDIT-5:** Audit-Historie ist über API abrufbar (GET /tickets/:id/audit)

### 3.5测试要求
- **AC-TEST-1:** Unit Test Coverage ≥80% für Business Logic
- **AC-TEST-2:** E2E Tests für kritische Pfade: Login, Ticket Creation, Status Change
- **AC-TEST-3:** API Contract Testing via Zod Schema Validation
- **AC-TEST-4:** Alle Tests müssen ohne externe Dependencies laufen (Mocked DB)
- **AC-TEST-5:** CI/CD Pipeline blockiert Merge bei <80% Coverage oder failing tests

### 3.6 API-Design
- **AC-API-1:** RESTful Endpunkte mit Standard-HTTP-Verben
- **AC-API-2:** Request/Response validiert gegen Zod Schemas aus packages/shared
- **AC-API-3:** Konsistente Error Responses: `{ error: { code, message, details } }`
- **AC-API-4:** Versionierung via URL Prefix (/api/v1/...)
- **AC-API-5:** OpenAPI/Swagger Dokumentation auto-generated aus Zod Schemas

### 3.7 Datenbank-Schema (Prisma)
```prisma
// Erwartete Core-Entitäten:
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(END_USER)
  tickets   Ticket[]
}

model Ticket {
  id          String    @id @default(uuid())
  title       String
  description String
  status      Status    @default(open)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  creatorId   String
  creator     User      @relation(fields: [creatorId], references: [id])
  auditLogs   AuditLog[]
}

model AuditLog {
  id         String   @id @default(uuid())
  timestamp  DateTime @default(now())
  actorId    String
  action     String
  entityType String
  entityId   String
  oldState   Json?
  newState   Json?
  ticket     Ticket   @relation(fields: [entityId], references: [id])
}

enum Status {
  open
  in_progress
  done
}

enum Role {
  END_USER
  AGENT
  ADMIN
}
```

---

## 4) Design-Anforderungen

### 4.1 UI/UX Prinzipien
- **AC-DESIGN-1:** Clean, minimalistisches Interface ohne visuelle Überlastung
- **AC-DESIGN-2:** Konsistente Farbpalette (Blau/Gelb/Grün für Status)
- **AC-DESIGN-3:** Accessibility: WCAG 2.1 AA Compliance (kontrastreiche Farben, Keyboard Navigation)
- **AC-DESIGN-4:** Responsive Design: Desktop-first, aber mobile-freundlich (>768px breakpoint)

### 4.2 Component Guidelines
- **AC-COMP-1:** Reusable Components in `/apps/web/src/components` mit Storybook-Dokumentation
- **AC-COMP-2:** Consistent Naming: PascalCase für Components, camelCase für Props
- **AC-COMP-3:** Error Boundaries für jeden top-level Route
- **AC-COMP-4:** Loading States für alle asynchronen Operationen (Skeleton Screens)

### 4.3 Performance
- **AC-PERF-1:** Initial Page Load <3s auf 3G-Verbindung
- **AC-PERF-2:** Bundle Size <200KB gzipped (main chunk)
- **AC-PERF-3:** Code Splitting via Vite Dynamic Imports für Router Routes
- **AC-PERF-4:** API Response Time <500ms für 95th Percentile

### 4.4 Dark Mode
- **AC-THEME-1:** System Preference Detection (prefers-color-scheme)
- **AC-THEME-2:** Toggle zwischen Light/Dark verfügbar im User Menu
- **AC-THEME-3:** Konsistente Contrast Ratios in beiden Themes (≥4.5:1)

---

## Appendix A: Glossar

| Begriff | Definition |
|---------|------------|
| Ticket | Einheitliche Aufzeichnung eines Incidents oder Service Requests |
| Agent | Service-Desk-Mitarbeiter mit Bearbeitungsrechte |
| End User | Antragsteller, der Tickets erstellt und verfolgt |
| Audit Log | Immutable Aufzeichnung aller Statusänderungen |

---

## Appendix B: Nicht-Funktionale Anforderungen

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| NFR-1 | 99.9% Uptime während Business Hours (8-18 CET) | High |
| NFR-2 | Support für 50 gleichzeitige Benutzer | Medium |
| NFR-3 | Backup-Retention: 30 Tage für SQLite | Medium |
| NFR-4 | Documentation: README, API Docs, Onboarding Guide | High |

---

*END OF SPECIFICATION*
