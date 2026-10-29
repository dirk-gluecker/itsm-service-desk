/**
 * Card Component
 * Container for content with optional header and actions
 */

import React, { forwardRef } from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--color-bg-elevated)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
    border: '1px solid var(--color-border-default)',
  },
  header: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-default)',
    backgroundColor: 'var(--color-bg-surface)',
  },
  title: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    margin: '0 0 var(--spacing-xs) 0',
  },
  subtitle: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    margin: '0',
  },
  body: {
    padding: 'var(--spacing-lg)',
  },
  sizes: {
    none: { padding: '0' },
    sm: { padding: 'var(--spacing-md)' },
    md: { padding: 'var(--spacing-lg)' },
    lg: { padding: 'var(--spacing-xl)' },
  },
  footer: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderTop: '1px solid var(--color-border-default)',
    backgroundColor: 'var(--color-bg-surface)',
  },
};

/**
 * Card Component Implementation
 * 
 * Usage:
 * <Card title="Ticket Details">
 *   <p>Content here</p>
 * </Card>
 * 
 * <Card title="Header" subtitle="Subtitle" footer={<Button>Action</Button>}>
 *   <p>Main content</p>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    title,
    subtitle,
    children,
    footer,
    className,
    style,
    padding = 'lg',
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...styles.card, ...style }}
      {...props}
    >
      {(title || subtitle) && (
        <header style={styles.header}>
          {title && <h3 style={styles.title}>{title}</h3>}
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </header>
      )}
      
      <div style={{ ...styles.body, ...styles.sizes[padding] }}>
        {children}
      </div>
      
      {footer && (
        <footer style={styles.footer}>
          {footer}
        </footer>
      )}
    </div>
  );
});

export default Card;
