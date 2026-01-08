import type { Route } from 'next';
import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Browse Decks', href: '/decks' as Route },
    { name: 'Create Deck', href: '/decks/new' as Route },
    { name: 'Card Search', href: '/cards' as Route },
  ],
  resources: [
    { name: 'Scryfall', href: 'https://scryfall.com', external: true },
    { name: 'EDHREC', href: 'https://edhrec.com', external: true },
    { name: 'MTG Wiki', href: 'https://mtg.fandom.com', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
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
            <p className="mt-4 text-sm text-muted-foreground">
              Build, share, and discover Magic: The Gathering Commander decks.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal/Attribution */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={"/privacy" as Route}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={"/terms" as Route}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EDH Builder. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Card data provided by{' '}
              <a
                href="https://scryfall.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Scryfall
              </a>
              . Magic: The Gathering is a trademark of Wizards of the Coast.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
