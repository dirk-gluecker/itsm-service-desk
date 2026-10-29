/**
 * ErrorBoundary Component
 * React error boundary for graceful error handling
 * Catches JavaScript errors in child components and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: 'var(--spacing-xl)',
    backgroundColor: 'var(--color-bg-page)',
    color: 'var(--color-text-primary)',
  },
  icon: {
    fontSize: 'var(--font-size-4xl)',
    marginBottom: 'var(--spacing-md)',
  },
  title: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    marginBottom: 'var(--spacing-sm)',
    color: 'var(--color-text-primary)',
  },
  message: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-secondary)',
    textAlign: 'center' as const,
    maxWidth: '500px',
    marginBottom: 'var(--spacing-lg)',
  },
  button: {
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    borderRadius: 'var(--radius-default)',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    cursor: 'pointer',
    transition: 'background-color var(--duration-fast) var(--ease-default)',
  },
  detailsContainer: {
    marginTop: 'var(--spacing-lg)',
    width: '100%',
    maxWidth: '600px',
    textAlign: 'left' as const,
  },
  detailsButton: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-tertiary)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    textDecoration: 'underline',
    padding: '0',
  },
  errorDetails: {
    marginTop: 'var(--spacing-md)',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-family-mono)',
    fontSize: 'var(--font-size-xs)',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

/**
 * ErrorBoundary Component Implementation
 * 
 * Features:
 * - Catches rendering errors in child components
 * - Displays user-friendly fallback UI
 * - Optional custom fallback component
 * - Callback for error logging/analytics
 * - Reset functionality
 * 
 * Usage:
 * <ErrorBoundary 
 *   fallback={<CustomErrorUI />}
 *   onError={trackErrorInAnalytics}
 * >
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to provided callback (e.g., analytics service)
    this.props.onError?.(error, errorInfo);
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container} role="alert">
          <span style={styles.icon} aria-hidden="true">😕</span>
          <h2 style={styles.title}>Something went wrong</h2>
          <p style={styles.message}>
            We apologize for the inconvenience. An unexpected error occurred. 
            Please try refreshing the page or contacting support if the problem persists.
          </p>
          
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              ...styles.button,
              ':hover': {
                backgroundColor: 'var(--color-primary-hover)',
              } as React.CSSProperties,
            }}
          >
            Try Again
          </button>

          <details style={styles.detailsContainer}>
            <summary style={styles.detailsButton}>
              Error Details
            </summary>
            <div style={styles.errorDetails}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorBoundary Component
 * 
 * Specialized error boundary for route/page-level errors.
 * Includes navigation back functionality.
 */
interface RouteErrorBoundaryProps {
  children: ReactNode;
  path?: string;
}

export function RouteErrorBoundary({ 
  children, 
  path = '/' 
}: RouteErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Optionally integrate with error tracking services
        console.error('Route Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
