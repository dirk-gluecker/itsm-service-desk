/**
 * Customer-specific ticket card component
 */
import React from 'react';
import { Card, Badge } from '@shared/components';
import type { Ticket } from '../../types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticketId: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info'> = {
      open: 'warning',
      in_progress: 'info',
      done: 'success',
    };
    return variants[status] || 'info';
  };

  const getPriorityVariant = (priority: string) => {
    const variants: Record<string, 'secondary' | 'warning' | 'danger' | 'primary'> = {
      low: 'secondary',
      medium: 'warning',
      high: 'danger',
      critical: 'primary',
    };
    return variants[priority] || 'secondary';
  };

  return (
    <Card
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
      }}
      onClick={() => onClick?.(ticket.id)}
    >
      <div style={styles.header}>
        <span style={styles.ticketKey}>{ticket.key}</span>
        <div style={styles.badges}>
          <Badge variant={getStatusVariant(ticket.status)}>
            {ticket.status}
          </Badge>
          <Badge variant={getPriorityVariant(ticket.priority)}>
            {ticket.priority}
          </Badge>
        </div>
      </div>
      <h4 style={styles.title}>{ticket.title}</h4>
      <p style={styles.updated}>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</p>
    </Card>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  ticketKey: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-primary)',
  },
  badges: {
    display: 'flex',
    gap: '8px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    margin: '0 0 8px 0',
  },
  updated: {
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
    margin: 0,
  },
};
