/**
 * API Services - HTTP client wrapper functions
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: { name: string; email: string; password: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// Tickets API
export const ticketsAPI = {
  list: async (filters?: { status?: string; priority?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = params.toString() ? `/tickets?${params.toString()}` : '/tickets';
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: { title: string; description: string; category: string; priority?: string }) => {
    const response = await apiClient.post('/tickets', data);
    return response.data;
  },

  update: async (id: string, data: { status?: string; priority?: string; assignee_id?: string }) => {
    const response = await apiClient.patch(`/tickets/${id}`, data);
    return response.data;
  },
};

// Comments API
export const commentsAPI = {
  list: async (ticketId: string) => {
    const response = await apiClient.get(`/tickets/${ticketId}/comments`);
    return response.data;
  },

  create: async (ticketId: string, data: { content: string; is_internal?: boolean }) => {
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, data);
    return response.data;
  },
};

// Audit Logs API
export const auditLogsAPI = {
  list: async (ticketId: string) => {
    const response = await apiClient.get(`/tickets/${ticketId}/audit`);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  list: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
};
