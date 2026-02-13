'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ManaCost } from '@/components/cards/mana-cost';
import { getCardManaCost } from '@/services/scryfall';
import { getScryfallCardImageUrl } from '@/lib/card-image-url';
import type { ScryfallCard } from '@/types/scryfall.types';

interface CardPreviewDialogProps {
  card: ScryfallCard | null;
  open: boolean;
  onClose: () => void;
}

export function CardPreviewDialog({ card, open, onClose }: CardPreviewDialogProps) {
  if (!card) return null;

  const imageUrl = getScryfallCardImageUrl(card, 'normal');
  const manaCost = getCardManaCost(card);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-4">
        <DialogTitle className="sr-only">{card.name}</DialogTitle>
        <div className="flex flex-col items-center gap-4">
          <Image
            src={imageUrl}
            alt={card.name}
            width={300}
            height={418}
            className="rounded-lg shadow-lg"
            priority
          />
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{card.name}</h3>
              {manaCost && <ManaCost cost={manaCost} size="md" />}
            </div>
            <p className="text-muted-foreground text-sm">{card.type_line}</p>
            {card.oracle_text && (
              <p className="text-sm whitespace-pre-line">{card.oracle_text}</p>
            )}
            {(card.power || card.toughness) && (
              <p className="text-sm font-medium">
                {card.power}/{card.toughness}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
