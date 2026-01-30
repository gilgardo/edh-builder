'use client';

import { List, Grid2x2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'text' | 'image';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * Toggle between text list view and image grid view
 */
export function ViewModeToggle({ mode, onChange, className }: ViewModeToggleProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-lg border p-1', className)}>
      <Button
        variant={mode === 'text' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => onChange('text')}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === 'image' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => onChange('image')}
        aria-label="Grid view"
      >
        <Grid2x2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
