# ADR 003: Supabase as managed PostgreSQL

## Status

Accepted.

## Decision

Use Supabase only as the managed PostgreSQL provider. Authentication remains the responsibility of LocalCart Auth API because the task explicitly requires user registration, login and JWT generation to be implemented by the backend.

Both APIs connect to the same Supabase `postgres` database while preserving service ownership through separate schemas:

- Auth API owns `identity`.
- Product API owns `catalog`.
- Each schema contains its own `__EFMigrationsHistory` table.

The application schema is named `identity`, not `auth`, because Supabase reserves `auth` for its platform-managed authentication objects. Local development should use the Supabase Session Pooler connection when direct IPv6 connectivity is unavailable.

## Consequences

- No PostgreSQL container or local database installation is required.
- Service data remains isolated by schema without duplicating Supabase projects.
- EF Core migrations can evolve independently without sharing migration history.
- Database credentials must be supplied through user secrets or environment variables and must never be committed.
- Redis remains an independent dependency because Supabase PostgreSQL does not replace the required cache.
