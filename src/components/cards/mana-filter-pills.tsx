'use client';

import Image from 'next/image';
import { cn, getColorIdentityInfo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const MANA_COLORS = [
  { value: 'W', label: 'White', glowClass: 'glow-mana-w', ringClass: 'ring-amber-300' },
  { value: 'U', label: 'Blue', glowClass: 'glow-mana-u', ringClass: 'ring-blue-400' },
  { value: 'B', label: 'Black', glowClass: 'glow-mana-b', ringClass: 'ring-purple-400' },
  { value: 'R', label: 'Red', glowClass: 'glow-mana-r', ringClass: 'ring-red-400' },
  { value: 'G', label: 'Green', glowClass: 'glow-mana-g', ringClass: 'ring-green-400' },
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

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
};

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
  const pixelSize = sizeMap[size];

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
                'relative rounded-full transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? [
                      'ring-2 ring-offset-2 ring-offset-background',
                      color.ringClass,
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
              <Image
                src={`/magic-svg/${color.value.toLowerCase()}.svg`}
                alt={color.label}
                width={pixelSize}
                height={pixelSize}
                className="rounded-full"
                style={{ width: pixelSize, height: pixelSize }}
              />
              {/* Selection indicator ring animation */}
              {isSelected && (
                <span
                  className={cn(
                    'absolute inset-0 rounded-full',
                    'animate-ping opacity-30 bg-current'
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
