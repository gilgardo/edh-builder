import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Mana Symbol Display */}
          <div className="mb-8 flex justify-center gap-2">
            <span className="mana-badge mana-badge-w">W</span>
            <span className="mana-badge mana-badge-u">U</span>
            <span className="mana-badge mana-badge-b">B</span>
            <span className="mana-badge mana-badge-r">R</span>
            <span className="mana-badge mana-badge-g">G</span>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            EDH Builder
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-xl text-foreground-muted md:text-2xl">
            Build, share, and discover{' '}
            <span className="font-semibold text-primary">Commander</span> decks
          </p>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-2xl text-lg text-foreground-muted">
            The ultimate MTG Commander deck builder. Search cards with Scryfall integration, analyze
            your mana curve, and share your decks with the community.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
            <Link
              href="/decks"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-lg font-medium text-foreground transition-colors hover:bg-muted"
            >
              Browse Decks
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 px-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">Card Search</h3>
            <p className="text-muted-foreground">
              Search through thousands of cards with powerful Scryfall integration and advanced
              filters.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
              <svg
                className="h-6 w-6 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">Deck Analytics</h3>
            <p className="text-muted-foreground">
              Analyze mana curves, color distribution, and card type breakdown to optimize your
              deck.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <svg
                className="h-6 w-6 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">Community</h3>
            <p className="text-muted-foreground">
              Share your decks, discover popular builds, and get inspired by other Commander
              players.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>EDH Builder - A Magic: The Gathering Commander Deck Builder</p>
          <p className="mt-2">
            Card data provided by{' '}
            <a
              href="https://scryfall.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Scryfall
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
