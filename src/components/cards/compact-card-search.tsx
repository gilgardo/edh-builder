'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ManaCost } from './mana-cost';
import type { PreviewableCard } from '@/types/cards';
import type { ScryfallCard } from '@/types/scryfall.types';

interface CompactCardSearchProps {
  value: string;
  onChange: (value: string) => void;
  onAddCard: (card: ScryfallCard) => void;
  onCardHover?: (card: PreviewableCard | null) => void;
  cards?: ScryfallCard[];
  isLoading?: boolean;
  isAdding?: boolean;
  className?: string;
}

export function CompactCardSearch({
  value,
  onChange,
  onAddCard,
  onCardHover,
  cards = [],
  isLoading,
  isAdding,
  className,
}: CompactCardSearchProps) {
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
    (card: ScryfallCard) => {
      onAddCard(card);
      // Keep dropdown open so user can add more
    },
    [onAddCard]
  );

  const handleCardMouseEnter = useCallback(
    (card: ScryfallCard) => {
      onCardHover?.({
        name: card.name,
        imageUris: card.image_uris ?? card.card_faces?.[0]?.image_uris ?? null,
      });
    },
    [onCardHover]
  );

  const handleCardMouseLeave = useCallback(() => {
    onCardHover?.(null);
  }, [onCardHover]);

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
  const displayCards = cards.slice(0, 10);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          placeholder="Search cards to add..."
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

      {/* Search results dropdown */}
      {showResults && hasResults && (
        <div className="bg-popover absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-auto rounded-md border shadow-lg">
          {displayCards.map((card) => (
            <div
              key={card.id}
              className="hover:bg-muted flex items-center justify-between gap-2 px-3 py-2 cursor-pointer"
              onMouseEnter={() => handleCardMouseEnter(card)}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleAddCard(card)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {card.mana_cost && <ManaCost cost={card.mana_cost} size="sm" />}
                <span className="truncate text-sm font-medium">{card.name}</span>
                <span className="text-muted-foreground truncate text-xs">{card.type_line}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCard(card);
                }}
                disabled={isAdding}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {showResults && isLoading && value.length >= 3 && (
        <div className="bg-popover text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border p-3 text-center text-sm shadow-lg">
          Searching...
        </div>
      )}

      {/* No results */}
      {showResults && !isLoading && value.length >= 3 && cards.length === 0 && (
        <div className="bg-popover text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border p-3 text-center text-sm shadow-lg">
          No cards found
        </div>
      )}
    </div>
  );
}
