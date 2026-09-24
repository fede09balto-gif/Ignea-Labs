/* ============================================================
   LEYVA — GENERADOR DE CONVERSACIONES + MODELO DE LO QUE DEBERÍA PASAR

   Por qué existe: la suite anterior muestreaba FORMAS DE PREGUNTA, no
   CONVERSACIONES, y el bug del carrito sobrevivió a una corrida verde.
   Este archivo genera conversaciones completas (4–20 turnos) con una
   caminata aleatoria sobre arcos reales de mostrador, y lleva en
   paralelo SU PROPIO modelo del pedido: qué pidió el cliente, en qué
   cantidad, qué quitó, qué quedó sin entender.

   Ese modelo NO usa nada del código bajo prueba. Los SKU y precios salen
   de api/_data/leyva-catalog.json; el texto del cliente sale de las
   tablas de vocabulario de abajo. Si el sistema y este modelo discrepan,
   el oráculo (convo-oracle.js) lo reporta.

   Determinista por semilla: la conversación N de la semilla S es siempre
   la misma, así una falla se reproduce con un solo número.
   ============================================================ */
'use strict';
const CAT = require('../api/_data/leyva-catalog.json');

function rng(seed) {                       // mulberry32
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---- VOCABULARIO ------------------------------------------------------
   Cada SKU con precio: cómo lo nombra un cliente real en León. `kind` es
   la cosa; `sizes` son las formas de decir CUÁL. Un SKU que es el único de
   su kind no necesita medida. */
const PIPE_SIZE = {
  '1/2': ['1/2"', '1/2', 'media', 'media pulgada', '1/2 pulgada', '1/2 pulg', '½'],
  '1':   ['1"', '1 pulgada', 'una pulgada', '1 pulg', 'una', '1'],
  '2':   ['2"', '2 pulgadas', 'dos pulgadas', '2 pulg', '2']
};

const V = {
  tubo:      { plural: ['tubos', 'tubos de pvc', 'tubos pvc', 'tubitos', 'tuvos', 'tubo'], sing: ['tubo', 'tubo pvc', 'tubo de pvc'], fem: false, noun: 'tubo' },
  codo:      { plural: ['codos', 'codos pvc', 'coditos', 'codos de pvc', 'codoz'], sing: ['codo'], fem: false, noun: 'codo' },
  tee:       { plural: ['T', 'tees', 'tes', 'T pvc'], sing: ['T', 'tee'], fem: true, noun: 'T' },
  pegamento: { plural: ['pegamentos', 'pegamento pvc', 'pegamento'], sing: ['pegamento', 'pegamento pvc'], fem: false, noun: 'pegamento' },
  cemento:   { plural: ['bultos de cemento', 'bultos', 'bolsas de cemento', 'sacos de cemento', 'de cemento', 'bultos de cemento de 25 kg', 'cementos', 'bultoz de cemento'], sing: ['bulto de cemento', 'cemento'], fem: false, noun: 'cemento' },
  clavo:     { plural: ['libras de clavo', 'libras de clavos', 'lb de clavo', 'libras de clavitos'], sing: ['libra de clavo', 'libra de clavos'], fem: false, noun: 'clavo' },
  gypsum:    { plural: ['láminas de gypsum', 'gypsum', 'laminas de jipson', 'láminas de gypsum de 1/2', 'laminas de gipsum', 'planchas de gypsum'], sing: ['lámina de gypsum', 'gypsum'], fem: true, noun: 'gypsum' },
  puerta:    { plural: ['puertas', 'puertas metálicas', 'puertas metalicas'], sing: ['puerta', 'puerta metálica'], fem: true, noun: 'puerta' },
  tabla:     { plural: ['tablas', 'tablas de 1x12', 'tablas de madera'], sing: ['tabla'], fem: true, noun: 'tabla' },
  bondex:    { plural: ['bondex', 'sacos de bondex', 'bolsas de bondex'], sing: ['bondex', 'saco de bondex'], fem: false, noun: 'bondex' },
  aceite:    { plural: ['litros de aceite', 'yamalube', 'litros de yamalube', 'aceites 20w50'], sing: ['litro de aceite', 'yamalube'], fem: false, noun: 'aceite' },
  bateria:   { plural: ['baterías', 'baterias', 'baterías kobe'], sing: ['batería', 'bateria kobe'], fem: true, noun: 'batería' },
  llanta:    { plural: ['llantas', 'yantas', 'llantas cst'], sing: ['llanta', 'llanta cst'], fem: true, noun: 'llanta' }
};

/* sku -> { kind, sizeWords (null = único de su kind) }.
   El tamaño para cemento/gypsum/tabla/aceite no existe: son únicos. */
const SKUS = {
  'TUB-PVC-12':  { kind: 'tubo', size: PIPE_SIZE['1/2'] },
  'TUB-PVC-1':   { kind: 'tubo', size: PIPE_SIZE['1'] },
  'TUB-PVC-2':   { kind: 'tubo', size: PIPE_SIZE['2'] },
  'CODO-PVC-12': { kind: 'codo', size: PIPE_SIZE['1/2'] },
  'CODO-PVC-1':  { kind: 'codo', size: PIPE_SIZE['1'] },
  'TEE-PVC-12':  { kind: 'tee',  size: PIPE_SIZE['1/2'] },
  'TEE-PVC-1':   { kind: 'tee',  size: PIPE_SIZE['1'] },
  'PEG-PVC-18':  { kind: 'pegamento', size: ['1/8', 'un octavo', '1/8 de galón', 'octavo'] },
  'PEG-PVC-14':  { kind: 'pegamento', size: ['1/4', 'un cuarto', '1/4 de galón', 'cuarto'] },
  'CEM-BULTO-25':{ kind: 'cemento', size: null },
  'CLA-2':       { kind: 'clavo', size: ['2', '2"', '2 pulgadas', 'dos pulgadas'] },
  'CLA-3':       { kind: 'clavo', size: ['3', '3"', '3 pulgadas', 'tres pulgadas'] },
  'CLA-4':       { kind: 'clavo', size: ['4', '4"', '4 pulgadas', 'cuatro pulgadas'] },
  'GYP-12-48':   { kind: 'gypsum', size: null },
  'PTA-MET-3T-CAFE':   { kind: 'puerta', size: ['3 tableros', 'café', '3 tableros café', 'color café'], sizePos: 'adj' },
  'PTA-MET-6T-BLANCA': { kind: 'puerta', size: ['6 tableros', 'blancas', 'blanca de 6 tableros', 'blanca'], sizePos: 'adj' },
  'PTA-MET-5T-CAOBA':  { kind: 'puerta', size: ['5 tableros', 'caoba', '5 tableros caoba', 'color caoba'], sizePos: 'adj' },
  'TAB-1X12X5':  { kind: 'tabla', size: null },
  'BON-PLUS-20': { kind: 'bondex', size: ['plus'], sizePos: 'adj' },
  'BON-CER-PREM-20': { kind: 'bondex', size: ['premium', 'de cerámica', 'pega cerámica'], sizePos: 'adj' },
  'ACE-YAM-20W50': { kind: 'aceite', size: null },
  'BAT-KOBE-12N65L': { kind: 'bateria', size: ['12N6', '12n6-5l', '12N6-5L'], sizePos: 'adj' },
  'BAT-KOBE-12N74B': { kind: 'bateria', size: ['12N7', '12n7-4b', '12N7-4B'], sizePos: 'adj' },
  'LLA-CST-C6571': { kind: 'llanta', size: ['C6571', 'c6571'], sizePos: 'adj' },
  'LLA-CST-C180':  { kind: 'llanta', size: ['C180', 'c180'], sizePos: 'adj' },
  'LLA-CST-C919':  { kind: 'llanta', size: ['C919', 'c919'], sizePos: 'adj' },
  'LLA-CST-C918':  { kind: 'llanta', size: ['C918', 'c918'], sizePos: 'adj' },
  'LLA-CST-C934':  { kind: 'llanta', size: ['C934', 'c934'], sizePos: 'adj' },
  'LLA-CST-C6520': { kind: 'llanta', size: ['C6520', 'c6520'], sizePos: 'adj' },
  'LLA-CST-C7204F':{ kind: 'llanta', size: ['C7204F', 'c7204f'], sizePos: 'adj' },
  'LLA-CST-C6559': { kind: 'llanta', size: ['C6559', 'c6559'], sizePos: 'adj' }
};
// Every priced SKU in the catalog must be reachable from the generator.
Object.keys(CAT.items).forEach(s => {
  if (CAT.items[s].precio !== null && !SKUS[s]) throw new Error('generator vocabulary missing priced SKU ' + s);
});
const kindsOf = k => Object.keys(SKUS).filter(s => SKUS[s].kind === k);
const MULTI = Object.keys(V).filter(k => kindsOf(k).length > 1);
const price = sku => CAT.items[sku].precio;

// Products the plomería / construction counter sells most. Weighted so the
// arcs look like the Leyva conversation, not a uniform sample of llantas.
const HOT = ['TUB-PVC-12', 'TUB-PVC-1', 'TUB-PVC-2', 'CODO-PVC-12', 'CODO-PVC-1', 'TEE-PVC-12', 'TEE-PVC-1',
             'CEM-BULTO-25', 'CLA-2', 'CLA-3', 'CLA-4', 'PEG-PVC-18', 'PEG-PVC-14', 'GYP-12-48'];

const WORDNUM = { 1: ['un', 'una', 'uno'], 2: ['dos'], 3: ['tres'], 4: ['cuatro'], 5: ['cinco'], 6: ['seis'], 7: ['siete'],
  8: ['ocho'], 9: ['nueve'], 10: ['diez'], 11: ['once'], 12: ['doce'], 15: ['quince'], 20: ['veinte'], 25: ['veinticinco'], 30: ['treinta'] };

const OFFCAT = [
  ['lámina de zinc', 'zinc'], ['manguera', 'manguera'], ['pintura', 'pintura'], ['tornillos', 'tornillo'],
  ['varilla', 'varilla'], ['arena', 'arena'], ['bloques', 'bloque'], ['cable eléctrico', 'cable'], ['inodoro', 'inodoro'],
  ['llave de chorro', 'llave de chorro'], ['plywood', 'plywood']
];

const INTERRUPT = [
  ['stock',    ['¿cuántos {k} tienen?', '¿tienen {k} en existencia?', '¿hay {k} en bodega?']],
  ['delivery', ['¿hacen entrega?', '¿me lo llevan a Sutiava?', '¿cobran flete?', '¿tienen envío a domicilio?']],
  ['chitchat', ['¿cómo está?', 'jaja qué calor hace', '¿quién ganó el partido?']],
  ['botq',     ['¿usted es un bot?', '¿con quién hablo?', '¿es una persona real?']],
  ['pricemath',['¿me hace un descuento?', '¿eso incluye IVA?', '¿me lo redondea?', '¿cuánto sería en dólares?']],
  ['offcat',   ['¿tienen {o}?', '¿venden {o}?', '¿manejan {o}?']],
  ['hours',    ['¿a qué hora cierran?', '¿dónde quedan?']]
];

const PREFIX = ['', '', '', 'deme ', 'ocupo ', 'quiero ', 'me da ', 'póngame ', 'necesito ', 'me manda ', 'apúnteme ', 'ocupo unos '];
const JOIN = [', ', ' y ', ', y ', ' más ', ' también ', '\n', ' + ', ', también '];

/* ---- CONVERSATION ------------------------------------------------------ */
function Gen(seed, opts) {
  opts = opts || {};
  const r = rng(seed);
  const HARD = !!opts.hard;
  const pick = a => a[Math.floor(r() * a.length)];
  const chance = p => r() < p;
  const feats = new Set();
  let cur = [];
  const F = f => { feats.add(f); cur.push(f); };

  function qtyWord(q) {
    if (WORDNUM[q] && chance(0.3)) { F('qty:word'); const w = pick(WORDNUM[q]); return w; }
    F('qty:digit'); return String(q);
  }
  function randQty() { return pick([1, 2, 2, 3, 3, 4, 5, 5, 6, 8, 10, 10, 12, 15, 20, 25, 30]); }

  /* Render one fully-specified item. Returns text; records grammar features. */
  /* One random edit (drop / swap / double a letter) on a noun of 6+
     letters — a thumb on a phone keyboard. Skips edits that land on a real
     Spanish word the store would have no reason to read as a product. */
  const REALWORDS = /^(puestas?|todos|todas|tablas|momento|comento|cuenta|cuento|siento|ciento|lamento)$/;
  function typo(w) {
    if (w.length < 6 || !/^[a-záéíóúñ]+$/.test(w)) return w;
    for (let tries = 0; tries < 5; tries++) {
      const i = 1 + Math.floor(r() * (w.length - 2)); const k = Math.floor(r() * 3);
      const t = k === 0 ? w.slice(0, i) + w.slice(i + 1) : k === 1 ? w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2) : w.slice(0, i) + w[i] + w.slice(i);
      if (t !== w && !REALWORDS.test(t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return t;
    }
    return w;
  }
  function hardItem(sku, qty) {
    // grammars never used while fixing the system — see the report
    const s = SKUS[sku], v = V[s.kind];
    const noun = qty === 1 ? pick(v.sing) : pick(v.plural.filter(x => !/^de |^\d/.test(x)));
    const size = !s.size ? '' : (s.sizePos === 'adj' ? ' ' + pick(s.size) : ' de ' + pick(s.size).replace(/^una$/, 'una pulgada'));
    const forms = [
      () => (F('hard:qty-after-comma'), noun + size + ', ' + qtyWord(qty)),
      () => (F('hard:qty-x'), noun + size + ' x' + pick(['', ' ']) + qty),
      () => (F('hard:inverted'), noun + size + ' ' + pick(['ocupo', 'quiero', 'necesito']) + ' ' + qtyWord(qty)),
      () => /clavo|cemento|aceite|gypsum/.test(s.kind) ? (F('hard:qty-after-comma'), noun + size + ', ' + qtyWord(qty))
                                                    : (F('hard:unidades'), qty + ' ' + pick(['unidades de', 'piezas de']) + ' ' + pick(v.sing) + size),
      () => (F('hard:typo'), qtyWord(qty) + ' ' + noun.split(' ').map((w, i) => i === 0 ? typo(w) : w).join(' ') + size)
    ];
    if (qty === 2 && s.kind !== 'clavo' && s.kind !== 'cemento') forms.push(() => (F('hard:par'), 'un par de ' + pick(v.plural.filter(x => !/^de |^\d/.test(x))) + size));
    if (qty === 6 && !/cemento|clavo|aceite/.test(s.kind)) forms.push(() => (F('hard:media-docena'), 'media docena de ' + pick(v.plural.filter(x => !/^de |^\d/.test(x))) + size));
    if (qty === 12 && !/cemento|clavo|aceite/.test(s.kind)) forms.push(() => (F('hard:docena'), 'una docena de ' + pick(v.plural.filter(x => !/^de |^\d/.test(x))) + size));
    return pick(forms)();
  }

  function itemText(sku, qty, o) {
    o = o || {};
    if (HARD && !o.noHard && r() < 0.3) return hardItem(sku, qty);
    const s = SKUS[sku], v = V[s.kind];
    let q = qty === 1 && !o.digitOne ? pick(v.fem ? ['una', '1'] : ['un', '1']) : qtyWord(qty);
    if (qty === 1 && /^(un|una|uno)$/.test(q) && s.kind === 'clavo') q = 'una';
    let noun = qty === 1 ? pick(v.sing) : pick(v.plural);
    if (s.kind === 'clavo' && qty === 1) noun = pick(v.sing);
    if (/de pvc|pvc/.test(noun)) F('gram:pvc-in-middle');
    if (/tuvos|codoz|bultoz|jipson|gipsum|yantas/.test(noun)) F('gram:typo');
    if (/tubitos|coditos|clavitos/.test(noun)) F('gram:diminutive');
    if (!s.size || o.noSize) return (o.noSize ? q + ' ' + noun : q + ' ' + noun).trim();
    let sz = pick(s.size);
    if (sz === 'una' || sz === '1' || sz === '2') F('size:bare-number');
    if (/"/.test(sz)) F('size:quote'); if (/pulg$/.test(sz)) F('size:pulg'); if (/pulgada/.test(sz)) F('size:pulgada');
    if (/media/.test(sz)) F('size:media'); if (sz === '½') F('size:unicode');
    if (s.sizePos === 'adj') return q + ' ' + noun + ' ' + (/^(de|color)/.test(sz) ? sz : (chance(0.5) ? 'de ' + sz : sz));
    if (sz === 'una') return q + ' ' + noun + ' de una';
    return q + ' ' + noun + (chance(0.15) && !/^\d/.test(sz) ? ' ' + sz : ' de ' + sz);
  }

  // ---- expected state (the spec model) ----
  const S = { cart: new Map(), removed: new Map(), pendSize: [], pendQty: null, phase: 'free', lastSku: null, stockAsk: null,
              docWanted: false, named: new Set(), docs: 0, mode: opts.mode || 'nuevo' };
  const turns = [];
  const cartSnap = () => Array.from(S.cart.entries()).map(([sku, qty]) => ({ sku, qty }));

  function push(text, act, exp) {
    turns.push(Object.assign({ text, act, cart: cartSnap(), phase: S.phase, pendSize: S.pendSize.map(p => Object.assign({}, p)),
                               named: Array.from(S.named), tags: cur.concat(['act:' + act]) }, exp || {}));
    cur = [];
    feats.add('act:' + act);
  }
  function maybeReconfirm() {
    // An edit while a document is in progress goes straight back to a
    // confirmation of the WHOLE cart — never to "¿qué le cambio?".
    if (S.docWanted && !S.pendSize.length && S.cart.size) { S.phase = 'confirm'; return true; }
    // everything removed AND nothing pending: the document request lapses.
    // With something still pending, the order is not empty — it stands.
    if (!S.cart.size) { S.phase = 'free'; if (!S.pendSize.length) S.docWanted = false; }
    return false;
  }

  function actAdd(nItems, op) {
    const pool = chance(0.8) ? HOT : Object.keys(SKUS);
    const chosen = [];
    while (chosen.length < nItems) {
      let sku = pick(pool);
      if (chosen.some(c => c.sku === sku)) continue;
      // same product in different sizes, in one message — the Leyva case
      if (chosen.length && chance(0.35)) {
        const k = SKUS[chosen[chosen.length - 1].sku].kind;
        const sib = kindsOf(k).filter(s => !chosen.some(c => c.sku === s));
        if (sib.length) { sku = pick(sib); F('gram:same-kind-multi-size'); }
      }
      chosen.push({ sku, qty: randQty() });
    }
    const voiceStyle = HARD && chance(0.2); if (voiceStyle) F('hard:voice-all-y');
    const parts = []; let prevKind = null;
    chosen.forEach((c, i) => {
      const s = SKUS[c.sku];
      // elliptical second item: "3 tubos de media y 2 de una"
      if (i > 0 && prevKind === s.kind && s.size && s.sizePos !== 'adj' && chance(0.5)) {
        let sz = pick(s.size); if (sz === 'una' || sz === '1') sz = pick(['una', '1"', '1 pulgada']);
        const qw = c.qty === 1 ? (V[s.kind].fem ? pick(['una', '1']) : pick(['uno', '1'])) : qtyWord(c.qty);
        parts.push(qw + ' de ' + sz); F('gram:ellipsis');
      } else parts.push(itemText(c.sku, c.qty));
      prevKind = s.kind;
    });
    let text = '';
    parts.forEach((p, i) => {
      if (i === 0) { text = p; return; }
      const j = HARD && voiceStyle ? ' y ' : pick(JOIN); F('join:' + JSON.stringify(j.trim() || '\\n'));
      text += j + p;
    });
    let pre = pick(PREFIX);
    if (/unos $/.test(pre) && (chosen[0].qty === 1 || !/^\d|^(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|veinticinco|treinta)\b/.test(parts[0]))) pre = 'ocupo ';
    if (op === 'inc') { pre = pick(['agrégueme ', 'súmele ', 'póngame también ', 'agrégale ']); F('op:inc-verb'); }
    text = pre + text;
    if (chance(0.15)) { text = text.charAt(0).toUpperCase() + text.slice(1); }
    if (chance(0.2)) text += pick([' por favor', ' porfa', '', ' pues']);
    let docToo = false;
    if (HARD && op !== 'inc' && S.phase === 'free' && !S.pendSize.length && chance(0.12)) {
      text += pick([' y hágame la proforma', ', con eso me hace la cotización', '. Mándeme la proforma']);
      F('hard:items+doc'); docToo = true;
    }
    F('n_items:' + nItems);
    chosen.forEach(c => {
      S.named.add(SKUS[c.sku].kind);
      if (op === 'inc') S.cart.set(c.sku, (S.cart.get(c.sku) || 0) + c.qty);
      else S.cart.set(c.sku, c.qty);
      S.removed.delete(c.sku);
      S.lastSku = c.sku;
    });
    S.pendQty = null;
    if (docToo) S.docWanted = true;
    const reconf = maybeReconfirm();
    // for an increment the line the customer must be able to check is the
    // RESULTING one — the mention carries the quantity now in the cart
    push(text, op === 'inc' ? 'add_inc' : (nItems > 1 ? 'add_many' : 'add_one'),
         { mentions: chosen.map(c => ({ sku: c.sku, qty: S.cart.get(c.sku), kind: SKUS[c.sku].kind })), expectConfirm: reconf });
  }

  function actAddMore() {           // "2 tubos de media más" / "otros 2 ..." on an existing line
    const inCart = Array.from(S.cart.keys());
    const sku = pick(inCart), q = randQty();
    const base = itemText(sku, q, { noHard: true });
    const t = chance(0.5) ? base + ' más' : 'otros ' + base.replace(/^\S+ /, (q === 1 ? '' : qtyWord(q) + ' '));
    const text = (chance(0.5) ? 'póngame ' : '') + (t.startsWith('otros') && q === 1 ? 'otro ' + base.replace(/^\S+ /, '') : t);
    if (!/^\S*\s*(otros?|\d|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta)/.test(text.replace(/^póngame /, ''))) { /* hard form slipped in */ }
    F('op:mas');
    S.cart.set(sku, S.cart.get(sku) + q); S.lastSku = sku;
    const reconf = maybeReconfirm();
    push(text, 'add_more', { mentions: [{ sku, qty: S.cart.get(sku), kind: SKUS[sku].kind }], expectConfirm: reconf });
  }

  function artFor(np) {
    const h = np.split(' ')[0];
    if (/^(gypsum|bondex|yamalube|cemento|pegamento)$/.test(h)) return 'el ';
    return /^(libras|lb|l[áa]minas|bolsas|planchas|puertas|tablas|bater[íi]as|llantas|yantas|tes|tees|T)$/.test(h) ? 'las ' : 'los ';
  }
  const REFN = k => V[k].plural.filter(x => !/^\d| de \d|de 1x12|20w50|de 25|^de cemento$|^tubo$|^pegamento$/.test(x));
  function refText(sku, kindOnly) {
    const s = SKUS[sku], v = V[s.kind];
    if (s.kind === 'cemento') return pick(['el cemento', 'los bultos', 'el cemento']);
    if (s.kind === 'gypsum') return pick(['el gypsum', 'las láminas', 'las láminas de gypsum']);
    const n = pick(REFN(s.kind));
    const art = artFor(n);
    if (kindOnly || !s.size) return art + n;
    let sz = pick(s.size);
    return art + n + (s.sizePos === 'adj' ? ' ' + sz : ' de ' + (sz === 'una' ? 'una' : sz));
  }

  function actRemove() {
    const inCart = Array.from(S.cart.keys());
    const sku = pick(inCart), kind = SKUS[sku].kind;
    if (HARD && S.cart.get(sku) > 2 && chance(0.25)) {
      const d = 1 + Math.floor(r() * (S.cart.get(sku) - 1));
      const text = pick(['quíteme ', 'saque ', 'rebájeme ']) + itemText(sku, d, { noHard: true, digitOne: true });
      F('hard:remove-qty');
      S.cart.set(sku, S.cart.get(sku) - d);
      const reconf = maybeReconfirm();
      push(text, 'remove_qty', { mentions: [{ sku, qty: S.cart.get(sku), kind }], expectConfirm: reconf });
      return;
    }
    if (HARD && chance(0.2)) {
      const sameK = inCart.filter(s => SKUS[s].kind === kind);
      if (sameK.length === 1) {
        const text = pick(['mejor sin ', 'sin ', 'déjelo sin ']) + refText(sku, true);
        F('hard:remove-sin');
        S.removed.set(sku, S.cart.get(sku)); S.cart.delete(sku);
        const reconf = maybeReconfirm();
        push(text, 'remove', { removed: [sku], expectConfirm: reconf, mentions: [] });
        return;
      }
    }
    const sameKind = inCart.filter(s => SKUS[s].kind === kind);
    const kindOnly = sameKind.length === 1 ? chance(0.6) : chance(0.3);
    const victims = kindOnly ? sameKind : [sku];
    const ref = refText(sku, kindOnly);
    const text = pick(['quíteme ', 'ya no quiero ', 'saque ', 'mejor quite ', 'elimine ', 'quitame ', 'bórreme ']) + ref;
    F('op:remove' + (kindOnly ? ':kind' : ':sku'));
    victims.forEach(v => { S.removed.set(v, S.cart.get(v)); S.cart.delete(v); });
    const reconf = maybeReconfirm();
    push(text, 'remove', { removed: victims, expectConfirm: reconf, mentions: [] });
  }

  function actReadd() {
    const sku = pick(Array.from(S.removed.keys()));
    const q = S.removed.get(sku);
    const text = pick(['ah no, vuelva a ponerme ', 'mejor sí póngame otra vez ', 'regréseme ', 'siempre sí, vuelva a poner ']) + refText(sku, false);
    F('op:readd');
    S.cart.set(sku, q); S.removed.delete(sku); S.lastSku = sku;
    const reconf = maybeReconfirm();
    push(text, 'readd', { mentions: [{ sku, qty: q, kind: SKUS[sku].kind }], expectConfirm: reconf, fromHistory: true });
  }

  function actSetQty() {
    const sku = pick(Array.from(S.cart.keys()));
    let q = randQty(); if (q === S.cart.get(sku)) q = q + 1;
    const ref = refText(sku, false);
    const tpl = pick(['mejor que sean {q} de {ref}', 'de {ref} póngame {q}', 'cámbieme {ref} a {q}', 'mejor {item}', '{ref} que sean {q}']);
    const text = tpl.replace('{q}', qtyWord(q)).replace('{ref}', ref.replace(/^(los|las|el) /, tpl.startsWith('de ') ? '$1 ' : '$1 ')).replace('{item}', itemText(sku, q))
                    .replace('de el ', 'del ');
    F('op:setqty');
    S.cart.set(sku, q); S.removed.delete(sku); S.lastSku = sku;
    const reconf = maybeReconfirm();
    push(text, 'set_qty', { mentions: [{ sku, qty: q, kind: SKUS[sku].kind }], expectConfirm: reconf });
  }

  function actChangeSize() {
    // only when the kind has exactly one line in the cart — otherwise
    // "mejor los tubos de 1 pulgada" is genuinely ambiguous
    const cands = Array.from(S.cart.keys()).filter(s => {
      const k = SKUS[s].kind; return MULTI.includes(k) && SKUS[s].size && SKUS[s].sizePos !== 'adj' &&
        !S.pendSize.some(p => p.kind === k) &&     // with a size question open on this kind, "mejor los de X" is ambiguous
        Array.from(S.cart.keys()).filter(x => SKUS[x].kind === k).length === 1;
    });
    if (!cands.length) return false;
    const from = pick(cands), kind = SKUS[from].kind;
    const to = pick(kindsOf(kind).filter(s => s !== from));
    const v = V[kind];
    const sz = pick(SKUS[to].size);
    const np = pick(REFN(kind));
    const text = pick(['mejor ', 'no, mejor ', 'mejor dicho ', 'cámbieme a ']) + artFor(np) + np + ' de ' + sz;
    F('op:size-change');
    const q = S.cart.get(from); S.cart.delete(from); S.cart.set(to, (S.cart.get(to) || 0) + q); S.removed.delete(to); S.lastSku = to;
    const reconf = maybeReconfirm();
    push(text, 'change_size', { mentions: [{ sku: to, qty: S.cart.get(to), kind }], expectConfirm: reconf });
    return true;
  }

  /* Fittings with no size take the size of the pipes already in the
     order when those pipes are all ONE size (and the reply says so). */
  function cartPipeInherit(kind) {
    if (kind !== 'codo' && kind !== 'tee') return null;
    const sizes = Array.from(new Set(Array.from(S.cart.keys()).filter(x => SKUS[x].kind === 'tubo')));
    if (sizes.length !== 1) return null;
    const suf = { 'TUB-PVC-12': '12', 'TUB-PVC-1': '1' }[sizes[0]];
    return suf ? (kind === 'codo' ? 'CODO-PVC-' : 'TEE-PVC-') + suf : null;
  }

  function actPartialSize() {       // "3 tubos" — kind + qty, size missing
    const kind = pick(MULTI.filter(k => ['tubo', 'codo', 'tee', 'pegamento', 'clavo', 'puerta'].includes(k)));
    const q = randQty(); const v = V[kind];
    const noun = q === 1 ? pick(v.sing) : pick(v.plural.filter(x => !/ de \d|de 1x12/.test(x)));
    const text = pick(PREFIX).replace(/unos $/, q === 1 ? '' : 'unos ') + qtyWord(q) + ' ' + noun;
    F('partial:size');
    S.named.add(kind);
    const inhC = cartPipeInherit(kind);
    if (inhC) {
      F('gram:inherited-size-cart');
      S.cart.set(inhC, q); S.removed.delete(inhC); S.lastSku = inhC;
      const reconf = maybeReconfirm();
      push(text, 'partial_size', { mentions: [{ sku: inhC, qty: q, kind, inherited: true }], expectConfirm: reconf });
      return;
    }
    const ex = S.pendSize.find(p => p.kind === kind);
    if (ex) ex.qty = q; else S.pendSize.push({ kind, qty: q });
    if (S.phase !== 'free') S.phase = 'free';
    push(text, 'partial_size', { mentions: [{ kind, qty: q, needs: 'size' }] });
  }

  function actMixedPartial() {      // full items + one missing size in ONE message
    const kind = pick(['tubo', 'codo', 'tee', 'pegamento', 'clavo']);
    const q = randQty(); const v = V[kind];
    const full = pick(HOT.filter(s => SKUS[s].kind !== kind)); const fq = randQty();
    const partial = qtyWord(q) + ' ' + (q === 1 ? pick(v.sing) : pick(v.plural.filter(x => !/ de \d/.test(x))));
    const parts = chance(0.5) ? [itemText(full, fq), partial] : [partial, itemText(full, fq)];
    const text = pick(PREFIX) + parts.join(pick(JOIN));
    F('partial:mixed');
    S.named.add(kind); S.named.add(SKUS[full].kind);
    const preInh = SKUS[full].kind === 'tubo' ? null : cartPipeInherit(kind);
    S.cart.set(full, fq); S.removed.delete(full); S.lastSku = full;
    /* A codo or T with no size, next to pipes of ONE size in the same
       message, takes that size — and the reply has to say so. That is a
       documented product rule (HANDOFF: "same-message diameter
       inheritance"), so the spec model carries it too. */
    const fullIsPipe = SKUS[full].kind === 'tubo';
    const fullSize = fullIsPipe ? { 'TUB-PVC-12': '12', 'TUB-PVC-1': '1' }[full] : null;
    // the pipe in THIS message decides; with no pipe in the message, the cart's pipes do
    const inh = (kind === 'codo' || kind === 'tee') ? (fullIsPipe ? (fullSize ? (kind === 'codo' ? 'CODO-PVC-' : 'TEE-PVC-') + fullSize : null) : preInh) : null;
    if (inh) {
      F('gram:inherited-size');
      S.cart.set(inh, q); S.removed.delete(inh); S.lastSku = inh;
      push(text, 'mixed_partial', { mentions: [{ sku: full, qty: fq, kind: SKUS[full].kind }, { sku: inh, qty: q, kind, inherited: true }] });
      return;
    }
    const ex = S.pendSize.find(p => p.kind === kind);
    if (ex) ex.qty = q; else S.pendSize.push({ kind, qty: q });
    if (S.phase !== 'free') S.phase = 'free';
    push(text, 'mixed_partial', { mentions: [{ sku: full, qty: fq, kind: SKUS[full].kind }, { kind, qty: q, needs: 'size' }] });
  }

  function actAnswerSize() {        // answer to "¿de qué medida?"
    const p = S.pendSize[0];
    const opts2 = kindsOf(p.kind);
    const sku = pick(opts2);
    const sz = pick(SKUS[sku].size);
    let text;
    const lastWasQtyQ = turns.length && (turns[turns.length - 1].act === 'price_query' || turns[turns.length - 1].interrupt === 'stock');
    if (S.pendSize.length === 1 && chance(0.6) && !(lastWasQtyQ && /^(\d|una?|uno|dos|tres|cuatro)\b/.test(sz))) {
      text = pick(['de ', V[p.kind].fem ? 'las de ' : 'los de ', '', 'que sean de ']) + sz;
      F('answer:bare-size');
    } else {
      // restate kind + size WITHOUT the quantity — the quantity is in the
      // history, and the system must use it rather than ask again
      const np = pick(REFN(p.kind));
      text = (chance(0.7) ? artFor(np) : '') + np + ' ' + (SKUS[sku].sizePos === 'adj' ? sz : 'de ' + sz);
      F('answer:kind+size-no-qty');
    }
    S.pendSize.shift();
    S.cart.set(sku, (S.cart.get(sku) || 0) + p.qty); S.removed.delete(sku); S.lastSku = sku;
    const reconf = maybeReconfirm();
    push(text, 'answer_size', { mentions: [{ sku, qty: S.cart.get(sku), kind: p.kind }], expectConfirm: reconf, fromHistory: true });
  }

  function actChangeSizeBare() {
    const from = S.lastSku;
    const kind = SKUS[from].kind;
    const to = pick(kindsOf(kind).filter(x => x !== from));
    const text = pick(['mejor de ', 'no, mejor de ', 'mejor que sean de ', 'mejor dicho de ']) + pick(SKUS[to].size).replace(/^una$/, 'una pulgada');
    F('op:size-change-bare');
    const q = S.cart.get(from); S.cart.delete(from); S.cart.set(to, (S.cart.get(to) || 0) + q); S.removed.delete(to); S.lastSku = to;
    const reconf = maybeReconfirm();
    push(text, 'change_size_bare', { mentions: [{ sku: to, qty: S.cart.get(to), kind }], expectConfirm: reconf });
  }

  function actAnswerStockQty() {
    const kind = S.stockAsk; S.stockAsk = null;
    const q = randQty();
    const text = pick(['', 'unos ', 'como ', 'deme ']) + qtyWord(q);
    F('answer:stock-qty');
    const skus = kindsOf(kind);
    if (skus.length === 1) {
      S.cart.set(skus[0], q); S.removed.delete(skus[0]); S.lastSku = skus[0];
      const reconf = maybeReconfirm();
      push(text, 'answer_stock_qty', { mentions: [{ sku: skus[0], qty: q, kind }], expectConfirm: reconf });
    } else {
      const ex = S.pendSize.find(p => p.kind === kind);
      if (ex) ex.qty = q; else S.pendSize.push({ kind, qty: q });
      push(text, 'answer_stock_qty', { mentions: [{ kind, qty: q, needs: 'size' }] });
    }
  }

  function actPriceQuery() {
    const sku = pick(HOT);
    const s = SKUS[sku], v = V[s.kind];
    let item = pick(v.sing);
    if (s.size) item += s.sizePos === 'adj' ? ' ' + pick(s.size) : ' de ' + pick(s.size).replace(/^una$/, 'una pulgada');
    const la = /^(libra|l[áa]mina|T|tee|puerta|tabla|bater[íi]a|llanta)\b/.test(item);
    const text = pick(['¿a cómo el ', '¿cuánto vale el ', '¿a cómo está el ', '¿qué precio tiene el ', '¿en cuánto está el ']).replace(/el $/, la ? 'la ' : 'el ') + item + '?';
    F('act:price_query');
    S.named.add(s.kind);
    S.pendQty = sku;
    push(text, 'price_query', { mentions: [{ sku, qty: null, kind: s.kind }] });
  }

  function actAnswerQty() {
    const sku = S.pendQty, q = randQty();
    const text = pick(['deme ', 'póngame ', '', 'como ', 'unos ', 'son ']) + qtyWord(q);
    F('answer:bare-qty');
    S.cart.set(sku, q); S.pendQty = null; S.removed.delete(sku); S.lastSku = sku;
    const reconf = maybeReconfirm();
    push(text, 'answer_qty', { mentions: [{ sku, qty: q, kind: SKUS[sku].kind }], expectConfirm: reconf });
  }

  function actRecall() {
    const kinds = Array.from(new Set(Array.from(S.cart.keys()).map(s => SKUS[s].kind)));
    const kind = pick(kinds); const v = V[kind];
    const np = pick(REFN(kind));
    const text = pick(['y ', '¿y ', '¿', 'y ']) + artFor(np) + np + pick(['?', '', ' ya me los puso?', '?']);
    F('act:recall');
    push(text, 'recall', { recallKind: kind, mentions: [] });
  }

  function actTotal(pending) {
    const text = pick(['¿cuánto llevo?', '¿cuánto va?', '¿cómo va la cuenta?', '¿cuánto llevo hasta ahorita?', 'cuanto es todo', '¿cuánto suma?']);
    if (pending) F('interrupt-during:' + pending);
    push(text, 'total', { mentions: [], reask: pending || null });
  }

  function actDoc() {
    const text = pick(['dame la proforma', 'ok, dame la proforma de todo', 'me arma la cotización', 'cotíceme todo', 'mándeme la proforma', 'hágame la proforma', 'páseme el presupuesto', 'ok mandame la cotizacion', 'eso es todo, hágame la proforma']);
    S.docWanted = true;
    let expect;
    if (S.pendSize.length) expect = 'ask_pending';
    else if (!S.cart.size) expect = 'ask_empty';
    else { expect = 'confirm'; S.phase = 'confirm'; }
    if (!S.cart.size && !S.pendSize.length) S.docWanted = false;
    push(text, 'doc', { expect, mentions: [] });
  }

  function actConfirm() {
    if (chance(0.3)) {
      const name = pick(['Constructora Herrera S.A.', 'Luis Herrera', 'Ferretería El Progreso', 'Construcciones Díaz']);
      push(pick(['sí, a nombre de ', 'correcto, a nombre de ', 'dale, a nombre de ']) + name, 'confirm_named', { expectDoc: true, name });
      S.phase = 'free'; S.docWanted = false; S.docs++;
      F('act:confirm_named');
    } else {
      push(pick(['sí', 'sí, así está bien', 'correcto', 'dale', 'va pues', 'ok sí', 'si']), 'confirm_yes', { mentions: [] });
      S.phase = 'name';
    }
  }

  function actName() {
    const name = pick(['a nombre de Luis Herrera', 'a nombre de Constructora Herrera S.A.', 'Ferretería El Progreso', 'a nombre de Construcciones Díaz']);
    push(name, 'give_name', { expectDoc: true });
    S.phase = 'free'; S.docWanted = false; S.docs++;
  }

  function actInterrupt(pending) {
    let [kind, tpls] = pick(INTERRUPT);
    if (pending && kind === 'offcat') [kind, tpls] = INTERRUPT[1];      // keep it a question, not a product
    let t = pick(tpls);
    let off = null;
    let askKind = null, askSku = null;
    if (/\{k\}/.test(t)) {
      const inCart = Array.from(S.cart.keys());
      const sku = inCart.length && chance(0.6) ? pick(inCart) : pick(HOT);
      askKind = SKUS[sku].kind; askSku = sku;
      t = t.replace('{k}', pick(V[SKUS[sku].kind].plural.filter(x => !/^\d| de \d|de 1x12|20w50|de 25/.test(x))));
      S.named.add(SKUS[sku].kind);
    }
    if (/\{o\}/.test(t)) { off = pick(OFFCAT); t = t.replace('{o}', off[0]); }
    F('interrupt:' + kind);
    if (pending) F('interrupt-during:' + pending);
    push(t, 'interrupt', { interrupt: kind, offcat: off ? off[1] : null, mentions: [], reask: pending || null, askKind });
    S.stockAsk = (!pending && kind === 'stock' && askKind && !Array.from(S.cart.keys()).some(x => SKUS[x].kind === askKind)) ? askKind : null;
  }

  function actMixedOffcat() {
    const sku = pick(HOT), q = randQty(), off = pick(OFFCAT);
    const parts = [itemText(sku, q), (chance(0.5) ? '1 ' : '2 ') + off[0]];
    if (chance(0.5)) parts.reverse();
    const text = pick(PREFIX) + parts.join(pick([', ', ' y ', '\n']));
    F('gram:mixed-offcat');
    S.named.add(SKUS[sku].kind);
    S.cart.set(sku, q); S.removed.delete(sku); S.lastSku = sku;
    const reconf = maybeReconfirm();
    push(text, 'mixed_offcat', { mentions: [{ sku, qty: q, kind: SKUS[sku].kind }], offcat: off[1], expectConfirm: reconf });
  }

  function actRepeatOrder() {
    push(pick(['lo mismo del mes pasado', 'lo mismo de la otra vez', 'repítame el pedido']), 'repeat_order', { mentions: [] });
    S.phase = 'repeatq';
  }
  function actRepeatYes() {
    // the seeded prior order becomes the cart, and the naming question follows
    (opts.seedOrder || []).forEach(l => S.cart.set(l.sku, (S.cart.get(l.sku) || 0) + l.qty));
    (opts.seedOrder || []).forEach(l => S.named.add(SKUS[l.sku].kind));
    S.phase = 'name'; S.docWanted = true;
    push(pick(['sí, las mismas', 'sí', 'dale, las mismas cantidades']), 'repeat_yes', { mentions: [] });
  }

  // "mejor de una pulgada" only makes sense about the line JUST touched,
  // with nothing pending, when that product comes in other sizes
  function canBareSize() {
    const last = turns[turns.length - 1];
    if (!last || !S.lastSku || !S.cart.has(S.lastSku) || S.pendSize.length || S.pendQty) return false;
    if (!['add_one', 'answer_qty', 'answer_size', 'set_qty', 'readd', 'change_size', 'change_size_bare', 'add_more'].includes(last.act)) return false;
    const s0 = SKUS[S.lastSku];
    return s0.size && s0.sizePos !== 'adj' && kindsOf(s0.kind).length > 1 && s0.kind !== 'pegamento';
  }

  // ---- the walk ----
  const len = 4 + Math.floor(r() * 17);            // 4..20
  if (chance(0.35)) push(pick(['Buenas', 'hola', 'Buenas tardes', 'buenos días']), 'greet', { mentions: [] });
  if (S.mode === 'vuelve' && chance(0.4)) actRepeatOrder();

  while (turns.length < len - 1) {
    const hasCart = S.cart.size > 0;
    if (S.phase === 'repeatq') { actRepeatYes(); continue; }
    if (S.phase === 'confirm') {
      const x = r();
      // a question in the middle of the confirmation: answered, and the
      // confirmation must still be standing afterwards
      if (chance(0.15)) { actInterrupt('confirm'); continue; }
      if (x < 0.65) actConfirm();
      else if (x < 0.8 && hasCart) actRemove();
      else if (x < 0.9) actAdd(1, 'set');
      else if (hasCart) actSetQty(); else actConfirm();
      continue;
    }
    if (S.phase === 'name') {
      if (chance(0.2)) { if (chance(0.4)) actTotal('name'); else actInterrupt('name'); continue; }
      actName(); continue;
    }
    // the stock question's "¿cuántos ocupa?" is answered on the very next turn or not at all
    const lastT = turns[turns.length - 1];
    if (S.stockAsk && S.phase === 'free' && lastT && lastT.interrupt === 'stock' && chance(0.5)) { actAnswerStockQty(); continue; }
    S.stockAsk = null;
    if (S.pendQty && chance(0.6) && turns[turns.length - 1].act === 'price_query') { actAnswerQty(); continue; }
    S.pendQty = null;
    if (S.pendSize.length && chance(0.6)) { actAnswerSize(); continue; }

    const w = [
      ['add1', 14], ['addN', 16], ['addMore', hasCart ? 4 : 0], ['inc', hasCart ? 3 : 0],
      ['remove', hasCart ? 6 : 0], ['readd', S.removed.size ? 5 : 0], ['setqty', hasCart ? 6 : 0],
      ['size', hasCart ? 4 : 0], ['partial', 6], ['mixedPartial', 5], ['price', 6],
      ['recall', hasCart ? 6 : 0], ['total', hasCart ? 5 : 1], ['doc', hasCart || S.pendSize.length ? 10 : 2],
      ['interrupt', 9], ['mixedOff', 3],
      ['sizeBare', canBareSize() ? 5 : 0]
    ];
    const tot = w.reduce((a, x) => a + x[1], 0);
    let x = r() * tot, a = null;
    for (const [n, wt] of w) { if ((x -= wt) < 0) { a = n; break; } }
    switch (a) {
      case 'add1': actAdd(1, 'set'); break;
      case 'addN': actAdd(2 + Math.floor(r() * 3), 'set'); break;
      case 'addMore': actAddMore(); break;
      case 'inc': actAdd(1 + Math.floor(r() * 2), 'inc'); break;
      case 'remove': actRemove(); break;
      case 'readd': actReadd(); break;
      case 'setqty': actSetQty(); break;
      case 'size': if (!actChangeSize()) actAdd(1, 'set'); break;
      case 'partial': actPartialSize(); break;
      case 'mixedPartial': actMixedPartial(); break;
      case 'price': actPriceQuery(); break;
      case 'recall': actRecall(); break;
      case 'total': actTotal(); break;
      case 'doc': actDoc(); break;
      case 'interrupt': actInterrupt(); break;
      case 'mixedOff': actMixedOffcat(); break;
      case 'sizeBare': actChangeSizeBare(); break;
    }
  }
  // Every conversation ends by asking for the running total, so the final
  // cart is checked against what the CUSTOMER sees, not only internal state.
  if (S.phase === 'free') actTotal();
  else if (S.phase === 'name') actName();
  else if (S.phase === 'confirm') actConfirm();

  // action bigrams = arc coverage
  for (let i = 1; i < turns.length; i++) F('arc:' + turns[i - 1].act + '>' + turns[i].act);
  return { seed, mode: S.mode, turns, finalCart: cartSnap(), feats: Array.from(feats) };
}

/* The exact conversation from the partner's screenshot, as a fixed script. */
function screenshot() {
  const full = [{ sku: 'TUB-PVC-12', qty: 3 }, { sku: 'TUB-PVC-1', qty: 2 }, { sku: 'CEM-BULTO-25', qty: 5 }];
  const named = ['tubo', 'cemento'];
  const T = (text, act, exp) => Object.assign({ text, act, cart: act === 'price_query_kind' ? [] : full, named, pendSize: [], tags: [] , mentions: [] }, exp || {});
  return {
    seed: 'screenshot', mode: 'nuevo', feats: [],
    turns: [
      T('¿a cómo el tubo pvc?', 'price_query_kind'),
      T('3 tubos de 1/2", 2 tubos de 1", 5 bultos de cemento', 'add_many',
        { mentions: [{ sku: 'TUB-PVC-12', qty: 3, kind: 'tubo' }, { sku: 'TUB-PVC-1', qty: 2, kind: 'tubo' }, { sku: 'CEM-BULTO-25', qty: 5, kind: 'cemento' }] }),
      T('ok, dame la proforma de todo', 'doc', { expect: 'confirm' }),
      T('sí', 'confirm_yes'),
      T('a nombre de Luis Herrera', 'give_name', { expectDoc: true }),
      T('y los tubos de pvc', 'recall', { recallKind: 'tubo' })
    ],
    finalCart: [{ sku: 'TUB-PVC-12', qty: 3 }, { sku: 'TUB-PVC-1', qty: 2 }, { sku: 'CEM-BULTO-25', qty: 5 }]
  };
}

module.exports = { Gen, screenshot, SKUS, V, price, kindsOf, CAT };
