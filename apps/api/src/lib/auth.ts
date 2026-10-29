// Re-export types for backwards compatibility
export type { JWTPayload, AuthenticatedUser } from '../types/fastify';

import jwt from '@fastify/jwt';

/**
 * Register JWT plugin with Fastify
 */
export async function registerJWT(app: any) {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    sign: {
      expiresIn: '24h',
    },
  });
}
