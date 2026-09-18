# NEXORA

NEXORA is a considered everyday-goods storefront with searchable products, persistent cart and wishlist flows, checkout, order history, and admin catalog controls.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/nexora run dev` — run the storefront
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nexora/src/pages/` — storefront, account, checkout, and admin page surfaces
- `artifacts/nexora/src/components/storefront.tsx` — shared shell, product cards, filters, and state views
- `artifacts/api-server/src/routes/` — catalog, commerce, and admin API handlers
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and schemas
- `lib/db/src/schema/ecommerce.ts` — PostgreSQL/Drizzle schema for NEXORA commerce data
- `artifacts/nexora/src/index.css` — NEXORA design tokens and motion system

## Architecture decisions

- The API contract is defined in OpenAPI first; generated React Query hooks and Zod schemas are shared by the storefront and Express API.
- Product catalog, cart, wishlist, coupons, and orders use the workspace PostgreSQL database through Drizzle.
- Commerce endpoints use a session header so guest browsing and local development work before an external identity provider is connected.
- Checkout is intentionally a test-mode order flow; payment providers are not faked and can be attached through the checkout service boundary later.
- The connected Supabase connector currently exposes PostgREST only. The reproducible Supabase schema/RLS migration is at `artifacts/api-server/supabase/migrations/0001_nexora_phase2.sql`; it must be applied through a Supabase SQL migration runner before switching application data off the workspace database.

## Product

- Editorial home and category discovery
- Search, sorting, price filtering, product details, related products, and responsive product grids
- Persistent cart, wishlist, coupon validation, checkout, confirmation, order history, and account overview
- Admin summary and product create/update controls
- Loading, empty, error, responsive, focus, and reduced-motion states

## User preferences

- Keep the storefront intentional and human-designed rather than template-like.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- After changing `lib/db/src/schema`, run `pnpm --filter @workspace/db run push` and then `pnpm run typecheck:libs`.
- Artifact workflows provide `PORT` and `BASE_PATH`; do not run the Vite server directly for preview debugging.
- Supabase authentication and live payment processing still require the corresponding integration setup before production use.
- The current Supabase connection has no Auth endpoint or SQL/DDL capability exposed through the connector, so the storefront still uses development guest sessions and must not claim Supabase Auth is complete.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
