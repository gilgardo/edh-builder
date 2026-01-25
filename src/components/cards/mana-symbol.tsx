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
 * Get the SVG filename for a mana symbol
 * Handles: W, U, B, R, G, C (colors), numbers (generic), X, S (snow), E (energy)
 * Returns null for symbols without SVG support (hybrid, phyrexian) to use text fallback
 */
function getSymbolFilename(symbol: string): string | null {
  const s = symbol.replace(/[{}]/g, '').toLowerCase();

  // Single color mana
  if (['w', 'u', 'b', 'r', 'g', 'c', 'x', 's', 'e'].includes(s)) {
    return `${s}.svg`;
  }

  // Generic mana (numbers) - check reasonable range
  if (/^\d+$/.test(s)) {
    const num = parseInt(s, 10);
    // SVGs exist for 0-20, 100, and 1000000
    if (num <= 20 || num === 100 || num === 1000000) {
      return `${s}.svg`;
    }
    return null;
  }

  // Phyrexian mana - no SVG files exist, use text fallback
  if (s.includes('/p') || s.includes('p/') || s.endsWith('p')) {
    return null;
  }

  // Hybrid mana - no SVG files exist, use text fallback
  if (s.includes('/')) {
    return null;
  }

  // Tap symbol
  if (s === 't') {
    return 'tap-alt.svg';
  }

  // Untap symbol
  if (s === 'q') {
    return 'untap.svg';
  }

  return null;
}

export function ManaSymbol({ symbol, size = 'md', className }: ManaSymbolProps) {
  const filename = getSymbolFilename(symbol);
  const pixelSize = sizeMap[size];

  if (!filename) {
    // Fallback for unknown symbols - render as text
    const displayText = symbol.replace(/[{}]/g, '').toUpperCase();
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-mtg-colorless-400 text-white font-bold',
          size === 'xs' && 'h-3 w-3 text-[8px]',
          size === 'sm' && 'h-4 w-4 text-[10px]',
          size === 'md' && 'h-5 w-5 text-xs',
          size === 'lg' && 'h-6 w-6 text-sm',
          size === 'xl' && 'h-8 w-8 text-base',
          className
        )}
      >
        {displayText}
      </span>
    );
  }

  return (
    <Image
      src={`/magic-svg/${filename}`}
      alt={symbol.replace(/[{}]/g, '')}
      width={pixelSize}
      height={pixelSize}
      className={cn('inline-block', className)}
      // Prevent layout shift
      style={{ width: pixelSize, height: pixelSize }}
    />
  );
}
