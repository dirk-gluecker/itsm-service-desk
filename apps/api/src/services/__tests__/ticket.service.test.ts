import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockTicketRepository } from '../../shared/test/db-utils.js';

describe('Ticket Service', () => {
  let repository: MockTicketRepository;

  beforeEach(() => {
    repository = new MockTicketRepository();
  });

  describe('create', () => {
    it('should create a new ticket with valid data', async () => {
      const result = await repository.create({
        title: 'Test Ticket',
        description: 'Test description',
        status: 'open',
        creatorId: 'user-123',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.title).toBe('Test Ticket');
      expect(result.status).toBe('open');
      expect(new Date(result.createdAt)).toBeInstanceOf(Date);
    });

    it('should auto-assign incrementing ID', async () => {
      const ticket1 = await repository.create({ title: 'First', status: 'open', creatorId: 'u1' });
      const ticket2 = await repository.create({ title: 'Second', status: 'open', creatorId: 'u1' });

      expect(ticket2.id).toBe('2');
    });
  });

  describe('findById', () => {
    it('should return ticket when exists', async () => {
      const created = await repository.create({ 
        title: 'Find Me', 
        status: 'open', 
        creatorId: 'u1' 
      });

      const found = await repository.findById(created.id);

      expect(found).toEqual(created);
    });

    it('should return null when ticket not found', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update existing ticket', async () => {
      const created = await repository.create({ 
        title: 'Old Title', 
        status: 'open', 
        creatorId: 'u1' 
      });

      const updated = await repository.update(created.id, { 
        title: 'New Title',
        status: 'in_progress'
      });

      expect(updated?.title).toBe('New Title');
      expect(updated?.status).toBe('in_progress');
      expect(new Date(updated?.updatedAt)).toBeInstanceOf(Date);
    });

    it('should return null when updating non-existent ticket', async () => {
      const result = await repository.update('non-existent', { title: 'Updated' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing ticket', async () => {
      const created = await repository.create({ title: 'Delete Me', status: 'open', creatorId: 'u1' });
      
      const deleted = await repository.delete(created.id);
      
      expect(deleted).toBe(true);
      expect(await repository.findById(created.id)).toBeNull();
    });

    it('should return false when deleting non-existent ticket', async () => {
      const result = await repository.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no tickets exist', async () => {
      const results = await repository.findAll();
      expect(results).toEqual([]);
    });

    it('should return all created tickets', async () => {
      await repository.create({ title: 'Ticket 1', status: 'open', creatorId: 'u1' });
      await repository.create({ title: 'Ticket 2', status: 'open', creatorId: 'u2' });

      const results = await repository.findAll();

      expect(results.length).toBe(2);
    });
  });

  describe('audit logs', () => {
    it('should create audit log entry', async () => {
      const log = await repository.addAuditLog({
        actorId: 'admin-123',
        action: 'status_change',
        entityType: 'Ticket',
        entityId: 'ticket-456',
        oldState: { status: 'open' },
        newState: { status: 'in_progress' },
      });

      expect(log.id).toBeTruthy();
      expect(log.action).toBe('status_change');
      expect(new Date(log.timestamp)).toBeInstanceOf(Date);
    });

    it('should retrieve audit logs for ticket', async () => {
      await repository.addAuditLog({
        actorId: 'admin',
        action: 'created',
        entityType: 'Ticket',
        entityId: 'ticket-123',
      });

      await repository.addAuditLog({
        actorId: 'admin',
        action: 'updated',
        entityType: 'Ticket',
        entityId: 'ticket-123',
      });

      await repository.addAuditLog({
        actorId: 'admin',
        action: 'deleted',
        entityType: 'Ticket',
        entityId: 'ticket-789',
      });

      const logs = await repository.getAuditLogsForTicket('ticket-123');

      expect(logs.length).toBe(2);
      expect(logs.every(l => l.entityId === 'ticket-123')).toBe(true);
    });
  });
});
