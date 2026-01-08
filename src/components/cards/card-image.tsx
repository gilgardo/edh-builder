'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScryfallCard } from '@/types/scryfall.types';
import { getCardImageUrl } from '@/services/scryfall';

interface CardImageProps {
  card: ScryfallCard;
  size?: 'small' | 'normal' | 'large';
  className?: string;
  priority?: boolean;
}

const sizeMap = {
  small: { width: 146, height: 204 },
  normal: { width: 244, height: 340 },
  large: { width: 336, height: 468 },
};

export function CardImage({ card, size = 'normal', className, priority = false }: CardImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const dimensions = sizeMap[size];
  const imageUrl = getCardImageUrl(card, size);

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-muted text-muted-foreground',
          className
        )}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <span className="text-sm">{card.name}</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} style={{ width: dimensions.width, height: dimensions.height }}>
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded-lg" />
      )}
      <Image
        src={imageUrl}
        alt={card.name}
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          'rounded-lg transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        priority={priority}
      />
    </div>
  );
}
