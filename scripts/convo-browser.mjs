#!/usr/bin/env node
/* ============================================================
   LEYVA — CONVERSACIONES EN EL NAVEGADOR REAL

   Mismo generador y mismo oráculo que scripts/convo-run.js, pero contra
   la página: leyva-chat.js, el modelo de verdad cuando hay red, y la red
   APAGADA DE VERDAD (context.setOffline) cuando se pide.

   TEXTO CRUDO. Cada burbuja se lee del DOM quitando SOLO el span de la
   hora (.wa__m). Una transcripción anterior se comió un dígito porque un
   regex de hora mordía el precio; aquí no hay regex sobre el texto: se
   lee el nodo de texto.

   Aceleración: los retardos de tipeo (<= 2.5 s) se dividen entre 10 para
   que miles de turnos quepan en una corrida. El timeout del modelo (4 s)
   NO se toca — se deja fuera por diseño, así el camino con red es el real.

   Token: se toma de la variable de entorno LEYVA_TOKEN y nunca se imprime.

   Uso:
     LEYVA_TOKEN=... node scripts/convo-browser.mjs --base https://<preview> \
        --n 60 --from 800000 --workers 3 [--offline] [--hard] [--out f.json]
     node scripts/convo-browser.mjs --base http://localhost:8123 --local-stub ...
       (--local-stub: sirve estático; simula /api/ops-auth y corta /api/claude)
   ============================================================ */
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const { chromium } = require(PW);
const G = require('./convo-gen.js');
const O = require('./convo-oracle.js');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i === -1 ? d : args[i + 1]; };
const BASE = opt('--base', 'http://localhost:8123');
const N = parseInt(opt('--n', '20'), 10);
const FROM = parseInt(opt('--from', '800000'), 10);
const WORKERS = parseInt(opt('--workers', '3'), 10);
const OFFLINE = args.includes('--offline');
const HARD = args.includes('--hard');
const STUB = args.includes('--local-stub');
const OUT = opt('--out', null);
const ONLY = opt('--seed', null);
const TOKEN = process.env.LEYVA_TOKEN || (STUB ? 'stub' : '');
if (!TOKEN) { console.error('LEYVA_TOKEN no está definido'); process.exit(2); }
const PAGE = STUB ? '/leyva.html' : '/leyva';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

// the seeded prior order, for the "vuelve" arcs
const SEED_ORDER = [{ sku: 'GYP-12-48', qty: 14 }, { sku: 'PTA-MET-3T-CAFE', qty: 2 }];

async function newPage(browser) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(tok => {
    try { sessionStorage.setItem('ignea_ops_token', tok); } catch (e) {}
    // keep the last PDF blob so the harness can read the DOCUMENT itself
    const cou = URL.createObjectURL;
    URL.createObjectURL = function (b) { if (b && b.type === 'application/pdf') window.__lastPdf = b; return cou.call(URL, b); };
    const st = window.setTimeout;
    window.setTimeout = function (fn, ms) {
      const a = Array.prototype.slice.call(arguments, 2);
      return st.apply(window, [fn, (typeof ms === 'number' && ms <= 2500) ? Math.round(ms / 10) : ms].concat(a));
    };
  }, TOKEN);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  if (STUB) {
    await page.route('**/api/ops-auth', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page.route('**/api/claude', r => r.abort());
    await page.route('**/api/leyva-catalog**', r => r.abort());
  }
  const apiCalls = { n: 0 };
  page.on('request', q => { if (/\/api\/claude/.test(q.url())) apiCalls.n++; });
  await page.goto(BASE + PAGE, { waitUntil: 'load' });
  await page.waitForSelector('#waIn', { state: 'visible', timeout: 20000 });
  if (OFFLINE) await ctx.setOffline(true);
  return { ctx, page, errors, apiCalls };
}

async function setMode(page, mode) {
  const want = mode === 'vuelve' ? 'vuelve' : 'nuevo';
  await page.click('.lv-seg__b[data-mode="' + want + '"]');
  await page.click('#lvReset');
}

async function sendTurn(page, text) {
  const before = await page.$$eval('#waChat .wa__b--in', n => n.length);
  const docsBefore = await page.$$eval('#waChat .wa__doc', n => n.length);
  const done = page.evaluate(() => new Promise(res => {
    document.addEventListener('leyva:turn', e => res(e.detail), { once: true });
  }));
  await page.fill('#waIn', text);
  await page.press('#waIn', 'Enter');
  const detail = await Promise.race([done, new Promise(r => setTimeout(() => r({ timeout: true }), 30000))]);
  // RAW text: every incoming bubble node after the ones already there, minus
  // ONLY the timestamp span. No regex touches the words or the figures.
  const bubbles = await page.$$eval('#waChat .wa__b--in', (ns, from) => ns.slice(from).map(n => {
    let t = '';
    n.childNodes.forEach(c => { if (!(c.classList && c.classList.contains('wa__m'))) t += c.textContent; });
    return t;
  }), before);
  const docsAfter = await page.$$eval('#waChat .wa__doc', n => n.length);
  // why a model reply was not used, as the operator rail states it
  const why = await page.$$eval('#lvRail .lv-step', ns => ns.map(n => n.textContent).filter(t => /DESCARTADA|NO VERIFICABLE/.test(t)));
  let pdf = null;
  if (docsAfter > docsBefore) pdf = await page.evaluate(async () => window.__lastPdf ? await window.__lastPdf.text() : null);
  return { detail, bubbles, docCard: docsAfter > docsBefore, pdf, why };
}

async function runConvo(w, c) {
  const { page } = w;
  await setMode(page, c.mode);
  const log = [], fails = [];
  let prevCart = [], allowKinds = [];
  const extraLegal = c.mode === 'vuelve' ? [13700, 5180, 8520] : [];
  for (let i = 0; i < c.turns.length; i++) {
    const t = c.turns[i];
    const r = await sendTurn(page, t.text);
    const d = r.detail || {};
    const doc = d.doc || null;
    if (t.act === 'repeat_order') allowKinds = SEED_ORDER.map(l => G.SKUS[l.sku].kind);
    const reply = { bubbles: r.bubbles, doc, cart: d.cart || null };
    const f = O.judge(t, reply, { prevCart, pendAfter: t.pendSize, allowKinds, extraLegal });
    if (d.timeout) f.push({ cls: 'cuelgue', msg: 'el turno no terminó en 30 s' });
    if (!!doc !== r.docCard) f.push({ cls: 'documento', msg: 'el evento y la tarjeta PDF en pantalla no coinciden' });
    /* The PDF BYTES, not the event: every cart line's quantity and importe
       and the total must be printed in the document itself. */
    if (r.docCard) {
      const pdfMoney = v => 'C$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (!r.pdf) f.push({ cls: 'documento', msg: 'hay tarjeta PDF pero no se pudo leer el archivo' });
      else {
        const txt = r.pdf;
        (t.cart || []).forEach(l => {
          const tot = G.price(l.sku) * l.qty;
          if (!txt.includes('(' + pdfMoney(tot) + ')')) f.push({ cls: 'documento', msg: 'el PDF no trae el importe ' + pdfMoney(tot) + ' de ' + l.qty + ' x ' + l.sku });
          if (!txt.includes('(' + l.qty + ')')) f.push({ cls: 'documento', msg: 'el PDF no trae la cantidad ' + l.qty + ' de ' + l.sku });
        });
        const want = (t.cart || []).reduce((a, l) => a + G.price(l.sku) * l.qty, 0);
        if (!txt.includes('(' + pdfMoney(want) + ')')) f.push({ cls: 'documento', msg: 'el PDF no trae el total ' + pdfMoney(want) });
        const lineCount = (txt.match(/\(C\$[\d,]+\.\d\d\)/g) || []).length;
        // each line prints unit + importe, plus the TOTAL: 2n+1 money strings
        if (lineCount !== 2 * (t.cart || []).length + 1) f.push({ cls: 'documento', msg: 'el PDF trae ' + lineCount + ' cifras; el carrito exige ' + (2 * (t.cart || []).length + 1) });
      }
    }
    log.push({ i, user: t.text, act: t.act, mode: d.mode, bot: r.bubbles, doc, fails: f, why: r.why });
    f.forEach(x => fails.push(Object.assign({ turn: i, act: t.act }, x)));
    prevCart = t.cart;
  }
  return { seed: c.seed, mode: c.mode, log, fails };
}

function transcript(r) {
  const out = ['=== conversación ' + r.seed + ' (' + r.mode + ', ' + (OFFLINE ? 'SIN RED' : 'con red') + ') ==='];
  r.log.forEach(l => {
    out.push('CLIENTE: ' + l.user + '   [' + l.act + ']');
    l.bot.forEach(b => out.push('   BOT(' + (l.mode || '?') + '): ' + b.replace(/\n/g, '\n        ')));
    (l.why || []).forEach(w => out.push('   ~~~ ' + w));
    if (l.doc) out.push('   >>> PDF: ' + l.doc.lines.map(x => x.qty + ' x ' + x.sku + ' = C$' + x.total).join(' | ') + ' · TOTAL C$' + l.doc.total);
    l.fails.forEach(f => out.push('   !!! [' + f.cls + '] ' + f.msg));
  });
  return out.join('\n');
}

const convos = ONLY === 'screenshot' ? [G.screenshot()] : [G.screenshot()];
if (ONLY !== 'screenshot') for (let s = FROM; s < FROM + N; s++) convos.push(G.Gen(s, { mode: s % 4 === 0 ? 'vuelve' : 'nuevo', seedOrder: SEED_ORDER, hard: HARD }));

const browser = await chromium.launch();
const results = []; let turns = 0; const modes = {}; const discards = {}; let apiTotal = 0; const pageErrors = [];
let next = 0;
async function worker() {
  let w = await newPage(browser);
  while (next < convos.length) {
    const c = convos[next++];
    let r;
    try { r = await runConvo(w, c); }
    catch (e) {
      r = { seed: c.seed, mode: c.mode, log: [], fails: [{ cls: 'arnes', msg: String(e).slice(0, 300) }] };
      try { await w.ctx.close(); } catch (e2) {}
      w = await newPage(browser);
    }
    results.push(r);
    turns += r.log.length;
    r.log.forEach(l => { modes[l.mode] = (modes[l.mode] || 0) + 1; (l.why || []).forEach(w => { const k = w.replace(/:.*/, ''); discards[k] = (discards[k] || 0) + 1; }); });
    process.stdout.write(r.fails.length ? 'F' : '.');
  }
  apiTotal += w.apiCalls.n; pageErrors.push(...w.errors);
  await w.ctx.close();
}
await Promise.all(Array.from({ length: Math.min(WORKERS, convos.length) }, worker));
await browser.close();

const failing = results.filter(r => r.fails.length);
const byClass = {};
failing.forEach(r => r.fails.forEach(f => { byClass[f.cls] = (byClass[f.cls] || 0) + 1; }));
console.log('\n' + (OFFLINE ? 'SIN RED (context.setOffline)' : 'CON RED') + ' · ' + BASE);
console.log('conversaciones: ' + results.length + ' (' + turns + ' turnos) · con falla: ' + failing.length);
console.log('fallas por clase: ' + JSON.stringify(byClass));
console.log('quién respondió cada turno: ' + JSON.stringify(modes) + ' · llamadas a /api/claude: ' + apiTotal);
console.log('respuestas del modelo descartadas por la compuerta: ' + JSON.stringify(discards) + ' (el resto de "local" con red = timeout/error de red)');
console.log('errores de página: ' + pageErrors.length + (pageErrors.length ? ' — ' + pageErrors.slice(0, 3).join(' | ') : ''));
const shot = results.find(r => r.seed === 'screenshot');
if (shot) console.log('\n' + transcript(shot));
if (failing.length) console.log('\nprimera falla:\n' + transcript(failing[0]));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ base: BASE, offline: OFFLINE, n: results.length, turns, byClass, modes, apiTotal, pageErrors,
  discards, transcripts: results.map(transcript), failing: failing.map(transcript) }, null, 1));
process.exit(failing.length || pageErrors.length ? 1 : 0);
