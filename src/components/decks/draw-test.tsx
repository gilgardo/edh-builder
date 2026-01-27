'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Shuffle, Plus, RotateCcw } from 'lucide-react';

import { getCardImageUrl } from '@/services/scryfall';
import { cn } from '@/lib/utils';
import type { DeckCard } from '@/types/cards';
import { shuffleDeck } from '@/lib/deck-utils';
import { Button } from '../ui/button';

// Constants for tilt effect
const TILT_MAX_DEGREES = 12;
const CENTER_OFFSET = 0.5;
const INITIAL_HAND_SIZE = 7;

interface DrawtesterProps {
  mainDeck: DeckCard[] | undefined;
}

export function Drawtester({ mainDeck }: DrawtesterProps) {
  // Use a key to force re-shuffle when mainDeck reference changes
  const [shuffleKey, setShuffleKey] = useState(0);
  const [handSize, setHandSize] = useState(INITIAL_HAND_SIZE);

  // Memoize shuffled deck - only re-shuffles when shuffleKey changes
  const shuffledDeck = useMemo(() => {
    if (!mainDeck || mainDeck.length === 0) return [];
    // shuffleKey in dependency ensures new shuffle on button click
    return shuffleDeck(mainDeck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainDeck, shuffleKey]);

  const hand = useMemo(() => shuffledDeck.slice(0, handSize), [shuffledDeck, handSize]);
  const remainingCards = shuffledDeck.length - handSize;
  const canDraw = remainingCards > 0;

  const handleShuffle = useCallback(() => {
    setShuffleKey((k) => k + 1);
    setHandSize(INITIAL_HAND_SIZE);
  }, []);

  const handleDraw = useCallback(() => {
    if (canDraw) {
      setHandSize((prev) => prev + 1);
    }
  }, [canDraw]);

  const handleReset = useCallback(() => {
    setHandSize(INITIAL_HAND_SIZE);
  }, []);

  if (!mainDeck || mainDeck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Add cards to your deck to test draws</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Hand: <span className="text-primary">{hand.length}</span> cards
          </span>
          <span className="text-muted-foreground text-sm">
            Library: {remainingCards} remaining
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={handSize === INITIAL_HAND_SIZE}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleDraw} disabled={!canDraw}>
            <Plus className="mr-1.5 h-4 w-4" />
            Draw
          </Button>
          <Button variant="default" size="sm" onClick={handleShuffle}>
            <Shuffle className="mr-1.5 h-4 w-4" />
            New Hand
          </Button>
        </div>
      </div>

      {/* Hand Display */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
          {hand.map((deckCard, index) => (
            <DrawCard key={`${deckCard.cardId}-${index}`} deckCard={deckCard} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DrawCardProps {
  deckCard: DeckCard;
}

function DrawCard({ deckCard }: DrawCardProps) {
  const card = deckCard.card;
  const imageUrl = getCardImageUrl(card, 'normal');

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isPulsing, setIsPulsing] = useState(false);
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

  // 3D tilt effect on mouse move (RAF-throttled)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
    }, 150);
  };

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'group relative w-full cursor-pointer overflow-hidden rounded-lg transition-all duration-200',
          'shadow-md hover:shadow-xl',
          isPulsing && 'scale-95'
        )}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)${isPulsing ? ' scale(0.95)' : ''}`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card Image */}
        <div className="bg-muted relative aspect-[488/680]">
          <Image
            src={imageUrl}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 14vw"
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

        {/* Card name tooltip on hover */}
        <div className="bg-background/90 absolute right-0 bottom-0 left-0 translate-y-full px-2 py-1.5 text-center text-xs font-medium opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          {card.name}
        </div>

        {isPulsing && (
          <div className="bg-primary/30 animate-ping-once absolute inset-0 rounded-lg" />
        )}
      </div>
    </div>
  );
}
