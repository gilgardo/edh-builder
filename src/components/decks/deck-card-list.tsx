'use client';

import Image from 'next/image';
import { Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { ManaCost } from '@/components/cards/mana-cost';
import { Commander, DeckCard } from '@/types/cards';
import { CardRow } from '../cards/card-row';

interface DeckCardListProps {
  commander: Commander | null;
  cardGroups: Record<string, DeckCard[]>;
  totalCards: number;
  colorIdentity: string[];
  onRemoveCard: (cardId: string) => void;
  isRemoving: boolean;
  showHeader?: boolean;
}

export function DeckCardList({
  commander,
  cardGroups,
  totalCards,
  colorIdentity,
  onRemoveCard,
  isRemoving,
  showHeader = true,
}: DeckCardListProps) {
  const commanderImageUris = commander?.imageUris as { normal?: string } | null;

  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Layers className="text-muted-foreground h-5 w-5" />
            <span className="font-medium">Deck List</span>
            <Badge variant="secondary">{totalCards}/100</Badge>
          </div>
          <ColorIdentityBadges colors={colorIdentity} size="sm" />
        </div>
      )}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Commander */}
        {commander && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Commander</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              {commanderImageUris?.normal && (
                <div className="relative aspect-488/680 w-20 overflow-hidden rounded">
                  <Image
                    src={commanderImageUris.normal}
                    alt={commander.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{commander.name}</p>
                <p className="text-muted-foreground text-xs">{commander.typeLine}</p>
                {commander.manaCost && (
                  <div className="mt-1">
                    <ManaCost cost={commander.manaCost} size="sm" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Groups */}
        {Object.entries(cardGroups).map(([type, cards]) => (
          <div key={type}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-medium">{type}</h3>
              <Badge variant="outline" className="text-xs">
                {cards.reduce((acc, c) => acc + c.quantity, 0)}
              </Badge>
            </div>
            <div className="space-y-1">
              {cards.map((deckCard) => (
                <CardRow
                  key={deckCard.card.id}
                  card={deckCard.card}
                  quantity={deckCard.quantity}
                  variant="deck"
                  onAction={onRemoveCard}
                  isPending={isRemoving}
                />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(cardGroups).length === 0 && (
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
