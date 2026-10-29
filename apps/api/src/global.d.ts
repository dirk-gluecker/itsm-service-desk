// Global type declarations for Node.js built-ins
// This compensates for missing @types/node package in this workspace setup

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    HOST?: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    CORS_ORIGIN?: string;
    BASE_URL?: string;
  }
}

// Make process available globally
declare const process: NodeJS.Process;

// Make console available
interface Console {
  log(...data: unknown[]): void;
  error(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  info(...data: unknown[]): void;
  debug(...data: unknown[]): void;
}

declare const console: Console;
