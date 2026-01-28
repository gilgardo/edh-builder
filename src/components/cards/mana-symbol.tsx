'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ManaSymbolProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * Convert a mana symbol string to its SVG filename.
 * Uses official Scryfall symbol naming with / replaced by - and {} removed.
 *
 * Examples:
 * - {W} → W.svg
 * - {W/U} → W-U.svg (hybrid)
 * - {W/P} → W-P.svg (phyrexian)
 * - {2/W} → 2-W.svg (twobrid)
 * - {W/U/P} → W-U-P.svg (hybrid phyrexian)
 * - {T} → T.svg (tap)
 * - {Q} → Q.svg (untap)
 */
function getSymbolFilename(symbol: string): string {
  // Remove braces and replace / with -
  const filename = symbol.replace(/[{}]/g, '').replace(/\//g, '-').toUpperCase();
  return `${filename}.svg`;
}

export function ManaSymbol({ symbol, size = 'md', className }: ManaSymbolProps) {
  const filename = getSymbolFilename(symbol);
  const pixelSize = sizeMap[size];

  return (
    <Image
      src={`/mtg_symbols/${filename}`}
      alt={symbol.replace(/[{}]/g, '')}
      width={pixelSize}
      height={pixelSize}
      className={cn('inline-block', className)}
      style={{ width: pixelSize, height: pixelSize }}
    />
  );
}
