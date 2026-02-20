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
import { ManaSymbol } from '@/components/cards/mana-symbol';
import { BASIC_LANDS, getDefaultLandQuantities, getTotalLandCount } from '@/lib/basic-lands';
import type { BasicLands } from '@/schemas/import.schema';

type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G';

interface BasicLandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorIdentity: ColorIdentity[];
  onConfirm: (lands: BasicLands) => void;
  onSkip: () => void;
}

export function BasicLandModal({
  open,
  onOpenChange,
  colorIdentity,
  onConfirm,
  onSkip,
}: BasicLandModalProps) {
  const [lands, setLands] = useState<BasicLands>(getDefaultLandQuantities(colorIdentity, 0));

  useEffect(() => {
    setLands(getDefaultLandQuantities(colorIdentity, 0));
  }, [colorIdentity]);

  const handleQuantityChange = (key: keyof BasicLands, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 40) return;
    setLands((prev) => ({ ...prev, [key]: num }));
  };

  const handleQuickFill = (total: number) => {
    setLands(getDefaultLandQuantities(colorIdentity, total));
  };

  const handleClear = () => {
    setLands({ plains: 0, island: 0, swamp: 0, mountain: 0, forest: 0, wastes: 0 });
  };

  const totalLands = getTotalLandCount(lands);

  const availableLands: Array<{ key: keyof BasicLands; name: string; color?: ColorIdentity }> = [];
  for (const color of colorIdentity) {
    const landInfo = BASIC_LANDS[color];
    if (landInfo) availableLands.push({ key: landInfo.key, name: landInfo.name, color });
  }
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

        <div className="space-y-4">
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

          <div className="space-y-3">
            {availableLands.map((land) => (
              <div key={land.key} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {land.color ? (
                    <ManaSymbol symbol={`{${land.color}}`} size="lg" />
                  ) : (
                    <ManaSymbol symbol="{C}" size="lg" />
                  )}
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
            ))}
          </div>

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

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={() => onConfirm(lands)}>
            Add {totalLands > 0 ? `${totalLands} ` : ''}Lands
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
