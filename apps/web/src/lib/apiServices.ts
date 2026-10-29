import api from './api'
import type { Ticket, User, PaginatedResponse } from '../types'

// Tickets API
export const ticketsAPI = {
  list: (filters?: { status?: string; priority?: string; page?: number; limit?: number }) => 
    api.get<PaginatedResponse<Ticket>>('/v1/tickets', { params: filters }),
  
  getById: (id: string) => 
    api.get<Ticket & { customer?: any; assignee?: any }>(`/v1/tickets/${id}`),
  
  create: (data: { title: string; description: string; category: string; priority?: string; customerId?: string }) => 
    api.post<Ticket>('/v1/tickets', data),
  
  update: (id: string, updates: { status?: string; priority?: string; assignee_id?: string | null; title?: string; description?: string }) => 
    api.patch<Ticket>(`/v1/tickets/${id}`, updates),
  
  delete: (id: string) => 
    api.delete(`/v1/tickets/${id}`),
  
  getAuditLogs: (id: string) => 
    api.get(`/v1/tickets/${id}/audit`),
}

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string }) => 
    api.post<{ token: string; user: User }>('/auth/login', data),
  
  logout: () => 
    api.post('/auth/logout'),
  
  register: (data: { name: string; email: string; password: string }) => 
    api.post<{ token: string; user: User }>('/auth/register', data),
  
  getMe: () => 
    api.get<User>('/auth/me'),
}

// Comments API
export const commentsAPI = {
  getByTicketId: (ticketId: string) => 
    api.get(`/v1/tickets/${ticketId}/comments`),
  
  create: (ticketId: string, data: { content: string; is_internal?: boolean }) => 
    api.post(`/v1/tickets/${ticketId}/comments`, data),
}

// Users API
export const usersAPI = {
  list: () => 
    api.get<User[]>('/v1/users'),
  
  getById: (id: string) => 
    api.get<User>(`/v1/users/${id}`),
}
