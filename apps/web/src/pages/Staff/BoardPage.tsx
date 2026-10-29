/**
 * BoardPage.tsx - Kanban Board View for Staff Agents
 * Columns: Offen | In Bearbeitung | Erledigt
 * Features: Drag-and-drop, keyboard navigation, auto-assign on move
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTickets, useCurrentUser, useUpdateTicket } from '../../hooks/api/useHooks';
import type { Ticket } from '@/types';
import { 
  Button, 
  StatusBadge, 
  PriorityBadge,
  Card,
} from '@/components/shared';

// German label mappings
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

// Column definitions in German (per PLAN.md WP-D)
const COLUMNS = [
  { id: 'open', label: 'Offen', status: 'open' as const },
  { id: 'in_progress', label: 'In Bearbeitung', status: 'in_progress' as const },
  { id: 'done', label: 'Erledigt', status: 'done' as const },
];

interface FilterState {
  priority: string;
  category: string;
  assigneeId: string;
  search: string;
}

export const BoardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    assigneeId: searchParams.get('assigneeId') || '',
    search: searchParams.get('search') || '',
  });
  const [localSearch, setLocalSearch] = useState(filters.search);
  
  const { data: currentUser } = useCurrentUser();
  const updateMutation = useUpdateTicket();
  
  // Fetch all tickets (we'll filter client-side for better drag-and-drop UX)
  const { data: ticketsResponse, isLoading, error, refetch } = useTickets({
    priority: filters.priority || undefined,
    page: 1,
    limit: 100, // Fetch more for board view
  });

  const [tickets, setTickets] = useState<Record<string, Ticket[]>>({
    open: [],
    in_progress: [],
    done: [],
  });

  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showAssigneePicker, setShowAssigneePicker] = useState<{ ticketId: string; position: { x: number; y: number } } | null>(null);
  const assigneePickerRef = useRef<HTMLDivElement>(null);

  // Sync URL params with filters
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filters.priority) newParams.set('priority', filters.priority);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.assigneeId) newParams.set('assigneeId', filters.assigneeId);
    if (filters.search) newParams.set('search', filters.search);
    setSearchParams(newParams);
  }, [filters, setSearchParams]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setFilters(prev => ({ ...prev, search: localSearch }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search]);

  // Group tickets by status when data loads
  useEffect(() => {
    if (ticketsResponse?.data) {
      const grouped: Record<string, Ticket[]> = {
        open: [],
        in_progress: [],
        done: [],
      };

      const searchTerm = filters.search.toLowerCase();
      
      ticketsResponse.data.forEach((ticket: Ticket) => {
        // Client-side search filtering
        if (filters.search) {
          const matchesSearch = 
            ticket.key.toLowerCase().includes(searchTerm) ||
            ticket.title.toLowerCase().includes(searchTerm) ||
            ticket.description.toLowerCase().includes(searchTerm);
          if (!matchesSearch) return;
        }

        // Client-side category filtering
        if (filters.category && ticket.category !== filters.category) return;

        grouped[ticket.status].push(ticket);
      });

      // Sort each column by updated_at (newest first)
      Object.keys(grouped).forEach(status => {
        grouped[status].sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      setTickets(grouped);
    }
  }, [ticketsResponse?.data, filters.search, filters.category]);

  // Auto-assign logic when moving to "In Bearbeitung"
  const moveToColumn = useCallback(async (ticket: Ticket, newStatus: 'open' | 'in_progress' | 'done') => {
    const currentStatus = ticket.status;
    
    if (currentStatus === newStatus) return;

    const updateData: Partial<{ status: string; priority: string; assignee_id: string | null }> = {
      status: newStatus,
    };

    // Auto-assign to current user if moving to "In Bearbeitung" and no assignee
    if (newStatus === 'in_progress' && !ticket.assignee_id && currentUser) {
      updateData.assignee_id = currentUser.id;
    }

    try {
      await updateMutation.mutateAsync({ 
        id: ticket.id, 
        updates: updateData 
      });
      await refetch(); // Refresh data from server
      
      // Update local state optimistically
      setTickets(prev => {
        const newTickets = { ...prev };
        
        // Remove from old column
        newTickets[currentStatus] = prev[currentStatus].filter(t => t.id !== ticket.id);
        
        // Add to new column with updated status
        const updatedTicket: Ticket = { ...ticket, status: newStatus };
        newTickets[newStatus] = [...prev[newStatus], updatedTicket];
        
        return newTickets;
      });
    } catch (err) {
      console.error('Failed to move ticket:', err);
      alert(`Fehler beim Bewegen des Tickets: ${(err as Error).message}`);
    }
  }, [currentUser, updateMutation, refetch]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticket.id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: 'open' | 'in_progress' | 'done') => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTicket) {
      await moveToColumn(draggedTicket, newStatus);
      setDraggedTicket(null);
    }
  };

  // Keyboard navigation handlers
  const handleKeyDown = async (e: React.KeyboardEvent, ticket: Ticket, columnId: string) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        // Move to next column
        const colIndex = COLUMNS.findIndex(c => c.id === columnId);
        if (colIndex < COLUMNS.length - 1) {
          const newStatus = COLUMNS[colIndex + 1].status;
          await moveToColumn(ticket, newStatus);
          // Focus the same position in new column
          const newIndex = tickets[columnId].indexOf(ticket);
          setTimeout(() => {
            const targetCard = document.getElementById(`ticket-${tickets[newStatus][newIndex]?.id}`);
            targetCard?.focus();
          }, 100);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        // Move to previous column
        const prevColIndex = COLUMNS.findIndex(c => c.id === columnId);
        if (prevColIndex > 0) {
          const prevStatus = COLUMNS[prevColIndex - 1].status;
          await moveToColumn(ticket, prevStatus);
          // Focus the same position in previous column
          const newIndex = tickets[columnId].indexOf(ticket);
          setTimeout(() => {
            const targetCard = document.getElementById(`ticket-${tickets[prevStatus][newIndex]?.id}`);
            targetCard?.focus();
          }, 100);
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        // Open ticket detail
        window.location.href = `/staff/tickets/${ticket.id}`;
        break;
        
      case ' ':
        e.preventDefault();
        // Toggle assignee picker
        const card = e.currentTarget as HTMLElement;
        const rect = card.getBoundingClientRect();
        setShowAssigneePicker({
          ticketId: ticket.id,
          position: { x: rect.left, y: rect.bottom + 8 },
        });
        break;
        
      case 'Escape':
        setShowAssigneePicker(null);
        break;
    }
  };

  // Close assignee picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assigneePickerRef.current && !assigneePickerRef.current.contains(e.target as Node)) {
        setShowAssigneePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter handlers
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      category: '',
      assigneeId: '',
      search: '',
    });
    setLocalSearch('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  if (error) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h2>Fehler beim Laden des Boards</h2>
        <p>{(error as Error).message}</p>
        <Button onClick={() => window.location.reload()}>Neu laden</Button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 'var(--spacing-lg)',
      height: 'calc(100vh - var(--spacing-lg) * 2)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
          Kanban Board
        </h1>
        <p style={{ margin: 'var(--spacing-xs) 0 0', color: 'var(--color-text-secondary)' }}>
          Ziehen Sie Tickets zwischen den Spalten oder nutzen Sie Pfeiltasten für Navigation
        </p>
        <p style={{ margin: 'var(--spacing-xs) 0 0', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
          Tastatur: ← → zum Bewegen, Enter zum Öffnen, Leerzeichen für Zuweisung
        </p>
      </div>

      {/* Filters */}
      <Card style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
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

          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="secondary">
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </Card>

      {/* Kanban Board */}
      {isLoading ? (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-md)',
          flex: 1,
        }}>
          {COLUMNS.map(col => (
            <div key={col.id} style={{ 
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-md)',
            }}>
              <h3 style={{ margin: ['0', '0', 'var(--spacing-md)'].join(' '), fontSize: 'var(--font-size-base)' }}>
                {col.label}
              </h3>
              {[...Array(3)].map((_, i) => (
                <Card key={i} style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                  <div style={{ height: 60, background: 'var(--color-neutral-200)', borderRadius: 'var(--radius-default)' }} />
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-md)',
          flex: 1,
          overflow: 'hidden',
        }}>
          {COLUMNS.map(column => (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
              style={{
                background: dragOverColumn === column.id 
                  ? 'var(--color-primary-focus)' 
                  : 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '300px',
                transition: 'background-color var(--duration-fast)',
              }}
            >
              {/* Column Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <StatusBadge status={column.status}>{column.label}</StatusBadge>
                  <span style={{ 
                    background: 'var(--color-neutral-200)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px var(--spacing-sm)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                  }}>
                    {tickets[column.id]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Ticket Cards */}
              <div style={{ 
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
              }}>
                {!tickets[column.id] || tickets[column.id].length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)',
                    color: 'var(--color-text-tertiary)',
                    fontSize: 'var(--font-size-sm)',
                  }}>
                    Keine Tickets
                  </div>
                ) : (
                  tickets[column.id]?.map((ticket) => (
                    <div
                      key={ticket.id}
                      id={`ticket-${ticket.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket)}
                      onKeyDown={(e) => handleKeyDown(e, ticket, column.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ticket ${ticket.key}: ${ticket.title}, ${STATUS_LABELS[column.id]}, ${PRIORITY_LABELS[ticket.priority]}`}
                      style={{
                        background: draggedTicket?.id === ticket.id 
                          ? 'var(--color-primary-focus)' 
                          : 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-md)',
                        cursor: 'grab',
                        boxShadow: 'var(--shadow-sm)',
                        border: '2px solid transparent',
                        outline: 'none',
                        transition: 'box-shadow var(--duration-fast), transform var(--duration-fast)',
                        opacity: draggedTicket?.id === ticket.id ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      onClick={() => {
                        window.location.href = `/staff/tickets/${ticket.id}`;
                      }}
                    >
                      {/* Ticket Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: 'var(--spacing-sm)',
                      }}>
                        <span style={{ 
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-primary)',
                        }}>
                          {ticket.key}
                        </span>
                        <PriorityBadge priority={ticket.priority as any} size="sm">
                          {PRIORITY_LABELS[ticket.priority]}
                        </PriorityBadge>
                      </div>

                      {/* Title */}
                      <h4 style={{ 
                        margin: '0 0 var(--spacing-sm)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        lineHeight: '1.4',
                        maxHeight: '2.8em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {ticket.title}
                      </h4>

                      {/* Category */}
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                        marginBottom: 'var(--spacing-sm)',
                      }}>
                        {CATEGORY_LABELS[ticket.category]}
                      </div>

                      {/* Footer */}
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 'var(--spacing-xs)',
                        borderTop: '1px solid var(--color-border-default)',
                      }}>
                        <span style={{ 
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-tertiary)',
                        }}>
                          {new Date(ticket.created_at).toLocaleDateString('de-DE')}
                        </span>
                        
                        {/* Assignee Display / Placeholder */}
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-xs)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const card = e.currentTarget.closest('[draggable]') as HTMLElement;
                            if (card) {
                              const rect = card.getBoundingClientRect();
                              setShowAssigneePicker({
                                ticketId: ticket.id,
                                position: { x: rect.left, y: rect.bottom + 8 },
                              });
                            }
                          }}
                        >
                          {ticket.assignee_id ? (
                            <>
                              <span style={{ 
                                width: '24px',
                                height: '24px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold',
                              }}>
                                {(ticket as any).assignee_name?.charAt(0).toUpperCase() || '?'}
                              </span>
                              <span>
                                {(ticket as any).assignee_name || 'Zugewiesen'}
                              </span>
                            </>
                          ) : (
                            <span style={{ 
                              color: 'var(--color-text-tertiary)',
                              fontStyle: 'italic',
                            }}>
                              Unzugewiesen
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignee Picker Popup */}
      {showAssigneePicker && showAssigneePicker.ticketId && (
        <div
          ref={assigneePickerRef}
          style={{
            position: 'fixed',
            left: showAssigneePicker.position.x,
            top: Math.min(showAssigneePicker.position.y, window.innerHeight - 200),
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 'var(--z-popover)',
            minWidth: '200px',
            padding: 'var(--spacing-sm)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-sm)',
            padding: 'var(--spacing-xs)',
          }}>
            Ticket zuweisen
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Button
              variant="ghost"
              style={{ 
                justifyContent: 'flex-start',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
              }}
              onClick={async (e) => {
                e.stopPropagation();
                const ticket = ticketsResponse?.data.find((t: Ticket) => t.id === showAssigneePicker!.ticketId);
                if (ticket && currentUser) {
                  await moveToColumn(ticket, ticket.status as any);
                }
                setShowAssigneePicker(null);
              }}
            >
              Mir zuweisen (ich)
            </Button>
            <Button
              variant="ghost"
              style={{ 
                justifyContent: 'flex-start',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement full assignee selection dialog
                setShowAssigneePicker(null);
              }}
            >
              Anderen Agenten wählen...
            </Button>
            <Button
              variant="ghost"
              style={{ 
                justifyContent: 'flex-start',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                color: 'var(--color-danger)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Unassign
                setShowAssigneePicker(null);
              }}
            >
              Nicht zuweisen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPage;
