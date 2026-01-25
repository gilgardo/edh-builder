# Dead Code Analysis Report

**Generated:** 2026-01-25
**Tools Used:** knip v5.82.1, depcheck
**Status:** CLEANUP COMPLETED

---

## Cleanup Summary

### Deleted Files
- `src/components/auth/index.ts` - unused barrel file
- `src/components/decks/index.ts` - unused barrel file
- `src/components/layout/index.ts` - unused barrel file
- `src/components/ui/index.ts` - unused barrel file
- `src/lib/constants.ts` - unused constants file

### Removed Code (from `src/lib/utils.ts`)
- `formatPrice()` - unused price formatter
- `parseManaSymbols()` - unused mana parser
- `getColorIdentity()` - unused color helper
- `isDeckComplete()` - unused deck validation
- `slugify()` - unused URL slug generator

### Pending (Requires Container Restart)
- `react-to-pdf` dependency removal (pnpm store issue)
- `dotenv` dev dependency removal
- `typescript-language-server` dev dependency removal

### All Verifications Passed
- TypeScript: No errors
- ESLint: No errors (1 pre-existing warning)
- Build: Successful

---

## Original Analysis Summary

| Category | Count |
|----------|-------|
| Unused Files | 6 |
| Unused Dependencies | 1 |
| Unused Dev Dependencies | 4 |
| Unused Exports | 48 |
| Unused Types | 16 |

---

## SAFE TO DELETE

### Unused Files (Barrel Index Files)

These are re-export barrel files that aren't imported anywhere:

| File | Severity | Notes |
|------|----------|-------|
| `src/lib/constants.ts` | SAFE | Unused constants file |
| `src/schemas/card.schema.ts` | CAUTION | May be needed for API validation |
| `src/components/auth/index.ts` | SAFE | Barrel re-export only |
| `src/components/decks/index.ts` | SAFE | Barrel re-export only |
| `src/components/layout/index.ts` | SAFE | Barrel re-export only |
| `src/components/ui/index.ts` | SAFE | Barrel re-export only |

### Unused Dependencies

| Package | Severity | Notes |
|---------|----------|-------|
| `react-to-pdf` | SAFE | Not imported anywhere |

### Unused Dev Dependencies

| Package | Severity | Notes |
|---------|----------|-------|
| `@tanstack/react-query-devtools` | CAUTION | May want for debugging |
| `@types/bcryptjs` | DANGER | Types for bcryptjs - DO NOT DELETE |
| `dotenv` | SAFE | Likely not needed with Next.js |
| `typescript-language-server` | SAFE | Editor tool, not needed in project |

---

## CAUTION - Review Before Deleting

### Unused Exports

These exports are not imported anywhere but may be:
- Used dynamically
- Part of public API
- Reserved for future use

#### Utility Functions (`src/lib/utils.ts`)

| Export | Line | Recommendation |
|--------|------|----------------|
| `formatPrice` | 25 | SAFE - MTG card price formatting, unused |
| `parseManaSymbols` | 40 | SAFE - Unused mana parser |
| `getColorIdentity` | 50 | SAFE - Unused color identity helper |
| `isDeckComplete` | 59 | SAFE - Unused deck validation |
| `slugify` | 75 | SAFE - Unused URL slug generator |

#### Scryfall Service (`src/services/scryfall.ts`)

| Export | Line | Recommendation |
|--------|------|----------------|
| `getCardByName` | 160 | CAUTION - May be used in future |
| `getRandomCard` | 197 | CAUTION - May be used in future |
| `searchCommanders` | 219 | CAUTION - May be used in future |

#### Auth Exports (`src/lib/auth.ts`)

| Export | Line | Recommendation |
|--------|------|----------------|
| `signIn` | 82 | KEEP - NextAuth re-export, used dynamically |
| `signOut` | 82 | KEEP - NextAuth re-export, used dynamically |

#### Deck Schemas (`src/schemas/deck.schema.ts`)

| Export | Line | Recommendation |
|--------|------|----------------|
| `ColorIdentitySchema` | 3 | CAUTION - API schema |
| `DeckFormatSchema` | 5 | CAUTION - API schema |
| `ScryfallCardSchema` | 24 | CAUTION - API schema |
| `RemoveCardFromDeckSchema` | 80 | CAUTION - API schema |

#### Social Schemas (`src/schemas/social.schema.ts`)

| Export | Line | Recommendation |
|--------|------|----------------|
| `FollowUserSchema` | 7 | CAUTION - API schema |
| `NotificationFiltersSchema` | 69 | CAUTION - API schema |

#### Deck Utils (`src/lib/deck-utils.ts`)

| Export | Line | Recommendation |
|--------|------|----------------|
| `CARD_TYPE_ORDER` | 11 | SAFE - Unused constant |
| `getCardType` | 27 | CAUTION - May be used |
| `getDisplayCardImageUrl` | 151 | KEEP - Used via re-export |

#### Hooks Index (`src/hooks/index.ts`)

These are re-exported hooks. Many are unused in the barrel but used via direct imports:

| Export | Notes |
|--------|-------|
| `useCardSearch` | Used directly |
| `useDeck`, `useUpdateDeck`, `useDeleteDeck` | Used directly |
| `useDecks`, `useCreateDeck` | Used directly |
| `useAddCardToDeck`, `useRemoveCardFromDeck` | Used directly |
| `useDeckSearch` | May be unused |
| `useUpdateUserProfile` | Used via direct import |
| `useCollaborators`, etc. | Used via direct imports |
| `useLikeDeck`, `useUnlikeDeck`, `useToggleDeckLike` | May be unused |

#### UI Components

Many UI components export internal primitives that aren't used:

| File | Unused Export | Notes |
|------|---------------|-------|
| `card.tsx` | `cardVariants`, `CardProps` | Used internally, exported for extensibility |
| `badge.tsx` | `badgeVariants`, `BadgeProps` | Same |
| `input.tsx` | `inputVariants`, `InputProps` | Same |
| `button.tsx` | `ButtonProps` | Same |
| `dialog.tsx` | `DialogPortal`, `DialogOverlay`, `DialogClose` | Shadcn convention |
| `sheet.tsx` | `SheetPortal`, `SheetOverlay`, `SheetClose`, `SheetFooter` | Same |
| `dropdown-menu.tsx` | Multiple primitives | Same |
| `select.tsx` | Multiple primitives | Same |
| `alert-dialog.tsx` | Multiple primitives | Same |
| `tabs.tsx` | `TabsContent` | KEEP - Used dynamically |
| `tooltip.tsx` | All exports | KEEP - Used dynamically |

#### Profile Components (`src/components/profile/index.ts`)

| Export | Notes |
|--------|-------|
| `FollowButton` | Used directly |
| `UserProfileCard` | May be unused |
| `UserStats` | May be unused |

#### Reviews Components (`src/components/reviews/index.ts`)

| Export | Notes |
|--------|-------|
| `RatingStars`, `RatingDisplay` | Used directly |
| `ReviewForm` | Used directly |
| `ReviewCard` | Used directly |

#### Collaboration Components (`src/components/collaboration/index.ts`)

| Export | Notes |
|--------|-------|
| `CollaborationBadge` | May be unused via barrel |
| `InviteCollaboratorDialog` | May be unused via barrel |

---

## DANGER - Do NOT Delete

### Type Exports

These type exports may appear unused but are consumed by TypeScript:

| File | Type | Notes |
|------|------|-------|
| `src/types/scryfall.types.ts` | `ScryfallResponse` | API response type |
| `src/types/scryfall.types.ts` | `isLegalCommander` | Helper function |
| `src/types/cards.ts` | `toDisplayCard` | Transform function |
| `src/types/social.types.ts` | All types | Used in API responses |
| `src/schemas/deck.schema.ts` | All types | Zod inferred types |
| `src/schemas/social.schema.ts` | All types | Zod inferred types |

### Notification Service

| Export | Notes |
|--------|-------|
| `cleanupOldNotifications` | May be used in cron job |

---

## Recommendations

### Immediate Actions (SAFE)

1. **Remove unused dependency:**
   ```bash
   docker exec edh-builder-app pnpm remove react-to-pdf
   ```

2. **Remove dev dependencies (optional):**
   ```bash
   docker exec edh-builder-app pnpm remove -D dotenv typescript-language-server
   ```

3. **Delete unused barrel files:**
   - `src/components/auth/index.ts`
   - `src/components/decks/index.ts`
   - `src/components/layout/index.ts`
   - `src/components/ui/index.ts`

4. **Clean up `src/lib/utils.ts`:**
   - Remove `formatPrice`
   - Remove `parseManaSymbols`
   - Remove `getColorIdentity`
   - Remove `isDeckComplete`
   - Remove `slugify`

5. **Clean up `src/lib/deck-utils.ts`:**
   - Remove `CARD_TYPE_ORDER` if not needed

### Deferred Actions (CAUTION)

1. Review Scryfall service exports - may be needed for features
2. Review schema exports - needed for API validation
3. Keep hook barrel exports - allows clean imports

### Never Delete

1. `@types/bcryptjs` - TypeScript needs this
2. Shadcn UI primitives - convention to export all
3. Type definitions - used by TypeScript

---

## Test Verification

Before deleting any code, run:

```bash
docker exec edh-builder-app pnpm typecheck
docker exec edh-builder-app pnpm lint
docker exec edh-builder-app pnpm build
```

After each deletion, re-run all checks.
