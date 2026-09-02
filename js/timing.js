// Soru bazli sure olcumu - OLCEN kisim. Burada hicbir sey cizilmez.
//
// Neden ayri dosya: bir sonraki turda acilip kapanabilen GORUNUR bir sayac
// eklenecek. Olcum ile gosterim bastan ayrildigi icin o tur bu dosyaya
// dokunmayacak; ekran yalnizca subscribe() ile bir dinleyici asacak ve
// kayitlara counterVisible: true yazacak.
//
// Olcum "soru ekranda gorundu" aninda baslar, "sik isaretlendi" aninda biter.
// Cozum okuma suresi olcume girmez.

import { dayKey } from './ui.js';

/** Bir kayit bunu asarsa supheli sayilir: kacirilan bir duraklatma senaryosuna karsi emniyet kemeri. */
export const MAX_QUESTION_MS = 15 * 60 * 1000;

/**
 * Odak kaybi bu kadar surerse duraklatilir. Adres cubuguna dokunmak gibi anlik
 * odak kayiplarinda sayac durmasin diye; sure dolarsa duraklama blur anina GERI
 * TARIHLENIR, boylece bu tolerans soruya yazilmaz.
 */
const BLUR_GRACE_MS = 2000;

/** Gorunur sayac takildiginda dinleyicilerin beslenme araligi. Abone yoksa hic kurulmaz. */
const TICK_MS = 1000;

/**
 * Duraklamali soru sayaci.
 *
 * Sayacin tek bir yuklemi var:
 *     calisiyor = visible && focused && !frozen && !pageHidden
 * Her olay yalnizca bir bayragi cevirir, karar tek yerde verilir. Bayraklar
 * icerde tutulur (document.hasFocus() gibi canli sorgular tekrar sorulmaz):
 * davranis belirlenimli olur ve dogrulamada olay gondererek sinanabilir.
 *
 * Kapsanan senaryolar:
 *   visibilitychange  sekme/uygulama gizlendi, ekran kilitlendi, kare tusu
 *   pagehide/pageshow mobil tarayicida arka plana atma, bfcache
 *   blur/focus        odak kaybi (toleransli, geri tarihlemeli)
 *   freeze/resume     tarayici sayfayi dondurdu
 *
 * PWA'nin tamamen kapanip acilmasi bu listede yok, cunku o an JS hic calismaz:
 * sayac nesnesi yok olur, yarim sorunun kaydi zaten hic acilmamistir ve donuste
 * start() sifirdan baslar. Kapali gecen surenin yazilabilecegi bir kayit yoktur.
 */
export function createQuestionTimer() {
  let visible = document.visibilityState !== 'hidden';
  /**
   * Odak BASLANGICTA true kabul edilir; document.hasFocus() bilerek sorulmaz.
   * Bazi tarayicilar sayfa gorunur dururken bile hasFocus() = false dondurur
   * (dogrulamada bu tarayici da boyle cikti); baslangicta ona guvenilirse sayac
   * hic calismaz ve her soru 0 sn olculur - sessiz ve fark edilmesi zor bir kayip.
   * Duraklatmanin eksik calismasi, hic calismamasindan iyidir: gercek bir odak
   * kaybi zaten blur olayiyla gelir ve o an duraklatilir.
   */
  let focused = true;
  let frozen = false;
  let pageHidden = false;

  /** start() ile true, stop() ile false. Olcum penceresi. */
  let active = false;
  /** Son bayrak degisikliginin ani; biriktirme buradan itibaren yapilir. */
  let mark = 0;
  let ms = 0;
  let pausedMs = 0;

  let blurTimeout = null;
  let blurAt = 0;

  const listeners = new Set();
  let tickId = null;
  let destroyed = false;

  function open() {
    return visible && focused && !frozen && !pageHidden;
  }

  /**
   * mark ile now arasini dogru kovaya yazar ve mark'i ilerletir. Bayrak
   * DEGISMEDEN once cagrilir: gecen sure, o sirada gecerli olan duruma gore ayrilir.
   */
  function flush(now = Date.now()) {
    if (!active) {
      mark = now;
      return;
    }
    const delta = Math.max(0, now - mark);
    if (open()) ms += delta;
    else pausedMs += delta;
    mark = now;
  }

  function read() {
    return { ms, pausedMs, suspect: ms > MAX_QUESTION_MS };
  }

  // ---------- gorunur sayac icin dinleyici (bu turda abone yok) ----------

  function syncTick() {
    const wanted = active && open() && listeners.size > 0 && !destroyed;
    if (wanted && tickId === null) {
      tickId = setInterval(() => {
        flush();
        const snapshot = read();
        for (const listener of listeners) {
          try {
            listener(snapshot);
          } catch (error) {
            console.warn('Sayac dinleyicisi hata verdi:', error.message);
          }
        }
      }, TICK_MS);
    } else if (!wanted && tickId !== null) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  // ---------- bayraklar ----------

  /** Bekleyen blur toleransini blur anina geri tarihleyerek uygular. */
  function resolvePendingBlur() {
    if (blurTimeout === null) return;
    clearTimeout(blurTimeout);
    blurTimeout = null;
    flush(Math.max(mark, blurAt));
    focused = false;
  }

  function setFlag(apply) {
    // Once bekleyen blur kapatilsin: gizlenme blur ile ayni anda gelirse aradaki
    // tolerans suresi yanlislikla aktif sayilmasin.
    resolvePendingBlur();
    flush();
    apply();
    syncTick();
  }

  function onVisibility() {
    setFlag(() => { visible = document.visibilityState !== 'hidden'; });
  }

  function onPageHide() {
    setFlag(() => { pageHidden = true; });
  }

  function onPageShow() {
    setFlag(() => { pageHidden = false; });
  }

  function onFreeze() {
    setFlag(() => { frozen = true; });
  }

  function onResume() {
    setFlag(() => { frozen = false; });
  }

  function onBlur() {
    if (!focused || blurTimeout !== null) return;
    blurAt = Date.now();
    blurTimeout = setTimeout(() => {
      blurTimeout = null;
      flush(Math.max(mark, blurAt));
      focused = false;
      syncTick();
    }, BLUR_GRACE_MS);
  }

  function onFocus() {
    // Tolerans icinde donduyse hicbir sey olmamis gibi devam: sayac hic durmadi.
    if (blurTimeout !== null) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
      return;
    }
    if (focused) return;
    flush();
    focused = true;
    syncTick();
  }

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  document.addEventListener('freeze', onFreeze);
  document.addEventListener('resume', onResume);

  // ---------- dis arayuz ----------

  return {
    /** Soru ekrana geldi: sayac sifirlanir ve baslar. */
    start() {
      const now = Date.now();
      active = true;
      ms = 0;
      pausedMs = 0;
      mark = now;
      syncTick();
      return read();
    },

    /** Sik isaretlendi: sayac durur, olculen deger doner. */
    stop() {
      flush();
      active = false;
      syncTick();
      return read();
    },

    /** Durdurmadan okur; dogrulama ve gorunur sayac icin. */
    peek() {
      flush();
      return read();
    },

    /**
     * SONRAKI TUR: gorunur sayac buraya baglanir. Ilk abone gelince 1 saniyelik
     * aralik kurulur, son abone gidince kalkar; arka planda zaten calismaz.
     * Bu turda hic abone yok, dolayisiyla hic zamanlayici kurulmaz.
     */
    subscribe(fn) {
      listeners.add(fn);
      syncTick();
      return () => {
        listeners.delete(fn);
        syncTick();
      };
    },

    destroy() {
      destroyed = true;
      if (blurTimeout !== null) clearTimeout(blurTimeout);
      blurTimeout = null;
      listeners.clear();
      active = false;
      syncTick();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('freeze', onFreeze);
      document.removeEventListener('resume', onResume);
    },
  };
}

/**
 * Bir cevap kaydindan (js/quiz.js) depoya yazilacak sure kaydini uretir.
 *
 * Bos ve false alanlar yazilmaz - kayit kucuk kalsin, localStorage'da binlercesi
 * birikecek. Tek istisna counterVisible: iki donemin verisi karismasin diye
 * her kayitta acikca durur.
 */
export function makeTimingRecord(question, answer, { counterVisible = false } = {}) {
  const at = answer.at || Date.now();
  const ms = Math.max(0, Math.round(answer.elapsedMs || 0));
  const paused = Math.max(0, Math.round(answer.pausedMs || 0));
  const difficulty = Number(question.difficulty);

  const record = {
    qid: question.id,
    packId: question.packId || null,
    topic: question.topic || null,
    subtopic: question.subtopic || null,
    difficulty: Number.isFinite(difficulty) ? difficulty : null,
    ms,
    // Bos birakilan (gorunup cevaplanmayan) soruda dogru/yanlis yok.
    correct: answer.skipped ? null : Boolean(answer.correct),
    day: dayKey(new Date(at)),
    at,
    counterVisible: Boolean(counterVisible),
  };

  if (question.block) record.blockId = question.block.id;
  if (paused > 0) record.pausedMs = paused;
  if (ms > MAX_QUESTION_MS) record.suspect = true;

  return record;
}
