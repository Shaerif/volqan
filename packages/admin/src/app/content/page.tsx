/**
 * @file app/content/page.tsx
 * @description Content types list page.
 */

import Link from 'next/link';
import { Plus, FileText, Database, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Mock content types data
// ---------------------------------------------------------------------------

const CONTENT_TYPES = [
  {
    slug: 'post',
    name: 'Post',
    description: 'Blog posts and articles',
    entryCount: 142,
    fields: 8,
    status: 'active',
  },
  {
    slug: 'page',
    name: 'Page',
    description: 'Static pages like About, Contact',
    entryCount: 12,
    fields: 5,
    status: 'active',
  },
  {
    slug: 'product',
    name: 'Product',
    description: 'E-commerce product listings',
    entryCount: 384,
    fields: 15,
    status: 'active',
  },
  {
    slug: 'banner',
    name: 'Banner',
    description: 'Promotional banners and announcements',
    entryCount: 24,
    fields: 4,
    status: 'active',
  },
  {
    slug: 'faq',
    name: 'FAQ',
    description: 'Frequently asked questions',
    entryCount: 56,
    fields: 3,
    status: 'active',
  },
  {
    slug: 'testimonial',
    name: 'Testimonial',
    description: 'Customer reviews and testimonials',
    entryCount: 48,
    fields: 6,
    status: 'active',
  },
];

// ---------------------------------------------------------------------------
// Content page
// ---------------------------------------------------------------------------

export default function ContentPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Content</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {CONTENT_TYPES.length} content types · {CONTENT_TYPES.reduce((s, t) => s + t.entryCount, 0).toLocaleString()} total entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/content/types">
            <Button variant="outline" size="sm">
              <Database className="w-4 h-4" />
              Manage Types
            </Button>
          </Link>
          <Link href="/content/types/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New Type
            </Button>
          </Link>
        </div>
      </div>

      {/* Content types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CONTENT_TYPES.map((type) => (
          <Card
            key={type.slug}
            className="hover:shadow-md transition-shadow duration-200 group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{type.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{type.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">
                  {type.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-lg font-bold text-[hsl(var(--foreground))]">{type.entryCount.toLocaleString()}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">entries</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[hsl(var(--foreground))]">{type.fields}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">fields</p>
                  </div>
                </div>
                <Link href={`/content/${type.slug}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Browse <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
