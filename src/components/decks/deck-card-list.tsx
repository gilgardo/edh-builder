'use client';

import Image from 'next/image';
import { Layers, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { ManaCost } from '@/components/cards/mana-cost';

interface DeckCard {
  category: string;
  quantity: number;
  card: {
    id: string;
    typeLine: string;
    name: string;
    manaCost: string | null;
    cmc: number;
    imageUris: unknown;
  };
}

interface Commander {
  name: string;
  typeLine: string;
  manaCost: string | null;
  imageUris: unknown;
}

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
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Deck List</span>
            <Badge variant="secondary">{totalCards}/100</Badge>
          </div>
          <ColorIdentityBadges colors={colorIdentity} size="sm" />
        </div>
      )}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Commander */}
        {commander && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Commander</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              {commanderImageUris?.normal && (
                <div className="relative aspect-[488/680] w-20 overflow-hidden rounded">
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
                <p className="text-xs text-muted-foreground">{commander.typeLine}</p>
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">{type}</h3>
              <Badge variant="outline" className="text-xs">
                {cards.reduce((acc, c) => acc + c.quantity, 0)}
              </Badge>
            </div>
            <div className="space-y-1">
              {cards.map((deckCard) => (
                <div
                  key={deckCard.card.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground w-5">{deckCard.quantity}x</span>
                    <span className="text-sm truncate">{deckCard.card.name}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {deckCard.card.manaCost && (
                      <ManaCost cost={deckCard.card.manaCost} size="sm" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onRemoveCard(deckCard.card.id)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(cardGroups).length === 0 && (
          <div className="py-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No cards yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Search for cards to add them to your deck
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
