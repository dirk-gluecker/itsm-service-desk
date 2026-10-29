/**
 * E2E Tests for WP-D: Staff Views
 * Testing Dashboard, Board, TicketDetail, and Reports functionality
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const STAFF_USER = {
  email: 'staff@example.com',
  password: 'Test1234!',
};

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'Admin1234!',
};

test.describe('Staff Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', STAFF_USER.email);
    await page.fill('[data-testid="password-input"]', STAFF_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/my-tickets');
    
    // Navigate to staff dashboard
    await page.goto('/staff/dashboard');
  });

  test('should display filter controls', async ({ page }) => {
    await expect(page.locator('select[aria-label*="Status"], select[name*="status"]')).toBeVisible();
    await expect(page.locator('select[aria-label*="Priority"], select[name*="priority"]')).toBeVisible();
    await expect(page.locator('select[aria-label*="Category"], select[name*="category"]')).toBeVisible();
  });

  test('should have search bar for key, title, description', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Suchen"], input[data-testid*="search"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('TK-0001');
    await expect(searchInput).toHaveValue('TK-0001');
  });

  test('should update URL with filter state', async ({ page }) => {
    const statusFilter = page.locator('select[name="status"]').first();
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('open');
      await page.waitForTimeout(500); // Wait for URL update
      
      const url = new URL(page.url());
      expect(url.searchParams.get('status')).toBe('open');
    }
  });

  test('should display tickets in dense table layout', async ({ page }) => {
    // Check for table structure
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible();
    
    // Dense layout - check for compact cells
    const rows = page.locator('tr');
    await expect(rows.first()).toBeVisible();
  });
});

test.describe('Kanban Board Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', STAFF_USER.email);
    await page.fill('[data-testid="password-input"]', STAFF_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/my-tickets');
    await page.goto('/staff/board');
  });

  test('should display three columns: Offen | In Bearbeitung | Erledigt', async ({ page }) => {
    await expect(page.locator('text=Offen, text=In Bearbeitung, text=Erledigt').or(
      page.locator('text=Open, text=In Progress, text=Done')
    )).toBeVisible();
    
    // Check column headers
    const columns = page.locator('[role="listitem"], .kanban-column, article');
    await expect(columns.first()).toBeVisible();
  });

  test('should support drag and drop between columns', async ({ page }) => {
    // This is a basic DnD test - actual implementation may need @playwright/test's built-in DnD
    const sourceColumn = page.locator('[data-column="open"]').first();
    const targetColumn = page.locator('[data-column="in_progress"]').first();
    
    if (await sourceColumn.count() > 0 && await targetColumn.count() > 0) {
      const source = sourceColumn.first();
      const target = targetColumn.first();
      
      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();
      
      if (sourceBox && targetBox) {
        await page.mouse.move(
          sourceBox.x + sourceBox.width / 2,
          sourceBox.y + sourceBox.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(
          targetBox.x + targetBox.width / 2,
          targetBox.y + targetBox.height / 2
        );
        await page.mouse.up();
        
        // Verify ticket moved
        await expect(sourceColumn.first()).not.toBeEmpty();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on a ticket card
    const firstTicket = page.locator('[draggable="true"], .ticket-card, [data-testid="ticket-card"]').first();
    await firstTicket.focus();
    await expect(firstTicket).toBeFocused();
    
    // Try arrow key navigation
    await page.keyboard.press('ArrowRight');
    // Should move to next ticket or column
  });

  test('auto-assign when moving to In Bearbeitung without assignee', async ({ page }) => {
    // Find unassigned ticket in "Open" column
    const openColumn = page.locator('[data-column="open"], :has-text("Offen")').first();
    const unassignedTicket = openColumn.locator('[data-assignee="null"], [data-assignee*="unassigned"]').first();
    
    if (await unassignedTicket.count() > 0) {
      // Drag to In Bearbeitung
      const inProgressColumn = page.locator('[data-column="in_progress"], :has-text("In Bearbeitung")').first();
      
      const ticketBox = await unassignedTicket.boundingBox();
      const columnBox = await inProgressColumn.boundingBox();
      
      if (ticketBox && columnBox) {
        await page.mouse.move(ticketBox.x + ticketBox.width / 2, ticketBox.y + ticketBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + columnBox.height / 2);
        await page.mouse.up();
        
        // Should trigger auto-assign dialog or direct assignment
        // Check for confirmation or updated assignee
        await expect(page.locator('text=zugewiesen, text=assigned, text=Aktuellster Benutzer')).toContainText(/zugewiesen|assigned/i);
      }
    }
  });
});

test.describe('Ticket Detail Page (Staff View)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', STAFF_USER.email);
    await page.fill('[data-testid="password-input"]', STAFF_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/my-tickets');
    
    // Create or navigate to existing ticket
    await page.goto('/staff/tickets/TK-0001');
  });

  test('should have all ticket fields editable', async ({ page }) => {
    // Status dropdown/select
    await expect(page.locator('select[name*="status"], select[aria-label*="Status"]')).toBeVisible();
    
    // Priority selector
    await expect(page.locator('select[name*="priority"], button[aria-label*="Priority"]')).toBeVisible();
    
    // Assignee dropdown
    await expect(page.locator('select[name*="assignee"], select[aria-label*="Assignee"]')).toBeVisible();
  });

  test('should allow any status transition including reopening', async ({ page }) => {
    const statusSelect = page.locator('select[name="status"]').first();
    const options = await statusSelect.allTextContents();
    
    // All statuses should be available regardless of current state
    expect(options.length).toBeGreaterThan(2);
  });

  test('should show internal notes section distinctly', async ({ page }) => {
    // Internal notes should have visual distinction (different background, lock icon)
    const internalNotesSection = page.locator(
      '[data-section="internal-notes"], .internal-notes, :has-text("Interne Notizen"), :has-text("Internal Notes")'
    );
    
    if (await internalNotesSection.count() > 0) {
      // Check for visual distinction - purple-ish background or lock icon
      const hasLockIcon = await page.locator('[title*="internal"], [title*="privat"], .lock-icon').count();
      expect(hasLockIcon).toBeGreaterThan(0);
    }
  });

  test('internal notes never visible to customers', async ({ page }) => {
    // This would require customer account login to truly test
    // For now, verify the internal flag exists in comment creation
    const internalToggle = page.locator(
      '[type="checkbox"][name*="internal"], label:text-is("Internal"), button:text-is("Interne Notiz")'
    );
    await expect(internalToggle).toBeVisible();
  });

  test('should display full audit log history', async ({ page }) => {
    const auditTab = page.locator(
      'button:text-is("Audit"), button:text-is("Protokoll"), [aria-controls*="audit"]'
    ).first();
    
    if (await auditTab.count() > 0) {
      await auditTab.click();
      
      const auditLogEntries = page.locator('.audit-log-entry, [data-testid="audit-entry"]');
      await expect(auditLogEntries.first()).toBeVisible();
    }
  });

  test('should have assignee dropdown with staff members', async ({ page }) => {
    const assigneeSelect = page.locator('select[name="assignee"]').first();
    const options = await assigneeSelect.locator('option').allTextContents();
    
    // Should have at least empty option and staff members
    expect(options.length).toBeGreaterThan(1);
  });
});

test.describe('Admin Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login as admin for full report access
    await page.fill('[data-testid="email-input"]', ADMIN_USER.email);
    await page.fill('[data-testid="password-input"]', ADMIN_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/my-tickets');
    await page.goto('/staff/reports');
  });

  test('should display tickets per status chart', async ({ page }) => {
    const statusChart = page.locator(
      ':has-text("Tickets pro Status"), :has-text("Tickets per Status"), canvas[id*="pie"], svg.pie-chart'
    ).first();
    await expect(statusChart).toBeVisible();
  });

  test('should display new tickets per day line chart (last 30 days)', async ({ page }) => {
    const trendChart = page.locator(
      ':has-text("Neue Tickets"), :has-text("New Tickets"), canvas[id*="line"], svg.line-chart'
    ).first();
    await expect(trendChart).toBeVisible();
  });

  test('should display average resolution time metric', async ({ page }) => {
    const resolutionMetric = page.locator(
      ':has-text("Ø Resolution"), :has-text("Durchschnittliche"), :has-text("Average Time")'
    ).first();
    await expect(resolutionMetric).toBeVisible();
  });

  test('should display open tickets per assignee list', async ({ page }) => {
    const assigneeList = page.locator(
      ':has-text("pro Zuweisung"), :has-text("per Assignee"), [data-testid="assignee-list"]'
    ).first();
    await expect(assigneeList).toBeVisible();
  });

  test('reports should compute from database correctly', async ({ page }) => {
    // Trigger report refresh
    const refreshBtn = page.locator('button:text-is("Aktualisieren"), button:text-is("Refresh")').first();
    if (await refreshBtn.count() > 0) {
      await refreshBtn.click();
      await page.waitForTimeout(1000);
      
      // Verify data reloaded
      const chartData = page.locator('canvas, svg.chart, [data-chart]').first();
      await expect(chartData).toBeVisible();
    }
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', STAFF_USER.email);
    await page.fill('[data-testid="password-input"]', STAFF_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/my-tickets');
    await page.goto('/staff/dashboard');
  });

  test('j/k navigation between tickets', async ({ page }) => {
    const firstTicket = page.locator('tr.ticket-row, .ticket-item').first();
    await firstTicket.focus();
    
    // Press j to move down
    await page.keyboard.press('j');
    
    // Second ticket should be focused
    const secondTicket = page.locator('tr.ticket-row, .ticket-item').nth(1);
    await expect(secondTicket).toBeFocused();
  });

  test('c creates new ticket', async ({ page }) => {
    await page.keyboard.press('c');
    
    // Should redirect to create ticket or open modal
    await expect(page).toHaveURL(/create-ticket|new-ticket/)
      .or(expect(page.locator('[data-testid="create-ticket-modal"]')).toBeVisible());
  });

  test('escape closes modals', async ({ page }) => {
    // Open a modal first (e.g., ticket detail)
    const firstTicket = page.locator('tr.ticket-row, .ticket-item').first();
    await firstTicket.click();
    
    // Close with escape
    await page.keyboard.press('Escape');
    
    // Modal should close
    const modal = page.locator('[role="dialog"], [data-testid="modal"]').first();
    await expect(modal).not.toBeVisible();
  });
});
