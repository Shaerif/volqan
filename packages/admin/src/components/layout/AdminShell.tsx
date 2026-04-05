'use client';

/**
 * @file components/layout/AdminShell.tsx
 * @description Client-side admin shell with sidebar state management.
 */

import * as React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ThemeProvider } from './ThemeProvider';
import { AttributionFooter } from '../AttributionFooter';
import { cn } from '@/lib/utils';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <ThemeProvider defaultTheme="system">
      <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
        {/* Sidebar */}
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Top bar */}
          <TopBar />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>

          {/* Attribution footer */}
          <ClientAttributionFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}

/**
 * Client-side wrapper for AttributionFooter.
 * The real component is a Server Component but we include an inline version
 * here for layouts that are fully client-rendered.
 */
function ClientAttributionFooter() {
  return (
    <footer
      className="attribution-footer"
      aria-label="Powered by Volqan"
      data-testid="attribution-footer"
    >
      <span>
        Powered by{' '}
        <a
          href="https://volqan.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="attribution-footer__link"
        >
          Volqan
        </a>
      </span>
    </footer>
  );
}
