# EDH Builder - MTG Commander Deck Builder

## Project Overview

EDH Builder is a web application for building, sharing, and discovering Magic: The Gathering Commander (EDH) decks. Built with Next.js 15, TypeScript, and a modern full-stack architecture.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with MTG-themed color palette
- **Database**: PostgreSQL with Prisma ORM v6
- **Authentication**: NextAuth.js v5 with Prisma adapter
- **State Management**: TanStack Query (React Query) v5
- **Validation**: Zod schemas
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (main)/            # Main app (dashboard, decks, cards)
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base components (button, input, card)
│   ├── layout/            # Header, footer, nav
│   ├── cards/             # MTG card components
│   ├── decks/             # Deck-related components
│   └── auth/              # Auth forms
├── lib/                   # Core utilities
│   ├── prisma.ts          # Prisma singleton
│   ├── auth.ts            # NextAuth config
│   ├── utils.ts           # Helpers (cn, formatDate, etc.)
│   └── constants.ts       # App constants (colors, formats)
├── hooks/                 # Custom React hooks
├── services/              # API service layers
├── providers/             # React context providers
├── schemas/               # Zod validation schemas
└── types/                 # TypeScript type definitions
```

## Key Conventions

### File Naming
- Components: kebab-case (`card-display.tsx`)
- Utilities/hooks: kebab-case (`use-deck.ts`)
- Types: kebab-case with `.types.ts` suffix
- Schemas: kebab-case with `.schema.ts` suffix

### Component Organization
- UI components in `components/ui/` - reusable, design-system level
- Feature components organized by domain (`cards/`, `decks/`, `auth/`)
- Each component should have single responsibility

### Data Fetching
- Use TanStack Query for server state
- API routes in `app/api/` follow RESTful conventions

### Database
- Prisma schema in `prisma/schema.prisma`
- Use cuid() for IDs
- Always use `@map()` for snake_case DB columns
- Relations should cascade delete where appropriate

## MTG Domain Knowledge

### Colors
- 5 colors: White (W), Blue (U), Black (B), Red (R), Green (G)
- Colorless is not a color but an identity (C)

### Commander Format Rules
- 100 cards total (1 commander + 99 others)
- Commander must be a legendary creature (or specific planeswalkers)
- Deck color identity limited by commander's color identity
- No card duplicates except basic lands

### Guild Names (Two-Color Combinations)
- WU: Azorius | UB: Dimir | BR: Rakdos | RG: Gruul | GW: Selesnya
- WB: Orzhov | UR: Izzet | BG: Golgari | RW: Boros | GU: Simic

### Scryfall API
- Primary card data source: https://scryfall.com/docs/api
- Rate limit: 10 requests/second
- Cache card data locally when possible

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix ESLint errors
pnpm format                 # Run Prettier
pnpm typecheck              # TypeScript check

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run migrations
pnpm db:push                # Push schema to DB
pnpm db:studio              # Open Prisma Studio
pnpm db:seed                # Seed database
```

## Environment Variables

Required in `.env.local` (see `.env.example`):
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=
DISCORD_ID=
DISCORD_SECRET=
```

## API Routes

- `GET /api/decks` - List decks (with filters)
- `POST /api/decks` - Create deck
- `GET /api/decks/[deckId]` - Get deck details
- `PUT /api/decks/[deckId]` - Update deck
- `DELETE /api/decks/[deckId]` - Delete deck
- `GET /api/cards` - Search cards
- `GET /api/cards/[cardId]` - Get card details
- `GET /api/scryfall` - Proxy to Scryfall API

## Color Palette Reference

### MTG Mana Colors (Tailwind classes)
- White: `bg-mtg-white-500` (#f8f6d8)
- Blue: `bg-mtg-blue-500` (#0e68ab)
- Black: `bg-mtg-black-500` (#150b00)
- Red: `bg-mtg-red-500` (#d3202a)
- Green: `bg-mtg-green-500` (#00733e)
- Colorless: `bg-mtg-colorless-500` (#8b8b8b)

### UI Colors (CSS Variables)
- Primary: Purple/blue (card back inspired) - `bg-primary`
- Secondary: Muted gold - `bg-secondary`
- Accent: Teal - `bg-accent`

### Guild Gradients
Available classes: `gradient-azorius`, `gradient-dimir`, `gradient-rakdos`, etc.

## CSS Components

### Mana Badges
```html
<span class="mana-badge mana-badge-w">W</span>
<span class="mana-badge mana-badge-u">U</span>
<span class="mana-badge mana-badge-b">B</span>
<span class="mana-badge mana-badge-r">R</span>
<span class="mana-badge mana-badge-g">G</span>
```

### MTG Card Display
```html
<div class="mtg-card">
  <!-- Card content -->
</div>
```

## Development Notes

### Tailwind v4
This project uses Tailwind CSS v4 with CSS-based configuration. Colors are defined in `src/app/globals.css` using the `@theme inline` directive.

### NextAuth v5
Using the beta version of NextAuth v5. Configuration is in `src/lib/auth.ts`.

### Prisma
Prisma client is generated to `node_modules/.prisma/client`. Run `pnpm db:generate` after schema changes.
