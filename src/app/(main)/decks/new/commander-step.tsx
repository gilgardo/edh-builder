'use client';

import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardImage } from '@/components/cards/card-image';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScryfallCard } from '@/types/scryfall.types';

interface CommanderStepProps {
  selectedCommander: ScryfallCard | null;
  cards: ScryfallCard[];
  query: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onSelectCommander: (card: ScryfallCard) => void;
  onClearCommander: () => void;
  onContinue: () => void;
}

export function CommanderStep({
  selectedCommander,
  cards,
  query,
  isSearching,
  onQueryChange,
  onSelectCommander,
  onClearCommander,
  onContinue,
}: CommanderStepProps) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for a legendary creature..."
          className="pl-10"
        />
      </div>

      {/* Selected Commander */}
      {selectedCommander && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Selected Commander
              <Button variant="ghost" size="sm" onClick={onClearCommander}>
                Change
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <CardImage card={selectedCommander} size="small" />
            <div>
              <h3 className="font-semibold">{selectedCommander.name}</h3>
              <p className="text-muted-foreground text-sm">{selectedCommander.type_line}</p>
              <div className="mt-2">
                <ColorIdentityBadges colors={selectedCommander.color_identity} />
              </div>
              <Button className="mt-4 gap-2" onClick={onContinue}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {!selectedCommander && (
        <>
          {isSearching && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-488/680 rounded-lg" />
              ))}
            </div>
          )}

          {!isSearching && cards.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelectCommander(card)}
                  className="group focus:ring-ring relative overflow-hidden rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:outline-none"
                >
                  <CardImage card={card} size="normal" />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-sm font-medium text-white">{card.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length >= 3 && cards.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No legendary creatures found matching &quot;{query}&quot;
              </p>
            </div>
          )}

          {!isSearching && query.length < 3 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {query.length > 0
                  ? 'Type at least 3 characters to search'
                  : 'Enter a name to search for legendary creatures'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
