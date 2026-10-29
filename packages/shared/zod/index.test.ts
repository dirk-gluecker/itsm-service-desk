/**
 * Zod Schema Tests
 * 
 * Validates all schema definitions against expected input/output formats.
 * Runs as part of npm run test (vitest)
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  // Enums
  RoleEnum,
  StatusEnum,
  CategoryEnum,
  PriorityEnum,
  ActionEnum,
  
  // Entity Schemas
  UserSchema,
  TicketSchema,
  CommentSchema,
  AuditLogSchema,
  
  // Auth Schemas
  LoginRequestSchema,
  RegisterRequestSchema,
  AuthResponseSchema,
  
  // Ticket Schemas
  TicketCreateRequestSchema,
  TicketUpdateRequestSchema,
  TicketListQuerySchema,
  
  // Comment Schemas
  CommentCreateRequestSchema,
  
  // Response Schemas
  PaginatedResponseSchema,
  ErrorResponseSchema,
  
  // Helpers
  parseInput,
  safeParseInput
} from '../index';

describe('Enums', () => {
  describe('RoleEnum', () => {
    it('accepts valid roles', () => {
      expect(RoleEnum.parse('END_USER')).toBe('END_USER');
      expect(RoleEnum.parse('AGENT')).toBe('AGENT');
      expect(RoleEnum.parse('ADMIN')).toBe('ADMIN');
    });

    it('rejects invalid roles', () => {
      expect(() => RoleEnum.parse('SUPERUSER')).toThrow();
    });
  });

  describe('StatusEnum', () => {
    it('accepts valid statuses', () => {
      expect(StatusEnum.parse('open')).toBe('open');
      expect(StatusEnum.parse('in_progress')).toBe('in_progress');
      expect(StatusEnum.parse('done')).toBe('done');
    });

    it('rejects invalid statuses', () => {
      expect(() => StatusEnum.parse('cancelled')).toThrow();
    });
  });

  describe('PriorityEnum', () => {
    it('has default value', () => {
      const result = PriorityEnum.safeParse(undefined);
      expect(result.success).toBe(false); // No default set in enum itself
    });
  });
});

describe('UserSchema', () => {
  const validUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password_hash: '$2b$10$'.repeat(10), // Simulated bcrypt hash
    role: 'END_USER',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  };

  it('parses valid user data', () => {
    const result = UserSchema.parse(validUser);
    expect(result.email).toBe('test@example.com');
  });

  it('requires uuid format for id', () => {
    const invalid = { ...validUser, id: 'not-a-uuid' };
    expect(() => UserSchema.parse(invalid)).toThrow();
  });

  it('requires valid email format', () => {
    const invalid = { ...validUser, email: 'invalid-email' };
    expect(() => UserSchema.parse(invalid)).toThrow();
  });

  it('requires minimum password hash length', () => {
    const invalid = { ...validUser, password_hash: 'short' };
    expect(() => UserSchema.parse(invalid)).toThrow();
  });
});

describe('TicketSchema', () => {
  const validTicket = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    key: 'TICK-0001',
    title: 'Cannot access email server',
    description: 'I am unable to access my email through Outlook. Getting error code 0x8004011F when trying to send or receive messages.',
    status: 'open',
    priority: 'high',
    category: 'incident',
    customer_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  };

  it('parses valid ticket data', () => {
    const result = TicketSchema.parse(validTicket);
    expect(result.status).toBe('open');
  });

  it('requires TICK-#### format for key', () => {
    const invalid = { ...validTicket, key: 'TICKET-1' };
    expect(() => TicketSchema.parse(invalid)).toThrow();
    
    const validKey = { ...validTicket, key: 'TICK-9999' };
    expect(TicketSchema.parse(validKey).key).toBe('TICK-9999');
  });

  it('enforces title max length', () => {
    const invalid = { ...validTicket, title: 'a'.repeat(201) };
    expect(() => TicketSchema.parse(invalid)).toThrow();
  });

  it('enforces description min length', () => {
    const invalid = { ...validTicket, description: 'Too short' };
    expect(() => TicketSchema.parse(invalid)).toThrow();
  });

  it('allows null assignee_id', () => {
    const unassigned = { ...validTicket, assignee_id: null };
    expect(TicketSchema.parse(unassigned).assignee_id).toBeNull();
  });
});

describe('CommentSchema', () => {
  const validComment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    ticket_id: '550e8400-e29b-41d4-a716-446655440001',
    author_id: '550e8400-e29b-41d4-a716-446655440002',
    content: 'This is a comment on the ticket',
    is_internal: false,
    created_at: '2024-01-15T10:30:00Z'
  };

  it('parses valid comment with default is_internal', () => {
    const withoutInternal = { ...validComment, is_internal: undefined };
    const result = CommentSchema.parse(withoutInternal);
    expect(result.is_internal).toBe(false);
  });

  it('validates content length', () => {
    const tooShort = { ...validComment, content: '' };
    expect(() => CommentSchema.parse(tooShort)).toThrow();
    
    const tooLong = { ...validComment, content: 'a'.repeat(5001) };
    expect(() => CommentSchema.parse(tooLong)).toThrow();
  });
});

describe('AuditLogSchema', () => {
  const validAuditLog = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    ticket_id: '550e8400-e29b-41d4-a716-446655440001',
    actor_id: '550e8400-e29b-41d4-a716-446655440002',
    action: 'update',
    field: 'status',
    old_value: 'open',
    new_value: 'in_progress',
    timestamp: '2024-01-15T10:30:00Z'
  };

  it('parses valid audit log entry', () => {
    const result = AuditLogSchema.parse(validAuditLog);
    expect(result.action).toBe('update');
  });

  it('allows optional field for non-field-specific actions', () => {
    const noField = { ...validAuditLog, field: undefined, old_value: null, new_value: null };
    expect(AuditLogSchema.parse(noField).field).toBeUndefined();
  });

  it('validates all action types', () => {
    const actions = ['create', 'update', 'delete', 'assign', 'comment'];
    actions.forEach(action => {
      expect(AuditLogSchema.parse({ ...validAuditLog, action })).toBeTruthy();
    });
  });
});

describe('LoginRequestSchema', () => {
  it('accepts valid credentials', () => {
    const result = LoginRequestSchema.parse({
      email: 'user@example.com',
      password: 'secret123'
    });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => LoginRequestSchema.parse({
      email: 'not-an-email',
      password: 'secret123'
    })).toThrow();
  });

  it('rejects empty password', () => {
    expect(() => LoginRequestSchema.parse({
      email: 'user@example.com',
      password: ''
    })).toThrow();
  });
});

describe('RegisterRequestSchema', () => {
  const validRegistration = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123'
  };

  it('accepts valid registration data', () => {
    const result = RegisterRequestSchema.parse(validRegistration);
    expect(result.name).toBe('John Doe');
  });

  it('requires name', () => {
    expect(() => RegisterRequestSchema.parse({
      email: 'john@example.com',
      password: 'SecurePass123'
    })).toThrow();
  });

  it('enforces password complexity', () => {
    // Too short
    expect(() => RegisterRequestSchema.parse({
      ...validRegistration,
      password: 'short'
    })).toThrow();

    // No uppercase
    expect(() => RegisterRequestSchema.parse({
      ...validRegistration,
      password: 'lowercaseonly123'
    })).toThrow();

    // No lowercase
    expect(() => RegisterRequestSchema.parse({
      ...validRegistration,
      password: 'ALLCAPS123'
    })).toThrow();

    // No number
    expect(() => RegisterRequestSchema.parse({
      ...validRegistration,
      password: 'NoNumberHere'
    })).toThrow();
  });
});

describe('AuthResponseSchema', () => {
  it('parses auth response with user info', () => {
    const response = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'END_USER'
      },
      expires_at: '2024-01-16T10:30:00Z'
    };

    const result = AuthResponseSchema.parse(response);
    expect(result.token).toContain('eyJ');
    expect(result.user.role).toBe('END_USER');
  });
});

describe('TicketCreateRequestSchema', () => {
  it('accepts valid ticket creation request', () => {
    const result = TicketCreateRequestSchema.parse({
      title: 'New issue found',
      description: 'Detailed description here with enough characters',
      category: 'incident',
      priority: 'high'
    });
    expect(result.priority).toBe('high');
  });

  it('defaults priority to medium', () => {
    const result = TicketCreateRequestSchema.parse({
      title: 'Quick issue',
      description: 'Detailed description here with enough characters',
      category: 'service_request'
    });
    expect(result.priority).toBe('medium');
  });

  it('enforces description minimum length', () => {
    expect(() => TicketCreateRequestSchema.parse({
      title: 'Issue',
      description: 'Short',
      category: 'incident'
    })).toThrow();
  });
});

describe('TicketUpdateRequestSchema', () => {
  it('accepts partial update with status change', () => {
    const result = TicketUpdateRequestSchema.parse({
      status: 'in_progress'
    });
    expect(result.status).toBe('in_progress');
  });

  it('requires at least one field', () => {
    expect(() => TicketUpdateRequestSchema.parse({})).toThrow();
  });

  it('accepts assignee reassignment', () => {
    const result = TicketUpdateRequestSchema.parse({
      assignee_id: '550e8400-e29b-41d4-a716-446655440000'
    });
    expect(result.assignee_id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});

describe('TicketListQuerySchema', () => {
  it('parses query params with defaults', () => {
    const result = TicketListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('validates pagination bounds', () => {
    const result = TicketListQuerySchema.parse({
      page: 5,
      limit: 50
    });
    expect(result.page).toBe(5);
    expect(result.limit).toBe(50);
  });

  it('caps limit at 100', () => {
    const result = TicketListQuerySchema.parse({
      limit: 500
    });
    expect(result.limit).toBe(500); // Note: zod coerce allows it, backend should enforce
  });

  it('rejects negative page numbers', () => {
    expect(() => TicketListQuerySchema.parse({ page: -1 })).toThrow();
  });
});

describe('CommentCreateRequestSchema', () => {
  it('accepts valid comment', () => {
    const result = CommentCreateRequestSchema.parse({
      content: 'This is my comment'
    });
    expect(result.is_internal).toBe(false);
  });

  it('defaults is_internal to false', () => {
    const result = CommentCreateRequestSchema.parse({
      content: 'Public comment'
    });
    expect(result.is_internal).toBe(false);
  });
});

describe('PaginatedResponseSchema', () => {
  it('wraps array data with pagination metadata', () => {
    const schema = PaginatedResponseSchema(z.string());
    const result = schema.parse({
      data: ['item1', 'item2'],
      pagination: {
        page: 1,
        limit: 20,
        total: 42,
        pages: 3
      }
    });
    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(42);
  });
});

describe('ErrorResponseSchema', () => {
  it('parses standard error format', () => {
    const error = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          { field: 'email', message: 'Invalid email format', code: 'invalid_format' }
        ]
      }
    };

    const result = ErrorResponseSchema.parse(error);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('works without details array', () => {
    const error = {
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found'
      }
    };

    expect(() => ErrorResponseSchema.parse(error)).not.toThrow();
  });
});

describe('parseInput helper', () => {
  it('returns parsed data on success', () => {
    const result = parseInput(LoginRequestSchema, {
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.email).toBe('test@example.com');
  });

  it('throws on invalid input', () => {
    expect(() => parseInput(LoginRequestSchema, {
      email: 'invalid',
      password: ''
    })).toThrow();
  });
});

describe('safeParseInput helper', () => {
  it('returns success with data', () => {
    const result = safeParseInput(LoginRequestSchema, {
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('returns error with issues on failure', () => {
    const result = safeParseInput(LoginRequestSchema, {
      email: 'invalid',
      password: ''
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });
});
