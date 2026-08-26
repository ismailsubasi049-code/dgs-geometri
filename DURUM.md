# Durum

**Son güncelleme:** 2026-08-26 · **sw.js VERSION:** `v30`

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

## Öğrenme modu sıralaması

**2026-08-26.** Öğrenme listesi iki bölümden oluşur — önce vadesi gelen
tekrarlar, sonra geri kalanlar — ve artık **her iki bölüm kendi içinde
kolaydan zora** dizilir. Önceden tekrar bölümü yalnızca `dueOrder` ile
sıralandığı için vadesi gelmiş zor bir soru 2. sırada gelebiliyor ve "Zor
sorulara geçtin" bildirimi oturumun başında tetikleniyordu.

Leitner önceliği değişmedi: hangi soruların geleceği aynı, yalnızca sıraları
değişti. Tekrar bölümünde blok içi rastgelelik yok — eşit zorlukta önce en çok
gecikmiş, eşitlikte en zayıf kutu gelir (`orderDueByDifficulty`). Geri kalan
bölümde blok içi rastgelelik korundu.

Bildirim de bölümü biliyor: tekrar bölümünün zor kısmında "Tekrarların zor
kısmına geldin", geri kalanın zor kısmında eski metin. Oturumda en fazla iki
kez, her bölüm için bir kez çıkar. Artık **yalnızca konu ve alt konu
modlarında** çıkıyor — günlük rutin (`dueOrder`) ve Yanlışlarım (`lastSeen`)
listeleri zorluğa göre dizilmediği için oradaki 2 → 3 geçişi tesadüfiydi. O iki
modun soru sırası değişmedi, sadece bildirim kalktı; süreli testte zaten yoktu.

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

**2026-08-26 · `data/formuller/acilar.json`** (3 kart · 34 madde · 24 şekil)
aynı yöntemle denetlendi. **Formül matematiği 34/34 doğru çıktı**; bulguların
tamamı etiket–şekil uyuşmazlığı ya da terim/başlık hatasıydı.
**2 KRİTİK + 6 ORTA bulgu düzeltildi**, 7 şekil ve 4 madde metni değişti:

- `acilar-paralel` item[6] "**Zıt yönlü kırık**" diyordu ama şeklinde kırık
  zincirin iki parçası da soldan sağa gidiyor (32,7° → 15,7°, yön değişmiyor)
  ve maddenin kendi notu da "yön değiştirmiyorsa" diyor. Yön gerçekten tersine
  dönen şekil item[5]'inki (158,2° → 18,6°). "**Aynı yönlü kırık**" oldu.
- `acilar-temel` item[4] ("bir noktada 360°") şeklinde iki ışın **tam olarak
  aynı doğru üzerindeydi**, diğer ikisi doğrusallıktan yalnızca 10° sapıyordu:
  şekil "iki kesişen doğru" gibi okunuyor ama karşılıklı açılar 90/100 ve 80/90
  olduğu için aynı karttaki "ters açılar eşittir" kuralıyla çelişiyordu. Işınlar
  −70°/35°/95°/195° ile yeniden çizildi (105+60+100+95 = 360; en yakın ışın
  çifti doğrusallıktan 15° uzak, hiçbir açı 90° değil).
- `acilar-temel` item[6]: kadrandaki `6` rakamının içinden yelkovan geçiyordu.
  Kadran yeniden üretildi (çember r=60, rakamlar r=44, yelkovan 34, akrep 26);
  3:30 ve 75° korundu.
- `acilar-paralel` item[5]/[6]/[7]: `b` etiketleri 12–19°'lik dar kamalara
  sığmadığı için kırık doğrunun üstüne ve yanlış tarafına düşüyordu. Üç şekil de
  daha geniş açılarla yeniden üretildi (her işaretli açı ≥ 20°).
- `acilar-paralel` item[9] ve `acilar-ucgende` item[7]: formüldeki `x` şekilde
  yoktu. ucgende[7]'de uzun `(B − C)/2` etiketi dört çizgiyle birden kesişiyordu;
  şekil `x` ile etiketlendi, formül `x = (B − C) / 2` oldu.
- Ayrıca: item[6] notuna `x`'in sapma açısı olduğu eklendi (item[5]'te `x` iki
  parça arasındaki tam açı), item[3]'e "(karşı durumlu)" parantezi eklendi —
  kart aynı kavramı iki adla anıyordu.

Üretim sonrası ölçüm tekrarlandı: `d₁ ∥ d₂` sapması 24 şeklin tamamında 0,00°,
yükseklik–taban dikliği 90,00°, `x = a+b` · `a = b+x` · `a+y = x+b` · `x = a/2` ·
`x = (B−C)/2` ve dört açı toplamı 360,00 birebir; etiket kutusu–çizgi kesişimi
yalnızca aşağıdaki iki kozmetik maddede kaldı.

`data/formuller/` altındaki diğer konu dosyaları (`cember`, `dortgenler`,
`sayilar`, `koklu`, `uslu`, `rasyonel`, `bolunebilme`, `ebob-ekok`) **henüz
denetlenmedi**.

## Bilinen açık maddeler

Düzeltilmedi, kayıt için duruyor:

- Denetimde **KOZMETİK** işaretlenen maddeler bilinçli olarak kapsam dışı
  bırakıldı: `ucgen-oklid` item[0]/[2]/[3]'te `c` etiketi hipotenüsün ortasına
  değil `p` parçasının altına düşüyor; `ucgen-alan` item[2]/[3] ve
  `ucgen-kenarortay` item[1]/[7] ile `ucgen-ozel-ucgenler` item[11]'de bir
  etiket bir çizgiye değiyor; `ucgen-benzerlik` item[0]'da tek/çift yay
  işaretleri eşit açılara düşüyor.
- `acilar.json` denetiminin KOZMETİK maddeleri de aynı şekilde bırakıldı:
  `acilar-temel` item[2]'de `O` etiketi d₂ doğrusuna, `acilar-ucgende` item[5]'te
  `A` etiketi AB kenarına biniyor; `acilar-ucgende` item[4]'te `90° − A/2`
  etiketi D'deki kamanın dışında duruyor; `acilar-temel` kartı "doğrusal
  açılar" (item[3]) / "doğrusal açı" (item[9]) / "doğru açı" (item[7])
  ifadelerini üç ayrı anlamda kullanıyor.
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
