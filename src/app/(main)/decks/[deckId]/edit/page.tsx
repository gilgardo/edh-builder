'use client';

import { use, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Search, Eye, Settings, Layers, Dices } from 'lucide-react';

import { useDeck, useUpdateDeck } from '@/hooks/use-deck';
import { useAddCardToDeck, useRemoveCardFromDeck, useUpdateDeckCard } from '@/hooks/use-deck-cards';
import { useCardSearch } from '@/hooks/use-card-search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Container } from '@/components/layout/container';
import { CardSearchSheet } from '@/components/cards/card-search-sheet';
import { CardSearchGrid } from '@/components/cards/card-search-grid';
import { CardSearchInput } from '@/components/cards/card-search-input';
import { PrintingsModal } from '@/components/cards/printings-modal';
import { DeckCardList } from '@/components/decks/deck-card-list';
import { CardPreviewPanel } from '@/components/decks/card-preview-panel';
import { DeckSettingsForm } from '@/components/decks/deck-settings-form';
import { DeckEditSkeleton } from '@/components/decks/deck-edit-skeleton';
import { groupCardsByType, getConsideringCards, calculateTotalCards } from '@/lib/deck-utils';
import type { ScryfallCard } from '@/types/scryfall.types';
import type { DisplayCard, PreviewableCard } from '@/types/cards';
import type { CardCategory } from '@/schemas/deck.schema';
import { cn } from '@/lib/utils';
import { Drawtester } from '@/components/decks/draw-test';

interface PageProps {
  params: Promise<{ deckId: string }>;
}

export default function DeckEditPage({ params }: PageProps) {
  const { deckId } = use(params);
  const { data: session } = useSession();
  const { toast } = useToast();

  // UI-only state
  const [activeTab, setActiveTab] = useState<'search' | 'decklist'>('decklist');
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<PreviewableCard | null>(null);
  const [printingsModalOpen, setPrintingsModalOpen] = useState(false);
  const [selectedCardForPrinting, setSelectedCardForPrinting] = useState<DisplayCard | null>(null);

  const { data: deckResponse, isLoading, error } = useDeck(deckId);
  const deck = deckResponse?.deck;

  const [drawtesterOpen, setDrawtesterOpen] = useState(false);

  const nonCommanderCards = useMemo(
    () => deck?.cards.filter((card) => card.cardId !== deck.commanderId),
    [deck]
  );
  const mainDeckCards = useMemo(
    () => nonCommanderCards?.filter((card) => card.category === 'MAIN'),
    [nonCommanderCards]
  );
  const cardGroups = useMemo(
    () => groupCardsByType(nonCommanderCards, { excludeCategory: 'CONSIDERING' }),
    [nonCommanderCards]
  );
  const consideringCards = useMemo(
    () => getConsideringCards(nonCommanderCards),
    [nonCommanderCards]
  );
  const totalCards = useMemo(() => calculateTotalCards(deck?.cards, 'CONSIDERING'), [deck?.cards]);

  const updateDeck = useUpdateDeck();
  const addCard = useAddCardToDeck();
  const removeCard = useRemoveCardFromDeck();
  const updateCard = useUpdateDeckCard();

  const search = useCardSearch({ colorIdentity: deck?.colorIdentity ?? [] }, !!deck);
  const { cards, isLoading: isSearching, params: searchParams, setQuery } = search;

  const { query } = searchParams;

  const handleAddCard = (card: ScryfallCard) => {
    addCard.mutate(
      {
        deckId,
        scryfallCard: card,
        category: 'MAIN',
      },
      {
        onSuccess: () => {
          toast(`${card.name} successfully added`, 'success');
          // Close sheet only after mutation completes successfully
          setSearchSheetOpen(false);
        },
        onError: () => {
          toast('Failed to add the card', 'error');
          // Also close on error so user can retry
          setSearchSheetOpen(false);
        },
      }
    );
  };

  const handleRemoveCard = (cardId: string) => {
    removeCard.mutate(
      { deckId, cardId },
      { onError: () => toast('Failed to remove card from deck', 'error') }
    );
  };

  const handleCardHover = useCallback((card: PreviewableCard | null) => {
    setHoveredCard(card);
  }, []);

  const handleChangePrinting = useCallback((card: DisplayCard) => {
    setSelectedCardForPrinting(card);
    setPrintingsModalOpen(true);
  }, []);

  const handleSelectPrinting = async (scryfallCard: ScryfallCard) => {
    if (!selectedCardForPrinting || !deck) return;
    try {
      const currentDeckCard = deck.cards.find((dc) => dc.card.id === selectedCardForPrinting.id);
      if (!currentDeckCard) return;

      await removeCard.mutateAsync({ deckId, cardId: selectedCardForPrinting.id });
      await addCard.mutateAsync({
        deckId,
        scryfallCard,
        quantity: currentDeckCard.quantity,
        category: currentDeckCard.category as CardCategory,
      });
    } catch {
      toast('Failed to change card printing', 'error');
    }
  };

  const handleChangeQuantity = useCallback(
    async (card: DisplayCard, quantity: number) => {
      try {
        await updateCard.mutateAsync({ deckId, cardId: card.id, quantity });
      } catch {
        toast('Failed to change card quantity', 'error');
      }
    },
    [updateCard, deckId, toast]
  );

  const handleMoveToCategory = useCallback(
    async (card: DisplayCard, category: CardCategory) => {
      try {
        await updateCard.mutateAsync({ deckId, cardId: card.id, category });
      } catch {
        toast('Failed to move card', 'error');
      }
    },
    [updateCard, deckId, toast]
  );

  if (isLoading) {
    return (
      <div className="py-8">
        <Container>
          <DeckEditSkeleton />
        </Container>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="py-8">
        <Container className="max-w-4xl">
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Deck not found</h1>
            <p className="text-muted-foreground mt-2">
              This deck may have been deleted or you don&apos;t have permission to edit it.
            </p>
            <Link href="/decks">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Decks
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const isOwner = session?.user?.id === deck.userId;

  if (!isOwner) {
    return (
      <div className="py-8">
        <Container className="max-w-4xl">
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Unauthorized</h1>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have permission to edit this deck.
            </p>
            <Link href={`/decks/${deckId}`}>
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View Deck
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Fixed Header */}
      <div className="bg-background/95 supports-backdrop-filter:bg-background/60 shrink-0 border-b backdrop-blur">
        <Container className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href={`/decks/${deckId}`}
              className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Link>
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <div>
              <h1 className="max-w-37.5 truncate text-sm font-semibold md:max-w-none md:text-base">
                {deck.name}
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm">{totalCards}/100 cards</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 md:h-9">
                  <Settings className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Deck Settings</SheetTitle>
                  <SheetDescription>
                    Edit your deck name, description, and visibility.
                  </SheetDescription>
                </SheetHeader>
                <DeckSettingsForm
                  deck={deck}
                  onUpdate={updateDeck.mutate}
                  isUpdating={updateDeck.isPending}
                />
              </SheetContent>
            </Sheet>
            <Sheet open={drawtesterOpen} onOpenChange={setDrawtesterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 md:h-9">
                  <Dices className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Draw Test</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Draw Tester</SheetTitle>
                  <SheetDescription>
                    Test your opening hand and draw sequence
                  </SheetDescription>
                </SheetHeader>
                <Drawtester mainDeck={mainDeckCards} />
              </SheetContent>
            </Sheet>
            <Link href={`/decks/${deckId}`}>
              <Button variant="outline" size="sm" className="h-8 md:h-9">
                <Eye className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">View</span>
              </Button>
            </Link>
          </div>
        </Container>
      </div>

      {/* Mobile: Compact Searchbar with inline filters */}
      <div className="shrink-0 border-b px-4 py-3 md:hidden">
        <CardSearchInput
          value={searchParams.query || ''}
          onChange={setQuery}
          cards={cards}
          onCardClick={handleAddCard}
          isLoading={isSearching}
          maxResults={6}
          placeholder="Search cards..."
          showFilters
          selectedColors={searchParams.colors}
          onColorToggle={(colors) => {
            // Toggle each color that changed
            const added = colors.filter((c) => !searchParams.colors.includes(c));
            const removed = searchParams.colors.filter((c) => !colors.includes(c));
            [...added, ...removed].forEach((color) => search.toggleColor(color));
          }}
          selectedType={searchParams.type || ''}
          onTypeChange={search.setType}
        />
      </div>

      {/* Mobile: Tab Navigation */}
      <div className="shrink-0 border-b md:hidden">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={cn(
              'relative flex-1 py-3 text-center text-sm font-medium transition-colors',
              activeTab === 'search'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Search className="mr-1.5 inline-block h-4 w-4" />
            Search
            {activeTab === 'search' && (
              <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decklist')}
            className={cn(
              'relative flex-1 py-3 text-center text-sm font-medium transition-colors',
              activeTab === 'decklist'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="mr-1.5 inline-block h-4 w-4" />
            Deck
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {totalCards}
            </Badge>
            {activeTab === 'decklist' && (
              <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop: Two-panel Moxfield-style layout */}
      <div className="hidden min-h-0 flex-1 md:flex">
        {/* Left Panel - Card Preview (Fixed Width) */}
        <div className="bg-muted/30 w-64 shrink-0 border-r p-4 lg:w-72">
          <CardPreviewPanel
            card={hoveredCard}
            fallbackCard={deck.commander}
            className="sticky top-4"
          />
        </div>

        {/* Right Panel - Search + Deck List (Full Width, Multi-Column) */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search Bar with inline filters */}
          <div className="shrink-0 border-b p-4">
            <CardSearchInput
              value={query}
              onChange={setQuery}
              onCardClick={handleAddCard}
              onCardHover={handleCardHover}
              cards={cards}
              isLoading={isSearching}
              isAdding={addCard.isPending}
              showFilters
              selectedColors={searchParams.colors}
              onColorToggle={(colors) => {
                const added = colors.filter((c) => !searchParams.colors.includes(c));
                const removed = searchParams.colors.filter((c) => !colors.includes(c));
                [...added, ...removed].forEach((color) => search.toggleColor(color));
              }}
              selectedType={searchParams.type || ''}
              onTypeChange={search.setType}
            />
          </div>

          {/* Deck List with Multi-Column Layout */}
          <DeckCardList
            commander={deck.commander}
            cardGroups={cardGroups}
            consideringCards={consideringCards}
            totalCards={totalCards ?? 0}
            colorIdentity={deck.colorIdentity}
            onRemoveCard={handleRemoveCard}
            onChangePrinting={handleChangePrinting}
            onChangeQuantity={handleChangeQuantity}
            onMoveToCategory={handleMoveToCategory}
            isRemoving={removeCard.isPending}
            isUpdating={updateCard.isPending}
            onCardHover={handleCardHover}
            columns={3}
          />
        </div>
      </div>

      {/* Mobile: Single content area based on tab */}
      <div className="min-h-0 flex-1 overflow-auto md:hidden">
        {activeTab === 'search' ? (
          <CardSearchGrid
            searchQuery={query}
            cards={cards}
            isSearching={isSearching}
            onAddCard={handleAddCard}
            isAdding={addCard.isPending}
          />
        ) : (
          <DeckCardList
            commander={deck.commander}
            cardGroups={cardGroups}
            consideringCards={consideringCards}
            totalCards={totalCards ?? 0}
            colorIdentity={deck.colorIdentity}
            onRemoveCard={handleRemoveCard}
            onChangePrinting={handleChangePrinting}
            onChangeQuantity={handleChangeQuantity}
            onMoveToCategory={handleMoveToCategory}
            isRemoving={removeCard.isPending}
            isUpdating={updateCard.isPending}
            showHeader={false}
          />
        )}
      </div>

      {/* Mobile: Floating Action Button to open search */}
      {activeTab === 'decklist' && (
        <Button
          onClick={() => setSearchSheetOpen(true)}
          className="fixed right-6 bottom-6 z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
          size="icon"
        >
          <Search className="h-6 w-6" />
        </Button>
      )}

      {/* Mobile: Full search modal */}
      <CardSearchSheet
        open={searchSheetOpen}
        onOpenChange={setSearchSheetOpen}
        search={search}
        onAddCard={handleAddCard}
        isAdding={addCard.isPending}
      />

      {/* Printings Modal */}
      <PrintingsModal
        open={printingsModalOpen}
        onOpenChange={setPrintingsModalOpen}
        cardName={selectedCardForPrinting?.name ?? ''}
        oracleId={selectedCardForPrinting?.oracleId ?? null}
        currentScryfallId={selectedCardForPrinting?.scryfallId ?? ''}
        onSelectPrinting={handleSelectPrinting}
      />
    </div>
  );
}
