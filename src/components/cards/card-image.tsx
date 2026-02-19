'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScryfallCard } from '@/types/scryfall.types';

interface CardImageProps {
  card: ScryfallCard;
  size?: 'small' | 'normal' | 'large';
  className?: string;
  priority?: boolean;
}

// MTG card aspect ratio is 488:680 (width:height)
const sizeMap = {
  small: { width: 146, height: 204 },
  normal: { width: 244, height: 340 },
  large: { width: 336, height: 468 },
};

export function CardImage({ card, size = 'normal', className, priority = false }: CardImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const dimensions = sizeMap[size];
  // Route through the caching API so images are stored in R2 on first load.
  // The endpoint redirects to the R2 URL (or Scryfall fallback); browsers follow
  // 302 redirects natively, so we use a plain <img> instead of next/image.
  const imageUrl = `/api/images/${card.id}?size=${size}`;

  // Small size uses fixed dimensions (used in flex layouts)
  // Normal/large use responsive width (used in grids)
  const isFixedSize = size === 'small';

  if (hasError) {
    return (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex items-center justify-center rounded-lg aspect-[488/680]',
          isFixedSize ? 'shrink-0' : 'w-full',
          className
        )}
        style={isFixedSize ? { width: dimensions.width } : undefined}
      >
        <span className="text-sm text-center px-2">{card.name}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative aspect-[488/680]',
        isFixedSize ? 'shrink-0' : 'w-full',
        className
      )}
      style={isFixedSize ? { width: dimensions.width } : undefined}
    >
      {isLoading && <Skeleton className="absolute inset-0 rounded-lg" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={card.name}
        width={dimensions.width}
        height={dimensions.height}
        loading={priority ? 'eager' : 'lazy'}
        className={cn(
          'rounded-lg transition-opacity duration-300 w-full h-full object-cover',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
