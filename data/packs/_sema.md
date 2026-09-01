# Soru paketi şeması — referans kartı

Yeni paket yazarken tek referans budur. Konvansiyonlar mevcut 15 paket / 395
soru ölçülerek çıkarıldı; uygulama bu dosyayı okumaz.

## 1. Paket dosyasının üst düzeyi

`{ id, topicId, topic, subtopicId, subtopic, version, blocks?: [ … ], questions: [ … ] }`

- **Koda ulaşan alanlar `questions` ve — varsa — `blocks`**; gerisi dekoratiftir.
  Gerçek `topic`/`subtopic` `data/index.json` kaydından gelir, çelişirse index
  kazanır. Paket eklerken kod değişmez: dosyayı koy + index'e kayıt yaz.
- `blocks` ortak köklü soru bloklarını tanımlar (§8); yazmayan paketin soruları
  bağımsızdır ve blok kavramı hiç devreye girmez.
- `js/packs.js:104-116` her soruya paket kaydından devreder: `packId`, `topic`
  (`entry.topic || entry.title`), `topicId`, `subtopicId`, `subtopic`. Soruda
  aynı adlı alan varsa o öncelikli.

## 2. Soru nesnesinin alanları

| alan | zorunlu | işlevi | yoksa |
|---|---|---|---|
| `id` | ✅ | kararlı kimlik; ilerleme kaydı buna bağlı | atlanır |
| `stem` | ✅ | soru metni | atlanır |
| `asks` | ✅ | "ne soruluyor" kutusu: tuzak + istenen büyüklük | atlanır |
| `choices` | ✅ | tek satır şık dizisi, fiilen hep 5 (min 2) | atlanır |
| `answer` | ✅ | doğru şıkkın **0 tabanlı** indeksi | atlanır |
| `label` | — | başlık altındaki küçük etiket | görünmez |
| `difficulty` | — | `1` kolay / `2` orta / `3` zor; oturum sırası buna göre | `2` sayılır |
| `figure` | — | satır içi SVG metni | şekilsiz |
| `solution` | — | çözüm metni | `—` basılır |
| `blockId` | — | sorunun bağlı olduğu ortak kök bloğu (§8) | bağımsız soru |

- Zorunlu alan eksikse soru **sessizce atlanır**, sadece `console.warn` düşer
  (`js/packs.js:73-96`). `label`, `subtopic` ile aynıysa gösterilmez.
- **`subtopicId` soruya yazılmaz** — index kaydından devralınır. Formül kartı
  eşleşmesinin birincil anahtarı odur (`js/formulas.js:106`); bulunamazsa
  sırayla `subtopic`, `label` alias'ı denenir.

## 3. SVG şekil biçimi

- `figure` = JSON string içinde tek satır ham SVG metni; nitelikler tek
  tırnaklı, `xmlns` yazılır.
- **`viewBox='0 0 320 200'`** (375 şeklin 369'u). Gerekirse sadece yükseklik
  artar; genişlik hep 320. `width`/`height` **yazma** — `js/svg.js` siler.
- Renk iki tane: `currentColor` (çizgi/yazı, tema ile döner), `#0284c7`
  (vurgu: aranan büyüklük, verilen ölçü).
- `stroke-width` `2` ana kenar / `1.5` yardımcı-kesikli / `2.5` vurgu; taralı
  alan `fill-opacity='0.18'`; yazı `font-family='system-ui, sans-serif'`,
  `font-size` `13` etiket · `14` genel · `15` ölçü.
- `js/svg.js` beyaz liste uygular: `script`/`style`/`image`/`use`, olay
  nitelikleri ve dış kaynak sessizce düşer; `url(...)` sadece aynı belgedeki
  `#id` (ok ucu `marker`) olabilir.

## 4. Çözüm biçimi

`\n` ile ayrılmış üç parça: **adım adım işlem → net cevap satırı (birimiyle) →
sonda parantez içinde numaralı hata bloğu.**

```
"solution": "h² = |AH| · |HB|\nh² = 16 · 9 = 144\nh = 12 cm\n(Sık yapılan hata 1: ara değer olan h² = 144'ü işaretlemek.\nSık yapılan hata 2: kökü yanlış tarafa uygulamak.)"
```

Hata bloğu 395 sorunun 369'unda var, yeni sorularda **zorunlu**.

## 5. Tam örnek soru

`data/packs/ucgen-yukseklik.json` → `yukseklik-04`, birebir:

```json
    {
      "id": "yukseklik-04",
      "label": "Dik üçgende dik kenar yüksekliktir",
      "difficulty": 1,
      "stem": "Şekildeki ABC üçgeninde m(C) = 90°, |AC| = 9 cm ve |BC| = 12 cm'dir. Buna göre [AC] kenarına ait yükseklik kaç cm'dir?",
      "asks": "[AC] kenarına ait yükseklik isteniyor. Dik üçgende dik kenarlar birbirine dik olduğundan her biri diğerine ait yüksekliktir; hesap yapmadan şekilden okunabilir.",
      "figure": "<svg viewBox='0 0 320 200' xmlns='http://www.w3.org/2000/svg'><polygon points='70,60 70,160 250,160' stroke='currentColor' stroke-width='2' fill='none' stroke-linejoin='round'/><polyline points='70,148 82,148 82,160' stroke='currentColor' stroke-width='1.5' fill='none'/><line x1='70' y1='160' x2='250' y2='160' stroke='#0284c7' stroke-width='4' stroke-linecap='round'/><g font-family='system-ui, sans-serif' font-size='15'><text x='60' y='114' fill='currentColor' text-anchor='end'>9</text><text x='160' y='184' fill='#0284c7' text-anchor='middle'>12</text></g><g font-family='system-ui, sans-serif' font-size='13' fill='currentColor' text-anchor='middle'><text x='70' y='52'>A</text><text x='258' y='176'>B</text><text x='60' y='176'>C</text></g></svg>",
      "choices": ["7.2", "9", "15", "12", "54"],
      "answer": 3,
      "solution": "Dik üçgende dik kenarlar birbirine diktir; bu yüzden her dik kenar, diğer dik kenara ait yüksekliktir.\n[BC] ⊥ [AC] olduğundan [AC] kenarına ait yükseklik doğrudan [BC]'dir.\nha = |BC|\nha = 12 cm\n(Sık yapılan hata 1: Pisagor ile hipotenüsü (15) bulup onu işaretlemek.\nSık yapılan hata 2: hipotenüse ait yüksekliği (9 · 12 / 15 = 7.2) hesaplamak; soruda istenen o değildir.\nSık yapılan hata 3: verilen |AC| = 9'u tekrar işaretlemek.\nSık yapılan hata 4: alanı (9 · 12 / 2 = 54) cevap sanmak.)"
    }
```

## 6. Yeni paket eklerken dokunulan dosyalar

1. `data/packs/<paket>.json` — yeni dosya.
2. `data/index.json` → `packs[]` kaydı (`id, topicId, topic, subtopicId,
   subtopic, title, file, count, version`); `count` fiili sayıyla birebir.
3. `data/formuller/<konu>.json` — `subtopicId`'si eşleşen kart yoksa formül
   kartı görünmez. Kart eklendiyse `formuller/index.json` → `cardCount`.
   Konusu karışık paketlerde kart bağlamanın yolu için §7.
4. `sw.js` → `VERSION` artır. **`APP_SHELL`'e paket eklenmez** — paket
   dosyaları `data/index.json`'dan türetilir.

## 7. `ucgen-karma` istisnası

Karma paket konu ipucu vermeden sınamak için yazıldı; aşağıdaki dört noktada
diğer paketlerden ayrılır. Yeni bir karma paket yazılırsa aynı kurallar geçerli.

- **`label` nötrdür:** yalnız `Karma 01` … `Karma 30`. Konu, teorem ya da şekil
  adı geçmez — etiketin kendisi ipucu olurdu.
- **`solution` sabit bir satırla başlar:** `Bu soru şu bilgiyi istiyor: …` (tek
  cümle, hangi araç gerektiği). Ardından §4'teki normal biçim gelir.
- **Formül kartı `label` alias'ıyla bağlanır.** `ucgen-karma` için kart
  **açılmaz**; bunun yerine her `Karma NN` etiketi, sorunun gerçek konusundaki
  mevcut kartın `aliases` listesine yazılır (`data/formuller/ucgenler.json`,
  açı soruları için `acilar.json`). `js/formulas.js:106-113` arama sırası
  `subtopicId` → `subtopic` → `label` olduğundan, ilk iki adım boşa düşer ve
  yanlış cevapta konuya özel kart açılır. Kart sayısı değişmez.
  *Soruya `subtopicId` yazmak bu işi görmez:* `js/scheduler.js:186` aynı alana
  bakar, sorular başka alt konuların çalışma setine sızar.
- **Aynı konfigürasyon en fazla 2 soruda** (diğer paketlerde 3). Yön değiştirmek
  ayrı konfigürasyon sayılır: ör. Öklid şekli üç kez geçiyorsa ikisi bir yönde,
  üçüncüsü aynalanmış olmalı.

## 8. Ortak köklü bloklar

Gerçek sınavda 26–42 arası 17 sorunun tamamı blok hâlinde gelir: tek bir
tanım/senaryo/tablo/grafik üzerine **2 ya da 3 soru** kurulur ve kök her soruda
birebir tekrar basılır (`_format_profili.md` §3). Şema bunu `blocks` dizisiyle
karşılar.

- Kök **bir kez** yazılır; sorularda tekrar edilmez.
- Soru bloğa `blockId` ile bağlanır. `blockId` yazmayan soru bağımsızdır.
- Kök yükleme sırasında soruya çözülüp yapıştırılır (`js/packs.js` → `question.block`);
  soru nerede gösterilirse gösterilsin köküyle birlikte gelir.

### 8.1 `blocks` alanları

| alan | zorunlu | işlevi | yoksa |
|---|---|---|---|
| `id` | ✅ | paket içinde tekil blok kimliği; sorular buna bağlanır | blok atlanır |
| `stem` | ✅ | ortak kök metni | blok atlanır |
| `label` | — | blok adı; kutu başlığında görünür ("Ortak kök — Denge sayısı") | yalnız "Ortak kök" yazar |
| `figure` | — | bloğa ait tablo/grafik SVG'si; §3'ün kuralları aynen geçerli | şekilsiz |

- **Üyelik yalnız soruda yazılıdır.** Blokta `questionIds` listesi **tutulmaz**: iki
  yerde yazılan üyelik senkronsuz kalır. Yanlış `blockId` soruyu `console.warn` ile
  **atlatır** (köksüz blok sorusu cevaplanamaz); bir `questionIds` listesindeki aynı
  hata ise sessiz kalır, soru köksüz basılırdı.
- Bloğun soru sırası `questions` dizisinin sırasıdır.
- `data/index.json`'daki `count` **soru** sayısıdır; bloklar sayılmaz.
- Blok kimliği de paketten türetilir (§9): `denge-sayisi`, `tarife-01`.

### 8.2 Nasıl gösterilir

- Kök, konu satırının altında, sorunun kendi şeklinin ve metninin **üstünde** kendi
  kutusunda çizilir (`sharedStem`, `js/ui.js`). Kutu iki ekranda da aynı iskelettir;
  **tek fark varsayılan açıklıktır** ve kararı her ekran kendi çağrı yerinde verir.
- Kök metni soru metniyle **aynı işaretleyicilerden** geçer: `**kalın**`, satır başı
  `Not:` kutusu ve HTML-escape — yani `a < b < c` yutulmaz (§4 ile aynı `richText`).
  Satır sonları korunur, kök çok satırlı yazılabilir.
- **Oturumda** kök **her soruda açık** gelir; katlanmış hâl yoktur. Gerçek sınavda kök
  her soruda tam basılır, kapalı kutu formatı taklit etmez; ayrıca her blok sorusunda
  fazladan bir dokunuş, soru başına 90 saniye bütçesinde gereksiz sürtünmedir.
  Kullanıcı isterse başlığa dokunup katlayabilir, ama sonraki soruda kutu baştan
  kurulduğu için yine açık gelir.
- **Sonuç ekranında** kutu, o bloğun listedeki **ilk yanlış/boş** sorusunda açık, diğer
  her yerde kapalı gelir. Buradaki gerekçe farklı: aynı kök listede iki-üç kez tam açık
  tekrarlanırsa gözden geçirme listesi şişer, kökü okuman gereken yer ise dönüp
  baktığın sorudur.

### 8.3 Leitner ile ilişkisi: öğrenme birimi değil

**Blok bir öğrenme birimi değildir.** İlerleme, Leitner kutusu ve tekrar vadesi soru
id'sine bağlıdır; blok kardeşleri birbirinden bağımsız kutu değiştirir, ayrı günlerde
geri döner, ayrı ayrı "Yanlışlarım"a düşer. Tek başına gelen blok sorusu kökünü yanında
getirir (kök soru nesnesine yapıştırılmıştır) ve kutusu **açık** çizilir.

### 8.4 Sıralama birimi: blok

Öğrenme listesi iki bölümdür — önce vadesi gelen tekrarlar, sonra geri kalanlar — ve
**blok yalnızca ikinci bölümün, yani paketi ilk kez çözmenin sıralama birimidir**
(`js/scheduler.js` → `orderingUnits` + `orderUnitsByDifficulty`). Kurallar:

- Bir bloğun soruları **ardışık** gelir; araya başka soru girmez, kök bir kez okunur.
- Blok içindeki sıra `questions` dizisindeki **kaynak sıradır**; karıştırılmaz.
- Bloklar kendi aralarında **içlerindeki en yüksek zorluğa** göre kolay→zor dizilir.
  Kolay bir soruyla başlayan üçlü blok, son sorusu zorsa zor kovasına girer.
- Bloğa ait olmayan **bağımsız sorular tek tek** sıralanır ve blokların arasına girer.
- Kova içinde karılan şey soru değil birimdir; blok sırası ezberlenmez ama blok
  içindeki ilerleme (tanımı uygulat → üstüne bin) korunur.

**Kapsam — bunun dışında blok ardışıklığı yoktur:**

| akış | blok ardışık mı |
|---|---|
| konu / alt konu çözme (`orderForLearning`) | ✅ evet |
| tekrar bölümü (vadesi gelen sorular, aynı listenin başı) | ❌ hayır, soru soru |
| günlük rutin (`buildDaily`) | ❌ hayır — set hedef sayıya göre kesiliyor |
| süreli mini test (`buildTest`) | ❌ hayır, bilerek karışık |
| Yanlışlarım (`buildWrongQueue`) | ❌ hayır, `lastSeen` sırası |

Kısmen çözülmüş pakette blok kendiliğinden ikiye ayrılır: vadesi gelen kardeşleri
tekrar bölümünde tek tek, hiç görülmemiş kardeşleri geri kalan bölümde ardışık gelir.
Bu beklenen davranıştır — ardışıklık yalnız ilk çözüm içindir.

### 8.5 Örnek (2'li blok)

```json
{
  "id": "sayisal-tanim",
  "topicId": "sayisal-mantik",
  "blocks": [
    {
      "id": "denge-sayisi",
      "label": "Denge sayısı",
      "stem": "Rakamları soldan sağa a, b, c, d olan dört basamaklı bir sayıda\na + b = c + d ise bu sayıya **denge sayısı** denir.\nÖrnek: 3417 sayısında 3 + 4 = 1 + 7 olduğundan 3417 bir denge sayısıdır."
    }
  ],
  "questions": [
    {
      "id": "denge-01",
      "blockId": "denge-sayisi",
      "difficulty": 1,
      "stem": "Buna göre aşağıdakilerden hangisi bir denge sayısıdır?",
      "asks": "...",
      "choices": ["...", "...", "...", "...", "..."],
      "answer": 2,
      "solution": "..."
    },
    {
      "id": "denge-02",
      "blockId": "denge-sayisi",
      "difficulty": 3,
      "stem": "Buna göre en büyük denge sayısı ile en küçük denge sayısının farkı kaçtır?",
      "asks": "...",
      "choices": ["...", "...", "...", "...", "..."],
      "answer": 0,
      "solution": "..."
    }
  ]
}
```

## 9. Kalıcı kurallar

- **id paketten türetilir:** `yukseklik-01`, `kenarortay-01`, `esitsizlik-01`,
  `ucgende-aci-01`. Eski `ucgen-NNN` / `acilar-NNN` sayacı sürdürülmez.
- **Mevcut id'ler asla değişmez** — Leitner ilerlemesi id'ye bağlı; değişen id
  çözülmüş soruyu sıfırlar.
- **Aynı konfigürasyon en fazla 3 soruda.** Aynı şekil + aynı bilinmeyen
  düzeniyle 4. soruyu yazma; verilen sayıları değil kurguyu değiştir.
- **Çeldiriciler ara işlem değerlerinden** üretilir (örnekte `h² = 144`,
  alan `54`). Rastgele sayı çeldirici olmaz.
