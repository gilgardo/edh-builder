'use client';

import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useDecks } from '@/hooks/use-decks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeckCard, DeckCardSkeleton } from './deck-card';
import { cn } from '@/lib/utils';

const MTG_COLORS = [
  { value: 'W', label: 'White', className: 'bg-mtg-white-500 text-mtg-black-800' },
  { value: 'U', label: 'Blue', className: 'bg-mtg-blue-500 text-white' },
  { value: 'B', label: 'Black', className: 'bg-mtg-black-500 text-mtg-white-500' },
  { value: 'R', label: 'Red', className: 'bg-mtg-red-500 text-white' },
  { value: 'G', label: 'Green', className: 'bg-mtg-green-500 text-white' },
];

const FORMATS = [
  { value: 'COMMANDER', label: 'Commander' },
  { value: 'BRAWL', label: 'Brawl' },
  { value: 'OATHBREAKER', label: 'Oathbreaker' },
];

interface DeckGalleryProps {
  userId?: string;
  showFilters?: boolean;
  className?: string;
}

export function DeckGallery({ userId, showFilters = true, className }: DeckGalleryProps) {
  const [search, setSearch] = useState('');
  const [colorIdentity, setColorIdentity] = useState<string[]>([]);
  const [format, setFormat] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading, isFetching } = useDecks({
    search: search || undefined,
    colorIdentity: colorIdentity.length ? colorIdentity : undefined,
    format: format as 'COMMANDER' | 'BRAWL' | 'OATHBREAKER' | undefined,
    userId,
    page,
    limit: 12,
  });

  const toggleColor = (color: string) => {
    setColorIdentity((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setColorIdentity([]);
    setFormat('');
    setPage(1);
  };

  const hasActiveFilters = search || colorIdentity.length > 0 || format;

  return (
    <div className={cn('space-y-6', className)}>
      {showFilters && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search decks..."
                className="pl-10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(isFilterOpen && 'bg-muted')}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          {isFilterOpen && (
            <div className="border-border bg-card flex flex-wrap items-center gap-4 rounded-lg border p-4">
              {/* Color Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Colors:</span>
                <div className="flex gap-1">
                  {MTG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => toggleColor(color.value)}
                      className={cn(
                        'h-7 w-7 rounded-full text-xs font-bold transition-all',
                        color.className,
                        colorIdentity.includes(color.value)
                          ? 'ring-ring ring-2 ring-offset-2'
                          : 'opacity-50 hover:opacity-75'
                      )}
                    >
                      {color.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Format:</span>
                <Select
                  value={format}
                  onValueChange={(v) => {
                    setFormat(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All formats" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Header */}
      {data && (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {data.total} {data.total === 1 ? 'deck' : 'decks'} found
          </span>
          {isFetching && <span className="animate-pulse">Updating...</span>}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DeckCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Deck Grid */}
      {!isLoading && data?.decks && data.decks.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data?.decks?.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? 'No decks found matching your filters.'
              : 'No decks found. Be the first to create one!'}
          </p>
          {hasActiveFilters && (
            <Button variant="link" onClick={resetFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages || isFetching}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
