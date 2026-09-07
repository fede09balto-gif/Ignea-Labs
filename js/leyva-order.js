/* ============================================================
   IGNEA LABS — Leyva demo: quantities, unit prices and totals

   THE RULE THIS FILE EXISTS FOR, in Fede's words: "Nunca un total sin
   el unitario. El ferretero tiene que poder verificar la cuenta
   mentalmente." A total he cannot check is worse than no total — he
   has to trust it, and the first time it is wrong he stops trusting
   all of it.

   So every priced answer carries BOTH numbers, and the total is
   always qty x unit computed here, never phrased by a model.

   PARITY: the table below mirrors the priced half of
   api/_data/leyva-catalog.json. scripts/check-prices.js asserts every
   price, name and unit matches the catalog and that no priced SKU is
   missing. A drift here would mean the offline path quotes one number
   and the online path another — the demo lying to itself.

   NULL-PRICED ITEMS ARE ABSENT BY CONSTRUCTION. There is no row here
   for anything the catalog has no price for, so this file physically
   cannot quote one.
   ============================================================ */

var LeyvaOrder = (function () {
  'use strict';

  /* kind = what a customer calls it; size = which one of that kind.
     A product with siblings and no size given is AMBIGUOUS and gets
     asked about — never silently resolved to the cheapest or the first. */
  var P = [
    { sku:'TUB-PVC-12',      kind:'tubo',      size:'1/2', n:'tubo PVC de 1/2"',                    u:'unidad', p:168, g:'m', corto:'tubo de 1/2' },
    { sku:'TUB-PVC-1',       kind:'tubo',      size:'1',   n:'tubo PVC de 1"',                      u:'unidad', p:310, g:'m', corto:'tubo de 1' },
    { sku:'TUB-PVC-2',       kind:'tubo',      size:'2',   n:'tubo PVC de 2"',                      u:'unidad', p:740, g:'m', corto:'tubo de 2' },
    { sku:'CODO-PVC-12',     kind:'codo',      size:'1/2', n:'codo PVC de 1/2"',                    u:'unidad', p:14, g:'m', corto:'codo de 1/2' },
    { sku:'CODO-PVC-1',      kind:'codo',      size:'1',   n:'codo PVC de 1"',                      u:'unidad', p:32, g:'m', corto:'codo de 1' },
    { sku:'TEE-PVC-12',      kind:'tee',       size:'1/2', n:'T PVC de 1/2"',                       u:'unidad', p:18, g:'f', corto:'T de 1/2' },
    { sku:'TEE-PVC-1',       kind:'tee',       size:'1',   n:'T PVC de 1"',                         u:'unidad', p:42, g:'f', corto:'T de 1' },
    { sku:'PEG-PVC-18',      kind:'pegamento', size:'1/8', n:'pegamento PVC industrial de 1/8',     u:'galón',  p:165, g:'m', corto:'pegamento de 1/8' },
    { sku:'PEG-PVC-14',      kind:'pegamento', size:'1/4', n:'pegamento PVC industrial de 1/4',     u:'galón',  p:285, g:'m', corto:'pegamento de 1/4' },
    { sku:'CEM-BULTO-25',    kind:'cemento',   size:null,  n:'bulto de cemento de 25 kg',           u:'bulto',  p:235, g:'m', corto:'bulto de cemento' },
    { sku:'CLA-2',           kind:'clavo',     size:'2',   n:'clavo de 2"',                         u:'libra',  p:34, g:'m', corto:'libra de clavo de 2' },
    { sku:'CLA-3',           kind:'clavo',     size:'3',   n:'clavo de 3"',                         u:'libra',  p:33, g:'m', corto:'libra de clavo de 3' },
    { sku:'CLA-4',           kind:'clavo',     size:'4',   n:'clavo de 4"',                         u:'libra',  p:35, g:'m', corto:'libra de clavo de 4' },

    { sku:'GYP-12-48',       kind:'gypsum',    size:null,  n:'lámina de gypsum 1/2" x 4x8',         u:'lámina', p:370,  antes:400, g:'f', corto:'lámina de gypsum' },
    { sku:'PTA-MET-3T-CAFE', kind:'puerta',    size:'3',   n:'puerta metálica 3 tableros café',     u:'unidad', p:4260, antes:4761, g:'f', corto:'puerta de 3 tableros café' },
    { sku:'PTA-MET-6T-BLANCA',kind:'puerta',   size:'6',   n:'puerta metálica blanca 6 tableros',   u:'unidad', p:4260, antes:4761, g:'f', corto:'puerta blanca de 6 tableros' },
    { sku:'PTA-MET-5T-CAOBA',kind:'puerta',    size:'5',   n:'puerta metálica 5 tableros caoba',    u:'unidad', p:4140, antes:4792, g:'f', corto:'puerta de 5 tableros caoba' },
    { sku:'TAB-1X12X5',      kind:'tabla',     size:null,  n:'tabla 1" x 12 x 5"',                  u:'unidad', p:1050, antes:1150, g:'f', corto:'tabla' },
    { sku:'BON-PLUS-20',     kind:'bondex',    size:'plus',n:'Bondex Plus de 20 kg',                u:'saco',   p:185, g:'m', corto:'saco de Bondex Plus' },
    { sku:'BON-CER-PREM-20', kind:'bondex',    size:'prem',n:'Bondex Pega Cerámica Premium de 20 kg',u:'saco',  p:230, g:'m', corto:'saco de Bondex Premium' },
    { sku:'ACE-YAM-20W50',   kind:'aceite',    size:null,  n:'aceite Yamalube 20W-50 4T',           u:'litro',  p:277, g:'m', corto:'litro de Yamalube' },
    { sku:'BAT-KOBE-12N65L', kind:'bateria',   size:'65',  n:'batería Kobe 12N6-5L-BS-GEL',         u:'unidad', p:663, g:'f', corto:'batería 12N6-5L' },
    { sku:'BAT-KOBE-12N74B', kind:'bateria',   size:'74',  n:'batería Kobe 12N7-4B-GEL',            u:'unidad', p:816, g:'f', corto:'batería 12N7-4B' },
    { sku:'LLA-CST-C6571',   kind:'llanta',    size:'c6571',n:'llanta CST C6571 2.75-17 6PR',       u:'unidad', p:1206, g:'f', corto:'llanta C6571' },
    { sku:'LLA-CST-C180',    kind:'llanta',    size:'c180', n:'llanta CST C180 3.00-18',            u:'unidad', p:1205, g:'f', corto:'llanta C180' },
    { sku:'LLA-CST-C919',    kind:'llanta',    size:'c919', n:'llanta CST C919 2.75-18 TL',         u:'unidad', p:1132, g:'f', corto:'llanta C919' },
    { sku:'LLA-CST-C918',    kind:'llanta',    size:'c918', n:'llanta CST C918 90/90-17 TL',        u:'unidad', p:1626, g:'f', corto:'llanta C918' },
    { sku:'LLA-CST-C934',    kind:'llanta',    size:'c934', n:'llanta CST C934 90/90-17 TL',        u:'unidad', p:1626, g:'f', corto:'llanta C934' },
    { sku:'LLA-CST-C6520',   kind:'llanta',    size:'c6520',n:'llanta CST C6520 90/90-18 TL',       u:'unidad', p:1626, g:'f', corto:'llanta C6520' },
    { sku:'LLA-CST-C7204F',  kind:'llanta',    size:'c7204f',n:'llanta CST C7204F 3.00-18 TL',      u:'unidad', p:1445, g:'f', corto:'llanta C7204F' },
    { sku:'LLA-CST-C6559',   kind:'llanta',    size:'c6559',n:'llanta CST C6559 110/90-17',         u:'unidad', p:2109, g:'f', corto:'llanta C6559' }
  ];

  function money(v) { return 'C$' + Number(v).toLocaleString('en-US'); }

  /* Grammatical gender, carried as data rather than guessed from endings.
     "la bulto" and "el lámina" read as written by a foreigner, which undoes
     the entire point of the counter-voice work. */
  var UNIT_G = { 'unidad':'f', 'lámina':'f', 'libra':'f', 'bulto':'m', 'saco':'m', 'litro':'m', 'galón':'m' };
  function unitGender(u) { return UNIT_G[u] || 'f'; }

  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/["”“]/g, ' ').replace(/[¿?¡!.;:]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  var WORDNUM = { un:1, una:1, uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8,
                  nueve:9, diez:10, once:11, doce:12, trece:13, catorce:14, quince:15, dieciseis:16,
                  diecisiete:17, dieciocho:18, diecinueve:19, veinte:20, veinticinco:25, treinta:30,
                  cuarenta:40, cincuenta:50, cien:100 };

  /* Nicaraguan counter shorthand. "de media" is 1/2"; "de una" is 1". These
     are the words a maestro de obra actually says, and getting them wrong
     means quoting a C$740 pipe for a C$168 one. */
  var SIZEWORD = [
    { re: /\b(1\/2|media|medio)\b/,            size: '1/2' },
    { re: /\b(3\/4|tres cuartos)\b/,           size: '3/4' },
    { re: /\b(1|una|uno) ?(pulgada|pulg|")\b/, size: '1' },
    { re: /\b(2|dos) ?(pulgadas|pulgada|pulg|")\b/, size: '2' },
    { re: /\b1\/8|\boctavo\b/,                 size: '1/8' },
    { re: /\b1\/4|\bcuarto\b/,                 size: '1/4' }
  ];

  var KIND = [
    { kind:'tubo',      re:/\btubo?s?\b|\btuberia\b/ },
    { kind:'codo',      re:/\bcodos?\b/ },
    { kind:'tee',       re:/\b(tee?s?|t) (de |pvc)|\bte pvc\b|\bt pvc\b/ },
    { kind:'pegamento', re:/\bpegamentos?\b|\bpega pvc\b/ },
    { kind:'cemento',   re:/\bcementos?\b|\bbultos? de cemento\b/ },
    { kind:'clavo',     re:/\bclavos?\b/ },
    { kind:'gypsum',    re:/\bgypsum\b|\bgipsum\b|\bjipson\b|\byeso\b/ },
    { kind:'puerta',    re:/\bpuertas?\b/ },
    { kind:'tabla',     re:/\btablas?\b|\bmadera\b/ },
    { kind:'bondex',    re:/\bbondex\b|\bbondeks\b/ },
    { kind:'aceite',    re:/\baceites?\b|\byamalube\b/ },
    { kind:'bateria',   re:/\bbaterias?\b|\bkobe\b/ },
    { kind:'llanta',    re:/\bllantas?\b|\byantas?\b|\bneumaticos?\b/ }
  ];

  function byKind(kind) { return P.filter(function (x) { return x.kind === kind; }); }

  /* Quantity is the number BEFORE the product noun. A number AFTER "de" is a
     SIZE. "una libra de clavos de 3" is one pound of 3-inch nails, not three
     of something — get this backwards and every nail order is wrong. */
  function qtyBefore(seg, nounIdx) {
    var words = seg.split(' ');
    // FIRST number to the LEFT of the product noun. Scanning right-to-left with
    // a whitelist of connector words was wrong: "2 láminas de gypsum" matches on
    // "gypsum", and "láminas" was not in the whitelist, so the walk stopped and
    // the quantity was lost — the reply asked "¿cuántos ocupa?" to someone who
    // had just said two. Anything after the noun is a SIZE, so only the left
    // side is ever a quantity and the first number there is it.
    for (var i = 0; i < nounIdx; i++) {
      var w = words[i];
      if (/^\d{1,3}$/.test(w)) return parseInt(w, 10);
      if (WORDNUM[w] !== undefined) return WORDNUM[w];
    }
    return null;
  }

  function sizeIn(seg, kind) {
    if (kind === 'llanta') {
      var m = seg.match(/\bc ?(\d{3,4}[a-z]?)\b/);
      if (m) return 'c' + m[1];
    }
    if (kind === 'clavo' || kind === 'puerta') {
      var m2 = seg.match(/\bde (\d)\b|\bde (\d) ?(pulgadas?|")\b|\b(\d) tableros?\b/);
      if (m2) return m2[1] || m2[2] || m2[3];
    }
    if (kind === 'bondex') {
      if (/premium|ceramica/.test(seg)) return 'prem';
      if (/plus/.test(seg)) return 'plus';
    }
    if (kind === 'bateria') { if (/12n7|\b74?\b/.test(seg)) return '74'; if (/12n6|\b65?\b/.test(seg)) return '65'; }
    for (var i = 0; i < SIZEWORD.length; i++) if (SIZEWORD[i].re.test(seg)) return SIZEWORD[i].size;
    return null;
  }

  /* Split on commas and "y" so each product gets its own quantity.
     "10 tubos de media, 5 codos y 2 bultos de cemento" is three segments. */
  function segments(t) {
    return t.split(/\s*,\s*|\s+y\s+|\s+mas\s+|\s*\+\s*/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* Returns { lines, ambiguous, sum }.
       lines     — resolved, priced, with qty (qty null = no quantity given)
       ambiguous — kind matched but the size did not, with the options
     An ambiguous kind NEVER resolves itself. Picking one would be the same
     class of error as substituting across a category. */
  function parse(text, opts) {
    opts = opts || {};
    var t = norm(text);
    var segs = segments(t);
    var lines = [], ambiguous = [], inheritedSize = opts.inheritSize || null;

    segs.forEach(function (seg) {
      KIND.forEach(function (k) {
        if (!k.re.test(seg)) return;
        if (lines.some(function (l) { return l.seg === seg; })) return;
        var opts2 = byKind(k.kind);
        if (!opts2.length) return;
        var words = seg.split(' ');
        var nounIdx = 0;
        for (var i = 0; i < words.length; i++) { if (k.re.test(words[i])) { nounIdx = i; break; } }
        var qty = qtyBefore(seg, nounIdx);
        var size = sizeIn(seg, k.kind);

        var match = null;
        if (opts2.length === 1) match = opts2[0];
        else if (size) match = opts2.filter(function (x) { return x.size === size; })[0] || null;

        /* Same-message diameter inheritance, and it is STATED in the reply.
           "10 tubos de media, 5 codos" — a ferretero reads those codos as
           1/2 too. Inferring silently would be guessing; inferring and
           saying so is what a person at the counter does. */
        if (!match && !size && inheritedSize && (k.kind === 'codo' || k.kind === 'tee')) {
          match = opts2.filter(function (x) { return x.size === inheritedSize; })[0] || null;
          if (match) match = Object.assign({}, match, { inferido: inheritedSize });
        }

        if (!match) { ambiguous.push({ kind: k.kind, qty: qty, options: opts2 }); return; }
        if (!inheritedSize && (k.kind === 'tubo') && match.size) inheritedSize = match.size;
        lines.push({ seg: seg, sku: match.sku, n: match.n, u: match.u, unit: match.p,
                     antes: match.antes || null, qty: qty, inferido: match.inferido || null,
                     total: qty === null ? null : match.p * qty });
      });
    });

    var sum = lines.reduce(function (a, l) { return a + (l.total || 0); }, 0);
    return { lines: lines, ambiguous: ambiguous, sum: sum, inheritedSize: inheritedSize };
  }

  /* Pluralise the HEAD noun only: "tubo de 1/2" -> "tubos de 1/2". Fede's own
     wording for the confirmation line, and the reason it is a separate short
     form: repeating the full catalog name back ("10 tubo PVC potable de 1/2\"
     de 6 m") is the formulario tone rule B exists to avoid. */
  function plural(corto, qty) {
    if (qty === 1) return corto;
    var w = corto.split(' ');
    var h = w[0];
    w[0] = /[aeiouáéíóú]$/i.test(h) ? h + 's' : /[zZ]$/.test(h) ? h.slice(0, -1) + 'ces' : h + 'es';
    return w.join(' ');
  }

  function bySku(sku) { for (var i = 0; i < P.length; i++) if (P[i].sku === sku) return P[i]; return null; }
  function byKindPublic(kind) { return byKind(kind); }

  return { P: P, parse: parse, money: money, norm: norm, bySku: bySku, byKind: byKindPublic, KIND: KIND, SIZEWORDS: SIZEWORD, unitGender: unitGender, plural: plural };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaOrder; }
