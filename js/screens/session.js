// Soru ekrani. Dort modun da kullandigi tek ekran; farki mod yapilandirmasi belirler.

import { el, clear, richText, fmtTime, fmtDay, emptyState, formulaCard, sharedStem, CHOICE_LETTERS }
  from '../ui.js';
import { parseFigure } from '../svg.js';
import { createSession, MODES } from '../quiz.js';
import {
  buildDaily,
  buildWrongQueue,
  buildTest,
  buildTopicSet,
  buildSubtopicSet,
  difficultyOf,
  isRepeat,
} from '../scheduler.js';
import { loadAllQuestions } from '../packs.js';
import { loadAllCards, getCardFor } from '../formulas.js';
import { createScratchpad } from '../scratchpad.js';
import { getSettings, getSavedSession, saveSession, clearSession } from '../store.js';

/**
 * Ogrenme havuzu bos ama konuda soru varsa: hepsi tekrar sirasina girmis demektir.
 * Yanlisi olan sorular da (artik) ayni gun geri gelmedigi icin burada ayrica sayilir -
 * yoksa "hepsini dogru cozdun" demek yanlis olurdu. Yanlislarini beklemeden calismak
 * isteyene ve filtresiz tur isteyene birer cikis birakilir.
 */
function masteredState(label, nextDue, allHash, pending = 0, wrongHash = null) {
  const when = fmtDay(nextDue);

  if (pending > 0 && wrongHash) {
    return {
      empty: emptyState(
        '🕒',
        `${label}: bugünlük bitti`,
        `Yanlış yaptığın ${pending} soru dahil hepsi tekrar sırasına girdi.`
        + (when ? ` İlk tekrar ${when}.` : '')
        + ' Beklemek istemiyorsan yanlışlarını şimdi çalışabilirsin.'
      ),
      allHash,
      wrongHash,
    };
  }

  return {
    empty: emptyState(
      '✅',
      `${label} tamamlandı`,
      when
        ? `Buradaki soruların hepsini doğru çözdün. Tekrar zamanı ${when} geldiğinde kendiliğinden geri gelecekler.`
        : 'Buradaki soruların hepsini doğru çözdün.'
    ),
    allHash,
  };
}

/**
 * Oturumun konu kapsami. Sonuc ekrani "yanlislarimi tekrar et" dugmesini buna gore
 * kurar, boylece paket bitince ayni konuda kalinir. Gunluk rutin ve mini test tek
 * konuya bagli olmadigi icin null kalir - onlarda dugme tum yanlislara gider.
 * Yanlislar modu kendi kapsamini tasir: kapsamli listenin sonucundan tekrar
 * basildiginda yine ayni konuda kalinir.
 */
function scopeFor(mode, params) {
  if (mode === 'konu' && params[0]) return { kind: 'konu', value: params[0] };
  if (mode === 'altkonu' && params[0]) return { kind: 'altkonu', value: params[0] };
  if (mode === 'yanlis') return wrongScopeFrom(params);
  return null;
}

/**
 * "#/oturum/yanlis/konu/<konu adi>" ya da ".../altkonu/<subtopicId>" rotasindan kapsam.
 * Parcasiz "#/oturum/yanlis" - ana ekrandaki giris ve eski baglantilar - null doner:
 * tum konularin yanlislari.
 */
function wrongScopeFrom(params) {
  const kind = params[0];
  const value = params[1] || '';
  if (!value) return null;
  if (kind === 'konu' || kind === 'altkonu') return { kind, value };
  return null;
}

/** Kapsamin yanlislar rotasi; kapsam yoksa genel giris. Sonuc ekrani da bunu kullanir. */
export function wrongHashFor(scope) {
  if (!scope) return '#/oturum/yanlis';
  return `#/oturum/yanlis/${scope.kind}/${encodeURIComponent(scope.value)}`;
}

/** Rota parametresinden soru listesini ve baslik bilgisini uretir. */
async function buildFor(mode, params, includeAll, scope) {
  switch (mode) {
    case 'gunluk': {
      const { questions } = await buildDaily();
      return {
        questions,
        title: 'Günlük rutin',
        empty: emptyState('📭', 'Soru bulunamadı', 'Henüz yüklü bir soru paketi yok.'),
      };
    }
    case 'yanlis': {
      const { questions, label } = await buildWrongQueue(
        scope && scope.kind === 'altkonu' ? { subtopicId: scope.value }
          : scope ? { topic: scope.value }
          : {}
      );

      if (scope) {
        return {
          questions,
          title: `Yanlışlarım · ${label || scope.value}`,
          empty: emptyState(
            '🎉',
            'Bu başlıkta tekrar edilecek yanlış yok',
            'Buradaki yanlışların bitti. Bir soru üst üste 2 kez doğru cevaplanınca listeden düşer;'
            + ' başka konulardaki yanlışların ana ekrandaki "Sadece yanlışlarım" girişinde bekler.'
          ),
        };
      }

      return {
        questions,
        title: 'Yanlışlarım',
        empty: emptyState(
          '🎉',
          'Tekrar edilecek yanlış yok',
          'Yanlış yaptığın sorular burada birikir. Bir soru üst üste 2 kez doğru cevaplanınca listeden düşer.'
        ),
      };
    }
    case 'test': {
      const questions = await buildTest(10);
      return {
        questions,
        title: 'Mini test',
        empty: emptyState('📭', 'Soru bulunamadı', 'Test için yeterli soru yok.'),
      };
    }
    case 'altkonu': {
      const subtopicId = params[0] || '';
      const { questions, total, nextDue, pending, label } =
        await buildSubtopicSet(subtopicId, { includeAll });
      const title = label || 'Alt konu';
      if (total > 0 && questions.length === 0) {
        return {
          questions,
          title,
          ...masteredState(
            title,
            nextDue,
            `#/oturum/altkonu/${encodeURIComponent(subtopicId)}/tumu`,
            pending,
            wrongHashFor(scope)
          ),
        };
      }
      return {
        questions,
        title,
        empty: emptyState('📭', 'Bu alt konuda soru yok', 'Alt konu paketi henüz boş olabilir.'),
      };
    }
    case 'konu':
    default: {
      const topic = params[0] || '';
      const { questions, total, nextDue, pending } = await buildTopicSet(topic, { includeAll });
      const title = topic || 'Serbest çözme';
      if (total > 0 && questions.length === 0) {
        return {
          questions,
          title,
          ...masteredState(
            title,
            nextDue,
            `#/oturum/konu/${encodeURIComponent(topic)}/tumu`,
            pending,
            wrongHashFor(scope)
          ),
        };
      }
      return {
        questions,
        title,
        empty: emptyState('📭', 'Bu konuda soru yok', `"${topic}" konusuna ait soru bulunamadı.`),
      };
    }
  }
}

/**
 * Yarim kalan oturumun saklama anahtari. Gunluk rutin (state.daily ile takip edilir),
 * yanlislar (havuzu her seferinde yeniden hesaplanir) ve sureli test kaydedilmez.
 * "Yine de bastan coz" turu da gecicidir, normal ilerlemeyi golgelemez.
 */
function resumeKeyFor(mode, params, includeAll) {
  if (includeAll) return null;
  if (mode === 'altkonu') return `altkonu:${params[0] || ''}`;
  if (mode === 'konu') return `konu:${params[0] || ''}`;
  return null;
}

/**
 * Kaydedilmis oturumu tekrar sorulara baglar. Paket guncellenip kaybolan sorular
 * hem listeden hem cevaplardan duser, kalinan yer buna gore kayar.
 * Devam edilecek bir sey kalmadiysa null doner ve taze havuz kurulur.
 */
async function restoreSession(key) {
  const saved = getSavedSession(key);
  if (!saved) return null;

  const byId = new Map((await loadAllQuestions()).map((q) => [q.id, q]));
  const questions = [];
  const answers = [];

  for (let i = 0; i < saved.ids.length; i++) {
    const question = byId.get(saved.ids[i]);
    if (!question) continue; // paketten kalkmis soru
    questions.push(question);
    answers.push(saved.answers[i] || null);
  }

  // Kalinan yer kayittaki sayacla degil, cevaplanmamis ilk soruyla belirlenir.
  // Boylece dizide bir bosluk kalmissa o soru atlanmaz - atlansa oturumun sonunda
  // "bos" gorunur ve hic denenmemis sayilirdi. Cevaplanip "Sonraki"ye basilmadan
  // cikilan durum da bundan dolayi kendiliginden bir sonraki soruyla acilir.
  const index = answers.findIndex((answer) => answer === null);

  // Devam edilecek soru kalmadiysa oturum fiilen bitmistir; taze havuz kurulsun.
  if (index === -1) return null;

  return { questions, answers, index };
}

export async function render(ctx) {
  const mode = MODES[ctx.params[0]] ? ctx.params[0] : 'konu';
  const rest = ctx.params.slice(1);
  const settings = getSettings();

  // "#/oturum/altkonu/<id>/tumu": pekismis sorular dahil filtresiz tur.
  // Yanlislar modunda ikinci parca kapsam degeridir, "tumu" turu oraya islemez.
  const includeAll = (mode === 'konu' || mode === 'altkonu') && rest[1] === 'tumu';
  const scope = scopeFor(mode, rest);
  const resumeKey = resumeKeyFor(mode, rest, includeAll);
  const resumed = resumeKey ? await restoreSession(resumeKey) : null;

  const built = resumed
    ? {
        questions: resumed.questions,
        title: mode === 'altkonu'
          ? (resumed.questions[0].subtopic || 'Alt konu')
          : (rest[0] || 'Serbest çözme'),
        empty: null,
      }
    : await buildFor(mode, rest, includeAll, scope);
  const { questions, title, empty, allHash = null, wrongHash = null } = built;
  ctx.setTitle(title);

  // Formul kartlari pesin yuklenir; boylece yanlis cevaptan sonra kart senkron eklenebilir.
  // Dosyalar eksik ya da bozuksa oturum yine acilir, sadece kart gosterilmez.
  await loadAllCards().catch((error) => {
    console.warn('Formül kartları yüklenemedi:', error.message);
  });

  if (questions.length === 0) {
    return el('div', { class: 'stack' },
      empty,
      wrongHash
        ? el('button', { class: 'btn primary', on: { click: () => ctx.navigate(wrongHash) } },
            'Yanlışlarımı şimdi çalış')
        : null,
      allHash
        ? el('button', {
            class: wrongHash ? 'btn' : 'btn primary',
            on: { click: () => ctx.navigate(allHash) },
          }, 'Yine de baştan çöz')
        : null,
      el('button', {
        class: allHash || wrongHash ? 'btn' : 'btn primary',
        on: { click: () => ctx.goHome() },
      }, 'Ana ekrana dön')
    );
  }

  const session = createSession({
    mode,
    questions,
    title,
    scope,
    totalSeconds: settings.testMinutes * 60,
  });

  if (resumed) {
    session.index = resumed.index;
    session.answers = resumed.answers;
  }

  /** Kalinan yeri diske yazar. Kaydedilmeyen modlarda sessizce gecer. */
  function persist() {
    if (!resumeKey || session.finished) return;
    // Hic cevap verilmediyse devam edilecek bir sey yok; eski kayit varsa da temizlensin,
    // yoksa dokunulmamis bir liste yeni vadesi gelen sorulari sonsuza kadar disarida tutar.
    if (session.answers.every((answer) => answer === null)) clearSession(resumeKey);
    else saveSession(resumeKey, session.snapshot());
  }

  // ---------- sure ----------

  let timerId = null;

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    if (!session.config.timed) return;
    const endsAt = session.startedAt + session.totalSeconds * 1000;

    const tick = () => {
      const left = Math.max(0, (endsAt - Date.now()) / 1000);
      ctx.setRight(fmtTime(left), left <= 60);
      // finishSession, isaretli ama onaylanmamis sikki de kaydeder.
      if (left <= 0) finishSession({ timedOut: true });
    };

    tick();
    timerId = setInterval(tick, 1000);
  }

  ctx.onLeave(stopTimer);
  // Ekrandan cikarken (ust bar geri, donanim geri, baska bir rota) kalinan yer saklanir.
  ctx.onLeave(persist);

  // ---------- ekran ----------

  const root = el('div', { class: 'stack' });
  const progressFill = el('i', { style: 'width:0%' });
  const progressBar = el('div', { class: 'progressbar' }, progressFill);
  const counter = el('div', { class: 'small muted' });
  const body = el('div', { class: 'stack' });

  // Devam ettirilen oturumda listeyi bosaltip bastan kurmak icin kucuk bir cikis.
  const restartLink = resumed
    ? el('button', {
        class: 'linklike',
        type: 'button',
        on: {
          click: () => {
            clearSession(resumeKey);
            session.finished = true; // onLeave tekrar kaydetmesin
            ctx.navigate(location.hash); // ayni hash: gecmise dokunmadan yeniden kurar
          },
        },
      }, 'baştan başla')
    : null;

  root.append(
    el('div', { class: 'session-head' }, counter, restartLink),
    progressBar,
    body
  );

  // Karalama alani. Tek ornek: acik/kapali durumu oturum boyunca korunur,
  // showQuestion her soruda sadece icini temizler.
  const scratch = createScratchpad({ open: false });
  ctx.onLeave(scratch.destroy);

  /** Test modunda secim, "Sonraki"ye basilana kadar degistirilebilir. */
  let pendingPick = null;
  let shownAt = 0;
  let hintMs = null;

  /**
   * Zor bloga gecis bildirimi: sadece gercek bir gecis olunca.
   * Ogrenme listesi iki bolumden olusur - once vadesi gelen tekrarlar, sonra geri
   * kalanlar - ve her ikisi de kendi icinde kolaydan zora dizilir. Bu yuzden bildirim
   * oturumda iki kez cikabilir: her bolumun kendi zor kismina girerken bir kez.
   * Devam ettirilen oturumda onceki sorunun zorlugundan baslar, yoksa null kalir;
   * boylece ilk soru zor geldiginde (vadesi gelen bir tekrar olabilir) bildirim cikmaz.
   * Geri kalan bolum blok birimli dizilir; bildirim blok ortasinda cikmaz, gerekcesi
   * showQuestion icindeki kontrolde.
   */
  let lastBlock = resumed && session.index > 0 ? difficultyOf(questions[session.index - 1]) : null;
  const hardNoticeShown = { due: false, rest: false };

  /**
   * En son cizilen ortak kok blogunun kimligi. lastBlock (zorluk blogu) ile ilgisi yok.
   * Ayni blok arka arkaya gelirse kok ikinci kez katlanmis gelir: kutu yerinde durur,
   * basligi gorunur, ama 8-15 satirlik metin tekrar okunmaya zorlamaz. Devam ettirilen
   * oturumda da null baslar - oturumun ilk sorusunda kok daima acik.
   */
  let lastBlockId = null;

  /**
   * Bildirim yalnizca listesi gercekten kolaydan zora dizilen modlarda anlamli.
   * Gunluk rutin (vadesi gelenler dueOrder'la gelir) ve Yanlislarim (lastSeen sirasi)
   * boyle dizilmiyor; oralarda 2 -> 3 gecisi tesadufi olurdu. Sureli test zaten disarida.
   */
  const blockNoticeAllowed = mode === 'konu' || mode === 'altkonu';

  /** Kapatilabilir tek satirlik bilgi; akisi kesmez, sadece basa eklenir. */
  function hardBlockNotice(segment) {
    const box = el('div', { class: 'block-notice' },
      el('div', null,
        el('strong', null,
          segment === 'due' ? 'Tekrarların zor kısmına geldin.' : 'Zor sorulara geçtin.'),
        ' Buradan sonrası daha çok adım istiyor; takılmak normal — "Soru ne istiyor?"a bakmaktan çekinme.'
      ),
      el('button', {
        class: 'block-notice-close',
        type: 'button',
        'aria-label': 'Bildirimi kapat',
        on: { click: () => box.remove() },
      }, '×')
    );
    return box;
  }

  function finishSession({ timedOut = false } = {}) {
    stopTimer();
    // Testte sik isaretlenmis ama "Sonraki"ye basilmadan sure dolduysa o cevap da sayilir.
    if (pendingPick !== null && !session.isAnswered()) {
      session.submit(pendingPick, { hintMs, elapsedMs: Date.now() - shownAt });
    }
    session.finish({ timedOut });
    if (resumeKey) clearSession(resumeKey);
    // Biten oturum gecmiste kalmasin: sonuc ekranindan geri, oturuma degil listeye insin.
    ctx.navigate('#/sonuc', { replace: true });
  }

  function showQuestion() {
    const question = session.current();
    const number = session.index + 1;

    pendingPick = null;
    hintMs = null;
    shownAt = Date.now();

    counter.textContent = `Soru ${number} / ${session.questions.length}`;
    progressFill.style.width = `${((number - 1) / session.questions.length) * 100}%`;

    // Karalama tam ekranda kalmis olabilir; clear(body) node'u sokecegi icin once kapat.
    scratch.setFullscreen(false);
    clear(body);

    // Zor bloga yeni girildiyse bolum basina bir kez hatirlatma.
    // Bolumu soruya canli bakarak buluruz: gezinme tek yonlu oldugu icin burada her
    // zaman cevaplanmamis soru cizilir, vadesi de ancak cevaplandiktan sonra ileri
    // atilir - devam ettirilen oturumda da dogru bolumu verir.
    //
    // Ortak koklu blogun ORTASINDA bildirim cikmaz. Siralayici blogu tek birim olarak
    // zor kovasina koyar ve blogun zorlugu icindeki en yuksek zorluktur, yani zor bir
    // blok kolay bir soruyla baslayabilir; kontrol soru soru yapildigi icin bildirim
    // blogun 2. ya da 3. sorusunda patlardi. Sinirda kacirirsak bir sonraki birime
    // kayar - bildirim yumusak bir hatirlatma, kacirilmasi bir sey bozmaz.
    // lastBlockId asagida, bu kontrolden SONRA guncellenir: burada hala onceki
    // sorunun blogunu tutar.
    const block = difficultyOf(question);
    const segment = isRepeat(question) ? 'due' : 'rest';
    const midBlock = Boolean(question.block) && question.block.id === lastBlockId;
    if (blockNoticeAllowed && !midBlock && block === 3 && lastBlock !== null && lastBlock < 3
      && !hardNoticeShown[segment]) {
      hardNoticeShown[segment] = true;
      body.append(hardBlockNotice(segment));
    }
    lastBlock = block;

    // konu / alt konu satiri
    body.append(
      el('div', { class: 'qmeta' },
        el('span', { class: 'chip' }, question.topic || 'Soru'),
        question.subtopic ? el('span', null, question.subtopic) : null,
        // label, alt konu paketi icindeki sorunun kendi basligi (varsa).
        question.label && question.label !== question.subtopic
          ? el('span', { class: 'muted' }, question.label)
          : null
      )
    );

    // ortak kok: sorunun kendi sekli ve metninden once
    if (question.block) {
      body.append(sharedStem(question.block, { open: question.block.id !== lastBlockId }));
    }
    lastBlockId = question.block ? question.block.id : null;

    // sekil
    const figure = parseFigure(question.figure, question.subtopic || 'Soru şekli');
    if (figure) body.append(el('div', { class: 'figure' }, figure));

    // soru metni
    body.append(el('div', { class: 'stem', html: richText(question.stem) }));

    // karalama alani: clear(body) node'u sadece DOM'dan soker, nesne yasar.
    scratch.reset();
    body.append(scratch.node);

    // ---------- "soru ne istiyor?" kapisi ----------

    const asksSlot = el('div');
    body.append(asksSlot);

    const choicesWrap = el('div', { class: 'choices' });
    const choiceButtons = [];

    function unlockChoices() {
      choicesWrap.classList.remove('locked');
      for (const button of choiceButtons) button.disabled = false;
    }

    function revealAsks() {
      if (hintMs === null) hintMs = Date.now() - shownAt;
      clear(asksSlot);
      asksSlot.append(
        el('div', { class: 'asks-box' },
          el('div', { class: 'label' }, 'Soru ne istiyor?'),
          el('div', { html: richText(question.asks) })
        )
      );
      unlockChoices();
    }

    asksSlot.append(
      el('button', { class: 'asks-btn', type: 'button', on: { click: revealAsks } },
        'Soru ne istiyor?')
    );

    // ---------- siklar ----------

    const feedback = el('div', { class: 'stack' });

    function lockAllChoices() {
      for (const button of choiceButtons) button.disabled = true;
    }

    function paintResult(record) {
      for (let i = 0; i < choiceButtons.length; i++) {
        const button = choiceButtons[i];
        button.classList.remove('pending');
        if (i === question.answer) button.classList.add('correct');
        else if (i === record.picked) button.classList.add('wrong');
      }
    }

    function commit(pickedIndex) {
      const record = session.submit(pickedIndex, {
        hintMs,
        elapsedMs: Date.now() - shownAt,
      });
      if (!record) return;
      persist();
      lockAllChoices();

      if (session.config.showSolution) {
        paintResult(record);
        showFeedback(record);
      } else {
        advance();
      }
    }

    function onPick(pickedIndex) {
      if (session.config.timed) {
        // Testte secim gecicidir; "Sonraki"ye basilinca kesinlesir.
        pendingPick = pickedIndex;
        for (let i = 0; i < choiceButtons.length; i++) {
          choiceButtons[i].classList.toggle('pending', i === pickedIndex);
        }
        nextButton.disabled = false;
      } else {
        commit(pickedIndex);
      }
    }

    for (let i = 0; i < question.choices.length; i++) {
      const button = el('button', {
        class: 'choice',
        type: 'button',
        disabled: true,
        on: { click: () => onPick(i) },
      },
        el('span', { class: 'letter' }, CHOICE_LETTERS[i] || String(i + 1)),
        el('span', { class: 'text' }, String(question.choices[i]))
      );
      choiceButtons.push(button);
      choicesWrap.append(button);
    }

    choicesWrap.classList.add('locked');
    if (settings.instantChoices) unlockChoices();

    body.append(choicesWrap, feedback);

    // ---------- alt buton ----------

    const isLast = !session.hasNext();

    function advance() {
      if (isLast) finishSession();
      else {
        session.next();
        persist();
        showQuestion();
        window.scrollTo(0, 0);
      }
    }

    const nextButton = el('button', {
      class: 'btn primary',
      type: 'button',
      on: {
        click: () => {
          if (session.config.timed) {
            if (pendingPick === null) return;
            commit(pendingPick);
          } else {
            advance();
          }
        },
      },
    }, isLast ? (session.config.timed ? 'Testi bitir' : 'Sonucu gör') : 'Sonraki soru');

    function showFeedback(record) {
      clear(feedback);

      // Yanlisin arkasindaki kurali hatirlatmak icin cozumun altina ilgili formul karti.
      // Kart yoksa (o alt konu icin yazilmamissa) hicbir sey eklenmez.
      const card = record.correct
        ? null
        : formulaCard(getCardFor(question), {
          label: 'Bu konunun formülleri',
          collapseFigures: true, // soru akisinda kart uzamasin; sekil istege bagli acilir
        });

      feedback.append(
        el('div', { class: `verdict ${record.correct ? 'ok' : 'bad'}` },
          record.correct
            ? '✓ Doğru'
            : `✗ Yanlış — doğru cevap ${CHOICE_LETTERS[question.answer]}`),
        el('div', { class: 'solution' },
          el('div', { class: 'label' }, 'Çözüm'),
          el('div', { class: 'solution-body', html: richText(question.solution || '—') })
        )
      );
      if (card) feedback.append(card);
      feedback.append(nextButton);

      nextButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    if (session.config.timed) {
      // Testte buton hep gorunur ama secim yapilana kadar pasif.
      nextButton.disabled = true;
      feedback.append(nextButton);
    }
  }

  showQuestion();
  startTimer();

  return root;
}
