'use client';

import { Plus, Search } from 'lucide-react';

import { CardImage } from '@/components/cards/card-image';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScryfallCard } from '@/types/scryfall.types';

interface CardSearchGridProps {
  searchQuery: string;
  cards: ScryfallCard[];
  isSearching: boolean;
  onAddCard: (card: ScryfallCard) => void;
  isAdding: boolean;
}

export function CardSearchGrid({
  searchQuery,
  cards,
  isSearching,
  onAddCard,
  isAdding,
}: CardSearchGridProps) {
  if (isSearching) {
    return (
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-488/680 rounded-lg" />
        ))}
      </div>
    );
  }

  if (cards.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onAddCard(card)}
            disabled={isAdding}
            className="group focus:ring-ring relative overflow-hidden rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:outline-none"
          >
            <CardImage card={card} size="normal" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex flex-col items-center text-white">
                <Plus className="h-8 w-8" />
                <span className="mt-1 text-sm font-medium">Add</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (searchQuery.length >= 2 && cards.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No cards found matching &quot;{searchQuery}&quot;</p>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <Search className="text-muted-foreground mx-auto h-12 w-12" />
      <p className="text-muted-foreground mt-4">Search for cards to add to your deck</p>
    </div>
  );
}
