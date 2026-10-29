/**
 * DashboardPage.tsx - Staff Agent Dashboard
 * Filterable ticket list with search and URL state synchronization
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTickets } from '@/hooks/api/useHooks';
import type { Ticket } from '@/types';
import { 
  Button, 
  StatusBadge, 
  PriorityBadge,
  Card,
  Table,
  Column,
  SkeletonLoader,
  Badge,
} from '@/components/shared';

// German label mappings per SPEC (formal "Sie" for customer-facing)
const STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  done: 'Erledigt',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

const CATEGORY_LABELS: Record<string, string> = {
  incident: 'Incident',
  service_request: 'Service Request',
};

// Default page size matching SPEC pagination requirement
const DEFAULT_PAGE_SIZE = 20;

interface FilterState {
  status: string;
  priority: string;
  category: string;
  assigneeId: string;
  search: string;
}

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    assigneeId: searchParams.get('assigneeId') || '',
    search: searchParams.get('search') || '',
  });
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [localSearch, setLocalSearch] = useState(filters.search);

  const { data: ticketsResponse, isLoading, error } = useTickets({
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    page: currentPage,
    limit: DEFAULT_PAGE_SIZE,
  });

  // Sync filters with URL params on change (debounced search)
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filters.status) newParams.set('status', filters.status);
    if (filters.priority) newParams.set('priority', filters.priority);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.assigneeId) newParams.set('assigneeId', filters.assigneeId);
    if (filters.search) newParams.set('search', filters.search);
    if (currentPage > 1) newParams.set('page', currentPage.toString());
    
    setSearchParams(newParams);
  }, [filters, currentPage, setSearchParams]);

  // Handle search input with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setFilters(prev => ({ ...prev, search: localSearch }));
        setCurrentPage(1); // Reset to first page on search
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, filters.search]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      assigneeId: '',
      search: '',
    });
    setLocalSearch('');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Define table columns
  const columns: Column<Ticket>[] = [
    {
      key: 'key',
      header: 'Ticket-ID',
      sortable: true,
      width: '100px',
      render: (ticket: Ticket) => (
        <Link to={`/staff/tickets/${ticket.id}`} style={{ color: 'var(--color-primary)' }}>
          {ticket.key}
        </Link>
      ),
    },
    {
      key: 'title',
      header: 'Titel',
      sortable: true,
      render: (ticket: Ticket) => (
        <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Link to={`/staff/tickets/${ticket.id}`} style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}>
            {ticket.title}
          </Link>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (ticket: Ticket) => <StatusBadge status={ticket.status as any}>{STATUS_LABELS[ticket.status]}</StatusBadge>,
    },
    {
      key: 'priority',
      header: 'Priorität',
      sortable: true,
      width: '110px',
      render: (ticket: Ticket) => <PriorityBadge priority={ticket.priority as any}>{PRIORITY_LABELS[ticket.priority]}</PriorityBadge>,
    },
    {
      key: 'category',
      header: 'Kategorie',
      sortable: true,
      width: '150px',
      render: (ticket: Ticket) => CATEGORY_LABELS[ticket.category],
    },
    {
      key: 'created_at',
      header: 'Erstellt',
      sortable: true,
      width: '130px',
      render: (ticket: Ticket) => new Date(ticket.created_at).toLocaleDateString('de-DE'),
    },
  ];

  if (error) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h2>Fehler beim Laden der Tickets</h2>
        <p>{(error as Error).message}</p>
        <Button onClick={() => window.location.reload()}>Neu laden</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
            Agent Dashboard
          </h1>
          <p style={{ margin: 'var(--spacing-xs) 0 0', color: 'var(--color-text-secondary)' }}>
            Übersicht aller Tickets
          </p>
        </div>
        <Link to="/staff/tickets/create">
          <Button variant="primary">Neues Ticket erstellen</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <Card style={{ padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Offene Tickets</div>
          {isLoading ? (
            <SkeletonLoader height={24} style={{ marginTop: 'var(--spacing-xs)', width: '60%' }} />
          ) : (
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-status-open-text)' }}>
              {ticketsResponse?.data.filter((t: Ticket) => t.status === 'open').length || 0}
            </div>
          )}
        </Card>
        <Card style={{ padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>In Bearbeitung</div>
          {isLoading ? (
            <SkeletonLoader height={24} style={{ marginTop: 'var(--spacing-xs)', width: '60%' }} />
          ) : (
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-status-in-progress-text)' }}>
              {ticketsResponse?.data.filter((t: Ticket) => t.status === 'in_progress').length || 0}
            </div>
          )}
        </Card>
        <Card style={{ padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Erledigt (letzte 30 Tage)</div>
          {isLoading ? (
            <SkeletonLoader height={24} style={{ marginTop: 'var(--spacing-xs)', width: '60%' }} />
          ) : (
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-status-done-text)' }}>
              {ticketsResponse?.data.filter((t: Ticket) => t.status === 'done').length || 0}
            </div>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Suchen
            </label>
            <input
              type="text"
              placeholder="Ticket-ID, Titel, Beschreibung..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-default)',
                fontSize: 'var(--font-size-base)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-default)',
                fontSize: 'var(--font-size-base)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">Alle Status</option>
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="done">Erledigt</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Priorität
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-default)',
                fontSize: 'var(--font-size-base)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">Alle Prioritäten</option>
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="critical">Kritisch</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '170px' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Kategorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-default)',
                fontSize: 'var(--font-size-base)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">Alle Kategorien</option>
              <option value="incident">Incident</option>
              <option value="service_request">Service Request</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="secondary">
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </Card>

      {/* Ticket Table */}
      {isLoading ? (
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} height={48} style={{ width: '100%' }} />
            ))}
          </div>
        </Card>
      ) : ticketsResponse?.data.length === 0 ? (
        <Card style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)' }}>
            Keine Tickets gefunden
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
              Filter löschen
            </Button>
          )}
        </Card>
      ) : (
        <>
          <Table<Ticket>
            columns={columns}
            data={ticketsResponse?.data || []}
          />

          {/* Pagination */}
          {ticketsResponse?.pagination.pages && ticketsResponse.pagination.pages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
            }}>
              <Button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="secondary"
              >
                Zurück
              </Button>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Seite {currentPage} von {ticketsResponse.pagination.pages}
              </span>
              <Button 
                onClick={() => setCurrentPage(p => Math.min(ticketsResponse!.pagination.pages, p + 1))}
                disabled={currentPage >= ticketsResponse.pagination.pages}
                variant="secondary"
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          {filters.status && (
            <Badge variant="neutral">{STATUS_LABELS[filters.status]}</Badge>
          )}
          {filters.priority && (
            <Badge variant="neutral">{PRIORITY_LABELS[filters.priority]}</Badge>
          )}
          {filters.category && (
            <Badge variant="neutral">{CATEGORY_LABELS[filters.category]}</Badge>
          )}
          {filters.search && (
            <Badge variant="neutral">Suche: "{filters.search}"</Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
