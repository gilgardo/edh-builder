import type { BasicLands } from '@/schemas/import.schema';

// ============================================
// Constants
// ============================================

export const BASIC_LANDS = {
  W: { name: 'Plains', key: 'plains' as const },
  U: { name: 'Island', key: 'island' as const },
  B: { name: 'Swamp', key: 'swamp' as const },
  R: { name: 'Mountain', key: 'mountain' as const },
  G: { name: 'Forest', key: 'forest' as const },
} as const;

export const WASTES = { name: 'Wastes', key: 'wastes' as const };

type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G';

// ============================================
// Utility Functions
// ============================================

export function getDefaultLandQuantities(
  colorIdentity: ColorIdentity[],
  totalLands: number = 36
): BasicLands {
  const defaults: BasicLands = {
    plains: 0,
    island: 0,
    swamp: 0,
    mountain: 0,
    forest: 0,
    wastes: 0,
  };

  if (colorIdentity.length === 0) {
    defaults.wastes = totalLands;
    return defaults;
  }

  const perColor = Math.floor(totalLands / colorIdentity.length);
  const remainder = totalLands % colorIdentity.length;

  colorIdentity.forEach((color, index) => {
    const landInfo = BASIC_LANDS[color];
    if (landInfo) {
      defaults[landInfo.key] = perColor + (index < remainder ? 1 : 0);
    }
  });

  return defaults;
}

export function getTotalLandCount(lands: BasicLands): number {
  return lands.plains + lands.island + lands.swamp + lands.mountain + lands.forest + lands.wastes;
}
