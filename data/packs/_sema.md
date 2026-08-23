# Soru paketi şeması — referans kartı

Yeni paket yazarken tek referans budur. Konvansiyonlar mevcut 14 paket / 315
soru ölçülerek çıkarıldı; uygulama bu dosyayı okumaz.

## 1. Paket dosyasının üst düzeyi

`{ id, topicId, topic, subtopicId, subtopic, version, questions: [ … ] }`

- **Koda ulaşan tek alan `questions`** (`js/packs.js:69`); gerisi dekoratiftir.
  Gerçek `topic`/`subtopic` `data/index.json` kaydından gelir, çelişirse index
  kazanır. Paket eklerken kod değişmez: dosyayı koy + index'e kayıt yaz.
- `js/packs.js:69-79` her soruya paket kaydından devreder: `packId`, `topic`
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

- Zorunlu alan eksikse soru **sessizce atlanır**, sadece `console.warn` düşer
  (`js/packs.js:44-64`). `label`, `subtopic` ile aynıysa gösterilmez.
- **`subtopicId` soruya yazılmaz** — index kaydından devralınır. Formül kartı
  eşleşmesinin birincil anahtarı odur (`js/formulas.js:106`); bulunamazsa
  sırayla `subtopic`, `label` alias'ı denenir.

## 3. SVG şekil biçimi

- `figure` = JSON string içinde tek satır ham SVG metni; nitelikler tek
  tırnaklı, `xmlns` yazılır.
- **`viewBox='0 0 320 200'`** (300 şeklin 294'ü). Gerekirse sadece yükseklik
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

Hata bloğu 315 sorunun 282'sinde var, yeni sorularda **zorunlu**. İstisna:
elden geçirilmeyi bekleyen `acilar-temel` ve `acilar-paralel`.

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
4. `sw.js` → `VERSION` artır. **`APP_SHELL`'e paket eklenmez** — paket
   dosyaları `data/index.json`'dan türetilir.

## 7. Kalıcı kurallar

- **id paketten türetilir:** `yukseklik-01`, `kenarortay-01`, `esitsizlik-01`,
  `ucgende-aci-01`. Eski `ucgen-NNN` / `acilar-NNN` sayacı sürdürülmez.
- **Mevcut id'ler asla değişmez** — Leitner ilerlemesi id'ye bağlı; değişen id
  çözülmüş soruyu sıfırlar.
- **Aynı konfigürasyon en fazla 3 soruda.** Aynı şekil + aynı bilinmeyen
  düzeniyle 4. soruyu yazma; verilen sayıları değil kurguyu değiştir.
- **Çeldiriciler ara işlem değerlerinden** üretilir (örnekte `h² = 144`,
  alan `54`). Rastgele sayı çeldirici olmaz.
