'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Singular card type names for SVG icon mapping.
 * Note: This is different from CardType in deck-utils.ts which uses plural group names.
 */
export type CardTypeName =
  | 'Artifact'
  | 'Creature'
  | 'Enchantment'
  | 'Instant'
  | 'Land'
  | 'Planeswalker'
  | 'Sorcery'
  | 'Battle';

interface CardTypeIconProps {
  type: CardTypeName | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const typeToFilename: Record<string, string> = {
  artifact: 'artifact.svg',
  creature: 'creature.svg',
  enchantment: 'enchantment.svg',
  instant: 'instant.svg',
  land: 'land.svg',
  planeswalker: 'planeswalker.svg',
  sorcery: 'sorcery.svg',
  // Battle doesn't have a dedicated icon, use planeswalker as fallback
  battle: 'planeswalker.svg',
};

/**
 * Extract the primary card type from a type line
 * e.g., "Legendary Creature — Human Wizard" → "Creature"
 * e.g., "Artifact Creature — Golem" → "Artifact"
 */
export function extractPrimaryType(typeLine: string | undefined): CardTypeName | null {
  if (!typeLine) return null;

  const lowerType = typeLine.toLowerCase();

  // Order matters - check more specific types first
  if (lowerType.includes('planeswalker')) return 'Planeswalker';
  if (lowerType.includes('battle')) return 'Battle';
  if (lowerType.includes('creature')) return 'Creature';
  if (lowerType.includes('artifact')) return 'Artifact';
  if (lowerType.includes('enchantment')) return 'Enchantment';
  if (lowerType.includes('instant')) return 'Instant';
  if (lowerType.includes('sorcery')) return 'Sorcery';
  if (lowerType.includes('land')) return 'Land';

  return null;
}

/**
 * Map group names (from deck list) to card types
 * Groups like "Creatures", "Artifacts", etc.
 */
export function groupNameToCardType(groupName: string): CardTypeName | null {
  const normalized = groupName.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
  // Handle "sorceries" -> "sorcery" and "ie" endings
  const singularized = normalized.replace(/ie$/, 'y');

  const mapping: Record<string, CardTypeName> = {
    creature: 'Creature',
    artifact: 'Artifact',
    enchantment: 'Enchantment',
    instant: 'Instant',
    sorcery: 'Sorcery',
    land: 'Land',
    planeswalker: 'Planeswalker',
    battle: 'Battle',
  };

  return mapping[singularized] ?? null;
}

export function CardTypeIcon({ type, size = 'md', className, showLabel = false }: CardTypeIconProps) {
  const normalizedType = type.toLowerCase();
  const filename = typeToFilename[normalizedType];
  const pixelSize = sizeMap[size];

  if (!filename) {
    // Unknown type - don't render anything
    return null;
  }

  const icon = (
    <Image
      src={`/magic-svg/${filename}`}
      alt={type}
      width={pixelSize}
      height={pixelSize}
      className={cn('inline-block opacity-70', className)}
      style={{ width: pixelSize, height: pixelSize }}
    />
  );

  if (showLabel) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {icon}
        <span>{type}</span>
      </span>
    );
  }

  return icon;
}
