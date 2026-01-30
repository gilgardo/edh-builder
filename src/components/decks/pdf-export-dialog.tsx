'use client';

import { useState, useCallback, useMemo } from 'react';
import { FileDown, Loader2, Check, AlertCircle } from 'lucide-react';
import type { Card as PrismaCard } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  generateDeckPdf,
  downloadBlob,
  calculateEstimatedPages,
} from '@/lib/pdf-generator';
import type {
  PdfExportOptions,
  PdfGenerationProgress,
  DeckCardWithCard,
} from '@/types/pdf.types';
import { DEFAULT_PDF_OPTIONS, CARDS_PER_PAGE } from '@/types/pdf.types';

/** Time to display success state before closing dialog */
const SUCCESS_DISPLAY_MS = 1500;

interface PdfExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckName: string;
  commander: PrismaCard | null;
  cards: DeckCardWithCard[];
}

export function PdfExportDialog({
  open,
  onOpenChange,
  deckName,
  commander,
  cards,
}: PdfExportDialogProps) {
  const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_PDF_OPTIONS);
  const [progress, setProgress] = useState<PdfGenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate counts for each category
  const categoryCounts = useMemo(() => {
    const counts = { main: 0, sideboard: 0, considering: 0 };
    for (const deckCard of cards) {
      if (deckCard.category === 'MAIN') {
        counts.main += deckCard.quantity;
      } else if (deckCard.category === 'SIDEBOARD') {
        counts.sideboard += deckCard.quantity;
      } else if (deckCard.category === 'CONSIDERING') {
        counts.considering += deckCard.quantity;
      }
    }
    return counts;
  }, [cards]);

  // Estimate pages
  const estimate = useMemo(() => {
    return calculateEstimatedPages(commander, cards, options);
  }, [commander, cards, options]);

  const updateOption = <K extends keyof PdfExportOptions>(
    key: K,
    value: PdfExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = useCallback(async () => {
    setError(null);
    setProgress({
      phase: 'loading',
      current: 0,
      total: 0,
      message: 'Preparing export...',
    });

    try {
      const blob = await generateDeckPdf(
        deckName,
        commander,
        cards,
        options,
        setProgress
      );

      // Generate filename with safe characters
      const sanitizedName = deckName
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'untitled';
      const filename = `${sanitizedName}-deck.pdf`;

      // Download the PDF
      downloadBlob(blob, filename);

      // Keep dialog open briefly to show success
      setTimeout(() => {
        setProgress(null);
        onOpenChange(false);
      }, SUCCESS_DISPLAY_MS);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      setProgress(null);
    }
  }, [deckName, commander, cards, options, onOpenChange]);

  const handleCancel = () => {
    if (progress && progress.phase !== 'complete') {
      // TODO: Implement cancellation with AbortController
      setProgress(null);
    }
    onOpenChange(false);
  };

  const isGenerating = progress !== null && progress.phase !== 'complete';
  const isComplete = progress?.phase === 'complete';

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Deck as PDF
          </DialogTitle>
          <DialogDescription>
            Generate a printable PDF with card images in standard MTG size (63mm × 88mm).
            Double-faced cards will include both front and back.
          </DialogDescription>
        </DialogHeader>

        {!progress && (
          <>
            {/* Options */}
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Include cards:</Label>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCommander"
                    checked={options.includeCommander}
                    onCheckedChange={(checked) =>
                      updateOption('includeCommander', checked === true)
                    }
                    disabled={!commander}
                  />
                  <Label htmlFor="includeCommander" className="text-sm font-normal">
                    Commander {commander ? `(${commander.name})` : '(none)'}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMainDeck"
                    checked={options.includeMainDeck}
                    onCheckedChange={(checked) =>
                      updateOption('includeMainDeck', checked === true)
                    }
                  />
                  <Label htmlFor="includeMainDeck" className="text-sm font-normal">
                    Main Deck ({categoryCounts.main} cards)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSideboard"
                    checked={options.includeSideboard}
                    onCheckedChange={(checked) =>
                      updateOption('includeSideboard', checked === true)
                    }
                    disabled={categoryCounts.sideboard === 0}
                  />
                  <Label htmlFor="includeSideboard" className="text-sm font-normal">
                    Sideboard ({categoryCounts.sideboard} cards)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeConsidering"
                    checked={options.includeConsidering}
                    onCheckedChange={(checked) =>
                      updateOption('includeConsidering', checked === true)
                    }
                    disabled={categoryCounts.considering === 0}
                  />
                  <Label htmlFor="includeConsidering" className="text-sm font-normal">
                    Considering ({categoryCounts.considering} cards)
                  </Label>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">Options:</Label>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="duplicateMultiples"
                    checked={options.duplicateMultiples}
                    onCheckedChange={(checked) =>
                      updateOption('duplicateMultiples', checked === true)
                    }
                  />
                  <Label htmlFor="duplicateMultiples" className="text-sm font-normal">
                    Print duplicates (3× = 3 cards)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showCardNames"
                    checked={options.showCardNames}
                    onCheckedChange={(checked) =>
                      updateOption('showCardNames', checked === true)
                    }
                  />
                  <Label htmlFor="showCardNames" className="text-sm font-normal">
                    Show card names below images
                  </Label>
                </div>
              </div>

              {/* Estimate */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">
                  Estimated: <span className="font-medium text-foreground">{estimate.pages}</span> pages
                  ({CARDS_PER_PAGE} cards per page)
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Double-faced cards will add additional images for back faces.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleGenerate}>
                <FileDown className="mr-2 h-4 w-4" />
                Generate PDF
              </Button>
            </DialogFooter>
          </>
        )}

        {progress && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              {isComplete ? (
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              )}
            </div>

            <div className="space-y-2">
              <Progress
                value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
                className="h-2"
              />
              <p className="text-center text-sm text-muted-foreground">
                {progress.message}
              </p>
              {progress.total > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {progress.current} / {progress.total}
                </p>
              )}
            </div>

            {!isComplete && (
              <DialogFooter className="justify-center">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
