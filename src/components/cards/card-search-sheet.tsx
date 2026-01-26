'use client';

import { Search, X } from 'lucide-react';
import type { useCardSearch } from '@/hooks/use-card-search';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardSearchGrid } from '@/components/cards/card-search-grid';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { ManaFilterPills } from '@/components/cards/mana-filter-pills';
import type { ScryfallCard } from '@/types/scryfall.types';

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
  const { cards, isLoading, params, setQuery, toggleColor, setType } = search;

  const handleColorChange = (colors: string[]) => {
    // Toggle each color that changed
    const added = colors.filter((c) => !params.colors.includes(c));
    const removed = params.colors.filter((c) => !colors.includes(c));
    [...added, ...removed].forEach((color) => toggleColor(color));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[90vh] flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="text-left">Search Cards</SheetTitle>
        </SheetHeader>

        {/* Search and Filters - all inline */}
        <div className="space-y-3 border-b px-4 py-3">
          {/* Search input */}
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

          {/* Inline filters with mana symbols */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mana color filters with proper SVG symbols */}
            <ManaFilterPills
              selected={params.colors}
              onChange={handleColorChange}
              size="sm"
              showGuildName={false}
            />

            {/* Type filter dropdown */}
            <Select value={params.type || ''} onValueChange={setType}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any type</SelectItem>
                <SelectItem value="creature">Creature</SelectItem>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="sorcery">Sorcery</SelectItem>
                <SelectItem value="artifact">Artifact</SelectItem>
                <SelectItem value="enchantment">Enchantment</SelectItem>
                <SelectItem value="planeswalker">Planeswalker</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>

            {/* Color identity limit indicator */}
            {params.colorIdentity && params.colorIdentity.length > 0 && (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span>Deck:</span>
                <ColorIdentityBadges colors={params.colorIdentity} size="xs" />
              </div>
            )}
          </div>
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
