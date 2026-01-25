'use client';

import { useState } from 'react';
import { Search, X, SlidersHorizontal, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useDecks } from '@/hooks/use-decks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ManaFilterPills } from '@/components/cards';
import { DeckCard, DeckCardSkeleton } from './deck-card';
import { cn } from '@/lib/utils';

const FORMATS = [
  { value: 'COMMANDER', label: 'Commander' },
  { value: 'BRAWL', label: 'Brawl' },
  { value: 'OATHBREAKER', label: 'Oathbreaker' },
];

interface DeckGalleryProps {
  /** Show current user's decks (public + private) */
  mine?: boolean;
  /** Show decks for a specific user */
  userId?: string;
  showFilters?: boolean;
  className?: string;
}

export function DeckGallery({ mine, userId, showFilters = true, className }: DeckGalleryProps) {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [colorIdentity, setColorIdentity] = useState<string[]>([]);
  const [format, setFormat] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // When mine=true, use the current user's ID
  const effectiveUserId = mine ? session?.user?.id : userId;

  const { data, isLoading, isFetching } = useDecks({
    search: search || undefined,
    colorIdentity: colorIdentity.length ? colorIdentity : undefined,
    format: format as 'COMMANDER' | 'BRAWL' | 'OATHBREAKER' | undefined,
    userId: effectiveUserId,
    page,
    limit: 12,
  });

  const resetFilters = () => {
    setSearch('');
    setColorIdentity([]);
    setFormat('');
    setPage(1);
  };

  const hasActiveFilters = search || colorIdentity.length > 0 || format;
  const activeFilterCount = (search ? 1 : 0) + (colorIdentity.length > 0 ? 1 : 0) + (format ? 1 : 0);

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
                placeholder="Search decks by name or commander..."
                variant="filled"
                className="pl-10 pr-10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant={isFilterOpen ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge
                  variant="destructive"
                  size="sm"
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {isFilterOpen && (
            <Card
              variant="elevated"
              className="p-4 animate-in fade-in-0 slide-in-from-top-2 duration-200"
            >
              <div className="flex flex-wrap items-center gap-6">
                {/* Color Filter */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Color Identity</span>
                  <ManaFilterPills
                    selected={colorIdentity}
                    onChange={(colors) => {
                      setColorIdentity(colors);
                      setPage(1);
                    }}
                    size="md"
                  />
                </div>

                {/* Format Filter */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Format</span>
                  <Select
                    value={format}
                    onValueChange={(v) => {
                      setFormat(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Results Header */}
      {data && (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>
              <span className="font-medium text-foreground">{data.total}</span>{' '}
              {data.total === 1 ? 'deck' : 'decks'} found
            </span>
          </span>
          {isFetching && (
            <Badge variant="muted" size="sm" className="animate-pulse">
              Updating...
            </Badge>
          )}
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
        <Card variant="ghost" className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No decks found</h3>
              <p className="text-muted-foreground text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search terms.'
                  : mine
                    ? "You haven't created any decks yet. Start building your first Commander deck!"
                    : 'No decks have been shared yet. Be the first to create one!'}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </Card>
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
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum: number;
              if (data.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= data.totalPages - 2) {
                pageNum = data.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setPage(pageNum)}
                  disabled={isFetching}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages || isFetching}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
