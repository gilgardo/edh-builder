'use client';

import { useState, useCallback } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useCardSearch, useCardSearchState } from '@/hooks/use-card-search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardImage } from './card-image';
import { ManaCost } from './mana-cost';
import { ColorIdentityBadges } from './color-identity-badges';
import type { ScryfallCard } from '@/types/scryfall.types';
import { getCardManaCost } from '@/services/scryfall';
import { cn } from '@/lib/utils';

const MTG_COLORS = [
  { value: 'W', label: 'White', className: 'bg-mtg-white-500 text-mtg-black-800' },
  { value: 'U', label: 'Blue', className: 'bg-mtg-blue-500 text-white' },
  { value: 'B', label: 'Black', className: 'bg-mtg-black-500 text-mtg-white-500' },
  { value: 'R', label: 'Red', className: 'bg-mtg-red-500 text-white' },
  { value: 'G', label: 'Green', className: 'bg-mtg-green-500 text-white' },
];

const CARD_TYPES = [
  'creature',
  'instant',
  'sorcery',
  'artifact',
  'enchantment',
  'planeswalker',
  'land',
];

const RARITIES = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'mythic', label: 'Mythic' },
];

interface CardSearchProps {
  onCardSelect?: (card: ScryfallCard) => void;
  colorIdentityFilter?: string[];
  commanderOnly?: boolean;
  className?: string;
}

export function CardSearch({
  onCardSelect,
  colorIdentityFilter,
  commanderOnly = false,
  className,
}: CardSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const searchState = useCardSearchState();

  // Apply color identity filter if provided
  const params = {
    ...searchState.params,
    colorIdentity: colorIdentityFilter ?? searchState.params.colorIdentity,
    isCommander: commanderOnly || searchState.params.isCommander,
  };

  const { data, isLoading, isFetching } = useCardSearch(params);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      searchState.setPage(1);
    },
    [searchState]
  );

  const toggleColor = (color: string) => {
    const newColors = searchState.colors.includes(color)
      ? searchState.colors.filter((c) => c !== color)
      : [...searchState.colors, color];
    searchState.setColors(newColors);
    searchState.setPage(1);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchState.query}
            onChange={(e) => searchState.setQuery(e.target.value)}
            placeholder="Search cards..."
            className="pl-10"
          />
          {searchState.query && (
            <button
              type="button"
              onClick={() => searchState.setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isLoading}>
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          {/* Color Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">Colors</label>
            <div className="flex flex-wrap gap-2">
              {MTG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => toggleColor(color.value)}
                  className={cn(
                    'h-8 w-8 rounded-full text-sm font-bold transition-all',
                    color.className,
                    searchState.colors.includes(color.value)
                      ? 'ring-2 ring-ring ring-offset-2'
                      : 'opacity-50 hover:opacity-75'
                  )}
                >
                  {color.value}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">Card Type</label>
            <Select value={searchState.type} onValueChange={searchState.setType}>
              <SelectTrigger>
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any type</SelectItem>
                {CARD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CMC Filter */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">CMC</label>
              <div className="flex gap-2">
                <Select
                  value={searchState.cmcOperator}
                  onValueChange={(v) =>
                    searchState.setCmcOperator(v as 'eq' | 'lt' | 'lte' | 'gt' | 'gte')
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">=</SelectItem>
                    <SelectItem value="lt">&lt;</SelectItem>
                    <SelectItem value="lte">&le;</SelectItem>
                    <SelectItem value="gt">&gt;</SelectItem>
                    <SelectItem value="gte">&ge;</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  max={16}
                  value={searchState.cmc ?? ''}
                  onChange={(e) =>
                    searchState.setCmc(e.target.value ? parseInt(e.target.value, 10) : undefined)
                  }
                  placeholder="Any"
                  className="w-20"
                />
              </div>
            </div>

            {/* Rarity Filter */}
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Rarity</label>
              <Select value={searchState.rarity} onValueChange={searchState.setRarity}>
                <SelectTrigger>
                  <SelectValue placeholder="Any rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any rarity</SelectItem>
                  {RARITIES.map((rarity) => (
                    <SelectItem key={rarity.value} value={rarity.value}>
                      {rarity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={searchState.resetFilters}
            className="w-full"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Active Filters */}
      {(searchState.colors.length > 0 || searchState.type || searchState.rarity) && (
        <div className="flex flex-wrap gap-2">
          {searchState.colors.map((color) => (
            <Badge key={color} variant="secondary" className="gap-1">
              {color}
              <button onClick={() => toggleColor(color)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {searchState.type && (
            <Badge variant="secondary" className="gap-1">
              {searchState.type}
              <button onClick={() => searchState.setType('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchState.rarity && (
            <Badge variant="secondary" className="gap-1">
              {searchState.rarity}
              <button onClick={() => searchState.setRarity('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[488/680] rounded-lg" />
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && data?.cards && data.cards.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {data.total.toLocaleString()} {data.total === 1 ? 'card' : 'cards'} found
              </span>
              {isFetching && <span className="animate-pulse">Updating...</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onCardSelect?.(card)}
                  className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <CardImage card={card} size="normal" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-sm font-medium text-white">{card.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <ColorIdentityBadges colors={card.color_identity} size="sm" />
                      {getCardManaCost(card) && (
                        <ManaCost cost={getCardManaCost(card)} size="sm" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {data.hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => searchState.setPage(searchState.page + 1)}
                  disabled={isFetching}
                >
                  Load More
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && data?.cards?.length === 0 && searchState.query && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No cards found matching your search.</p>
            <Button
              variant="link"
              onClick={searchState.resetFilters}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Initial State */}
        {!isLoading && !data && !searchState.query && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Enter a search term to find cards.</p>
          </div>
        )}
      </div>
    </div>
  );
}
