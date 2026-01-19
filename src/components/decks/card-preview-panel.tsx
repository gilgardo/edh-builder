'use client';

import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { PreviewableCard } from '@/types/cards';
import { getDisplayCardImageUrl } from '@/types/cards';
import { cn } from '@/lib/utils';

interface CardPreviewPanelProps {
  card: PreviewableCard | null;
  fallbackCard?: PreviewableCard | null;
  className?: string;
}

export function CardPreviewPanel({ card, fallbackCard, className }: CardPreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Use the hovered card, or fall back to the fallback card (e.g., commander)
  const displayCard = card ?? fallbackCard;
  const imageUrl = getDisplayCardImageUrl(displayCard, 'large');

  // Reset loading state when card changes
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Card Image */}
      <div className="relative aspect-[488/680] w-full overflow-hidden rounded-lg bg-muted">
        {displayCard && imageUrl && !hasError ? (
          <>
            {isLoading && (
              <Skeleton className="absolute inset-0 rounded-lg" />
            )}
            <Image
              key={imageUrl}
              src={imageUrl}
              alt={displayCard.name}
              fill
              className={cn(
                'object-contain transition-opacity duration-200',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageOff className="h-12 w-12 mb-2" />
            <span className="text-sm">
              {displayCard ? 'Image unavailable' : 'Hover a card to preview'}
            </span>
          </div>
        )}
      </div>

      {/* Card Name (optional, shown below image) */}
      {displayCard && (
        <div className="mt-3 text-center">
          <p className="font-medium text-sm truncate">{displayCard.name}</p>
        </div>
      )}
    </div>
  );
}
