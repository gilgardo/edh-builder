'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { CmcOperator, useCardSearch } from '@/hooks/use-card-search';
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
  const {
    cards,
    total,
    hasMore,
    isLoading,
    isFetching,
    params,
    setQuery,
    toggleColor,
    setType,
    setCmc,
    setRarity,
    nextPage,
    reset,
    setBaseParams,
  } = useCardSearch();

  // Set base params when colorIdentityFilter or commanderOnly changes
  useEffect(() => {
    reset();
    if (colorIdentityFilter || commanderOnly) {
      setBaseParams(colorIdentityFilter || [], commanderOnly);
    }
  }, [colorIdentityFilter, commanderOnly, reset, setBaseParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={params.query || ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards..."
            className="pl-10"
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
        <div className="border-border bg-card space-y-4 rounded-lg border p-4">
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
                    params.colors.includes(color.value)
                      ? 'ring-ring ring-2 ring-offset-2'
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
            <Select value={params.type || ''} onValueChange={setType}>
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
                  value={params.cmcOperator}
                  onValueChange={(v) =>
                    setCmc(params.cmc, v as CmcOperator)
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
                  value={params.cmc ?? ''}
                  onChange={(e) =>
                    setCmc(Number(e.target.value), params.cmcOperator)
                  }
                  placeholder="Any"
                  className="w-20"
                />
              </div>
            </div>

            {/* Rarity Filter */}
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Rarity</label>
              <Select value={params.rarity || ''} onValueChange={setRarity}>
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
            onClick={() => reset()}
            className="w-full"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Active Filters */}
      {(params.colors.length > 0 || params.type || params.rarity) && (
        <div className="flex flex-wrap gap-2">
          {params.colors.map((color: string) => (
            <Badge key={color} variant="secondary" className="gap-1">
              {color}
              <button onClick={() => toggleColor(color)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {params.type && (
            <Badge variant="secondary" className="gap-1">
              {params.type}
              <button onClick={() => setType('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {params.rarity && (
            <Badge variant="secondary" className="gap-1">
              {params.rarity}
              <button onClick={() => setRarity('')}>
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
              <Skeleton key={i} className="aspect-488/680 rounded-lg" />
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && cards && cards.length > 0 && (
          <>
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>
                {total.toLocaleString()} {total === 1 ? 'card' : 'cards'} found
              </span>
              {isFetching && <span className="animate-pulse">Updating...</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {cards.map((card: ScryfallCard) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onCardSelect?.(card)}
                  className="group focus:ring-ring relative overflow-hidden rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:outline-none"
                >
                  <CardImage card={card} size="normal" />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-sm font-medium text-white">{card.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <ColorIdentityBadges colors={card.color_identity} size="sm" />
                      {getCardManaCost(card) && <ManaCost cost={getCardManaCost(card)} size="sm" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => nextPage()}
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
        {!isLoading && cards.length === 0 && params.query && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No cards found matching your search.</p>
            <Button variant="link" onClick={() => reset()} className="mt-2">
              Clear filters
            </Button>
          </div>
        )}

        {/* Initial State */}
        {!isLoading && cards.length === 0 && !params.query && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Enter a search term to find cards.</p>
          </div>
        )}
      </div>
    </div>
  );
}
