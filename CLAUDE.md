# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Turbopack, localhost:3000)
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # Run ESLint
```

No test framework is set up.

## Architecture Overview

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL) · React Context

### Data Flow

```
UI Pages/Components
  → useFinance() hook (reads from FinanceStore context)
  → FinanceProvider (src/store/finance-store.tsx)
      · Optimistic update → API call → rollback on failure
      · Fetches /api/transactions, /api/categories, /api/debt-adjustments,
        /api/market-products, /api/market-purchases in parallel on mount
  → Next.js API Routes (src/app/api/**)
      · Map camelCase types ↔ snake_case DB columns
  → Supabase client (src/lib/supabase.ts)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript types — the authoritative source |
| `src/lib/finance.ts` | All calculation and filter logic (pure functions) |
| `src/store/finance-store.tsx` | Global state + every CRUD mutation |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/mock.ts` | Static `USERS` and `CATEGORIES` constants (used as fallback/seed) |

> **Note:** A `prisma/schema.prisma` file exists but is unused. The app talks directly to Supabase via the JS client, not through Prisma.

### Pages

| Route | View |
|-------|------|
| `/dashboard` | Couple (pareja) dashboard — all shared expenses |
| `/marcos` | Marcos personal dashboard |
| `/camila` | Camila personal dashboard |
| `/transactions` | Full transaction list |
| `/deudas` | Debt tracking between Marcos and Camila |
| `/estadisticas` | Statistics and annual charts |
| `/mercadata` | Grocery purchase tracker (MercaData feature) |
| `/settings` | Category management |

### Business Logic (`src/lib/finance.ts`)

The app tracks finances for a couple (**Marcos** and **Camila**). There are three user IDs:

- `"marcos"` / `"camila"` — individual transactions
- `"pareja"` — shared couple transactions

**Couple view** (`currentUserId = null`): only `income` + transactions where `userId === "pareja"` count; individual transactions are excluded.

**Personal view** (`currentUserId = "marcos"` or `"camila"`):
- `userId === "pareja"` → count 50% of amount (shared burden)
- `userId === currentUserId` → count 100%
- Other user's individual transactions → skip

**Category kinds:** `income` · `fixed` · `variable` · `saving` · `investment`

**Fixed vs. Recurring split:** The `FIXED_NAMES` array in `finance.ts` determines whether an expense goes into the "fixed" or "recurring" bucket in `calculateTotals`. This is separate from the category's `kind` field.

**Amounts** are always stored and computed in **integer cents** to avoid float errors. User input parsing: `parseToAmountCents()`. Display formatting: `formatEur()`.

**Accumulated savings** (`getAccumulatedSavings`): computed dynamically from income minus all expense/investment/saving categories up to the selected month. Debt settlements are excluded because they are cash transfers, not budget events.

**Debt logic** (`calculateSharedDebt`): tracks who physically paid (`paidBy`) vs. who the expense belongs to (`userId`). A shared `pareja` expense splits 50/50; an individual expense paid by the other person creates a 100% debt. `BASE_PERSONAL_DEBT_CENTS = 71550` is a hardcoded historical baseline (Camila owes Marcos).

### State Management

`FinanceProvider` wraps the entire app and exposes `useFinance()`. All mutations follow the pattern:

1. Generate a client-side temp ID and apply the change optimistically
2. Fire the API request
3. On success: replace the temp entity with the server response
4. On failure: rollback to previous state and set `error`

`selectedDate` (month/year) is persisted to `localStorage` under key `"marla-finance-selected-date"`.

### MercaData Feature

The grocery tracker (`/mercadata`) has its own entity graph:
- `MarketProduct` — product catalogue
- `MarketPurchase` + `MarketPurchaseItems` — a single shopping trip split by user (`pareja` / `marcos` / `camila`)

When a purchase is saved, it generates linked `Transaction` rows (one per user block with totals > 0). Deleting a purchase from the dashboard removes all linked transactions. The `marketPurchaseId` field on `Transaction` is the link.

### DB ↔ TypeScript Mapping

Supabase columns are `snake_case`; TypeScript types are `camelCase`. Every API route has a local `mapTo*` function that translates between them (e.g., `user_id` → `userId`, `amount_cents` → `amountCents`).

### Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### PWA

Configured via `next-pwa`. Disabled in development (`disable: isDev`), enabled in production. Manifest served from `public/`.
