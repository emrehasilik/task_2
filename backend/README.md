# LocalCart Backend

LocalCart, yerel üreticilerin ürünlerini listeleyebildiği ve müşterilerin ürün keşfedebildiği bir pazaryeri uygulamasının backend projesidir. Proje, Full Stack Developer ikinci aşama görevi kapsamında hazırlanmıştır.

Bu dokümandaki bütün `dotnet` ve PowerShell komutları repository kökündeki `backend` klasöründen çalıştırılmalıdır:

```powershell
cd backend
```

Bu repository şu anda backend kapsamını içerir:

- **Auth API:** Kullanıcı kaydı, giriş, JWT access token üretimi, refresh token yenileme ve iptal işlemleri.
- **Product API:** CQRS tabanlı ürün yönetimi, filtreleme, sıralama, sayfalama, PostgreSQL sorguları ve Redis cache.

Frontend, sonraki geliştirme aşamasında bu API’leri kullanacak şekilde eklenecektir.

## Projenin amacı

Bu projede yalnızca çalışan CRUD endpoint’leri üretmek yerine aşağıdaki gerçek sistem problemlerinin çözülmesi hedeflenmiştir:

- Kimlik doğrulama ile yetkilendirmeyi birbirinden ayırmak
- Satıcının yalnızca kendi ürünlerini yönetmesini sağlamak
- Okuma ve yazma operasyonlarını CQRS ile ayırmak
- Yoğun ürün listeleme sorgularını Redis ile hızlandırmak
- Ürün değişikliklerinden sonra eski cache verilerinin dönmesini engellemek
- Eş zamanlı güncellemelerde veri kaybını önlemek
- Hataları, logları ve servis sağlık durumunu standartlaştırmak
- Uygulamayı tek komutla kurulabilir ve Swagger üzerinden test edilebilir hâle getirmek

## Kullanılan teknolojiler

- .NET 8 ve ASP.NET Core Web API
- Onion Architecture
- CQRS ve MediatR
- Entity Framework Core
- Supabase PostgreSQL
- Redis 7
- JWT Bearer Authentication
- FluentValidation
- Serilog
- Swagger / OpenAPI
- xUnit ve Moq

Paket sürümleri [Directory.Packages.props](Directory.Packages.props) üzerinden merkezî olarak yönetilir. Nullable reference types, kod analizörleri ve `TreatWarningsAsErrors` aktiftir.

## Solution yapısı

```text
LocalCart.sln
├── src/Services/Auth
│   ├── LocalCart.Auth.Domain
│   ├── LocalCart.Auth.Application
│   ├── LocalCart.Auth.Infrastructure
│   └── LocalCart.Auth.Api
├── src/Services/Product
│   ├── LocalCart.Product.Domain
│   ├── LocalCart.Product.Application
│   ├── LocalCart.Product.Infrastructure
│   └── LocalCart.Product.Api
├── tests
│   ├── LocalCart.Auth.UnitTests
│   ├── LocalCart.Auth.IntegrationTests
│   ├── LocalCart.Product.UnitTests
│   └── LocalCart.Product.IntegrationTests
├── docs/adr
└── requests
```

## Mimari

Her servis kendi Onion Architecture katmanlarına sahiptir:

```text
API ───────────────> Application ───────────────> Domain
 │                         ▲                         ▲
 └──────> Infrastructure ──┴─────────────────────────┘
```

### Domain

Domain katmanı framework veya veritabanı bağımlılığı içermez. Kullanıcı, refresh token, ürün, kategori ve ürün durumu gibi temel iş modellerini ve kurallarını barındırır.

### Application

Uygulamanın use-case’leri bu katmandadır:

- MediatR Command ve Query’leri
- Command/Query handler’ları
- FluentValidation kuralları
- Repository, cache, zaman ve güvenlik soyutlamaları
- Yetkilendirme ve sahiplik kuralları

Application katmanı EF Core, PostgreSQL veya Redis’in somut sınıflarını bilmez. Bu sayede iş kuralları altyapıdan bağımsız test edilebilir.

### Infrastructure

Application katmanındaki arayüzlerin gerçek implementasyonlarını içerir:

- EF Core `DbContext` ve repository’leri
- PostgreSQL entity konfigürasyonları ve migration’lar
- Redis cache servisi
- JWT üretimi
- Parola hashleme
- Refresh token üretimi ve hashleme

### API

HTTP sınırı ve composition root’tur. Controller’lar iş mantığı taşımaz; istekleri ilgili Command veya Query’ye yönlendirir. Authentication, authorization, Swagger, global hata yönetimi, rate limiting, CORS, health check ve Serilog burada yapılandırılır.

Mimari kararların ayrıntıları:

- [Auth ve Product servis sınırları](docs/adr/001-service-boundaries.md)
- [Redis cache invalidation stratejisi](docs/adr/002-cache-invalidation.md)
- [Supabase PostgreSQL kararı](docs/adr/003-supabase-postgresql.md)

## Auth Service

Auth Service aşağıdaki işlemleri yönetir:

- Customer veya Seller hesabı oluşturma
- E-posta ve parola ile giriş
- Kısa ömürlü JWT access token üretimi
- Refresh token üretimi ve rotation
- Refresh token iptali
- JWT ile mevcut kullanıcı bilgisini okuma

### Güvenlik kararları

- Herkese açık kayıt endpoint’i üzerinden `Admin` hesabı oluşturulamaz.
- Parolalar ASP.NET Core `PasswordHasher` ile PBKDF2 tabanlı hashlenir.
- Refresh token’ın ham değeri veritabanına yazılmaz; yalnızca SHA-256 hash’i saklanır.
- Kullanılan refresh token iptal edilir ve yenisiyle değiştirilir.
- JWT içinde `sub`, `email`, `role` ve `jti` claim’leri bulunur.
- Login, register ve refresh endpoint’leri IP bazlı rate limit uygular.
- Parolalar, access token’lar ve ham refresh token’lar loglanmaz.
- JWT imzalama anahtarı repository’de tutulmaz; environment variable veya secret manager üzerinden verilmesi zorunludur.

## Product Service

Product Service, ürün kataloğunun sahibi olan bağımsız servistir.

### Command’lar

- `CreateProductCommand`
- `UpdateProductCommand`
- `DeleteProductCommand`

Ürün ekleme, güncelleme ve silme operasyonları JWT gerektirir. `Seller` yalnızca kendi ürünlerini yönetebilir; `Admin` tüm ürünleri yönetebilir. Sahiplik kontrolü yalnızca controller policy’sine bırakılmamış, Application handler’larında tekrar doğrulanmıştır.

### Query’ler

- `GetProductsQuery`
- `GetProductByIdQuery`
- `GetSellerProductsQuery`
- `GetCategoriesQuery`

Ürün listeleme şu sorgu seçeneklerini destekler:

- Ürün adı/açıklamasında arama
- Kategori filtresi
- Minimum ve maksimum fiyat filtresi
- Fiyata göre artan/azalan sıralama
- Ada göre sıralama
- En yeni ürünlere göre sıralama
- Sayfalama

Örnek:

```http
GET /api/v1/products?search=seramik&categoryId={id}&minPrice=100&maxPrice=500&sort=PriceAscending&page=1&pageSize=12
```

`pageSize` en fazla 50 olabilir. Böylece istemcinin tek istekte kontrolsüz miktarda veri çekmesi engellenir.

## Redis cache stratejisi

Ürün listeleme, ürün detayı ve kategori sorgularında cache-aside yaklaşımı kullanılır:

```text
İstek
  ├── Redis’te veri varsa ──> Cache’den dön
  └── Redis’te veri yoksa ──> PostgreSQL’den oku
                                  └── Redis’e yaz ve dön
```

Örnek cache anahtarları:

```text
localcart:products:detail:{productId}
localcart:products:list:v{version}:{normalizedQueryHash}
localcart:categories:all
```

Filtre kombinasyonları çok fazla olabileceği için ürün değiştiğinde Redis üzerinde anahtar taraması yapılmaz. Bunun yerine liste cache namespace sürümü artırılır:

```text
products:list:v7:{hash}  -> eski kayıt
products:list:v8:{hash}  -> yeni sorguların kullandığı kayıt
```

Ürün oluşturma, güncelleme veya silme işleminden sonra:

1. PostgreSQL değişikliği başarıyla kaydedilir.
2. İlgili ürün detay cache’i silinir.
3. Liste cache sürümü artırılır.
4. Eski liste cache’leri kısa TTL sonunda kendiliğinden temizlenir.

Redis kullanılamazsa hata loglanır ve okuma PostgreSQL üzerinden devam eder. Cache arızası ana iş akışını durdurmaz.

## Performans kararları

- Salt-okunur EF Core sorgularında `AsNoTracking` kullanılır.
- Entity’nin tamamını belleğe almak yerine doğrudan response modeline projection yapılır.
- Bütün liste endpoint’lerinde sınırlı pagination bulunur.
- Sıralamalar kararlı sonuç üretmesi için ikinci alan olarak `Id` kullanır.
- Sık kullanılan kategori, fiyat, durum ve satıcı sorgularına PostgreSQL indeksleri eklenmiştir.
- `%arama%` biçimindeki `ILIKE` aramalarının tablo taramasına düşmemesi için `pg_trgm` eklentisi ve GIN trigram indeksleri kullanılır.
- Redis liste anahtarları normalize edilmiş sorgunun SHA-256 hash’i ile üretilir.
- Redis bağlantısı singleton olarak paylaşılır.
- EF Core `DbContext` pooling aktiftir.
- PostgreSQL bağlantılarında geçici hatalar için sınırlı retry uygulanır.
- Sıcak log yollarında source-generated `LoggerMessage` kullanılır.

## Veri bütünlüğü

- E-posta, ürün slug’ı, kategori slug’ı ve refresh token hash’i veritabanında unique indekslerle korunur.
- Aynı benzersiz değeri eş zamanlı yazmaya çalışan istekler `409 Conflict` alır.
- Ürün silme fiziksel silme yerine soft delete olarak uygulanır.
- Güncelleme ve silme istekleri ürünün `Version` değerini göndermek zorundadır.
- Ürün başka bir istek tarafından değiştirilmişse işlem `409 Conflict` ile reddedilir. Böylece son yazanın önceki değişiklikleri sessizce ezmesi önlenir.

## Ortak API davranışları

### Global hata yönetimi

Hatalar RFC 7807 `ProblemDetails` biçiminde döner:

| Durum | HTTP kodu |
| --- | ---: |
| Validation hatası | `400` |
| Authentication hatası | `401` |
| Authorization/sahiplik hatası | `403` |
| Kayıt bulunamadı | `404` |
| Unique veya concurrency çakışması | `409` |
| Rate limit aşıldı | `429` |
| Beklenmeyen sunucu hatası | `500` |

Her hata cevabına ve log kaydına izlenebilirlik amacıyla `traceId`/`X-Correlation-ID` eklenir.

### Loglama

Serilog ile yapılandırılmış loglar üretilir:

- HTTP method ve path
- Response status code
- İşlem süresi
- Correlation ID
- Beklenen iş hataları
- Beklenmeyen exception’lar
- Cache hit/miss ve invalidation olayları

### Health check

- `/health/live`: API prosesinin çalıştığını gösterir.
- `/health/ready`: PostgreSQL ve gerekli olduğunda Redis bağlantısını doğrular.

## Veritabanı: Supabase PostgreSQL

İki API, aynı Supabase projesindeki `postgres` veritabanını kullanır. Servislerin tabloları birbirinden şema seviyesinde ayrılır:

- Auth API tabloları: `identity` şeması
- Product API tabloları: `catalog` şeması
- Auth migration geçmişi: `identity.__EFMigrationsHistory`
- Product migration geçmişi: `catalog.__EFMigrationsHistory`

Supabase’in kendi kimlik doğrulama altyapısı `auth` şemasını kullandığı için uygulama kullanıcı tabloları özellikle `identity` şemasına yerleştirilmiştir. Böylece ileride Supabase Auth kullanılsa bile isim ve migration çakışması oluşmaz.

### Supabase projesini hazırlama

1. Supabase Dashboard üzerinden bir proje oluşturun.
2. **Connect** ekranında yerel IPv4 geliştirme ortamı için **Session pooler** bağlantısını seçin.
3. Bağlantı bilgisini Npgsql biçiminde hazırlayın. Örnek şablon [.env.example](.env.example) içinde bulunur.
4. Bağlantı bilgisini repository’ye veya `appsettings.json` dosyasına yazmayın.

Örnek bağlantı biçimi:

```text
Host=aws-0-REGION.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.PROJECT_REF;Password=SUPABASE_DATABASE_PASSWORD;SSL Mode=Require;Trust Server Certificate=true;Pooling=true;Minimum Pool Size=0;Maximum Pool Size=20;Connection Idle Lifetime=300;Timeout=15;Command Timeout=30;Keepalive=30
```

Session pooler, IPv4 yerel geliştirme ortamında doğrudan veritabanı adresine göre daha uyumludur. Uygulama tarafındaki sınırlı Npgsql havuzu da bağlantı sayısının kontrolsüz büyümesini engeller.

### Secret yapılandırması

Repository kökünde aşağıdaki komutu çalıştırın. URI içindeki `[YOUR-PASSWORD]` ifadesini değiştirmeyin; script parolayı gizli giriş olarak ayrıca sorar:

```powershell
.\scripts\Configure-DevelopmentSecrets.ps1 -SessionPoolerUri "postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

Script bağlantıyı Npgsql biçimine dönüştürür, her iki API’nin .NET User Secrets alanına kaydeder ve iki API için aynı kriptografik rastgele JWT signing key’i üretir. Parola komut geçmişine, `appsettings.json` dosyalarına veya Git repository’sine yazılmaz.

Redis endpoint’i hazır olduğunda ayrı script parolayı gizli giriş olarak ister:

```powershell
.\scripts\Configure-RedisSecret.ps1 -Endpoint "REDIS_HOST" -Port 6379 -UseSsl $true
```

`User Secrets` yalnızca geliştirme içindir ve Git tarafından izlenmez. Production ortamında aynı anahtarlar environment variable veya deployment secret’ı olarak verilmelidir:

```dotenv
ConnectionStrings__MarketplaceDatabase=...
Jwt__SigningKey=...
Redis__Endpoint=...
Redis__Port=6379
Redis__User=default
Redis__Password=...
Redis__UseSsl=true
```

### API’leri çalıştırma

İki ayrı PowerShell terminali açın:

```powershell
dotnet run --project src/Services/Auth/LocalCart.Auth.Api
```

```powershell
dotnet run --project src/Services/Product/LocalCart.Product.Api
```

İlk başlangıçta EF Core migration’ları Supabase’e otomatik uygulanır. Product migration’ı `pg_trgm` uzantısını, arama indekslerini ve beş başlangıç kategorisini oluşturur.

Servis adresleri:

| Servis | Adres |
| --- | --- |
| Auth Swagger | <http://localhost:5001/swagger> |
| Product Swagger | <http://localhost:5002/swagger> |
| Auth readiness | <http://localhost:5001/health/ready> |
| Product readiness | <http://localhost:5002/health/ready> |

## Swagger üzerinden uçtan uca kullanım

1. <http://localhost:5001/swagger> adresini açın.
2. `/api/v1/auth/register` üzerinden `Seller` hesabı oluşturun.
3. Dönen `accessToken` değerini kopyalayın.
4. <http://localhost:5002/swagger> adresini açın.
5. **Authorize** düğmesine basarak access token’ı girin.
6. `/api/v1/categories` üzerinden kategori kimliği alın.
7. `POST /api/v1/products` ile ürün oluşturun.
8. `GET /api/v1/products` üzerinden filtreleme, sıralama ve sayfalamayı deneyin.
9. Response içindeki `version` değeriyle ürünü güncelleyin veya silin.

Aynı akış hazır isteklerle [requests/LocalCart.http](requests/LocalCart.http) dosyasından da çalıştırılabilir.

## API özeti

### Auth API

| Method | Route | Erişim | Açıklama |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public | Customer/Seller kaydı |
| `POST` | `/api/v1/auth/login` | Public | Giriş ve token üretimi |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh token rotation |
| `POST` | `/api/v1/auth/revoke` | Public | Refresh token iptali |
| `GET` | `/api/v1/auth/me` | JWT | Mevcut kullanıcı bilgisi |

### Product API

| Method | Route | Erişim | Açıklama |
| --- | --- | --- | --- |
| `GET` | `/api/v1/products` | Public | Cache’li, filtrelenebilir ürün listesi |
| `GET` | `/api/v1/products/{id}` | Public | Cache’li ürün detayı |
| `GET` | `/api/v1/products/mine` | Seller | Giriş yapan satıcının ürünleri |
| `POST` | `/api/v1/products` | Seller/Admin | Ürün oluşturma Command’ı |
| `PUT` | `/api/v1/products/{id}` | Sahibi/Admin | Ürün güncelleme Command’ı |
| `DELETE` | `/api/v1/products/{id}?version=...` | Sahibi/Admin | Soft delete Command’ı |
| `GET` | `/api/v1/categories` | Public | Cache’li kategori listesi |

## Derleme ve test

```powershell
dotnet tool restore
dotnet restore LocalCart.sln
dotnet build LocalCart.sln --configuration Release --no-restore -m:1
dotnet test LocalCart.sln --configuration Release --no-build -m:1
```

`-m:1` zorunlu değildir. Kaynakları kısıtlı Windows ortamlarında deterministik MSBuild çıktısı almak için kullanılabilir.

### Doğrulama sonuçları

Mevcut backend sürümünde aşağıdaki kontroller başarıyla tamamlanmıştır:

- Release build: **0 hata, 0 uyarı**
- Auth unit testleri: **3/3 başarılı**
- Product unit testleri: **3/3 başarılı**
- Auth HTTP integration testleri: **3/3 başarılı**
- Product HTTP integration testleri: **4/4 başarılı**
- Toplam test: **13/13 başarılı**
- Auth migration SQL üretimi: **başarılı**
- Product migration SQL üretimi: **başarılı**
- `pg_trgm` ve GIN indeks SQL doğrulaması: **başarılı**
- Doğrudan ve transitif NuGet güvenlik açığı taraması: **bilinen açık bulunmadı**
- Secret taraması: **repository’de parola veya JWT signing key bulunmadı**

Test edilen kritik davranışlar:

- Public kayıt üzerinden Admin rolü oluşturulamaması
- Zayıf parolanın validation’dan geçmemesi
- Yinelenen e-posta kontrolünün parola hashlenmeden önce yapılması
- Seller kaydında parola ve refresh token’ın hashlenerek saklanması
- Ürün güncellemesinde version değerinin değişmesi
- Sıfır stoklu yayınlanmış ürünün `OutOfStock` durumuna geçmesi
- Ürün oluştururken giriş yapan Seller kimliğinin sahip olarak atanması
- Ürün oluşturulduğunda liste cache sürümünün artırılması
- Cache hit durumunda PostgreSQL repository’sine gidilmemesi
- API live health endpoint’lerinin dış servise ihtiyaç duymadan cevap vermesi
- Auth register endpoint’inin doğru JSON ve `201 Created` üretmesi
- JWT bulunmadığında ürün yazma endpoint’inin `401 Unauthorized` dönmesi
- Customer rolünün ürün yazma işleminde `403 Forbidden` alması
- Seller rolünün geçerli JWT ile ürün oluşturabilmesi

HTTP integration testleri `WebApplicationFactory` ile gerçek routing, middleware, JSON, authentication ve authorization hattını çalıştırır. Dış servisler kontrollü test doubles ile değiştirildiği için bu testler Docker, Supabase veya Redis bağlantısı gerektirmez. Production başlangıcında migration otomatik uygulanmaya devam eder; yalnızca integration test host’u `Database:ApplyMigrationsOnStartup=false` ayarını kullanır.

> Supabase ve Upstash Redis doğrulaması tamamlandı: Auth ve Product migration’ları gerçek Supabase PostgreSQL veritabanına uygulandı; `identity` ve `catalog` şemaları oluşturuldu. Her iki readiness endpoint’i `200 Healthy` döndü. Kategori sorgusunda gerçek cache miss/hit, JWT’li ürün oluşturma–güncelleme–soft delete akışında ise sürümlü liste cache invalidation davranışı uçtan uca doğrulandı.

## EF Core migration işlemleri

Repository yerel `dotnet-ef` aracını manifest üzerinden sabitler:

```powershell
dotnet tool restore
```

Yeni Auth migration’ı:

```powershell
dotnet ef migrations add MigrationName --project src/Services/Auth/LocalCart.Auth.Infrastructure --context AuthDbContext --output-dir Persistence/Migrations
```

Yeni Product migration’ı:

```powershell
dotnet ef migrations add MigrationName --project src/Services/Product/LocalCart.Product.Infrastructure --context ProductDbContext --output-dir Persistence/Migrations
```

Her iki `DbContext` için tasarım-zamanı factory bulunduğundan migration üretimi, API’nin runtime secret veya Redis yapılandırmasına bağlı değildir. Tek Supabase veritabanı kullanıldığı hâlde migration history tabloları servis şemalarında ayrı tutulur.

## Git bilgisi

- Geliştirme branch’i: `test/v1.0.0`
- İlk backend commit’i: `9d429ae feat(backend): bootstrap auth and product services`

## Mevcut kapsamın dışında kalanlar

Aşağıdaki özellikler bilinçli olarak ilk backend kapsamına alınmamıştır:

- Sipariş ve ödeme sistemi
- Favoriler ve ürün yorumları
- Kupon sistemi
- Dosya yükleme servisi
- Message broker
- Admin frontend paneli
- Next.js e-ticaret frontend’i

Bu karar, yedi günlük görev kapsamında Auth, CQRS, PostgreSQL, Redis, JWT, cache tutarlılığı ve API kalitesini eksiksiz teslim etmeye odaklanmak için verilmiştir.

## Sonraki adımlar

1. GitHub Actions üzerinde restore, build, test ve secret taraması çalıştırmak
2. Test coverage raporu ve minimum coverage eşiği eklemek
3. Next.js 14+ App Router frontend’ini geliştirmek
4. Türkçe/İngilizce `next-intl`, RTK sepet, SSR/ISR ve dinamik SEO metadata eklemek
