import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Decks',
  description: 'Browse Commander decks',
};

export default function DecksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Decks</h1>
          <p className="mt-2 text-muted-foreground">Browse and discover Commander decks</p>
        </div>
        <Link
          href="/decks/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create Deck
        </Link>
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No decks found. Create your first deck to get started!</p>
      </div>
    </div>
  );
}
