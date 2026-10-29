/**
 * Ticket Detail Page - View ticket details, add comments, view audit log
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket, useComments, useCreateComment, useAuditLogs } from '../../hooks/api/useHooks';
import { Button, Card, Badge, LoadingSpinner } from '@shared/components';
import type { Comment, AuditLog, Status, Priority } from '../types';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');

  const { data: ticket, isLoading: loadingTicket } = useTicket(id || null);
  const { data: comments, isLoading: loadingComments } = useComments(id || null);
  const { data: auditLogs, isLoading: loadingAudit } = useAuditLogs(id || null);
  const createCommentMutation = useCreateComment(id || '');

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length < 1) return;

    try {
      await createCommentMutation.mutateAsync({ content: newComment.trim(), is_internal: false });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      incident: 'Incident',
      service_request: 'Service Request',
      INCIDENT: 'Incident',
      SERVICE_REQUEST: 'Service Request',
    };
    return labels[category] || category;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (action: string) => {
    const icons: Record<string, string> = {
      create: '📝',
      TICKET_CREATED: '📝',
      comment: '💬',
      COMMENT_ADDED: '💬',
      update: '✏️',
      update_field: '✏️',
      STATUS_CHANGED: '🔄',
      assign: '👤',
      ASSIGNED: '👤',
      delete: '🗑️',
      TICKET_DELETED: '🗑️',
    };
    return icons[action] || '📋';
  };

  if (loadingTicket || !id) {
    return <LoadingSpinner />;
  }

  if (!ticket) {
    return (
      <div style={styles.container}>
        <Card style={styles.card}>
          <h2>Ticket Not Found</h2>
          <p>This ticket does not exist or you don't have access to it.</p>
          <Button variant="primary" onClick={() => navigate('/my-tickets')}>
            Back to My Tickets
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{ticket.key}</h1>
          <p style={styles.subtitle}>{ticket.title}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/my-tickets')}>
          ← Back to Tickets
        </Button>
      </div>

      {/* Ticket Info Grid */}
      <div style={styles.infoGrid}>
        <Card>
          <h3 style={styles.sectionTitle}>Status</h3>
          <Badge variant={getVariantForStatus(ticket.status)}>
            {getStatusLabel(ticket.status)}
          </Badge>
        </Card>
        
        <Card>
          <h3 style={styles.sectionTitle}>Priority</h3>
          <Badge variant={getVariantForPriority(ticket.priority)}>
            {getPriorityLabel(ticket.priority)}
          </Badge>
        </Card>
        
        <Card>
          <h3 style={styles.sectionTitle}>Category</h3>
          <p>{getCategoryLabel(ticket.category)}</p>
        </Card>
        
        <Card>
          <h3 style={styles.sectionTitle}>Created</h3>
          <p>{formatDate(ticket.created_at)}</p>
        </Card>
      </div>

      {/* Description */}
      <Card style={styles.descriptionCard}>
        <h3 style={styles.sectionTitle}>Description</h3>
        <p style={styles.descriptionText}>{ticket.description}</p>
      </Card>

      {/* Customer cannot modify these fields - info note */}
      <div style={styles.readOnlyNote}>
        <small>
          ⚠️ You cannot modify status, priority, or assignment as a customer. 
          Our team will handle updates to these fields.
        </small>
      </div>

      {/* Comments Section */}
      <Card style={styles.commentsCard}>
        <h3 style={styles.sectionTitle}>Comments</h3>
        
        {loadingComments ? (
          <LoadingSpinner size="sm" />
        ) : comments && comments.length === 0 ? (
          <p style={styles.noComments}>No comments yet. Be the first to comment!</p>
        ) : (
          <div style={styles.commentsList}>
            {comments?.map((comment: any) => (
              <div key={comment.id} style={styles.commentItem}>
                <div style={styles.commentHeader}>
                  <strong>{comment.author?.name || 'Unknown'}</strong>
                  <span style={styles.commentDate}>{formatDate(comment.created_at)}</span>
                </div>
                <p style={styles.commentContent}>{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Form - Customers can only add public comments */}
        <form onSubmit={handleSubmitComment} style={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a public comment..."
            rows={3}
            style={styles.commentTextarea}
            maxLength={5000}
          />
          <div style={styles.commentActions}>
            <small style={styles.charCount}>{newComment.length}/5000 characters</small>
            <Button
              type="submit"
              variant="primary"
              disabled={!newComment.trim()}
              isLoading={createCommentMutation.isPending}
            >
              Add Comment
            </Button>
          </div>
        </form>
      </Card>

      {/* Audit Log Timeline */}
      <Card style={styles.auditCard}>
        <h3 style={styles.sectionTitle}>Activity Timeline</h3>
        
        {loadingAudit ? (
          <LoadingSpinner size="sm" />
        ) : auditLogs && auditLogs.length === 0 ? (
          <p>No activity recorded yet.</p>
        ) : (
          <div style={styles.timeline}>
            {auditLogs?.map((log: AuditLog) => (
              <div key={log.id} style={styles.timelineItem}>
                <div style={styles.timelineIcon}>
                  {getActivityIcon(log.action)}
                </div>
                <div style={styles.timelineContent}>
                  <p style={styles.timelineText}>
                    <strong>{getActionText(log)}</strong>
                    {log.field && ` — ${log.field}`}
                  </p>
                  <span style={styles.timelineDate}>{formatDate(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

function getVariantForStatus(status: Status): any {
  const variants: Record<string, string> = {
    open: 'warning',
    in_progress: 'info',
    done: 'success',
    OPEN: 'warning',
    IN_PROGRESS: 'info',
    DONE: 'success',
  };
  return variants[status] || 'info';
}

function getVariantForPriority(priority: Priority): any {
  const variants: Record<string, string> = {
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
}

function getActionText(log: AuditLog): string {
  const actionMap: Record<string, string> = {
    create: 'Ticket created',
    TICKET_CREATED: 'Ticket created',
    comment: 'Comment added',
    COMMENT_ADDED: 'Comment added',
    update: 'Ticket updated',
    update_field: 'Field updated',
    STATUS_CHANGED: 'Status changed',
    assign: 'Assigned',
    ASSIGNED: 'Assignment updated',
    delete: 'Ticket deleted',
    TICKET_DELETED: 'Ticket deleted',
  };
  return actionMap[log.action] || log.action;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '960px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--color-text-primary)',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: 'var(--color-text-secondary)',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  descriptionCard: {
    marginBottom: '16px',
  },
  descriptionText: {
    lineHeight: 1.6,
    color: 'var(--color-text-primary)',
  },
  readOnlyNote: {
    backgroundColor: 'var(--color-bg-surface)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '24px',
    borderLeft: '4px solid var(--color-warning)',
  },
  commentsCard: {
    marginBottom: '24px',
  },
  noComments: {
    color: 'var(--color-text-tertiary)',
    fontStyle: 'italic',
  },
  commentsList: {
    marginBottom: '24px',
  },
  commentItem: {
    backgroundColor: 'var(--color-bg-surface)',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '12px',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  commentDate: {
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
  },
  commentContent: {
    margin: 0,
    lineHeight: 1.5,
    color: 'var(--color-text-primary)',
  },
  commentForm: {
    borderTop: '1px solid var(--color-border-default)',
    paddingTop: '16px',
  },
  commentTextarea: {
    width: '100%',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-default)',
    backgroundColor: 'var(--color-bg-surface)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-family-sans)',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  commentActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  charCount: {
    color: 'var(--color-text-tertiary)',
  },
  auditCard: {
    marginTop: '24px',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '24px',
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: '16px',
  },
  timelineItemLast: {
    paddingBottom: 0,
  },
  timelineIcon: {
    position: 'absolute',
    left: '-24px',
    top: '2px',
    fontSize: '16px',
  },
  timelineContent: {
    marginLeft: '8px',
  },
  timelineText: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
  },
  timelineDate: {
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
  },
};
