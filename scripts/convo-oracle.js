/* ============================================================
   LEYVA — ORÁCULO DE CONVERSACIÓN

   Juzga una respuesta cruda del asistente contra el modelo de pedido del
   generador (convo-gen.js). Todo número esperado se computa desde
   api/_data/leyva-catalog.json. Nada aquí conoce el código bajo prueba:
   se lee TEXTO CRUDO (las burbujas tal cual) y el documento emitido.

   Cada falla lleva una CLASE. Las clases son las del brief:
     fantasma       — producto que el cliente nunca nombró
     omitido        — producto nombrado que no se cotiza ni se declara
     aritmetica     — cifra que no se deriva del catálogo/carrito
     total          — total rotulado distinto del carrito
     no-pregunta    — no entendió y no preguntó (o dio total/documento)
     repetir        — le pide al cliente algo que ya está en el historial
     confirmacion   — la confirmación no lista el carrito completo
     documento      — proforma que no refleja el carrito, o que nadie pidió
     carrito        — el estado interno difiere del pedido real
   ============================================================ */
'use strict';
const { CAT, SKUS, price } = require('./convo-gen.js');

const money = v => 'C$' + Number(v).toLocaleString('en-US');
const flat = s => String(s).replace(/[\s.,]/g, '');
const hasFig = (txt, v) => flat(txt).includes(flat(money(v)));
const strip = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* How the ASSISTANT names each kind. Case-sensitive for "T" on purpose:
   a lowercase "t" is a letter, an uppercase "T" before PVC/de is the part. */
const KRE = {
  tubo: /\btub(o|os|ito|itos)\b/i, codo: /\bcod(o|os|ito|itos)\b/i,
  tee: /\bT(es)?\b(?= (PVC|de|pvc))|\btees?\b/, pegamento: /\bpegamento/i,
  cemento: /\bcemento|\bbultos?\b/i, clavo: /\bclav(o|os|ito|itos)\b/i,
  gypsum: /\bgypsum\b/i, puerta: /\bpuertas?\b/i, tabla: /\btablas?\b/i,
  bondex: /\bbondex\b/i, aceite: /\baceite|yamalube/i, bateria: /\bbater[íi]as?\b/i, llanta: /\bllantas?\b/i
};
const kindsIn = s => Object.keys(KRE).filter(k => KRE[k].test(s));

/* How the assistant writes WHICH one — used to check a confirmation line
   names the right size, not just the right kind. */
const SZ = {
  'TUB-PVC-12': /1\/2|media/, 'TUB-PVC-1': /\b1"|\b1 pulg|\bde 1\b|una pulgada/, 'TUB-PVC-2': /\b2"|\b2 pulg|\bde 2\b|dos pulgadas/,
  'CODO-PVC-12': /1\/2|media/, 'CODO-PVC-1': /\b1"|\b1 pulg|\bde 1\b|una pulgada/,
  'TEE-PVC-12': /1\/2|media/, 'TEE-PVC-1': /\b1"|\b1 pulg|\bde 1\b|una pulgada/,
  'PEG-PVC-18': /1\/8|octavo/, 'PEG-PVC-14': /1\/4|cuarto/,
  'CLA-2': /\b2\b/, 'CLA-3': /\b3\b/, 'CLA-4': /\b4\b/,
  'PTA-MET-3T-CAFE': /caf[ée]|3 tableros/i, 'PTA-MET-6T-BLANCA': /blanca|6 tableros/i, 'PTA-MET-5T-CAOBA': /caoba|5 tableros/i,
  'BON-PLUS-20': /plus/i, 'BON-CER-PREM-20': /premium|cer[áa]mica/i,
  'BAT-KOBE-12N65L': /12N6/i, 'BAT-KOBE-12N74B': /12N7/i
};
Object.keys(SKUS).filter(s => /^LLA-/.test(s)).forEach(s => { SZ[s] = new RegExp(s.replace('LLA-CST-', ''), 'i'); });

const PRICED = Object.keys(CAT.items).filter(s => CAT.items[s].precio !== null);
const UNIT_PRICES = new Set(PRICED.map(s => CAT.items[s].precio));
PRICED.forEach(s => { if (CAT.items[s].precio_antes) UNIT_PRICES.add(CAT.items[s].precio_antes); });

const cartTotal = cart => cart.reduce((a, l) => a + price(l.sku) * l.qty, 0);
const TOTAL_LABEL = /(total|suma|lleva|queda en|todo junto|en total)\b[^C\n]{0,12}C\$\s?([\d,]+)/gi;

/* Bubbles in which naming a product the customer did not ask about is
   LEGITIMATE: the refusal-inventory aside ("lo que sí tengo en ...") and a
   bare family listing. Neither may carry a price — checked separately. */
const INVENTORY_ASIDE = /lo que s[ií] tengo|^en .+ tengo .+\.$|de .+ tengo .+ ¿cu[aá]l/i;

function judge(turn, reply, ctx) {
  const F = [];
  const fail = (cls, msg) => F.push({ cls, msg });
  const bubbles = reply.bubbles || [];
  const txt = bubbles.join('\n');
  const lines = txt.split('\n');
  const named = new Set(turn.named || []);
  const cart = turn.cart || [];
  const before = ctx.prevCart || [];
  const allowPhantom = new Set(ctx.allowKinds || []);

  // ---- fantasma: a product the customer never named ----
  lines.forEach(l => {
    if (INVENTORY_ASIDE.test(l) && !/C\$/.test(l)) return;
    if (/no manej|no tenemos|no lo tengo/i.test(l) && !/C\$/.test(l)) return;
    kindsIn(l).forEach(k => {
      if (!named.has(k) && !allowPhantom.has(k)) fail('fantasma', 'menciona "' + k + '" que el cliente nunca nombró: ' + l);
    });
  });
  if (reply.doc) reply.doc.lines.forEach(dl => {
    const k = dl.sku && SKUS[dl.sku] ? SKUS[dl.sku].kind : null;
    if (k && !named.has(k) && !allowPhantom.has(k)) fail('fantasma', 'la proforma trae ' + dl.sku + ' que el cliente nunca nombró');
  });

  // ---- aritmética: every figure derivable ----
  const legal = new Set(UNIT_PRICES);
  const addLine = l => legal.add(price(l.sku) * l.qty);
  cart.forEach(addLine); before.forEach(addLine);
  legal.add(cartTotal(cart)); legal.add(cartTotal(before));
  (turn.mentions || []).forEach(m => { if (m.sku && m.qty) legal.add(price(m.sku) * m.qty); });
  (ctx.extraLegal || []).forEach(v => legal.add(v));
  const figs = (txt.match(/C\$\s?[\d,]+(\.\d+)?/g) || []).map(f => parseInt(f.replace(/[^\d.]/g, ''), 10));
  figs.forEach(v => { if (!legal.has(v)) fail('aritmetica', 'cifra ' + money(v) + ' no se deriva del catálogo ni del carrito'); });

  // ---- total rotulado == carrito ----
  if (!ctx.skipTotalLabel) {
    let m; TOTAL_LABEL.lastIndex = 0;
    while ((m = TOTAL_LABEL.exec(txt))) {
      const v = parseInt(m[2].replace(/,/g, ''), 10);
      if (v !== cartTotal(cart)) fail('total', 'total rotulado ' + money(v) + ' ≠ carrito ' + money(cartTotal(cart)) + ' («' + m[0].trim() + '»)');
    }
  }

  // ---- omitido: every named product quoted or declared not understood ----
  (turn.mentions || []).forEach(m => {
    if (!KRE[m.kind].test(txt)) { fail('omitido', 'el cliente nombró ' + m.kind + ' y la respuesta no lo menciona'); return; }
    if (m.needs === 'size') {
      const qs = txt.split(/(?<=[.?!])\s+|\n/).filter(x => /\?/.test(x));
      if (!qs.length) fail('no-pregunta', m.kind + ' sin medida y la respuesta no pregunta nada');
      return;
    }
    if (m.sku && m.qty) {
      if (!hasFig(txt, price(m.sku))) fail('omitido', m.sku + ': falta el unitario ' + money(price(m.sku)));
      if (!hasFig(txt, price(m.sku) * m.qty)) fail('omitido', m.sku + ' x' + m.qty + ': falta el importe ' + money(price(m.sku) * m.qty));
    }
    if (m.sku && m.qty === null && !hasFig(txt, price(m.sku))) fail('omitido', m.sku + ': pregunta de precio sin el unitario');
  });
  if (turn.offcat && !strip(txt).includes(strip(turn.offcat)) && !/no manej/i.test(txt)) {
    fail('omitido', 'pidió "' + turn.offcat + '" (no lo manejan) y la respuesta ni lo niega');
  }

  // ---- no-pregunta: not understood -> a QUESTION, never a total/doc ----
  const unresolved = (turn.mentions || []).some(m => m.needs) || turn.expect === 'ask_pending' || turn.expect === 'ask_empty';
  if (unresolved) {
    if (!/\?/.test(txt)) fail('no-pregunta', 'quedó algo sin entender y la respuesta no es una pregunta');
    if (reply.doc) fail('no-pregunta', 'quedó algo sin entender y aun así emitió documento');
    if (/\b(total|todo junto|en total)\b/i.test(txt)) fail('no-pregunta', 'quedó algo sin entender y aun así dio un total');
  }
  if (turn.expect === 'ask_empty' && /C\$/.test(txt)) fail('no-pregunta', 'carrito vacío y la respuesta trae cifras');

  // ---- repetir: asking for something already in the history ----
  if (/d[ií]game c[oó]mo queda|qu[ée] le cambio|me lo repite|me la repite|me repite|vuelva a decirme|no le entend[ií] el nombre/i.test(txt) &&
      ((turn.mentions || []).length || turn.recallKind || /^(s[ií]|correcto|dale|va pues|ok)/i.test(turn.text))) {
    fail('repetir', 'pide repetir lo que el cliente acaba de decir');
  }
  const pendKinds = new Set((ctx.pendAfter || []).map(p => p.kind));
  const cartKinds = new Set(cart.map(l => SKUS[l.sku].kind));
  txt.split(/(?<=[.?!])\s+|\n/).filter(x => /\?/.test(x) && /cu[áa]nt|cu[áa]l|medida/i.test(x)).forEach(q => {
    kindsIn(q).forEach(k => {
      if (cartKinds.has(k) && !pendKinds.has(k) && !['price_query', 'partial_size', 'mixed_partial'].includes(turn.act) &&
          !(turn.mentions || []).some(m => m.kind === k && (m.needs || m.qty === null))) {
        fail('repetir', 'pregunta cuántos/cuál de "' + k + '" que ya está completo en el pedido: ' + q);
      }
    });
  });
  if (/¿qu[ée] ocupa\?/i.test(txt) && (turn.mentions || []).length) fail('repetir', '"¿Qué ocupa?" a un mensaje que nombró productos');

  // ---- confirmación: the WHOLE cart, once, before the document ----
  const wantConfirm = turn.expect === 'confirm' || turn.expectConfirm;
  if (wantConfirm) {
    if (!/para confirmarle/i.test(txt)) fail('confirmacion', 'tocaba confirmar el pedido completo y no confirmó');
    else {
      const conf = txt.slice(txt.search(/para confirmarle/i)).split(/¿/)[0]
        .replace(/^para confirmarle:\s*/i, '').replace(/\.\s*Total.*$/s, '');
      // one item per comma / "y": a greedy scan across items hid the second "3" in "3 bultos y 3 libras"
      const items = conf.split(/,\s*|\s+y\s+(?=\d)/);
      cart.forEach(l => {
        const k = SKUS[l.sku].kind;
        const hit = items.some(seg => new RegExp('^\\s*' + l.qty + '\\s').test(seg) && KRE[k].test(seg) && (!SZ[l.sku] || SZ[l.sku].test(seg.replace(/^\s*\d+\s/, ''))));
        if (!hit) fail('confirmacion', 'la confirmación no lista ' + l.qty + ' x ' + l.sku);
      });
      if (items.length !== cart.length) fail('confirmacion', 'la confirmación tiene ' + items.length + ' ítems y el carrito ' + cart.length);
    }
    if (reply.doc) fail('documento', 'emitió documento antes de confirmar');
  }

  // ---- documento ----
  if (turn.expectDoc) {
    if (!reply.doc) fail('documento', 'confirmó y dio nombre, y no salió la proforma');
    else {
      const want = cart.map(l => l.sku + 'x' + l.qty).sort().join(',');
      const got = reply.doc.lines.map(l => (l.sku || '?' + l.desc) + 'x' + l.qty).sort().join(',');
      if (want !== got) fail('documento', 'proforma ≠ carrito: proforma [' + got + '] carrito [' + want + ']');
      reply.doc.lines.forEach(l => {
        if (l.sku && CAT.items[l.sku] && (l.unit !== price(l.sku) || l.total !== price(l.sku) * l.qty)) {
          fail('documento', 'línea ' + l.sku + ' con unitario/importe que no sale del catálogo');
        }
      });
      if (reply.doc.total !== cartTotal(cart)) fail('documento', 'total de proforma ' + money(reply.doc.total) + ' ≠ carrito ' + money(cartTotal(cart)));
    }
  } else if (reply.doc) {
    fail('documento', 'emitió una proforma que nadie terminó de pedir');
  }

  // ---- total en curso / recall: the customer-visible cart ----
  if (turn.act === 'total') {
    if (!cart.length) { if (/C\$/.test(txt)) fail('total', 'carrito vacío y dio cifras'); }
    else {
      cart.forEach(l => {
        if (!hasFig(txt, price(l.sku) * l.qty)) fail('carrito', '"¿cuánto llevo?" no lista ' + l.qty + ' x ' + l.sku + ' (' + money(price(l.sku) * l.qty) + ')');
      });
      if (!hasFig(txt, cartTotal(cart))) fail('total', '"¿cuánto llevo?" sin la suma del carrito ' + money(cartTotal(cart)));
    }
  }
  if (turn.recallKind) {
    const mine = cart.filter(l => SKUS[l.sku].kind === turn.recallKind);
    mine.forEach(l => {
      if (!hasFig(txt, price(l.sku) * l.qty) && !new RegExp('\\b' + l.qty + '\\b').test(txt)) {
        fail('repetir', 'preguntó por ' + turn.recallKind + ' que ya están en el pedido y no los recupera (' + l.qty + ' x ' + l.sku + ')');
      }
    });
  }

  // ---- carrito interno ----
  if (reply.cart) {
    const want = cart.map(l => l.sku + 'x' + l.qty).sort().join(',');
    const got = reply.cart.map(l => l.sku + 'x' + l.qty).sort().join(',');
    if (want !== got) fail('carrito', 'carrito interno [' + got + '] ≠ pedido real [' + want + ']');
  }
  return F;
}

module.exports = { judge, cartTotal, money, KRE, kindsIn };
