/**
 * Button Component
 * Accessible, reusable button with multiple variants and loading state
 * WCAG AA compliant focus-visible states
 */

import React, { forwardRef, useCallback } from 'react';
import { StatusType, PriorityType } from '../design-tokens';
import './Button.css';

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
    className = '',
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

  const baseClasses = `itsm-button itsm-button--${variant} itsm-button--${size}`;
  const finalClassName = [
    baseClasses,
    fullWidth ? 'itsm-button--full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={finalClassName}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <span className="itsm-button__loader" />
          {children}
        </>
      ) : (
        <>
          {!isLoading && leftIcon && <span aria-hidden="true" className="itsm-button__icon itsm-button__icon--left">{leftIcon}</span>}
          {children}
          {!isLoading && rightIcon && <span aria-hidden="true" className="itsm-button__icon itsm-button__icon--right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
