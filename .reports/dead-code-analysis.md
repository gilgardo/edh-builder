# Dead Code Analysis — 2026-02-20

Tools: `knip`, `depcheck` (via `pnpm dlx`)
Baseline tests: **246 passing / 14 failing** (failures pre-exist in `r2-client.test.ts` and `image-cache.test.ts`)

---

## SAFE — Delete immediately

| Item | Type | Reason |
|------|------|--------|
| `src/components/cards/card-3d.tsx` | File (197 lines) | Never imported anywhere. 3D tilt component abandoned. |
| `src/schemas/card.schema.ts` | File (39 lines) | Never imported anywhere. Duplicate of validation already inlined in the API route. |

---

## SAFE — Unused package

| Package | Section | Reason |
|---------|---------|--------|
| `react-to-pdf` | `dependencies` | Never imported. PDF export uses `jspdf` via `src/lib/pdf-generator.ts`. |

---

## FALSE POSITIVES — Do not touch

| Item | Why knip flagged | Reality |
|------|-----------------|---------|
| 100+ barrel re-exports in `hooks/index.ts`, `components/*/index.ts` | Consumers import from source files directly | Components and hooks ARE used — barrels are the public API surface. |
| `@types/bcryptjs` (devDep) | depcheck heuristic | `bcryptjs` used in auth routes. Type defs required. |
| `pdf.types.ts` constants (`CARDS_PER_COLUMN` etc.) | Specific constants unused | File heavily used by pdf-generator and components. |
| `@tailwindcss/postcss`, `tailwindcss`, `prettier-plugin-tailwindcss` | depcheck can't see CSS config | Used in `postcss.config.mjs` and Tailwind v4 CSS. |
| `@vitest/coverage-v8`, `dotenv` | Config-level usage | Test coverage and env loading in scripts. |
| Test fixture exports (`src/test/**`) | Not cross-imported | Each test imports what it needs directly — expected pattern. |
