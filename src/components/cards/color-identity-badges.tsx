'use client';

import { cn } from '@/lib/utils';
import { ManaSymbol } from './mana-symbol';

interface ColorIdentityBadgesProps {
  colors: string[];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colorOrder = ['W', 'U', 'B', 'R', 'G'];

export function ColorIdentityBadges({ colors, size = 'md', className }: ColorIdentityBadgesProps) {
  // Sort colors in WUBRG order
  const sortedColors = [...colors].sort((a, b) => {
    return colorOrder.indexOf(a.toUpperCase()) - colorOrder.indexOf(b.toUpperCase());
  });

  if (sortedColors.length === 0) {
    return <ManaSymbol symbol="{C}" size={size} className={className} />;
  }

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {sortedColors.map((color) => (
        <ManaSymbol key={color} symbol={`{${color.toUpperCase()}}`} size={size} />
      ))}
    </div>
  );
}
