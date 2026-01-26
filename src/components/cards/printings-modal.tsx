'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCardPrintings } from '@/hooks/use-card-printings';
import type { ScryfallCard } from '@/types/scryfall.types';
import { getCardImageUrl } from '@/services/scryfall';
import { cn } from '@/lib/utils';

// Constants for tilt effect
const TILT_MAX_DEGREES = 12;
const CENTER_OFFSET = 0.5;

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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isPulsing, setIsPulsing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // 3D tilt effect on mouse move (RAF-throttled)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (rafRef.current !== undefined) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) {
        rafRef.current = undefined;
        return;
      }
      const rect = cardRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      setTilt({
        x: (y - CENTER_OFFSET) * TILT_MAX_DEGREES * 2,
        y: (x - CENTER_OFFSET) * -TILT_MAX_DEGREES * 2,
      });
      rafRef.current = undefined;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleClick = () => {
    setIsPulsing(true);
    setTimeout(() => {
      setIsPulsing(false);
      onSelect(card);
    }, 150);
  };

  return (
    <div className="perspective-container">
      <button
        ref={cardRef}
        type="button"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'group relative w-full overflow-hidden rounded-xl transition-all duration-200',
          // 3D shadow effect
          'shadow-depth-2 hover:shadow-depth-4',
          // Border states
          isSelected && 'ring-primary ring-2 ring-offset-2 ring-offset-background',
          isCurrent && !isSelected && 'ring-2 ring-green-500 ring-offset-2 ring-offset-background',
          // Pulse animation
          isPulsing && 'scale-95'
        )}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)${isPulsing ? ' scale(0.95)' : ''}`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card Image */}
        <div className="bg-muted relative aspect-[488/680]">
          {isLoading && (
            <div className="bg-muted absolute inset-0 animate-pulse rounded-xl" />
          )}
          <Image
            src={imageUrl}
            alt={`${card.name} - ${card.set_name}`}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            onLoad={() => setIsLoading(false)}
          />

          {/* Shine overlay for 3D effect */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
            style={{
              background: `linear-gradient(
                ${105 + tilt.y * 2}deg,
                transparent 40%,
                rgba(255, 255, 255, 0.15) 45%,
                rgba(255, 255, 255, 0.25) 50%,
                rgba(255, 255, 255, 0.15) 55%,
                transparent 60%
              )`,
              opacity: Math.abs(tilt.x) + Math.abs(tilt.y) > 0 ? 1 : 0,
            }}
          />
        </div>

        {/* Card Info Overlay with 3D badges */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2.5 pt-8">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{card.set_name}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                {card.set} · {card.rarity.charAt(0).toUpperCase()}
              </p>
            </div>
            {price && (
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 text-xs font-bold',
                  // 3D badge effect
                  'bg-gradient-to-b from-white/95 to-white/80',
                  'text-gray-800 shadow-sm',
                  'border border-white/20',
                  // Inner shadow for depth
                  'ring-1 ring-inset ring-black/5'
                )}
                style={{
                  textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                ${price}
              </span>
            )}
          </div>
        </div>

        {/* Current indicator badge with 3D effect */}
        {isCurrent && (
          <span
            className={cn(
              'absolute top-2 right-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold',
              'bg-gradient-to-b from-green-500 to-green-600',
              'text-white shadow-lg',
              'border border-green-400/50'
            )}
            style={{
              boxShadow: '0 2px 8px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Check className="h-3 w-3" />
            Current
          </span>
        )}

        {/* Pulse overlay on click */}
        {isPulsing && (
          <div className="bg-primary/30 animate-ping-once absolute inset-0 rounded-xl" />
        )}
      </button>
    </div>
  );
}
