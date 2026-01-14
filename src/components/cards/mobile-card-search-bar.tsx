'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Search, Eye, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CardRow } from './card-row';
import { toDisplayCard } from '@/types/cards';
import type { ScryfallCard } from '@/types/scryfall.types';

interface MobileCardSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onOpenFullSearch: () => void;
  onAddCard?: (card: ScryfallCard) => void;
  cards?: ScryfallCard[];
  isLoading?: boolean;
  className?: string;
}

export function MobileCardSearchBar({
  value,
  onChange,
  onOpenFullSearch,
  onAddCard,
  cards = [],
  isLoading,
  className,
}: MobileCardSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
    setShowResults(false);
    inputRef.current?.focus();
  }, [onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setShowResults(true);
    },
    [onChange]
  );

  const handleAddCard = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (card && onAddCard) {
        onAddCard(card);
      }
    },
    [cards, onAddCard]
  );

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = cards.length > 0 && value.length >= 3;
  const clippedCards = cards.slice(0, 6);
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setShowResults(true)}
            placeholder="Search cards..."
            className="pr-10 pl-10"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenFullSearch}
          className="shrink-0"
          title="Open full search"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Search results dropdown */}
      {showResults && hasResults && (
        <div className="bg-accent absolute top-full right-0 left-0 z-50 mt-1 flex max-h-67 flex-col gap-1 rounded-md border p-1 shadow-lg">
          {clippedCards.slice(0, 10).map((card) => (
            <CardRow
              key={card.id}
              card={toDisplayCard(card)}
              variant="search"
              onAction={handleAddCard}
              className="border-primary border"
            />
          ))}
        </div>
      )}

      {/* Loading state */}
      {showResults && isLoading && value.length >= 3 && (
        <div className="bg-accent text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border p-3 text-center text-sm shadow-lg">
          Searching...
        </div>
      )}

      {/* No results */}
      {showResults && !isLoading && value.length >= 3 && cards.length === 0 && (
        <div className="bg-foreground text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border p-3 text-center text-sm shadow-lg">
          No cards found
        </div>
      )}
    </div>
  );
}
