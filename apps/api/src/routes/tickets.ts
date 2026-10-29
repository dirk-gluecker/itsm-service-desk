import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/rbac.js';
import { logAudit, getTicketAuditLogs } from '../utils/audit.js';

export async function ticketRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/tickets
   * List tickets - visibility depends on role
   * - ADMIN: All tickets
   * - STAFF: All tickets (can filter by assignee)
   * - CUSTOMER: Only their own tickets
   */
  app.get('/', { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] }, async (request, reply) => {
    const { status, priority, page = 1, limit = 20 } = request.query as {
      status?: string;
      priority?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // Max 100 per page

    // Build where clause based on role
    const where: any = {};

    if (request.user!.role === 'CUSTOMER') {
      where.customerId = request.user!.userId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (priority) {
      where.priority = priority.toUpperCase();
    }

    // Get total count
    const total = await prisma.ticket.count({ where });
    const pages = Math.ceil(total / take);

    // Get tickets
    const tickets = await prisma.ticket.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return reply.send({
      data: tickets,
      pagination: {
        page: Number(page),
        limit,
        total,
        pages,
      },
    });
  });

  /**
   * GET /api/v1/tickets/:id
   * Get single ticket by ID
   * - ADMIN: Can view all
   * - STAFF: Can view all
   * - CUSTOMER: Can only view their own tickets
   */
  app.get('/:id', { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Support both UUID and ticket key (TK-XXXX)
    let whereClause: any = {};
    if (id.startsWith('TK-')) {
      whereClause = { key: id };
    } else {
      whereClause = { id };
    }

    const ticket = await prisma.ticket.findFirst({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!ticket) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        },
      });
    }

    // Customer can only view their own tickets
    if (request.user!.role === 'CUSTOMER' && ticket.customerId !== request.user!.userId) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own tickets',
        },
      });
    }

    return reply.send(ticket);
  });

  /**
   * POST /api/v1/tickets
   * Create a new ticket (Customer or Staff can create)
   */
  app.post('/', { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] }, async (request, reply) => {
    const { title, description, category, priority } = request.body as {
      title: string;
      description: string;
      category: string;
      priority: string;
    };

    // Validate required fields
    if (!title || !description) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Title and description are required',
        },
      });
    }

    // Generate ticket key
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const nextId = lastTicket ? parseInt(lastTicket.key.split('-')[1]) + 1 : 1;
    const key = `TK-${nextId.toString().padStart(4, '0')}`;

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        key,
        title,
        description,
        category: (category || 'INCIDENT').toUpperCase() as 'INCIDENT' | 'SERVICE_REQUEST' | 'QUERY' | 'OTHER',
        priority: (priority || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        customerId: request.user!.userId,
        status: 'OPEN',
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit
    await logAudit({
      actorId: request.user!.userId,
      action: 'TICKET_CREATED',
      entityType: 'Ticket',
      entityId: ticket.id,
      ticketId: ticket.id,
      metadata: { key, title, status: 'OPEN' },
    });

    return reply.status(201).send(ticket);
  });

  /**
   * PATCH /api/v1/tickets/:id
   * Update ticket (Staff/Admin only)
   */
  app.patch(
    '/:id',
    { preHandler: [requireRole('ADMIN', 'STAFF')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updates = request.body as {
        status?: string;
        priority?: string;
        assignee_id?: string | null;
        title?: string;
        description?: string;
      };

      // Support both UUID and ticket key
      let whereClause: any = {};
      if (id.startsWith('TK-')) {
        whereClause = { key: id };
      } else {
        whereClause = { id };
      }

      const existingTicket = await prisma.ticket.findFirst({ where: whereClause });

      if (!existingTicket) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Ticket not found',
          },
        });
      }

      // Build update data
      const updateData: any = {};

      if (updates.status) {
        updateData.status = updates.status.toUpperCase();
        
        // Log status change only if we have a valid user ID
        try {
          await logAudit({
            actorId: request.user!.userId,
            action: 'STATUS_CHANGED',
            entityType: 'Ticket',
            entityId: existingTicket.id,  // Use existingTicket.id for consistency
            ticketId: existingTicket.id,   // Same as entityId
            field: 'status',
            oldValue: existingTicket.status,
            newValue: updateData.status,
          });
        } catch (error) {
          // Audit log failed but don't fail the update
          console.warn('Failed to create audit log:', error);
        }
      }

      if (updates.priority) {
        updateData.priority = updates.priority.toUpperCase();
      }

      if (updates.assignee_id !== undefined) {
        updateData.assigneeId = updates.assignee_id || null;

        // Log assignment change
        await logAudit({
          actorId: request.user!.userId,
          action: 'ASSIGNED',
          entityType: 'Ticket',
          entityId: id,
          ticketId: id,
          field: 'assigneeId',
          oldValue: existingTicket.assigneeId,
          newValue: updateData.assigneeId,
        });
      }

      if (updates.title) {
        updateData.title = updates.title;
      }

      if (updates.description) {
        updateData.description = updates.description;
      }

      const ticket = await prisma.ticket.update({
        where: { id: existingTicket.id },  // Use existingTicket.id for the actual update
        data: updateData,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return reply.send(ticket);
    }
  );

  /**
   * DELETE /api/v1/tickets/:id
   * Delete ticket (Admin only)
   */
  app.delete('/:id', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        },
      });
    }

    await prisma.ticket.delete({ where: { id } });

    // Log deletion
    await logAudit({
      actorId: request.user!.userId,
      action: 'TICKET_DELETED',
      entityType: 'Ticket',
      entityId: id,
      ticketId: id,
      oldValue: { key: ticket.key, title: ticket.title },
    });

    return reply.status(204).send();
  });

  /**
   * GET /api/v1/tickets/:id/audit
   * Get audit logs for a specific ticket
   */
  app.get('/:id/audit', { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        },
      });
    }

    // Customer can only view audit logs for their own tickets
    if (request.user!.role === 'CUSTOMER' && ticket.customerId !== request.user!.userId) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view audit logs for your own tickets',
        },
      });
    }

    const auditLogs = await getTicketAuditLogs(id);

    return reply.send(auditLogs);
  });
}
