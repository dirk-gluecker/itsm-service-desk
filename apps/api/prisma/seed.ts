/**
 * Seed Script for ITSM Service Desk "Desk"
 * 
 * Creates initial data:
 * - 1 Admin user
 * - 2 Staff users
 * - 2 Customer users
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - comment out for production)
  await cleanupExistingData();

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const staffPassword = await bcrypt.hash('Staff123!', SALT_ROUNDS);
  const customerPassword = await bcrypt.hash('Customer123!', SALT_ROUNDS);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@itsm.local',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Created admin: ${admin.email} (${admin.id})`);

  // Create Staff Users
  const staff1 = await prisma.user.create({
    data: {
      email: 'agent.smith@itsm.local',
      passwordHash: staffPassword,
      name: 'Agent Smith',
      role: 'STAFF',
      isActive: true,
    },
  });
  console.log(`✅ Created staff: ${staff1.email} (${staff1.id})`);

  const staff2 = await prisma.user.create({
    data: {
      email: 'agent.jones@itsm.local',
      passwordHash: staffPassword,
      name: 'Agent Jones',
      role: 'STAFF',
      isActive: true,
    },
  });
  console.log(`✅ Created staff: ${staff2.email} (${staff2.id})`);

  // Create Customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash: customerPassword,
      name: 'John Doe',
      role: 'CUSTOMER',
      isActive: true,
    },
  });
  console.log(`✅ Created customer: ${customer1.email} (${customer1.id})`);

  const customer2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      passwordHash: customerPassword,
      name: 'Jane Smith',
      role: 'CUSTOMER',
      isActive: true,
    },
  });
  console.log(`✅ Created customer: ${customer2.email} (${customer2.id})`);

  // Create Role Definitions (for future RBAC)
  await prisma.roleDefinition.createMany({
    data: [
      {
        name: 'ADMIN',
        description: 'Full system access',
        permissions: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          tickets: ['create', 'read', 'update', 'delete', 'assign'],
          comments: ['create', 'read', 'update', 'delete', 'view_internal'],
          auditLogs: ['read', 'export'],
        }),
      },
      {
        name: 'STAFF',
        description: 'Service desk agent',
        permissions: JSON.stringify({
          users: ['read'],
          tickets: ['create', 'read', 'update', 'assign'],
          comments: ['create', 'read', 'update', 'view_internal'],
          auditLogs: ['read'],
        }),
      },
      {
        name: 'CUSTOMER',
        description: 'End user',
        permissions: JSON.stringify({
          users: ['read'],
          tickets: ['create', 'read_own'],
          comments: ['create_own', 'read_own'],
          auditLogs: [],
        }),
      },
    ],
  });
  console.log('✅ Created role definitions');

  // Create sample tickets with audit logs
  const ticket1 = await prisma.ticket.create({
    data: {
      key: 'TK-0001',
      title: 'Cannot access company email',
      description: 'I am unable to login to my email account since this morning. Getting an authentication error.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'INCIDENT',
      customer: { connect: { id: customer1.id } },
      assignee: { connect: { id: staff1.id } },
    },
  });
  console.log(`✅ Created ticket: ${ticket1.key}`);

  // Audit log for ticket creation
  await prisma.auditLog.create({
    data: {
      action: 'CREATED',
      entityType: 'Ticket',
      entityId: ticket1.id,
      actorId: customer1.id,
      timestamp: ticket1.createdAt,
      newValue: JSON.stringify({
        key: ticket1.key,
        title: ticket1.title,
        status: 'OPEN',
      }),
    },
  });

  // Audit log for status change
  await prisma.auditLog.create({
    data: {
      action: 'STATUS_CHANGED',
      field: 'status',
      entityType: 'Ticket',
      entityId: ticket1.id,
      ticketEntityId: ticket1.id,
      actorId: staff1.id,
      oldValue: JSON.stringify({ status: 'OPEN' }),
      newValue: JSON.stringify({ status: 'IN_PROGRESS' }),
      metadata: JSON.stringify({ assignedTo: staff1.name }),
    },
  });

  // Add a comment to ticket1
  await prisma.comment.create({
    data: {
      content: 'Investigating the issue. Checking server logs.',
      isInternal: false,
      ticket: { connect: { id: ticket1.id } },
      author: { connect: { id: staff1.id } },
    },
  });
  console.log('✅ Added comment to TK-0001');

  const ticket2 = await prisma.ticket.create({
    data: {
      key: 'TK-0002',
      title: 'Request for software installation',
      description: 'I need Adobe Acrobat Pro installed on my workstation for document processing tasks.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'SERVICE_REQUEST',
      customer: { connect: { id: customer2.id } },
    },
  });
  console.log(`✅ Created ticket: ${ticket2.key}`);

  await prisma.auditLog.create({
    data: {
      action: 'CREATED',
      entityType: 'Ticket',
      entityId: ticket2.id,
      actorId: customer2.id,
      timestamp: ticket2.createdAt,
      newValue: JSON.stringify({
        key: ticket2.key,
        title: ticket2.title,
        status: 'OPEN',
      }),
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      key: 'TK-0003',
      title: 'Printer not responding',
      description: 'The network printer on floor 3 is showing offline status and not responding to print jobs.',
      status: 'DONE',
      priority: 'LOW',
      category: 'INCIDENT',
      customer: { connect: { id: customer1.id } },
      assignee: { connect: { id: staff2.id } },
    },
  });
  console.log(`✅ Created ticket: ${ticket3.key}`);

  // Full audit trail for resolved ticket
  await prisma.auditLog.create({
    data: {
      action: 'CREATED',
      entityType: 'Ticket',
      entityId: ticket3.id,
      actorId: customer1.id,
      timestamp: ticket3.createdAt,
      newValue: JSON.stringify({ status: 'OPEN' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'ASSIGNED',
      field: 'assigneeId',
      entityType: 'Ticket',
      entityId: ticket3.id,
      ticketEntityId: ticket3.id,
      actorId: admin.id,
      oldValue: JSON.stringify({ assigneeId: null }),
      newValue: JSON.stringify({ assigneeId: staff2.id, assigneeName: staff2.name }),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'STATUS_CHANGED',
      field: 'status',
      entityType: 'Ticket',
      entityId: ticket3.id,
      ticketEntityId: ticket3.id,
      actorId: staff2.id,
      oldValue: JSON.stringify({ status: 'OPEN' }),
      newValue: JSON.stringify({ status: 'IN_PROGRESS' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'STATUS_CHANGED',
      field: 'status',
      entityType: 'Ticket',
      entityId: ticket3.id,
      ticketEntityId: ticket3.id,
      actorId: staff2.id,
      oldValue: JSON.stringify({ status: 'IN_PROGRESS' }),
      newValue: JSON.stringify({ status: 'DONE' }),
    },
  });

  console.log('✅ Created sample tickets with audit trails');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:    admin@itsm.local / Admin123!');
  console.log('   Staff 1:  agent.smith@itsm.local / Staff123!');
  console.log('   Staff 2:  agent.jones@itsm.local / Staff123!');
  console.log('   Customer 1: john.doe@example.com / Customer123!');
  console.log('   Customer 2: jane.smith@example.com / Customer123!');
}

async function cleanupExistingData(): Promise<void> {
  console.log('🗑️  Cleaning existing data...');
  
  // Delete in correct order due to foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.roleDefinition.deleteMany();
  
  console.log('✅ Cleanup complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
