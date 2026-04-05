'use client';

/**
 * @file components/layout/ThemeProvider.tsx
 * @description Dark/light mode provider using CSS variables and next-themes.
 * Injects Volqan design tokens as CSS custom properties on the document root.
 */

import * as React from 'react';

// ---------------------------------------------------------------------------
// Theme context
// ---------------------------------------------------------------------------

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
});

// ---------------------------------------------------------------------------
// CSS variable injection
// ---------------------------------------------------------------------------

const LIGHT_VARS = `
  --background: 0 0% 98%;
  --foreground: 224 71% 4%;
  --card: 0 0% 100%;
  --card-foreground: 224 71% 4%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71% 4%;
  --primary: 220 90% 56%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 96%;
  --secondary-foreground: 220 9% 46%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --accent: 220 14% 96%;
  --accent-foreground: 220 9% 26%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 220 90% 56%;
  --radius: 0.5rem;
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 60px;
  --topbar-height: 56px;
  --volqan-color-primary: #3b82f6;
  --volqan-color-secondary: #64748b;
  --volqan-color-accent: #f59e0b;
  --volqan-color-background: #f8fafc;
  --volqan-color-surface: #ffffff;
  --volqan-color-text-primary: #0f172a;
  --volqan-color-text-secondary: #475569;
  --volqan-color-text-muted: #94a3b8;
  --volqan-color-border: #e2e8f0;
  --volqan-font-sans: "Inter", system-ui, sans-serif;
  --volqan-font-mono: "JetBrains Mono", "Fira Code", monospace;
  --volqan-animation-duration: 150ms;
  --volqan-animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
`;

const DARK_VARS = `
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --card: 222 47% 7%;
  --card-foreground: 213 31% 91%;
  --popover: 222 47% 7%;
  --popover-foreground: 213 31% 91%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 4%;
  --secondary: 222 47% 11%;
  --secondary-foreground: 215 20% 65%;
  --muted: 223 47% 11%;
  --muted-foreground: 215 20% 65%;
  --accent: 222 47% 11%;
  --accent-foreground: 213 31% 91%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 213 31% 91%;
  --border: 216 34% 17%;
  --input: 216 34% 17%;
  --ring: 217 91% 60%;
  --radius: 0.5rem;
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 60px;
  --topbar-height: 56px;
  --volqan-color-primary: #60a5fa;
  --volqan-color-secondary: #94a3b8;
  --volqan-color-accent: #fbbf24;
  --volqan-color-background: #0f172a;
  --volqan-color-surface: #1e293b;
  --volqan-color-text-primary: #f1f5f9;
  --volqan-color-text-secondary: #94a3b8;
  --volqan-color-text-muted: #475569;
  --volqan-color-border: #1e293b;
  --volqan-font-sans: "Inter", system-ui, sans-serif;
  --volqan-font-mono: "JetBrains Mono", "Fira Code", monospace;
  --volqan-animation-duration: 150ms;
  --volqan-animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
`;

// ---------------------------------------------------------------------------
// ThemeProvider component
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'volqan-admin-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('light');

  // Apply theme to document root
  React.useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initial = stored ?? defaultTheme;
    setThemeState(initial);

    const applyTheme = (t: Theme) => {
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      root.classList.toggle('dark', isDark);
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      root.style.cssText = isDark ? DARK_VARS : LIGHT_VARS;
      setResolvedTheme(isDark ? 'dark' : 'light');
    };

    applyTheme(initial);

    // Listen for system preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handleSystemChange);
    return () => mq.removeEventListener('change', handleSystemChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = React.useCallback(
    (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setThemeState(t);
      const root = document.documentElement;
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      root.style.cssText = isDark ? DARK_VARS : LIGHT_VARS;
      setResolvedTheme(isDark ? 'dark' : 'light');
    },
    [storageKey],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
