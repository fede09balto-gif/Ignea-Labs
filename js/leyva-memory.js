/* ============================================================
   IGNEA LABS — Leyva demo: customer memory

   Keyed on phone number. TWO TIERS, and the distinction between
   them IS the safety model — see HANDOFF.md §0 for the full spec
   and the reasoning. Summarised here because a future edit will
   be made from this file, not from that one:

   DECLARED — nombre, razón social, RUC, dirección, forma de pago.
     Things the customer EXPLICITLY SAID. Each carries a
     declared_at. They may be stated back to him BECAUSE HE SAID
     THEM — that is the entire warrant. A razón social from eight
     months ago is CONFIRMED, never asserted.

   DERIVED — pedidos anteriores, frecuencia, proformas abiertas.
     Computed from history. OFFERED AS QUESTIONS, never asserted.
     NEVER STORED AS COLUMNS: a stored order holds {sku, qty} and
     nothing else, and every price, line total and order total is
     resolved from the catalog at read time. There is therefore no
     price column that can drift away from the order it summarises,
     and no number in localStorage that can reach a document.

   NOTHING ELSE. No inferred income, no behavioral score, no notes
   about the person. A field not in one of those two lists does not
   exist here. That boundary is what makes this safe to sell to a
   business whose customer list IS its business.

   THE GREETING RULE, because it looks like a UX nicety and is not:
   message one is NEVER "¡Buenas, don Marvin!". Phones get shared in
   a cuadrilla, and greeting the wrong person by name in front of a
   buyer is a memorable failure. The name goes where it is
   load-bearing — on the proforma question — and nowhere else.
   ============================================================ */

var LeyvaMemory = (function () {
  'use strict';

  var KEY = 'ignea_leyva_profiles';
  var MODE_KEY = 'ignea_leyva_mode';

  /* A field older than this is CONFIRMED rather than asserted. Fede's
     example is a razón social from eight months ago; 90 days is the point
     at which a contractor may plausibly have re-registered, moved, or
     changed who signs. Below it we still ask — we simply do not apologise
     for the age. */
  var STALE_DAYS = 90;

  /* The seeded returning customer. Synthetic throughout and MARKED so:
     the phone is the project's designated fake (8000-0000, see HANDOFF's
     test-data rule) and the RUC carries fake:true, which the rail renders
     explicitly. Nothing here may ever be swapped for a real customer's
     details — this profile is displayed on a screen in a stranger's shop. */
  var SEED_PHONE = '8000-0000';

  /* LOCAL date, not UTC. toISOString() rolls over to tomorrow after ~18:00 in
     Nicaragua (UTC-6), which stamped a declared_at in the future and produced
     ageDays: -1 — a field that had just been declared reading as not yet
     declared. Caught in the harness, invisible before 6pm. */
  function daysAgo(n) {
    var d = new Date(Date.now() - n * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function seedProfile() {
    return {
      telefono: SEED_PHONE,
      declared: {
        nombre:       { v: 'Marvin García',             at: daysAgo(32) },
        razon_social: { v: 'Constructora García S.A.',  at: daysAgo(247) },
        ruc:          { v: 'J0000000000000',            at: daysAgo(247), fake: true },
        forma_pago:   { v: 'crédito 15 días',           at: daysAgo(247) }
        // direccion deliberately ABSENT. A profile with every field filled
        // never exercises the null-guard, and the null-guard is the part
        // that has to be demonstrated: a missing field must produce a
        // QUESTION, not a blank line on a document.
      },
      orders: [
        {
          correlativo: 'PRO-2481',
          fecha: daysAgo(32),
          estado: 'abierta',           // unconfirmed -> the open-proforma beat fires
          lines: [
            { sku: 'GYP-12-48', qty: 14 },
            { sku: 'PTA-MET-3T-CAFE', qty: 2 }
          ]
        }
      ]
    };
  }

  /* ---- storage ------------------------------------------------------
     Wrapped because Safari private mode throws on setItem rather than
     failing quietly, and a thrown QuotaExceededError mid-demo would take
     the whole conversation down. Memory degrades to in-session only. */
  var fallbackStore = null;

  function readAll() {
    if (fallbackStore) return fallbackStore;
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function writeAll(all) {
    try { localStorage.setItem(KEY, JSON.stringify(all)); fallbackStore = null; }
    catch (e) { fallbackStore = all; }
  }

  /* ---- mode ---------------------------------------------------------
     The operator toggle. It lives in the RAIL, never in the phone — the
     buyer must never see a control that reveals the profile was chosen. */
  var mode = 'nuevo';

  function setMode(m) {
    mode = (m === 'vuelve') ? 'vuelve' : 'nuevo';
    try { sessionStorage.setItem(MODE_KEY, mode); } catch (e) {}
    var all = readAll();
    if (mode === 'vuelve') {
      /* ALWAYS reseed, never "seed if absent". This is an OPERATOR control,
         not a user session: tapping it must hand Luis a known state every
         time. Seeding only when absent meant a profile mutated by the last
         run-through (a name declared, an order issued, a razón social
         re-stamped) survived the toggle, so the second demo of the day
         behaved differently from the first with nothing on screen to say
         why. Found by the harness, and it would have been found in a shop. */
      all[SEED_PHONE] = seedProfile();
      writeAll(all);
    } else {
      // "Cliente nuevo" is an EMPTY profile, not a hidden one. If the
      // seeded customer is still in storage the next "vuelve" would show a
      // profile mutated by the previous run-through.
      if (all[SEED_PHONE]) { delete all[SEED_PHONE]; writeAll(all); }
    }
    return mode;
  }

  function getMode() { return mode; }

  function phone() { return mode === 'vuelve' ? SEED_PHONE : null; }

  function profile() {
    var p = phone();
    if (!p) return null;
    return readAll()[p] || null;
  }

  /* ---- DECLARED -----------------------------------------------------
     Read returns {v, at, fake, ageDays, stale} or null. Never a bare
     string: every caller has to see the age, because the age is what
     decides between asserting and confirming. */
  function declared(field) {
    var pr = profile();
    if (!pr || !pr.declared || !pr.declared[field]) return null;
    var d = pr.declared[field];
    if (!d || !d.v) return null;
    var parts = d.at.split('-');
    var age = Math.floor((Date.now() - new Date(+parts[0], +parts[1] - 1, +parts[2]).getTime()) / 86400000);
    return { v: d.v, at: d.at, fake: !!d.fake, ageDays: age, stale: age > STALE_DAYS };
  }

  var FIELDS = ['nombre', 'razon_social', 'ruc', 'direccion', 'forma_pago'];

  /* Record something the customer just said. declared_at is stamped HERE
     and nowhere else — a field without a real timestamp is a field we
     cannot honestly repeat back. */
  function declare(field, value) {
    if (FIELDS.indexOf(field) === -1) return false;
    var v = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    if (!v) return false;
    var p = phone();
    if (!p) {
      // A new customer who gives a name becomes a profile. That is the
      // only way a profile is ever created from the conversation.
      p = SEED_PHONE;
      mode = 'vuelve';
      var all0 = readAll();
      if (!all0[p]) { all0[p] = { telefono: p, declared: {}, orders: [] }; writeAll(all0); }
    }
    var all = readAll();
    var pr = all[p] || { telefono: p, declared: {}, orders: [] };
    pr.declared = pr.declared || {};
    pr.declared[field] = { v: v, at: daysAgo(0) };
    all[p] = pr;
    writeAll(all);
    return true;
  }

  /* ---- DERIVED ------------------------------------------------------
     Computed on every call. Nothing below is persisted; if it were, it
     could disagree with the orders it describes. */

  function catalogBySku(sku) {
    var P = (typeof LeyvaDemo !== 'undefined' && LeyvaDemo.LOCAL_PRICES) || {};
    var keys = Object.keys(P);
    for (var i = 0; i < keys.length; i++) {
      if (P[keys[i]].sku === sku) return P[keys[i]];
    }
    return null;   // unknown OR null-priced -> not in LOCAL_PRICES at all
  }

  /* Resolve a stored order into displayable lines. A line whose SKU is not
     a currently-priced catalog item is DROPPED, not shown with a blank or a
     stale figure — the same fail-closed rule the proforma builder uses. An
     order that loses every line resolves to null and is treated as if it
     were not there. */
  function resolveOrder(o) {
    if (!o || !o.lines) return null;
    var lines = [];
    o.lines.forEach(function (l) {
      var it = catalogBySku(l.sku);
      if (!it) return;
      var qty = parseInt(l.qty, 10);
      if (!(qty > 0)) return;
      lines.push({ sku: l.sku, qty: qty, n: it.n, unit: it.p, total: it.p * qty });
    });
    if (!lines.length) return null;
    return {
      correlativo: o.correlativo,
      fecha: o.fecha,
      estado: o.estado,
      lines: lines,
      total: lines.reduce(function (a, l) { return a + l.total; }, 0)
    };
  }

  function pedidos() {
    var pr = profile();
    if (!pr || !pr.orders) return [];
    return pr.orders.map(resolveOrder).filter(Boolean)
      .sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  }

  function ultimoPedido() { return pedidos()[0] || null; }

  function abiertas() {
    return pedidos().filter(function (o) { return o.estado === 'abierta'; });
  }

  /* Frequency is only meaningful with at least two orders. With one order
     there is no interval to average, and inventing "cliente frecuente" from
     a single purchase is exactly the inferred-behaviour tier this design
     refuses to have. Returns null rather than a guess. */
  function frecuencia() {
    var ps = pedidos();
    if (ps.length < 2) return null;
    var span = new Date(ps[0].fecha).getTime() - new Date(ps[ps.length - 1].fecha).getTime();
    var days = Math.round(span / 86400000 / (ps.length - 1));
    if (!(days > 0)) return null;
    return { dias: days, pedidos: ps.length };
  }

  function marcarCerrada(correlativo) {
    var p = phone(); if (!p) return false;
    var all = readAll(); var pr = all[p]; if (!pr || !pr.orders) return false;
    var changed = false;
    pr.orders.forEach(function (o) { if (o.correlativo === correlativo) { o.estado = 'cerrada'; changed = true; } });
    if (changed) { all[p] = pr; writeAll(all); }
    return changed;
  }

  /* Record a proforma this conversation just issued, so a second run-through
     has a real prior order rather than only the seeded one. Stores SKUs and
     quantities. Never prices. */
  function registrarPedido(correlativo, lines) {
    var p = phone(); if (!p) return false;
    var skuLines = (lines || []).map(function (l) { return { sku: l.sku, qty: l.qty }; })
                                .filter(function (l) { return l.sku && l.qty > 0; });
    if (!skuLines.length) return false;
    var all = readAll(); var pr = all[p] || { telefono: p, declared: {}, orders: [] };
    pr.orders = pr.orders || [];
    pr.orders.unshift({ correlativo: correlativo, fecha: daysAgo(0), estado: 'abierta', lines: skuLines });
    all[p] = pr; writeAll(all);
    return true;
  }

  /* ---- forget -------------------------------------------------------
     Must ACTUALLY WORK. A scripted "listo, borré sus datos" over a profile
     that is still in storage is worse than not offering the feature: it is
     the one claim in this whole demo that a skeptical buyer can check. */
  function forget() {
    var p = phone();
    var all = readAll();
    if (p && all[p]) { delete all[p]; writeAll(all); }
    mode = 'nuevo';
    try { sessionStorage.setItem(MODE_KEY, 'nuevo'); } catch (e) {}
    return true;
  }

  function wiped() {
    // Verifiable: returns true only if nothing remains under this phone.
    var all = readAll();
    return !all[SEED_PHONE];
  }

  /* ---- the wire shape sent to the server ----------------------------
     Structured, never prose. api/claude.js re-validates every field and
     re-derives every price from the catalog — this is a request, not a
     source of truth. Orders carry {sku, qty} only, deliberately: there is
     no field here into which a price could be placed. */
  function wire() {
    var pr = profile();
    if (!pr) return null;
    var out = { declared: {}, orders: [] };
    FIELDS.forEach(function (f) {
      var d = declared(f);
      if (d) out.declared[f] = { v: d.v, at: d.at };
    });
    (pr.orders || []).forEach(function (o) {
      out.orders.push({
        correlativo: o.correlativo,
        fecha: o.fecha,
        estado: o.estado,
        lines: (o.lines || []).map(function (l) { return { sku: l.sku, qty: l.qty }; })
      });
    });
    if (!Object.keys(out.declared).length && !out.orders.length) return null;
    return out;
  }

  /* ---- rail provenance ----------------------------------------------
     What came from MEMORY versus what was ASKED, given the same treatment
     prices get. A panel that shows an answer without showing where each
     part of it came from is asking to be believed. */
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  var LABEL = {
    nombre: 'Nombre', razon_social: 'Razón social', ruc: 'RUC',
    direccion: 'Dirección', forma_pago: 'Forma de pago'
  };

  function provenance(fields) {
    var out = [];
    (fields || FIELDS).forEach(function (f) {
      var d = declared(f);
      if (!d) return;
      out.push({
        kind: 'mem',
        text: LABEL[f] + ': ' + d.v + (d.fake ? ' (RUC de ejemplo)' : '') +
              ' · declarado ' + fmtDate(d.at) + (d.stale ? ' — se confirma' : '')
      });
    });
    return out;
  }

  function derivedProvenance() {
    var out = [];
    var last = ultimoPedido();
    if (last) {
      out.push({ kind: 'der', text: 'Pedido anterior ' + last.correlativo + ' del ' + fmtDate(last.fecha) + ' — ' + last.lines.length + ' líneas, C$' + last.total.toLocaleString('en-US') });
    }
    abiertas().forEach(function (o) {
      out.push({ kind: 'der', text: 'Proforma abierta ' + o.correlativo + ' — se ofrece como pregunta' });
    });
    var f = frecuencia();
    if (f) out.push({ kind: 'der', text: 'Frecuencia: cada ' + f.dias + ' días (' + f.pedidos + ' pedidos)' });
    return out;
  }

  /* ---- boot ---------------------------------------------------------- */
  function init() {
    var saved = null;
    try { saved = sessionStorage.getItem(MODE_KEY); } catch (e) {}
    setMode(saved === 'vuelve' ? 'vuelve' : 'nuevo');
    return mode;
  }

  return {
    init: init, setMode: setMode, getMode: getMode,
    phone: phone, profile: profile,
    declared: declared, declare: declare, FIELDS: FIELDS,
    pedidos: pedidos, ultimoPedido: ultimoPedido, abiertas: abiertas,
    frecuencia: frecuencia, resolveOrder: resolveOrder,
    marcarCerrada: marcarCerrada, registrarPedido: registrarPedido,
    forget: forget, wiped: wiped,
    wire: wire, provenance: provenance, derivedProvenance: derivedProvenance,
    fmtDate: fmtDate, SEED_PHONE: SEED_PHONE, STALE_DAYS: STALE_DAYS
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaMemory; }
