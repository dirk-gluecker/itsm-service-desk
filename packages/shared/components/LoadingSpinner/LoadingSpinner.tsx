/**
 * LoadingSpinner Component
 * Animated loading indicator with multiple sizes
 */

import React, { forwardRef } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    borderRadius: '50%',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    animation: 'spin 0.6s linear infinite',
    display: 'inline-block',
  },
  sizes: {
    sm: { width: '16px', height: '16px', borderWidth: '2px' },
    md: { width: '24px', height: '24px', borderWidth: '2px' },
    lg: { width: '32px', height: '32px', borderWidth: '3px' },
    xl: { width: '48px', height: '48px', borderWidth: '4px' },
  },
};

// Inject keyframes if not already present
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('style[data-spinner-animations]');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.setAttribute('data-spinner-animations', 'true');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Reduced motion for accessibility */
      @media (prefers-reduced-motion: reduce) {
        [role="status"][data-spinner] {
          animation: none;
          border-top-color: transparent;
          border-right-color: transparent;
          border-bottom-color: transparent;
          opacity: 0.5;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * LoadingSpinner Component Implementation
 * 
 * Features:
 * - Multiple sizes for different use cases
 * - ARIA accessible with role="status"
 * - Respects prefers-reduced-motion
 * 
 * Usage:
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" label="Loading data..." />
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(function LoadingSpinner(
  { size = 'md', label = 'Loading...', className, style, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...styles.container, ...style }}
      role="status"
      aria-label={label}
      {...props}
    >
      <span
        data-spinner="true"
        aria-hidden="true"
        style={{
          ...styles.spinner,
          ...styles.sizes[size],
        }}
      />
      {label && (
        <span
          style={{
            marginLeft: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
});

/**
 * FullPageLoader Component
 * 
 * Centered loading spinner that covers the full viewport.
 * Useful for initial page loads or major state transitions.
 */
export interface FullPageLoaderProps {
  message?: string;
  size?: SpinnerSize;
}

export function FullPageLoader({ 
  message = 'Loading...', 
  size = 'lg' 
}: FullPageLoaderProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-page)',
        zIndex: 'var(--z-modal-backdrop)',
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <LoadingSpinner size={size} label="" />
      {message && (
        <p
          style={{
            marginTop: 'var(--spacing-md)',
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * SkeletonLoader Component
 * 
 * Placeholder skeleton for loading content states.
 * Provides visual feedback during async operations.
 */
export interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonLoader({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
  style,
}: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const getBaseSkeletonStyle = (): React.CSSProperties => ({
    backgroundColor: 'var(--color-neutral-200)',
    borderRadius: 'var(--radius-md)',
    animation: 'pulse 1.5s ease-in-out infinite',
  });

  const getPulseAnimation = () => {
    if (typeof document !== 'undefined') {
      const existingStyle = document.querySelector('style[data-skeleton-pulse]');
      if (!existingStyle) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-skeleton-pulse', 'true');
        styleEl.textContent = `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @media (prefers-reduced-motion: reduce) {
            .skeleton-loader {
              animation: none;
              opacity: 0.7;
            }
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
  };

  getPulseAnimation();

  return (
    <div className={className} style={style}>
      {skeletons.map((index) => (
        <div
          key={index}
          className="skeleton-loader"
          aria-hidden="true"
          style={{
            ...getBaseSkeletonStyle(),
            width: variant === 'text' ? `${Math.random() * 40 + 60}%` : width,
            height: height || (variant === 'circular' ? width || '24px' : '16px'),
            marginBottom: index < count - 1 ? 'var(--spacing-sm)' : 0,
            alignSelf: variant === 'text' ? 'flex-start' : 'stretch',
            ...(variant === 'circular' ? { borderRadius: '50%' } : {}),
          }}
        />
      ))}
    </div>
  );
}

export default LoadingSpinner;
