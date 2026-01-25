'use client';

import { cn } from '@/lib/utils';
import { ManaSymbol } from './mana-symbol';

interface ManaCostProps {
  cost: string | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Parse mana cost string like "{2}{W}{U}" into individual symbols
function parseManaCost(cost: string): string[] {
  const matches = cost.match(/\{[^}]+\}/g);
  return matches ?? [];
}

export function ManaCost({ cost, size = 'md', className }: ManaCostProps) {
  if (!cost) return null;

  const symbols = parseManaCost(cost);

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {symbols.map((symbol, index) => (
        <ManaSymbol key={index} symbol={symbol} size={size} />
      ))}
    </div>
  );
}
