'use client';

import { Layers, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { ManaCost } from '@/components/cards/mana-cost';
import { CardTypeIcon, groupNameToCardType } from '@/components/cards/card-type-icon';
import { Commander, DeckCard, DisplayCard, PreviewableCard } from '@/types/cards';
import { CardRow } from '../cards/card-row';
import { cn } from '@/lib/utils';
import type { CardCategory } from '@/schemas/deck.schema';

interface DeckCardListProps {
  commander: Commander | null;
  cardGroups: Record<string, DeckCard[]>;
  consideringCards?: DeckCard[];
  totalCards: number;
  colorIdentity: string[];
  onRemoveCard: (cardId: string) => void;
  onChangePrinting?: (card: DisplayCard) => void;
  onChangeQuantity?: (card: DisplayCard, quantity: number) => void;
  onMoveToCategory?: (card: DisplayCard, category: CardCategory) => void;
  isRemoving: boolean;
  isUpdating?: boolean;
  showHeader?: boolean;
  onCardHover?: (card: PreviewableCard | null) => void;
  columns?: 1 | 2 | 3 | 4;
}

export function DeckCardList({
  commander,
  cardGroups,
  consideringCards = [],
  totalCards,
  colorIdentity,
  onRemoveCard,
  onChangePrinting,
  onChangeQuantity,
  onMoveToCategory,
  isRemoving,
  isUpdating = false,
  showHeader = true,
  onCardHover,
  columns = 1,
}: DeckCardListProps) {
  const handleCardHover = (card: DisplayCard | null) => {
    onCardHover?.(card);
  };

  const handleCommanderHover = (isHovering: boolean) => {
    if (isHovering && commander) {
      onCardHover?.(commander);
    } else {
      onCardHover?.(null);
    }
  };

  const columnClass = {
    1: '',
    2: 'sm:columns-2',
    3: 'sm:columns-2 lg:columns-3',
    4: 'sm:columns-2 lg:columns-3 xl:columns-4',
  }[columns];

  const isPending = isRemoving || isUpdating;

  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Layers className="text-muted-foreground h-5 w-5" />
            <span className="font-medium">Deck List</span>
            <Badge variant="secondary">{totalCards}/100</Badge>
          </div>
          <ColorIdentityBadges colors={colorIdentity} size="sm" />
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">
        {/* Commander */}
        {commander && (
          <div
            className={cn(
              'commander-box mb-4 rounded-xl p-4 cursor-pointer',
              'transition-all duration-200',
              'hover:shadow-depth-2'
            )}
            onMouseEnter={() => handleCommanderHover(true)}
            onMouseLeave={() => handleCommanderHover(false)}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                Commander
              </span>
            </div>
            <div className="flex items-center gap-2">
              {commander.manaCost && <ManaCost cost={commander.manaCost} size="sm" />}
              <span className="font-semibold text-sm">{commander.name}</span>
            </div>
          </div>
        )}

        {/* Card Groups in Columns */}
        <div className={cn('gap-4', columnClass)}>
          {Object.entries(cardGroups).map(([type, cards]) => {
            const cardType = groupNameToCardType(type);
            return (
            <div key={type} className="break-inside-avoid mb-4">
              {/* Group Header */}
              <div className="card-group-header mb-0 flex items-center justify-between rounded-t-lg">
                <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  {cardType && <CardTypeIcon type={cardType} size="sm" />}
                  {type}
                </h3>
                <Badge variant="outline" className="h-5 text-[10px] bg-background/50">
                  {cards.reduce((acc, c) => acc + c.quantity, 0)}
                </Badge>
              </div>
              {/* Card List Container */}
              <div className="card-group space-y-0.5 rounded-b-lg rounded-t-none border-t-0 p-1.5">
                {cards.map((deckCard) => (
                  <CardRow
                    key={deckCard.card.id}
                    card={deckCard.card}
                    quantity={deckCard.quantity}
                    category={deckCard.category as CardCategory}
                    variant="deck"
                    onAction={onRemoveCard}
                    onHover={handleCardHover}
                    onChangePrinting={onChangePrinting}
                    onChangeQuantity={onChangeQuantity}
                    onMoveToCategory={onMoveToCategory}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          );
          })}
        </div>

        {/* Considering Section */}
        {consideringCards.length > 0 && (
          <div className="considering-section mt-6 rounded-xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <h3 className="text-sm font-semibold">Considering</h3>
              <Badge variant="outline" className="h-5 text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400">
                {consideringCards.reduce((acc, c) => acc + c.quantity, 0)}
              </Badge>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Cards you&apos;re thinking about adding. Not counted in deck total.
            </p>
            <div className="space-y-0.5 rounded-lg bg-background/50 p-1.5">
              {consideringCards.map((deckCard) => (
                <CardRow
                  key={deckCard.card.id}
                  card={deckCard.card}
                  quantity={deckCard.quantity}
                  category="CONSIDERING"
                  variant="deck"
                  onAction={onRemoveCard}
                  onHover={handleCardHover}
                  onChangePrinting={onChangePrinting}
                  onChangeQuantity={onChangeQuantity}
                  onMoveToCategory={onMoveToCategory}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}

        {Object.keys(cardGroups).length === 0 && !commander && consideringCards.length === 0 && (
          <div className="py-12 text-center">
            <Layers className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 font-semibold">No cards yet</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Search for cards to add them to your deck
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
