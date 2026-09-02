# DGS Matematik

Telefonda ana ekrana kurulan, internetsiz çalışan DGS matematik ve geometri soru uygulaması.
Derleme adımı yok — saf HTML + CSS + ES modules. Dosyaları statik olarak sunmak yeterli.

İçerik iki **ders** altında toplanır: Matematik ve Geometri. Ana ekranda her ders kendi
konu ve formül girişini alır; ayrım `data/index.json` ile `data/formuller/index.json`
içindeki `branches` dizisinden gelir (bkz. *Dersler*).

## Modlar

| Mod | Ne yapar |
|---|---|
| Günlük 10 soru | Tekrar zamanı gelenler önce; aynı gün hep aynı set gelir. Bitirince seri artar. |
| Sadece yanlışlarım | Son denemesi yanlış olan sorular. Üst üste 2 doğru cevaplanınca listeden düşer. |
| Süreli mini test | 10 soru, geri sayımlı. Çözümler sonuç ekranında topluca. |
| Konu seçip çöz | Ders → konu → alt konu, süresiz, çözüm anında görünür. |

### Soru sırası

Öğrenme modlarında (günlük rutin, konu ve alt konu çalışması) sıra şudur: önce Leitner
kutusunda **tekrar zamanı gelmiş** sorular, ardından geri kalanlar `difficulty` alanına göre
**kolay → orta → zor**. Bloğun içindeki sıra rastgeledir, yani kademe korunur ama soru sırası
ezberlenmez. Zor bloğa geçerken bir kez, kapatılabilir bir hatırlatma satırı çıkar.

**Süreli mini test bunun dışındadır**: sınav koşulunu taklit etmesi için sorular karışık gelir.
"Sadece yanlışlarım" da değişmez; orada en eski görülen soru başta gelir.

Her soruda şıklar, **"Soru ne istiyor?"** satırı açılana kadar pasiftir. Bu davranış
İstatistik ve ayarlar → *Şıkları hemen aç* ile kapatılabilir.

Ayrıca her ders için bir **Formüller** girişi var: konu başına formül kartları. Aynı kart,
o konuda yanlış cevap verdiğinde çözümün hemen altında da çıkar.

## Dersler

Konuların ve formül setlerinin üstünde bir **ders (branş)** düzeyi vardır. Ders listesi iki
index dosyasında da ayrı ayrı durur — Formüller bölümü soru paketlerinden bağımsız çalışsın,
paketler okunamasa bile açılabilsin diye.

```json
"branches": [
  { "id": "mat", "title": "Matematik", "emoji": "🔢" },
  { "id": "geo", "title": "Geometri", "emoji": "📐" }
]
```

Her konu (`topics[]`) ve her formül seti (`sets[]`) bir `branchId` taşır. Yazmayan kayıt
`geo` sayılır, yani eski veri kırılmaz.

Rotalar üç düzeylidir: `#/konular/{branchId}/{topicId}` ve `#/formuller/{branchId}/{topicId}`.
Ders parçası olmayan eski bağlantılar (`#/formuller/cember`) da çalışmaya devam eder.

Yeni bir ders eklemek için iki `branches` dizisine birer satır yazmak ve konuları o `branchId`
ile işaretlemek yeterli — ekran kodu değişmez. Ne sorusu ne formülü olan ders ana ekranda hiç
görünmez; yalnızca formülü olan ders ise konu kartını "soru paketleri henüz eklenmedi"
durumunda gösterir.

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
2. Konu yeniyse `data/index.json` içindeki `topics` dizisine bir satır ekle —
   `{ "id": "sayilar", "title": "Sayılar", "branchId": "mat" }`.
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

`topics` dizisinde yazılı olup hiç paketi olmayan konu, konu listesinde **görünmez**. Formül
kartları bundan bağımsızdır: paketi olmayan bir konunun formülleri yine okunur.

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
dosyayı koy, `data/formuller/index.json` içindeki `sets` dizisine bir satır yaz
(`branchId` dahil), `VERSION`'ı artır. Oradaki `cardCount` elle tutulur ve koddan
doğrulanmaz — dosyadaki gerçek kart sayısıyla aynı olmalı.

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
  "tips": ["Önce dik açının hangi köşede olduğunu bul."],
  "examples": [
    { "stem": "Dik kenarları 6 ve 8 olan üçgenin hipotenüsü kaçtır?",
      "solution": "6² + 8² = 36 + 64 = 100\n√100 = 10" }
  ]
}
```

`formula` metni `\n` ile çok satırlı yazılabilir (parçalı tanımlar için); satır sonları olduğu
gibi görünür.

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

### Örnek sorular (`examples`)

Kartın altında, çözümlü örnekler. Her örnek kapalı gelir: önce `stem` okunur, düşünülür,
sonra açılınca `solution` görünür. `solution` içinde `\n` satır sonu verir. İsteğe bağlı bir
`figure` de alabilir (aynı beyaz liste).

Bunlar **soru paketi değildir**: Leitner takvimine girmez, istatistiğe sayılmaz, sınavda
karşına çıkmaz. Yalnızca formülün nasıl kullanıldığını göstermek içindir. Sorulardaki
`answer` alanı bir *indeks* olduğu için burada bilerek kullanılmaz — sonuç `solution`
metninin sonunda yazılır.

Örnekler yalnızca Formüller ekranında görünür. `formulaCard()`'ın `showExamples` seçeneği
varsayılan olarak kapalıdır, böylece yanlış cevabın altında çıkan kart uzamaz.

## İlerleme ve yedekleme

İlerleme telefonun tarayıcısında (`localStorage`, `dgs.progress.v1`) saklanır. Tarayıcı verilerini
temizlersen ya da telefon değiştirirsen gider — İstatistik ekranından JSON yedek al.
Aynı ekrandaki **Yedekten geri yükle**, yedeği mevcut ilerlemeyle birleştirmez; onun yerine geçer.

Bu sessiz kayba karşı iki uyarı var (`js/backup.js`):

- **Açılış kapısı** — uygulama açılırken kayıtlı ilerleme bulamazsa sıfırdan başlamadan önce
  "İlerleme verisi bulunamadı, yedekten geri yüklemek ister misin?" diye sorar ve geri yükleme
  düğmesini oracıkta sunar. İlk kurulum ile silinmiş veri ayırt edilemez (ayırt edecek işaret de
  aynı depoda olurdu), o yüzden metin ikisini de kapsar. **Sıfırdan başla** denince boş durum
  hemen yazılır, kapı bir daha açılmaz.
- **Haftalık hatırlatma** — son yedeğin (hiç yedek yoksa ilk kurulumun) üzerinden 7 gün geçtiyse
  ana ekranda "En son X gün önce yedek aldın, yenilemek ister misin?" bandı çıkar. **Sonra**
  denince 3 gün susar. Hiç soru denenmemişse — kaybedilecek bir şey yokken — hiç çıkmaz.

Süreler `js/store.js` içindeki `BACKUP_REMIND_DAYS` ve `BACKUP_SNOOZE_DAYS` sabitlerinde.

### Soru bazlı süre ölçümü

Her cevap için bir süre kaydı tutulur (`dgs.progress.v1` → `timings`): sorunun ekranda
görünmesinden şıkkı işaretlemene kadar geçen süre, soru/paket/konu/zorluk, doğru mu,
bloklu soruda blok kimliği ve tarih. Aynı soruyu tekrar çözdüğünde **yeni bir kayıt**
açılır, eskisi korunur. Ölçüm tamamen arka plandadır; çözerken hiçbir şey görünmez.

Sayaç uygulama arka plana geçince durur, dönünce devam eder (`js/timing.js`:
`visibilitychange`, `pagehide`/`pageshow`, `blur`/`focus`, `freeze`/`resume`). Uygulama
tamamen kapatılırsa yarım kalan sorunun kaydı hiç açılmaz, dönüşte ölçüm sıfırdan
başlar. 15 dakikayı aşan kayıt `suspect` işaretlenir ve ortalamalara katılmaz.

Kayıtlar ilerlemeyle aynı anahtarda durduğu için yedeğe kendiliğinden girer.
Depoda en fazla `MAX_TIMINGS` (3000, ~60 gün) kayıt tutulur; taşınca en eskiler düşer.
Sınır yalnız depo içindir — yedek dosyası o andaki verinin tamamını taşır. Kaç kaydın
düştüğü ve en eski kaydın tarihi İstatistik ekranında, yedekleme bölümünün altında yazar.

Tekrar takvimi hafif bir Leitner sistemidir: kutu 1-5, aralıklar 1 / 1 / 3 / 7 / 16 gün.
Doğru cevap bir üst kutuya çıkarır, yanlış cevap 1. kutuya düşürür. Takvim gün bazlıdır ve
en küçük aralık 1 gündür (`MIN_INTERVAL_DAYS`): cevaplanan bir soru — doğru da olsa yanlış da
olsa — aynı gün içinde bir daha havuza düşmez, en erken ertesi gün döner. Yanlışını beklemeden
çalışmak isteyen "Sadece yanlışlarım" moduna girer; o mod vadeye bakmaz.

### Aynı anda iki kopya

Ana ekrana eklenmiş PWA ile tarayıcı sekmesi aynı `localStorage`'ı paylaşır. İkisi de açıkken
biri diğerinin ilerlemesini silmesin diye `js/store.js` hiçbir zaman bellekteki kopyayı olduğu
gibi diske basmaz: her yazma önce diski yeniden okur, iki tarafı birleştirir (`mergeStates`),
sonra değişikliği uygular (`mutate`). Çakışan her alanda "daha ileri" olan kazanır, yani
ilerleme asla geri gitmez. Ayrıca `storage` olayı ve sekmeye geri dönüş (`visibilitychange`)
dinlenir; diğer kopya yazdığında açık ekran yeniden çizilir (soru çözerken hariç).

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
  timing.js             soru bazlı süre ölçümü (ölçen kısım; gösterim ekranlarda)
  screens/              home, session, result, topics, formulas, stats
data/
  index.json            ders, konu ve paket kaydı — genişleme noktası
  packs/                soru paketleri (alt konu ya da tam konu)
  formuller/
    index.json          ders ve formül seti kaydı
    sayilar.json bolunebilme.json ebob-ekok.json      matematik
    rasyonel.json uslu.json koklu.json
    acilar.json ucgenler.json dortgenler.json cember.json   geometri
icons/                  make-icons.ps1 ile üretilir
tools/
  serve.ps1             bağımlılıksız local sunucu
  make-icons.ps1        ikon üretici
```

`tools/serve.ps1` yalnızca geliştirme içindir; `localhost`u dinler ve sayfanın ürettiği bir
görüntüyü `tools/.preview/preview.png` dosyasına yazan bir `POST /__preview` uç noktası içerir
(şekilleri gözden geçirmek için). Yayına giden statik dosyalar arasında yer almaz.
