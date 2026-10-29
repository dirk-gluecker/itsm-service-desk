import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireRole } from '../middleware/rbac';

/**
 * Users routes - for fetching staff/assignees and user details
 */
export async function userRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/users
   * List all users (ADMIN, STAFF only)
   * Optionally filter by role
   */
  app.get(
    '/users', 
    { preHandler: [requireRole('ADMIN', 'STAFF')] },
    async (request, reply) => {
      const { role, activeOnly } = request.query as { role?: string; activeOnly?: string };

      const where: any = {};

      if (role) {
        where.role = role.toUpperCase();
      }

      // Customers cannot see other users list
      if (request.user!.role === 'CUSTOMER') {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Customers cannot view user list',
          },
        });
      }

      // Only show active users by default
      if (activeOnly !== 'false') {
        where.isActive = true;
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      });

      return reply.send(users);
    }
  );

  /**
   * GET /api/v1/users/:id
   * Get single user by ID
   */
  app.get(
    '/users/:id',
    { preHandler: [requireRole('ADMIN', 'STAFF')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.send(user);
    }
  );
}
