/**
 * Type definitions matching the backend Zod schemas
 */

export type Role = 'END_USER' | 'AGENT' | 'ADMIN' | 'CUSTOMER' | 'STAFF';
export type Status = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'open' | 'in_progress' | 'done';
export type Category = 'INCIDENT' | 'SERVICE_REQUEST' | 'incident' | 'service_request';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical';
export type Action = 'create' | 'update' | 'delete' | 'assign' | 'comment';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string;
  key: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  assignee_id?: string | null;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at?: string;
  author?: User;
}

export interface AuditLog {
  id: string;
  ticket_id: string;
  actor_id: string;
  action: Action;
  field?: string;
  old_value?: any;
  new_value?: any;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expires_at?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
      code?: string;
    }>;
  };
}
