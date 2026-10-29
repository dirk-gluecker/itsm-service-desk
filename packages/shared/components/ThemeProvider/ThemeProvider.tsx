/**
 * ThemeProvider Component
 * Manages light/dark theme with system preference detection and persistence
 * WCAG AA compliant contrast ratios in both themes
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateCSSVariables, ThemeMode } from '../../design-tokens';

export interface ThemeContextValue {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Storage key for persisting user preference
const THEME_STORAGE_KEY = 'itsm-theme-preference';

// Default system query for dark mode preference
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

/**
 * Helper to get CSS styles for current theme
 */
function getThemeStyles(theme: 'light' | 'dark'): React.CSSProperties {
  const variables = generateCSSVariables(theme);
  
  return Object.entries(variables).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value }),
    {}
  );
}

/**
 * ThemeProvider Component Implementation
 * 
 * Features:
 * - System preference detection via prefers-color-scheme
 * - User override via setThemeMode ('light', 'dark', or 'system')
 * - Persists preference to localStorage
 * - Applies CSS variables to document root
 * 
 * Usage:
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * 
 * // Access theme anywhere:
 * const { theme, toggleTheme } = useTheme();
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Resolve actual theme based on mode and system preference
  const resolveTheme = useCallback((mode: ThemeMode): 'light' | 'dark' => {
    if (mode === 'system') {
      return window.matchMedia(DARK_MODE_QUERY).matches ? 'dark' : 'light';
    }
    return mode;
  }, []);

  // Load saved preference and initialize
  useEffect(() => {
    setIsMounted(true);
    
    // Try to load saved preference
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setThemeModeState(saved);
      }
    } catch (e) {
      // localStorage might not be available
      console.warn('Could not access localStorage for theme preference');
    }
  }, []);

  // Update resolved theme when mode or system preference changes
  useEffect(() => {
    if (!isMounted) return;
    
    const newResolvedTheme = resolveTheme(themeMode);
    setResolvedTheme(newResolvedTheme);
    
    // Apply CSS variables to root element
    const root = document.documentElement;
    const variables = generateCSSVariables(newResolvedTheme);
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Also add class for legacy/class-based styling
    root.classList.remove('light', 'dark');
    root.classList.add(newResolvedTheme);
  }, [themeMode, resolveTheme, isMounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!isMounted) return;
    
    const mediaQuery = window.matchMedia(DARK_MODE_QUERY);
    
    const handleChange = () => {
      if (themeMode === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    // Modern browsers support addEventListener for MediaQueryList
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode, isMounted]);

  // Save preference when it changes
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (e) {
      console.warn('Could not save theme preference to localStorage');
    }
  }, [themeMode, isMounted]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      // Cycle through: system -> light -> dark -> system
      switch (prev) {
        case 'system':
          return 'light';
        case 'light':
          return 'dark';
        case 'dark':
          return 'system';
        default:
          return 'light';
      }
    });
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, themeMode, setThemeMode, toggleTheme }}>
      <style>{`
        /* Theme transition for smooth switching */
        *,
        *::before,
        *::after {
          transition-property: background-color, border-color, color;
          transition-duration: var(--duration-fast);
          transition-timing-function: var(--ease-default);
        }
        
        /* Focus visible styles for accessibility */
        :focus-visible {
          outline: 2px solid var(--color-border-focus);
          outline-offset: 2px;
        }
        
        /* Remove default focus for keyboard users who also use mouse */
        :focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 * 
 * Returns the current theme context value.
 * Must be used within a ThemeProvider.
 * 
 * @example
 * const { theme, toggleTheme, themeMode, setThemeMode } = useTheme();
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * ThemeToggle Component
 * 
 * A convenient button component for toggling theme in the UI.
 * Can be placed in a user menu or header.
 * 
 * Usage:
 * <ThemeToggle />
 */
export function ThemeToggle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { themeMode, setThemeMode, toggleTheme } = useTheme();

  const getIcon = (): React.ReactNode => {
    switch (themeMode) {
      case 'light':
        return '☀️ Light';
      case 'dark':
        return '🌙 Dark';
      case 'system':
        return '💻 System';
      default:
        return '☀️ Light';
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Current theme: ${themeMode}. Click to change.`}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-default)',
        border: '1px solid var(--color-border-default)',
        backgroundColor: 'var(--color-bg-surface)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-family-sans)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        ...style,
      }}
    >
      {getIcon()}
    </button>
  );
}

/**
 * ThemeMenuDropdown Component
 * 
 * A dropdown selector for choosing theme mode explicitly.
 * Useful for user profile/settings pages.
 * 
 * Usage:
 * <ThemeMenuDropdown />
 */
export function ThemeMenuDropdown({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { themeMode, setThemeMode } = useTheme();

  const options: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: '☀️ Light' },
    { value: 'dark', label: '🌙 Dark' },
    { value: 'system', label: '💻 System Default' },
  ];

  return (
    <div style={{ display: 'inline-block' }}>
      <label
        htmlFor="theme-selector"
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
          marginBottom: 'var(--spacing-xs)',
          display: 'block',
        }}
      >
        Theme
      </label>
      <select
        id="theme-selector"
        value={themeMode}
        onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
        className={className}
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-default)',
          border: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-bg-page)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family-sans)',
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer',
          minWidth: '140px',
          ...style,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ThemeProvider;
