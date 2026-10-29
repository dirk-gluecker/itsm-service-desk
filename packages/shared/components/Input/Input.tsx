/**
 * Input Component
 * Accessible text input with validation states and helper text
 * WCAG AA compliant focus-visible states
 */

import React, { forwardRef } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
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
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  baseInput: {
    fontFamily: 'var(--font-family-sans)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-default)',
    backgroundColor: 'var(--color-bg-page)',
    color: 'var(--color-text-primary)',
    transition: 'border-color var(--duration-fast) var(--ease-default), box-shadow var(--duration-fast) var(--ease-default)',
    outline: 'none',
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
  errorBorder: {
    borderColor: 'var(--color-border-error)',
  },
  focusState: {
    borderColor: 'var(--color-border-focus)',
    boxShadow: 'var(--shadow-outline)',
  },
  errorFocus: {
    borderColor: 'var(--color-border-error)',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.3)',
  },
  icon: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: 'var(--color-text-tertiary)',
  },
  leftIcon: {
    left: 'var(--spacing-sm)',
  },
  rightIcon: {
    right: 'var(--spacing-sm)',
  },
  iconWithPaddingLeft: {
    paddingLeft: '36px',
  },
  iconWithPaddingRight: {
    paddingRight: '36px',
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
 * Input Component Implementation
 * 
 * Usage:
 * <Input label="Email" type="email" error={!!errors.email} errorMessage={errors.email} />
 * <Input placeholder="Search..." leftIcon={<SearchIcon />} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error = false,
    errorMessage,
    size = 'md',
    leftIcon,
    rightIcon,
    fullWidth = false,
    id,
    className,
    style,
    ...props
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;

  // Dynamic styles based on state
  const inputStyle: React.CSSProperties = {
    ...styles.baseInput,
    ...(size ? styles.sizes[size] : {}),
    ...(hasLeftIcon ? styles.iconWithPaddingLeft : {}),
    ...(hasRightIcon ? styles.iconWithPaddingRight : {}),
    ...(error && isFocused ? styles.errorFocus : styles.focusState),
    ...(error && !isFocused ? styles.errorBorder : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  return (
    <div style={{ ...styles.container, ...(fullWidth ? styles.fullContainer : {}) }}>
      {label && (
        <div style={styles.labelRow}>
          <label htmlFor={inputId} style={styles.label}>
            {label}
            {props.required && <span style={styles.required}>*</span>}
          </label>
        </div>
      )}
      
      <div style={styles.inputWrapper}>
        {leftIcon && (
          <span style={{ ...styles.icon, ...styles.leftIcon }} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <input
          ref={ref}
          id={inputId}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={className}
          {...props}
        />
        
        {rightIcon && (
          <span style={{ ...styles.icon, ...styles.rightIcon }} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      
      {error && errorMessage && (
        <span id={`${inputId}-error`} style={styles.errorMessage} role="alert">
          {errorMessage}
        </span>
      )}
      
      {!error && helperText && (
        <span id={`${inputId}-helper`} style={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
});

export default Input;
