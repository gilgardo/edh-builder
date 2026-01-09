'use client';

import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { useCardSearch } from '@/hooks/use-card-search';
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
  colorIdentityFilter?: string[];
  onAddCard: (card: ScryfallCard) => void;
  isAdding: boolean;
  initialQuery?: string;
}

export function CardSearchSheet({
  open,
  onOpenChange,
  colorIdentityFilter,
  onAddCard,
  isAdding,
  initialQuery = '',
}: CardSearchSheetProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState('');

  const { data: searchResults, isLoading: isSearching } = useCardSearch(
    {
      query: searchQuery,
      colorIdentity: colorIdentityFilter,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      type: selectedType || undefined,
    },
    searchQuery.length >= 2
  );

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleAddCard = (card: ScryfallCard) => {
    onAddCard(card);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="text-left">Search Cards</SheetTitle>
        </SheetHeader>

        {/* Search and Filters */}
        <div className="px-4 py-3 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards to add..."
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-muted')}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            {colorIdentityFilter && colorIdentityFilter.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Limited to:</span>
                <ColorIdentityBadges colors={colorIdentityFilter} size="sm" />
              </div>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg border bg-muted/30">
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
                        selectedColors.includes(color.value)
                          ? 'ring-2 ring-ring ring-offset-1'
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
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Any" />
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
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-auto">
          <CardSearchGrid
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            onAddCard={handleAddCard}
            isAdding={isAdding}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
