# DGS Geometri

Telefonda ana ekrana kurulan, internetsiz çalışan DGS geometri soru uygulaması.
Derleme adımı yok — saf HTML + CSS + ES modules. Dosyaları statik olarak sunmak yeterli.

## Modlar

| Mod | Ne yapar |
|---|---|
| Günlük 10 soru | Tekrar zamanı gelenler önce; aynı gün hep aynı set gelir. Bitirince seri artar. |
| Sadece yanlışlarım | Son denemesi yanlış olan sorular. Üst üste 2 doğru cevaplanınca listeden düşer. |
| Süreli mini test | 10 soru, geri sayımlı. Çözümler sonuç ekranında topluca. |
| Konu seçip çöz | Konuya göre filtreli, süresiz, çözüm anında görünür. |

Her soruda şıklar, **"Soru ne istiyor?"** satırı açılana kadar pasiftir. Bu davranış
İstatistik ve ayarlar → *Şıkları hemen aç* ile kapatılabilir.

## Localde çalıştırma

Node ya da Python gerekmez; sunucu saf PowerShell'dir.

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Sonra `http://localhost:8080`. Port meşgulse: `-Port 8090`.

`localhost` güvenli bağlam sayıldığı için service worker ve "ana ekrana ekle" burada da çalışır.

### Geliştirirken

Service worker cache-first çalışır, yani değiştirdiğin dosya eski haliyle gelebilir. İki yol var:

- `sw.js` içindeki `VERSION` sabitini artır (sayfada "Yeni sürüm hazır" bandı çıkar), veya
- Tarayıcı araçlarından service worker'ı kaydı sil ve cache'i temizle.

## Yeni soru paketi ekleme

Kodda hiçbir yeri değiştirmen gerekmez.

1. `data/packs/` altına yeni bir JSON koy.
2. `data/index.json` içindeki `packs` dizisine bir kayıt ekle:

```json
{
  "id": "geo-katicisimler",
  "title": "Katı Cisimler",
  "topic": "Katı Cisimler",
  "file": "packs/geo-katicisimler.json",
  "count": 10,
  "version": 1
}
```

3. `sw.js` içindeki `VERSION`'ı artır ki paket cache'e alınsın.

Konu listesi, günlük havuz ve konu seçim ekranı bu dosyadan türer.

### Soru şeması

```json
{
  "id": "acilar-003",
  "topic": "Açılar",
  "subtopic": "Paralel doğrular ve kesen",
  "difficulty": 2,
  "stem": "Şekilde d₁ ∥ d₂ ...",
  "asks": "x açısının ölçüsü isteniyor; ...",
  "figure": "<svg viewBox='0 0 320 200'>…</svg>",
  "choices": ["30", "40", "50", "60", "70"],
  "answer": 2,
  "solution": "İç ters açılar eşittir …"
}
```

- `asks` zorunludur — "Soru ne istiyor?" satırının kaynağıdır. Cevabı vermez, soruyu tercüme eder.
- `answer`, `choices` içindeki indekstir (0 = A).
- `figure` isteğe bağlıdır. SVG metni beyaz listeden geçirilir: `script`, `on*` nitelikleri ve
  dış kaynak referansları atılır. Çizgiler için `currentColor` kullan.
- Bozuk bir soru sessizce atlanır ve konsola uyarı düşer; paketin geri kalanı çalışmaya devam eder.

## İlerleme ve yedekleme

İlerleme telefonun tarayıcısında (`localStorage`, `dgs.progress.v1`) saklanır. Tarayıcı verilerini
temizlersen ya da telefon değiştirirsen gider — İstatistik ekranından JSON yedek al.

Tekrar takvimi hafif bir Leitner sistemidir: kutu 1-5, aralıklar 0 / 1 / 3 / 7 / 16 gün.
Doğru cevap bir üst kutuya çıkarır, yanlış cevap 1. kutuya düşürür.

## Telefona kurma

PWA kurulumu HTTPS ister (`localhost` istisnadır). Bu depo GitHub Pages ile yayınlanır.

Kod zaten [github.com/ismailsubasi049-code/dgs-geometri](https://github.com/ismailsubasi049-code/dgs-geometri)
adresinde. Yayını açmak için depo ayarlarından:

**Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**

Bir iki dakika sonra site şu adreste yayında olur:

```
https://ismailsubasi049-code.github.io/dgs-geometri/
```

Bu adresi telefonda aç, tarayıcı menüsünden **Ana ekrana ekle** de. Tüm yollar göreli olduğu için
alt dizinde sorunsuz çalışır.

Sonraki güncellemeler:

```bash
git add -A && git commit -m "..." && git push
```

Uygulamayı değiştirdiysen `sw.js` içindeki `VERSION`'ı da artır; yoksa telefondaki kurulu sürüm
eski dosyaları cache'ten sunmaya devam eder.

## Dosya düzeni

```
index.html              tek sayfa kabuk
manifest.webmanifest    PWA tanımı
sw.js                   service worker (VERSION sabitini güncellemeyi unutma)
css/app.css
js/
  app.js                hash router, service worker kaydı
  packs.js store.js scheduler.js quiz.js svg.js ui.js
  screens/              home, session, result, topics, stats
data/
  index.json            paket kaydı — genişleme noktası
  packs/                soru paketleri
icons/                  make-icons.ps1 ile üretilir
tools/
  serve.ps1             bağımlılıksız local sunucu
  make-icons.ps1        ikon üretici
```

`tools/serve.ps1` yalnızca geliştirme içindir; `localhost`u dinler ve sayfanın ürettiği bir
görüntüyü `tools/.preview/preview.png` dosyasına yazan `POST /__preview` uç noktası içerir
(şekilleri gözden geçirmek için). Yayına giden statik dosyalar arasında yer almaz.
