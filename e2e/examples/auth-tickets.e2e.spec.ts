/**
 * Example Playwright E2E Test
 * Demonstrates authentication flow and ticket creation
 */

import { test, expect, chromium } from '@playwright/test';

// Tag tests for filtering
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login form correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|Sign in/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.error-message, [role="alert"]')).toContainText(/invalid/i);
  });

  test('should authenticate valid user and redirect to dashboard', async ({ page }) => {
    // Use seeded test credentials
    await page.fill('input[name="email"]', 'agent1@test.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(/\/dashboard|\/tickets/i);
    
    // Verify navigation succeeded
    await expect(page.locator('h1, .dashboard-title')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('input[name="email"]', 'agent1@test.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/tickets/i);

    // Logout
    await page.click('[data-testid="user-menu"], .user-menu');
    await page.click('button:has-text("Logout"), button:has-text("Sign out")');

    // Should redirect back to login
    await page.waitForURL(/\/login/i);
  });
});

test.describe('Ticket Creation Flow', () => {
  test.use({ storageState: 'e2e/fixtures/authenticated-state.json' }); // Pre-authenticated

  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets/new');
  });

  test('should create a new ticket with valid data', async ({ page }) => {
    // Fill the form
    await page.fill('input[name="title"]', 'E2E Test Ticket');
    await page.fill('textarea[name="description"]', 'This is an automated E2E test ticket.');
    await page.selectOption('select[name="category"]', 'incident');
    
    // Submit
    await page.click('button[type="submit"]');

    // Wait for success and redirect
    await page.waitForURL(/\/tickets\/\w+/i);

    // Verify ticket was created
    await expect(page.locator('.ticket-header h1')).toContainText('E2E Test Ticket');
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('.field-error, [aria-invalid="true"]')).toBeVisible();
  });

  test('should cancel and return to ticket list', async ({ page }) => {
    await page.click('button:has-text("Cancel"), a[href="/tickets"]');
    await page.waitForURL(/\/tickets$/i);
    await expect(page.locator('.ticket-list, table')).toBeVisible();
  });
});

test.describe('API Contract Tests', () => {
  test('GET /api/v1/tickets should return 200 with tickets array', async ({ request }) => {
    const response = await request.get('/api/v1/tickets');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(Array.isArray(body.data || body)).toBe(true);
  });

  test('POST /api/v1/tickets should create ticket with valid payload', async ({ request }) => {
    const payload = {
      title: 'API Test Ticket',
      description: 'Created via API test',
      category: 'service_request',
    };

    const response = await request.post('/api/v1/tickets', { data: payload });
    
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.title).toBe(payload.title);
  });

  test('POST /api/v1/tickets should return 400 for invalid payload', async ({ request }) => {
    const payload = {
      title: '', // Invalid: empty title
    };

    const response = await request.post('/api/v1/tickets', { data: payload });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});

test.describe.configure({ mode: 'parallel' });
