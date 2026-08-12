# ADR 002: Versioned product-list cache keys

## Status

Accepted.

## Decision

Product queries use cache-aside. Detail keys are removed directly. Filtered list keys include a namespace version:

```text
localcart:products:list:v{version}:{sha256-of-normalized-query}
```

Create, update and delete commands increment the list version after PostgreSQL commits. Old keys become unreachable and expire naturally after two minutes.

## Consequences

- Invalidating many combinations of filters does not require Redis key scans.
- Mutation cost remains constant.
- If Redis is unavailable, reads fall back to PostgreSQL and mutations remain successful; the short TTL bounds stale data after recovery.
