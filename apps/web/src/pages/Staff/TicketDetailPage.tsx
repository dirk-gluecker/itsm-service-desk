/**
 * TicketDetailPage.tsx - Staff ticket detail view
 * Full editing capabilities, comments/internal notes, and audit log
 */
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTicket, useComments, useCreateComment, useAuditLogs, useUpdateTicket, useUsers } from '../../hooks/api/useHooks';
import type { Ticket, Comment, AuditLog } from '../../types';
import { 
  Button, 
  Badge, 
  StatusBadge, 
  PriorityBadge,
  Card,
  LoadingSpinner,
  Select,
  SelectOption,
} from '../../../../packages/shared/components';

// Label mappings (German for customer-facing UI)
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  DONE: 'Erledigt',
  CLOSED: 'Geschlossen',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

const CATEGORY_LABELS: Record<string, string> = {
  INCIDENT: 'Incident',
  SERVICE_REQUEST: 'Service Request',
  QUERY: 'Anfrage',
  OTHER: 'Sonstiges',
};

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Data fetching
  const { data: ticket, isLoading: loadingTicket } = useTicket(id || null);
  const { data: comments, isLoading: loadingComments } = useComments(id || null);
  const { data: auditLogs, isLoading: loadingAudit } = useAuditLogs(id || null);
  const { data: users } = useUsers();
  
  // Mutations
  const updateTicket = useUpdateTicket();
  const createComment = useCreateComment(id || '');
  
  // Local state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Ticket>>({});
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showAuditTab, setShowAuditTab] = useState<'comments' | 'audit'>('comments');

  // Handle field edit start
  const handleEditStart = useCallback((field: keyof Ticket, currentValue: any) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue });
  }, []);

  // Handle field edit cancel
  const handleEditCancel = useCallback(() => {
    setEditingField(null);
    setEditValues({});
  }, []);

  // Handle field edit save
  const handleEditSave = useCallback(async (field: keyof Ticket) => {
    if (!id || editValues[field] === undefined) return;
    
    try {
      await updateTicket.mutateAsync({ 
        id, 
        updates: { [field]: editValues[field] } as any 
      });
      setEditingField(null);
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      alert(`Fehler beim Aktualisieren von ${field}`);
      handleEditCancel();
    }
  }, [id, editValues, updateTicket, handleEditCancel]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    
    try {
      await createComment.mutateAsync({
        content: commentText.trim(),
        is_internal: isInternalNote,
      });
      setCommentText('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Fehler beim Hinzufügen des Kommentars');
    }
  }, [commentText, isInternalNote, id, createComment]);

  // Get staff users for assignee dropdown
  const staffUsers = users?.filter(u => u.role === 'STAFF' || u.role === 'ADMIN') || [];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render loading state
  if (loadingTicket) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <LoadingSpinner size="lg" />
        <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
          Ticket wird geladen...
        </p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h2>Ticket nicht gefunden</h2>
        <Link to="/staff/tickets">
          <Button variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
            Zurück zur Ticket-Liste
          </Button>
        </Link>
      </div>
    );
  }

  // Editable field component
  const EditableField = ({ 
    label, 
    value, 
    field, 
    options,
    onSave 
  }: { 
    label: string; 
    value: any; 
    field: keyof Ticket; 
    options?: SelectOption[];
    onSave: () => void;
  }) => {
    if (editingField === field) {
      return (
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          {options ? (
            <Select
              value={editValues[field]?.toString() || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
              options={options}
              size="sm"
            />
          ) : (
            <input
              type="text"
              value={editValues[field] || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-default)',
                fontSize: 'var(--font-size-sm)',
                width: '200px',
              }}
            />
          )}
          <Button variant="primary" size="sm" onClick={onSave}>
            Speichern
          </Button>
          <Button variant="secondary" size="sm" onClick={handleEditCancel}>
            Abbrechen
          </Button>
        </div>
      );
    }

    const displayValue = Array.isArray(options) 
      ? options.find(o => o.value === value?.toString())?.label || value
      : value;

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-xs) 0' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{label}:</span>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <strong>{displayValue}</strong>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleEditStart(field, value)}
          >
            Bearbeiten
          </Button>
        </div>
      </div>
    );
  };

  // Status options for dropdown
  const statusOptions: SelectOption[] = [
    { value: 'OPEN', label: STATUS_LABELS.OPEN },
    { value: 'IN_PROGRESS', label: STATUS_LABELS.IN_PROGRESS },
    { value: 'DONE', label: STATUS_LABELS.DONE },
    { value: 'CLOSED', label: STATUS_LABELS.CLOSED },
  ];

  // Priority options
  const priorityOptions: SelectOption[] = [
    { value: 'LOW', label: PRIORITY_LABELS.LOW },
    { value: 'MEDIUM', label: PRIORITY_LABELS.MEDIUM },
    { value: 'HIGH', label: PRIORITY_LABELS.HIGH },
    { value: 'CRITICAL', label: PRIORITY_LABELS.CRITICAL },
  ];

  // Category options
  const categoryOptions: SelectOption[] = [
    { value: 'INCIDENT', label: CATEGORY_LABELS.INCIDENT },
    { value: 'SERVICE_REQUEST', label: CATEGORY_LABELS.SERVICE_REQUEST },
    { value: 'QUERY', label: CATEGORY_LABELS.QUERY },
    { value: 'OTHER', label: CATEGORY_LABELS.OTHER },
  ];

  // Assignee options
  const assigneeOptions: SelectOption[] = [
    { value: '', label: 'Nicht zugewiesen' },
    ...staffUsers.map(u => ({ 
      value: u.id, 
      label: u.name || u.email 
    })),
  ];

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <Link to="/staff/tickets" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)', display: 'inline-block' }}>
            ← Zur Ticket-Liste
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {ticket.key}
            </h1>
            <StatusBadge status={ticket.status as any}>{STATUS_LABELS[ticket.status]}</StatusBadge>
            <PriorityBadge priority={ticket.priority as any}>{PRIORITY_LABELS[ticket.priority]}</PriorityBadge>
            <Badge variant="neutral">{CATEGORY_LABELS[ticket.category]}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button 
            variant="danger" 
            onClick={() => {
              if (confirm('Möchten Sie dieses Ticket wirklich löschen?')) {
                // TODO: Add delete mutation
                navigate('/staff/tickets');
              }
            }}
          >
            Löschen
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Left Column - Comments/Audit */}
        <div>
          {/* Tabs */}
          <Card>
            <div style={{ borderBottom: '1px solid var(--color-border-default)', marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <button
                  onClick={() => setShowAuditTab('comments')}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: 'none',
                    background: 'none',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: showAuditTab === 'comments' ? '600' : '400',
                    color: showAuditTab === 'comments' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    borderBottom: showAuditTab === 'comments' ? `2px solid var(--color-primary)` : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  Kommentare & Notizen
                </button>
                <button
                  onClick={() => setShowAuditTab('audit')}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: 'none',
                    background: 'none',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: showAuditTab === 'audit' ? '600' : '400',
                    color: showAuditTab === 'audit' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    borderBottom: showAuditTab === 'audit' ? `2px solid var(--color-primary)` : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  Änderungsverlauf
                </button>
              </div>
            </div>

            {/* Comments Tab */}
            {showAuditTab === 'comments' && (
              <div>
                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Kommentar verfassen..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: 'var(--spacing-md)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 'var(--radius-default)',
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-sans)',
                      resize: 'vertical',
                      backgroundColor: 'var(--color-bg-page)',
                      color: 'var(--color-text-primary)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        Interner Hinweis (nur für Team sichtbar)
                      </span>
                    </label>
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={!commentText.trim() || createComment.isPending}
                    >
                      {createComment.isPending ? 'Sende...' : 'Absenden'}
                    </Button>
                  </div>
                </form>

                {/* Comments List */}
                {loadingComments ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                    <LoadingSpinner />
                  </div>
                ) : comments?.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-lg)' }}>
                    Noch keine Kommentare vorhanden
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {comments?.map((comment: Comment & { isInternal?: boolean }) => (
                      <div
                        key={comment.id}
                        style={{
                          padding: 'var(--spacing-md)',
                          borderRadius: 'var(--radius-default)',
                          backgroundColor: comment.is_internal || comment.isInternal 
                            ? 'rgba(100, 100, 255, 0.08)' // Light purple/blue for internal notes
                            : 'var(--color-bg-surface)',
                          border: (comment.is_internal || comment.isInternal) 
                            ? '1px solid rgba(100, 100, 255, 0.3)'
                            : '1px solid var(--color-border-default)',
                        }}
                      >
                        {(comment.is_internal || comment.isInternal) && (
                          <Badge variant="neutral" style={{ marginBottom: 'var(--spacing-xs)' }}>
                            🔒 Interner Hinweis
                          </Badge>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                          <strong style={{ fontSize: 'var(--font-size-sm)' }}>
                            {comment.author?.name || comment.author?.email || 'Unbekannt'}
                          </strong>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
                          {comment.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audit Log Tab */}
            {showAuditTab === 'audit' && (
              <div>
                {loadingAudit ? (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                    <LoadingSpinner />
                  </div>
                ) : auditLogs?.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-lg)' }}>
                    Keine Änderungshistorie verfügbar
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {auditLogs?.map((log: AuditLog) => (
                      <div
                        key={log.id}
                        style={{
                          padding: 'var(--spacing-md)',
                          borderRadius: 'var(--radius-default)',
                          backgroundColor: 'var(--color-bg-surface)',
                          border: '1px solid var(--color-border-default)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                            {log.field ? (
                              <>
                                <strong>{log.actor_id}</strong> hat <strong>{log.field}</strong> geändert
                              </>
                            ) : (
                              <><strong>{log.actor_id}</strong> {log.action.toLowerCase()}</>
                            )}
                          </span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        {log.old_value !== undefined && log.new_value !== undefined && (
                          <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
                            <div style={{ color: '#dc2626' }}>
                              Vorher: {JSON.stringify(log.old_value)}
                            </div>
                            <div style={{ color: '#16a34a' }}>
                              Nachher: {JSON.stringify(log.new_value)}
                            </div>
                          </div>
                        )}
                        {(log as any).metadata && (
                          <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)', color: 'var(--color-text-secondary)' }}>
                            {(log as any).metadata}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Ticket Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Quick Info Card */}
          <Card title="Ticket-Info">
            <EditableField
              label="Titel"
              value={ticket.title}
              field="title"
              onSave={() => handleEditSave('title')}
            />
            <EditableField
              label="Beschreibung"
              value={ticket.description}
              field="description"
              onSave={() => handleEditSave('description')}
            />
            <div style={{ borderTop: '1px solid var(--color-border-default)', margin: 'var(--spacing-md) 0' }} />
            <EditableField
              label="Status"
              value={ticket.status}
              field="status"
              options={statusOptions}
              onSave={() => handleEditSave('status')}
            />
            <EditableField
              label="Priorität"
              value={ticket.priority}
              field="priority"
              options={priorityOptions}
              onSave={() => handleEditSave('priority')}
            />
            <EditableField
              label="Kategorie"
              value={ticket.category}
              field="category"
              options={categoryOptions}
              onSave={() => handleEditSave('category')}
            />
            <EditableField
              label="Zugewiesen an"
              value={ticket.assignee_id || ''}
              field="assignee_id"
              options={assigneeOptions}
              onSave={() => handleEditSave('assignee_id')}
            />
          </Card>

          {/* Timestamps Card */}
          <Card title="Zeitstempel">
            <div style={{ padding: 'var(--spacing-xs) 0' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Erstellt:</span>
              <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
                {formatDate(ticket.created_at)}
              </span>
            </div>
            <div style={{ padding: 'var(--spacing-xs) 0' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Letzte Änderung:</span>
              <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
                {formatDate(ticket.updated_at)}
              </span>
            </div>
          </Card>

          {/* Customer Info Card */}
          <Card title="Kunde">
            <div style={{ padding: 'var(--spacing-xs) 0' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Name:</span>
              <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
                {(ticket as any).customer?.name || (ticket as any).customer?.email || 'N/A'}
              </span>
            </div>
            <div style={{ padding: 'var(--spacing-xs) 0' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Email:</span>
              <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
                {(ticket as any).customer?.email || 'N/A'}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
