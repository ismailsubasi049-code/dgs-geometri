# Durum

**Son güncelleme:** 2026-09-03 · **sw.js VERSION:** güncel değer için `sw.js:4`
(elle tutulan kopya iki tur geride kaldığı için buradan kaldırıldı; sürüm zaten
her turda aşağıdaki günlüğe yazılıyor)

## Özet

**479 soru · 17 alt konu · 19 paket.** 395'i geometri, 84'ü matematik
(4 paket: `ozdeslik-genel`, `oran-oranti-genel`, `mantik-blok-1`,
`mantik-blok-2`). Kalan **6**
matematik konusunun hâlâ yalnız formül kartı var, paketi yok: `sayilar`,
`bolunebilme`, `ebob-ekok`, `rasyonel`, `uslu`, `koklu`. **Sayısal mantık ise
tersi:** paketi var, formül kartı yok.

## Paketler

| konu | subtopicId | görünen ad | soru |
|---|---|---|---|
| Çarpanlara Ayırma ve Özdeşlikler | `ozdeslik-genel` | Genel özdeşlik soruları | 20 |
| Oran ve Orantı | `oran-oranti-genel` | Genel oran-orantı soruları | 20 |
| Sayısal Mantık | `mantik-blok-1` | Tanımlı sembol, kavram, senaryo ve oyun blokları | 24 |
| Sayısal Mantık | `mantik-blok-2` | Tablo, grafik ve şekil blokları | 20 |
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
| **Toplam** | | **19 paket** | **479** |

## Kalan işler

- **Sonraki aşama kararı:** matematiğin kalan 6 konusuna paket mi (formül
  kartları hazır), yoksa dörtgen/çember paketleri mi
- **Sayısal mantığın formül kartı yok** (`data/formuller/` altında
  `sayisal-mantik.json` yok, `formuller/index.json`'da kayıt yok). Yanlış
  cevapta kart açılmıyor: `js/formulas.js:106` önce `subtopicId`
  (`mantik-blok-1`), sonra `subtopic`, sonra `label` alias'ı arıyor; üçü de
  boşa düşüyor. Eksik, hata değil — paket bu hâliyle çalışıyor.
- O kart yazıldığında **diğer konulardakinden farklı olmak zorunda: formül
  kartı değil, yöntem kartı.** Sayısal mantıkta ezberlenecek formül yok;
  kartlar tekrar eden *hamleleri* anlatmalı — algoritmayı geriye işletme,
  mutlak değerde iki yönü de sayma, parçalı tanımda her iki dalı da deneme,
  iki koşulu kesiştirirken daha kısıtlayıcı olandan başlama, tanımı sayı
  bitene kadar tekrarlama (rakam olma sınırı gibi örtük koşulları unutmama).
  Bağlanma yolu da farklı olacak: `subtopicId` paket başına tek kart açardı,
  bu yüzden `ucgen-karma` / `ozdeslik-genel` desenindeki `label` alias'ı daha
  uygun — ama o zaman sorulara `label` yazmak gerekir (şu an yazılmıyor).
- `_format_profili.md` §11.4'ün sırasına göre gereken üç **sayısal mantık**
  paketinden ikisi yazıldı: `mantik-blok-1` (tanım/senaryo) ve `mantik-blok-2`
  (tablo + grafik, 14 şekil). `blocks[].figure` yolu bu ikinci paketle **ilk kez
  gerçek veriyle sınandı ve çalışıyor** — kod yine değişmedi. Üçüncü paket
  (saf grafik yorumlama / algoritma akışı) hâlâ yok.

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

## Karalama alanı

**2026-08-29 (v36).** Karalama alanı çok aşamalı sorularda — özellikle
telefonda — yetersiz kalıyordu ve tek düzenleme seçeneği "Temizle" olduğu için
küçük bir düzeltme bütün çalışmayı siliyordu. `js/scratchpad.js` dört düğmeye
çıktı: **Büyüt / Silgi / Geri al / Temizle** (hepsi `min-height: var(--tap)`,
dar ekranda tek satırda sığar). Soru verisine, paketlere ve localStorage
şemasına dokunulmadı; karalama hâlâ oturumluk.

Zemin zaten hazırdı: çizgiler `strokes` dizisinde nokta listesi olarak
tutuluyordu (yeniden boyutlandırmada `redraw()` için). Artık her stroke
`{ mode: 'pen'|'erase', points }`:

- **Silgi**, `globalCompositeOperation = 'destination-out'` ile 18 CSS piksel
  uçlu piksel silgisi. Kâğıt boya değil CSS arka planı olduğu için silinen yer
  temiz görünür. Silme de bir stroke olduğundan **geri al silgiyi de iptal eder**.
- **Geri al** son stroke'u atıp `redraw()` çağırır; çizim yokken düğme pasif.
  Geçmiş `MAX_STROKES = 30` ile sınırlı — taşan en eski hareketler bir offscreen
  `baseline` tuvaline düzleştirilir: geri alınamaz olurlar ama ekrandan silinmez.
  `baseline` küçültülmez, yoksa tam ekranda çizilen alt kısım kalıcı kırpılırdı.
- **Tam ekran** `.scratch--full` sınıfı (fixed, `z-index: 60` — üst barın üstü,
  yedek kapısının altı) + `body.scratch-fullscreen-open`. `resize()` artık
  yüksekliği de `getBoundingClientRect()`'ten okuyor (eskiden sabit
  `CANVAS_HEIGHT` idi). Tuval tam ekranda da `max-width: var(--maxw)` ile
  sınırlı: iki mod arasında **yalnızca yükseklik** değişir, CSS piksel cinsinden
  tutulan koordinatlar birebir korunur, girip çıkınca çizim kaymaz.
- **Geri tuşu:** tam ekrana girerken `history.pushState({...state, dgsScratch:true})`.
  Hash değişmediği için `hashchange` tetiklenmez, router'ın `dgsDepth` muhasebesi
  bozulmaz; `popstate` gelince önce karalama kapanır, soru terk edilmez.
  `session.js` `showQuestion()` başında `scratch.setFullscreen(false)` çağırır —
  `clear(body)` node'u sökeceği için tam ekran soru değişimine taşınamaz.

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

**2026-08-27 · `data/formuller/dortgenler.json`** (8 kart · 46 madde · 33 şekil)
aynı yöntemle denetlendi. **Formül satırlarının matematiği 45/46 doğru** çıktı;
bulguların ağırlığı **şekil seçiminde** — genel kuralı anlatan şekiller kuralın
özel hâlini gösteriyordu. **3 KRİTİK + 6 ORTA + 2 KOZMETİK bulgu düzeltildi**,
10 şekil ve 8 metin alanı değişti:

- `dortgen-yamuk` **beş şeklinin beşi de ikizkenar yamuktu** (yan kenarlar
  104,2161 = 104,2161, köşegenler 216,4740 = 216,4740, sapma sıfır). Bu yüzden
  "İkizkenar yamukta taban açıları eşit, köşegenler eşittir" maddesinin şekli,
  genel yamuk kuralı anlatan item[0]/[1]/[3]/[5] şekilleriyle birebir aynıydı:
  varsayımın ne kattığı görünmüyor, tersine *her* yamukta yan kenar ve
  köşegenlerin eşit olduğu çıkarımına götürüyordu. Dört genel şeklin üst tabanı
  `A(120,34) B(270,34)`'e kaydırıldı — a=150, c=240, h=94, alan=18330, orta
  taban=195,000, köşegen orta noktaları arası=45,000 ve yan üçgen alanları
  4338,46 = 4338,46 **korundu**; yan kenarlar 95,189 ≠ 120,254 ve köşegenler
  189,897 ≠ 243,846 oldu. item[4] ikizkenar şeklini korudu, ayrımı artık o
  taşıyor.
- `dortgen-dikdortgen` item[5]'te P noktası `BD` köşegenine **1,187 px**
  uzaktaydı (∠DPB = 178,493°): `PD` ile `PB` tek bir düz kesikli çizgi gibi
  okunuyor, dört parça yerine üç görünüyor ve "içindeki herhangi bir nokta"
  köşegen üstündeki özel bir nokta gibi duruyordu. P `(104,74)`'e taşındı —
  kırılma 43,22°, köşegenlere uzaklık 18,36 / 32,61 px, `PA²+PC² = PB²+PD² =
  26832` birebir.
- `dortgen-paralelkenar` item[3] notu "Ama eşit değildirler", `dortgen-eskenar`
  item[1] notu "Eşit değildirler ama dik kesişirler" diyordu. İkisi de koşulsuz
  yanlış: dikdörtgen bir paralelkenardır, kare bir eşkenar dörtgendir ve
  ikisinde de köşegenler eşittir — dosya bunu `dortgen-dikdortgen` item[1] ve
  `dortgen-kare` item[4]'te zaten söylüyordu, kart kendisiyle çelişiyordu.
- `dortgen-muhtesem-dortlu` şekli **deltoid gibi okunuyordu** (`|AB|`/`|BC|`
  %3,1, `|CD|`/`|DA|` %2,3 farklıydı — 320 px'te görünmez), bu da `a = b`,
  `c = d` izlenimi verip `a²+c² = b²+d²` kuralını bariz kılıyordu. Dörtgen
  `A(148,34) B(90,70) C(148,134) D(244,70)` oldu: kenarlar 68,264 / 86,371 /
  115,378 / 102,528, `a²+c² = b²+d² = 17972` ve `a²=p²+q²` … `d²=s²+p²` birebir,
  köşegenler 90,0000°.
- `dortgen-acilar` item[3] ve item[4]'te genel dörtgen kuralları gözle yamuk
  görünen şekiller üzerinde anlatılıyordu (AB ∥ DC sapması 0,228° ve 0,570°).
  Sapmalar 10,873° ve 6,678°'e çıkarıldı; item[3]'te açıortay kesişimi
  `P = (164,23 · 111,90)`, açı yarıları 66,13 = 66,13 ve 52,08 = 52,08,
  `∠APB = (C+D)/2 = 61,788` korundu.
- `dortgen-acilar` item[3] başlığı **"komşu köşe"** koşulunu söylemiyordu;
  karşılıklı köşelerde aynı şekil üzerinde ölçülen sapma 67,4°.
- `dortgen-yamuk` item[4]'te "köşegenler eşittir" deniyor ama köşegenlerde
  çentik yoktu (çentik yalnız yan kenarlardaydı); iki köşegene çift çentik
  eklendi. Şeklin geri kalanı baytı baytına aynı kaldı.
- `dortgen-yamuk` item[5]'te `|a − c|/2` etiketini iki köşegen birden kesiyor,
  eksi işareti kayboluyordu (item[1]'deki `(a + c)/2` ile karışma riski).
  Etiket `|a−c|/2` olarak `(180, 99)`'a alındı — köşegenlere ~12 px açıklık.
- `dortgen-muhtesem-dortlu` item[3] notu "P'den köşelere çizilen parçalar da dik
  kesişen bir dörtgen oluşturur" diyordu; `PA, PB, PC, PD` dörtgen oluşturmuyor.
  Not, item[1]'in zaten çizdiği mekanizmayla değiştirildi.
- Kozmetikten yükseltilenler: `paralelkenar` item[4] formülü "taban · yükseklik"
  yerine "Alan = a · h" (şekil zaten `a`/`h` etiketliyor), ve `S` alan anlamında
  kullanıldığı üç maddeye "S = alan" notu.

Şekiller yine parametrik üreteçten çıkarıldı; üretim sonrası ölçüm tekrarlandı
ve 33 şeklin tamamı `js/svg.js` beyaz listesinden kayıpsız geçti, hiçbir
koordinat ya da etiket kutusu viewBox dışına taşmadı.

**2026-08-28 · `data/formuller/cember.json`** (6 kart · 33 madde · 26 şekil)
aynı yöntemle denetlendi. **Formül matematiği 33/33 doğru çıktı**; ağırlık yine
şekil seçimindeydi. **2 KRİTİK + 17 ORTA + kozmetikten yükseltilen 1 metin
bulgusu düzeltildi**, 18 şekil ve 2 madde metni değişti:

- `cember-acilar` item[6] ("iç açı = gördüğü iki yayın toplamı / 2") şeklinde
  **iki kiriş de çaptı** (|AC| = |BD| = 116 = 2r, ikisinin de orta noktası
  (160, 80) = O): kesişim tam merkezdeydi, m = n = 90° ve x = 90° çıkıyordu,
  yani kural aynı kartın item[0]'ındaki merkez açıya çöküyordu. Kirişler yeniden
  çizildi — kesişim merkeze 26,74 px uzakta, |AC| = 114,24 ve |BD| = 109,01
  (ikisi de çap değil), m = 100° · n = 40° · x = 70,000 = (m + n)/2.
- `cember-kirisler-dortgeni` kartının **dört şekli de aynı dörtgeni** kullanıyordu
  ve o dörtgen görsel olarak kareydi: açılar 87,5 / 92,5 / 92,5 / 87,5 (90°'den
  sapma 2,50° — 80 px'lik kenarda 3,5 px, görünmez), köşegenler birebir eşit
  (111,893) ve dik, AD ∥ BC. "A + C = 180°" kuralı "90 + 90" diye okunuyordu.
  Tek köşe kümesi dördünü birden değiştirdi: `A(105,44 · 69,40)`
  `B(157,07 · 137,92)` `C(206,97 · 112,50)` `D(204,72 · 48,30)` — açılar
  65 / 100 / 115 / 80, kenar oranı 1,81, köşegenler 110,30 ≠ 101,50 ve
  aralarında 85°, paralel kenar yok; `A + C = B + D = 180` ve Ptolemy
  `e·f = a·c + b·d = 11195,40` birebir.
- `cember-teget` item[4]'te Pitot (`a + c = b + d`) bir **ikizkenar yamukta**
  gösteriliyordu (b = d = 100,00, x = 160'ta tam simetrik); kural görsel olarak
  `a + c = 2b`'ye çöküyordu. Genel teğetler dörtgeni çizildi: iç teğet çember
  (160, 86) r = 44, dört kenarın çembere uzaklığı 43,999–44,001, kenarlar
  83,25 / 88,15 / 92,76 / 97,66, `a + c = b + d = 180,91`, iç açılar
  75 / 110 / 80 / 95.
- `cember-acilar` item[5]'te teğet-kiriş kaması (55°) dar olduğu için `α/2`
  etiketini vurgulu yay kesiyor, `α` ile arasında 6 px kalıyordu — etiket taşımak
  yetmiyordu. Yay 110° → 150° yapıldı (kama 75°, segment sagittası 43 px):
  teğetin merkeze uzaklığı 58,000 = r, yarıçap–teğet 90,000°, teğet-kiriş açısı
  75,000 = yay/2.
- `cember-kirisler-dortgeni` item[3] başlığı "Aynı kenarı gören açılar eşittir"
  diyordu — koşulsuz ve **aynı kartın item[0]'ı ile çelişiyor** (∠A ile ∠C de BD
  köşegenini görür ama eşit değil, bütünlerdir). "Bir kenarı **aynı taraftan**
  gören açılar eşittir" oldu, nota `∠ACB = ∠ADB` eklendi.
- Ayrıca: `cember-yay` item[1] ve `cember-alan` item[1]'de `r` etiketi hiçbir
  yarıçapın üstünde değildi (en yakınına 32 px, çemberin boşluğunda asılı) ve not
  "α merkez açı" derken merkez `O` etiketsizdi; `cember-alan` item[3]'te "üçgen"
  etiketi üçgenin dışında, merkez noktasının ve iki kesikli yarıçapın üstündeydi
  (üçgen ikinci tonla tarandı, "segment" merceğin içine alındı, formülün üçüncü
  terimi "dilim" eklendi); `cember-teget` item[2]'de açıortayın iki eşit parçası
  işaretsizdi ve aynı yarıçaptaki iki yay tek yay gibi birleşiyordu (radyal çentik
  eklendi); `cember-kirisler-dortgeni` item[4]'te `a`, `b`, `c`, `d` kenarların
  değil **yayların** ortasındaydı ve dördünü de çember kesiyordu; item[0]'da açı
  etiketleri köşelerinden 47 / 42 px uzakta, şeklin ortasında duruyordu; ve
  `cember-acilar` item[2]/[3], `cember-kiris` item[1]/[2]/[3]/[4] ile
  `cember-alan` item[4]'te etiket–çizgi çakışmaları.
- Kozmetikten yükseltilen: `cember-alan` item[3] notuna segment formülünün koşulu
  eklendi ("Kirişin kestiği küçük bölge — α < 180° için"); kural büyük segmentte
  dilim + üçgen olur.

Şekiller yine parametrik üreteçten çıkarıldı; etiketler bu turda boş alan arayan
bir yerleştiriciyle konumlandırıldı (kutu ile her çizgi/yay/etiket arası en küçük
açıklık ölçülüp en iyisi seçildi). Üretim sonrası ölçüm tekrarlandı ve 26 şeklin
tamamı `js/svg.js` beyaz listesinden kayıpsız geçti, hiçbir koordinat ya da
etiket kutusu viewBox dışına taşmadı.

**2026-08-29 · matematik branşının tamamı** (`sayilar`, `bolunebilme`,
`ebob-ekok`, `rasyonel`, `uslu`, `koklu` — 6 konu · 26 kart · 156 madde ·
53 ipucu · 78 örnek · 5 şekil) denetlendi. Geometriden farklı olarak yük
şekillerde değil metindeydi: **78 örneğin 78'i de sayısal olarak doğru**,
**5 şeklin 5'i metrik olarak doğru** çıktı; bulguların tamamı formülasyon,
koşul ve örnek-seçimi düzeyinde. **5 KRİTİK + 12 ORTA + kozmetikten
yükseltilen 1 gerekçe düzeltildi**; 5 dosyada 15 kart, 1 şekil etiketi ve
1 yeni örnek değişti:

- `asal-sayilar` item[4] `p < √N` yazıyordu; kural olduğu gibi uygulanınca
  **her tam kare asal çıkıyordu** (4, 9, 25, 49, 121, 169 — altısı da "asal").
  Kartın kendi örneği (97, √97 ≈ 9,8 → sınır 10) fiilen `≤` ile çalıştığı için
  madde ile örnek çelişiyordu. `p ≤ √N` oldu, nota sınır uyarısı eklendi
  (49 için 7'ye de bakılır).
- `uslu-denklem` item[1] `aˣ = bˣ ⇒ a = b (x ≠ 0)` diyordu; `2² = (−2)² = 4`
  karşı örneği koşulu kırıyor. `(a, b > 0 ve x ≠ 0)` oldu. Aynı kartın item[0]'ı
  titiz koşullar verdiği için okuyan listeyi tam sanıyordu.
- "`−aⁿ` ile `(−a)ⁿ` farklıdır" iki kartta da (`uslu-ozel` item[4],
  `sayi-cesitleri` item[4]) koşulsuzdu ve ikisi de yalnız çift üslü örnek
  veriyordu; **n tek iken eşitler** (`−2³ = (−2)³ = −8`). Not artık çakışma
  hâlini de gösteriyor.
- `mutlak-deger` item[2] notu `|a + b| ≠ |a| + |b|` diyordu — koşulsuz ve **aynı
  kartın item[3]'ü tersini söylüyordu** ("eşitlik aynı işaretliyken sağlanır");
  `|2+3| = 5`. "Farklı işaretlilerde `<` olur" hâline getirildi.
- `basamak-cozumleme` tips[0] "rakamları farklı" için `a ≠ b ≠ c` yazdırıyordu;
  zincir bunu demiyor — **121 zinciri sağlıyor** ama rakamları farklı değil.
  Üç koşul (a ≠ b, b ≠ c, a ≠ c) ayrı ayrı yazıldı.
- Kuralın sınırını gizleyen koşullar eklendi: `ⁿ√a = b ⇔ bⁿ = a (n çift ise
  b ≥ 0)`, `ⁿ√a = a^(1/n) (a ≥ 0)` ve `ⁿ√(aᵐ) = a^(m/n) (a ≥ 0)` —
  koşulsuz hâlleri üslü kurallarıyla birleşince `(−8)^(1/3) = 64^(1/6) = 2`
  çelişkisini veriyordu; eşlenik formüllerine `(a ≠ b)` (a = b iken payda 0/0);
  negatif üsse `(a ≠ 0)` / `(a ≠ 0, b ≠ 0)`; basit ve bileşik kesir tanımına
  `(pozitif kesirlerde)` (−3/5 için pay < payda sağlanıyor ama değer 0–1'de
  değil); tam sayılı kesir notuna negatif hâli (`−2 1/3 = −7/3`, formül −5/3
  veriyordu).
- İşaret ve sıralama reçeteleri daraltıldı: `(−a)ⁿ` iki kartta da "negatif bir
  sayının kuvveti" oldu (a = −2, n = 3 için `(−a)³ = 8`, pozitif);
  `rasyonel-siralama` item[4] "İkisi de negatifse ters döner" oldu ve tips[1]
  karışık işaretli hâli ayırdı ({−1/5, 1/3} için eski reçete `−1/5 > 1/3`
  veriyordu).
- Dejenere örnekler değişti: `ebob-ekok-problem` "en küçük sayı" diyordu ama
  gerçekten en küçük olan `r`'nin kendisi (3 = 5·0+3 = 6·0+3 = 8·0+3), soru kökü
  "8'den büyük" ile sınırlandı — cevap yine 123; `koklu-icice-siralama`'nın iki
  iç içe kök örneğinde de sonuç iç kökün değerine eşitti (√(4·√16) = 4,
  √(9·√81) = 9), `√(9·√16) = 6` ve `√(16·√81) = 12` ile değiştirildi;
  `ebob-ekok-kesir` "sadeleştirmeden hesaplanan sonuç yanlış çıkar" diyordu ama
  üç örneğin üçünde de kesirler zaten sadeydi — koşulun devreye girdiği örnek
  eklendi (3/6 ile 4/8 → 1/2; sadeleştirmeden 1/24).
- Tek şekil değişikliği `rasyonel-siralama` item[0]: madde "paydalar eşitse"
  diyor ama sayı doğrusundaki noktalar 1/4, 1/2, 3/4 idi. `1/2` etiketi `2/4`
  oldu — 2/4 de tam `x = 160`'a düştüğü için **tek bir koordinat değişmedi**
  (0 → x=40, 1 → x=280, noktalar 100/160/220 birebir aynı).

Kart sayısı (26), madde sayısı (156) ve ipucu sayısı (53) korundu; örnek sayısı
78 → 79 (yalnız `ebob-ekok-kesir`'e eklenen sadeleştirme örneği). Değişen 15
kartın bütün sayısal örnekleri PowerShell tam sayı aritmetiğiyle yeniden
hesaplandı, 79/79 doğru.

## Yeni formül konusu

**2026-08-29 · `data/formuller/ozdeslikler.json`** (yeni konu — 4 kart ·
28 madde · 8 ipucu · 12 örnek · şekil yok) üretildi ve **aynı turda
denetlendi**; ayrı denetim turu açılmadı. Matematik branşı 6 → 7 konu,
26 → 30 formül kartı oldu.

Kartlar: `ozdeslik-temel` (tam kare, iki kare farkı, `(a+b+c)²`),
`ozdeslik-kup` (küp açılımları, `a³ ± b³`), `carpanlara-ayirma` (ortak çarpan,
gruplandırma, tam kare tanıma, `x² + bx + c`, `ax² + bx + c`),
`ozdeslik-uygulama` (`x + y` ile `xy` verilince simetrik ifadeler,
`a + 1/a` kalıbı).

Doğrulama — Python/sympy bu makinede yok, PowerShell tam sayı aritmetiğiyle
yapıldı (ondalık yok, tr-TR virgül tuzağı devre dışı):

- 30 özdeşlik/kalıp `a, b, c ∈ [−5, 5]` ızgarasında iki taraflı denendi
  (dereceler ≤ 3 olduğu için değişken başına 11 nokta kesin sonuç verir);
  tek değişkenli açılım ve çarpanlara ayırma kimlikleri `x ∈ [−6, 6]`'da.
  Hepsi ızgaranın her noktasında doğru.
- 12 örneğin 12'si ve not içindeki sayısal iddialar 35 ayrı kontrolle
  yeniden hesaplandı; `x³ + y³` örnekleri ayrıca Newton bağıntısıyla
  (`p₃ = (x+y)p₂ − xy·p₁`) ikinci bir yoldan doğrulandı. **35/35 doğru.**
- Çakışma taraması: 11 formül dosyası · 56 kart · 166 alias — kart id,
  `subtopicId` ve alias çakışması yok (alias haritası global, son yüklenen
  kazanıyor; `sayilar` kartının "Asal çarpanlara ayırma" alias'ıyla yeni
  kartın "Çarpanlara ayırma" alias'ı farklı dizeler).
- Uygulamada `#/formuller/mat/ozdeslikler` açıldı: 4 kart, maddeler,
  ipuçları ve çözümlü örnekler render oldu, konsolda hata yok.

Önleyici yazım (önceki turların hata örüntülerine karşı): koşulsuz "≠"
kullanılmadı — `(a+b)²` ile `a²+b²` arasındaki fark "2ab, eşitlik yalnız
`a = 0` veya `b = 0` iken" diye yazıldı, `(a+b)³` ile `a³+b³` için eşitlik
hâli (`a = 0`, `b = 0`, `a = −b`) yazılı. Sınırlar dâhil olarak verildi
(`Δ` tam kare olmalı, `Δ = 0` dâhil ve o durumda tam kare;
`|a + 1/a| ≥ 2`, eşitlik `a = 1` ve `a = −1` iken). Ön koşullar eksiksiz:
`ax² + bx + c` için `a ≠ 0`, paydalı kalıplarda `a ≠ 0`, `1/x + 1/y` için
`x ≠ 0` ve `y ≠ 0` (zincir değil, ayrı ayrı). `a³ ± b³`'ün ikinci
parantezinin `b ≠ 0` iken reel katsayılı çarpanlara ayrılmadığı, `b = 0`
hâlinin ayrıldığı belirtildi. Örneklerde dejenere seçim yok: `a = 1` /
`b = 1` ile örnekleme yok, `x² − 3x − 28`'in kökleri `7` ve `−4` (negatif
kök var), `97² − 93²` tam kare olmayan sayılarla, simetrik örneklerde
`x ≠ y`. Sembol sözleşmesi dört kartta aynı: genel özdeşlikte `a, b, c`,
polinom değişkeni `x` (ikincisi `y`), `x² + bx + c`'nin iki sayısı `m, n`,
`a ± 1/a` kalıbının değeri `k`. Asal çarpan gösterimi hiç kullanılmadı, Z1
çakışması tekrarlanmadı.

Kalan tek gerilim: `uslu-kurallar` item[7]'deki koşulsuz
`(a + b)ⁿ ≠ aⁿ + bⁿ` ifadesi, yeni kartın koşullu ifadesinin yanında gevşek
kalıyor. Aşağıda Z3 olarak zaten kayıtlı; bu turda kapsam dışı bırakıldı.

**2026-08-29 · `data/formuller/oran-oranti.json`** (yeni konu — 4 kart ·
28 madde · 8 ipucu · 12 örnek · şekil yok) üretildi ve **aynı turda
denetlendi**; ayrı denetim turu açılmadı. Matematik branşı 7 → 8 konu,
30 → 34 formül kartı oldu.

Kartlar: `oran-temel` (oran/orantı tanımı, içler dışlar çarpımı, sadeleştirme,
birim şartı), `oranti-turleri` (doğru orantı = oran sabit, ters orantı =
çarpım sabit, bileşik orantı, grafik), `oranti-ozellikleri` (`(a±b)/b`,
toplam özelliği, ters çevirme/yer değiştirme, zincir orantı),
`oranti-uygulama` (doğru/ters orantılı paylaştırma, karışım, ölçek, yüzde).

Doğrulama — PowerShell tam sayı/kesir aritmetiğiyle (ondalık yok, tr-TR
virgül tuzağı devre dışı; kesirler `[bigint]` pay-payda çiftleri olarak
tutuldu, `[Math]::Abs` bigint'te aşırı yüklenme hatası verdiği için elle
mutlak değer):

- 12 örneğin 12'si ve notlardaki her sayısal iddia **81 ayrı kontrolle**
  yeniden hesaplandı. **81/81 doğru.**
- 14 orantı özelliği sembolik olarak sınandı: `a = k·b`, `c = k·d` konularak
  `b, d ∈ [−5, 5]\{0}` ve `k = p/q` (`p ∈ [−5, 5]`, `q ∈ [1, 5]`) ızgarasında
  iki taraflı karşılaştırma. **109.870 doğrulama noktası, 0 yanlış.** Koşul
  dışı bırakılan noktalar ayrıca *gerçekten tanımsız mı* diye sınandı:
  `b + d = 0` olan 550 nokta ve `k = 1` olan 500 nokta 0/0 verdi (bu yüzden
  `b + d ≠ 0` ve `k ≠ 1` koşulları maddelere yazıldı).
- Çakışma taraması: 12 formül dosyası · 60 kart · 177 alias — kart id,
  `subtopicId` ve alias çakışması yok. `cardCount = 4` ile fiili kart sayısı
  eşit, her kartta `subtopicId = card.id`. `topicId`/`title`/`branchId` üç
  dosyada birebir aynı.
- Uygulamada `#/formuller/mat/oran-oranti` açıldı: 4 kart, 28 madde,
  ipuçları ve 12 çözümlü örnek render oldu, ana ekran "8 konu · 34 formül
  kartı" gösteriyor, konsolda hata yok.

Önleyici yazım: koşulsuz "≠" yok — dosyadaki 25 `≠` parçasının hepsi ya bir
ön koşul (`b ≠ 0` gibi) ya da koşullu bir ifade; `a/b` ile `b/a` için eşitlik
hâli (`a = b` veya `a = −b`) yazılı. Zincir "≠" gösterimi yok. Dejenere
örnekleme yok: sadeleştirme gerektiren oran (`12/18`, `12/30`), birim tuzağı
(`40 cm / 2 m`), tam bölünmeyen ters orantı (`b = 24/5`), üç paylı hem doğru
hem ters orantılı paylaştırma, kesirli orantı sabitleri (`k = 5/6`, `3/2`,
`7/4`). Doğru/ters orantı ayrımı ölçütle veriliyor ("oran mı sabit, çarpım mı
sabit") ve `oranti-turleri` ornek[0]'da aynı senaryonun iki şıkkı hangisinin
geçerli olduğunu ayırt ettiriyor; `oranti-uygulama`'da ters orantılı payların
sayıların **tersleriyle** dağıtıldığı açıkça yazılı. Sembol sözleşmesi dört
kartta aynı: orantı sabiti `k`, oranın terimleri `a`/`b`, orantı `a/b = c/d`,
orantılanan sayı üçlüsü `x`, `y`, `z`, paylaştırılan toplam `T` (`a` ile
çakışmasın diye büyük harf `A` kullanılmadı).

## İlk matematik soru paketi

**2026-08-29 (v37) · `data/packs/ozdeslik-genel.json`** — 20 soru, şekilsiz.
Matematik branşındaki ilk paket. Kod değişmedi: `listTopics()` paketi olmayan
konuyu elediği için (`js/packs.js:184`) ana ekranda "Matematik konuları" kartı
`topics.length === 0` ile disabled duruyordu (`js/screens/home.js:157`); paket
`ozdeslikler` konusuna bağlanınca kart etkinleşti.

Zorluk dağılımı geometri paketlerinden farklı, bilinçli olarak zora kaymış:
**kolay 3 · orta 9 · zor 8**. Kolay blok ısınma değil, Leitner'ın taban
kalibrasyonu. Kolay ve orta blokta sorular **saf özdeşlik** — yanlış yapıldığında
hatanın hangi konudan geldiği ayrışsın diye. Zor blokta çapraz konu serbest:
8 sorunun 7'si birden fazla araç istiyor (köklü + eşlenikle rasyonelleştirme,
üslü, mutlak değer, rasyonel, bölünebilme, EBOB).

13 konfigürasyon 20 soruya dağıtıldı; en çok tekrarlanan konfigürasyon 3 soruda
(tam kare açılımı). İki soru `±` tuzağı üzerine kurulu: `ozdeslik-13`
((x − y)² = 9 bulup "x − y = 3" demek eksik cevap, ±3 olmalı — "yalnız 3" şıkkı
kasten var) ve `ozdeslik-19` (√(a²) = |a|).

**Formül kartı `label` alias'ıyla bağlanır** — `ucgen-karma` deseninin ikinci
kullanımı. Alt konu id'si `ozdeslik-genel` bilinçli olarak hiçbir kartın
`subtopicId`'siyle çakışmıyor; çakışsaydı 20 sorunun tamamı tek karta
bağlanırdı. Bunun yerine her sorunun `label`'ı konfigürasyonun adıdır ve o ad
`data/formuller/ozdeslikler.json` içindeki dört kartın `aliases` listesine
dağıtıldı (13 yeni alias, kart/madde sayısı değişmedi). Böylece küp sorusunda
`ozdeslik-kup`, ayırma sorusunda `carpanlara-ayirma` kartı açılıyor.

Doğrulama: 20 sorunun 20'sinin cevabı PowerShell'de bağımsız yeniden hesaplandı
(tam sayı, `BigInteger` ve kayan nokta karşılaştırmaları) — **20/20 doğru**.
80 çeldiricinin 80'i de hangi hatadan doğduğu hesaplanarak eşleştirildi;
rastgele sayı çeldirici yok.

## Metin işaretleyici (`richText`)

**2026-08-31 (v38) · `js/ui.js`.** O güne kadar `stem`, `asks` ve `solution`
düz metin basılıyordu (`el()` → `createTextNode`), bu yüzden
`_format_profili.md` §11.3'ün 4. kuralı (uç değer ifadelerinin vurgulanması)
hiç uygulanamamıştı. Dar kapsamlı bir işaretleyici eklendi — tam markdown
ayrıştırıcısı **değil**, yalnız iki dönüşüm:

1. `**kalın**` → `<strong>`
2. Satır başındaki `Not:` → metnin sonuna kadar `.solution-note` sarı kutusu

**Sıra kritik ve şudur: önce HTML-escape, sonra kalın, en son Not kutusu.**
Escape olmazsa `a < b < c` gibi eşitsizlikleri tarayıcı etiket sanıp yutar;
oran-orantı ve sıralama sorularında bu ifade sık geçiyor (`oranti-18`'de
`a + b < 50` ve `k < 6,25` var). Escape içinde `&` ilk sırada olmalı, yoksa
kendi ürettiğimiz `&lt;` ikinci kez kaçışa uğrar.

İşaretleyici **"varsa dönüştür, yoksa dokunma"** çalışır. Mevcut 415 sorunun
hiçbirinde `**` ya da satır başı `Not:` yok, görünümleri değişmedi —
`ozdeslik-genel` (metin) ve `ucgen-oklid` (SVG) üzerinde doğrulandı. Sarı kutu
yeni renk tanımlamaz, mevcut `--warn` değişkenini kullanır.

Çağrı yerleri altı nokta: `js/screens/session.js` (stem, asks, solution) ve
`js/screens/result.js` (aynı üçü). `figure` bu yoldan **geçmez**, `js/svg.js`
davranışı değişmedi.

## İkinci matematik soru paketi

**2026-08-31 (v38) · `data/packs/oran-oranti-genel.json`** — 20 soru, şekilsiz.
Zorluk `ozdeslik-genel` ile aynı: **kolay 3 · orta 9 · zor 8**; kolay blok
Leitner taban kalibrasyonu için, üçü de tek adımlık.

On alt başlığın hepsi en az bir kez geçiyor: k yöntemi, ters orantı çarpım
sabiti, zincir orantı, eşit oranlar teoremi, doğru/ters orantılı paylaştırma,
karışım ve karışıma ekleme, işçi-gün, harita ölçeği, ters orantıda yüzde
değişim, EKOK ile en küçük değer.

**Paketin tasarım ekseni ara değer çeldiricisi** (`_format_profili.md` §8.1,
İsmail'in kayıtlı ana hata deseni). 13 soruda 18 çeldirici, doğru çözümün
adımlarında birebir üretilen değerlerdir: `oranti-04`'te k = 6 ve a = 24,
`oranti-12`'de süt 10 / su 15 / toplam 25, `oranti-19`'da k = 4 ve c = 20.
Ayrıca 5 soru **yanlış model kurmayı** ölçer — doğru çözüm o değeri hiç
üretmez, çeldirici yanlış modelin sonucudur:

| soru | yanlış model | sonucu |
|---|---|---|
| `oranti-13` | ters orantılı payları 2 : 3 : 6 almak (3 : 2 : 1 olmalı) | 3300 |
| `oranti-14` | farklı hacimli iki karışımın oranlarını ortalamak | 45 |
| `oranti-15` | ücreti gün sayısıyla paylaştırmak (verimle olmalı) | 1200 |
| `oranti-16` | "x %25 artarsa y %25 azalır" varsayımı | 25 |
| `oranti-17` | k = 1 yerine k'nin başka bir katını almak | 70 / 105 / 140 / 175 |

Her çeldirici çözümün sonundaki **sarı Not kutusunda** teşhir edilir: hangi
şıkkın hangi ara değer olduğu ve sorunun aslında ne istediği yazılıdır.
16 soruda Not kutusu var.

Şıkların tamamı beş terimli aritmetik dizi. `oranti-17` **azalan** dizilidir
(175 → 35, fark −35) ve "**en küçük** değer" istemiyle birleştirilmiştir —
§8.4'teki "uç değer ters okuma" tuzağı. `oranti-18` **olamaz** formatındadır;
bölünebilme temelli bir "olamaz" kurgusu beş terimli aritmetik diziye
oturmadığı için (dizinin ya hepsi ya hiçbiri bölünür) eşitsizlik koşulu
(`a + b < 50`) üzerine kuruldu, tam olarak bir şık imkânsız çıkıyor.

Cevap anahtarı `D B B E A D E A C B D A B C D A E E C D` — A=4, B=4, C=3, D=5,
E=4; en uzun aynı harf serisi 2.

**Formül kartı `label` alias'ıyla bağlanır** — `ucgen-karma` deseninin üçüncü
kullanımı. `oran-oranti-genel` bilinçli olarak hiçbir kartın `subtopicId`'siyle
çakışmıyor; çakışsaydı 20 sorunun tamamı tek karta bağlanırdı. 20 yeni alias
`data/formuller/oran-oranti.json`'daki dört karta dağıtıldı, kart ve madde
sayısı değişmedi (`cardCount` 4). Dağılım: `oran-temel` 3, `oranti-turleri` 3,
`oranti-ozellikleri` 5, `oranti-uygulama` 9. Sonuncusu ağır çünkü paylaştırma,
karışım, ölçek ve işçi-gün dört alt başlığın hepsi o kartın altında.

Doğrulama: 20 sorunun 20'sinin cevabı awk'ta bağımsız yöntemle yeniden
hesaplandı — **20/20 doğru**. Şık dizilerinin ardışık farkları, cevap anahtarı
harf dağılımı, iddia edilen her ara değerin çözüm adımlarında gerçekten
geçtiği ve 210 alias arasında çakışma olmadığı ayrıca tarandı. Bulunan
değerler verilen orantılara geri konarak sağlandığı gösterildi (ör.
`oranti-13`: 1800 · 2 = 1200 · 3 = 600 · 6 = 3600).

## Ortak köklü blok desteği

**2026-09-01 (v39) · şema + `js/packs.js`, `js/ui.js`, iki ekran, `css/app.css`.**
Gerçek sınavın 26–42 arası — 50 sorunun **%34'ü** — ortak köklü bloklardan oluşuyor:
tek bir tanım/senaryo/tablo üzerine 2 ya da 3 soru kuruluyor ve kök her soruda
birebir tekrar basılıyor (`_format_profili.md` §3, "uygulamadaki en büyük eksik").
O güne kadar 17 paketin 435 sorusunun tamamı bağımsız soruydu.

**Şema kararı: ayrı `blocks` dizisi, soruda `blockId`** (`_sema.md` §8).
Değerlendirilen ikinci yol — kökü ilk soruya yazıp sonrakilere "önceki kökü kullan"
işareti koymak — bu kod tabanında çalışmaz, iki bağımsız nedenle:

1. **Dizi sırası render'a kadar yaşamıyor.** `js/scheduler.js` soruları zorluk
   kovalarına ayırıyor, Leitner vadesine göre ikiye bölüyor, blok içinde `shuffle`
   ediyor; mini test konu konu serpiştiriyor; "Yanlışlarım" soruyu tek başına
   getiriyor. Render anında "önceki soru" diye bir şey yok.
2. **Geçersiz soru sessizce düşüyor.** Kök zincirin ilk halkasındaysa ve o soru
   `isValidQuestion`'a takılırsa, kök arkasındaki 2 soruyla birlikte yok olurdu.

**Üyelik tek yerde:** blokta `questionIds` listesi tutulmuyor. İki yerde yazılan
üyelik senkronsuz kalır; yanlış `blockId` doğrulamaya takılıp `console.warn` ile
soruyu atlatır, bir `questionIds` listesindeki aynı hata ise sessiz kalır ve soru
köksüz basılırdı. Köksüz bir blok sorusu cevaplanamaz — yarım göstermektense
göstermemek doğru.

**Kök soruya yükleme sırasında yapıştırılıyor** (`js/packs.js` → `question.block`).
Kritik olan bu: `restoreSession`, `resolveQuestions`, `getLoadedQuestion` ve dört
oturum modu soruyu bağlamsız alır, hepsi kendi kendine yeten bir nesne görür.

**Render tek yerden** (`sharedStem`, `js/ui.js`) — iki ekran da aynı `<details>`
iskeletini kullanır, aralarındaki tek fark varsayılan açıklık:

- **Oturumda** kök açık gelir; **aynı blok arka arkaya** geldiyse ikincisinde
  katlanmış gelir (`lastBlockId`). Kutu yerinde durur, başlığı görünür, ama 8–15
  satırlık metni ikinci kez okutmaz.
  > **Sonradan değişti (2026-09-01):** oturumda kök artık **her soruda** açık geliyor;
  > katlanmış hâl kaldırıldı — bkz. "Oturumda kök her soruda açık". Sonuç ekranı
  > kuralı aynen duruyor.
- **Sonuç ekranında** kök, o bloğun listedeki **ilk yanlış/boş** sorusunda açık,
  diğer her yerde kapalı (`openRootIndexes`, `js/screens/result.js`). İlk *soruda*
  değil ilk *yanlışta*: kökü okuman gereken yer dönüp baktığın sorudur. Tam gruplama
  (blok bir kez, altında o bloğun yanlışları) yapılmadı — gözden geçirme listesini
  oturum sırasından koparır, `${index + 1}.` numarası oturumda görülen sıraya
  karşılık gelmez olurdu.

Kök metni soru metniyle **aynı `richText`'ten** geçer: `**kalın**`, satır başı `Not:`
ve HTML-escape (`a < b < c` yutulmaz). Satır sonları korunuyor
(`.shared-stem-body { white-space: pre-line }`), kök çok satırlı yazılabilir.
Şekil `parseFigure` ile aynı beyaz listeden geçer; yeni güvenlik yüzeyi yok.

**Leitner'a dokunulmadı.** `js/scheduler.js` ve `js/store.js` değişmedi. Blok bir
öğrenme birimi değil, yalnızca ortak metin: kardeş sorular bağımsız kutu değiştirir,
ayrı günlerde geri gelir, ayrı ayrı "Yanlışlarım"a düşer. Aynı kökün oturumda birkaç
kez görünmesi gerçek sınavın davranışının aynısı.

> **Sonradan değişti (2026-09-01):** blok öğrenme birimi olmamaya devam ediyor ama
> artık **sıralama birimi** — bkz. "Blok birimli zorluk sıralaması".

**Geriye dönük uyum:** 17 paketin hiçbirinde `blocks` ya da `blockId` yok
(`grep` ile doğrulandı); `question.block` `null` kalır, iki ekrandaki tek satırlık
koşul atlanır, DOM birebir eskisi gibi. Hiçbir soru id'si değişmedi, Leitner
ilerlemesi korundu. CSS sınıfı `.shared-stem` — mevcut `.block-notice` ile ilgisi
yok, oradaki "blok" zorluk bloğu.

Sıra: şema artık hazır; ilk sayısal mantık blok paketi kod değişikliği
gerektirmeden yazılabilir.

## İlk sayısal mantık blok paketi

**2026-09-01 (v40) · `data/packs/mantik-blok-1.json`** — 24 soru · 9 blok
(5 üçlü, 4 ikili) · bağımsız soru yok · şekil yok. **Sayısal mantık konusu
bu paketle açıldı** (matematik 8 → 9 konu, 40 → 64 soru) ve `blocks` şeması
ilk kez gerçek veriyle çalıştı. Önceki turun tahmini doğrulandı: **kod
değişmedi**, yalnız dosya + index kaydı.

Bu bir **transkripsiyon** turuydu — sorular üretilmedi,
`referans/mantik_blok_1_TAM.md`'den aktarıldı. Kök, şıklar, çözüm ve sarı Not
kutusu birebir; zorluk etiketleri kaynaktan (**orta 13 · zor 11**).

Bloklar dört kalıba dağılıyor: **tanımlı sembol** (`mantik-sembol-A` parçalı
tanımlı ⟪n⟫, `mantik-sembol-B` iki sembolün birlikte kullanımı), **tanımlı
kavram** (`mantik-kavram-denge`, `-oz`, `-ayrim`), **senaryo + kademeli kural**
(`mantik-senaryo-kargo` eşikli indirim, `-yarisma` üç kurallı puanlama),
**oyun / algoritma** (`mantik-oyun-bolme`, `-oyun-rakam`).

Transkripsiyonda üç karar gerekti, üçü de kaynağın uygulamaya birebir
oturmamasından:

- **LaTeX yok.** `\begin{cases}` bloğu iki düz satıra açıldı
  (`⟪n⟫ = |4n − 18|, n ≥ 0 ise` / `⟪n⟫ = |5n + 12|, n < 0 ise`) — `richText`
  HTML-escape ettiği için `n < 0` yutulmuyor, `.shared-stem-body`
  `white-space: pre-line` satır sonlarını koruyor.
- **Üstü çizili basamak gösterimi kalın düz metne çevrildi:** `$\overline{3AB}$`
  → `**3AB**`. 14 geçişin 4'üne bağlam eklendi ("Sayı **üç basamaklı** abc
  olsun" gibi), kalan 10'unda bitişik cümle bağlamı zaten veriyordu. Amaç
  `3AB`'nin basamak dizisi olduğunun anlaşılması, `3 · A · B` sanılmaması.
- **`asks` kaynakta yok** ama şema zorunlu tutuyor (`js/packs.js:78`). Yazıldı
  ve bir tur sonra **yeniden yazıldı**: ilk hâli Not kutusundaki tuzağı
  özetliyordu, ama `asks` **cevaptan önce ve zorunlu** okunuyor —
  `js/screens/session.js:517` şıkları `locked` doğuruyor, kilidi yalnız
  "Soru ne istiyor?" düğmesi açıyor (`revealAsks` → `unlockChoices`,
  `session.js:439`). Tuzağı orada söylemek soruyu bozuyordu: "ayrım değeri
  9'un katıdır" ya da "rakamlar toplamı 8'dir" sorunun tamamını veriyor.
  Şimdi 24 `asks` de **tek kısa cümle, yalnız istenen büyüklük** — yöntem yok,
  tuzak yok, şık harfi yok (en uzunu 59 karakter). Tuzak açıklaması yalnız
  çözümün sonundaki sarı Not kutusunda, yani cevaptan **sonra**.

Not kutusu 21 soruda var; 9, 20 ve 23'te kaynakta yok, uydurulmadı. `_sema.md`
§4'ün "(Sık yapılan hata N: …)" parantez bloğu bu pakette kullanılmıyor —
kaynağın kendi biçimi Not kutusu. Soru `label`'ı da yazılmadı: kart açma
işlevi bu konuda yok (kart yok) ve blok bağlamını `js/ui.js:236` zaten
`Ortak kök — <label>` diye basıyor.

Doğrulama: 24 kök + 120 şık + 24 çözüm + 9 blok kökü kaynakla karakter
karakter karşılaştırıldı (izinli dönüşümler dışında fark yok). **24 cevabın
24'ü PowerShell'de bağımsız olarak yeniden hesaplandı** — tam sayı
aritmetiğiyle, sembol/öz/ayrım/ücret/hamle fonksiyonları yeniden yazılıp
aralık taranarak; oyun soruları (21, 22) 5000'e kadar, rakam ekleme soruları
(23, 24) bütün hamle ağacı üretilerek. **24/24 doğru.** Harf dağılımı
**A:5 B:4 C:6 D:4 E:5**, blok üyeliği 9/9, Not kutularının hepsi metnin son
satırında (`richText` `/^Not:/m` bulduğu yerden sona kadar kutuya alıyor —
Not'tan sonra satır yazılırsa o da sarı kutuya girerdi).

## Yanlışlarım ekranında konu kapsamı

**2026-09-01 (v41) · `js/scheduler.js`, `js/quiz.js`, iki ekran.**
Bir paketi bitirip "Yanlışlarımı şimdi tekrar et"e basınca — ya da konu bugünlük
bitip "Yanlışlarımı şimdi çalış" çıkınca — tüm derslerin yanlışları geliyordu.
Ana ekranda **"Sadece yanlışlarım"** girişi zaten ayrı durduğu için konu içinden
aynı listeye düşmek o girişi işlevsiz kılıyordu.

**Filtre uygulanmıyor değildi, hiç yazılmamıştı.** `buildWrongQueue()` parametresizdi,
`buildFor`'un `yanlis` dalı `params`'ı hiç okumuyordu (`#/oturum/yanlis/...` yazılsa
bile parçalar sessizce düşerdi) ve iki düğme de düz `'#/oturum/yanlis'` gönderiyordu —
oysa ikisi de o an hangi konuda olduğunu biliyordu.

**Filtre için ek veri gerekmedi.** İlerleme kaydında konu bilgisi yok
(`questions[id]` yalnızca `lastWrong` tutar) ama `loadPack` yükleme anında her soruya
`topic`/`subtopicId` yapıştırıyor ve `buildWrongQueue` zaten `loadAllQuestions()`
çağırıyordu; kapsam süzgeci yüklü listede tek satır. Soru id önekinden konuya gitmek
**yanlış olurdu**: `ucgen-003` pisagor, `ucgen-041` öklid, `ucgen-161` açıortay
paketinde — `ucgen-*` id'leri 8 alt konuya dağılmış durumda.

**Rota:** `#/oturum/yanlis/konu/<konu adı>` ve `#/oturum/yanlis/altkonu/<subtopicId>`.
Parçasız `#/oturum/yanlis` bugünkü anlamını korur; ana ekranın girişi ve eski
bağlantılar aynen çalışır, `home.js` değişmedi. Alt konu kimliği konu adından
önceliklidir (`buildTopicSet` konu **adına**, `buildSubtopicSet` `subtopicId`'ye
baktığı için kapsam da aynı alanları kullanır — rota şekli mevcut `konu`/`altkonu`
rotalarıyla birebir).

**Başlık boş listede de doğru:** `label`, kapsam süzgecinden sonra ama `lastWrong`
süzgecinden **önce** alınır. Yoksa yanlışı kalmamış bir alt konu "Yanlışlarım · null"
diye açılırdı.

**Sonuç ekranı kapsamı oturumdan öğrenir.** `createSession`'a `scope`
(`{ kind: 'konu' | 'altkonu', value }` ya da `null`) eklendi; motor kullanmaz, yalnız
taşır. Günlük rutin ve mini test tek konuya bağlı olmadığı için `null` kalır — orada
düğme eskisi gibi tüm yanlışlara gider. Kapsamlı yanlış oturumu kendi kapsamını
taşıdığı için tekrarın tekrarında da aynı konuda kalınır. Kapsam sorulardan
*çıkarılmadı*, rotadan geldi: tek alt konusu olan bir konuda çıkarım kapsamı sessizce
alt konuya daraltırdı.

**Bloklara dokunulmadı.** İstenen davranış zaten sağlanıyordu: kök soru nesnesinde
durduğu için (`question.block`) bir bloğun tek sorusu listeye düşse de kökünü yanında
getirir, `lastBlockId` eşleşmediğinden **açık** gelir. Kuyruk `lastSeen` sırasında
kaldı; kardeş soruları listeye çekmek ya da blok blok gruplamak yapılmadı.

**İlerleme kayıtları etkilenmedi.** `dgs.progress.v1` şeması, `lastWrong` anlamı ve
"üst üste 2 doğru → listeden düşer" kuralı aynı; göç yok. `buildWrongQueue` salt
okunur bir türetme, cevap yolu (`store.recordAnswer`) değişmedi — soru hangi listede
görünürse görünsün Leitner kutusu aynı ilerler. Yanlışlar modunda yarım oturum zaten
kaydedilmiyordu (`resumeKeyFor` → `null`), yeni rotalar hiçbir kayıtlı oturumu
geçersiz kılmaz. Ana ekrandaki rozet **bilerek global kaldı**.

Yan kazanç: alt konu satırındaki "N yanlış tekrar bekliyor" ve boş durumdaki `pending`
sayısı zaten konuya filtreliydi; düğme artık tam da o N soruyu açıyor.

## Blok birimli zorluk sıralaması

**2026-09-01 (v42) · `js/scheduler.js`, `js/screens/session.js`** — sıralama birimi
tek soru olduğu için üçlü bir bloğun soruları 2., 12. ve 24. sıraya dağılıyordu. İki
zararı vardı: aynı 8–15 satırlık kök üç kez okunuyordu (gerçek sınavda blok soruları
peş peşe gelir, kök bir kez okunur) ve blok kendi içinde artan zorlukta kurulduğu
için — ilki tanımı uygulatır, sonuncusu üstüne biner — araya soru girince bu ilerleme
kayboluyordu.

**Çözüm: birim kavramı.** `orderingUnits` listeyi birimlere böler — bağımsız soru tek
başına bir birim, aynı bloğa bağlı sorular tek birim. Blok listede ilk sorusunun
yerini tutar, iç sırası `questions` dizisindeki kaynak sıradır, zorluğu içindeki en
yüksek zorluktur. `orderUnitsByDifficulty` sonra eski düzeni kurar (kolay → orta →
zor, kova içi rastgele), yalnız karılan şey soru değil birimdir. Blok kardeşleri
böylece hep ardışık kalır, bağımsız sorular aralarına girebilir.

**Kapsam bilinçli olarak dar.** Yalnız `orderForLearning`'in "geri kalanlar" bölümü,
yani konu / alt konu çözerken paketi ilk kez görme. Değişen tek satır orası.

- **Tekrar bölümü (`orderDueByDifficulty`) dokunulmadı.** Leitner'da blok birim değil:
  kardeş sorular ayrı günlerde döner, tekrara düşen tek soru yalnız gelir. Kökü
  yanında gelir çünkü `js/packs.js` kökü yükleme sırasında soru nesnesine yapıştırır;
  `lastBlockId` eşleşmediği için de açık çizilir.
- **`buildDaily` dokunulmadı**, `orderByDifficulty`'yi kullanmaya devam ediyor. Günlük
  set hedef soru sayısına göre kesildiği için blok orada nasılsa bölünürdü; ardışıklığı
  oraya taşımak yarım blok riskini çözmeden karmaşıklık eklerdi.
- `buildTest` (bilerek karışık) ve `buildWrongQueue` (`lastSeen` sırası) zaten dışarıda.
- Kısmen çözülmüş pakette blok kendiliğinden ikiye ayrılır: vadesi gelen kardeşleri
  tekrar bölümünde tek tek, görülmemişleri geri kalan bölümde ardışık. İstenen bu.

**17 paket neden etkilenmedi — yapısal garanti, gözlem değil.** Bloksuz pakette her
sorunun `question.block` alanı `null`, dolayısıyla `orderingUnits` her soru için ayrı
birim üretir: birim dizisi girdiyle birebir aynı uzunlukta ve aynı sırada, her birimin
zorluğu o sorunun kendi zorluğu. Kovalama `difficultyBuckets` ile aynı sonucu verir ve
`shuffle` (`js/ui.js`) yalnız dizi uzunluğuna bakan Fisher–Yates olduğu için aynı
sayıda `rand()` çekilir — çıktı soru soru özdeş, tohumlu çağrılarda bile. Blok alanı
olan tek paket `mantik-blok-1`.

**"Zor sorulara geçtin" bildirimi.** Blok tek birim olarak zor kovasına girdiği ve
zorluğu içindeki maksimum olduğu için zor bir blok kolay bir soruyla başlayabiliyor;
kontrol soru soru yapıldığından bildirim bloğun 2. ya da 3. sorusunda patlıyordu.
`midBlock` şartı eklendi: bildirim yalnız blok sınırında ya da bağımsız soruda
çıkabilir. Sınırda kaçarsa bir sonraki birime kayar — yumuşak bir hatırlatma, kaçması
bir şey bozmuyor. `lastBlockId` bu kontrolden sonra güncellendiği için orada hâlâ
önceki sorunun bloğunu tutuyor.

Kök kutusunun katlanma mantığı (`sharedStem`, `js/screens/session.js`) değişmedi —
ardışık gelen ikinci/üçüncü soruda kökün katlanmış gelmesi `_sema.md` §8.2'nin zaten
istediği davranıştı, blok ardışık olunca ilk kez gerçekten devreye girdi.

> **Sonradan değişti (2026-09-01):** blok ardışık olunca davranış ilk kez görülebildi
> ve istenmediği anlaşıldı; oturumdaki katlama kaldırıldı — bkz. "Oturumda kök her
> soruda açık".

Şema dokümanı buna göre güncellendi: `_sema.md` §8.3 (öğrenme birimi değil) ve yeni
§8.4 (sıralama birimi + kapsam tablosu).

## Oturumda kök her soruda açık

**2026-09-01 (v43) · `js/screens/session.js`** — blok birimli sıralama gelince aynı
blok arka arkaya gelmeye başladı ve `lastBlockId` katlaması ilk kez gerçekten görüldü:
üçlü bir bloğun 2. ve 3. sorusunda kök katlanmış geliyor, okumak için dokunmak
gerekiyordu. Kaldırıldı.

**Değişen tek satır** (`js/screens/session.js`):
`sharedStem(question.block, { open: question.block.id !== lastBlockId })` →
`sharedStem(question.block, { open: true })`. Gerekçe üç başlık: gerçek DGS'de kök her
soruda tam basılır (kapalı hâl formatı taklit etmiyor); her blok sorusundaki fazladan
dokunuş soru başına 90 saniye bütçesinde gereksiz sürtünme; kök ile soru oturumda tek
görsel bütün, ayırmak okuma akışını bozuyor.

**Sonuç ekranı bilerek değişmedi.** `openRootIndexes` ve `js/screens/result.js`'e hiç
dokunulmadı: gözden geçirme listesinde aynı kökün üç kez tam açık tekrarlanması listeyi
şişirir, "yanlışta açık / doğruda kapalı" kuralı orada hâlâ doğru. İki ekranın
ayrışması `sharedStem`'in `open` parametresiyle zaten mümkündü — ortak fonksiyonun
gövdesine de dokunulmadı, karar her ekranın kendi çağrı yerinde.

**`lastBlockId` silinmedi.** İkinci bir tüketicisi var: zor blok bildirimini bloğun
ortasında bastıran `midBlock` kontrolü (bildirim, kolay bir soruyla başlayan zor bloğun
2. sorusunda patlamasın diye). Kontrol atamadan **önce** çalıştığı için sıra korundu;
değişkenin yorumu "artık yalnız bildirim için" diye yeniden yazıldı. Yukarıdaki eski
kayıtlarda geçen "tek gelen blok sorusunda kök `lastBlockId` eşleşmediği için açık
çizilir" cümlelerinin **sonucu** hâlâ doğru, yalnız mekanizma açıklaması geçersiz:
artık koşulsuz açık.

Katlama durumu hiçbir yerde saklanmıyordu (`toggle` dinleyicisi yok, her soruda
`clear(body)` DOM'u baştan kuruyor), yani kullanıcı kutuyu elle katlarsa bir sonraki
soruda yine açık gelir. Kutu `<details>` olarak kaldı; CSS kuralları değişmedi.
Dokümanlar buna göre güncellendi: `_sema.md` §8.2'de oturum ve sonuç ekranı artık ayrı
maddeler, `sharedStem` JSDoc'u ve `css/app.css` yorumu da öyle.

## Görsel sayısal mantık paketi

**2026-09-02 (v44) · `data/packs/mantik-blok-2.json`** — 20 soru · 8 blok
(4 üçlü, 4 ikili) · bağımsız soru yok · **14 SVG**. Kaynak
`referans/paket_mantik_gorsel.md`; iş transkripsiyondu, soru üretilmedi.
Soru id'leri `gorsel-01…20`, blok id'leri `gorsel-*` (paket 1'in
`mantik-01…24` sayacıyla çakışmaz). Kod yine değişmedi.

**`blocks[].figure` yolu ilk kez gerçek veriyle sınandı.** Beş blok ortak SVG
taşıyor (`gorsel-pasta`, `gorsel-sutun`, `gorsel-duzenek`, `gorsel-dondurme`,
`gorsel-oda`), üç blokta şekil soru başına değişiyor ve `questions[].figure`'da
duruyor. Oturumda 20 sorunun 20'sinde de kök kutusu açık geldi, bloklar ardışık
sıralandı.

Aktarımda üç bilinçli dönüşüm yapıldı:

- **Kaynaktaki `fill='var(--bg, white)'` düğüm dolgusu `#f8fafc` ile
  değiştirildi.** `--bg` koyu lacivert `#0f172a`, oysa `.figure` paneli her
  temada sabit açık zemin (`css/app.css:336`). Değişken bırakılsaydı oda-kapı
  çizgesindeki daireler koyu dolar, içlerindeki A–F harfleri de `currentColor`
  olduğu için görünmez olurdu. **Şekillerde CSS değişkeni kullanılmaz** — panel
  temayla dönmüyor.
- **viewBox'lar 320 genişliğe normalize edildi**, çizim koordinatlarına
  dokunulmadan: pencere içerik kutusunun çevresinde yatay ve dikey ortalandı.
  Kaynak 160–400 arası yedi farklı genişlik kullanıyordu; `.figure svg` kutu
  genişliğine gerildiği için 3×3 tablo ile pasta grafik aynı boya şişiyordu.
  İki şekil (`gorsel-pasta`, `gorsel-duzenek`) tam 320 birim geniş olduğundan
  onlarda pencere 332'ye açıldı — kırpılmasınlar diye. Doğrulama tarayıcıda
  `getBBox()` ile yapıldı: 14 şeklin hepsinde sol/sağ ve üst/alt boşluk eşit,
  hepsi ≥ 6 birim, taşma yok.
- Çözümlerdeki `$…$` LaTeX parçaları ve markdown tablosu düz metne çevrildi;
  kaynaktaki `> **Not:**` alıntısı satır başı `Not:` oldu — `richText` sarı
  kutuyu `^Not:` ile yakalıyor ve regex kalınlaştırmadan **sonra** çalıştığı
  için `**Not:**` yazılsa kutu hiç açılmazdı (`js/ui.js:64`).

**Soru 14'ün cevabı D, dağılım bilerek 4-4-4-5-3.** Kaynakta iç tutarsızlık
vardı: soru gövdesi, çözümü ve şekli **D** (1 çakışan hücre) diyor, kaynağın
özet anahtar tablosu ise **E** (0). Gövde doğru — 90° dönüşte (r,c) → (c, 4−r),
görüntüler (1,3), (2,3), (2,2), (3,1) ve ilk kümeyle ortak eleman yalnız merkez
hücre (2,2); kaynağın kendi Not kutusu da bunu söylüyor. Yanlış olan özet tablo,
pakete **D** yazıldı. Ortaya çıkan dağılım A:4 B:4 C:4 **D:5 E:3**,
`_format_profili.md` §9'un "20 soruluk pakette her harf 3–5 arası" kuralının
içinde. **Sırf 4-4-4-4-4 simetrisi için doğru kurulmuş soru bozulmadı** —
dağılım kuralı bir aralık, hedef değer değil.

## Karalama alanı donması

**2026-09-02 (v45) · `js/scratchpad.js`** — Şikâyet: telefonda uzun
oturumlarda karalama alanı donuyor, çizilemiyor ve silinemiyor; yalnızca
uygulamayı tamamen kapatıp açmak düzeltiyor. Uygulamanın geri kalanı sağlam.

**Sızıntı sanıldı, değildi.** Tarayıcıda `addEventListener` yamalanarak 20
soruluk oturum ölçüldü: canvas dinleyicisi 5'te, window 2'de, DOM'daki canvas
1'de, heap ~4 MB'de sabit kaldı. 60 büyüt/küçült turu + 420 fırça darbesi
sonrasında da toplam `addEventListener` 181 → 181, `history.length` 3 → 3,
`body.className` boş. Undo yığını zaten tam görüntü değil yol verisi tutuyor,
`MAX_STROKES = 30` ile sınırlı ve `reset()` her soruda temizliyor.
Karalamada `requestAnimationFrame` ya da `setInterval` hiç yok.

**Gerçek sebep: kurtarma yolu olmayan `activePointerId`.** `onPointerDown` ilk
satırda `if (activePointerId !== null) return;` diyordu ve bu değişkeni yalnız
`endStroke` sıfırlıyordu. `endStroke`'u tetikleyen üç olay da (`pointerup`,
`pointercancel`, `lostpointercapture`) **sadece tuval üzerinde** dinleniyordu.
Bitiş olayı tuvale ulaşmazsa değişken sonsuza kadar takılı kalıyor, tuval
ölüyordu. `setPointerCapture` yedeği `try/catch` içinde sessizce yutuluyordu.
Ölçülen tuzaklar: parmak tuvalin dışında bırakılıyor, bitiş olayı hiç gelmiyor,
`pointerup` farklı `pointerId` ile geliyor, ekran kilitleniyor/bildirim geliyor.

**"Uzun oturumlarda" olması kaynak birikmesi değil, olasılık birikmesi.** Her
dokunuş bu tek yönlü tuzağa girme şansı taşıyor; yüzlerce darbede en az bir kez
düşmek kesinleşiyor. Bellek düz kaldığı hâlde deneyim bozuluyor.

**"Sadece yeniden başlatmak düzeltiyor" algısının sebebi:** çalışan iki kurtarma
yolu (`Temizle` ve sonraki soru) çizimi de siliyordu. `Silgi`, `Büyüt/Küçült`
ve paneli kapat-aç hiçbir şey yapmıyordu; `Geri al` ise `if (current || ...)`
yüzünden bloke olduğu hâlde düğme **aktif görünüyordu** — "silemiyorum"
tarifinin karşılığı bu.

Üç katmanlı savunma eklendi, hiçbiri çizimi yok etmiyor:

- **Bırakma olayları tuvalden alınıp pencereye taşındı.** Tuvalde yalnız
  `pointerdown` ve `pointermove` kaldı; `pointerup`, `pointercancel` ve
  `lostpointercapture` artık `window` üzerinde. Üçü de kabarcıklandığı için
  yakalama kurulsun kurulmasın pencereye ulaşırlar — parmak 180 px'lik kutunun
  dışında kaldırıldığında bile `activePointerId` sıfırlanır. `endStroke`
  `pointerId` eşleşmesine baktığından sayfadaki alakasız dokunuşlar no-op.
- **Bayat pointer tahliyesi** (`activePointerGone`): yeni bir `pointerdown`
  geldiğinde eski pointer artık aktif değilse iptal edilip yenisi kabul edilir.
  İki bağımsız sinyal: `event.isPrimary` (spesifikasyon gereği "ortada başka
  aktif dokunuş yok"), **veya** yakalama kurulmuşken `hasPointerCapture` artık
  `false` (tarayıcı örtük olarak bırakmış). İkincisi `captureHeld` bayrağıyla
  korunuyor — `setPointerCapture` hiç kurulamadıysa `hasPointerCapture` zaten
  `false` döner ve **meşru ikinci parmağı haksız yere tahliye ederdi**.
  Avuç/ikinci parmak bu kapıdan geçmiyor: **tek parmak kuralı ve avuç reddi
  bozulmadı**, ölçüldü.
- **`visibilitychange` (iki yönde de) ve `pagehide`** darbeyi kapatıyor: ekran
  kilidi, bildirim, uygulama değiştirme. Geri dönüldüğünde parmağın hâlâ basılı
  olması gerçekçi değil; en kötü ihtimalle darbe bölünür, tuval ölmez.

Ayrıca `endStroke` ve `reset()` artık `releasePointerCapture` çağırıyor (tuval
`clear(body)` ile sökülüp geri eklendiğinde bayat yakalama kalmasın) ve
`syncTools` darbe sürerken `Geri al`'ı pasifleştiriyor — sessizce ölü düğme
kalmasın. Yeni dinleyicilerin hepsi `destroy()` içinde kaldırılıyor; ekrandan
çıkınca window/document sayacı **sıfıra** iniyor, 3 kez gir-çık sonrası da öyle.

Doğrulamada dört tuzak senaryosunun (parmağı tuval dışında bırakma, bitiş
olayının hiç gelmemesi, farklı `pointerId` ile gelmesi, sayfanın gizlenmesi)
dördünde de sonraki darbe çiziliyor; `pointercancel` ve `lostpointercapture`
yolları da kurtarıyor ve **önceki çizim korunuyor** — kurtarma `Temizle`'ye
düşmüyor. 20 soru boyunca bilerek düşürülen 40 bitiş olayına rağmen tuval
çalışmaya devam etti; dinleyici sayıları (tuval 2, window 5, document 1) ve heap
(~4,7 MB) düz kaldı. `destroy()` sonrası window/document sayacı **sıfır**, 3 kez
gir-çık sonrası da öyle.

**Doğrulamanın kendi tuzağı:** ilk turda service worker eski sürümü servis etti
ve testler yanlış "başarısız" verdi. Tarayıcıda ölçmeden önce SW unregister +
`caches` temizliği + reload, ardından `fetch('/js/scratchpad.js')` içeriğiyle
yeni kodun gerçekten servis edildiğinin teyidi şart. Ayrıca önizleme paneli
gizliyken `setTimeout` 1 sn'ye kısılıyor; test kodu eşzamanlı yazılmalı.

## Bilinen açık maddeler

Düzeltilmedi, kayıt için duruyor:

- **Karalama tam ekrandayken süreli testin süresi dolarsa** `finishSession`
  → `navigate('#/sonuc', { replace: true })` karalamanın geçmiş kaydının
  üzerine yazar; yığında fazladan bir `#/oturum/...` kaydı kalır ve sonuç
  ekranından bir geri, listeye değil oturuma iner. Çökme değil, dar bir kenar
  durum: `destroy()` gezinme ortasında `history.back()` çağırmak daha riskli
  olacağı için yalnızca görünümü kapatıyor.
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
- `dortgenler.json` denetiminin KOZMETİK maddeleri de bırakıldı: `dortgen-eskenar`
  item[3]'te `h` etiketi yükseklik doğrusuna değiyor; `dortgen-kare` item[0]'da
  dik açı D'de ve bir 45° A'da (ikisi △ADC'de) ama ikinci 45° C'de CB–CA
  arasında, yani △ABC'de — `a√2`'yi veren üçgenin kendi 45°'lerinden biri
  işaretsiz; `dortgen-kare` item[5] "Köşegenler açıları 45°'ye böler" diyor
  (gevşek ifade) ve iki köşegen de çizili olmasına rağmen yalnız A ve C açıları
  işaretli; `dortgen-yamuk` item[3] başlığının "Köşegenlerin kesiştiği
  noktadan:" kurgusu bozuk. (`dortgen-acilar` item[3]'teki parantez–açıortay
  çakışması, şeklin yeniden çizilmesiyle kendiliğinden kalktı.)
- `cember.json` denetiminin KOZMETİK maddeleri de bırakıldı: `cember-teget`
  item[3]'te `d` etiketinin üst çıkıntısı `PO` doğrusuna değiyor; `cember-alan`
  item[4]'te küçük `r` etiketi hem iç çemberle hem kendi yarıçapının uç kapağıyla
  çakışıyor (büyük `R` düzeltildi, küçüğü bırakıldı); `cember-kirisler-dortgeni`
  item[3]'te `CD` kenarı çizilmiyor, oysa kartın diğer üç şekli dörtgeni çiziyor;
  `cember-kiris` item[3] notu "En uzun kiriş çaptır" diyor ama şekilde çap yok;
  `cember-alan` item[2] ("dilim = yay uzunluğu · r / 2") şekilsiz, oysa item[1]'in
  şekli birebir uyarlanabilir.
- `dortgen-muhtesem-dortlu` item[1]'de O çevresindeki dört dik açı karesi tek
  bir kutu gibi okunuyor ve `p`/`r` etiketleri bu kutuya 5 px kalıyor. Eski
  şekilde de aynı kurgu vardı; yeni dörtgende `AO` kısaldığı için biraz daha
  sıkışık.
- Matematik denetiminin **toplu eksik-koşul tablosundaki 25 mekanik satırı** bu
  turda bilinçli olarak kapsam dışı bırakıldı. Hiçbiri yanlış çıkarıma itmiyor
  (DGS bağlamında taban zaten pozitif tam sayı kabul ediliyor), yalnız koşul
  yazılı değil: `ardisik-sayilar` ve `uslu-kurallar` item[0]'da `n ∈ Z⁺`,
  `bolen-sayisi` item[0]'da "p, q, r farklı asallar", `bolunebilme-kurallari`
  item[0]–[8]'de "10'luk tabanda", `ebob-ekok`'un dört kartında "a, b pozitif
  tam sayı", `rasyonel-islemler` item[2][3]'te `c ≠ 0`, `koklu-kurallar`
  item[5]'te `a ≥ 0` gibi. Ayrı bir turda toplu uygulanacak; tam liste
  `matematik-denetim-raporu.md` §"Toplu eksik-koşul tablosu".
- Matematik denetiminin kalan **6 KOZMETİK maddesi** de bırakıldı: asal çarpan
  gösterimi `asal-sayilar` item[2]'de indisli (`p₁ᵃ · p₂ᵇ`), `bolen-sayisi`
  item[0]'da ayrı harfli (`pᵃ · qᵇ`) — bitişik iki konuda iki gösterim (Z1);
  `uslu-kurallar` item[7] ve `koklu-kurallar` tips[0]'daki koşulsuz "≠" kalıbı
  (`(a + b)ⁿ ≠ aⁿ + bⁿ` n = 1'de, `√a + √b ≠ √(a + b)` a = 0'da eşit — karşı
  örnekler dejenere olduğu için K2'den ayrıldı) (Z3); `sayi-cesitleri` item[2]
  notu ve `asal-sayilar` item[1] kartın T/Ç kısaltmasıyla çakışan "tek"
  kelimesini "yalnızca bir tane" anlamında kullanıyor (Z4, Z5);
  `ebob-ekok-problem` item[4] ile item[5]'in giriş cümleleri neredeyse aynı,
  farkı ne arandığı (bölen mi sayı mı) belirliyor ama yazılı değil (Z6);
  `koklu-icice-siralama` item[4] "0 < a < 1 için sıralama ters döner" derken
  hangi sıralamanın döndüğünü söylemiyor — yalnız item[3] dönüyor, item[2]
  dönmüyor (Z7).
- Konular arası sembol gerilimi (Z8): `rasyonel-tanim` item[4] sadeleştirmeyi
  `(a·k)/(b·k) = a/b` diye yazıyor, yani `k` = ortak çarpan; `oran-oranti`'nin
  dört kartında ise `k` = orantı sabiti ve ortak çarpan `m`. İki konu da kendi
  içinde tutarlı, çelişki yok; bitişik konularda aynı harfin iki anlamı Z1 ile
  aynı sınıftan bir kozmetik madde. `ozdeslik-uygulama`'daki `a + 1/a = k` de
  üçüncü bir yerel anlam.
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
- Aynı şey `ozdeslik-genel` için de geçerli: kart bağlantısı `subtopicId`'den
  değil `label` alias'ından gelir. Bu pakete **yeni konfigürasyon** eklenirse
  etiketi `data/formuller/ozdeslikler.json` içindeki uygun kartın `aliases`
  listesine yazılmalı; yoksa o soruda kart açılmaz.
- `ozdeslik-17` (n³ − n) `a² − b²` özdeşliğini b = 1 ile kullanır; paketin geri
  kalanında dejenere kurulum yok. Ardışık üç sayı çarpımı klasik biçimiyle
  yazılabilsin diye bilinçli bırakıldı — b = 1 burada hiçbir terimi düşürmüyor.

## Soru bazlı süre ölçümü

**2026-09-03 (v46) · yeni `js/timing.js` + `store.js`, `quiz.js`, iki ekran, `sw.js`.**
DGS'de 50 soru 75 dakika — soru başına 90 saniye. Paketler bu bütçenin üstünde
bitiyordu ama sürenin nereye gittiği bilinmiyordu: tek bir soruya mı takılınıyor,
yoksa süre tüm sorulara mı yayılıyor. Bu tur **yalnızca ölçüm** ekledi.

**Çözme akışında görünür hiçbir şey değişmedi** — uyarı yok, kronometre yok, renk
yok. Gerekçe İsmail'in koyduğu şart: görünür bir sayaç davranışı değiştirir, o
zaman doğal hız değil sayaca tepki ölçülmüş olur. Önce sayaçsız bir **referans
ölçümü** toplanacak.

### Ölçen ve gösteren ayrı

Bir sonraki turda açılıp kapanabilen **görünür** bir sayaç gelecek. O turda ölçüm
mantığı yeniden yazılmasın diye ikisi baştan ayrıldı:

- **Ölçen:** `js/timing.js` → `createQuestionTimer()`. `start()` / `stop()` /
  `peek()` / `subscribe()` / `destroy()`.
- **Gösteren:** ekranlar. Bu turda tek gösterim oturum sonu özeti.
- **Bağlanma noktası:** `timer.subscribe(fn)`. İlk abone gelince 1 saniyelik aralık
  kurulur, son abone gidince kalkar, arka planda hiç çalışmaz. **Bu turda hiç abone
  yok, dolayısıyla hiç zamanlayıcı kurulmuyor** — ölçüm yalnız `Date.now()`
  farklarından birikiyor.
- Her kayıt `counterVisible` alanı taşır (şimdilik hep `false`). Sayaç açıldığında
  `true` yazılacak; iki dönemin verisi karışmayacak.

Hesap da gösterimden ayrı: `session.timingSummary()` (`js/quiz.js`) sayıları üretir,
`js/screens/result.js` yalnızca basar.

### Duraklatma: tek yüklem, beş senaryo

Sayaç tek bir yüklemden karar verir; her olay yalnızca bir bayrak çevirir:

    calisiyor = visible && focused && !frozen && !pageHidden

Bayraklar **içerde** tutulur, `document.hasFocus()` gibi canlı sorgular tekrar
sorulmaz: davranış belirlenimli olur ve doğrulamada olay göndererek sınanabilir.

| senaryo | olaylar | davranış |
|---|---|---|
| Sekme/uygulama gizlendi, ekran kilitlendi, kare tuşu | `visibilitychange` | anında durur |
| Mobil tarayıcıda arka plana atma, bfcache | `pagehide` / `pageshow` | anında durur |
| Odak kaybı (başka pencere, bildirim çekmecesi) | `blur` / `focus` | 2 sn tolerans, sonra **blur anına geri tarihlenerek** durur |
| Tarayıcı sayfayı dondurdu | `freeze` / `resume` | anında durur |
| PWA tamamen kapanıp açıldı | — | aşağıda |

**Blur toleransı (`BLUR_GRACE_MS = 2000`)** adres çubuğuna dokunmak gibi anlık odak
kayıplarında sayacın durmaması için. Tolerans dolarsa duraklama blur'un olduğu ana
geri tarihlenir, böylece **o 2 saniye soruya yazılmaz** (ölçüldü: sızıntı 0 ms).

**`focused` başlangıçta `true` kabul edilir, `document.hasFocus()` bilerek
sorulmaz.** Doğrulama tarayıcısı sayfa görünür dururken bile `hasFocus() = false`
döndürdü; başlangıçta ona güvenilen ilk sürümde sayaç hiç çalışmadı ve soru
**0 sn** ölçüldü. Duraklatmanın eksik çalışması, hiç çalışmamasından iyidir:
gerçek bir odak kaybı zaten `blur` olayıyla gelir.

**PWA tamamen kapanıp açılırsa** JS hiç çalışmaz, sayaç nesnesi yok olur. Kayıt
yalnız cevaplanmış sorular için açıldığından **yarım kalan sorunun kaydı hiç
açılmamıştır**; dönüşte `restoreSession` soruyu yeniden gösterir ve sayaç sıfırdan
başlar. Kapalı geçen sürenin yazılabileceği bir kayıt yoktur.

**Emniyet kemeri — `MAX_QUESTION_MS` (15 dk):** kaçırılan bir senaryo veriyi
bozmasın diye 15 dakikayı aşan kayıt `suspect: true` alır. Değer **kırpılmaz**
(bilgi kaybolmasın) ama ortalamaya katılmaz; sonuç ekranı ayrıca söyler.

### Kayıt şeması ve depo

Kayıtlar mevcut ilerlemeyle **aynı anahtarda** (`dgs.progress.v1` → `timings`),
ekleme tabanlı bir dizide. Aynı soru tekrar çözülünce **yeni kayıt açılır**, eskisi
korunur (zaman içindeki değişim görünsün). Boş ve `false` alanlar yazılmaz; tek
istisna `counterVisible`, o her kayıtta açıkça durur. Kayıt başına ~197 bayt.

    { qid, packId, topic, subtopic, difficulty, blockId?, ms, pausedMs?,
      suspect?, correct, day, at, counterVisible }

`correct`: `true` / `false` / **`null` = görünüp cevaplanmadan geçilen soru.**
Hiç ekrana gelmemiş sorular kayıt açmaz (0 saniyelik sahte kayıt olmaz).

**Yazma cevap başına değil, toplu:** `session.answers` zaten tampon görevi görüyor;
`flushTimings()` oturum sonunda, ekrandan çıkarken, `pagehide`'da ve sayfa arka
plana geçtiğinde tek `addTimings()` çağrısıyla yazar. Çözme akışında cevap başına
fazladan disk yazması yok.

**Sınır `MAX_TIMINGS = 3000`** (~60 gün × 50 soru, dolu hâlde 583 KB). Ekleme
anında uygulanır, en eskiler düşer. **Sınır yalnız depo içindir:** `exportJson()`
kendi başına kırpma yapmaz, yedek o andaki verinin tamamını taşır. Ama düşmüş bir
kayıt hiçbir yerde durmadığı için yedeğe de giremez — haftada bir yedek alındığında
hiçbir şey kaybolmaz.

**Düşme sessiz değil:** İstatistik ekranında yedekleme başlığının altında tek satır
— "Süre kaydı: 3000 kayıt · en eskisi 19 Haziran. Sınıra takılan 6 eski kayıt
düştü." Ana ekranda süre bölümü **yok**.

Sayaç `timingsSeen` (bugüne kadar eklenen toplam); düşen sayısı bundan türetilir.
İlk hâlde doğrudan bir `timingsDropped` sayacı vardı ve **yanlış sayıyordu**:
`mergeStates` her yazmada çalıştığı için aynı düşme birden fazla kez toplanıyordu
(6 yerine 11 yazdı). Yalnızca artan bir sayaçtan çıkarma yapmak bu sınıfı bitirdi.

**Leitner'a ve ilerlemeye tek satır dokunulmadı.** `recordAnswer`, `recordSkipped`,
`pickStat`, kutu/vade mantığı aynen duruyor; `timings` yanlarına eklenen bağımsız
bir dizi. Yedek alma/yükleme/sıfırlama durumun tamamını yazıp okuduğu için süre
kayıtları kendiliğinden dahil oldu (eski, `timings` alanı olmayan bir yedek de
sorunsuz yükleniyor).

### Oturum sonu özeti

Sonuç ekranındaki mevcut kutular ve gözden geçirme listesi aynen kaldı. Altına sade
bir kart: **toplam süre**, **cevaplanan ortalaması**, en uzun üç soru (numarası ve
süresiyle). Hedef çizgisi, renk, uyarı yok.

Üç kova üst üste binmez, toplam = cevaplanan + boş + şüpheli:

- **ortalama yalnız cevaplanan sorulardan** (boş ve şüpheli hariç) — temiz ölçüm,
- **toplam üçünü de içerir** — geçen süre,
- aradaki fark boşa giden süreyi doğrudan gösterir; boş kayıt varsa ayrıca yazılır
  ("Boş bıraktığın 1 soruda 1:14 geçti").

Ölçüm sorunun görünmesinden şıkkın işaretlenmesine kadardır: çözüm okuma süresi
dışarıdadır, bu yüzden üstteki mevcut "Süre" kutusundan (oturumun duvar saati)
küçüktür. Kartın altındaki tek satır bunu söylüyor.

### Doğrulama (tarayıcıda, sayıyla)

Duraklatmanın beş senaryosu **ayrı ayrı ölçüldü**. Desen aynı: soru gösterilir,
senaryo uygulanır, duvar saatiyle T saniye beklenir, dönülüp cevaplanır; kaydın
`ms` değeri "görünür geçen süre"ye eşit olmalı, `pausedMs` ≈ T olmalı.

| senaryo | görünür toplam | uzakta | beklenen ms | ölçülen ms | pausedMs | sapma |
|---|---|---|---|---|---|---|
| `visibilitychange` | 7268 | 5005 | 2263 | 2258 | 5005 | **5 ms** |
| `pagehide`/`pageshow` | 7763 | 4994 | 2769 | 2765 | 4994 | **4 ms** |
| kısa blur (1 sn, tolerans) | 4488 | — | 4488 | 4484 | **0** | **4 ms** |
| uzun blur (5 sn, geri tarihli) | 8800 | 5987 | 2813 | 2805 | 5987 | **8 ms** |
| `freeze`/`resume` | 6870 | 5004 | 1866 | 1859 | 5004 | **7 ms** |

**PWA kapanıp açılması:** oturumun ortasında belge tamamen yıkıldı, **41,4 saniye**
kapalı kalındı, sonra uygulama açıldı. Yarım soru için kayıt **açılmadı**
(12 → 12), oturum aynı soruyla devam etti (Soru 13/30) ve dönüşten sonra ölçülen
süre 3109 ms — dönüşteki görünür pencere 3116 ms, **sapma 7 ms**. Kapalı geçen
41 saniye hiçbir kayda sızmadı.

Diğerleri: 15 dk emniyet kemeri (`Date.now` 16 dk ileri kaydırıldı → `ms` 961142,
`suspect: true`, kırpılmadı, ortalamaya girmedi); aynı soru iki kez → aynı `qid`
ile iki ayrı kayıt (112 sn arayla, 2993 ve 3455 ms); bloklu soruda `blockId`;
mini testte gerçek süre dolması → ekrandaki soru `correct: null` + 74 sn, hiç
görülmemiş 7 soru için kayıt yok, ortalama 2 cevaptan, toplam boşu da içeriyor;
yedek al–geri yükle (19/19 kayıt, `timings` alanı olmayan eski yedek de sorunsuz);
sınır (3005 + 1 → 3000, düşen 6); iki kopya birleşimi (her iki tarafın kaydı yaşadı).

**Doğrulamada bulunup düzeltilen iki hata:** (1) devam ettirilen oturumda diskten
gelen cevaplar yeniden yazılıyor, oturuma her dönüşte kayıtlar çoğalıyordu — 6 cevap
12 kayıt oldu. Artık `resumed` ise o indeksler yazılmış sayılıyor, ayrıca
`addTimings` `at + qid` ile aynı kaydı ikinci kez almıyor. (2) yukarıdaki
`timingsDropped` yanlış sayması.

**Regresyon:** karalama alanı (çizim, parmağı kutunun dışında bırakma, ikinci
çizim, geri al, silgi, büyüt/küçült) sağlam; ortak kök, formül kartı, yarıda
bırakıp devam etme, oturumu sonuna kadar bitirme çalışıyor; konsol temiz.

**Ölçülen maliyet (masaüstü, 3000 kayıt / 583 KB dolu depo):** `recordAnswer`
12,6 ms, 5 kayıtlık `addTimings` 15,8 ms. `mergeTimings`'e hızlı yol eklendi —
tek kopya çalışırken iki liste aynıdır (uzunluk + ilk/son kaydın damgası), birleşim
yeniden kurulmaz; bu tek başına cevap başına yazmayı 18,3 ms'den 12,6 ms'ye indirdi.

**Doğrulama ortamının sınırı:** uygulama içi tarayıcı arka plandaki sekmeyi gerçekten
arka plana atmıyor (ikinci sekme öne alındığında `visibilitychange` hiç tetiklenmedi)
ve `document.hasFocus()` sayfa görünürken bile `false` dönüyor. Bu yüzden
`visibilitychange` senaryosu `document.visibilityState` gerçekten geçersiz kılınarak,
`blur`/`freeze` senaryoları olay gönderilerek ölçüldü — kod yolu birebir aynı yol,
ama cihaz düzeyinde bir test değil. Telefonda ilk oturumda bir kez göz ucuyla
bakılmalı: bir soruyu açıp uygulamayı kapatıp dönünce süre makul mü.

## Çalışma kuralları

- Plan modunda başla.
- Üretim miktarını (kaç soru) planda teyit ettir.
- Force push yapma.
- **`js/`, `css/` veya `data/` altında kullanıcıya giden herhangi bir dosya
  değiştiyse `sw.js` → `VERSION` artırılacak. Bu, düzeltme turlarında da
  geçerlidir — commit öncesi son kontrol adımıdır.** Salt geliştirme dokümanı
  (`DURUM.md`, `_sema.md`, denetim raporları) değiştiyse artırma.
  - Neden vurgulu: unutulduğunda hata görünmez. Kod doğru, test geçer, ama
    service worker eski cache'i servis ettiği için yüklü kullanıcılar
    değişikliği hiç görmez. Tek satırlık düzeltme turlarında en sık atlanan
    adım bu.
- İş bitince `/clear`.

## Referans

Paket şeması ve soru yazım kuralları: [`data/packs/_sema.md`](data/packs/_sema.md)
