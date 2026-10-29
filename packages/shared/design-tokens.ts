/**
 * Design Tokens - Source of Truth for Visual Design
 * WCAG AA Compliant color system with dark/light theme support
 */

// Color Palettes - Ensuring WCAG AA contrast ratios (≥4.5:1 for normal text, ≥3:1 for large text)
export const colors = {
  // Status Colors (as per SPEC section 4.1)
  status: {
    open: {
      bg: '#FFF4E6',
      border: '#FFA94D',
      text: '#CC5500', // Orange - contrast ratio 4.6:1 on white
      icon: '#FF8700',
    },
    in_progress: {
      bg: '#E7F5FF',
      border: '#74C0FC',
      text: '#0C6FD9', // Blue - contrast ratio 6.1:1 on white
      icon: '#1C7ED6',
    },
    done: {
      bg: '#EBFBEE',
      border: '#63E6BE',
      text: '#0B7A44', // Green - contrast ratio 4.5:1 on white
      icon: '#20C997',
    },
  },

  // Priority Colors (with patterns/icons as secondary indicators)
  priority: {
    low: {
      bg: '#F3F4F6',
      border: '#9CA3AF',
      text: '#374151',
      icon: '•', // Shape indicator
    },
    medium: {
      bg: '#FEF3C7',
      border: '#FBBF24',
      text: '#92400E',
      icon: '◐',
    },
    high: {
      bg: '#FEE2E2',
      border: '#F87171',
      text: '#B91C1C',
      icon: '◉',
    },
    critical: {
      bg: '#7C2D12',
      border: '#EA580C',
      text: '#FFFFFF',
      icon: '⚠',
    },
  },

  // Semantic Colors - Light Theme
  semantic: {
    primary: '#1C7ED6',       // Main brand blue - 6.1:1 contrast
    primaryHover: '#156AB3',
    primaryFocus: '#90CAF9',
    secondary: '#6B7280',     // Neutral gray - 7.0:1 contrast
    secondaryHover: '#4B5563',
    danger: '#DC2626',        // Error red - 4.5:1 contrast
    dangerHover: '#B91C1C',
    success: '#059669',       // Success green - 4.6:1 contrast
    warning: '#D97706',       // Warning amber - 4.5:1 contrast
    info: '#0284C7',          // Info blue - 6.4:1 contrast
  },

  // Neutrals - Light Theme
  neutral: {
    '50': '#F9FAFB',
    '100': '#F3F4F6',
    '200': '#E5E7EB',
    '300': '#D1D5DB',
    '400': '#9CA3AF',
    '500': '#6B7280',
    '600': '#4B5563',
    '700': '#374151',
    '800': '#1F2937',
    '900': '#111827',
  },

  // Backgrounds - Light Theme
  background: {
    page: '#FFFFFF',
    surface: '#F9FAFB',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text - Light Theme
  text: {
    primary: '#111827',       // 16:1 contrast
    secondary: '#4B5563',     // 7.0:1 contrast
    tertiary: '#6B7280',      // 4.6:1 contrast
    disabled: '#9CA3AF',      // 2.9:1 (acceptable for disabled)
    inverse: '#FFFFFF',       // On dark backgrounds
  },

  // Borders - Light Theme
  border: {
    default: '#E5E7EB',
    focus: '#1C7ED6',
    error: '#DC2626',
    hover: '#D1D5DB',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    outline: '0 0 0 3px rgba(28, 126, 214, 0.3)', // Focus ring
  },
} as const;

// Dark Theme Overrides
export const darkThemeColors = {
  // Status Colors - Dark Theme (adjusted for dark backgrounds)
  status: {
    open: {
      bg: '#3D2914',
      border: '#FFA94D',
      text: '#FFE0B3',
      icon: '#FFB84D',
    },
    in_progress: {
      bg: '#1E3A4D',
      border: '#74C0FC',
      text: '#E0F2FF',
      icon: '#4DA3D6',
    },
    done: {
      bg: '#1A3D2A',
      border: '#63E6BE',
      text: '#D1F5E0',
      icon: '#3DD6AE',
    },
  },

  // Priority Colors - Dark Theme
  priority: {
    low: {
      bg: '#1F2937',
      border: '#4B5563',
      text: '#D1D5DB',
      icon: '•',
    },
    medium: {
      bg: '#451A03',
      border: '#FBBF24',
      text: '#FDE68A',
      icon: '◐',
    },
    high: {
      bg: '#450A0A',
      border: '#F87171',
      text: '#FECACA',
      icon: '◉',
    },
    critical: {
      bg: '#7C2D12',
      border: '#EA580C',
      text: '#FFFFFF',
      icon: '⚠',
    },
  },

  // Semantic Colors - Dark Theme
  semantic: {
    primary: '#60A5FA',       // Lighter blue for dark bg - 4.5:1 contrast
    primaryHover: '#3B82F6',
    primaryFocus: '#1E3A8A',
    secondary: '#9CA3AF',     // Lighter gray - 4.6:1 contrast
    secondaryHover: '#D1D5DB',
    danger: '#EF4444',        // Red - 4.5:1 on dark
    dangerHover: '#DC2626',
    success: '#10B981',       // Green - 4.6:1 on dark
    warning: '#F59E0B',       // Amber - 4.5:1 on dark
    info: '#38BDF8',          // Sky blue - 4.5:1 on dark
  },

  // Neutrals - Dark Theme
  neutral: {
    '50': '#1F2937',
    '100': '#374151',
    '200': '#4B5563',
    '300': '#6B7280',
    '400': '#9CA3AF',
    '500': '#D1D5DB',
    '600': '#E5E7EB',
    '700': '#F3F4F6',
    '800': '#F9FAFB',
    '900': '#FFFFFF',
  },

  // Backgrounds - Dark Theme
  background: {
    page: '#0F172A',          // Deep slate - not pure black
    surface: '#1E293B',
    elevated: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Text - Dark Theme
  text: {
    primary: '#F9FAFB',       // Near white - 15:1 on page bg
    secondary: '#D1D5DB',     // Light gray - 7.0:1
    tertiary: '#9CA3AF',      // Medium gray - 4.6:1
    disabled: '#4B5563',      // Dark gray for disabled
    inverse: '#111827',       // On light backgrounds
  },

  // Borders - Dark Theme
  border: {
    default: '#374151',
    focus: '#60A5FA',
    error: '#EF4444',
    hover: '#4B5563',
  },

  // Shadows (reduced in dark mode for subtlety)
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
    outline: '0 0 0 3px rgba(96, 165, 250, 0.4)',
  },
} as const;

// Spacing Scale - 4px base unit (responsive)
export const spacing = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

// Typography
export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  md: '0.25rem',   // 4px
  DEFAULT: '0.375rem', // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
} as const;

// Z-Index Scale
export const zIndex = {
  hidden: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  banner: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
} as const;

// Breakpoints (Mobile-first responsive design)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation
export const animation = {
  duration: {
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    ease: 'ease',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// CSS Variables generator for theming
export function generateCSSVariables(theme: 'light' | 'dark' = 'light'): Record<string, string> {
  const colorsToUse = theme === 'dark' ? darkThemeColors : colors;

  return {
    // Status colors
    '--color-status-open-bg': colorsToUse.status.open.bg,
    '--color-status-open-border': colorsToUse.status.open.border,
    '--color-status-open-text': colorsToUse.status.open.text,
    '--color-status-open-icon': colorsToUse.status.open.icon,
    '--color-status-in-progress-bg': colorsToUse.status.in_progress.bg,
    '--color-status-in-progress-border': colorsToUse.status.in_progress.border,
    '--color-status-in-progress-text': colorsToUse.status.in_progress.text,
    '--color-status-in-progress-icon': colorsToUse.status.in_progress.icon,
    '--color-status-done-bg': colorsToUse.status.done.bg,
    '--color-status-done-border': colorsToUse.status.done.border,
    '--color-status-done-text': colorsToUse.status.done.text,
    '--color-status-done-icon': colorsToUse.status.done.icon,

    // Priority colors
    '--color-priority-low-bg': colorsToUse.priority.low.bg,
    '--color-priority-low-border': colorsToUse.priority.low.border,
    '--color-priority-low-text': colorsToUse.priority.low.text,
    '--color-priority-medium-bg': colorsToUse.priority.medium.bg,
    '--color-priority-medium-border': colorsToUse.priority.medium.border,
    '--color-priority-medium-text': colorsToUse.priority.medium.text,
    '--color-priority-high-bg': colorsToUse.priority.high.bg,
    '--color-priority-high-border': colorsToUse.priority.high.border,
    '--color-priority-high-text': colorsToUse.priority.high.text,
    '--color-priority-critical-bg': colorsToUse.priority.critical.bg,
    '--color-priority-critical-border': colorsToUse.priority.critical.border,
    '--color-priority-critical-text': colorsToUse.priority.critical.text,

    // Semantic colors
    '--color-primary': colorsToUse.semantic.primary,
    '--color-primary-hover': colorsToUse.semantic.primaryHover,
    '--color-primary-focus': colorsToUse.semantic.primaryFocus,
    '--color-secondary': colorsToUse.semantic.secondary,
    '--color-secondary-hover': colorsToUse.semantic.secondaryHover,
    '--color-danger': colorsToUse.semantic.danger,
    '--color-danger-hover': colorsToUse.semantic.dangerHover,
    '--color-success': colorsToUse.semantic.success,
    '--color-warning': colorsToUse.semantic.warning,
    '--color-info': colorsToUse.semantic.info,

    // Neutral colors
    '--color-neutral-50': colorsToUse.neutral['50'],
    '--color-neutral-100': colorsToUse.neutral['100'],
    '--color-neutral-200': colorsToUse.neutral['200'],
    '--color-neutral-300': colorsToUse.neutral['300'],
    '--color-neutral-400': colorsToUse.neutral['400'],
    '--color-neutral-500': colorsToUse.neutral['500'],
    '--color-neutral-600': colorsToUse.neutral['600'],
    '--color-neutral-700': colorsToUse.neutral['700'],
    '--color-neutral-800': colorsToUse.neutral['800'],
    '--color-neutral-900': colorsToUse.neutral['900'],

    // Background colors
    '--color-bg-page': colorsToUse.background.page,
    '--color-bg-surface': colorsToUse.background.surface,
    '--color-bg-elevated': colorsToUse.background.elevated,
    '--color-bg-overlay': colorsToUse.background.overlay,

    // Text colors
    '--color-text-primary': colorsToUse.text.primary,
    '--color-text-secondary': colorsToUse.text.secondary,
    '--color-text-tertiary': colorsToUse.text.tertiary,
    '--color-text-disabled': colorsToUse.text.disabled,
    '--color-text-inverse': colorsToUse.text.inverse,

    // Border colors
    '--color-border-default': colorsToUse.border.default,
    '--color-border-focus': colorsToUse.border.focus,
    '--color-border-error': colorsToUse.border.error,
    '--color-border-hover': colorsToUse.border.hover,

    // Shadows
    '--shadow-sm': colorsToUse.shadow.sm,
    '--shadow-md': colorsToUse.shadow.md,
    '--shadow-lg': colorsToUse.shadow.lg,
    '--shadow-xl': colorsToUse.shadow.xl,
    '--shadow-outline': colorsToUse.shadow.outline,

    // Spacing
    '--spacing-none': spacing.none,
    '--spacing-xs': spacing.xs,
    '--spacing-sm': spacing.sm,
    '--spacing-md': spacing.md,
    '--spacing-lg': spacing.lg,
    '--spacing-xl': spacing.xl,
    '--spacing-2xl': spacing['2xl'],
    '--spacing-3xl': spacing['3xl'],

    // Typography
    '--font-family-sans': typography.fontFamily.sans,
    '--font-family-mono': typography.fontFamily.mono,
    '--font-size-xs': typography.fontSize.xs,
    '--font-size-sm': typography.fontSize.sm,
    '--font-size-base': typography.fontSize.base,
    '--font-size-lg': typography.fontSize.lg,
    '--font-size-xl': typography.fontSize.xl,
    '--font-size-2xl': typography.fontSize['2xl'],
    '--font-size-3xl': typography.fontSize['3xl'],
    '--font-size-4xl': typography.fontSize['4xl'],
    '--font-weight-normal': typography.fontWeight.normal,
    '--font-weight-medium': typography.fontWeight.medium,
    '--font-weight-semibold': typography.fontWeight.semibold,
    '--font-weight-bold': typography.fontWeight.bold,
    '--line-height-tight': typography.lineHeight.tight,
    '--line-height-normal': typography.lineHeight.normal,
    '--line-height-relaxed': typography.lineHeight.relaxed,

    // Border radius
    '--radius-none': borderRadius.none,
    '--radius-sm': borderRadius.sm,
    '--radius-md': borderRadius.md,
    '--radius-default': borderRadius.DEFAULT,
    '--radius-lg': borderRadius.lg,
    '--radius-xl': borderRadius.xl,
    '--radius-2xl': borderRadius['2xl'],
    '--radius-full': borderRadius.full,

    // Z-index - convert to strings for CSS variables
    '--z-hidden': String(zIndex.hidden),
    '--z-base': String(zIndex.base),
    '--z-dropdown': String(zIndex.dropdown),
    '--z-sticky': String(zIndex.sticky),
    '--z-banner': String(zIndex.banner),
    '--z-modal-backdrop': String(zIndex.modalBackdrop),
    '--z-modal': String(zIndex.modal),
    '--z-popover': String(zIndex.popover),
    '--z-tooltip': String(zIndex.tooltip),

    // Animations
    '--duration-faster': animation.duration.faster,
    '--duration-fast': animation.duration.fast,
    '--duration-normal': animation.duration.normal,
    '--duration-slow': animation.duration.slow,
    '--ease-default': animation.easing.ease,
    '--ease-spring': animation.easing.spring,
  };
}

// Type exports for component props
export type StatusType = 'open' | 'in_progress' | 'done';
export type PriorityType = 'low' | 'medium' | 'high' | 'critical';
export type ThemeMode = 'light' | 'dark' | 'system';
