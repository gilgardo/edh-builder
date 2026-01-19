'use client';

import { useRef, useCallback, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { Search, X, Plus, Eye, ChevronRight } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ManaCost } from './mana-cost';
import type { PreviewableCard } from '@/types/cards';
import type { ScryfallCard } from '@/types/scryfall.types';

// Deck search result type
export type DeckSearchResult = {
  id: string;
  name: string;
  format: string;
  colorIdentity: string[];
  user: { name: string | null };
  commander?: { name: string } | null;
};

interface CardSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onCardClick?: (card: ScryfallCard) => void;
  onCardHover?: (card: PreviewableCard | null) => void;
  onOpenFullSearch?: () => void;
  onClear?: () => void;
  cards?: ScryfallCard[];
  isLoading?: boolean;
  isAdding?: boolean;
  placeholder?: string;
  maxResults?: number;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  /** ID for the input element (useful for keyboard shortcuts) */
  inputId?: string;
  /** Show deck results alongside cards */
  showDecks?: boolean;
  decks?: DeckSearchResult[];
  isDecksLoading?: boolean;
  maxDeckResults?: number;
  /** Display mode: 'add' shows plus button, 'navigate' shows chevron */
  cardActionMode?: 'add' | 'navigate';
}

export function CardSearchInput({
  value,
  onChange,
  onCardClick,
  onCardHover,
  onOpenFullSearch,
  onClear,
  cards = [],
  isLoading,
  isAdding,
  placeholder = 'Search cards to add...',
  maxResults = 10,
  className,
  inputClassName,
  dropdownClassName,
  inputId,
  showDecks = false,
  decks = [],
  isDecksLoading = false,
  maxDeckResults = 4,
  cardActionMode = 'add',
}: CardSearchInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleCardClick = useCallback(
    (card: ScryfallCard) => {
      onCardClick?.(card);
    },
    [onCardClick]
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

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if the new focus target is within our container
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
  }, []);

  const hasCardResults = cards.length > 0 && value.length >= 3;
  const hasDeckResults = showDecks && decks.length > 0 && value.length >= 3;
  const hasAnyResults = hasCardResults || hasDeckResults;
  const anyLoading = isLoading || (showDecks && isDecksLoading);
  const showDropdown = isFocused && value.length >= 3;
  const displayCards = cards.slice(0, maxResults);
  const displayDecks = decks.slice(0, maxDeckResults);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onBlur={handleBlur}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={cn('pr-10 pl-10', inputClassName)}
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
        {onOpenFullSearch && (
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenFullSearch}
            className="shrink-0"
            title="Open full search"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search results dropdown */}
      {showDropdown && hasAnyResults && (
        <div className={cn(
          'bg-card absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-auto rounded-md border-2 border-border shadow-lg',
          dropdownClassName
        )}>
          {/* Card results */}
          {hasCardResults && (
            <div className="p-1">
              {showDecks && (
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  Cards
                </div>
              )}
              {displayCards.map((card) => (
                <CardResultRow
                  key={card.id}
                  card={card}
                  actionMode={cardActionMode}
                  isAdding={isAdding}
                  onMouseEnter={() => handleCardMouseEnter(card)}
                  onMouseLeave={handleCardMouseLeave}
                  onClick={() => handleCardClick(card)}
                />
              ))}
            </div>
          )}

          {/* Deck results */}
          {hasDeckResults && (
            <div className={cn('p-1', hasCardResults && 'border-t border-border')}>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                Decks
              </div>
              {displayDecks.map((deck) => (
                <DeckResultRow key={deck.id} deck={deck} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {showDropdown && anyLoading && !hasAnyResults && (
        <div className={cn(
          'bg-card text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border-2 border-border p-3 text-center text-sm shadow-lg',
          dropdownClassName
        )}>
          Searching...
        </div>
      )}

      {/* No results */}
      {showDropdown && !anyLoading && !hasAnyResults && (
        <div className={cn(
          'bg-card text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border-2 border-border p-3 text-center text-sm shadow-lg',
          dropdownClassName
        )}>
          No results found
        </div>
      )}
    </div>
  );
}

// Card result row component
function CardResultRow({
  card,
  actionMode,
  isAdding,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  card: ScryfallCard;
  actionMode: 'add' | 'navigate';
  isAdding?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="hover:bg-muted group flex items-center justify-between gap-2 px-2 py-1.5 cursor-pointer transition-colors rounded-md"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      tabIndex={0}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {card.mana_cost && <ManaCost cost={card.mana_cost} size="sm" />}
        <span className="truncate text-sm font-medium">{card.name}</span>
      </div>
      {actionMode === 'add' ? (
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-primary/10 h-7 w-7 shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
          disabled={isAdding}
        >
          <Plus className="h-4 w-4" />
        </Button>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

// Deck result row component
function DeckResultRow({ deck }: { deck: DeckSearchResult }) {
  return (
    <Link
      href={`/decks/${deck.id}` as Route}
      className="hover:bg-muted group flex items-center justify-between rounded-md px-2 py-1.5"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{deck.name}</span>
        <span className="text-xs text-muted-foreground">
          {deck.commander?.name ? `${deck.commander.name} • ` : ''}
          {deck.user.name ?? 'Anonymous'}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
