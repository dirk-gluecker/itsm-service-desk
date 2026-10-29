import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 * Reference: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory - where e2e tests live
  testDir: './e2e',
  
  // Folder for test artifacts such as screenshots, videos, traces
  outputDir: './test-results/',
  
  // Run tests in files in parallel by default
  fullyParallel: true,
  
  // Fail build if a test is expected to pass but did not
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI for better logging
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  // 'line' during CI for compact output, 'list' locally
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results/report.json' }],
    ['line'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  
  // Timeout per test (ms)
  timeout: 30 * 1000,
  
  // Expected timeout for slow tests (ms)
  expect: {
    timeout: 5000,
  },
  
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await goto('/')`
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying on CI
    trace: 'on-first-retry',
    
    // Record video on retries
    video: 'retain-on-failure',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Action timeout (ms)
    actionTimeout: 10000,
    
    // Navigation timeout (ms)
    navigationTimeout: 30000,
    
    // Permissions to grant (camera, microphone, etc.)
    permissions: [],
    
    // Extra HTTP headers
    extraHTTPHeaders: {},
    
    // Locale for tests
    locale: 'en-US',
    
    // Timezone ID
    timezoneId: 'UTC',
  },
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile emulation
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // API-only testing (no browser needed)
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // Web server configuration for running the app during tests
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: process.env.E2E_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
