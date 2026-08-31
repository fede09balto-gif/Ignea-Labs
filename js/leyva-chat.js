/* ============================================================
   IGNEA LABS — Leyva demo: WhatsApp interaction layer

   Free text is the primary path. Starter chips are a demoted row
   above the input and disappear after the first message, the way
   WhatsApp drops quick replies once a conversation starts.

   The realism details are the product here. Nothing below is
   decoration: a reply that lands as one block reads as software,
   and a reply that arrives bubble-by-bubble behind a typing
   indicator reads as a person. Correctness is handled upstream
   (catalog grounding, null-price guard, escalation) — this file
   only decides how the answer ARRIVES.

   Offline-first is preserved exactly: LeyvaDemo.local() is still
   computed before any network call and is still the fallback for
   every failure path.
   ============================================================ */
(function () {
  'use strict';

  /* The last two are the memory beats. 'Lo mismo del mes pasado' only has
     anything to pull when the operator toggle is on 'Cliente que vuelve' —
     with a new customer it correctly answers that it has no prior order,
     which is the contrast the demo is built around. */
  var STARTERS = [
    '¿A cómo está la lámina de gypsum?',
    '¿Manejan taladro Caterpillar?',
    '¿Cuántas láminas tienen?',
    'Me arma una cotización',
    '¿Tienen cemento?',
    'Lo mismo del mes pasado',
    'Olvidá mis datos'
  ];

  var chat, input, sendBtn, statusEl, startersEl, rail, modeEl;
  var history = [], busy = false, lastSender = null, started = false;
  var clock = null;

  /* Conversation time advances realistically: it starts a few minutes ago
     and each message nudges it forward, so a long demo does not show ten
     messages all stamped 9:12. */
  function stamp() {
    clock = new Date(clock.getTime() + (35000 + Math.random() * 55000));
    var h = clock.getHours(), m = clock.getMinutes();
    var ap = h >= 12 ? 'p.m.' : 'a.m.';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }

  var TICK = {
    sent:  '<svg width="15" height="11" viewBox="0 0 16 11" fill="none"><path d="M5.6 9.4L1.8 5.6l-.9.9 4.7 4.7L15.7 1.1l-.9-.9z" fill="currentColor"/></svg>',
    both:  '<svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M11.1 0.2l-.8-.8L4.6 5.1 5.4 6zM15.7 1.1l-.9-.9L5.6 9.4 1.8 5.6l-.9.9 4.7 4.7z" fill="currentColor"/></svg>'
  };

  function scroll() { chat.scrollTop = chat.scrollHeight; }

  function bubble(text, out) {
    var first = lastSender !== (out ? 'out' : 'in');
    lastSender = out ? 'out' : 'in';
    var d = document.createElement('div');
    d.className = 'wa__b ' + (out ? 'wa__b--out' : 'wa__b--in') + (first ? ' wa__b--first' : '');
    d.appendChild(document.createTextNode(text));
    var meta = document.createElement('span');
    meta.className = 'wa__m';
    meta.appendChild(document.createTextNode(stamp()));
    if (out) {
      var tk = document.createElement('span');
      tk.className = 'wa__tick';
      tk.setAttribute('data-s', 'sent');
      tk.innerHTML = TICK.sent;
      meta.appendChild(tk);
      // sent -> delivered -> read, the cadence a real send has
      setTimeout(function () { tk.setAttribute('data-s', 'deliv'); tk.innerHTML = TICK.both; }, 400);
      setTimeout(function () { tk.setAttribute('data-s', 'read'); }, 900);
    }
    d.appendChild(meta);
    chat.appendChild(d);
    scroll();
    return d;
  }

  /* Document bubble. Only ever called with an order that LeyvaProforma
     verified line-by-line against the catalog — see that file's header for
     why an unverifiable order produces no document at all. */
  /* `profile` carries the DECLARED fields for the header. Any field may be
     null and a null field produces NO LINE — see leyva-proforma.js. The
     sequence number is taken ONCE: calling next() twice here used to burn a
     correlativo per document, so the numbers on the card and in the file name
     agreed only by arithmetic accident. */
  function docBubble(order, profile) {
    var seq = LeyvaProforma.next();
    var doc = LeyvaProforma.build(order, seq, profile);
    if (!doc) return false;                       // jsPDF absent -> no card, no error
    var blob = doc.output('blob');
    var kb = Math.max(1, Math.round(blob.size / 1024));
    var name = LeyvaProforma.correlativo(seq) + '.pdf';
    var url = URL.createObjectURL(blob);

    lastSender = null;
    var w = document.createElement('div');
    w.className = 'wa__doc wa__doc--in';
    w.innerHTML =
      '<div class="wa__doc__c">' +
        '<div class="wa__doc__i"><span>PDF</span></div>' +
        '<div class="wa__doc__t"><div class="wa__doc__n"></div>' +
        '<div class="wa__doc__s">PDF · 1 página · ' + kb + ' kB</div></div>' +
      '</div>';
    w.querySelector('.wa__doc__n').textContent = name;
    w.addEventListener('click', function () { window.open(url, '_blank'); });
    chat.appendChild(w);
    scroll();
    // Record it as an OPEN order so a second run-through has a real prior
    // proforma of its own. Stores {sku, qty} only — never the total.
    if (typeof LeyvaMemory !== 'undefined' && order.lines && order.lines[0] && order.lines[0].sku) {
      LeyvaMemory.registrarPedido(LeyvaProforma.correlativo(seq), order.lines);
    }
    return true;
  }

  function typing() {
    var d = document.createElement('div');
    d.className = 'wa__typing';
    d.innerHTML = '<i></i><i></i><i></i>';
    chat.appendChild(d);
    // Deliberately does NOT reset lastSender. Real WhatsApp groups
    // consecutive messages from one sender even though a typing indicator
    // appears between them — resetting here put a tail on every bubble.
    scroll();
    return d;
  }

  /* 400ms + 25ms/char, capped at 2s, +/- 15% so it is not metronomic.
     Identical timing on every reply is one of the strongest tells that
     there is no person on the other end. */
  function typeMs(text) {
    var base = Math.min(400 + text.length * 25, 2000);
    return Math.round(base * (0.85 + Math.random() * 0.3));
  }

  function setStatus(s) { statusEl.textContent = s; }

  /* Assemble the DECLARED fields for the document header. Every field is
     read through LeyvaMemory.declared(), which returns null for anything we
     do not actually have — and leyva-proforma.js omits the line entirely for
     a null. A blank "RUC:" line looks like a system that lost the data, which
     is worse than no line at all. */
  function memProfile(explicitName) {
    if (typeof LeyvaMemory === 'undefined') return null;
    function v(f) { var d = LeyvaMemory.declared(f); return d ? d.v : null; }
    var razon = v('razon_social'), nombre = v('nombre');
    var out = {
      nombre: (explicitName && explicitName !== razon) ? explicitName : nombre,
      razon_social: explicitName ? (explicitName === nombre ? null : explicitName) : razon,
      ruc: v('ruc'),
      direccion: v('direccion')
    };
    // A RUC only belongs on a document that carries a razón social.
    if (!out.razon_social) out.ruc = null;
    return (out.nombre || out.razon_social) ? out : null;
  }

  /* opts: {suppressDoc, order, profileName}
       suppressDoc — the reply quoted lines but is still ASKING whose name
                     goes on the document. No PDF yet, deliberately.
       order       — a pre-verified order handed over by the naming branch,
                     used instead of re-parsing the reply text. */
  function say(bubbles, done, opts) {
    opts = opts || {};
    var i = 0;
    (function next() {
      if (i >= bubbles.length) {
        // A complete, verifiable order becomes a document the way it would on
        // real WhatsApp: after the words, as a separate file message.
        var order = opts.suppressDoc ? null
                  : (opts.order || ((typeof LeyvaProforma !== 'undefined') ? LeyvaProforma.parse(bubbles.join('\n')) : null));
        if (order) {
          var prof = memProfile(opts.profileName);
          setStatus('escribiendo...');
          setTimeout(function () {
            docBubble(order, prof);
            setStatus('en línea');
            if (done) done();
          }, 900);
          return;
        }
        setStatus('en línea'); if (done) done(); return;
      }
      setStatus('escribiendo...');
      var t = typing();
      setTimeout(function () {
        t.remove();
        bubble(bubbles[i], false);
        i++;
        // A short beat between bubbles, as if the next one is being started.
        setTimeout(next, i < bubbles.length ? 260 + Math.random() * 200 : 0);
      }, typeMs(bubbles[i]));
    })();
  }

  /* A rail step that carries a money figure may ONLY be shown if that exact
     figure appears in the reply actually displayed. Enforced by construction,
     because the alternative already bit us: the rail was painted from the
     LOCAL responder's trace even when the model answered, so a model reply of
     "Total: C$2513" sat next to a rail reading "Suma C$12,220" — the local
     cotización branch's hardcoded 10 láminas + 2 puertas. A panel whose job
     is to prove the answer is grounded cannot contradict the answer.

     Steps with no figure (intent, "sin dato de existencia", escalation) stay
     regardless: those describe the lookup, not the arithmetic, and are true
     whichever responder replied. */
  function railStepIsTruthful(step, replyText) {
    var figures = step.match(/C\$\s?[\d,.]+/g);
    if (!figures) return true;
    for (var i = 0; i < figures.length; i++) {
      var norm = figures[i].replace(/\s/g, '');
      var bare = norm.replace(/[.,]/g, '');
      var flat = replyText.replace(/\s/g, '');
      if (flat.indexOf(norm) === -1 && flat.replace(/[.,]/g, '').indexOf(bare) === -1) return false;
    }
    return true;
  }

  /* A step may carry a provenance prefix, which the rail renders as its own
     visual channel — the same grounding treatment prices already get, applied
     to memory:

       MEM|  came from a DECLARED fact the customer previously said
       DER|  was DERIVED from order history and is being offered as a question
       PRE|  was asked for and answered IN THIS conversation
       (none) describes the catalog lookup, as before

     Showing an answer without showing which channel each part came from is
     asking to be believed. This panel's whole job is not to be. */
  var PROV = { MEM: 'Memoria', DER: 'Derivado', PRE: 'Preguntado' };

  function paintRail(steps, mode, ms, replyText) {
    if (!rail) return;
    rail.innerHTML = '';
    steps = steps.filter(function (s) { return railStepIsTruthful(s, replyText || ''); });
    steps.forEach(function (s) {
      var kind = null, body = s;
      var m = /^(MEM|DER|PRE)\|(.*)$/.exec(s);
      if (m) { kind = m[1]; body = m[2]; }
      var d = document.createElement('div');
      d.className = 'lv-step'
        + (/SIN PRECIO|Sin dato|Sin inventario|Escalar|Sin coincidencia|Intento|Fuera de|ADVERTENCIA/.test(body) ? ' lv-step--flag' : '')
        + (kind ? ' lv-step--' + kind.toLowerCase() : '');
      if (kind) {
        var tag = document.createElement('span');
        tag.className = 'lv-step__tag';
        tag.textContent = PROV[kind];
        d.appendChild(tag);
      }
      d.appendChild(document.createTextNode(body));
      rail.appendChild(d);
    });
    modeEl.setAttribute('data-mode', mode);
    modeEl.textContent = (mode === 'api' ? 'Modelo · ' : mode === 'det' ? 'Determinista · ' : 'Local · ') + ms + ' ms';
  }

  function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;

    if (!started) { started = true; startersEl.style.display = 'none'; }

    bubble(text, true);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';

    /* "escribiendo..." starts the moment the message is sent, not when the
       reply comes back. The model call can take up to 4s, and for all of it
       the header used to read "en línea" with nothing happening — which in
       front of a buyer reads as the message not having gone through. Real
       WhatsApp shows the indicator while the other side is thinking. */
    setStatus('escribiendo...');

    // Local answer computed FIRST, unconditionally — unchanged contract.
    var localAns = LeyvaDemo.local(text);
    var forced = document.getElementById('lvOffline') && document.getElementById('lvOffline').checked;
    var t0 = Date.now();

    function finish(bubbles, mode, opts) {
      var rails = (localAns.rail || []).slice();
      var extra = null;
      /* The open-proforma follow-up rides along on the FIRST substantive
         reply of a returning-customer conversation, once. It is a question
         ("¿La activamos?"), never a statement, and its figure is recomputed
         from the catalog rather than read from storage. */
      if (!localAns.suppressDoc) {
        extra = LeyvaDemo.openProformaNudge(bubbles.join(' '));
        if (extra) { bubbles = bubbles.concat(extra.bubbles); rails = rails.concat(extra.rail); }
      }
      paintRail(rails, mode, Date.now() - t0, bubbles.join(' '));
      say(bubbles, function () {
        busy = false;
        sendBtn.disabled = !input.value.trim();
        renderMemPanel();
      }, opts);
    }

    /* DETERMINISTIC BRANCHES NEVER REACH THE MODEL.
       Anything that writes to a stored profile, deletes one, quotes a prior
       order's exact figures, or puts a customer's legal name on a PDF runs
       here and only here. A "borré sus datos" a buyer can check, and a name
       printed on a document he keeps, are not things to route through a
       probabilistic path — and saying that out loud in the room is a selling
       point, which is why the rail labels it "Determinista" and not "Local". */
    if (localAns.localOnly) {
      localAns.bubbles.forEach(function (b) { history.push({ role: 'assistant', content: b }); });
      finish(localAns.bubbles, 'det', { suppressDoc: localAns.suppressDoc, order: localAns.order, profileName: localAns.profileName });
      return;
    }

    if (forced || !navigator.onLine) { finish(localAns.bubbles, 'local'); return; }

    LeyvaDemo.callApi(history.slice()).then(function (res) {
      if (res && res.bubbles) {
        res.bubbles.forEach(function (b) { history.push({ role: 'assistant', content: b }); });
        finish(res.bubbles, 'api');
      } else {
        localAns.bubbles.forEach(function (b) { history.push({ role: 'assistant', content: b }); });
        finish(localAns.bubbles, 'local');
      }
    });
  }

  /* ---- the operator's memory panel ---------------------------------
     LIVES IN THE RAIL, NEVER IN THE PHONE. The buyer holding the handset
     must not see a control that reveals the profile was chosen — that is
     the difference between "it remembered me" and "you set that up".

     It shows the profile exactly as the two tiers define it: DECLARED
     fields with the date the customer said them, DERIVED facts labelled as
     derived and computed on every render. Nothing is shown here that the
     assistant would not be entitled to use. */
  function syncSeg() {
    var m = LeyvaMemory.getMode();
    document.querySelectorAll('.lv-seg__b').forEach(function (b) {
      var on = b.getAttribute('data-mode') === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderMemPanel() {
    var host = document.getElementById('lvMem');
    if (!host || typeof LeyvaMemory === 'undefined') return;
    // A new customer who gives a name BECOMES a remembered one mid-conversation.
    // The toggle has to follow that, or the panel and the control disagree.
    syncSeg();
    host.innerHTML = '';

    var pr = LeyvaMemory.profile();
    if (!pr) {
      var e = document.createElement('div');
      e.className = 'lv-mem__empty';
      e.textContent = 'Sin perfil. El asistente no tiene nada que recordar de este número.';
      host.appendChild(e);
      return;
    }

    var ph = document.createElement('div');
    ph.className = 'lv-mem__ph';
    ph.textContent = pr.telefono + ' · número de ejemplo';
    host.appendChild(ph);

    LeyvaMemory.provenance().forEach(function (row) { host.appendChild(memRow('Declarado', row.text)); });
    LeyvaMemory.derivedProvenance().forEach(function (row) { host.appendChild(memRow('Derivado', row.text)); });
  }

  function memRow(tag, text) {
    var d = document.createElement('div');
    d.className = 'lv-mem__row lv-mem__row--' + (tag === 'Derivado' ? 'der' : 'mem');
    var t = document.createElement('span');
    t.className = 'lv-mem__tag';
    t.textContent = tag;
    d.appendChild(t);
    d.appendChild(document.createTextNode(text));
    return d;
  }

  function setMemMode(m) {
    LeyvaMemory.setMode(m);
    renderMemPanel();
  }

  function reset() {
    history = []; lastSender = null; started = false; busy = false;
    clock = new Date(Date.now() - 6 * 60000);
    chat.innerHTML = '';
    var day = document.createElement('div');
    day.className = 'wa__day';
    day.textContent = 'HOY';
    chat.appendChild(day);
    startersEl.style.display = '';
    if (rail) {
      rail.innerHTML = '<div class="lv-rail__idle">' + (window.IgneaI18n ? IgneaI18n.t('leyva.rail.idle') : '') + '</div>';
      modeEl.textContent = ''; modeEl.removeAttribute('data-mode');
    }
    input.value = ''; sendBtn.disabled = true;
    setStatus('en línea');
    // Clear the half-finished proforma naming question and the once-per-
    // conversation open-proforma nudge. Neither may survive a restart: a
    // stale pending name would land on the NEXT document.
    if (LeyvaDemo.resetState) LeyvaDemo.resetState();
    // Proforma numbering continues after whatever the profile already holds,
    // so a seeded PRO-2481 is never issued twice with different contents.
    if (typeof LeyvaMemory !== 'undefined' && LeyvaProforma.reseed) {
      LeyvaProforma.reseed(LeyvaMemory.pedidos());
    }
    renderMemPanel();
  }

  /* ---- kiosk ----------------------------------------------------------
     What each platform actually gives us, measured rather than assumed:
       Android Chrome  : Fullscreen API works -> genuinely zero browser UI.
       iPhone Safari   : NO Fullscreen API at all. CSS kiosk removes our own
                         chrome but Safari's bars remain. The only chromeless
                         iPhone route is Add to Home Screen (the apple-* meta
                         tags in the head), which launches standalone.
       Installed PWA   : already chromeless; the Fullscreen call is a no-op
                         and is skipped.
     Exit is a triple-tap in the top-left corner — invisible to the buyer,
     and no on-screen control to hit by accident while presenting. */
  function kioskOn() {
    document.body.classList.add('kiosk');
    var el = document.documentElement;
    if (el.requestFullscreen) { el.requestFullscreen().catch(function () {}); }
    else if (el.webkitRequestFullscreen) { try { el.webkitRequestFullscreen(); } catch (e) {} }
    try { sessionStorage.setItem('ignea_leyva_kiosk', '1'); } catch (e) {}
  }
  function kioskOff() {
    document.body.classList.remove('kiosk');
    if (document.fullscreenElement && document.exitFullscreen) { document.exitFullscreen().catch(function () {}); }
    else if (document.webkitFullscreenElement && document.webkitExitFullscreen) { try { document.webkitExitFullscreen(); } catch (e) {} }
    try { sessionStorage.removeItem('ignea_leyva_kiosk'); } catch (e) {}
  }

  function wireKioskExit() {
    var zone = document.getElementById('kioskExit');
    var taps = 0, timer = null;
    function hit() {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 700);
      if (taps >= 3) { taps = 0; kioskOff(); }
    }
    zone.addEventListener('click', hit);
    zone.addEventListener('touchstart', function (e) { e.preventDefault(); hit(); }, { passive: false });
  }

  /* The fake status bar shows the REAL current time and re-syncs on the
     minute. A frozen 9:41 next to the phone's own clock is the single
     cheapest tell in the whole mockup. */
  function startDeviceClock() {
    var el = document.getElementById('devTime');
    if (!el) return;
    function tick() {
      var d = new Date(), h = d.getHours(), m = d.getMinutes();
      h = h % 12; if (h === 0) h = 12;
      el.textContent = h + ':' + (m < 10 ? '0' : '') + m;
    }
    tick();
    setInterval(tick, 20000);
  }

  function boot() {
    startDeviceClock();
    chat = document.getElementById('waChat');
    input = document.getElementById('waIn');
    sendBtn = document.getElementById('waSend');
    statusEl = document.getElementById('waStatus');
    startersEl = document.getElementById('waStarters');
    rail = document.getElementById('lvRail');
    modeEl = document.getElementById('lvMode');

    STARTERS.forEach(function (q) {
      var b = document.createElement('button');
      b.className = 'wa__chip';
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', function () { send(q); });
      startersEl.appendChild(b);
    });

    input.addEventListener('input', function () {
      sendBtn.disabled = !input.value.trim() || busy;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 78) + 'px';
    });
    input.addEventListener('keydown', function (e) {
      // Enter sends, Shift+Enter newlines — the WhatsApp Web convention.
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });
    sendBtn.addEventListener('click', function () { send(input.value); });

    var off = document.getElementById('lvOffline');
    if (off) off.addEventListener('change', function () {
      document.getElementById('lvOfflineWrap').classList.toggle('on', off.checked);
    });
    LeyvaMemory.init();
    document.querySelectorAll('.lv-seg__b').forEach(function (b) {
      b.addEventListener('click', function () { setMemMode(b.getAttribute('data-mode')); reset(); });
    });
    setMemMode(LeyvaMemory.getMode());

    document.getElementById('lvReset').addEventListener('click', reset);
    document.getElementById('lvKiosk').addEventListener('click', kioskOn);
    wireKioskExit();

    reset();
    try { if (sessionStorage.getItem('ignea_leyva_kiosk') === '1') document.body.classList.add('kiosk'); } catch (e) {}
  }

  /* ---- gate ---------------------------------------------------------
     Lives in js/leyva-gate.js now, shared with leyva-script.html. It used to
     be duplicated here and there, and the iPhone submit bug was in BOTH
     copies — one <form>, one implementation, one place to fix it. */
  document.addEventListener('DOMContentLoaded', function () {
    LeyvaGate.init({ onOk: boot });
  });

})();
