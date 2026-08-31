/* ============================================================
   IGNEA LABS — Leyva demo: the access gate

   ONE implementation, used by BOTH leyva.html and leyva-script.html.
   It was duplicated (markup, CSS and JS) and the mobile bug below
   existed in both copies — fixing one and missing the other was a
   live risk, so there is now only one.

   WHAT WAS BROKEN, on an iPhone, in front of a buyer:
   a lone <input> with a keydown listener and NO submit button. On iOS
   Safari a bare input outside a <form> gets a "return" key that
   frequently just dismisses the keyboard without dispatching a usable
   Enter — so there was no way to submit at all. The page looked dead.

   THE FIX IS THE <form>, not the keydown handler. A real form with a
   real submit button makes iOS label the key "Go" and submit for real,
   and gives a visible, tappable button for everyone else. The keydown
   path is gone: submit covers both.

   WHY THE BUTTON SITS DIRECTLY UNDER THE INPUT:
   `interactive-widget=resizes-content` is set on both pages and does
   nothing on iOS Safari, which does not implement it (see the note in
   diagnostic.html). The layout viewport does not shrink when the
   keyboard opens, so anything vertically centred with vh units can end
   up underneath it. The gate is therefore TOP-ANCHORED and compact, and
   the submit button is the next element after the field, so Safari's
   own scroll-into-view brings both into the visible strip together.
   ============================================================ */

var LeyvaGate = (function () {
  'use strict';

  /* Spanish literals are the fallback, not the exception: leyva-script.html
     is deliberately ES-only and does not load i18n.js at all. */
  function t(key, fallback) {
    if (window.IgneaI18n && IgneaI18n.t) {
      var v = IgneaI18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  var MSG = {
    empty:  ['leyva.gate.err.empty',  'Escriba la clave.'],
    bad:    ['leyva.gate.err.bad',    'Clave incorrecta. Revise que no le haya quedado un espacio de más ni una mayúscula al inicio.'],
    origin: ['leyva.gate.err.origin', 'Este enlace no está autorizado. Avísele a Fede — reescribir la clave no lo va a resolver.'],
    net:    ['leyva.gate.err.net',    'No se pudo conectar. Revise la señal e intente otra vez.']
  };

  var form, input, btn, msg, reveal, onOk, busy = false;

  function say(kind) {
    if (!msg) return;
    msg.textContent = kind ? t(MSG[kind][0], MSG[kind][1]) : '';
    msg.className = 'lv-gate__msg' + (kind ? ' on' : '');
  }

  function setBusy(b) {
    busy = b;
    if (!btn) return;
    btn.disabled = b;
    btn.textContent = b ? t('leyva.gate.btn.busy', 'Entrando…')
                        : t('leyva.gate.btn', 'Entrar');
  }

  /* A wrong key must never look like a broken page. Clear the field, keep
     focus so the keyboard stays up, and say plainly what happened — naming
     the two mistakes a phone actually makes (a trailing space from paste,
     a capitalised first character). */
  function fail(kind) {
    setBusy(false);
    say(kind);
    if (input) {
      input.value = '';
      input.focus();
      try { input.setSelectionRange(0, 0); } catch (e) {}
    }
  }

  function verify(token, silent) {
    if (busy) return;
    token = (token || '').trim();     // a pasted key drags a space on a phone
    if (!token) { if (!silent) fail('empty'); return; }
    setBusy(true);
    if (!silent) say(null);

    fetch('/api/ops-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token })
    }).then(function (r) {
      if (r.ok) {
        sessionStorage.setItem('ignea_ops_token', token);
        form.style.display = 'none';
        document.getElementById('lvApp').style.display = '';
        setBusy(false);
        if (onOk) onOk();
        return;
      }
      sessionStorage.removeItem('ignea_ops_token');
      // 401 and 403 are completely different failures. 403 means the origin
      // allowlist rejected this hostname — the key is fine and retyping it
      // will never help. Telling him to stop retyping is the whole point.
      if (silent) { setBusy(false); if (input) input.focus(); return; }
      fail(r.status === 403 ? 'origin' : 'bad');
    }).catch(function () {
      setBusy(false);
      if (!silent) say('net');
      if (input) input.focus();
    });
  }

  function init(opts) {
    onOk = (opts && opts.onOk) || null;
    form   = document.getElementById('lvGate');
    input  = document.getElementById('lvToken');
    btn    = document.getElementById('lvGateBtn');
    msg    = document.getElementById('lvGateMsg');
    reveal = document.getElementById('lvGateShow');
    if (!form || !input) return;

    // The <form> submit is the ONLY submission path. It covers the visible
    // button, the iOS "Go" key, and a hardware Enter, with one handler.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      verify(input.value, false);
    });

    // Typing again clears a stale error rather than leaving "clave
    // incorrecta" sitting under a field he is mid-way through correcting.
    input.addEventListener('input', function () { if (msg && msg.textContent) say(null); });

    /* Reveal toggle. On a phone, "did I mistype it?" is unanswerable behind
       dots, and that question is exactly what left him stuck. Defaults to
       hidden — this gets typed at a counter with people watching. */
    if (reveal) {
      reveal.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        reveal.textContent = show ? t('leyva.gate.hide', 'Ocultar') : t('leyva.gate.show', 'Ver');
        reveal.setAttribute('aria-pressed', show ? 'true' : 'false');
        input.focus();
      });
    }

    /* iOS Safari keyboard mitigation. visualViewport IS implemented there
       even though interactive-widget is not, so it is what actually tells us
       the keyboard is up. On a short visible strip the gate loses its top
       padding so the field and the button stay in view. */
    if (window.visualViewport) {
      var vv = window.visualViewport;
      var sync = function () {
        document.body.classList.toggle('kb-open', vv.height < window.innerHeight - 120);
      };
      vv.addEventListener('resize', sync);
      sync();
    }

    var saved = null;
    try { saved = sessionStorage.getItem('ignea_ops_token'); } catch (e) {}
    if (saved) { verify(saved, true); return; }

    // Autofocus only where a keyboard popping up is not disorienting. On a
    // phone the field is one tap away and the button is visible either way.
    if (!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) input.focus();
    setBusy(false);
  }

  return { init: init, verify: verify };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaGate; }
