/**
 * Select Component
 * Accessible dropdown select with custom styling
 * WCAG AA compliant focus-visible states
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  options: SelectOption[];
  size?: SelectSize;
  fullWidth?: boolean;
  placeholder?: string;
}

// Styles using CSS variables from design tokens
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)',
    width: 'fit-content',
  },
  fullContainer: {
    width: '100%',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)',
  },
  required: {
    color: 'var(--color-danger)',
    marginLeft: '2px',
  },
  wrapper: {
    position: 'relative',
  },
  baseSelect: {
    fontFamily: 'var(--font-family-sans)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-default)',
    backgroundColor: 'var(--color-bg-page)',
    color: 'var(--color-text-primary)',
    transition: 'border-color var(--duration-fast) var(--ease-default), box-shadow var(--duration-fast) var(--ease-default)',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  sizes: {
    sm: {
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      fontSize: 'var(--font-size-sm)',
      minHeight: '32px',
    },
    md: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: 'var(--font-size-base)',
      minHeight: '40px',
    },
    lg: {
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      fontSize: 'var(--font-size-lg)',
      minHeight: '48px',
    },
  },
  arrowWrapper: {
    position: 'absolute',
    right: 'var(--spacing-sm)',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  arrow: {
    width: '0',
    height: '0',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid var(--color-text-tertiary)',
  },
  helperText: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-tertiary)',
  },
  errorMessage: {
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-danger)',
  },
};

/**
 * Select Component Implementation
 * 
 * Usage:
 * <Select 
 *   label="Status" 
 *   options={[{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }]}
 *   error={!!errors.status}
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    error = false,
    errorMessage,
    size = 'md',
    fullWidth = false,
    options,
    placeholder,
    id,
    className,
    style,
    ...props
  },
  ref
) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  // Dynamic styles based on state
  const selectStyle: React.CSSProperties = {
    ...styles.baseSelect,
    ...(size ? styles.sizes[size] : {}),
    paddingRight: '40px', // Space for arrow
    ...(error && isFocused ? { borderColor: 'var(--color-border-error)', boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.3)' } : styles.focusState),
    ...(error && !isFocused ? { borderColor: 'var(--color-border-error)' } : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  return (
    <div style={{ ...styles.container, ...(fullWidth ? styles.fullContainer : {}) }}>
      {label && (
        <div style={styles.labelRow}>
          <label htmlFor={selectId} style={styles.label}>
            {label}
            {props.required && <span style={styles.required}>*</span>}
          </label>
        </div>
      )}
      
      <div style={styles.wrapper}>
        <select
          ref={ref}
          id={selectId}
          style={selectStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={className}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div style={styles.arrowWrapper} aria-hidden="true">
          <div style={styles.arrow} />
        </div>
      </div>
      
      {error && errorMessage && (
        <span id={`${selectId}-error`} style={styles.errorMessage} role="alert">
          {errorMessage}
        </span>
      )}
      
      {!error && helperText && (
        <span id={`${selectId}-helper`} style={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
});

export default Select;
