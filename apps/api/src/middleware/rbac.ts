import { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthenticatedUser } from '../types/fastify';

export type UserRole = AuthenticatedUser['role'];

/**
 * RBAC Middleware - Enforces role-based access control on routes
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Check if user is authenticated
    if (!request.user) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
    }
  };
}

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return;
    }
    
    const decoded = await request.jwtVerify();
    request.user = {
      userId: (decoded as { userId: string }).userId,
      email: (decoded as { email: string }).email,
      role: (decoded as { role: UserRole }).role,
    };
  } catch {
    // Invalid token - just don't attach user
    return;
  }
}
