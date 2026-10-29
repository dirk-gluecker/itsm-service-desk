import { prisma } from '../lib/prisma.js';

export type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'USER_CREATED' | 'TICKET_DELETED' | 'COMMENT_ADDED' | 'TICKET_CREATED';


export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ticketId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      field: entry.field || null,
      oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
      ticketEntityId: entry.ticketId || null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    },
  });
}

/**
 * Get audit logs for a specific ticket
 */
export async function getTicketAuditLogs(ticketId: string) {
  return prisma.auditLog.findMany({
    where: { ticketEntityId: ticketId },
    orderBy: { timestamp: 'desc' },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Middleware helper for wrapping operations with audit context
 */
export async function withAudit<T>(
  actorId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  operation: () => Promise<T>,
  options?: {
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    metadata?: Record<string, unknown>;
    ticketEntityId?: string;
  },
): Promise<T> {
  const result = await operation();

  await prisma.auditLog.create({
    data: {
      action,
      field: options?.field || null,
      oldValue: options?.oldValue ? JSON.stringify(options.oldValue) : null,
      newValue: options?.newValue ? JSON.stringify(options.newValue) : null,
      metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
      timestamp: new Date(),
      actorId,
      entityType,
      entityId,
      ticketEntityId: options?.ticketEntityId || null,
    },
  });

  return result;
}

/**
 * Get audit stats for performance monitoring
 */
export async function getAuditStats() {
  const total = await prisma.auditLog.count();
  const last24h = await prisma.auditLog.count({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    total,
    last24h,
    avgPerDay: Math.round(total / 30), // Approximate over 30 days
  };
}

/**
 * Creates a Prisma middleware for automatic audit logging.
 * Must be called after prisma client instantiation but before any queries.
 * Note: Requires Prisma Client generated with --datasource-provider for middleware support
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enableAuditLogging(_prismaClient: any): void {
  // This is disabled due to Prisma version compatibility issues
  // Middleware should be set up directly in lib/prisma.ts if needed
  console.log('enableAuditLogging: To be configured in production with proper Prisma setup');
}
