'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBasicLands, BASIC_LANDS, getDefaultLandQuantities, getTotalLandCount } from '@/hooks/use-basic-lands';
import type { BasicLands } from '@/schemas/import.schema';
import { Loader2 } from 'lucide-react';

type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G';

interface BasicLandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorIdentity: ColorIdentity[];
  onConfirm: (lands: BasicLands) => void;
  onSkip: () => void;
}

const COLOR_ICONS: Record<ColorIdentity, { emoji: string; className: string }> = {
  W: { emoji: '☀️', className: 'bg-mtg-white-500 text-mtg-black-800' },
  U: { emoji: '💧', className: 'bg-mtg-blue-500 text-white' },
  B: { emoji: '💀', className: 'bg-mtg-black-500 text-mtg-white-500' },
  R: { emoji: '🔥', className: 'bg-mtg-red-500 text-white' },
  G: { emoji: '🌲', className: 'bg-mtg-green-500 text-white' },
};

export function BasicLandModal({
  open,
  onOpenChange,
  colorIdentity,
  onConfirm,
  onSkip,
}: BasicLandModalProps) {
  const [lands, setLands] = useState<BasicLands>(getDefaultLandQuantities(colorIdentity, 0));
  const { isLoading } = useBasicLands(colorIdentity);

  // Reset lands when color identity changes
  useEffect(() => {
    setLands(getDefaultLandQuantities(colorIdentity, 0));
  }, [colorIdentity]);

  const handleQuantityChange = (key: keyof BasicLands, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    if (num > 40) return;

    setLands((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleQuickFill = (total: number) => {
    setLands(getDefaultLandQuantities(colorIdentity, total));
  };

  const handleClear = () => {
    setLands({
      plains: 0,
      island: 0,
      swamp: 0,
      mountain: 0,
      forest: 0,
      wastes: 0,
    });
  };

  const totalLands = getTotalLandCount(lands);

  // Get available lands for this color identity
  const availableLands: Array<{ key: keyof BasicLands; name: string; color?: ColorIdentity }> = [];
  for (const color of colorIdentity) {
    const landInfo = BASIC_LANDS[color];
    if (landInfo) {
      availableLands.push({
        key: landInfo.key,
        name: landInfo.name,
        color,
      });
    }
  }
  // Only add Wastes for colorless commanders
  if (colorIdentity.length === 0) {
    availableLands.push({ key: 'wastes', name: 'Wastes' });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Basic Lands</DialogTitle>
          <DialogDescription>
            Add basic lands to your deck. You can always adjust this later.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick fill buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Quick add:</span>
              <Button variant="outline" size="sm" onClick={() => handleQuickFill(30)}>
                30 lands
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickFill(36)}>
                36 lands
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>

            {/* Land inputs */}
            <div className="space-y-3">
              {availableLands.map((land) => {
                const colorInfo = land.color ? COLOR_ICONS[land.color] : undefined;
                return (
                  <div key={land.key} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                        colorInfo?.className || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {colorInfo?.emoji || '◆'}
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">{land.name}</label>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={40}
                      value={lands[land.key]}
                      onChange={(e) => handleQuantityChange(land.key, e.target.value)}
                      className="w-20 text-center"
                    />
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="font-medium">Total Lands</span>
              <span className={`text-lg font-bold ${totalLands > 40 ? 'text-destructive' : ''}`}>
                {totalLands}
              </span>
            </div>

            {totalLands > 40 && (
              <p className="text-xs text-destructive">
                That&apos;s a lot of lands! Consider reducing for more room for spells.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={() => onConfirm(lands)} disabled={isLoading}>
            Add {totalLands > 0 ? `${totalLands} ` : ''}Lands
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
