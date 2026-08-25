# Durum

**Son güncelleme:** 2026-08-25 · **sw.js VERSION:** `v28`

## Özet

**395 soru · 13 alt konu · 15 paket.** Tamamı geometri; matematik
branşında henüz soru paketi yok (formül kartları var).

## Paketler

| konu | subtopicId | görünen ad | soru |
|---|---|---|---|
| Açılar | `acilar-temel` | Temel açı kavramları | 24 |
| Açılar | `acilar-paralel` | Paralel doğrular ve kesenler | 33 |
| Açılar | `acilar-ucgende` | Üçgende açılar | 33 |
| Üçgenler | `ucgen-esitsizlik` | Üçgen eşitsizliği ve kenar-açı bağıntısı | 17 |
| Üçgenler | `ucgen-pisagor` | Pisagor bağıntısı | 31 |
| Üçgenler | `ucgen-oklid` | Öklid bağıntıları | 32 |
| Üçgenler | `ucgen-ozel-ucgenler` | Özel üçgenler | 33 |
| Üçgenler | `ucgen-aciortay` | Açıortay | 30 |
| Üçgenler | `ucgen-benzerlik` | Benzerlik oranı ve alan | 30 |
| Üçgenler | `ucgen-alan` | Alan oranları | 31 |
| Üçgenler | `ucgen-kenarortay` | Kenarortay ve ağırlık merkezi | 31 |
| Üçgenler | `ucgen-yukseklik` | Yükseklik ve diklik merkezi | 20 |
| Üçgenler | `ucgen-karma` | Karma üçgen | 30 |
| Dörtgenler | — | Dörtgenler | 10 |
| Çember ve Daire | — | Çember ve Daire | 10 |
| **Toplam** | | **15 paket** | **395** |

## Kalan işler

- **Sonraki aşama kararı:** dörtgen/çember paketleri mi, matematik-sayısal
  mantık mı

## Formül kartı denetimi

**2026-08-25 · `data/formuller/ucgenler.json`** (9 kart · 72 madde · 42 şekil)
uçtan uca denetlendi: ölçümler SVG koordinatlarından hesaplandı (kenar
uzunlukları, iç açılar, yay kirişinden merkez açı, diklik sapması, etiket
kutuları), bulgular headless Chrome render'ıyla gözle doğrulandı.
**5 KRİTİK + 10 ORTA bulgu düzeltildi**, 11 şekil ve 1 formül metni değişti:

- `ucgen-yukseklik` üç şekli de baştan çizildi — eski hâlinde hb bir yükseklik
  değildi (14° sapma, kenarı 15,8 px aşıyordu), üç yükseklik tek noktada
  kesişmiyordu ve "geniş açılı" paneli aslında bir dik üçgendi.
- `ucgen-aciortay` item[6]'da BD açıortay değildi (29,2°+19,0°) ve eşit
  işaretlenen iki parça 73,7 / 109,4 ölçüyordu; D gerçek ayağa taşındı.
- `ucgen-benzerlik` item[7] "Kenarortayların birleşimi" diyordu (kenarortay =
  medyan); "orta taban" olarak düzeltildi.
- Ayrıca: çevrel çember kartında R/c etiketleri, çarpık dik açı işareti,
  hipotenüs kenarortayında harf kuralı (c = [AB]) ve eğik çentikler, kenarortay
  uzunluk formülünün çeşitkenar üçgene taşınması, etiket çakışmaları.

Şekiller elle değil parametrik üreteçle çıkarıldı; üretim sonrası ölçüm
tekrarlandı (`a·ha = b·hb = c·hc` birebir eşit, üç yükseklik 0 px sapmayla
eşzamanlı, `Va² = (2b²+2c²−a²)/4` birebir).

`data/formuller/` altındaki diğer konu dosyaları (`acilar`, `cember`,
`dortgenler`, `sayilar`, …) **henüz denetlenmedi**.

## Bilinen açık maddeler

Düzeltilmedi, kayıt için duruyor:

- Denetimde **KOZMETİK** işaretlenen maddeler bilinçli olarak kapsam dışı
  bırakıldı: `ucgen-oklid` item[0]/[2]/[3]'te `c` etiketi hipotenüsün ortasına
  değil `p` parçasının altına düşüyor; `ucgen-alan` item[2]/[3] ve
  `ucgen-kenarortay` item[1]/[7] ile `ucgen-ozel-ucgenler` item[11]'de bir
  etiket bir çizgiye değiyor; `ucgen-benzerlik` item[0]'da tek/çift yay
  işaretleri eşit açılara düşüyor.
- `ucgen-006` ile `ucgen-014` içerik olarak neredeyse aynı soru (ikisi de
  `ucgen-benzerlik`'te).
- `ucgen-alan` formül kartının içeriği yeni adıyla ("Alan oranları") tam
  örtüşmüyor; maddelerin yarısı kenarortay kuralı.
- `geo-dortgenler` ve `geo-cember` girdilerinde `subtopicId` yok. O paketler
  üretilene kadar bilinçli olarak eklenmeyecek.
- `ucgen-karma` sorularının formül kartı alt konudan değil, `label` alias'ından
  gelir (`Karma 07` → `ucgen-pisagor` gibi). Yeni bir karma sorusu eklenip
  `data/formuller/ucgenler.json` ya da `acilar.json` içine alias yazılmazsa o
  soruda yanlış cevapta hiç kart açılmaz. Ayrıntı: `data/packs/_sema.md` §7.

## Çalışma kuralları

- Plan modunda başla.
- Üretim miktarını (kaç soru) planda teyit ettir.
- Force push yapma.
- Kullanıcıya giden içerik (paket/formül/kod/CSS) değiştiyse `sw.js` →
  `VERSION` artır. Salt geliştirme dokümanı değiştiyse artırma.
- İş bitince `/clear`.

## Referans

Paket şeması ve soru yazım kuralları: [`data/packs/_sema.md`](data/packs/_sema.md)
