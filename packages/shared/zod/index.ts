/**
 * Zod Schemas - Single Source of Truth for API Contracts
 * 
 * All request/response validation in the application should import from here.
 * Schemas are derived from Prisma models and API requirements in SPEC.md.
 */

import { z } from 'zod';

// ============== ENUMS ==============

export const RoleEnum = z.enum(['END_USER', 'AGENT', 'ADMIN']);
export type Role = z.infer<typeof RoleEnum>;

export const StatusEnum = z.enum(['open', 'in_progress', 'done']);
export type Status = z.infer<typeof StatusEnum>;

export const CategoryEnum = z.enum(['incident', 'service_request']);
export type Category = z.infer<typeof CategoryEnum>;

export const PriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export type Priority = z.infer<typeof PriorityEnum>;

export const ActionEnum = z.enum(['create', 'update', 'delete', 'assign', 'comment']);
export type Action = z.infer<typeof ActionEnum>;

// ============== USER SCHEMAS ==============

/** User entity schema - matches Prisma User model */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string().min(60), // bcrypt hash is typically 60 chars
  role: RoleEnum,
  name: z.string().min(1).max(100).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
export type User = z.infer<typeof UserSchema>;

/** Password validation helper */
export const PasswordStrengthSchema = z.string().min(8).max(128);

// ============== TICKET SCHEMAS ==============

/** Ticket entity schema - matches Prisma Ticket model */
export const TicketSchema = z.object({
  id: z.string().uuid(),
  key: z.string().regex(/^TICK-[0-9]{4}$/), // Human-readable ticket key like TICK-0001
  title: z.string().min(1).max(200),
  description: z.string().min(20).max(5000),
  status: StatusEnum,
  priority: PriorityEnum.default('medium'),
  category: CategoryEnum,
  assignee_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type Ticket = z.infer<typeof TicketSchema>;

// ============== COMMENT SCHEMAS ==============

/** Comment entity schema */
export const CommentSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().uuid(),
  author_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  is_internal: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
export type Comment = z.infer<typeof CommentSchema>;

// ============== AUDIT LOG SCHEMAS ==============

/** AuditLog entity schema - immutable audit trail */
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().uuid(),
  actor_id: z.string().uuid(),
  action: ActionEnum,
  field: z.string().optional(),
  old_value: z.any().optional().nullable(),
  new_value: z.any().optional().nullable(),
  timestamp: z.string().datetime()
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// ============== AUTH REQUEST/RESPONSE SCHEMAS ==============

/** Login request - email + password */
export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Register request - new user creation */
export const RegisterRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/** Auth response - JWT token + user info */
export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().optional(),
    role: RoleEnum
  }),
  expires_at: z.string().datetime().optional()
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/** Refresh token request */
export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string()
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

// ============== TICKET REQUEST/RESPONSE SCHEMAS ==============

/** Create ticket request */
export const TicketCreateRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: CategoryEnum,
  priority: PriorityEnum.default('medium')
});
export type TicketCreateRequest = z.infer<typeof TicketCreateRequestSchema>;

/** Update ticket request - only staff/agents */
export const TicketUpdateRequestSchema = z.object({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(20).max(5000).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});
export type TicketUpdateRequest = z.infer<typeof TicketUpdateRequestSchema>;

/** Ticket list query params */
export const TicketListQuerySchema = z.object({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assignee_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
export type TicketListQuery = z.infer<typeof TicketListQuerySchema>;

/** Paginated response wrapper */
export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      pages: z.number().int().positive()
    })
  });

// ============== COMMENT REQUEST/RESPONSE SCHEMAS ==============

/** Create comment request */
export const CommentCreateRequestSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000),
  is_internal: z.boolean().default(false)
});
export type CommentCreateRequest = z.infer<typeof CommentCreateRequestSchema>;

// ============== ERROR RESPONSE SCHEMAS ==============

/** Error detail for validation errors */
export const ErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional()
});

/** Standard error response format per AC-API-3 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ErrorDetailSchema).optional()
  })
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/** Health check response */
export const HealthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  version: z.string()
});

// ============== VALIDATION HELPERS ==============

/** Parse and validate input, throw on error */
export function parseInput<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

/** Safe parse - returns result object instead of throwing */
export function safeParseInput<T extends z.ZodType>(schema: T, data: unknown): z.SafeParseReturnType<T, z.infer<T>> {
  return schema.safeParse(data);
}

// Re-export common types for convenience
export type {
  User as UserType,
  Ticket as TicketType,
  Comment as CommentType,
  AuditLog as AuditLogType
};
