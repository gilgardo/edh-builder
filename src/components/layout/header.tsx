'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Menu, Plus, Search, Layers, X, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { UserMenu } from '@/components/auth/user-menu';
import { Input } from '@/components/ui/input';
import { useCardSearch } from '@/hooks/use-card-search';
import { ManaCost } from '@/components/cards/mana-cost';
import { getCardImageUrl, getCardManaCost } from '@/services/scryfall';
import type { ScryfallCard } from '@/types/scryfall.types';

const navigation = [
  { name: 'Browse Decks', href: '/decks' as Route, icon: Layers },
  { name: 'Create Deck', href: '/decks/new' as Route, icon: Plus },
];

// Deck type for search results
type DeckSearchResult = {
  id: string;
  name: string;
  format: string;
  colorIdentity: string[];
  user: { name: string | null };
  commander?: { name: string } | null;
};

// Hook to search decks
function useDeckSearch(query: string) {
  return useQuery({
    queryKey: ['decks-search', query],
    queryFn: async () => {
      const res = await fetch(`/api/decks?search=${encodeURIComponent(query)}&limit=4`);
      if (!res.ok) throw new Error('Failed to search decks');
      const data = await res.json();
      return data.decks as DeckSearchResult[];
    },
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000,
  });
}

// Card preview dialog
function CardPreviewDialog({
  card,
  open,
  onClose,
}: {
  card: ScryfallCard | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!card) return null;

  const imageUrl = getCardImageUrl(card, 'normal');
  const manaCost = getCardManaCost(card);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-4">
        <DialogTitle className="sr-only">{card.name}</DialogTitle>
        <div className="flex flex-col items-center gap-4">
          <Image
            src={imageUrl}
            alt={card.name}
            width={300}
            height={418}
            className="rounded-lg shadow-lg"
            priority
          />
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{card.name}</h3>
              {manaCost && <ManaCost cost={manaCost} size="md" />}
            </div>
            <p className="text-sm text-muted-foreground">{card.type_line}</p>
            {card.oracle_text && (
              <p className="text-sm whitespace-pre-line">{card.oracle_text}</p>
            )}
            {(card.power || card.toughness) && (
              <p className="text-sm font-medium">
                {card.power}/{card.toughness}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Search result row with arrow icon
function SearchResultRow({
  card,
  onPreview,
}: {
  card: ScryfallCard;
  onPreview: (card: ScryfallCard) => void;
}) {
  const manaCost = getCardManaCost(card);

  return (
    <div
      className="hover:bg-muted/50 group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer"
      onClick={() => onPreview(card)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {manaCost && <ManaCost cost={manaCost} size="sm" />}
        <span className="truncate text-sm font-medium">{card.name}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Deck result row
function DeckResultRow({ deck }: { deck: DeckSearchResult }) {
  return (
    <Link
      href={`/decks/${deck.id}` as Route}
      className="hover:bg-muted/50 group flex items-center justify-between rounded-md px-2 py-1.5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{deck.name}</span>
        <span className="text-xs text-muted-foreground">
          {deck.commander?.name ? `${deck.commander.name} • ` : ''}
          {deck.user.name ?? 'Anonymous'}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function HeaderCardSearch() {
  const { cards, isLoading, params, setQuery, reset } = useCardSearch();
  const [showResults, setShowResults] = useState(false);
  const [previewCard, setPreviewCard] = useState<ScryfallCard | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const queryStr = params.query ?? '';
  const { data: decks, isLoading: decksLoading } = useDeckSearch(queryStr);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setQuery(value);
      setShowResults(Boolean(value));
    },
    [setQuery]
  );

  const handleClear = useCallback(() => {
    reset();
    setShowResults(false);
    inputRef.current?.blur();
  }, [reset]);

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;
    if (!containerRef.current.contains(event.target as Node)) {
      setShowResults(false);
    }
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowResults(true);
      }
      if (e.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  const hasQuery = queryStr.length > 0;
  const hasCardResults = cards.length > 0 && queryStr.length >= 3;
  const hasDeckResults = (decks?.length ?? 0) > 0 && queryStr.length >= 3;
  const clippedCards = (cards as ScryfallCard[]).slice(0, 4);
  const anyLoading = isLoading || decksLoading;

  return (
    <>
      <div ref={containerRef} className="relative hidden md:block">
        <div className="group relative flex items-center">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 h-4 w-4" />
          <Input
            ref={inputRef}
            value={queryStr}
            onChange={handleChange}
            onFocus={() => setShowResults(true)}
            placeholder="Search cards & decks..."
            className="w-9 cursor-text rounded-full border-border bg-background pl-8 pr-3 text-sm transition-[width,padding] duration-200 ease-out focus:w-72 focus:pl-8 focus:pr-8 group-hover:w-72 group-hover:pl-8 group-hover:pr-8"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground absolute right-2 flex h-6 w-6 items-center justify-center"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {showResults && queryStr.length >= 3 && (
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
            {anyLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
            )}

            {!anyLoading && (hasCardResults || hasDeckResults) && (
              <div className="flex max-h-96 flex-col overflow-auto">
                {hasCardResults && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Cards</div>
                    {clippedCards.map((card) => (
                      <SearchResultRow key={card.id} card={card} onPreview={setPreviewCard} />
                    ))}
                  </div>
                )}
                {hasDeckResults && (
                  <div className="p-1 border-t border-border">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Decks</div>
                    {decks?.map((deck) => (
                      <DeckResultRow key={deck.id} deck={deck} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!anyLoading && !hasCardResults && !hasDeckResults && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
            )}
          </div>
        )}
      </div>

      <CardPreviewDialog
        card={previewCard}
        open={!!previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </>
  );
}

// Mobile search component
function MobileSearch() {
  const [open, setOpen] = useState(false);
  const { cards, isLoading, params, setQuery, reset } = useCardSearch();
  const [previewCard, setPreviewCard] = useState<ScryfallCard | null>(null);

  const queryStr = params.query ?? '';
  const { data: decks, isLoading: decksLoading } = useDeckSearch(queryStr);

  const hasCardResults = cards.length > 0 && queryStr.length >= 3;
  const hasDeckResults = (decks?.length ?? 0) > 0 && queryStr.length >= 3;
  const anyLoading = isLoading || decksLoading;

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Search className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="top" className="h-[80vh]">
          <SheetTitle className="sr-only">Search</SheetTitle>
          <div className="flex flex-col h-full gap-4 pt-4">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                value={queryStr}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards & decks..."
                className="pl-10 pr-10"
                autoFocus
              />
              {queryStr && (
                <button
                  type="button"
                  onClick={() => reset()}
                  className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {anyLoading && queryStr.length >= 3 && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</div>
              )}

              {!anyLoading && queryStr.length >= 3 && (hasCardResults || hasDeckResults) && (
                <div className="flex flex-col gap-4">
                  {hasCardResults && (
                    <div>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Cards</div>
                      <div className="flex flex-col gap-1">
                        {(cards as ScryfallCard[]).slice(0, 8).map((card) => (
                          <SearchResultRow key={card.id} card={card} onPreview={(c) => { setPreviewCard(c); }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {hasDeckResults && (
                    <div>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Decks</div>
                      <div className="flex flex-col gap-1">
                        {decks?.map((deck) => (
                          <DeckResultRow key={deck.id} deck={deck} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!anyLoading && queryStr.length >= 3 && !hasCardResults && !hasDeckResults && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">No results found</div>
              )}

              {queryStr.length < 3 && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Type at least 3 characters to search
                </div>
              )}
            </div>
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

export function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="mana-badge mana-badge-w text-xs">W</span>
              <span className="mana-badge mana-badge-u text-xs">U</span>
              <span className="mana-badge mana-badge-b text-xs">B</span>
              <span className="mana-badge mana-badge-r text-xs">R</span>
              <span className="mana-badge mana-badge-g text-xs">G</span>
            </div>
            <span className="text-xl font-bold text-foreground">EDH Builder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-4 md:flex">
          {/* Expanding card search */}
          <HeaderCardSearch />

          {/* Auth Section */}
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <MobileSearch />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-75 sm:w-100">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-6 py-6">
                {/* Mobile Logo */}
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <span className="mana-badge mana-badge-w text-xs">W</span>
                    <span className="mana-badge mana-badge-u text-xs">U</span>
                    <span className="mana-badge mana-badge-b text-xs">B</span>
                    <span className="mana-badge mana-badge-r text-xs">R</span>
                    <span className="mana-badge mana-badge-g text-xs">G</span>
                  </div>
                  <span className="text-lg font-bold">EDH Builder</span>
                </Link>

                {/* Mobile Navigation */}
                <div className="flex flex-col gap-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Mobile Auth */}
                <div className="mt-auto border-t border-border pt-6">
                  {session?.user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {session.user.image ? (
                          <img
                            src={session.user.image}
                            alt={session.user.name ?? 'User'}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            {session.user.name?.charAt(0) ?? 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{session.user.name}</p>
                          <p className="text-sm text-muted-foreground">{session.user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={"/profile" as Route}
                          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                          My Profile
                        </Link>
                        <Link
                          href={"/decks?mine=true" as Route}
                          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                          My Decks
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button asChild>
                        <Link href="/register">Get Started</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/login">Sign in</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
