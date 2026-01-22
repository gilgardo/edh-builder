'use client';

import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Menu, Plus, Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { UserMenu } from '@/components/auth/user-menu';
import { HeaderCardSearch, MobileSearch } from '@/components/layout/header-search';

const navigation = [
  { name: 'Browse Decks', href: '/decks' as Route, icon: Layers },
  { name: 'Create Deck', href: '/decks/new' as Route, icon: Plus },
];

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
                          <Image
                            src={session.user.image}
                            alt={session.user.name ?? 'User'}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full">
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
