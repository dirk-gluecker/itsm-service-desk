import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,
    
    // Coverage configuration targeting 80% minimum
    coverage: {
      provider: 'v8', // faster than istanbul
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
    
    // Environment setup for Node.js backend
    environment: 'node',
    
    // Test file patterns
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', '**/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    
    // Exclude patterns
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    
    // Run time limit per test (ms)
    testTimeout: 10000,
    
    // Hook timeout (ms)
    hookTimeout: 30000,
    
    // Teardown timeout (ms)  
    teardownTimeout: 10000,
    
    // Pool threads configuration
    pool: 'threads',
    
    // Sequence: should tests run in parallel?
    sequence: {
      concurrent: true,
    },
    
    // Retry failed tests
    retry: 2,
    
    // Max concurrency
    maxConcurrency: 5,
    
    // Setup file
    setupFiles: ['./test/setup.ts'],
    
    // Silent mode for cleaner output (false = verbose)
    silent: false,
    
    // Watch mode settings
    watch: false,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
});
