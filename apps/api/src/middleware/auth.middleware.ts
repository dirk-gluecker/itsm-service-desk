import { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTPayload, AuthenticatedUser } from '../types/fastify';

// Re-export constants
export const ROLES = {
  ADMIN: 'ADMIN' as const,
  STAFF: 'STAFF' as const,
  CUSTOMER: 'CUSTOMER' as const,
};

// Alias for backwards compatibility
export type TokenPayload = JWTPayload;

/**
 * Attach authenticated user to request object
 */
export async function attachUser(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    request.user = undefined;
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const payload = await request.jwtVerify<JWTPayload>();
    request.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      ...(payload.type && { type: payload.type }),
    };
  } catch {
    request.user = undefined;
    // Don't throw - we'll let route-level guards handle this
  }
}

/**
 * Require authentication - returns 401 if no valid token
 */
export function requireAuth(request: FastifyRequest, reply: FastifyReply): void {
  if (!request.user) {
    void reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }
}

/**
 * Require specific role(s) - returns 403 if user doesn't have permission
 * @param allowedRoles - Array of roles that are permitted
 */
export function requireRole(...allowedRoles: Array<typeof ROLES[keyof typeof ROLES]>) {
  return function roleGuard(request: FastifyRequest, reply: FastifyReply): void {
    requireAuth(request, reply); // First check authentication
    
    if (request.user && !allowedRoles.includes(request.user.role as any)) {
      void reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions for this resource',
        },
      });
    }
  };
}

/**
 * Check if admin or staff (excludes customers)
 */
export function requireStaff(request: FastifyRequest, reply: FastifyReply): void {
  requireRole(ROLES.STAFF, ROLES.ADMIN)(request, reply);
}

/**
 * Check if admin only
 */
export function requireAdmin(request: FastifyRequest, reply: FastifyReply): void {
  requireRole(ROLES.ADMIN)(request, reply);
}
