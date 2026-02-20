# Implementation Plan: Frontend Refactoring

## Overview

This plan addresses 5 frontend refactoring issues in the EDH Builder project: (1) replacing `mutateAsync` with `mutate` where the return value is unused, plus adding form submit guards; (2) modularizing the 678-line `create-deck-form.tsx` into co-located components; (3) eliminating inline schema/type duplication by centralizing types in schema files; (4) documenting consistent patterns so future code follows the same conventions; and (5) adding a "Frontend Architecture Patterns" section to `CLAUDE.md`.

## Requirements

- Replace `mutateAsync` + empty catch blocks with `mutate` + `onSuccess` callbacks in `moxfield-import.tsx` and `text-import.tsx`
- Keep `mutateAsync` in `conversation-view.tsx` (required by `MessageInput`'s Promise interface) but add error handling with toast
- Fix `create-deck-form.tsx` submit button disabled state to include `addCardToDeck.isPending`
- Add early-exit mutation guard in `onSubmit`
- Split `create-deck-form.tsx` into 3 co-located files under `src/app/(main)/decks/new/`
- Deduplicate the `ImportProgress` interface (defined in 3 places) into a single export in `src/schemas/import.schema.ts`
- Remove inline `createDeckSchema` and `ColorIdentity` type from `create-deck-form.tsx`; import from existing schema files
- Add "Frontend Architecture Patterns" section to `CLAUDE.md`

## Architecture Changes

All file paths are relative to `/home/gilgardo/projects/edh-builder/`.

| File | Change |
|------|--------|
| `src/components/import/moxfield-import.tsx` | `mutateAsync` → `mutate` + `onSuccess` |
| `src/components/import/text-import.tsx` | `mutateAsync` → `mutate` + `onSuccess` |
| `src/components/messaging/conversation-view.tsx` | Add try/catch with toast around `mutateAsync` |
| `src/schemas/import.schema.ts` | Add shared `ImportProgress` interface export |
| `src/hooks/use-deck-import.ts` | Remove local `ImportProgress`, import from schema |
| `src/components/import/import-progress.tsx` | Remove local `ImportProgress`, import from schema |
| `src/app/(main)/decks/new/create-deck-form.tsx` | Remove inline schema/types, fix submit guards, extract sub-components |
| `src/app/(main)/decks/new/commander-step.tsx` | **NEW** — commander selection step extracted |
| `src/app/(main)/decks/new/deck-details-step.tsx` | **NEW** — deck details form step extracted |
| `CLAUDE.md` | Add "Frontend Architecture Patterns" section |

## Implementation Steps

### Phase 1: Centralize the ImportProgress type (risk: Low)

This phase has no UI changes. It consolidates a type that is currently defined identically in 3 files into a single source of truth.

**Why first**: Phases 2 and 3 both touch files that use `ImportProgress`. Centralizing the type first avoids merge conflicts later.

---

**Step 1.1: Add `ImportProgress` to `src/schemas/import.schema.ts`**

Add the following export at the bottom of the file, before the "Type exports" comment block:

```typescript
/**
 * Progress state for card-by-card import operations
 */
export interface ImportProgress {
  current: number;
  total: number;
  currentCardName: string;
  status: 'idle' | 'importing' | 'completed' | 'error';
  errors: Array<{ name: string; error: string }>;
}
```

---

**Step 1.2: Update `src/hooks/use-deck-import.ts`**

1. Add `ImportProgress` to the existing import from `@/schemas/import.schema`
2. Remove the local `interface ImportProgress { ... }` block

---

**Step 1.3: Update `src/components/import/import-progress.tsx`**

1. Add `import type { ImportProgress } from '@/schemas/import.schema';`
2. Remove the local `interface ImportProgress { ... }` block
3. The `ImportProgressProps` interface stays — it is component-specific and references the now-imported `ImportProgress`

---

**Step 1.4: Update `src/components/import/index.ts`**

Add re-export so consumers importing from `@/components/import` can also access the type:

```typescript
export type { ImportProgress } from '@/schemas/import.schema';
```

---

### Phase 2: mutateAsync → mutate + submit guards (risk: Low-Medium)

These are small, isolated changes in 3 files plus the submit guard fix.

---

**Step 2.1: `src/components/import/moxfield-import.tsx`**

Replace `handleFetch` with:

```typescript
const handleFetch = () => {
  if (!url.trim() || moxfieldMutation.isPending) return;
  moxfieldMutation.mutate(url, {
    onSuccess: (result) => onPreviewReady(result),
  });
};
```

Changes:
- Function is no longer `async`
- No `try/catch` needed (error state managed by TanStack Query via `moxfieldMutation.isError`)
- Added `moxfieldMutation.isPending` guard to prevent double-fires
- `handleKeyDown` already checks `!moxfieldMutation.isPending`, no change needed there

---

**Step 2.2: `src/components/import/text-import.tsx`**

Replace `handleParse` with:

```typescript
const handleParse = () => {
  if (!text.trim() || textMutation.isPending) return;
  textMutation.mutate(text, {
    onSuccess: (result) => onPreviewReady(result),
  });
};
```

Same pattern as Step 2.1. Function is no longer `async`, no `try/catch`.

---

**Step 2.3: `src/components/messaging/conversation-view.tsx`**

1. Add `useToast` import and destructure `toast`
2. Replace `handleSend` with:

```typescript
const handleSend = async (content: string) => {
  try {
    await sendMessage.mutateAsync({
      conversationId: conversation.id,
      data: { content },
    });
  } catch {
    toast('Failed to send message. Please try again.', 'error');
    throw; // re-throw so MessageInput does NOT clear the input field
  }
};
```

**Why keep `mutateAsync`**: `MessageInput.onSend` is typed as `(content: string) => Promise<void>`. It awaits the result and only clears the input field on success (line 31 of `message-input.tsx`). Switching to `mutate` would make the promise resolve immediately, clearing the input before the request completes.

**Why re-throw**: `MessageInput.handleSubmit` wraps `onSend` in a try/catch. If we re-throw, it enters the catch block and does NOT call `setContent('')`, preserving the user's unsent message. The catch block in `MessageInput` is empty (`// Error handled by parent`) which is correct — the toast IS the parent error handling.

---

**Step 2.4: Fix submit guards in `src/app/(main)/decks/new/create-deck-form.tsx`**

Three changes in `onSubmit` and the submit button:

**Change A** — Add early-exit guard in `onSubmit`:

```typescript
const onSubmit = async (data: CreateDeck) => {
  if (createDeck.isPending || addCardToDeck.isPending || addBasicLands.isPending) return;
  if (!selectedCommander) return;
  // ... rest unchanged
};
```

**Change B** — Fix button disabled state:

```typescript
disabled={createDeck.isPending || addCardToDeck.isPending || addBasicLands.isPending}
```

Currently missing `addCardToDeck.isPending`. This means the button re-enables after `createDeck` resolves but before `addCardToDeck` and `addBasicLands` complete, allowing a second click.

**Change C** — Fix loading text condition:

```typescript
{(createDeck.isPending || addCardToDeck.isPending || addBasicLands.isPending) ? (
```

---

### Phase 3: Schema/type co-location (risk: Medium)

Removes inline type definitions from `create-deck-form.tsx` and imports them from canonical locations.

---

**Step 3.1: Replace inline `createDeckSchema` with `CreateDeckSchema` import**

File: `src/app/(main)/decks/new/create-deck-form.tsx`

1. Add: `import { CreateDeckSchema } from '@/schemas/deck.schema';`
2. Add: `import type { CreateDeck } from '@/schemas/deck.schema';`
3. Remove inline `createDeckSchema` (lines 45-50)
4. Remove inline `type CreateDeckFormData = z.infer<typeof createDeckSchema>` (line 52)
5. Update `useForm<CreateDeckFormData>` → `useForm<CreateDeck>`
6. Update `resolver: zodResolver(createDeckSchema)` → `resolver: zodResolver(CreateDeckSchema)`
7. Update `onSubmit` signature: `async (data: CreateDeck)`
8. Remove `import { z } from 'zod'` (line 7) — no longer used

**Why this is safe**: `CreateDeckSchema` has two additional optional fields (`commanderId` and `partnerId`) that the inline schema did not. These are optional with no defaults, so `react-hook-form` will simply not include them unless explicitly set. The inline schema had `format` without `.default()` but `CreateDeckSchema` has `.default('COMMANDER')` — the form already sets `defaultValues: { format: 'COMMANDER' }` so this is equivalent.

---

**Step 3.2: Remove inline `ColorIdentity` type**

1. Add `ColorIdentity` to the import from `@/schemas/deck.schema`
2. Remove line: `type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G';`

The `ColorIdentity` type exported from `deck.schema.ts` is `z.infer<typeof ColorIdentitySchema>` which equals `'W' | 'U' | 'B' | 'R' | 'G'` — identical.

---

**Step 3.3: Remove inline `ImportProgress` interface**

1. Add `ImportProgress` to the import from `@/schemas/import.schema`
2. Remove the local `interface ImportProgress { ... }` block (lines 55-61)

Dependencies: Phase 1 (Step 1.1) must be complete.

---

### Phase 4: Modularize create-deck-form.tsx (risk: Medium)

Done AFTER Phases 1-3 so the file being split is already cleaned up. Splits 678 lines into 3 co-located files.

---

**Step 4.1: Create `src/app/(main)/decks/new/commander-step.tsx`** (NEW)

Extracts the commander search and selection UI (current lines 377-471).

Props interface:

```typescript
interface CommanderStepProps {
  selectedCommander: ScryfallCard | null;
  cards: ScryfallCard[];
  query: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onSelectCommander: (card: ScryfallCard) => void;
  onClearCommander: () => void;
  onContinue: () => void;
}
```

Extracts:
- Search input with `Search` icon
- Selected commander card with "Change" and "Continue" buttons
- Search results grid
- Empty/loading states

Estimated size: ~120 lines.

---

**Step 4.2: Create `src/app/(main)/decks/new/deck-details-step.tsx`** (NEW)

Extracts the deck details form (current lines 476-644).

Props interface:

```typescript
interface DeckDetailsStepProps {
  form: UseFormReturn<CreateDeck>;
  selectedCommander: ScryfallCard;
  pendingBasicLands: BasicLands | null;
  formatValue: string;
  isPublicValue: boolean;
  isMutating: boolean;         // combines all three pending states
  isError: boolean;
  onSubmit: (data: CreateDeck) => void;
  onBack: () => void;
  onEditBasicLands: () => void;
}
```

Design decision: `form` is passed as a prop rather than re-created in the child. This keeps `useForm` ownership in the orchestrator so state is not lost when switching steps. The `isMutating` prop is a single boolean combining all three mutation pending states, keeping the child agnostic of which specific mutations exist.

The `<form onSubmit={form.handleSubmit(onSubmit)}>` tag lives in this component.

Estimated size: ~180 lines.

---

**Step 4.3: Refactor `create-deck-form.tsx` to use extracted components**

Add imports for the new components:
```typescript
import { CommanderStep } from './commander-step';
import { DeckDetailsStep } from './deck-details-step';
```

Replace the commander step JSX block with:
```tsx
<CommanderStep
  selectedCommander={selectedCommander}
  cards={cards}
  query={query}
  isSearching={isSearching}
  onQueryChange={setQuery}
  onSelectCommander={handleSelectCommander}
  onClearCommander={() => setSelectedCommander(null)}
  onContinue={() => setStep('details')}
/>
```

Replace the details step JSX block with:
```tsx
{selectedCommander && (
  <DeckDetailsStep
    form={form}
    selectedCommander={selectedCommander}
    pendingBasicLands={pendingBasicLands}
    formatValue={formatValue}
    isPublicValue={isPublicValue}
    isMutating={createDeck.isPending || addCardToDeck.isPending || addBasicLands.isPending}
    isError={createDeck.isError}
    onSubmit={onSubmit}
    onBack={() => setStep('commander')}
    onEditBasicLands={() => setShowBasicLandModal(true)}
  />
)}
```

Remove imports that are now only used in extracted components (e.g., `Search`, `Skeleton`, `Label`, `Textarea`, `Select*`, `ColorIdentityBadges`). Keep those still used by the orchestrator's import preview/progress views.

Estimated final size: ~300 lines (down from 678).

---

**Step 4.4: No barrel export for the new/ directory**

Do NOT create `index.ts` in `src/app/(main)/decks/new/`. This is a Next.js App Router route directory — barrel exports in route directories can interfere with file-based routing. The new components are page-internal and not used elsewhere.

---

### Phase 5: CLAUDE.md documentation (risk: None)

**Step 5.1: Add "Frontend Architecture Patterns" section to `CLAUDE.md`**

Insert BEFORE the "## Work in Progress: Social Features & Notifications" heading.

```markdown
## Frontend Architecture Patterns

### Mutation Usage: mutate vs mutateAsync

Use `mutate` with `onSuccess`/`onError` callbacks by default. Only use `mutateAsync` when:
1. The calling function MUST await the result (e.g., sequential mutations where step N+1 needs step N's return value)
2. The caller's interface requires a Promise (e.g., `MessageInput.onSend: (content: string) => Promise<void>`)

When using `mutateAsync`, ALWAYS wrap in try/catch with user-facing error feedback (toast).

**NEVER** use `mutateAsync` with an empty catch block. That pattern exists only to suppress
unhandled-rejection warnings and hides errors from users. Use `mutate` instead.

// GOOD: mutate with callback — no return value needed
mutation.mutate(data, {
  onSuccess: (result) => handleResult(result),
});

// GOOD: mutateAsync when chaining is required
const result = await createDeck.mutateAsync(deckData);
await addCardToDeck.mutateAsync({ deckId: result.deck.id, ... });

// BAD: mutateAsync with empty catch
try {
  const result = await mutation.mutateAsync(data);
  onSuccess(result);
} catch {
  // Error handled by mutation state  <-- NO. Use mutate() + onSuccess instead.
}

### Form Submit Guards

Every form that triggers mutations must implement two layers of protection:

1. **Button disabled state**: Disable for ALL mutation pending states in the chain.
2. **Early exit guard**: Add `if (anyMutation.isPending) return;` at the top of the submit handler.

const onSubmit = async (data: FormData) => {
  if (createMutation.isPending || updateMutation.isPending) return;
  // ...
};
<Button disabled={createMutation.isPending || updateMutation.isPending}>

### Component Size Guideline

Components over 300 lines should be evaluated for splitting. Extract sub-components into
co-located files in the same directory. Pass `useForm` instances and handlers via props rather
than duplicating hooks in children.

Route-level directories (`src/app/.../`) should NOT have `index.ts` barrel exports to avoid
conflicts with Next.js file-based routing.

### Schema and Type Location

- **Zod schemas**: Always in `src/schemas/*.schema.ts`. Never inline a Zod schema in a component file.
- **Inferred types**: Export from the same schema file using `z.infer<typeof Schema>`.
- **Shared interfaces** (non-Zod): In `src/schemas/*.schema.ts` if they describe data shapes,
  or `src/types/*.types.ts` if they describe API responses or external data.
- **Component-specific props**: Define in the component file — do NOT centralize props interfaces.

### Barrel Export Pattern

Feature directories under `src/components/` should have an `index.ts` barrel export:

// src/components/import/index.ts
export { MoxfieldImport } from './moxfield-import';
export { TextImport } from './text-import';
export type { ImportProgress } from '@/schemas/import.schema';
```

---

## Explicit Non-Changes

| Item | File | Reason |
|------|------|--------|
| `useToggleDeckLike` using `mutateAsync` | `src/hooks/use-deck-like.ts` | The `toggle` function conditionally branches between two mutations and returns `LikeResponse` to callers who may await it. Valid sequential pattern. |
| `handleImportConfirm` using `mutateAsync` | `create-deck-form.tsx` | Sequential chain: `createDeck` returns `result.deck.id` required by `importDeck`. Cannot be converted to `mutate`. |
| `onSubmit` in create-deck-form using `mutateAsync` | `create-deck-form.tsx` | Same pattern: `createDeck` → `addCardToDeck` → `addBasicLands` each depends on previous result. |
| `handlePaste` in `text-import.tsx` | `text-import.tsx` | Uses `navigator.clipboard.readText()` (browser API), not a TanStack mutation. Empty catch appropriate for clipboard permission failures. |
| `CreateDeckSchema.omit()` | N/A | Considered omitting `commanderId`/`partnerId` for a form-specific schema. Rejected — extra optional fields are harmless and schema fragmentation is worse. |
| `useBasicLands` local `ColorIdentity` | `src/hooks/use-basic-lands.ts` | Used only locally for BASIC_LANDS constant typing. Adding a cross-concern import would not improve readability. Out of scope for this pass. |
| Import preview inline JSX | `create-deck-form.tsx` | Uses 8+ orchestrator values. Too coupled to extract cleanly without excessive prop passing. Leave in orchestrator. |

## Testing Strategy

```bash
docker exec edh-builder-app pnpm typecheck
docker exec edh-builder-app pnpm lint
docker exec edh-builder-app pnpm build
```

### Manual Testing (ordered by risk)

1. **Create deck from scratch** (most impacted): Select commander → confirm basic lands → fill form → submit
   - Button shows "Creating..." and stays disabled through ALL three mutation steps
   - Deck is created with commander and basic lands
   - Rapid double-click does not create duplicate decks

2. **Moxfield import**: Paste URL → Fetch → Preview loads; invalid URL shows error

3. **Text import**: Paste deck list → Parse → Preview loads; invalid text shows error

4. **Send message**: Send succeeds (input clears); on network error (toast appears, input preserved)

5. **Full import flow**: Moxfield → Preview → Fill name → Confirm → Progress → View Deck

## Risks & Mitigations

**Risk 1 (Medium)**: `CreateDeckSchema` has `.default('COMMANDER')` on `format` and `.default(false)` on `isPublic`. These defaults are inert when react-hook-form provides explicit `defaultValues`, but should be verified manually after the change.

**Risk 2 (Medium)**: Extracting components — the `<form onSubmit={form.handleSubmit(onSubmit)}>` tag must live in `DeckDetailsStep`, not the orchestrator, or form submission will not work. Type-check will catch any mismatch.

**Risk 3 (Low)**: Removing `z` import — search for all `z.` usages before removing. Currently only used in the inline schema (lines 45-50) and type alias (line 52), both being removed.

## Implementation Order Summary

| Order | Steps | Files | Risk |
|-------|-------|-------|------|
| 1 | Phase 1 (1.1–1.4) | `import.schema.ts`, `use-deck-import.ts`, `import-progress.tsx`, `import/index.ts` | Low |
| 2 | Phase 2.1 | `moxfield-import.tsx` | Low |
| 2 | Phase 2.2 | `text-import.tsx` | Low |
| 2 | Phase 2.3 | `conversation-view.tsx` | Low |
| 3 | Phase 2.4 | `create-deck-form.tsx` (guards) | Low |
| 4 | Phase 3.1–3.3 | `create-deck-form.tsx` (schema cleanup) | Medium |
| 5 | Phase 4.1 | `commander-step.tsx` (NEW) | Medium |
| 5 | Phase 4.2 | `deck-details-step.tsx` (NEW) | Medium |
| 6 | Phase 4.3 | `create-deck-form.tsx` (orchestrator) | Medium |
| 7 | Phase 5.1 | `CLAUDE.md` | None |

Steps in the same row can be done in parallel.

## Success Criteria

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm build` succeeds
- [ ] No file in `src/` contains a local `interface ImportProgress` definition
- [ ] `create-deck-form.tsx` has no inline Zod schema or `z` import
- [ ] `create-deck-form.tsx` is under 350 lines
- [ ] `moxfield-import.tsx` and `text-import.tsx` have no `mutateAsync` calls
- [ ] `conversation-view.tsx` has try/catch around `mutateAsync` with toast error feedback
- [ ] `create-deck-form.tsx` submit button disabled state includes `addCardToDeck.isPending`
- [ ] `CLAUDE.md` has a "Frontend Architecture Patterns" section
- [ ] Creating a deck from scratch works end-to-end
- [ ] Moxfield import works end-to-end
- [ ] Text import works end-to-end
- [ ] Failed message sends show a toast and preserve input text
