# DGS Geometri

Telefonda ana ekrana kurulan, internetsiz çalışan DGS geometri soru uygulaması.
Derleme adımı yok — saf HTML + CSS + ES modules. Dosyaları statik olarak sunmak yeterli.

## Modlar

| Mod | Ne yapar |
|---|---|
| Günlük 10 soru | Tekrar zamanı gelenler önce; aynı gün hep aynı set gelir. Bitirince seri artar. |
| Sadece yanlışlarım | Son denemesi yanlış olan sorular. Üst üste 2 doğru cevaplanınca listeden düşer. |
| Süreli mini test | 10 soru, geri sayımlı. Çözümler sonuç ekranında topluca. |
| Konu seçip çöz | Konu → alt konu, süresiz, çözüm anında görünür. |

### Soru sırası

Öğrenme modlarında (günlük rutin, konu ve alt konu çalışması) sıra şudur: önce Leitner
kutusunda **tekrar zamanı gelmiş** sorular, ardından geri kalanlar `difficulty` alanına göre
**kolay → orta → zor**. Bloğun içindeki sıra rastgeledir, yani kademe korunur ama soru sırası
ezberlenmez. Zor bloğa geçerken bir kez, kapatılabilir bir hatırlatma satırı çıkar.

**Süreli mini test bunun dışındadır**: sınav koşulunu taklit etmesi için sorular karışık gelir.
"Sadece yanlışlarım" da değişmez; orada en eski görülen soru başta gelir.

Her soruda şıklar, **"Soru ne istiyor?"** satırı açılana kadar pasiftir. Bu davranış
İstatistik ve ayarlar → *Şıkları hemen aç* ile kapatılabilir.

Ayrıca ana ekranda bir **Formüller** bölümü var: konu başına formül kartları. Aynı kart,
o konuda yanlış cevap verdiğinde çözümün hemen altında da çıkar.

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

Bir paket ya bir **alt konudur** (Üçgenler → Pisagor bağıntısı) ya da bir konunun **tamamıdır**.
Farkı yalnızca `data/index.json` kaydındaki `subtopicId`/`subtopic` alanlarının varlığı belirler:
varsa konu ekranı ara bir alt konu listesi açar, yoksa doğrudan oturuma girer.

1. `data/packs/` altına yeni bir JSON koy.
2. Konu yeniyse `data/index.json` içindeki `topics` dizisine bir satır ekle.
3. Aynı dosyadaki `packs` dizisine bir kayıt ekle:

```json
{
  "id": "ucgen-pisagor",
  "topicId": "ucgenler",
  "topic": "Üçgenler",
  "subtopicId": "ucgen-pisagor",
  "subtopic": "Pisagor bağıntısı",
  "title": "Pisagor bağıntısı",
  "file": "packs/ucgen-pisagor.json",
  "count": 6,
  "version": 1
}
```

Düz (alt konusuz) bir konu için `subtopicId` ve `subtopic` alanlarını hiç yazma.

4. `sw.js` içindeki `VERSION`'ı artır ki paket cache'e alınsın.

Konu listesi, alt konu listesi, günlük havuz ve mini testin konulara yayılması bu dosyadan türer.
`topicId` kararlı kimliktir (rotalarda ve formül dosyalarında kullanılır); `topic` ise ekranda
görünen addır.

### Soru şeması

```json
{
  "id": "acilar-003",
  "label": "Paralel doğrular arasında kırık doğru",
  "difficulty": 2,
  "stem": "Şekilde d₁ ∥ d₂ ...",
  "asks": "x açısının ölçüsü isteniyor; ...",
  "figure": "<svg viewBox='0 0 320 200'>…</svg>",
  "choices": ["30", "40", "50", "60", "70"],
  "answer": 2,
  "solution": "İç ters açılar eşittir …"
}
```

- `topic`, `topicId`, `subtopic` ve `subtopicId` sorunun kendisinde yazılmaz — paket kaydından
  devralınır. İstersen soru düzeyinde yazıp paketi ezebilirsin.
- `label` isteğe bağlıdır: alt konu paketi içindeki sorunun kendi başlığı. Alt konu adının
  yanında ince yazıyla görünür.
- `difficulty` isteğe bağlıdır ama sıralamayı belirler: `1` kolay, `2` orta, `3` zor. Yazılmazsa
  soru **orta** sayılır. Öğrenme modları bu alana göre kolaydan zora dizilir (bkz. *Soru sırası*).
- `asks` zorunludur — "Soru ne istiyor?" satırının kaynağıdır. Cevabı vermez, soruyu tercüme eder.
- `answer`, `choices` içindeki indekstir (0 = A).
- `figure` isteğe bağlıdır. SVG metni beyaz listeden geçirilir: `script`, `on*` nitelikleri ve
  dış kaynak referansları atılır. Çizgiler için `currentColor` kullan.
- Bozuk bir soru sessizce atlanır ve konsola uyarı düşer; paketin geri kalanı çalışmaya devam eder.
- Soru `id`'si ilerlemenin anahtarıdır. Bir soruyu başka pakete taşımak ilerlemeyi bozmaz,
  ama `id`'sini değiştirmek o sorunun geçmişini sıfırlar.

## Formül kartları

Kartlar `data/formuller/` altında, konu başına bir dosyada durur. Yeni bir set eklemek için
dosyayı koy, `data/formuller/index.json` içindeki `sets` dizisine bir satır yaz, `VERSION`'ı artır.

```json
{
  "id": "ucgen-pisagor",
  "subtopicId": "ucgen-pisagor",
  "title": "Pisagor bağıntısı",
  "aliases": ["Pisagor bağıntısı"],
  "items": [
    { "formula": "a² + b² = c²", "note": "c hipotenüs — dik açının karşısındaki kenar" },
    { "formula": "Dış açı = komşu olmayan iki iç açının toplamı",
      "figure": "<svg viewBox='0 0 320 150'>…</svg>" }
  ],
  "tips": ["Önce dik açının hangi köşede olduğunu bul."]
}
```

Her formül girdisi isteğe bağlı bir `figure` alabilir: soru şekilleriyle aynı biçim ve aynı beyaz
liste (bkz. *Soru şeması*). Şekil formülün üstünde görünür; şekli olmayan formüller değişmez.
Formüller ekranında şekil doğrudan açıktır, oturum ve sonuç ekranında ise kart uzamasın diye
"Şekil" düğmesinin altında katlı gelir. Kartlarda şekiller `viewBox='0 0 320 150'` civarında,
basık tutulur — dar telefonda SVG yaklaşık 270px genişliğe iner.

Bir kart soruya iki yoldan bağlanır:

1. **`subtopicId`** — alt konu paketleri için birebir eşleşme.
2. **`aliases`** — düz konularda sorunun `subtopic` ya da `label` metniyle eşleşir.

Kart bulunamazsa hiçbir şey gösterilmez; soru yine normal çalışır. Formüller düz metindir
(`²`, `√`, `·`, `°` gibi Unicode karakterler) — MathJax/KaTeX gibi bir bağımlılık yoktur.

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
  packs.js formulas.js store.js scheduler.js quiz.js svg.js scratchpad.js ui.js
  screens/              home, session, result, topics, formulas, stats
data/
  index.json            konu ve paket kaydı — genişleme noktası
  packs/                soru paketleri (alt konu ya da tam konu)
  formuller/
    index.json          formül seti kaydı
    *.json              konu başına formül kartları
icons/                  make-icons.ps1 ile üretilir
tools/
  serve.ps1             bağımlılıksız local sunucu
  make-icons.ps1        ikon üretici
```

`tools/serve.ps1` yalnızca geliştirme içindir; `localhost`u dinler ve sayfanın ürettiği bir
görüntüyü `tools/.preview/preview.png` dosyasına yazan bir `POST /__preview` uç noktası içerir
(şekilleri gözden geçirmek için). Yayına giden statik dosyalar arasında yer almaz.
