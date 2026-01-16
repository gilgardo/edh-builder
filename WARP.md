# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core commands

### Local (no Docker)

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev` (Next.js dev server on port 3000)
- Production build: `pnpm build` then `pnpm start`
- Lint: `pnpm lint`
- Lint with auto-fix: `pnpm lint:fix`
- Format code: `pnpm format`
- Check formatting: `pnpm format:check`
- Typecheck: `pnpm typecheck`

Database / Prisma:

- Generate Prisma client: `pnpm db:generate`
- Run dev migrations: `pnpm db:migrate`
- Push schema (non-migration envs): `pnpm db:push`
- Open Prisma Studio: `pnpm db:studio`
- Seed database: `pnpm db:seed`

Testing:

- There is currently no `test` script defined in `package.json`. Add one (e.g. using Jest, Vitest, or Playwright) before relying on automated tests.

### Docker + Makefile workflow

The Makefile wraps the Docker Compose setup and Prisma commands.

- Build dev containers: `make build`
- Start dev stack (app + Postgres): `make up` (app on `http://localhost:3001`)
- Stop dev stack: `make down`
- Restart: `make restart`
- Logs: `make logs`, `make logs-app`, `make logs-db`
- Shell into app container: `make shell`
- Shell into DB (psql): `make shell-db`

Database via containers:

- Push schema: `make db-push`
- Run migrations: `make db-migrate`
- Regenerate Prisma client: `make db-generate`
- Seed DB: `make db-seed`
- Prisma Studio: `make db-studio` (exposed on port 5555)

Code quality via containers:

- Lint: `make lint`
- Lint with auto-fix: `make lint-fix`
- Typecheck: `make typecheck`
- Format: `make format`

Production Docker:

- Build production image: `make build-prod`
- Start production stack: `make up-prod`
- Stop production stack: `make down-prod`
- Logs: `make logs-prod`

Cleanup / health:

- Stop and remove volumes: `make clean`
- Remove all containers/images/volumes: `make clean-all`
- Docker system prune: `make prune`
- Service status: `make status`
- Health check (app + DB): `make health`

Database initialization notes:

- On first run, `make up` will bring up Postgres and the app and then run `make db-push`. If you see `The table "public.decks" does not exist`, run `make db-migrate` (or `pnpm db:migrate` against the same `DATABASE_URL`).
- If you see foreign key errors like `decks_user_id_fkey`, the authenticated user id does not exist in `users`. Ensure you have registered/logged in successfully via NextAuth before creating decks.

## Environment & configuration

### Environment variables

Defined in `.env.local` (see `.env.example` if present):

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GITHUB_ID`, `GITHUB_SECRET`
- `GOOGLE_ID`, `GOOGLE_SECRET`
- `DISCORD_ID`, `DISCORD_SECRET`

These power Prisma/Postgres and NextAuth (credentials + OAuth providers).

### Next.js and TypeScript

- Next.js App Router app using `src/app`.
- `next.config.ts`:
  - `reactStrictMode: true`
  - `output: 'standalone'` for Docker/Vercel
  - `typedRoutes: true` (prefer `Route` types from `next` when building links)
  - `images.remotePatterns` allow Scryfall image domains (`cards.scryfall.io`, `c1.scryfall.com`).
- TypeScript is configured in strict mode with many additional safety flags.
- Path alias: `@/*` → `./src/*` (defined in `tsconfig.json`). Use this alias consistently for imports.

### Linting, formatting, and styling

- ESLint is configured via `eslint.config.mjs` using `eslint-config-next` + `eslint-config-prettier`.
  - Notable rules: no `any`, no unused vars unless prefixed with `_`, `no-console` except `console.warn` / `console.error`.
- Prettier is configured with Tailwind formatting via `prettier-plugin-tailwindcss`.
- Tailwind CSS v4 is configured via CSS in `src/app/globals.css` (no classic `tailwind.config.js`). MTG-themed colors and guild gradients are defined there.

## High-level architecture

### Overall

- Full-stack Next.js (App Router) app located under `src/app`.
- PostgreSQL database via Prisma (`prisma/schema.prisma`, client in `src/lib/prisma.ts`).
- Server state and caching via TanStack Query v5 (React Query) provided by `QueryProvider`.
- Authentication via NextAuth v5 with a Prisma adapter configured in `src/lib/auth.ts`.

### Layout & providers

- Root layout: `src/app/layout.tsx`
  - Imports global styles and Geist fonts.
  - Wraps the app with:
    - `AuthProvider` (`src/providers/auth-provider.tsx`) → NextAuth `SessionProvider` (base path `/api/auth`).
    - `QueryProvider` (`src/providers/query-provider.tsx`) → shared `QueryClient` and React Query Devtools.
    - `TooltipProvider` and chroming (`Header`, `Footer` from `src/components/layout`).
  - This is the correct place to add new global providers (feature flags, theming, etc.).

### Routing & feature areas

- Landing / marketing:
  - `/` → `src/app/page.tsx`: marketing home with CTAs to `/decks` and `/decks/new`.

- Auth group (`src/app/(auth)`):
  - `/login` → `src/app/(auth)/login/page.tsx`
  - `/register` → `src/app/(auth)/register/page.tsx`
  - Uses components from `src/components/auth` and redirects to `/decks` after success.

- Main app group (`src/app/(main)`):
  - `/decks` → `src/app/(main)/decks/page.tsx`
    - Uses `DeckGallery` (in `src/components/decks`) and a "Browse" vs "My Decks" toggle via the `?mine=true` query param.
  - `/decks/new` → `src/app/(main)/decks/new/page.tsx`
    - Two-step deck creation wizard:
      - Step 1: commander selection via `useCardSearch({ isCommander: true })` and Scryfall-backed search results.
      - Step 2: deck metadata form (`react-hook-form` + Zod) for name, description, format, and visibility.
      - On submit, calls `useCreateDeck` to POST `/api/decks`, then `useAddCardToDeck` to sync the commander card and redirects to `/decks/[deckId]/edit`.
  - `/decks/[deckId]` → `src/app/(main)/decks/[deckId]/page.tsx`
    - Uses `useDeck` to fetch a deck with relations.
    - Shows commander panel, card list grouped by type, mana curve, color identity, tags, and basic stats.
    - Owner-only edit/delete actions plus like/share actions.

- API routes (`src/app/api`):
  - Auth:
    - `auth/[...nextauth]/route.ts` → NextAuth handlers from `src/lib/auth.ts`.
    - `auth/register/route.ts` → email/password registration using Zod auth schemas and Prisma `User`.
  - Cards:
    - `cards/route.ts` → card search endpoint (validated via `src/schemas/card.schema.ts`, calls `src/services/scryfall.ts`).
    - `cards/[scryfallId]/route.ts` → card details by Scryfall id.
  - Decks:
    - `decks/route.ts` → list+create decks with filtering/pagination using `DeckFiltersSchema` and Prisma.
    - `decks/[deckId]/route.ts` → CRUD operations and deck-card manipulation for individual decks.
  - Health:
    - `health/route.ts` → simple health check used by `make health`.

### Domain model & persistence

- Prisma schema (`prisma/schema.prisma`) models Commander decks and cards:
  - `User` with optional profile (`username`, `bio`) and NextAuth relations (`accounts`, `sessions`).
  - `Card` mirrors Scryfall data (IDs, type line, oracle text, colors, color identity, legality, image URIs, pricing, set info, rarity).
  - `Deck` models commander decks and links to `User`, `Card` commander/partner, and statistics such as `cardCount`, `avgCmc`, and `colorIdentity`.
  - `DeckCard` joins `Deck` and `Card` with `quantity` and `category` (`MAIN`, `COMMANDER`, `SIDEBOARD`, `CONSIDERING`).
  - `FavoriteDeck`, `Tag`, `DeckTag` model favorites and tagging for decks.
  - All tables are snake_case at the DB level via `@map`, while the Prisma client uses camelCase.

- Card synchronization:
  - `src/lib/card-sync.ts` exposes `syncCardFromScryfall` which upserts Scryfall card data into `Card`.
  - Handles double-faced cards, commander legality, and price fields.
  - Use this helper whenever you need to persist a Scryfall card before attaching it to a deck.

## Client-side data layer

- React Query setup:
  - `QueryProvider` in `src/providers/query-provider.tsx` creates and shares a `QueryClient` between components.
  - Default query options: 1-minute `staleTime`, 5-minute `gcTime`, `retry` once, and no refetch on window focus.

- Deck hooks (`src/hooks`):
  - `useDeck(deckId)` → fetches `/api/decks/[deckId]`, returning `{ deck, isLiked }`.
  - `useUpdateDeck()` → wraps PUT `/api/decks/[deckId]` and invalidates both `['deck', deckId]` and `['decks']`.
  - `useDeleteDeck()` → wraps DELETE `/api/decks/[deckId]` and invalidates `['decks']`.
  - `useDecks(filters)` → fetches `/api/decks` with search, color identity, format, visibility, user, and pagination filters.
  - `useCreateDeck()` → wraps POST `/api/decks` and invalidates `['decks']` on success.
  - `useAddCardToDeck` / `useRemoveCardFromDeck` (in `src/hooks/use-deck-cards.ts`) manage deck contents via API.

## Card search pipeline (important invariants)

Card search is intentionally centralized; do not reimplement this logic per page.

- Core hook: `src/hooks/use-card-search.ts`
  - Manages search state with a reducer over `SearchParams` (query, colors, color identity, type, CMC + operator, rarity, `isCommander`, page).
  - Exposes derived data: `cards`, `total`, `hasMore`, `page`.
  - Exposes actions: `setQuery`, `toggleColor`, `setType`, `setCmc`, `setRarity`, `nextPage`, `prevPage`, `reset`.
  - Accepts an optional `options` object (e.g. fixed `colorIdentity`, `isCommander`, initial `query`), which is merged into reducer state and used as part of the React Query key.
  - Calls `/api/cards` via `fetch` with serialized search params and uses React Query for caching and pagination.

- Usage rules (summarized from `TASK.MD`):
  - Pages and components must not manage card-search state with `useState` (e.g. `const [searchQuery, setSearchQuery] = useState('')`).
  - Do not call `useQuery` directly for card search; always go through `useCardSearch`.
  - Use a single `useCardSearch()` instance per screen and wire all search inputs (desktop + mobile) to its actions (`setQuery`, `toggleColor`, etc.).
  - To add new search features (e.g. commander mode, rarity filters, color-identity locking), extend the reducer + actions in `use-card-search.ts` and pass new options to the hook, rather than storing extra state in pages.
  - When the deck or page context changes (e.g. switching to a different deck edit page), reset search state via the hook (e.g. call `reset()` and any "set base params" action) rather than letting stale params leak between contexts.

- Server side:
  - Card-related API routes validate incoming queries with `CardSearchSchema` / `CardFiltersSchema` (`src/schemas/card.schema.ts`).
  - `src/services/scryfall.ts` builds Scryfall queries from validated filters, enforces Scryfall rate limits, and maps responses to typed card objects.

## UI & design system

- UI primitives:
  - `src/components/ui` contains the shadcn-style components (button, card, input, select, dialog, tooltip, etc.).
  - `components.json` configures these components and aliases (`@/components`, `@/lib/utils`, `@/hooks`).

- Layout and navigation:
  - `src/components/layout/header.tsx` and `footer.tsx` draw the global navigation and footer.
  - `src/components/layout/container.tsx` provides a responsive width-constrained wrapper used throughout pages.

- Domain-specific components:
  - Cards (`src/components/cards`): card image display, mana cost rendering, color identity badges, grid/sheet views, and mobile search controls.
  - Decks (`src/components/decks`): gallery tiles (`DeckCard`), deck list layouts, and related deck browsing UI.
  - Auth (`src/components/auth`): login/register forms and OAuth button group.

- Styling conventions:
  - Tailwind classes are heavily used; MTG-specific styles such as `mana-badge-*`, `bg-mtg-*-500`, and guild gradients (`gradient-azorius`, etc.) are defined in `globals.css`.

## When extending this codebase

Project-specific guidance (derived from `CLAUDE.md` and `TASK.MD`):

- Keep validation, persistence, and transport concerns separate:
  - Define request/response shapes with Zod schemas in `src/schemas`.
  - Use Prisma and `src/lib/card-sync.ts` for DB writes/reads.
  - Map between HTTP and domain models in API route handlers under `src/app/api`.

- Preserve single sources of truth:
  - For card search, extend `useCardSearch` instead of adding ad-hoc `useState` or `useQuery` calls.
  - For decks, add new capabilities to the existing deck hooks (`useDeck`, `useDecks`, `useCreateDeck`, etc.) and reuse them from pages/components.

- Respect MTG Commander rules baked into the model:
  - Deck rules (commander, deck size, color identity, no duplicates except basic lands) are represented across Zod schemas, Prisma models, and helpers in `src/lib/utils.ts` and `src/lib/constants.ts`.
  - New features that manipulate decks or cards should reuse these helpers and types instead of duplicating logic.
