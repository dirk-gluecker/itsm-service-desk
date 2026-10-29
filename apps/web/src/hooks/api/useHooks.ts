/**
 * React Query hooks for API calls
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, ticketsAPI, commentsAPI, usersAPI } from '../lib/apiServices';
import type { User, Ticket, Comment, AuditLog } from '../../types';

// Auth hooks
export const useAuth = () => {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) => authAPI.login(data),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) => authAPI.register(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      queryClient.clear();
    },
  });
};

export const useCurrentUser = () => {
  return useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const user = await authAPI.getMe();
        return user;
      } catch {
        return null;
      }
    },
    staleTime: Infinity,
  });
};

// Tickets hooks
export const useTickets = (filters?: { status?: string; priority?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketsAPI.list(filters),
  });
};

export const useTicket = (id: string | null) => {
  return useQuery<Ticket | null>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) return null;
      return ticketsAPI.getById(id);
    },
    enabled: !!id,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; category: string; priority?: string }) => 
      ticketsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status?: string; priority?: string; assignee_id?: string | null; title?: string; description?: string } }) => 
      ticketsAPI.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

// Comments hooks
export const useComments = (ticketId: string | null) => {
  return useQuery<Comment[]>({
    queryKey: ['comments', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      return commentsAPI.getByTicketId(ticketId);
    },
    enabled: !!ticketId,
  });
};

export const useCreateComment = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; is_internal?: boolean }) => 
      commentsAPI.create(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
    },
  });
};

// Audit logs hook
export const useAuditLogs = (ticketId: string | null) => {
  return useQuery<AuditLog[]>({
    queryKey: ['auditLogs', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      return ticketsAPI.getAuditLogs(ticketId);
    },
    enabled: !!ticketId,
  });
};

// Users hooks
export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersAPI.list(),
  });
};
