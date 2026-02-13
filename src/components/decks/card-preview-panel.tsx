'use client';

import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { PreviewableCard } from '@/types/cards';
import { getCardImageUrl } from '@/lib/card-image-url';
import { cn } from '@/lib/utils';

// Constants for tilt effect
const TILT_MAX_DEGREES = 5;
const CENTER_OFFSET = 0.5;

interface CardPreviewPanelProps {
  card: PreviewableCard | null;
  fallbackCard?: PreviewableCard | null;
  className?: string;
}

export function CardPreviewPanel({ card, fallbackCard, className }: CardPreviewPanelProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const displayCard = card ?? fallbackCard;
  const imageUrl = getCardImageUrl(displayCard, 'large');
  const isHoveredCard = card !== null;

  // Derive loading and error states from comparing current URL with loaded/error URLs
  const isLoading = useMemo(() => {
    if (!imageUrl) return false;
    return loadedUrl !== imageUrl && errorUrl !== imageUrl;
  }, [imageUrl, loadedUrl, errorUrl]);

  const hasError = useMemo(() => {
    if (!imageUrl) return false;
    return errorUrl === imageUrl;
  }, [imageUrl, errorUrl]);

  const handleImageLoad = () => {
    if (imageUrl) {
      setLoadedUrl(imageUrl);
      setErrorUrl(null);
    }
  };

  const handleImageError = () => {
    if (imageUrl) {
      setErrorUrl(imageUrl);
    }
  };

  // 3D tilt effect on mouse move (RAF-throttled for performance)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current !== undefined) return; // Skip if a frame is pending

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
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Panel Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isHoveredCard ? 'Preview' : 'Commander'}
        </span>
        {isHoveredCard && (
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>

      {/* 3D Card Container */}
      <div className="perspective-container">
        <div
          ref={cardRef}
          className={cn(
            'relative aspect-[488/680] w-full overflow-hidden rounded-xl',
            'shadow-depth-4 transition-all duration-300 ease-out',
            'ring-1 ring-black/5 dark:ring-white/5'
          )}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Ambient glow behind card */}
          <div
            className={cn(
              'absolute -inset-4 -z-10 rounded-2xl blur-2xl transition-opacity duration-500',
              isHoveredCard ? 'opacity-60' : 'opacity-30',
              'bg-gradient-to-br from-primary/20 via-transparent to-accent/20'
            )}
          />

          {displayCard && imageUrl && !hasError ? (
            <>
              {isLoading && (
                <Skeleton className="absolute inset-0 rounded-xl" />
              )}
              <Image
                key={imageUrl}
                src={imageUrl}
                alt={displayCard.name}
                fill
                className={cn(
                  'object-contain transition-all duration-300',
                  isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
                priority
                sizes="(max-width: 768px) 100vw, 300px"
              />

              {/* Shine overlay */}
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background: `linear-gradient(
                    ${105 + tilt.y * 2}deg,
                    transparent 40%,
                    rgba(255, 255, 255, 0.1) 45%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0.1) 55%,
                    transparent 60%
                  )`,
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ImageOff className="mb-2 h-12 w-12" />
              <span className="text-sm">
                {displayCard ? 'Image unavailable' : 'Hover a card to preview'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Name */}
      {displayCard && (
        <div className="mt-4 text-center">
          <p className="truncate text-sm font-semibold">{displayCard.name}</p>
        </div>
      )}
    </div>
  );
}
