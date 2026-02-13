'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Crown } from 'lucide-react';
import { ManaCost } from '@/components/cards/mana-cost';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCardImageUrl } from '@/lib/card-image-url';
import type { Commander } from '@/types/cards';

interface CommanderCardProps {
  commander: Commander;
  variant?: 'compact' | 'full';
  className?: string;
  onHover?: (isHovering: boolean) => void;
}

/**
 * Reusable commander card component with two variants:
 * - compact: Shows just the card image with name overlay
 * - full: Shows card image alongside text details (name, type, mana cost, oracle text)
 */
export function CommanderCard({
  commander,
  variant = 'full',
  className,
  onHover,
}: CommanderCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUrl = getCardImageUrl(commander, 'normal');

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'relative aspect-[488/680] w-full overflow-hidden rounded-xl',
          'cursor-pointer transition-all duration-200',
          'hover:shadow-depth-2 hover:scale-[1.02]',
          className
        )}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
        {isLoading && <Skeleton className="absolute inset-0" />}
        {imageUrl && !hasError ? (
          <Image
            src={imageUrl}
            alt={commander.name}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground text-center px-2">
              {commander.name}
            </span>
          </div>
        )}
        {/* Commander badge overlay */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground">
          <Crown className="h-3 w-3" />
          Commander
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-xl border bg-card',
        'transition-all duration-200',
        'hover:shadow-depth-1',
        className
      )}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Card Image */}
      <div className="relative aspect-[488/680] w-28 sm:w-32 shrink-0 overflow-hidden rounded-lg">
        {isLoading && <Skeleton className="absolute inset-0" />}
        {imageUrl && !hasError ? (
          <Image
            src={imageUrl}
            alt={commander.name}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground text-center px-1">
              {commander.name}
            </span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm sm:text-base leading-tight">
            {commander.name}
          </h3>
          {commander.manaCost && (
            <div className="shrink-0">
              <ManaCost cost={commander.manaCost} size="sm" />
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm mb-2">
          {commander.typeLine}
        </p>
        {commander.oracleText && (
          <p className="text-xs sm:text-sm whitespace-pre-line line-clamp-4 sm:line-clamp-6">
            {commander.oracleText}
          </p>
        )}
      </div>
    </div>
  );
}
