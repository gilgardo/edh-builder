'use client';

import { useRef, useCallback, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { Search, X, Plus, ChevronRight } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ManaCost } from './mana-cost';
import { ManaFilterPillsCompact } from './mana-filter-pills';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  /** Color filter state */
  selectedColors?: string[];
  onColorToggle?: (colors: string[]) => void;
  /** Type filter state */
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  /** Show inline filters */
  showFilters?: boolean;
  /** Controlled dropdown state - when true, dropdown stays open */
  keepDropdownOpen?: boolean;
}

export function CardSearchInput({
  value,
  onChange,
  onCardClick,
  onCardHover,
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
  selectedColors = [],
  onColorToggle,
  selectedType = '',
  onTypeChange,
  showFilters = false,
  keepDropdownOpen = false,
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
      // Only close dropdown if not in controlled "keep open" mode
      if (!keepDropdownOpen) {
        setIsFocused(false);
      }
      onCardClick?.(card);
    },
    [onCardClick, keepDropdownOpen]
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
  // Keep dropdown open if focused OR if parent wants it open (e.g., during mutation)
  const showDropdown = (isFocused || keepDropdownOpen) && value.length >= 3;
  const displayCards = cards.slice(0, maxResults);
  const displayDecks = decks.slice(0, maxDeckResults);

  return (
    <div ref={containerRef} className={cn('relative', className)} onBlur={handleBlur}>
      {/* Responsive layout: stack on mobile, row on md+ */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {/* Search input wrapper - contains dropdown positioning context */}
        <div className="relative w-full md:max-w-sm lg:max-w-md">
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

          {/* Search results dropdown - positioned under input */}
          {showDropdown && hasAnyResults && (
            <div
              className={cn(
                'bg-card border-border absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-auto rounded-md border-2 shadow-lg',
                dropdownClassName
              )}
            >
              {/* Card results */}
              {hasCardResults && (
                <div className="p-1">
                  {showDecks && (
                    <div className="text-muted-foreground px-2 py-1 text-xs font-semibold uppercase">
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
                <div className={cn('p-1', hasCardResults && 'border-border border-t')}>
                  <div className="text-muted-foreground px-2 py-1 text-xs font-semibold uppercase">
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
            <div
              className={cn(
                'bg-card text-muted-foreground border-border absolute top-full right-0 left-0 z-50 mt-1 rounded-md border-2 p-3 text-center text-sm shadow-lg',
                dropdownClassName
              )}
            >
              Searching...
            </div>
          )}

          {/* No results */}
          {showDropdown && !anyLoading && !hasAnyResults && (
            <div
              className={cn(
                'bg-card text-muted-foreground border-border absolute top-full right-0 left-0 z-50 mt-1 rounded-md border-2 p-3 text-center text-sm shadow-lg',
                dropdownClassName
              )}
            >
              No results found
            </div>
          )}
        </div>

        {/* Inline filters - visible when showFilters is true */}
        {showFilters && (
          <div className="flex items-center gap-3">
            {/* Mana color filters with proper SVG symbols */}
            {onColorToggle && (
              <ManaFilterPillsCompact selected={selectedColors} onChange={onColorToggle} />
            )}

            {/* Type filter dropdown */}
            {onTypeChange && (
              <Select value={selectedType} onValueChange={onTypeChange}>
                <SelectTrigger className="h-9 w-28 text-xs sm:w-32 sm:text-sm">
                  <SelectValue placeholder="Type" />
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Card result row component with pulse animation on click
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
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = () => {
    setIsPulsing(true);
    onClick();
    // Reset pulse state after animation completes
    setTimeout(() => setIsPulsing(false), 200);
  };

  return (
    <div
      className={cn(
        'hover:bg-muted group flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-all',
        isPulsing && 'scale-95 bg-primary/20'
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(e) => {
        e.preventDefault();
        handleClick();
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
          className={cn(
            'text-primary hover:bg-primary/10 h-7 w-7 shrink-0 transition-transform',
            isPulsing && 'scale-125'
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick();
          }}
          disabled={isAdding}
        >
          <Plus className="h-4 w-4" />
        </Button>
      ) : (
        <ChevronRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
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
        <span className="text-muted-foreground text-xs">
          {deck.commander?.name ? `${deck.commander.name} • ` : ''}
          {deck.user.name ?? 'Anonymous'}
        </span>
      </div>
      <ChevronRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
