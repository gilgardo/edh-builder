'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ScryfallCard } from '@/types/scryfall.types';
import { getCardImageUrl, getCardManaCost } from '@/services/scryfall';
import { ManaCost } from './mana-cost';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CardPreviewProps {
  card: ScryfallCard;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function CardPreview({ card, children, side = 'right' }: CardPreviewProps) {
  const imageUrl = getCardImageUrl(card, 'normal');
  const manaCost = getCardManaCost(card);

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        className="w-auto p-0 bg-transparent border-none shadow-xl"
        sideOffset={10}
      >
        <div className="flex flex-col">
          <Image
            src={imageUrl}
            alt={card.name}
            width={244}
            height={340}
            className="rounded-lg"
            priority
          />
          <div className="mt-2 px-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground truncate">{card.name}</span>
              {manaCost && <ManaCost cost={manaCost} size="sm" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{card.type_line}</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface CardPreviewHoverProps {
  card: ScryfallCard;
  className?: string;
}

export function CardPreviewHover({ card, className }: CardPreviewHoverProps) {
  const [isHovering, setIsHovering] = useState(false);
  const imageUrl = getCardImageUrl(card, 'normal');
  const manaCost = getCardManaCost(card);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="truncate">{card.name}</span>
        {manaCost && <ManaCost cost={manaCost} size="sm" />}
      </div>
      {isHovering && (
        <div className="absolute z-50 left-full top-0 ml-2 pointer-events-none">
          <Image
            src={imageUrl}
            alt={card.name}
            width={244}
            height={340}
            className="rounded-lg shadow-xl"
            priority
          />
        </div>
      )}
    </div>
  );
}
