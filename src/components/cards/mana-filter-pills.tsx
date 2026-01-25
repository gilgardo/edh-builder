'use client';

import { cn, getColorIdentityInfo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const MANA_COLORS = [
  { value: 'W', label: 'White', bgClass: 'bg-mtg-white-500', textClass: 'text-mtg-black-800', glowClass: 'glow-mana-w' },
  { value: 'U', label: 'Blue', bgClass: 'bg-mtg-blue-500', textClass: 'text-white', glowClass: 'glow-mana-u' },
  { value: 'B', label: 'Black', bgClass: 'bg-mtg-black-500', textClass: 'text-mtg-white-500', glowClass: 'glow-mana-b' },
  { value: 'R', label: 'Red', bgClass: 'bg-mtg-red-500', textClass: 'text-white', glowClass: 'glow-mana-r' },
  { value: 'G', label: 'Green', bgClass: 'bg-mtg-green-500', textClass: 'text-white', glowClass: 'glow-mana-g' },
] as const;

interface ManaFilterPillsProps {
  /** Currently selected colors */
  selected: string[];
  /** Callback when selection changes */
  onChange: (colors: string[]) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show guild name when applicable */
  showGuildName?: boolean;
  /** Additional className */
  className?: string;
}

export function ManaFilterPills({
  selected,
  onChange,
  size = 'md',
  showGuildName = true,
  className,
}: ManaFilterPillsProps) {
  const toggleColor = (color: string) => {
    const newSelection = selected.includes(color)
      ? selected.filter((c) => c !== color)
      : [...selected, color];
    onChange(newSelection);
  };

  const colorInfo = getColorIdentityInfo(selected);

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1.5">
        {MANA_COLORS.map((color) => {
          const isSelected = selected.includes(color.value);
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => toggleColor(color.value)}
              className={cn(
                'relative rounded-full font-bold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                sizeClasses[size],
                color.bgClass,
                color.textClass,
                isSelected
                  ? [
                      'ring-2 ring-offset-2 ring-offset-background',
                      'scale-110 shadow-lg',
                      color.glowClass,
                      'hover-glow',
                    ]
                  : [
                      'opacity-40 hover:opacity-70',
                      'hover:scale-105',
                      'shadow-sm',
                    ]
              )}
              title={`${isSelected ? 'Remove' : 'Add'} ${color.label}`}
              aria-pressed={isSelected}
              aria-label={`Filter by ${color.label} mana`}
            >
              {color.value}
              {/* Selection indicator ring animation */}
              {isSelected && (
                <span
                  className={cn(
                    'absolute inset-0 rounded-full',
                    'animate-ping opacity-30',
                    color.bgClass
                  )}
                  style={{ animationDuration: '2s', animationIterationCount: '1' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Guild/Color name display */}
      {showGuildName && selected.length > 0 && (
        <Badge
          variant={selected.length >= 2 ? (`guild-${colorInfo.gradient}` as 'guild-azorius') : 'secondary'}
          size="sm"
          className="animate-in fade-in-0 slide-in-from-left-2 duration-200"
        >
          {colorInfo.name}
        </Badge>
      )}

      {/* Clear button */}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            'text-xs text-muted-foreground hover:text-foreground',
            'underline-offset-2 hover:underline',
            'transition-colors duration-150',
            'animate-in fade-in-0 duration-200'
          )}
        >
          Clear
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for use in tight spaces
 */
export function ManaFilterPillsCompact({
  selected,
  onChange,
  className,
}: Omit<ManaFilterPillsProps, 'size' | 'showGuildName'>) {
  return (
    <ManaFilterPills
      selected={selected}
      onChange={onChange}
      size="sm"
      showGuildName={false}
      className={className}
    />
  );
}
