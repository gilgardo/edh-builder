'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { Card as PrismaCard } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { PdfExportDialog } from './pdf-export-dialog';
import type { DeckCardWithCard } from '@/types/pdf.types';
import { cn } from '@/lib/utils';

interface PdfExportButtonProps {
  deckName: string;
  commander: PrismaCard | null;
  cards: DeckCardWithCard[];
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  iconOnly?: boolean;
  className?: string;
}

export function PdfExportButton({
  deckName,
  commander,
  cards,
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  className,
}: PdfExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={iconOnly ? 'icon' : size}
        onClick={() => setShowDialog(true)}
        className={className}
        aria-label="Export PDF"
      >
        <FileDown className={cn('h-4 w-4', !iconOnly && 'mr-2')} />
        {!iconOnly && 'Export PDF'}
      </Button>
      <PdfExportDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        deckName={deckName}
        commander={commander}
        cards={cards}
      />
    </>
  );
}
