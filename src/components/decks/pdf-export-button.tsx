'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { Card as PrismaCard } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { PdfExportDialog } from './pdf-export-dialog';
import type { DeckCardWithCard } from '@/types/pdf.types';

interface PdfExportButtonProps {
  deckName: string;
  commander: PrismaCard | null;
  cards: DeckCardWithCard[];
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PdfExportButton({
  deckName,
  commander,
  cards,
  variant = 'outline',
  size = 'sm',
}: PdfExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setShowDialog(true)}>
        <FileDown className="mr-2 h-4 w-4" />
        Export PDF
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
