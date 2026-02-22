/**
 * Dark Mode Color System (Tailwind slate palette)
 *
 * Surface hierarchy (darkest to lightest):
 *   slate-950  - App background
 *   slate-900  - Cards, nav bars, header bars
 *   slate-800  - Elevated/inset elements (code blocks, inactive toggle buttons)
 *   slate-700  - Hover state on elevated elements
 *
 * Border hierarchy:
 *   slate-800  - Subtle borders (card edges against slate-950 background)
 *   slate-700  - Prominent borders (input outlines, control separators)
 *
 * Text hierarchy:
 *   slate-50   - Primary text (headings, important labels)
 *   slate-200  - Secondary text (code snippets, inline values)
 *   slate-300  - Body text, descriptions
 *   slate-400  - Muted text (captions, timestamps, inactive nav items)
 *   slate-500  - Disabled / placeholder text
 *
 * Accent colors on dark backgrounds:
 *   teal-400   - Active nav items, links, interactive highlights
 *   teal-600   - Buttons (unchanged, works on dark and light)
 *   red-400    - Destructive actions (sign out, delete)
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'makeit_theme_mode';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  // Listen to OS preference changes (only matters when mode === 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveTheme = useMemo<'light' | 'dark'>(() => {
    if (mode === 'system') return systemTheme;
    return mode;
  }, [mode, systemTheme]);

  // Apply / remove dark class on <html>
  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, effectiveTheme }),
    [mode, setMode, effectiveTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
