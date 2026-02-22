'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Globe, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { DeckGallery } from '@/components/decks/deck-gallery';
import LinkWithActiveState from '@/components/ui/link-with-active-state';

export default function DecksPage() {
  const searchParams = useSearchParams();
  const isMine = searchParams.get('mine') === 'true';

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isMine ? 'My Decks' : 'Browse Decks'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isMine
                ? 'Manage your Commander deck collection'
                : 'Discover Commander decks from the community'}
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/decks/new">
              <Plus className="h-4 w-4" />
              Create Deck
            </Link>
          </Button>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex w-fit gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <LinkWithActiveState
            href="/decks"
            icon={Globe}
            label="Browse"
            isActive={!isMine}
          />
          <LinkWithActiveState
            href="/decks?mine=true"
            icon={User}
            label="My Decks"
            isActive={isMine}
          />
        </div>

        <DeckGallery mine={isMine} />
      </Container>
    </div>
  );
}
