import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { DeckGallery } from '@/components/decks/deck-gallery';

export const metadata: Metadata = {
  title: 'Browse Decks',
  description: 'Browse and discover Magic: The Gathering Commander decks.',
};

export default function DecksPage() {
  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse Decks</h1>
            <p className="mt-2 text-muted-foreground">
              Discover Commander decks from the community
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/decks/new">
              <Plus className="h-4 w-4" />
              Create Deck
            </Link>
          </Button>
        </div>

        {/* Deck Gallery */}
        <DeckGallery />
      </Container>
    </div>
  );
}
