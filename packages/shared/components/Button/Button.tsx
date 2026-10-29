/**
 * Button Component
 * Accessible, reusable button with multiple variants and loading state
 * WCAG AA compliant focus-visible states
 */

import React, { forwardRef, useCallback } from 'react';
import { css, cx } from 'lit-css'; // Assuming lit-css or similar for styling
import { StatusType, PriorityType } from '../design-tokens';

// Types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
}

// Styles using CSS variables from design tokens
const styles = {
  base: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-default);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-default);
    white-space: nowrap;
    
    &:focus:not(:focus-visible) {
      outline: none;
    }
    
    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-outline);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  
  variants: {
    primary: css`
      background-color: var(--color-primary);
      color: var(--color-text-inverse);
      
      &:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
      }
      
      &:active:not(:disabled) {
        transform: translateY(1px);
      }
    `,
    secondary: css`
      background-color: var(--color-bg-surface);
      color: var(--color-text-primary);
      border-color: var(--color-border-default);
      
      &:hover:not(:disabled) {
        background-color: var(--color-neutral-100);
        border-color: var(--color-border-hover);
      }
      
      &:active:not(:disabled) {
        background-color: var(--color-neutral-200);
      }
    `,
    danger: css`
      background-color: var(--color-danger);
      color: var(--color-text-inverse);
      
      &:hover:not(:disabled) {
        background-color: var(--color-danger-hover);
      }
    `,
    ghost: css`
      background-color: transparent;
      color: var(--color-text-secondary);
      
      &:hover:not(:disabled) {
        background-color: var(--color-neutral-100);
        color: var(--color-text-primary);
      }
    `,
  },
  
  sizes: {
    sm: css`
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-sm);
      min-height: 32px;
    `,
    md: css`
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-base);
      min-height: 40px;
    `,
    lg: css`
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: var(--font-size-lg);
      min-height: 48px;
    `,
  },
};

/**
 * Button Component Implementation
 * 
 * Usage:
 * <Button variant="primary" onClick={handleClick}>Click me</Button>
 * <Button variant="secondary" isLoading leftIcon={<Spinner />}>Loading</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled = false,
    children,
    className,
    ...props
  },
  ref
) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) {
      e.preventDefault();
      return;
    }
    props.onClick?.(e);
  }, [isLoading, disabled, props.onClick]);

  const combinedStyles = cx(
    styles.base,
    styles.variants[variant],
    styles.sizes[size],
    fullWidth && 'width: 100%',
    className
  );

  return (
    <button
      ref={ref}
      className={combinedStyles}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} />
          {children}
        </>
      ) : (
        <>
          {!isLoading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
          {children}
          {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

// Loading spinner subcomponent
function LoadingSpinner({ size }: { size: 'sm' | 'md' }) {
  const dimensions = size === 'sm' ? '16px' : '20px';
  
  return (
    <span
      style={{
        width: dimensions,
        height: dimensions,
        border: `2px solid currentColor`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

// Add keyframes for spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default Button;
