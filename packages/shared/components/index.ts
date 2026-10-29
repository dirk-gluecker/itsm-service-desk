/**
 * Shared Components Index
 * 
 * Exports all design system components with consistent TypeScript interfaces
 */

export { Button, ButtonProps, ButtonVariant, ButtonSize } from './Button/Button';
export { Input, InputProps, InputSize, InputType } from './Input/Input';
export { Select, SelectProps, SelectOption, SelectSize } from './Select/Select';
export { Card, CardProps } from './Card/Card';
export { Modal, ModalProps } from './Modal/Modal';
export { 
  Table, 
  TableProps, 
  Column, 
  SortDirection 
} from './Table/Table';
export {
  Badge,
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  StatusBadge,
  PriorityBadge,
} from './Badge/Badge';
export {
  ThemeProvider,
  useTheme,
  ThemeToggle,
  ThemeMenuDropdown,
  ThemeContextValue,
} from './ThemeProvider/ThemeProvider';
export {
  ErrorBoundary,
  RouteErrorBoundary,
  ErrorBoundaryProps,
} from './ErrorBoundary/ErrorBoundary';
export {
  LoadingSpinner,
  FullPageLoader,
  SkeletonLoader,
  LoadingSpinnerProps,
  SpinnerSize,
  FullPageLoaderProps,
  SkeletonLoaderProps,
} from './LoadingSpinner/LoadingSpinner';
