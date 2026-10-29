/**
 * useStaffActions.ts - Staff/Agent specific actions
 * Handles: ticket assignment, status changes, internal notes
 */

import { useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Ticket, User } from '@/types';

interface AssignTicketParams {
  ticketId: string;
  assigneeId: string | null;
}

interface StatusChangeParams {
  ticketId: string;
  newStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';
}

interface InternalNoteParams {
  ticketId: string;
  content: string;
}

/**
 * Hook for staff-specific ticket actions
 */
export function useStaffActions() {
  /**
   * Assign a ticket to a staff member or unassign it
   * @param params.ticketId - The ticket to assign
   * @param params.assigneeId - UUID of staff member, or null to unassign
   */
  const assignTicket = useCallback(async ({ ticketId, assigneeId }: AssignTicketParams): Promise<Ticket> => {
    const response = await apiClient.patch(`/tickets/${ticketId}`, {
      assignee_id: assigneeId,
    });
    return response.data;
  }, []);

  /**
   * Change ticket status (any transition allowed for staff)
   * Unlike customer view, staff can reopen closed tickets, etc.
   * @param params.ticketId - The ticket to update
   * @param params.newStatus - Target status
   */
  const changeStatus = useCallback(async ({ ticketId, newStatus }: StatusChangeParams): Promise<Ticket> => {
    const response = await apiClient.patch(`/tickets/${ticketId}`, {
      status: newStatus.toLowerCase().replace('_', '_') as any,
    });
    return response.data;
  }, []);

  /**
   * Create an internal note (visible only to staff/admin)
   * @param params.ticketId - The ticket to comment on
   * @param params.content - Note content
   */
  const createInternalNote = useCallback(async ({ ticketId, content }: InternalNoteParams): Promise<any> => {
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, {
      content,
      is_internal: true,
    });
    return response.data;
  }, []);

  /**
   * Auto-assign ticket to current user
   * Convenience method for "assign to me" functionality
   * @param ticketId - The ticket to assign
   * @param currentUserId - Current user's UUID (from auth context)
   */
  const assignToSelf = useCallback(async (ticketId: string, currentUserId: string): Promise<Ticket> => {
    return assignTicket({ ticketId, assigneeId: currentUserId });
  }, [assignTicket]);

  /**
   * Bulk status update for multiple tickets
   * @param ticketIds - Array of ticket UUIDs
   * @param newStatus - Target status for all tickets
   */
  const bulkStatusChange = useCallback(async (
    ticketIds: string[],
    newStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED'
  ): Promise<{ success: string[]; failed: string[] }> => {
    const results = await Promise.allSettled(
      ticketIds.map(id => changeStatus({ ticketId: id, newStatus }))
    );
    
    const success: string[] = [];
    const failed: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(ticketIds[index]);
      } else {
        failed.push(ticketIds[index]);
      }
    });
    
    return { success, failed };
  }, [changeStatus]);

  /**
   * Move ticket between Kanban columns
   * Handles auto-assignment logic when moving to "In Bearbeitung" without assignee
   * @param ticketId - The ticket to move
   * @param targetStatus - Target column/status
   * @param currentUserId - Current user's UUID for auto-assign
   * @param currentAssignee - Current assignee ID (null if unassigned)
   */
  const moveTicketToColumn = async (
    ticketId: string,
    targetStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED',
    currentUserId: string,
    currentAssignee: string | null
  ): Promise<Ticket> => {
    // If moving to IN_PROGRESS without assignee, auto-assign to current user
    if (targetStatus === 'IN_PROGRESS' && !currentAssignee) {
      return assignToSelf(ticketId, currentUserId);
    }
    
    // Otherwise just change status
    return changeStatus({ ticketId, newStatus: targetStatus });
  };

  return {
    assignTicket,
    changeStatus,
    createInternalNote,
    assignToSelf,
    bulkStatusChange,
    moveTicketToColumn,
  };
}

/**
 * Helper to get available staff members for assignment dropdown
 */
export async function getStaffMembers(): Promise<User[]> {
  const response = await apiClient.get('/users?role=STAFF');
  return response.data;
}

/**
 * Validate status transition (optional validation layer)
 * Note: Backend allows any transition, but UI can add business rules here
 */
export function validateStatusTransition(
  _currentStatus: string,
  _newStatus: string
): { valid: boolean; reason?: string } {
  // Currently backend allows any transition, so everything is valid
  // Future: Add business rules like "cannot skip in_progress" etc.
  return { valid: true };
}
