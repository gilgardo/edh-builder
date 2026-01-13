'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Search, X, Plus, Eye, Settings, Layers, Filter } from 'lucide-react';

import { useDeck, useUpdateDeck } from '@/hooks/use-deck';
import { useAddCardToDeck, useRemoveCardFromDeck } from '@/hooks/use-deck-cards';
import { useCardSearch } from '@/hooks/use-card-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CardImage } from '@/components/cards/card-image';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { MobileCardSearchBar } from '@/components/cards/mobile-card-search-bar';
import { CardSearchSheet } from '@/components/cards/card-search-sheet';
import { CardSearchGrid } from '@/components/cards/card-search-grid';
import { DeckCardList } from '@/components/decks/deck-card-list';
import type { ScryfallCard } from '@/types/scryfall.types';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ deckId: string }>;
}

const MTG_COLORS = [
  { value: 'W', label: 'White', className: 'bg-mtg-white-500 text-mtg-black-800' },
  { value: 'U', label: 'Blue', className: 'bg-mtg-blue-500 text-white' },
  { value: 'B', label: 'Black', className: 'bg-mtg-black-500 text-mtg-white-500' },
  { value: 'R', label: 'Red', className: 'bg-mtg-red-500 text-white' },
  { value: 'G', label: 'Green', className: 'bg-mtg-green-500 text-white' },
];

// Group cards by type
function groupCardsByType(
  cards: Array<{
    category: string;
    quantity: number;
    card: {
      id: string;
      typeLine: string;
      name: string;
      manaCost: string | null;
      cmc: number;
      imageUris: unknown;
    };
  }>
) {
  const groups: Record<string, typeof cards> = {};

  for (const deckCard of cards) {
    const typeLine = deckCard.card.typeLine.toLowerCase();
    let type = 'Other';

    if (typeLine.includes('creature')) type = 'Creatures';
    else if (typeLine.includes('instant')) type = 'Instants';
    else if (typeLine.includes('sorcery')) type = 'Sorceries';
    else if (typeLine.includes('artifact')) type = 'Artifacts';
    else if (typeLine.includes('enchantment')) type = 'Enchantments';
    else if (typeLine.includes('planeswalker')) type = 'Planeswalkers';
    else if (typeLine.includes('land')) type = 'Lands';

    if (!groups[type]) groups[type] = [];
    groups[type]!.push(deckCard);
  }

  const typeOrder = [
    'Creatures',
    'Instants',
    'Sorceries',
    'Artifacts',
    'Enchantments',
    'Planeswalkers',
    'Lands',
    'Other',
  ];
  const sortedGroups: typeof groups = {};
  for (const type of typeOrder) {
    const group = groups[type];
    if (group && group.length > 0) {
      sortedGroups[type] = group.sort((a, b) => a.card.name.localeCompare(b.card.name));
    }
  }

  return sortedGroups;
}

export default function DeckEditPage({ params }: PageProps) {
  const { deckId } = use(params);
  const { data: session } = useSession();

  // UI-only state (allowed)
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'decklist'>('decklist');
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);

  const { data: deckResponse, isLoading, error } = useDeck(deckId);
  const deck = deckResponse?.deck;
  const updateDeck = useUpdateDeck();
  const addCard = useAddCardToDeck();
  const removeCard = useRemoveCardFromDeck();

  // Single centralized search hook
  const search = useCardSearch(
    {
      colorIdentity: deck?.colorIdentity ?? [],
      isCommander: true,
    },
    !!deck
  );
  const {
    cards,
    isLoading: isSearching,
    params: searchParams,
    setQuery,
    toggleColor,
    setType,
  } = search;

  const { query, type, colorIdentity } = searchParams;

  console.log(colorIdentity, deck);
  // Reset search and set base params when deck changes

  const handleAddCard = useCallback(
    async (card: ScryfallCard) => {
      try {
        await addCard.mutateAsync({
          deckId,
          scryfallCard: card,
          category: 'MAIN',
        });
      } catch (error) {
        console.error('Failed to add card:', error);
      }
    },
    [addCard, deckId]
  );

  const handleRemoveCard = useCallback(
    async (cardId: string) => {
      try {
        await removeCard.mutateAsync({ deckId, cardId });
      } catch (error) {
        console.error('Failed to remove card:', error);
      }
    },
    [removeCard, deckId]
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

  const cardGroups = groupCardsByType(deck.cards);
  const totalCards = deck.cards.reduce(
    (acc: number, c: { quantity: number }) => acc + c.quantity,
    0
  );

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
            <Link href={`/decks/${deckId}`}>
              <Button variant="outline" size="sm" className="h-8 md:h-9">
                <Eye className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">View</span>
              </Button>
            </Link>
          </div>
        </Container>
      </div>

      {/* Mobile: Compact Searchbar */}
      <div className="shrink-0 border-b px-4 py-3 md:hidden">
        <MobileCardSearchBar
          value={searchParams.query || ''}
          onChange={setQuery}
          onOpenFullSearch={() => setSearchSheetOpen(true)}
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

      {/* Desktop: Two-panel layout (hidden on mobile) */}
      <div className="hidden min-h-0 flex-1 md:flex">
        {/* Left Panel - Card Search */}
        <div className="flex w-1/2 flex-col overflow-hidden border-r">
          <div className="shrink-0 space-y-4 border-b p-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={searchParams.query || ''}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards to add..."
                className="pl-10"
              />
              {searchParams.query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-muted')}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              {searchParams.colorIdentity.length > 0 && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>Limited to:</span>
                  <ColorIdentityBadges colors={searchParams.colorIdentity} size="sm" />
                </div>
              )}
            </div>
            {showFilters && (
              <div className="bg-muted/30 flex flex-wrap items-center gap-4 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Colors:</span>
                  <div className="flex gap-1">
                    {MTG_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => toggleColor(color.value)}
                        className={cn(
                          'h-6 w-6 rounded-full text-xs font-bold transition-all',
                          color.className,
                          colorIdentity.includes(color.value)
                            ? 'ring-ring ring-2 ring-offset-1'
                            : 'opacity-50 hover:opacity-75'
                        )}
                      >
                        {color.value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Type:</span>
                  <Select value={type || ''} onValueChange={setType}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="creature">Creature</SelectItem>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="sorcery">Sorcery</SelectItem>
                      <SelectItem value="artifact">Artifact</SelectItem>
                      <SelectItem value="enchantment">Enchantment</SelectItem>
                      <SelectItem value="planeswalker">Planeswalker</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {isSearching && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-488/680 rounded-lg" />
                ))}
              </div>
            )}

            {!isSearching && cards && cards.length > 0 && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleAddCard(card)}
                    disabled={addCard.isPending}
                    className="group focus:ring-ring relative overflow-hidden rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:outline-none"
                  >
                    <CardImage card={card} size="normal" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex flex-col items-center text-white">
                        <Plus className="h-8 w-8" />
                        <span className="mt-1 text-sm font-medium">Add</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && query.length >= 3 && cards?.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No cards found matching &quot;{query}&quot;</p>
              </div>
            )}

            {!isSearching && query.length < 2 && (
              <div className="py-12 text-center">
                <Search className="text-muted-foreground mx-auto h-12 w-12" />
                <p className="text-muted-foreground mt-4">Search for cards to add to your deck</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Deck List */}
        <div className="flex w-1/2 flex-col overflow-hidden">
          <DeckCardList
            commander={deck.commander}
            cardGroups={cardGroups}
            totalCards={totalCards}
            colorIdentity={deck.colorIdentity}
            onRemoveCard={handleRemoveCard}
            isRemoving={removeCard.isPending}
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
            totalCards={totalCards}
            colorIdentity={deck.colorIdentity}
            onRemoveCard={handleRemoveCard}
            isRemoving={removeCard.isPending}
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
          <Plus className="h-6 w-6" />
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
    </div>
  );
}

interface DeckSettingsFormProps {
  deck: {
    id: string;
    name: string;
    description: string | null;
    format: string;
    isPublic: boolean;
  };
  onUpdate: (params: {
    deckId: string;
    data: { name?: string; description?: string; isPublic?: boolean };
  }) => void;
  isUpdating: boolean;
}

function DeckSettingsForm({ deck, onUpdate, isUpdating }: DeckSettingsFormProps) {
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description ?? '');
  const [isPublic, setIsPublic] = useState(deck.isPublic);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      deckId: deck.id,
      data: { name, description, isPublic },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="name">Deck Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="visibility">Visibility</Label>
        <Select
          value={isPublic ? 'public' : 'private'}
          onValueChange={(v) => setIsPublic(v === 'public')}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isUpdating}>
        {isUpdating ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}

function DeckEditSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row">
      {/* Mobile skeleton */}
      <div className="space-y-4 p-4 md:hidden">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-488/680" />
          ))}
        </div>
      </div>
      {/* Desktop skeleton */}
      <div className="hidden w-1/2 border-r p-4 md:block">
        <Skeleton className="mb-4 h-10" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-488/680" />
          ))}
        </div>
      </div>
      <div className="hidden w-1/2 p-4 md:block">
        <Skeleton className="mb-4 h-10" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
    </div>
  );
}
