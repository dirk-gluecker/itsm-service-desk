import { PrismaClient } from '@prisma/client';

/**
 * Mock Database Utilities for Testing
 * 
 * Provides an in-memory SQLite database for tests that doesn't persist data
 * between runs. Each test gets a fresh database instance.
 */

// Singleton pattern for database client reuse across tests
let prismaInstance: PrismaClient | null = null;

/**
 * Get the Prisma client instance
 * Creates a new instance if none exists
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

/**
 * Reset the database to empty state
 * Call before each test or test suite
 */
export async function resetDatabase(): Promise<void> {
  const prisma = getPrismaClient();
  
  // Disable constraints temporarily
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=OFF');
  
  // Delete all records from each table (order matters due to FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  
  // Re-enable constraints
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON');
}

/**
 * Drop all tables (destructive operation)
 * Use during cleanup, not before each test
 */
export async function dropAllTables(): Promise<void> {
  const prisma = getPrismaClient();
  
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=OFF');
  
  // Get all table names
  const tables = await prisma.$queryRaw<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  
  // Drop each table
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.name}"`);
    } catch (err) {
      console.warn(`Failed to drop table ${table.name}:`, err);
    }
  }
  
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON');
}

/**
 * Create test seed data
 * Returns created objects for assertions
 */
export interface TestSeedData {
  adminUser: { id: string; email: string };
  agentUsers: Array<{ id: string; email: string }>;
  customerUsers: Array<{ id: string; email: string }>;
  tickets: Array<{ id: string; title: string; status: string }>;
}

export async function seedTestData(): Promise<TestSeedData> {
  const prisma = getPrismaClient();
  const bcrypt = await import('bcrypt');
  
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  
  // Create agent users
  const agentUsers: Array<{ id: string; email: string }> = [];
  for (let i = 1; i <= 2; i++) {
    const user = await prisma.user.create({
      data: {
        email: `agent${i}@test.com`,
        password: hashedPassword,
        role: 'AGENT',
      },
    });
    agentUsers.push({ id: user.id, email: user.email });
  }
  
  // Create customer users
  const customerUsers: Array<{ id: string; email: string }> = [];
  for (let i = 1; i <= 2; i++) {
    const user = await prisma.user.create({
      data: {
        email: `customer${i}@test.com`,
        password: hashedPassword,
        role: 'END_USER',
      },
    });
    customerUsers.push({ id: user.id, email: user.email });
  }
  
  // Create some tickets
  const tickets: Array<{ id: string; title: string; status: string }> = [];
  for (let i = 1; i <= 3; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        title: `Test Ticket ${i}`,
        description: `This is test ticket number ${i} with detailed description.`,
        status: i === 1 ? 'open' : i === 2 ? 'in_progress' : 'done',
        creatorId: customerUsers[0].id,
      },
    });
    tickets.push({ id: ticket.id, title: ticket.title, status: ticket.status });
  }
  
  return { adminUser, agentUsers, customerUsers, tickets };
}

/**
 * In-memory mock repository for unit tests
 * Avoids database calls entirely for pure unit testing
 */
export class MockTicketRepository {
  private tickets: Map<string, any> = new Map();
  private auditLogs: Map<string, any> = new Map();
  private nextTicketId = 1;
  private nextAuditId = 1;

  async findAll(): Promise<any[]> {
    return Array.from(this.tickets.values());
  }

  async findById(id: string): Promise<any | null> {
    return this.tickets.get(id) || null;
  }

  async create(data: Partial<any>): Promise<any> {
    const ticket = {
      id: String(this.nextTicketId++),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async update(id: string, data: Partial<any>): Promise<any | null> {
    const ticket = this.tickets.get(id);
    if (!ticket) return null;
    
    const updated = { ...ticket, ...data, updatedAt: new Date() };
    this.tickets.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tickets.delete(id);
  }

  async addAuditLog(data: Partial<any>): Promise<any> {
    const log = {
      id: String(this.nextAuditId++),
      timestamp: new Date(),
      ...data,
    };
    this.auditLogs.set(log.id, log);
    return log;
  }

  async getAuditLogsForTicket(ticketId: string): Promise<any[]> {
    return Array.from(this.auditLogs.values()).filter(
      (log) => log.entityId === ticketId
    );
  }
}

/**
 * Clear all test databases
 * Use during global teardown
 */
export async function clearTestDatabases(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
  
  // Also remove temporary db file if it exists
  const fs = await import('fs');
  const path = await import('path');
  const dbPath = path.join(process.cwd(), 'dev.db');
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}
