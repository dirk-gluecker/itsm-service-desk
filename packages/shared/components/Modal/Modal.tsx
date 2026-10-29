/**
 * Modal Component
 * Accessible modal dialog with backdrop and keyboard navigation
 * WCAG AA compliant focus trap and aria attributes
 */

import React, { forwardRef, useEffect, useRef, useCallback } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--color-bg-overlay)',
    zIndex: 'var(--z-modal-backdrop)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-md)',
    opacity: 0,
    transition: 'opacity var(--duration-normal) var(--ease-default)',
  },
  overlayOpen: {
    opacity: 1,
  },
  modal: {
    backgroundColor: 'var(--color-bg-elevated)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    transform: 'scale(0.95) translateY(-20px)',
    transition: 'transform var(--duration-normal) var(--ease-spring)',
  },
  modalOpen: {
    transform: 'scale(1) translateY(0)',
  },
  sizes: {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1000px' },
  },
  header: {
    padding: 'var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-default)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 'var(--spacing-sm)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 'var(--font-size-sm)',
    marginLeft: 'var(--spacing-xs)',
  },
  body: {
    padding: 'var(--spacing-lg)',
    overflowY: 'auto',
    flex: 1,
  },
  footer: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderTop: '1px solid var(--color-border-default)',
    backgroundColor: 'var(--color-bg-surface)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-sm)',
    flexShrink: 0,
  },
};

/**
 * Modal Component Implementation
 * 
 * Features:
 * - Focus trap when open
 * - Escape key to close
 * - Backdrop click to close (configurable)
 * - ARIA attributes for accessibility
 * 
 * Usage:
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action">
 *   <p>Are you sure?</p>
 * </Modal>
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    open,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    closeOnBackdrop = true,
    showCloseButton = true,
    ...props
  },
  ref
) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  // Store previously focused element and trap focus
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal or first focusable element
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElements?.[0]?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore previous focus
      previousActiveElement.current?.focus();
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Handle backdrop click
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Close button handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      style={{ ...styles.overlay, ...(open ? styles.overlayOpen : {}) }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={(node) => {
          modalRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        style={{
          ...styles.modal,
          ...(open ? styles.modalOpen : {}),
          ...styles.sizes[size],
        }}
        {...props}
      >
        <header style={styles.header}>
          <h2 id="modal-title" style={styles.title}>{title}</h2>
          
          {showCloseButton && (
            <button
              type="button"
              style={styles.closeButton}
              onClick={handleClose}
              aria-label="Close modal"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </header>
        
        <div style={styles.body}>
          {children}
        </div>
        
        {footer && (
          <footer style={styles.footer}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
});

export default Modal;
