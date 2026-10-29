/**
 * Badge Component
 * Status and priority indicators with color-coded variants
 * Includes patterns/icons for non-color-based accessibility
 */

import React, { forwardRef } from 'react';
import { StatusType, PriorityType } from '../../design-tokens';

export type BadgeVariant = 'status' | 'priority' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  status?: StatusType;
  priority?: PriorityType;
  children: React.ReactNode;
  size?: BadgeSize;
  icon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    borderRadius: 'var(--radius-default)',
    fontWeight: 'var(--font-weight-medium)',
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
  },
  sizes: {
    sm: {
      padding: '2px var(--spacing-sm)',
      fontSize: 'var(--font-size-xs)',
      minHeight: '24px',
    },
    md: {
      padding: 'var(--spacing-xs) var(--spacing-md)',
      fontSize: 'var(--font-size-sm)',
      minHeight: '28px',
    },
    lg: {
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      fontSize: 'var(--font-size-base)',
      minHeight: '36px',
    },
  },
  // Status variants - using CSS variables for theming
  statusOpen: {
    backgroundColor: 'var(--color-status-open-bg)',
    borderColor: 'var(--color-status-open-border)',
    color: 'var(--color-status-open-text)',
  },
  statusInProgress: {
    backgroundColor: 'var(--color-status-in-progress-bg)',
    borderColor: 'var(--color-status-in-progress-border)',
    color: 'var(--color-status-in-progress-text)',
  },
  statusDone: {
    backgroundColor: 'var(--color-status-done-bg)',
    borderColor: 'var(--color-status-done-border)',
    color: 'var(--color-status-done-text)',
  },
  // Priority variants
  priorityLow: {
    backgroundColor: 'var(--color-priority-low-bg)',
    borderColor: 'var(--color-priority-low-border)',
    color: 'var(--color-priority-low-text)',
  },
  priorityMedium: {
    backgroundColor: 'var(--color-priority-medium-bg)',
    borderColor: 'var(--color-priority-medium-border)',
    color: 'var(--color-priority-medium-text)',
  },
  priorityHigh: {
    backgroundColor: 'var(--color-priority-high-bg)',
    borderColor: 'var(--color-priority-high-border)',
    color: 'var(--color-priority-high-text)',
  },
  priorityCritical: {
    backgroundColor: 'var(--color-priority-critical-bg)',
    borderColor: 'var(--color-priority-critical-border)',
    color: 'var(--color-priority-critical-text)',
  },
  // Neutral
  neutral: {
    backgroundColor: 'var(--color-neutral-100)',
    borderColor: 'var(--color-border-default)',
    color: 'var(--color-text-secondary)',
  },
  // Icon indicator (for colorblind accessibility)
  iconDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
};

// Icon characters for each status/priority (for accessibility)
const statusIcons: Record<StatusType, string> = {
  open: '○',
  in_progress: '◐',
  done: '●',
};

const priorityIcons: Record<PriorityType, string> = {
  low: '•',
  medium: '◐',
  high: '◉',
  critical: '⚠',
};

/**
 * Badge Component Implementation
 * 
 * Usage for status:
 * <Badge status="open">Open</Badge>
 * <Badge status="in_progress" icon>In Progress</Badge>
 * 
 * Usage for priority:
 * <Badge priority="high" variant="priority">High</Badge>
 * <Badge priority="critical" variant="priority" icon>Critical</Badge>
 * 
 * Usage for neutral/other:
 * <Badge>Custom</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = 'neutral',
    status,
    priority,
    children,
    size = 'md',
    icon = false,
    className,
    style,
    ...props
  },
  ref
) {
  // Determine which style to apply based on props
  let variantStyle = styles.neutral;
  let patternIcon: string | null = null;
  let ariaLabelSuffix = '';
  
  if (variant === 'status' && status) {
    switch (status) {
      case 'open':
        variantStyle = styles.statusOpen;
        ariaLabelSuffix = '(Open)';
        break;
      case 'in_progress':
        variantStyle = styles.statusInProgress;
        ariaLabelSuffix = '(In Progress)';
        break;
      case 'done':
        variantStyle = styles.statusDone;
        ariaLabelSuffix = '(Done)';
        break;
    }
    patternIcon = icon ? statusIcons[status] : null;
  } else if (variant === 'priority' && priority) {
    switch (priority) {
      case 'low':
        variantStyle = styles.priorityLow;
        ariaLabelSuffix = '(Low Priority)';
        break;
      case 'medium':
        variantStyle = styles.priorityMedium;
        ariaLabelSuffix = '(Medium Priority)';
        break;
      case 'high':
        variantStyle = styles.priorityHigh;
        ariaLabelSuffix = '(High Priority)';
        break;
      case 'critical':
        variantStyle = styles.priorityCritical;
        ariaLabelSuffix = '(Critical Priority)';
        break;
    }
    patternIcon = icon ? priorityIcons[priority] : null;
  }

  return (
    <span
      ref={ref}
      role="status"
      aria-label={`${children}${ariaLabelSuffix}`}
      className={className}
      style={{
        ...styles.badge,
        ...styles.sizes[size],
        ...variantStyle,
        ...style,
      }}
      {...props}
    >
      {patternIcon && (
        <span
          aria-hidden="true"
          style={{
            ...styles.iconDot,
            backgroundColor: 'currentColor',
          }}
        >
          {patternIcon}
        </span>
      )}
      {children}
    </span>
  );
});

// Convenience sub-components for common use cases
export function StatusBadge({ 
  status, 
  size = 'md', 
  icon = true,
  children,
  ...props 
}: Omit<BadgeProps, 'variant'> & { children?: string }) {
  return (
    <Badge variant="status" status={status} size={size} icon={icon} {...props}>
      {children || status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  );
}

export function PriorityBadge({ 
  priority, 
  size = 'md',
  icon = true,
  children,
  ...props 
}: Omit<BadgeProps, 'variant'> & { children?: string }) {
  return (
    <Badge variant="priority" priority={priority} size={size} icon={icon} {...props}>
      {children || priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

export default Badge;
