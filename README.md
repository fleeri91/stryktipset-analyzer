# Stryktipset Analyzer

Next.js app for analyzing football results for Stryktipset.

## Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS + shadcn/ui (Base UI)
- TanStack Query

## Environment

| Variable | Description |
|---|---|
| `STRYKTIPSET_API_KEY` | Access key for Svenska Spel's API (open round, odds, the public's picks). Server-only. |

Put it in `.env` (git-ignored).

## Data

`data/<season>/en.<tier>.json` — English league results per season (`en.1` = Premier League, `en.2`–`en.4` = EFL tiers). Used for head-to-head meetings from the latest season.

## Data fetching (TanStack Query)

- `app/providers.tsx` — `QueryClientProvider` (new client per server render, one shared client in the browser).
- Client-only: call `useQuery` / `useSuspenseQuery` in a Client Component.
- Server-provided initial data: read cached data (`"use cache"` + `cacheTag`) in a Server Component, build state with `dehydrate()` from `@/lib/hydrate` using the same tags, and render `<HydrationBoundary state={state}>` inside `<Suspense>`. Don't use TanStack's own `dehydrate()` on the server, because it breaks prerendering with `cacheComponents`.

See `node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md`.

## Development

```bash
bun install
bun dev     # http://localhost:3000
bun run build
bun run lint
```
