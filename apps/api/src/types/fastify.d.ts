import { FastifyRequest } from 'fastify';

/**
 * JWT payload structure for authentication tokens
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  type?: 'access' | 'refresh';
}

/**
 * Authenticated user payload from JWT
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
}

// Extend Fastify request with user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

// Extend @fastify/jwt types
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthenticatedUser;
  }
}
