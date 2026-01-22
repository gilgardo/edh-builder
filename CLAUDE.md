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
- **Containerization**: Docker + Docker Compose
- **Deployment**: Vercel

## Docker Development Environment

**IMPORTANT**: This project runs entirely in Docker containers. There is no local `node_modules` folder - all dependencies are installed inside the container.

### Container Names
- `edh-builder-app` - Next.js application (port 3001) with development tools
- `edh-builder-db` - PostgreSQL database (port 5432)
- `edh-builder-prisma-studio` - Prisma Studio (port 5555, optional)

### Running Commands
All pnpm commands must be executed inside the container:

```bash
# Pattern: docker exec <container-name> <command>
docker exec edh-builder-app pnpm typecheck
docker exec edh-builder-app pnpm lint
docker exec edh-builder-app pnpm build
```

### Base Image Features

The Dockerfile.dev now includes:
- **Development tools**: zsh, fzf, git-delta, neovim, gh, iptables/ipset for firewall
- **AI assistants**: Claude Code and crush CLI installed globally
- **Terminal configuration**: Zsh with powerline10k theme, bash history persistence
- **Firewall**: Custom iptables firewall script restricting outbound traffic
- **GitHub config imports**: Placeholders for cloning terminal and nvim configs from GitHub
- **pnpm**: Corepack enabled with latest pnpm
- **Editor**: Neovim set as default editor (EDITOR/VISUAL=nvim)

**Note**: Update the placeholder GitHub URLs in Dockerfile.dev with your actual config repositories.

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

**All commands must be run inside the Docker container using `docker exec`.**

```bash
# Docker Compose
docker compose up -d        # Start all containers
docker compose down         # Stop all containers
docker compose logs -f app  # Follow app logs

# Development (run inside container)
docker exec edh-builder-app pnpm build        # Production build
docker exec edh-builder-app pnpm lint         # Run ESLint
docker exec edh-builder-app pnpm lint:fix     # Fix ESLint errors
docker exec edh-builder-app pnpm format       # Run Prettier
docker exec edh-builder-app pnpm typecheck    # TypeScript check

# Database (run inside container)
docker exec edh-builder-app pnpm db:generate  # Generate Prisma client
docker exec edh-builder-app pnpm db:migrate   # Run migrations
docker exec edh-builder-app pnpm db:push      # Push schema to DB
docker exec edh-builder-app pnpm db:seed      # Seed database

# Prisma Studio (use dedicated container)
docker compose --profile tools up prisma-studio
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

### Docker Setup
- Base image: Custom Node.js 20 with development tools (zsh, fzf, git-delta, neovim, firewall)
- Includes crush CLI assistant and Claude Code for terminal AI assistance
- Terminal and nvim configs imported from GitHub (placeholder URLs)
- Source code is mounted as a volume for hot reload
- `node_modules` lives only inside the container (not on host)
- Prisma client is persisted in a named volume between rebuilds
- App runs on `http://localhost:3001` (mapped from container port 3000)

### Tailwind v4
This project uses Tailwind CSS v4 with CSS-based configuration. Colors are defined in `src/app/globals.css` using the `@theme inline` directive.

### NextAuth v5
Using the beta version of NextAuth v5. Configuration is in `src/lib/auth.ts`.

### Prisma
Prisma client is generated to `node_modules/.prisma/client`. Run `docker exec edh-builder-app pnpm db:generate` after schema changes.

### Useful Aliases (optional)
Add to your shell config for convenience:
```bash
alias edh="docker exec edh-builder-app"
# Usage: edh pnpm typecheck
```
