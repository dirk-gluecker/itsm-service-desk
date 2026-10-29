# Test Suite Structure
# ===================

## Unit Tests (Vitest)
Located in: `apps/api/src/**/__tests__/` or inline as `*.test.ts`

### Running Unit Tests
```bash
npm run test              # Run all unit tests once
npm run test:watch        # Run in watch mode
npm run test:coverage     # Run with coverage report
npm run test:api          # Run only API tests
```

### Test Organization
```
apps/api/src/
├── auth/
│   ├── service.ts
│   └── __tests__/
│       └── service.test.ts    # Unit tests for auth service
├── tickets/
│   ├── controller.ts
│   └── __tests__/
│       └── controller.test.ts # Unit tests for ticket controller
└── utils/
    ├── validators.ts
    └── validators.test.ts     # Inline test file
```

## Integration Tests
Located in: `apps/api/test/integration/`

Tests actual API endpoints with mocked database.

```bash
npm run test:integration
```

## E2E Tests (Playwright)
Located in: `apps/web/e2e/` or root `e2e/`

### Running E2E Tests
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Run with Playwright UI mode
npm run test:e2e:headed       # Run with visible browser
npm run test:e2e -- --project=chromium  # Single browser
npm run test:e2e -- --grep="login"      # Filter by test name
```

### Test Organization
```
e2e/
├── auth.spec.ts              # Login, logout, registration flows
├── tickets.spec.ts           # Ticket creation, viewing, updates
├── api/                      # API contract tests
│   └── tickets.spec.ts
└── fixtures/                 # Test data factories
    └── user.factory.ts
```

## Example Test Files

See:
- `examples/auth.service.test.ts` - Example Vitest unit test
- `examples/tickets.e2e.spec.ts` - Example Playwright E2E test

## CI Integration

GitHub Actions automatically runs:
- `npm run test` on every PR (blocks merge if fails)
- `npm run test:e2e` on deployment preview
- Coverage threshold enforced (min 80%)

Manual trigger:
```bash
npm run test:ci              # CI-optimized test run
```

## Coverage Reports

After running `npm run test:coverage`:
- HTML report: `coverage/index.html`
- JSON report: `coverage/coverage-final.json`
- LCOV report: `coverage/lcov.info`

Open with:
```bash
open coverage/index.html        # macOS
xdg-open coverage/index.html    # Linux
```

## Debugging Tests

### Debug single test
```typescript
it.only('should do something', () => {
  // Only this test runs
});
```

### Debug with console
```typescript
console.log('Debug value:', value);
```

### Debug with breakpoints
Add debugger statements or use VS Code debugging

### Run specific file
```bash
npx vitest src/auth/service.test.ts
npx playwright test e2e/login.spec.ts
```
