import { cn } from '@/lib/utils';

interface ColorIdentityBadgesProps {
  colors: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 text-[10px]',
  md: 'h-5 w-5 text-xs',
  lg: 'h-6 w-6 text-sm',
};

const colorOrder = ['W', 'U', 'B', 'R', 'G'];

export function ColorIdentityBadges({ colors, size = 'md', className }: ColorIdentityBadgesProps) {
  // Sort colors in WUBRG order
  const sortedColors = [...colors].sort((a, b) => {
    return colorOrder.indexOf(a.toUpperCase()) - colorOrder.indexOf(b.toUpperCase());
  });

  if (sortedColors.length === 0) {
    return (
      <span
        className={cn(
          'mana-badge mana-badge-c',
          sizeClasses[size],
          className
        )}
      >
        C
      </span>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {sortedColors.map((color) => {
        const c = color.toUpperCase();
        return (
          <span
            key={c}
            className={cn(
              'mana-badge',
              `mana-badge-${c.toLowerCase()}`,
              sizeClasses[size]
            )}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}
