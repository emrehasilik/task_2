# LocalCart Frontend

LocalCart frontend’i; .NET Auth ve Product servislerini kullanan, Türkçe/İngilizce, SEO odaklı ve responsive bir e-ticaret deneyimidir.

## Teknolojiler

- Next.js 16.3 (14+ gereksinimini karşılayan App Router)
- React 19 ve TypeScript
- Tailwind CSS 4
- `next-intl` ile Türkçe/İngilizce yönlendirme ve mesaj sözlükleri
- Redux Toolkit ve React Redux ile kalıcı global sepet
- Supabase Storage ile satıcı ürün görseli yönetimi
- Vitest ile reducer ve locale algılama testleri
- Lucide React erişilebilir ikon seti

## Fonksiyonlar

| Gereksinim | Uygulama |
| --- | --- |
| Login / register | Auth Servisi’ne Next.js Route Handler üzerinden bağlanır |
| Güvenli oturum | Access ve refresh token’lar JavaScript’e açılmayan `HttpOnly` cookie’lerde tutulur |
| Ürün listesi | Product Servisi’nden SSR olarak alınır ve responsive grid’de gösterilir |
| Filtreleme | Arama, kategori, minimum/maksimum fiyat ve sıralama URL parametreleriyle çalışır |
| Ürün detay | `/{locale}/products/[id]` dinamik route’u kullanılır |
| Sepet | RTK store içinde yönetilir ve `localStorage` ile cihazda kalıcı tutulur |
| SSR / ISR | Liste sorguları server-render edilir; ana sayfa ve ürün istekleri 60 saniyelik revalidation kullanır |
| SEO | Dinamik ürün title/description, canonical, `hreflang`, Open Graph, sitemap ve robots bulunur |
| Görseller | `next/image` ile AVIF/WebP optimizasyonu, responsive boyutlar, lazy load ve hata fallback’i kullanılır |
| Çoklu dil | Türkçe ve İngilizce sayfalar ayrı, taranabilir URL’lere sahiptir |
| Responsive UI | Mobil menü, dokunmatik kontroller ve klavye focus durumları desteklenir |
| Satıcı paneli | Satıcıya özel ürün listesi, mağaza özeti ve responsive yönetim alanı bulunur |
| Ürün yönetimi | Ürün ekleme, düzenleme ve sahiplik kontrollü silme işlemleri desteklenir |
| Ürün görseli | Satıcı cihazdan JPG/PNG/WebP seçer; dosya Supabase Storage’da, public URL ürünün PostgreSQL kaydında tutulur |
| Güvenli satıcı BFF | HttpOnly JWT yenilenir ve Product API komutlarına sunucu tarafından aktarılır |
| Rol ayrımı | Satıcı yalnızca kendi ürün panelini görür; katalog, sepete ekleme ve sepet route’ları satıcıya kapalıdır |
| Düşük stok | Arşivlenmemiş ürünlerde 1–5 adet düşük stok; 0 adet tükenmiş; 6+ sağlıklı kabul edilir |

## Rol davranışı

| Yetki | Müşteri | Satıcı |
| --- | --- | --- |
| Tüm yayınlanmış ürünleri görme | Evet | Alışveriş UI’ında hayır |
| Sepete ekleme ve sepet sayfası | Evet | Hayır |
| Satıcı paneli | Hayır | Evet |
| Panelde gösterilen ürünler | — | Yalnızca JWT sahibinin ürünleri |
| Ürün ekleme/düzenleme/silme | Hayır | Yalnızca kendi ürünleri |

Satıcı `/`, `/products/*` veya `/cart` route’una giderse locale korunarak `/seller` sayfasına yönlendirilir. Satıcı login olduğunda daha önce müşteri rolünden kalmış yerel sepet temizlenir. Bu kontroller UX katmanıdır; asıl yetkilendirme ve sahiplik Product API tarafından tekrar uygulanır.

## Dil ve ülke algılama

Dil seçimi aşağıdaki öncelik sırasıyla yapılır:

1. URL’de açıkça seçilen dil (`/tr` veya `/en`)
2. Daha önce seçilen ve `NEXT_LOCALE` cookie’sinde saklanan dil
3. Tarayıcının `Accept-Language` başlığı
4. Vercel `x-vercel-ip-country` veya Cloudflare `cf-ipcountry` ülke başlığı
5. Son varsayılan dil

Türkiye ülke kodu Türkçe’ye, desteklenmeyen diğer ülkeler İngilizce’ye yönlenir. Ülke ile dil her zaman aynı olmadığı için kullanıcı seçimi ve tarayıcı dili ülke bilgisinden önceliklidir.

Ücretsiz otomatik çeviri API’si kullanılmaz. Böylece arayüz metinleri tutarlı, hızlı, gizlilik dostu ve arama motorları için deterministik kalır. Çeviri sözlükleri `messages/tr.json` ve `messages/en.json` dosyalarındadır.

## Yerel kurulum

Gereksinimler:

- Node.js 20.9 veya üzeri
- Çalışan Auth API: `http://localhost:5001`
- Çalışan Product API: `http://localhost:5002`

Ortam dosyasını hazırlayın:

```powershell
Copy-Item .env.example .env.local
```

Supabase Dashboard’da **Storage → New bucket** adımlarını izleyip `product-images` adında public bir bucket oluşturun. Bucket için en fazla 5 MB dosya boyutu ve `image/jpeg`, `image/png`, `image/webp` MIME türlerini tanımlayın. Ardından **Project Settings → API Keys** ekranından yalnızca sunucuda kullanılacak secret key’i kopyalayıp aşağıdaki komutu çalıştırın:

```powershell
.\scripts\Configure-StorageSecret.ps1
```

Script anahtarı panodan alarak Git tarafından izlenmeyen `.env.local` dosyasına kaydeder ve ekrana yazdırmaz. Secret key’i tarayıcı koduna, `NEXT_PUBLIC_` değişkenine veya Git’e eklemeyin.

Bağımlılıkları kurup uygulamayı başlatın:

```powershell
npm ci
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır. `/` isteği algılanan dile göre `/tr` veya `/en` adresine yönlendirilir.

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `AUTH_API_URL` | `http://localhost:5001` | Next.js sunucusunun erişeceği Auth API adresi |
| `PRODUCT_API_URL` | `http://localhost:5002` | Next.js sunucusunun erişeceği Product API adresi |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical, sitemap ve sosyal metadata temel adresi |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Unsplash, Pexels, Pixabay CDN’leri | `next/image` için izin verilen virgülle ayrılmış HTTPS host’ları |
| `SUPABASE_URL` | — | Supabase projesinin `https://<project-ref>.supabase.co` adresi |
| `SUPABASE_SECRET_KEY` | — | Yalnızca Next.js sunucusunun kullandığı Storage secret key’i; eski projelerde `SUPABASE_SERVICE_ROLE_KEY` de desteklenir |
| `SUPABASE_PRODUCT_IMAGES_BUCKET` | `product-images` | Ürün görsellerinin tutulduğu public Storage bucket’ı |

`SUPABASE_SECRET_KEY` bir frontend değişkeni değildir: yalnızca Route Handler içinde, satıcı JWT’si ve rolü doğrulandıktan sonra kullanılır. Gerçek değer `.env.local` içinde kalır ve `.gitignore` tarafından dışlanır.

## Kalite komutları

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions, pull request ve `test/v1.0.0` push’larında `npm ci`, production dependency audit, lint, type-check, unit test ve production build adımlarını otomatik çalıştırır.

Vitest; RTK sepeti, locale algılama, form/slug yardımcıları, görsel magic-byte politikası, rol route’ları ve düşük stok sınırlarını kapsar. Tam backend + frontend kurulum sırası, demo hesaplar ve dağıtım planı için kök [README](../README.md) dosyasına bakın.

Son doğrulamada lint ve type-check temiz, **6 test dosyasında 26/26 test** başarılı ve Next.js production build 24 sayfayı hatasız üretmiştir. Production npm audit’inde bilinen açık bulunmamıştır.

## Önemli route’lar

- `/{locale}`: ISR ana sayfa
- `/{locale}/products`: SSR ürün listesi ve filtreler
- `/{locale}/products/{id}`: Dinamik ürün detay ve metadata
- `/{locale}/cart`: RTK sepeti
- `/{locale}/login`: Giriş
- `/{locale}/register`: Müşteri/satıcı kaydı
- `/{locale}/seller`: Rol korumalı satıcı paneli ve satıcının kendi ürünleri
- `/{locale}/seller/products/new`: Yeni ürün oluşturma
- `/{locale}/seller/products/{id}/edit`: Sahiplik kontrollü ürün düzenleme
- `/sitemap.xml` ve `/robots.txt`: Teknik SEO çıktıları

## Mimari notlar

- Ürün verileri Redux’a kopyalanmaz; Server Components ve URL search params kullanılır. RTK yalnızca global, değişken sepet durumu için kullanılır.
- Auth proxy’si backend token’larını tarayıcı JavaScript’inden izole eder ve refresh token rotation akışını destekler.
- Satıcı BFF route’ları her istekte oturumu ve `Seller` rolünü doğrular; Product API de ürün sahipliğini yeniden kontrol eder.
- Görsel yüklemede istemcinin bildirdiği MIME türüne güvenilmez; dosya imzası, türü ve 5 MB sınırı sunucuda yeniden doğrulanır. Dosya yolu satıcı kimliği ve rastgele UUID ile oluşturulur.
- Ürün oluşturma/güncelleme başarısız olursa yeni yüklenen görsel geri alınır. Görsel değiştirme ve ürün silme başarılı olduğunda yalnızca aynı Supabase projesinde o satıcıya ait eski nesne temizlenir.
- Görselin binary içeriği PostgreSQL ürün tablosuna yazılmaz. Supabase Storage nesneyi yönetir; Product Service yalnızca public `ImageUrl` değerini PostgreSQL’de saklar.
- Ürün komutları başarıyla tamamlandığında müşteri ana sayfası, liste ve detay cache’leri yeniden doğrulanır.
- Backend geçici olarak kapalıysa production build başarısız olmaz; kullanıcıya açık bir servis durumu gösterilir ve ISR sonraki istekte veriyi yeniden dener.
- Uzak ürün görselleri güvenlik nedeniyle sınırsız host kabul etmez. Supabase public storage yolları ile ortam değişkeninde açıkça izin verilen host’lar optimize edilir; diğer kaynaklar güvenli placeholder’a düşer.
- Ödeme akışı görev kapsamında olmadığı için sepet özetinde bilinçli olarak pasif gösterilir.
