'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useCardSearch } from '@/hooks/use-card-search';
import { useDeckSearch } from '@/hooks/use-deck-search';
import { CardSearchInput } from '@/components/cards/card-search-input';
import { CardPreviewDialog } from '@/components/cards/card-preview-dialog';
import type { ScryfallCard } from '@/types/scryfall.types';

export function HeaderCardSearch() {
  const { cards, isLoading, params, setQuery, reset } = useCardSearch();
  const [previewCard, setPreviewCard] = useState<ScryfallCard | null>(null);

  const queryStr = params.query ?? '';
  const { data: decks, isLoading: decksLoading } = useDeckSearch(queryStr);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('header-search') as HTMLInputElement;
        input?.focus();
      }
      if (e.key === 'Escape') {
        const input = document.getElementById('header-search') as HTMLInputElement;
        input?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    reset();
  };

  return (
    <>
      <div className="relative hidden md:block">
        <div className="group relative flex items-center">
          <CardSearchInput
            value={queryStr}
            onChange={setQuery}
            onClear={handleClear}
            onCardClick={setPreviewCard}
            cards={cards as ScryfallCard[]}
            isLoading={isLoading}
            showDecks
            decks={decks ?? []}
            isDecksLoading={decksLoading}
            maxResults={4}
            maxDeckResults={4}
            cardActionMode="navigate"
            placeholder="Search cards & decks..."
            inputId="header-search"
            inputClassName="w-48 cursor-text rounded-full border-border bg-background transition-[width] duration-200 ease-out focus:w-72 group-hover:w-72"
            dropdownClassName="w-80 right-0 left-auto"
          />
          <kbd className="border-border bg-muted text-muted-foreground pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium lg:inline-flex">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </div>
      </div>

      <CardPreviewDialog
        card={previewCard}
        open={!!previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </>
  );
}

export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const { cards, isLoading, params, setQuery, reset } = useCardSearch();
  const [previewCard, setPreviewCard] = useState<ScryfallCard | null>(null);

  const queryStr = params.query ?? '';
  const { data: decks, isLoading: decksLoading } = useDeckSearch(queryStr);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Search className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="top" className="h-[80vh]">
          <SheetTitle className="sr-only">Search</SheetTitle>
          <div className="flex h-full flex-col gap-4 pt-4">
            <CardSearchInput
              value={queryStr}
              onChange={setQuery}
              onClear={reset}
              onCardClick={setPreviewCard}
              cards={cards as ScryfallCard[]}
              isLoading={isLoading}
              showDecks
              decks={decks ?? []}
              isDecksLoading={decksLoading}
              maxResults={8}
              maxDeckResults={4}
              cardActionMode="navigate"
              placeholder="Search cards & decks..."
            />

            {queryStr.length > 0 && queryStr.length < 3 && (
              <div className="text-muted-foreground px-3 py-4 text-center text-sm">
                Type at least 3 characters to search
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CardPreviewDialog
        card={previewCard}
        open={!!previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </>
  );
}
