/**
 * Vitest Setup File
 * Runs before each test file to configure global mocks and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { 
  resetDatabase, 
  dropAllTables,
  clearTestDatabases 
} from '../test/db-utils';

// Global beforeAll: called once before all tests
beforeAll(async () => {
  // Initialize database connection if needed
  console.log('Test suite starting...');
});

// Global beforeEach: called before each test
beforeEach(async () => {
  // Reset database state before each test for isolation
  await resetDatabase();
});

// Global afterEach: called after each test
afterEach(async () => {
  // Clean up any resources after each test
  // Database reset happens in beforeEach, so just clean in-memory state here
});

// Global afterAll: called once after all tests
afterAll(async () => {
  // Disconnect from database
  await clearTestDatabases();
  console.log('Test suite completed.');
});

// Optional: Skip long-running tests when running --bail
if (process.env.SKIP_LONG_TESTS === 'true') {
  import.meta.vitest.hook((task) => {
    if (task.name.includes('slow') || task.name.includes('long')) {
      task.mode = 'skip';
    }
  });
}
