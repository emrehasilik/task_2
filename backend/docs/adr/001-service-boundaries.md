# ADR 001: Auth and Catalog service boundaries

## Status

Accepted.

## Decision

Auth and Product are separate deployable APIs in one solution. Auth owns users, credentials and refresh tokens. Product owns categories and products. Product trusts JWTs signed by Auth and uses the `sub` and `role` claims; it does not query the Auth database.

## Consequences

- Each service can evolve and scale independently.
- Database ownership is explicit even though both services share one Supabase PostgreSQL database: Auth owns the `identity` schema and Product owns the `catalog` schema. Each context also has its own migration history table.
- A shared signing key is sufficient for this task. An asymmetric key or external identity provider is the production evolution path.
- Seller identity is stored as `SellerId` in Product; cross-service foreign keys are intentionally avoided.
