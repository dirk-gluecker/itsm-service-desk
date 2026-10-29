/**
 * Shared Components Index
 * 
 * Exports all design system components with consistent TypeScript interfaces
 */

export { Button } from './Button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button/Button';
export { Input } from './Input/Input';
export type { InputProps, InputSize, InputType } from './Input/Input';
export { Select } from './Select/Select';
export type { SelectProps, SelectOption, SelectSize } from './Select/Select';
export { Card, type CardProps } from './Card/Card';
export { Modal, type ModalProps } from './Modal/Modal';
export { 
  Table, 
} from './Table/Table';
export type { TableProps, Column, SortDirection } from './Table/Table';
export {
  Badge,
  StatusBadge,
  PriorityBadge,
} from './Badge/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge/Badge';
export {
  ThemeProvider,
  useTheme,
  ThemeToggle,
  ThemeMenuDropdown,
} from './ThemeProvider/ThemeProvider';
export type { ThemeContextValue } from './ThemeProvider/ThemeProvider';
export {
  ErrorBoundary,
  RouteErrorBoundary,
} from './ErrorBoundary/ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary/ErrorBoundary';
export {
  LoadingSpinner,
  FullPageLoader,
  SkeletonLoader,
  type LoadingSpinnerProps,
  type SpinnerSize,
  type FullPageLoaderProps,
  type SkeletonLoaderProps,
} from './LoadingSpinner/LoadingSpinner';
