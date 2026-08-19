# Fiyat Teklif Formu (TeklifMaster Pro)

Hızlı ve kolay fiyat teklifi oluşturmanıza yarayan, tarayıcıda çalışan bir **React + TypeScript + Vite** uygulamasıdır. Verilerin tamamı **IndexedDB**'de yerel olarak saklanır; internet bağlantısı olmadan da çalışır (**PWA**). PDF ve Excel (XLSX/CSV) çıktısı üretir.

## Özellikler

- Çok sekmeli teklif düzenleyici (yeni / kaydet / yükle / kopyala / sil / geri dönüşüm)
- Müşteri, firma, banka bilgileri yönetimi ve ürün kataloğu
- Vergi (KDV) ve indirim hesaplamaları, para birimi desteği ve döviz çevirici
- **PDF çıktısı**: 6 tema (Modern, Klasik, Minimal, Kurumsal, Pro, Bold) ve kapsamlı görünüm/yerleşim/tipografi ayarları
- Excel ve CSV içe / dışa aktarım
- Veritabanı yedekleme / geri yükleme, verileri temizleme
- Türkçe / İngilizce / Almanca arayüz (i18n)
- PWA: çevrimdışı kullanım, otomatik güncelleme bildirimi

## Teknolojiler

- **React 19 + TypeScript** (strict)
- **Vite 7** (build), **Vitest** (birim testleri), **Playwright** (E2E)
- **Tailwind CSS 3** + özel CSS tasarım token'ları
- **IndexedDB** (yerel depolama), `@dnd-kit` (sürükle-bırak tablo), `lucide-react` (ikonlar)
- **html2pdf.js / html2canvas** (PDF), **xlsx** (Excel), **zod** (şema doğrulama)

## Başlangıç

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # üretim derlemesi (dist/)
npm run preview   # üretim derlemesini önizle
```

## Kalite Komutları

```bash
npm run typecheck    # tsc --noEmit (tip denetimi)
npm run lint         # ESLint
npm run test:run     # Vitest (birim testleri)
npx playwright test  # E2E testler (önce dev sunucusu açık: npm run dev)
```

## Cast Sayacı

`as any` kullanımı tip güvenliğini bozar; projede regresyonu engellemek için:

- ESLint kuralı: `no-restricted-syntax` yeni `as any` cast'lerini **lint hatası** olarak yakalar (`scripts/scan-casts.mjs` ile aynı eşikte).
- Sayaç: `node scripts/scan-casts.mjs --threshold 0` → `TOTAL: N` çıktısı; eşik aşılırsa `::warning` basar (CI build'i yine de geçer).
- CI: `.github/workflows/typecheck.yml` her push/PR'da typecheck + lint + test + cast sayacını çalıştırır.

Mevcut durum: **0 cast** (`TOTAL: 0`). Yeni `as any` ekleyen bir değişiklik hem lint'te hem CI'da uyarı/hatayla işaretlenir.

## Code Health

🛡️ `as any` casts = **0** (was 47) · explicit `any` = **0** · `tsc` 0 hata · `eslint` 0 hata · tests **105/105** · build ✓

Tüm metrikler CI'da `.github/workflows/typecheck.yml` üzerinden otomatik doğrulanır; sıfırdan sapma (yeni `any`, yeni `as any`, lint/type hatası, başarısız test) pull request'i bloke eder.

## Tip Güvenliği

Proje **sıfır `any`** hedefiyle yönetilir; `@typescript-eslint/no-explicit-any` kuralı `error` seviyesinde aktiftir — kod tabanında hiçbir explicit `any` kalmamıştır (IndexedDBManager generic `T = unknown` imzalarla, form `onChange` imzaları daraltılmış, PDF temaları `QuoteItem[][]` ile, UI field'ları HTML attribute tipiyle genişletilmiştir). Yeni `any` ekleyen bir değişiklik lint hatası verir.

## Mimari

Uygulama, teklif durumunu **odaklı context'lere** bölünmüş hâlde yönetir (`src/context/quote/`):

| Context | Sorumluluk |
|---------|-----------|
| `DatabaseContext` | IndexedDB bağlantısı ve `db` erişimi |
| `TabContext` | Sekmeler, aktif sekme, geri alma / ileri alma (undo-redo) ve geçmiş |
| `QuoteDataContext` | Aktif sekmenin teklif/müşteri/firma/kalem/indirim/banka verileri; kaydet, yükle, sıfırla, yedekleme |
| `PdfConfigContext` | PDF görünüm / yerleşim ayarları (localStorage ile kalıcı) |
| `SaveStatusContext` | Otomatik kaydetme durumu (idle / saving / saved / error) |
| `ConfirmContext` | Global onay penceresi |
| `CompanyDefaultsContext` | Varsayılan firma bilgileri |
| `QuoteContext` | Yukarıdakileri birleştiren üst sağlayıcı (`<QuoteProvider>`) ve eski kullanım için `useQuote()` |

Bileşenler ihtiyaç duydukları context'i doğrudan tüketir (`useTab`, `useQuoteData`, `usePdfConfig`, ...) — böylece alakasız context değişimlerinde gereksiz yeniden render olmaz.

## Veri Katmanı

- `src/utils/indexedDBManager.ts` — IndexedDB bağlantısı, şema ve sürüm / migrasyon yönetimi
- `src/hooks/useIndexedDB.ts` — `db` ve hazırlık durumunu context'e bağlar
- Store'lar: `customers`, `products`, `quotes`, `templates`, `bankInfo`, `settings`
- Yedekleme, tüm store'ları tek bir JSON dosyasına dışa aktarır / içe alır

## PDF Temaları ve Ayarlar

`src/components/pdf-themes/` altında 6 tema bulunur; hepsi `PdfConfig` içindeki ortak ayarları tutarlı şekilde uygular: bölüm aç/kapa, logo konumu/boyutu, filigran, sayfa numaraları, tablo başlığı / çizgi / zebra renkleri, tipografi (başlık / özet / alt bilgi), kenar boşlukları ve sayfa yönü, özel alt bilgi (`customFooter`) ve koşullar / notlar.

Tema seçimi ve ayrıntılı ayarlar **PDF önizleme paneli**nden yapılır; ayarlar `localStorage`'a kaydedilir.

## Klasör Yapısı

```
src/
├── components/     # UI bileşenleri, modallar, PDF temaları, ayarlar sekmeleri
├── context/        # Uygulama durumu (quote context'leri + UI)
├── hooks/          # useIndexedDB, useDebounce, useTranslation, ...
├── utils/          # hesap, PDF üretimi, Excel, IndexedDB, temalar, yardımcılar
├── types/          # Tip tanımları (varlıklar, teklif, ayarlar)
├── styles/         # CSS token'ları, bileşen ve animasyon stilleri
└── __tests__/      # Vitest birim testleri
```

## Docker / Nginx

Depoda hazır `Dockerfile`, `docker-compose.yml` ve `nginx.conf` (SPA yönlendirme, gzip, güvenlik başlıkları) bulunur. Build çıktısı (`dist/`) Nginx'e kopyalanır.

## Lisans

Özel proje — eğitim / şirket içi kullanım.