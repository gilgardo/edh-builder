'use client';

import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { ManaCost } from '@/components/cards/mana-cost';
import { Commander, DeckCard, DisplayCard, PreviewableCard } from '@/types/cards';
import { CardRow } from '../cards/card-row';
import { cn } from '@/lib/utils';

interface DeckCardListProps {
  commander: Commander | null;
  cardGroups: Record<string, DeckCard[]>;
  totalCards: number;
  colorIdentity: string[];
  onRemoveCard: (cardId: string) => void;
  isRemoving: boolean;
  showHeader?: boolean;
  onCardHover?: (card: PreviewableCard | null) => void;
  columns?: 1 | 2 | 3 | 4;
}

export function DeckCardList({
  commander,
  cardGroups,
  totalCards,
  colorIdentity,
  onRemoveCard,
  isRemoving,
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
              'mb-4 rounded-lg border p-3 cursor-pointer transition-colors',
              'hover:bg-muted/50'
            )}
            onMouseEnter={() => handleCommanderHover(true)}
            onMouseLeave={() => handleCommanderHover(false)}
          >
            <div className="text-xs font-medium text-muted-foreground mb-1">Commander</div>
            <div className="flex items-center gap-2">
              {commander.manaCost && <ManaCost cost={commander.manaCost} size="sm" />}
              <span className="font-medium text-sm">{commander.name}</span>
            </div>
          </div>
        )}

        {/* Card Groups in Columns */}
        <div className={cn('gap-4', columnClass)}>
          {Object.entries(cardGroups).map(([type, cards]) => (
            <div key={type} className="break-inside-avoid mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{type}</h3>
                <Badge variant="outline" className="text-xs h-5">
                  {cards.reduce((acc, c) => acc + c.quantity, 0)}
                </Badge>
              </div>
              <div className="space-y-0.5 rounded-lg border bg-card p-1">
                {cards.map((deckCard) => (
                  <CardRow
                    key={deckCard.card.id}
                    card={deckCard.card}
                    quantity={deckCard.quantity}
                    variant="deck"
                    onAction={onRemoveCard}
                    onHover={handleCardHover}
                    isPending={isRemoving}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(cardGroups).length === 0 && !commander && (
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
