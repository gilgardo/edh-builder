'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCardPrintings } from '@/hooks/use-card-printings';
import type { ScryfallCard } from '@/types/scryfall.types';
import { getCardImageUrl } from '@/services/scryfall';
import { cn } from '@/lib/utils';

interface PrintingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  oracleId: string | null;
  currentScryfallId: string;
  onSelectPrinting: (card: ScryfallCard) => void;
}

export function PrintingsModal({
  open,
  onOpenChange,
  cardName,
  oracleId,
  currentScryfallId,
  onSelectPrinting,
}: PrintingsModalProps) {
  const { data, isLoading, error } = useCardPrintings(open ? oracleId : null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (card: ScryfallCard) => {
    setSelectedId(card.id);
    onSelectPrinting(card);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Switch Printing</DialogTitle>
          <DialogDescription>
            Select a different printing of{' '}
            <span className="text-primary font-bold">{cardName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-muted-foreground py-12 text-center">
              Failed to load printings. Please try again.
            </div>
          )}

          {data?.cards && data.cards.length > 0 && (
            <div className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 md:grid-cols-4">
              {data.cards.map((card) => (
                <PrintingCard
                  key={card.id}
                  card={card}
                  isSelected={selectedId === card.id}
                  isCurrent={currentScryfallId === card.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {data?.cards && data.cards.length === 0 && (
            <div className="text-muted-foreground py-12 text-center">No other printings found.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PrintingCardProps {
  card: ScryfallCard;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: (card: ScryfallCard) => void;
}

function PrintingCard({ card, isSelected, isCurrent, onSelect }: PrintingCardProps) {
  const imageUrl = getCardImageUrl(card, 'normal');
  const price = card.prices.usd ?? card.prices.usd_foil;

  return (
    <button
      type="button"
      onClick={() => onSelect(card)}
      className={cn(
        'group relative overflow-hidden rounded-lg border-2 transition-all',
        'hover:border-primary hover:shadow-lg',
        isSelected && 'border-primary ring-primary ring-2 ring-offset-2',
        isCurrent && !isSelected && 'border-green-500',
        !isSelected && !isCurrent && 'border-transparent'
      )}
    >
      {/* Card Image */}
      <div className="bg-muted relative aspect-488/680">
        <Image
          src={imageUrl}
          alt={`${card.name} - ${card.set_name}`}
          fill
          className="object-cover"
          sizes="(max-width: 200px) 50vw, (max-width: 768px) 33vw, 25vw"
        />
      </div>

      {/* Card Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/70 to-transparent p-2 pt-6">
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{card.set_name}</p>
            <p className="text-xs text-white/70 uppercase">
              {card.set} · {card.rarity.charAt(0).toUpperCase()}
            </p>
          </div>
          {price && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              ${price}
            </Badge>
          )}
        </div>
      </div>

      {/* Current indicator */}
      {isCurrent && <Badge className="bg-primary absolute top-2 right-2 text-white">Current</Badge>}
    </button>
  );
}
