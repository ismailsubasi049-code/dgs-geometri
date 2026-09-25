// Geri hareketinin tek sahibi. Uygulamada popstate'i yalnizca bu modul dinler.
//
// Katman: ekrani ortup geri tusuyla kapanmasi gereken panel (bugun: karalama tam ekrani).
// Acilirken gecmise ayni URL'li bir kayit eklenir; kayit onceki state'i tasir (dgsDepth,
// dgsExamGuard) ve ustune dgsLayer = katman duzeyi (1, 2, ...) yazar. Hash degismedigi
// icin router (hashchange) tetiklenmez.
//
// Koruma: ekranin geri hareketine karar veren tek islev (bugun: deneme cikis onayi).
//
// Kural, popstate'te varilan kaydin duzeyine (L) gore:
//   - L < acik katman sayisi: geri hareketi ustteki katman(lar)i kapatir, korumaya gitmez.
//   - L = acik katman sayisi: korumaya iletilir (varsa).
//   - L > acik katman sayisi: ileri tusuyla bayat bir katman kaydina gelindi; yok sayilir.
// Katmanin kendi kapatma dugmesi (Kucult) katmani once yigindan cikarir, sonra kendi
// kaydini tuketir; varilan duzey yigina esit oldugu icin olay korumaya iletilir, koruma da
// kendi kaydinin hala tepede oldugunu gorup onay sormaz (js/screens/exam.js).

/** @type {{ closeView: () => void }[]} */
const layers = [];

/** @type {((event: PopStateEvent) => void) | null} */
let guard = null;

function levelOf(state) {
  return state && typeof state.dgsLayer === 'number' ? state.dgsLayer : 0;
}

/** Yigindan cikan katmanlarin gorunumunu ustten alta kapatir. */
function closeViews(closing) {
  for (let i = closing.length - 1; i >= 0; i -= 1) {
    try { closing[i].closeView(); } catch (error) { console.error('Katman kapatilamadi:', error); }
  }
}

window.addEventListener('popstate', (event) => {
  const level = levelOf(history.state);
  if (level < layers.length) {
    closeViews(layers.splice(level));
    return;
  }
  if (level > layers.length) return;
  if (guard) guard(event);
});

/**
 * Yeni katman acar ve gecmise kaydini ekler. closeView gecmise dokunmadan yalnizca
 * gorunumu kapatmalidir; birden fazla kez cagrilabilir olmalidir.
 * Donen close(): arayuzden kapatma - katman ve ustundekiler kapanir, kayitlari tuketilir.
 * Donen forget(): gecmise dokunmadan yigindan cikar (ekrandan ayrilirken).
 */
export function openLayer(closeView) {
  const layer = { closeView };
  layers.push(layer);
  const level = layers.length;
  history.pushState({ ...(history.state || {}), dgsLayer: level }, '');

  return {
    close() {
      const index = layers.indexOf(layer);
      if (index === -1) return;
      closeViews(layers.splice(index));
      const extra = levelOf(history.state) - level + 1;
      if (extra > 0) history.go(-extra);
    },
    forget() {
      const index = layers.indexOf(layer);
      if (index !== -1) layers.splice(index, 1);
    },
  };
}

/**
 * Tum katmanlarin gorunumunu gecmise dokunmadan kapatir. Tepedeki katman kayitlarinin
 * sayisini dondurur; cagiran onlari kendi geri hareketiyle birlikte tek history.go ile
 * tuketir (art arda iki history.back() tarayicidan tarayiciya farkli sonuclanir).
 */
export function dropLayers() {
  closeViews(layers.splice(0));
  return levelOf(history.state);
}

/**
 * Katman acik degilken gelen geri hareketlerini alacak islevi kurar. Tek koruma olur;
 * donen islev yalnizca kendi kurdugu korumayi kaldirir.
 */
export function setBackGuard(fn) {
  guard = fn;
  return () => {
    if (guard === fn) guard = null;
  };
}
