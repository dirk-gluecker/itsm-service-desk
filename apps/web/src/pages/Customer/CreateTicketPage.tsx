/**
 * Create Ticket Page - Customer can create new tickets
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTicket } from '../../hooks/api/useHooks';
import { Button, Input, Select } from '@shared/components';
import { Card } from '@shared/components';
import type { Category, Priority, ErrorResponse } from '../types';

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('incident');
  const [priority, setPriority] = useState<Priority>('medium');
  const [error, setError] = useState<string>('');
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  const createTicketMutation = useCreateTicket();

  const categories = [
    { value: 'incident', label: 'Incident' },
    { value: 'service_request', label: 'Service Request' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (title.length < 5 || title.length > 120) {
      setError('Title must be between 5 and 120 characters');
      return;
    }

    if (description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    try {
      const ticket = await createTicketMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      
      setCreatedTicket(ticket);
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      setError(
        errorResponse?.error?.message || 
        'Failed to create ticket. Please try again.'
      );
    }
  };

  if (createdTicket) {
    return (
      <div style={styles.container}>
        <Card style={styles.card}>
          <h1 style={styles.successTitle}>Ticket Created Successfully!</h1>
          <div style={styles.ticketInfo}>
            <p style={styles.ticketKey}>Ticket Key: <strong>{createdTicket.key}</strong></p>
            <p>Your ticket has been created and will be reviewed by our team.</p>
          </div>
          <div style={styles.actionButtons}>
            <Button
              variant="primary"
              onClick={() => navigate(`/tickets/${createdTicket.id}`)}
            >
              View Ticket
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/my-tickets')}
            >
              Back to My Tickets
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Create New Ticket</h1>
        <Button variant="ghost" onClick={() => navigate('/my-tickets')}>
          Cancel
        </Button>
      </div>

      <Card style={styles.card}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <Input
            label="Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Brief summary of your issue"
            helperText={`${title.length}/120 characters`}
            minLength={5}
            maxLength={120}
          />

          <div style={{ marginBottom: '24px', marginTop: '16px' }}>
            <label style={styles.label}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Please describe your issue in detail..."
              rows={6}
              style={styles.textarea}
              minLength={20}
            />
            <small style={styles.helperText}>
              Minimum 20 characters. Current: {description.length}
            </small>
          </div>

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            options={categories}
            required
          />

          <div style={{ marginBottom: '24px', marginTop: '16px' }}>
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              options={priorities}
              required
            />
            <small style={styles.helperText}>
              Choose the urgency level that best describes your issue
            </small>
          </div>

          <div style={styles.actionButtons}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={createTicketMutation.isPending}
            >
              Submit Ticket
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/my-tickets')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '720px',
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
  card: {
    padding: '32px',
  },
  errorBox: {
    backgroundColor: 'var(--color-priority-high-bg)',
    color: 'var(--color-priority-high-text)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '16px',
    fontSize: '14px',
  },
  label: {
    display: 'block',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    marginBottom: '8px',
    fontSize: '14px',
  },
  textarea: {
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
  helperText: {
    display: 'block',
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--color-success)',
    marginBottom: '16px',
    textAlign: 'center',
  },
  ticketInfo: {
    textAlign: 'center',
    padding: '24px',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '24px',
  },
  ticketKey: {
    fontSize: '20px',
    color: 'var(--color-text-primary)',
    marginBottom: '8px',
  },
};
