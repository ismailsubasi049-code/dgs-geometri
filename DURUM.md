# Durum

**Son güncelleme:** 2026-08-23 · **sw.js VERSION:** `v25`

## Özet

**335 soru · 12 alt konu · 14 paket.** Tamamı geometri; matematik
branşında henüz soru paketi yok (formül kartları var).

## Paketler

| konu | subtopicId | görünen ad | soru |
|---|---|---|---|
| Açılar | `acilar-temel` | Temel açı kavramları | 24 |
| Açılar | `acilar-paralel` | Paralel doğrular ve kesenler | 3 |
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
| Dörtgenler | — | Dörtgenler | 10 |
| Çember ve Daire | — | Çember ve Daire | 10 |
| **Toplam** | | **14 paket** | **335** |

## Kalan işler

- **Paralel doğrular ve kesenler** (`acilar-paralel`): 3 → 30 soru
- **Karma üçgen paketi:** 30 soru, etiketsiz, konu ipucu vermeyen
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

## Çalışma kuralları

- Plan modunda başla.
- Üretim miktarını (kaç soru) planda teyit ettir.
- Force push yapma.
- Kullanıcıya giden içerik (paket/formül/kod/CSS) değiştiyse `sw.js` →
  `VERSION` artır. Salt geliştirme dokümanı değiştiyse artırma.
- İş bitince `/clear`.

## Referans

Paket şeması ve soru yazım kuralları: [`data/packs/_sema.md`](data/packs/_sema.md)
