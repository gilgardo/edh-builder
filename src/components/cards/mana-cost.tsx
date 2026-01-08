import { cn } from '@/lib/utils';

interface ManaCostProps {
  cost: string | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 text-[10px]',
  md: 'h-5 w-5 text-xs',
  lg: 'h-6 w-6 text-sm',
};

// Parse mana cost string like "{2}{W}{U}" into individual symbols
function parseManaCost(cost: string): string[] {
  const matches = cost.match(/\{[^}]+\}/g);
  return matches ?? [];
}

// Get the appropriate CSS class for a mana symbol
function getManaClass(symbol: string): string {
  const s = symbol.replace(/[{}]/g, '').toUpperCase();

  // Color mana
  if (s === 'W') return 'mana-badge-w';
  if (s === 'U') return 'mana-badge-u';
  if (s === 'B') return 'mana-badge-b';
  if (s === 'R') return 'mana-badge-r';
  if (s === 'G') return 'mana-badge-g';
  if (s === 'C') return 'mana-badge-c';

  // Hybrid mana (simplified - show as colorless style)
  if (s.includes('/')) return 'bg-gradient-to-br from-mtg-colorless-300 to-mtg-colorless-500 text-white';

  // Phyrexian mana
  if (s.includes('P')) return 'bg-mtg-black-500 text-mtg-white-500';

  // Snow mana
  if (s === 'S') return 'bg-blue-200 text-blue-900';

  // X mana
  if (s === 'X') return 'bg-mtg-colorless-400 text-white';

  // Generic/colorless (numbers)
  return 'bg-mtg-colorless-400 text-white';
}

// Get the display text for a mana symbol
function getManaDisplay(symbol: string): string {
  const s = symbol.replace(/[{}]/g, '').toUpperCase();

  // Hybrid mana - show both colors
  if (s.includes('/')) {
    return s.split('/')[0] ?? s;
  }

  // Phyrexian mana - show the color
  if (s.includes('P')) {
    return s.replace('P', '');
  }

  return s;
}

export function ManaCost({ cost, size = 'md', className }: ManaCostProps) {
  if (!cost) return null;

  const symbols = parseManaCost(cost);

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {symbols.map((symbol, index) => (
        <span
          key={index}
          className={cn(
            'inline-flex items-center justify-center rounded-full font-bold',
            sizeClasses[size],
            getManaClass(symbol)
          )}
        >
          {getManaDisplay(symbol)}
        </span>
      ))}
    </div>
  );
}
