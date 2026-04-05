/**
 * @file app/page.tsx
 * @description Admin dashboard — overview page.
 */

import Link from 'next/link';
import {
  FileText,
  Image,
  Puzzle,
  Users,
  TrendingUp,
  Plus,
  Upload,
  Settings,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Mock data (replace with real API calls)
// ---------------------------------------------------------------------------

const STATS = [
  {
    label: 'Content Entries',
    value: '1,248',
    change: '+12%',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    href: '/content',
  },
  {
    label: 'Media Files',
    value: '3,841',
    change: '+5%',
    icon: Image,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    href: '/media',
  },
  {
    label: 'Active Extensions',
    value: '7',
    change: '+1',
    icon: Puzzle,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    href: '/extensions',
  },
  {
    label: 'Users',
    value: '24',
    change: '+3',
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    href: '/users',
  },
];

const RECENT_ENTRIES = [
  { id: '1', title: 'Getting Started with Volqan', type: 'Post', status: 'published', author: 'Alice', updatedAt: '2m ago' },
  { id: '2', title: 'New Feature Announcement', type: 'Post', status: 'draft', author: 'Bob', updatedAt: '1h ago' },
  { id: '3', title: 'MacBook Pro M4', type: 'Product', status: 'published', author: 'Charlie', updatedAt: '3h ago' },
  { id: '4', title: 'Privacy Policy', type: 'Page', status: 'published', author: 'Alice', updatedAt: '1d ago' },
  { id: '5', title: 'Summer Sale Banner', type: 'Banner', status: 'scheduled', author: 'David', updatedAt: '2d ago' },
];

const QUICK_ACTIONS = [
  { label: 'New Content Entry', icon: Plus, href: '/content', variant: 'default' as const },
  { label: 'Upload Media', icon: Upload, href: '/media', variant: 'secondary' as const },
  { label: 'Manage Extensions', icon: Puzzle, href: '/extensions', variant: 'secondary' as const },
  { label: 'System Settings', icon: Settings, href: '/settings', variant: 'secondary' as const },
];

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'default' | 'info'> = {
  published: 'success',
  draft: 'default',
  scheduled: 'info',
  archived: 'warning',
};

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            Welcome back, Admin
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Here&apos;s what&apos;s happening with your site today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <Activity className="w-3.5 h-3.5" />
          <span>Last updated just now</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stat.value}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent entries */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Content</CardTitle>
                  <CardDescription className="mt-0.5">Latest content entries across all types</CardDescription>
                </div>
                <Link href="/content">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[hsl(var(--border))]">
                {RECENT_ENTRIES.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/content/${entry.type.toLowerCase()}/${entry.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-[hsl(var(--accent))] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate group-hover:text-[hsl(var(--primary))] transition-colors">
                        {entry.title}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {entry.type} · {entry.author}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={STATUS_BADGE[entry.status] ?? 'default'}>
                        {entry.status}
                      </Badge>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{entry.updatedAt}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks, one click away</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="block">
                    <Button
                      variant={action.variant}
                      className="w-full justify-start gap-2"
                      size="sm"
                    >
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Trend card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
                <CardTitle>Site Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Uptime', value: '99.99%', good: true },
                { label: 'API Latency', value: '42ms', good: true },
                { label: 'Storage', value: '68% used', good: true },
                { label: 'License', value: 'Active', good: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">{item.label}</span>
                  <span className={item.good ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-500 font-medium'}>
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
