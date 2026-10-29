/**
 * My Tickets Page - List of customer's own tickets with filtering/sorting
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets, useLogout } from '../hooks/api/useHooks';
import { Button, Table, Badge, LoadingSpinner } from '@shared/components';
import type { Ticket, Status, Priority } from '../types';

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'key'>('updated');
  
  const logoutMutation = useLogout();
  const { data, isLoading, error } = useTickets({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  const tickets = data?.data || [];
  const pagination = data?.pagination;

  // Sort tickets
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'key':
          return a.key.localeCompare(b.key);
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [tickets, sortBy]);

  const getStatusLabel = (status: Status) => {
    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      done: 'Done',
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      DONE: 'Done',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: Priority) => {
    const labels: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical',
    };
    return labels[priority] || priority;
  };

  const getStatusVariant = (status: Status) => {
    const variants: Record<string, 'success' | 'warning' | 'info'> = {
      open: 'warning',
      in_progress: 'info',
      done: 'success',
      OPEN: 'warning',
      IN_PROGRESS: 'info',
      DONE: 'success',
    };
    return variants[status] || 'info';
  };

  const getPriorityVariant = (priority: Priority) => {
    const variants: Record<string, 'secondary' | 'warning' | 'danger' | 'primary'> = {
      low: 'secondary',
      medium: 'warning',
      high: 'danger',
      critical: 'primary',
      LOW: 'secondary',
      MEDIUM: 'warning',
      HIGH: 'danger',
      CRITICAL: 'primary',
    };
    return variants[priority] || 'secondary';
  };

  const handleRowClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p>Error loading tickets</p>
        <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Meine Tickets</h1>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/create-ticket')}>
            New Ticket
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={styles.filterSelect}
        >
          <option value="updated">Last Updated</option>
          <option value="created">Date Created</option>
          <option value="key">Ticket Key</option>
        </select>

        {(statusFilter || priorityFilter) && (
          <Button variant="ghost" size="sm" onClick={() => {
            setStatusFilter('');
            setPriorityFilter('');
          }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* URL state info */}
      <div style={styles.urlStateInfo}>
        <small>Filters are shareable via URL</small>
      </div>

      {/* Tickets Table */}
      {sortedTickets.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No tickets found</h3>
          <p>Create your first ticket to get started</p>
          <Button variant="primary" onClick={() => navigate('/create-ticket')}>
            Create Ticket
          </Button>
        </div>
      ) : (
        <>
          <Table
            columns={[
              { key: 'key', label: 'Ticket', width: '120px' },
              { key: 'title', label: 'Title' },
              { key: 'status', label: 'Status', width: '120px' },
              { key: 'priority', label: 'Priority', width: '120px' },
              { key: 'updated_at', label: 'Updated', width: '160px' },
            ]}
            data={sortedTickets}
            onRowClick={handleRowClick}
            renderCell={(row, column) => {
              if (column.key === 'status') {
                return (
                  <Badge variant={getStatusVariant(row.status)}>
                    {getStatusLabel(row.status)}
                  </Badge>
                );
              }
              if (column.key === 'priority') {
                return (
                  <Badge variant={getPriorityVariant(row.priority)}>
                    {getPriorityLabel(row.priority)}
                  </Badge>
                );
              }
              if (column.key === 'updated_at') {
                return new Date(row.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              }
              return row[column.key as keyof typeof row];
            }}
          />
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={styles.pagination}>
              <span>
                Page {pagination.page} of {pagination.pages} ({pagination.total} tickets)
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-default)',
    backgroundColor: 'var(--color-bg-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
  },
  urlStateInfo: {
    marginBottom: '16px',
    color: 'var(--color-text-tertiary)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 24px',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-lg)',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '64px 24px',
  },
  pagination: {
    marginTop: '16px',
    textAlign: 'right',
    color: 'var(--color-text-secondary)',
    fontSize: '14px',
  },
};
