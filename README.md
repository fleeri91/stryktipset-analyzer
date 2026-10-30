# Stryktipset Analyzer

Next.js app for analyzing football results for Stryktipset.

## Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS + shadcn/ui (Base UI)
- TanStack Query

## Data

`data/<season>/en.<tier>.json` — English league results per season (`en.1` = Premier League, `en.2`–`en.4` = EFL tiers).

## Development

```bash
bun install
bun dev     # http://localhost:3000
bun run build
bun run lint
```
