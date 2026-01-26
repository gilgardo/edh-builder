'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Constants for tilt effect
const TILT_MAX_DEGREES = 8;
const CENTER_OFFSET = 0.5;

type Card3DVariant = 'preview' | 'grid' | 'compact';

interface Card3DProps {
  imageUrl: string;
  alt: string;
  variant?: Card3DVariant;
  className?: string;
  /** Enable 3D tilt effect on hover */
  enableTilt?: boolean;
  /** Enable pulse animation on click */
  enablePulse?: boolean;
  /** Called when image finishes loading */
  onLoad?: () => void;
  /** Called on image error */
  onError?: () => void;
  /** Called on click */
  onClick?: () => void;
  /** Show loading skeleton */
  showSkeleton?: boolean;
  /** Priority loading for LCP */
  priority?: boolean;
}

const variantStyles: Record<Card3DVariant, string> = {
  preview: 'shadow-depth-4 ring-1 ring-black/5 dark:ring-white/5',
  grid: 'shadow-depth-2 hover:shadow-depth-3',
  compact: 'shadow-md hover:shadow-lg',
};

const variantSizes: Record<Card3DVariant, string> = {
  preview: '(max-width: 768px) 100vw, 300px',
  grid: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw',
  compact: '200px',
};

export function Card3D({
  imageUrl,
  alt,
  variant = 'grid',
  className,
  enableTilt = true,
  enablePulse = false,
  onLoad,
  onError,
  onClick,
  showSkeleton = true,
  priority = false,
}: Card3DProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
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

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // 3D tilt effect on mouse move (RAF-throttled for performance)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableTilt || rafRef.current !== undefined) return;

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
    },
    [enableTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleClick = useCallback(() => {
    if (enablePulse) {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 200);
    }
    onClick?.();
  }, [enablePulse, onClick]);

  return (
    <div className={cn('perspective-container', className)}>
      <div
        ref={cardRef}
        className={cn(
          'relative aspect-[488/680] w-full overflow-hidden rounded-xl',
          'transition-all duration-200 ease-out',
          variantStyles[variant],
          isPulsing && 'scale-95',
          onClick && 'cursor-pointer'
        )}
        style={{
          transform: enableTilt ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` : undefined,
          transformStyle: enableTilt ? 'preserve-3d' : undefined,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Loading skeleton */}
        {showSkeleton && isLoading && <Skeleton className="absolute inset-0 rounded-xl" />}

        {/* Card image */}
        {!hasError && (
          <>
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className={cn(
                'object-contain transition-all duration-300',
                isLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority={priority}
              sizes={variantSizes[variant]}
            />

            {/* Shine overlay for 3D effect */}
            {enableTilt && !isLoading && (
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
            )}
          </>
        )}

        {/* Error state */}
        {hasError && (
          <div className="bg-muted text-muted-foreground absolute inset-0 flex items-center justify-center rounded-xl">
            <span className="px-2 text-center text-sm">{alt}</span>
          </div>
        )}

        {/* Pulse overlay */}
        {isPulsing && (
          <div className="bg-primary/30 animate-ping-once absolute inset-0 rounded-xl" />
        )}
      </div>
    </div>
  );
}
