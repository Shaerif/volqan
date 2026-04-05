'use client';

/**
 * @file components/ui/data-table.tsx
 * @description Data table with sorting, filtering, pagination, and row selection.
 */

import * as React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onDeleteSelected?: (ids: string[]) => void;
  className?: string;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// DataTable component
// ---------------------------------------------------------------------------

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  pageSize = 20,
  onRowClick,
  selectable = false,
  onDeleteSelected,
  className,
  emptyMessage = 'No results found.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDirection>(null);
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setPage(1);
    onSearch?.(q);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const totalPages = Math.ceil(data.length / pageSize);
  const start = (page - 1) * pageSize;
  const pageData = data.slice(start, start + pageSize);

  const allSelected = pageData.length > 0 && pageData.every((r) => selected.has(rowKey(r)));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageData.forEach((r) => next.delete(rowKey(r)));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageData.forEach((r) => next.add(rowKey(r)));
        return next;
      });
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      {(searchable || someSelected) && (
        <div className="flex items-center justify-between gap-3">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full h-8 pl-8 pr-3 text-sm rounded-md border border-[hsl(var(--border))]',
                  'bg-[hsl(var(--background))] text-[hsl(var(--foreground))]',
                  'placeholder:text-[hsl(var(--muted-foreground))]',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
                )}
              />
            </div>
          )}
          {someSelected && onDeleteSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDeleteSelected(Array.from(selected));
                setSelected(new Set());
              }}
              className="ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selected.size})
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                {selectable && (
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                      aria-label="Select all"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))]',
                      col.sortable && 'cursor-pointer hover:text-[hsl(var(--foreground))] select-none',
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageData.map((row, i) => {
                  const id = rowKey(row);
                  const isSelected = selected.has(id);
                  return (
                    <tr
                      key={id}
                      className={cn(
                        'border-b border-[hsl(var(--border))] last:border-0',
                        'transition-colors duration-100',
                        onRowClick && 'cursor-pointer',
                        isSelected
                          ? 'bg-[hsl(var(--primary)/0.06)]'
                          : i % 2 === 0
                          ? 'bg-[hsl(var(--card))]'
                          : 'bg-[hsl(var(--muted)/0.15)]',
                        'hover:bg-[hsl(var(--accent))]',
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td
                          className="w-10 px-3"
                          onClick={(e) => { e.stopPropagation(); toggleRow(id); }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            className="w-3.5 h-3.5 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                            aria-label={`Select row ${id}`}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          {col.accessor(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
          <span>
            Showing {start + 1}–{Math.min(start + pageSize, data.length)} of {data.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
