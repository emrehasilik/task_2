# LocalCart Backend

LocalCart is a production-minded marketplace backend built for the Full Stack Developer second-stage task. It contains two independently runnable .NET 8 APIs in one solution:

- **Auth API** - registration, login, JWT access tokens, hashed refresh tokens, rotation and revocation.
- **Product API** - CQRS product management, PostgreSQL filtering and sorting, Redis cache-aside and cache invalidation.

## Architecture

Each service follows Onion Architecture:

```text
API -> Application -> Domain
API -> Infrastructure -> Application + Domain
```

`Domain` has no framework dependency. `Application` owns use cases, MediatR commands/queries, abstractions and FluentValidation. `Infrastructure` implements EF Core, PostgreSQL, JWT/password services and Redis. `API` is the composition root and HTTP boundary.

Architecture decisions are documented in [service boundaries](docs/adr/001-service-boundaries.md) and [cache invalidation](docs/adr/002-cache-invalidation.md).

## Included engineering practices

- .NET 8, ASP.NET Core Web API and nullable reference types
- Onion Architecture and CQRS with MediatR
- PostgreSQL with EF Core migrations, projections, `AsNoTracking`, bounded pagination and GIN trigram search indexes
- Redis cache-aside with versioned invalidation and PostgreSQL fallback
- JWT bearer authentication; Customer, Seller and Admin authorization
- PBKDF2 password hashing through ASP.NET Core `PasswordHasher`
- Hashed, rotating refresh tokens
- Optimistic concurrency and soft delete for products
- FluentValidation pipeline behavior
- RFC 7807 `ProblemDetails` global exception handling
- Source-generated structured logging and Serilog request logging
- Correlation IDs, readiness/liveness checks, CORS and login rate limiting
- Swagger/OpenAPI with JWT Bearer support
- Central Package Management, warnings as errors and Release build verification

## Quick start with Docker

Requirements: Docker Desktop with Compose.

```powershell
Copy-Item .env.example .env
```

Set strong values in `.env`, then run:

```powershell
docker compose up --build
```

Open:

- Auth Swagger: <http://localhost:5001/swagger>
- Product Swagger: <http://localhost:5002/swagger>
- Auth readiness: <http://localhost:5001/health/ready>
- Product readiness: <http://localhost:5002/health/ready>

Migrations are applied automatically at service startup. Product migrations seed five categories.

## Swagger workflow

1. Register a `Seller` through Auth Swagger.
2. Copy the returned `accessToken`.
3. Open Product Swagger, choose **Authorize**, and paste the token.
4. Read `/api/v1/categories` and use a category ID to create a product.
5. Query `/api/v1/products` with category, price, search, sorting and pagination parameters.

The ready-made [HTTP request collection](requests/LocalCart.http) provides the same end-to-end flow.

## Local development without API containers

Start PostgreSQL and Redis, create databases named `localcart_auth` and `localcart_products`, then set connection strings through user secrets or environment variables. Both APIs must use the same JWT signing key.

```powershell
$env:Jwt__SigningKey = "a-local-only-signing-key-with-at-least-32-characters"
dotnet run --project src/Services/Auth/LocalCart.Auth.Api
dotnet run --project src/Services/Product/LocalCart.Product.Api
```

Default local infrastructure endpoints are `localhost:5432` and `localhost:6379`. Development Swagger ports are defined in each API's `launchSettings.json`.

## Build and test

```powershell
dotnet tool restore
dotnet restore LocalCart.sln
dotnet build LocalCart.sln -c Release --no-restore -m:1
dotnet test LocalCart.sln -c Release --no-build -m:1
```

`-m:1` is optional; it makes build output deterministic on constrained Windows agents.

Create future migrations with:

```powershell
dotnet ef migrations add MigrationName --project src/Services/Auth/LocalCart.Auth.Infrastructure --startup-project src/Services/Auth/LocalCart.Auth.Api --context AuthDbContext --output-dir Persistence/Migrations
dotnet ef migrations add MigrationName --project src/Services/Product/LocalCart.Product.Infrastructure --startup-project src/Services/Product/LocalCart.Product.Api --context ProductDbContext --output-dir Persistence/Migrations
```

## API summary

### Auth API

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Public, rate limited |
| POST | `/api/v1/auth/login` | Public, rate limited |
| POST | `/api/v1/auth/refresh` | Public, rotating token |
| POST | `/api/v1/auth/revoke` | Public, idempotent |
| GET | `/api/v1/auth/me` | JWT |

### Product API

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/v1/products` | Public, Redis cached |
| GET | `/api/v1/products/{id}` | Public, Redis cached |
| GET | `/api/v1/products/mine` | Seller |
| POST | `/api/v1/products` | Seller/Admin |
| PUT | `/api/v1/products/{id}` | Owner Seller/Admin |
| DELETE | `/api/v1/products/{id}?version=...` | Owner Seller/Admin |
| GET | `/api/v1/categories` | Public, Redis cached |

Seller ownership is checked inside Application handlers as defense in depth; controller policies alone are not trusted.

## Cache behavior

Product lists use normalized query hashes and a version namespace. Create, update and delete commands increment the namespace version after the PostgreSQL transaction. Product details are evicted directly. Redis failures are logged and treated as cache misses, keeping PostgreSQL reads and writes available.

## Security notes

- Public registration accepts only `Customer` and `Seller`; it never accepts `Admin`.
- Passwords, access tokens and raw refresh tokens are never logged.
- Refresh tokens are stored only as SHA-256 hashes and rotated on use.
- Production secrets belong in environment variables or a secret manager, never in committed settings.
- The shared HMAC key is appropriate for this scoped task. Asymmetric signing keys or an external identity provider are the recommended production evolution.
