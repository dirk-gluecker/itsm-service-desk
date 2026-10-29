import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireRole } from '../middleware/rbac';
import { logAudit } from '../utils/audit';

export async function commentRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/tickets/:id/comments
   * Get all comments for a ticket
   * - ADMIN: See all comments (including internal)
   * - STAFF: See all comments (including internal)
   * - CUSTOMER: See only non-internal comments on their own tickets
   */
  app.get(
    '/tickets/:ticketId/comments',
    { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };

      // Check ticket exists
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

      if (!ticket) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Ticket not found',
          },
        });
      }

      // Customer can only view comments on their own tickets
      if (request.user!.role === 'CUSTOMER' && ticket.customerId !== request.user!.userId) {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view comments on your own tickets',
          },
        });
      }

      // Build where clause
      const where: any = { ticketId };

      // Customers cannot see internal comments
      if (request.user!.role === 'CUSTOMER') {
        where.isInternal = false;
      }

      const comments = await prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      return reply.send(comments);
    }
  );

  /**
   * POST /api/v1/tickets/:id/comments
   * Create a comment on a ticket
   * - ADMIN: Can post anywhere, including internal notes
   * - STAFF: Can post anywhere, including internal notes
   * - CUSTOMER: Can only post on their own tickets, no internal notes
   */
  app.post(
    '/tickets/:ticketId/comments',
    { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const { content, is_internal } = request.body as {
        content: string;
        is_internal?: boolean;
      };

      if (!content || content.trim().length === 0) {
        return reply.status(400).send({
          error: {
            code: 'BAD_REQUEST',
            message: 'Comment content is required',
          },
        });
      }

      // Check ticket exists
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

      if (!ticket) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Ticket not found',
          },
        });
      }

      // Customer can only comment on their own tickets
      if (request.user!.role === 'CUSTOMER' && ticket.customerId !== request.user!.userId) {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only comment on your own tickets',
          },
        });
      }

      // Customers cannot post internal comments
      let shouldBeInternal = is_internal || false;
      if (request.user!.role === 'CUSTOMER' && is_internal) {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Customers cannot post internal comments',
          },
        });
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          content,
          isInternal: shouldBeInternal,
          ticketId,
          authorId: request.user!.userId,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Log audit
      await logAudit({
        actorId: request.user!.userId,
        action: 'COMMENT_ADDED',
        entityType: 'Comment',
        entityId: comment.id,
        ticketId,
        newValue: { content: content.substring(0, 100) + '...' },
      });

      return reply.status(201).send(comment);
    }
  );
}
