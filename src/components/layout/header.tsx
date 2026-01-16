'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, Plus, Search, Layers, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { UserMenu } from '@/components/auth/user-menu';
import { Input } from '@/components/ui/input';
import { useCardSearch } from '@/hooks/use-card-search';
import { CardRow } from '@/components/cards/card-row';
import { toDisplayCard } from '@/types/cards';
import type { ScryfallCard } from '@/types/scryfall.types';

const navigation = [
  { name: 'Browse Decks', href: '/decks' as Route, icon: Layers },
  { name: 'Create Deck', href: '/decks/new' as Route, icon: Plus },
];

function HeaderCardSearch() {
  const { cards, isLoading, params, setQuery, reset } = useCardSearch();
  const [showResults, setShowResults] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  const hasQuery = (params.query ?? '').length > 0;
  const hasResults = cards.length > 0 && (params.query ?? '').length >= 3;
  const clippedCards = (cards as ScryfallCard[]).slice(0, 6);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="group relative flex items-center">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 h-4 w-4" />
        <Input
          ref={inputRef}
          value={params.query ?? ''}
          onChange={handleChange}
          onFocus={() => setShowResults(true)}
          placeholder="Search cards..."
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

      {showResults && (params.query ?? '').length >= 3 && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
          )}

          {!isLoading && hasResults && (
            <div className="flex max-h-80 flex-col gap-1 overflow-auto">
              {clippedCards.map((card) => (
                <CardRow
                  key={card.id}
                  card={toDisplayCard(card)}
                  variant="search"
                  className="hover:bg-muted cursor-pointer rounded-md border border-transparent px-1 py-1"
                />
              ))}
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No cards found</div>
          )}
        </div>
      )}
    </div>
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
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
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
