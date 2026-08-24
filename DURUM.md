# Durum

**Son güncelleme:** 2026-08-24 · **sw.js VERSION:** `v27`

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

## Bilinen açık maddeler

Düzeltilmedi, kayıt için duruyor:

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
