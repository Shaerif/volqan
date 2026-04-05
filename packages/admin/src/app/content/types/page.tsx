'use client';

/**
 * @file app/content/types/page.tsx
 * @description Content type management — visual schema builder overview.
 */

import * as React from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Database, Hash, Type, ToggleLeft, Calendar, Image, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface FieldDef {
  name: string;
  type: string;
  required: boolean;
}

interface ContentTypeDef {
  slug: string;
  name: string;
  description: string;
  fields: FieldDef[];
  entryCount: number;
}

const CONTENT_TYPES: ContentTypeDef[] = [
  {
    slug: 'post',
    name: 'Post',
    description: 'Blog posts and articles',
    entryCount: 142,
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true },
      { name: 'content', type: 'richtext', required: true },
      { name: 'status', type: 'select', required: true },
      { name: 'featured', type: 'boolean', required: false },
      { name: 'coverImage', type: 'image', required: false },
      { name: 'tags', type: 'multiselect', required: false },
      { name: 'publishedAt', type: 'datetime', required: false },
    ],
  },
  {
    slug: 'product',
    name: 'Product',
    description: 'E-commerce products',
    entryCount: 384,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'sku', type: 'text', required: true },
      { name: 'price', type: 'number', required: true },
      { name: 'description', type: 'richtext', required: false },
      { name: 'category', type: 'select', required: false },
      { name: 'inStock', type: 'boolean', required: false },
    ],
  },
  {
    slug: 'page',
    name: 'Page',
    description: 'Static pages',
    entryCount: 12,
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true },
      { name: 'content', type: 'richtext', required: true },
      { name: 'metaTitle', type: 'text', required: false },
      { name: 'metaDescription', type: 'textarea', required: false },
    ],
  },
];

const FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type,
  textarea: Type,
  richtext: Type,
  number: Hash,
  boolean: ToggleLeft,
  datetime: Calendar,
  date: Calendar,
  image: Image,
  select: List,
  multiselect: List,
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ContentTypesPage() {
  const [types, setTypes] = React.useState(CONTENT_TYPES);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Content Types</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Define the structure of your content with custom field schemas.
          </p>
        </div>
        <Link href="/content/types/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New Type
          </Button>
        </Link>
      </div>

      {/* Content types */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {types.map((type) => (
          <Card key={type.slug}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                    <Database className="w-4.5 h-4.5 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <CardTitle>{type.name}</CardTitle>
                    <CardDescription className="mt-0.5">{type.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/content/types/${type.slug}/edit`}>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-[hsl(var(--destructive))]"
                    onClick={() => setTypes((prev) => prev.filter((t) => t.slug !== type.slug))}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] mb-2">
                  <span>{type.fields.length} fields</span>
                  <span>{type.entryCount} entries</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {type.fields.map((field) => {
                    const Icon = FIELD_ICONS[field.type] ?? Type;
                    return (
                      <div
                        key={field.name}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-[hsl(var(--muted)/0.6)] text-xs"
                      >
                        <Icon className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                        <span className="font-medium">{field.name}</span>
                        <span className="text-[hsl(var(--muted-foreground))]">{field.type}</span>
                        {field.required && <span className="text-[hsl(var(--destructive))]">*</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
                <Link href={`/content/${type.slug}`}>
                  <Button variant="outline" size="sm">
                    Browse Entries
                  </Button>
                </Link>
                <Link href={`/content/${type.slug}/new`}>
                  <Button variant="ghost" size="sm">
                    <Plus className="w-3.5 h-3.5" />
                    Add Entry
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
