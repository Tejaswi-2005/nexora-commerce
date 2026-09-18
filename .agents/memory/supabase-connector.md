---
name: Supabase connector limits
description: Environment-specific limits discovered while connecting NEXORA to Supabase.
---

The connected Supabase Replit connector currently exposes a PostgREST data API, not arbitrary SQL/DDL or Supabase Auth endpoints. Its proxy path is relative to the configured REST base: use `/table` for table access, not `/rest/v1/table`.

**Why:** Probing `/rest/v1/...` and `/auth/v1/...` returned `PGRST125`, while `/profiles` reached PostgREST; the connected project schema was empty and no `exec_sql` RPC existed.

**How to apply:** Keep the reproducible schema/RLS migration in the project, but do not claim Supabase schema or Auth is live until a SQL migration runner and Auth-capable configuration are available.