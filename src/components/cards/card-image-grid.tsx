'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DisplayCard } from '@/types/cards';

/**
 * Generic deck card type that works with both Prisma and our DeckCard types
 */
interface DeckCardLike {
  cardId?: string;
  quantity: number;
  card: DisplayCard;
}

interface CardImageGridItemProps {
  card: DisplayCard;
  quantity?: number;
  onHover?: (card: DisplayCard | null) => void;
  className?: string;
}

/**
 * Single card image item with optional quantity badge
 */
function CardImageGridItem({ card, quantity, onHover, className }: CardImageGridItemProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUris = card.imageUris as {
    small?: string;
    normal?: string;
    large?: string;
  } | null;

  const imageUrl = imageUris?.normal ?? imageUris?.large;

  return (
    <div
      className={cn(
        'relative aspect-[488/680] overflow-hidden rounded-lg',
        'cursor-pointer transition-all duration-200',
        'hover:shadow-depth-2 hover:scale-[1.02] hover:z-10',
        className
      )}
      onMouseEnter={() => onHover?.(card)}
      onMouseLeave={() => onHover?.(null)}
    >
      {isLoading && <Skeleton className="absolute inset-0" />}
      {imageUrl && !hasError ? (
        <Image
          src={imageUrl}
          alt={card.name}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground text-center px-2">
            {card.name}
          </span>
        </div>
      )}
      {/* Quantity badge */}
      {quantity && quantity > 1 && (
        <Badge
          variant="secondary"
          className="absolute top-1 right-1 h-5 min-w-5 justify-center text-[10px] font-bold"
        >
          {quantity}x
        </Badge>
      )}
    </div>
  );
}

interface CardImageGridProps {
  cards: DeckCardLike[];
  onCardHover?: (card: DisplayCard | null) => void;
  className?: string;
}

/**
 * Responsive grid of card images
 */
export function CardImageGrid({ cards, onCardHover, className }: CardImageGridProps) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className
      )}
    >
      {cards.map((deckCard, index) => (
        <CardImageGridItem
          key={deckCard.cardId ?? deckCard.card.id ?? index}
          card={deckCard.card}
          quantity={deckCard.quantity}
          onHover={onCardHover}
        />
      ))}
    </div>
  );
}

interface GroupedCardImageGridProps {
  cardGroups: Record<string, DeckCardLike[]>;
  onCardHover?: (card: DisplayCard | null) => void;
  className?: string;
}

/**
 * Card image grid grouped by card type with section headers
 */
export function GroupedCardImageGrid({
  cardGroups,
  onCardHover,
  className,
}: GroupedCardImageGridProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(cardGroups).map(([type, cards]) => (
        <div key={type}>
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {type}
            </h3>
            <Badge variant="outline" className="text-xs">
              {cards.reduce((acc, c) => acc + c.quantity, 0)}
            </Badge>
          </div>
          {/* Grid */}
          <div
            className={cn(
              'grid gap-3 sm:gap-4',
              'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            )}
          >
            {cards.map((deckCard, index) => (
              <CardImageGridItem
                key={deckCard.cardId ?? deckCard.card.id ?? index}
                card={deckCard.card}
                quantity={deckCard.quantity}
                onHover={onCardHover}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
