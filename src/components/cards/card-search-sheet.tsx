'use client';

import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { useCardSearch } from '@/hooks/use-card-search';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardSearchGrid } from '@/components/cards/card-search-grid';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { cn } from '@/lib/utils';
import type { ScryfallCard } from '@/types/scryfall.types';

const MTG_COLORS = [
  { value: 'W', label: 'White', className: 'bg-mtg-white-500 text-mtg-black-800' },
  { value: 'U', label: 'Blue', className: 'bg-mtg-blue-500 text-white' },
  { value: 'B', label: 'Black', className: 'bg-mtg-black-500 text-mtg-white-500' },
  { value: 'R', label: 'Red', className: 'bg-mtg-red-500 text-white' },
  { value: 'G', label: 'Green', className: 'bg-mtg-green-500 text-white' },
];

interface CardSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: ReturnType<typeof useCardSearch>;
  onAddCard: (card: ScryfallCard) => void;
  isAdding: boolean;
}

export function CardSearchSheet({
  open,
  onOpenChange,
  search,
  onAddCard,
  isAdding,
}: CardSearchSheetProps) {
  const [showFilters, setShowFilters] = useState(false);

  const { cards, isLoading, params, setQuery, toggleColor, setType } = search;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[90vh] flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="text-left">Search Cards</SheetTitle>
        </SheetHeader>

        {/* Search and Filters */}
        <div className="space-y-3 border-b px-4 py-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={params.query || ''}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards to add..."
              className="pr-10 pl-10"
              autoFocus
            />
            {params.query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-muted')}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            {params.colorIdentity && params.colorIdentity.length > 0 && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span>Limited to:</span>
                <ColorIdentityBadges colors={params.colorIdentity} size="sm" />
              </div>
            )}
          </div>

          {showFilters && (
            <div className="bg-muted/30 flex flex-wrap items-center gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Colors:</span>
                <div className="flex gap-1">
                  {MTG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => toggleColor(color.value)}
                      className={cn(
                        'h-6 w-6 rounded-full text-xs font-bold transition-all',
                        color.className,
                        params.colors.includes(color.value)
                          ? 'ring-ring ring-2 ring-offset-1'
                          : 'opacity-50 hover:opacity-75'
                      )}
                    >
                      {color.value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Type:</span>
                <Select value={params.type || ''} onValueChange={setType}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creature">Creature</SelectItem>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="sorcery">Sorcery</SelectItem>
                    <SelectItem value="artifact">Artifact</SelectItem>
                    <SelectItem value="enchantment">Enchantment</SelectItem>
                    <SelectItem value="planeswalker">Planeswalker</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-auto">
          <CardSearchGrid
            searchQuery={params.query || ''}
            cards={cards}
            isSearching={isLoading}
            onAddCard={onAddCard}
            isAdding={isAdding}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
