#!/usr/bin/env node
/* ============================================================
   LEYVA — CORREDOR DE CONVERSACIONES (camino determinista)

   Corre N conversaciones generadas contra LeyvaDemo.local() — que es,
   literalmente, lo que responde el teléfono cuando no hay red, y lo que
   responde CON red en todo turno que toca el pedido (esos turnos son
   deterministas y nunca llegan al modelo).

   Emula la capa de chat (js/leyva-chat.js) en lo que importa para el
   pedido: la pregunta de proforma pendiente de memoria y la decisión de
   emitir documento. Si esa decisión cambia en leyva-chat.js, cambia aquí
   también — por eso ambas llaman a LeyvaDemo.documentFor() cuando existe.

   Uso:  node scripts/convo-run.js [N=3000] [--from 1] [--mode mixed|nuevo|vuelve]
         [--out file.json] [--seed S] (una sola conversación, impresa completa)
   Sale con código 1 si hay cualquier falla.
   ============================================================ */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');

const store = {}, ss = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.sessionStorage = { getItem: k => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: k => { delete ss[k]; } };
global.LeyvaFamilies = require(ROOT + '/js/leyva-families.js');
global.LeyvaOrder = require(ROOT + '/js/leyva-order.js');
try { global.LeyvaCart = require(ROOT + '/js/leyva-cart.js'); } catch (e) { /* pre-cart baseline */ }
const D = require(ROOT + '/js/leyva-demo.js');
global.LeyvaDemo = D;
global.LeyvaMemory = require(ROOT + '/js/leyva-memory.js');
const PF = require(ROOT + '/js/leyva-proforma.js');
const G = require('./convo-gen.js');
const O = require('./convo-oracle.js');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i === -1 ? d : args[i + 1]; };
const N = parseInt(args.find(a => /^\d+$/.test(a)) || '3000', 10);
const FROM = parseInt(opt('--from', '1'), 10);
const MODE = opt('--mode', 'mixed');
const OUT = opt('--out', null);
const ONE = opt('--seed', null);
const HARD = args.includes('--hard');

function seedOrder() {
  LeyvaMemory.setMode('vuelve');
  const o = LeyvaMemory.ultimoPedido();
  return o ? o.lines.map(l => ({ sku: l.sku, qty: l.qty })) : [];
}

/* The chat layer's document decision. Mirrors leyva-chat.js say(). */
function docFor(ans, bubbles) {
  if (D.documentFor) return D.documentFor(ans);
  if (ans.suppressDoc) return null;
  return ans.order || PF.parse(bubbles.join('\n'));
}

function runConvo(c) {
  LeyvaMemory.setMode(c.mode === 'vuelve' ? 'vuelve' : 'nuevo');
  D.resetState();
  PF.reseed(LeyvaMemory.pedidos());
  const seeded = c.mode === 'vuelve' ? (LeyvaMemory.ultimoPedido() || { lines: [], total: 0 }) : { lines: [], total: 0 };
  const extraLegal = [seeded.total].concat(seeded.lines.map(l => l.total));
  const log = [], fails = [];
  let prevCart = [], allowKinds = [];
  c.turns.forEach((t, i) => {
    const ans = D.local(t.text);
    let bubbles = ans.bubbles.slice();
    if (!ans.suppressDoc) {
      const nudge = D.openProformaNudge(bubbles.join(' '));
      if (nudge) bubbles = bubbles.concat(nudge.bubbles);
    }
    const doc = docFor(ans, bubbles);
    const reply = { bubbles, doc: doc ? { lines: doc.lines.map(l => ({ sku: l.sku, desc: l.desc || l.n, qty: l.qty, unit: l.unit, total: l.total })), total: doc.total } : null,
                    cart: D.cart ? D.cart().map(l => ({ sku: l.sku, qty: l.cantidad })) : null };
    if (t.act === 'repeat_order') allowKinds = seeded.lines.map(l => G.SKUS[l.sku].kind);
    const f = O.judge(t, reply, { prevCart, pendAfter: t.pendSize, allowKinds, extraLegal });
    log.push({ i, user: t.text, act: t.act, bot: bubbles, doc: reply.doc, det: !!ans.localOnly, cart: t.cart, fails: f });
    f.forEach(x => fails.push(Object.assign({ turn: i, act: t.act, tags: t.tags || [] }, x)));
    prevCart = t.cart;
  });
  return { seed: c.seed, mode: c.mode, log, fails };
}

function transcript(r) {
  const out = ['=== conversación ' + r.seed + ' (' + r.mode + ') ==='];
  r.log.forEach(l => {
    out.push('CLIENTE: ' + l.user + '   [' + l.act + ']');
    l.bot.forEach(b => out.push('   BOT: ' + b.replace(/\n/g, '\n        ')));
    if (l.doc) out.push('   >>> PDF: ' + l.doc.lines.map(x => x.qty + ' x ' + (x.sku || x.desc) + ' = C$' + x.total).join(' | ') + ' · TOTAL C$' + l.doc.total);
    l.fails.forEach(f => out.push('   !!! [' + f.cls + '] ' + f.msg));
  });
  return out.join('\n');
}

module.exports = { runConvo, transcript, seedOrder };

if (require.main === module) {
  const SEED_ORDER = seedOrder();
  if (ONE) {
    const c = ONE === 'screenshot' ? G.screenshot() : G.Gen(parseInt(ONE, 10), { mode: MODE === 'vuelve' ? 'vuelve' : 'nuevo', seedOrder: SEED_ORDER, hard: HARD });
    const r = runConvo(c);
    console.log(transcript(r));
    process.exit(r.fails.length ? 1 : 0);
  }

  const results = [];
  const sigs = new Map(), feats = new Set(), curve = [];
  const byClass = {};
  let failingConvos = 0, turns = 0;
  const all = [G.screenshot()];
  for (let s = FROM; s < FROM + N; s++) {
    const mode = MODE === 'mixed' ? (s % 4 === 0 ? 'vuelve' : 'nuevo') : MODE;
    all.push(G.Gen(s, { mode, seedOrder: SEED_ORDER, hard: HARD }));
  }
  all.forEach((c, idx) => {
    const r = runConvo(c);
    turns += c.turns.length;
    c.feats.forEach(f => feats.add(f));
    if (r.fails.length) {
      failingConvos++;
      results.push(r);
      r.fails.forEach(f => {
        byClass[f.cls] = (byClass[f.cls] || 0) + 1;
        const sig = f.cls + ' @ ' + f.act;
        if (!sigs.has(sig)) sigs.set(sig, { first: idx, seed: c.seed, n: 0 });
        sigs.get(sig).n++;
      });
    }
    if ((idx + 1) % 100 === 0 || idx === all.length - 1) curve.push({ convos: idx + 1, sigs: sigs.size, feats: feats.size, failing: failingConvos });
  });

  console.log('conversaciones: ' + all.length + ' (' + turns + ' turnos) · con falla: ' + failingConvos);
  console.log('fallas por clase: ' + JSON.stringify(byClass));
  console.log('\nfirmas de falla (clase @ acción) — primera aparición:');
  Array.from(sigs.entries()).sort((a, b) => a[1].first - b[1].first)
    .forEach(([k, v]) => console.log('  ' + k.padEnd(34) + ' primera en conv #' + v.first + ' (semilla ' + v.seed + '), ' + v.n + ' veces'));
  console.log('\ncurva (conversaciones → firmas de falla distintas · rasgos gramaticales/arcos cubiertos):');
  curve.filter((p, i) => i % 5 === 4 || i === curve.length - 1 || i < 5).forEach(p => console.log('  ' + String(p.convos).padStart(6) + ' → ' + String(p.sigs).padStart(3) + ' firmas · ' + p.feats + ' rasgos · ' + p.failing + ' conv. con falla'));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ n: all.length, turns, failingConvos, byClass, sigs: Array.from(sigs.entries()), curve,
                                                   transcripts: results.map(transcript) }, null, 1));
  if (results.length) { console.log('\nprimera falla:\n' + transcript(results[0])); }
  process.exit(failingConvos ? 1 : 0);
}
