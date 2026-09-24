/* ============================================================
   IGNEA LABS — Leyva demo: EL CARRITO

   LA CAUSA RAÍZ QUE ESTE ARCHIVO EXISTE PARA QUITAR: el sistema cotizaba
   lo que parseó en el turno actual y olvidaba el resto. En la reunión:
     cliente: 3 tubos de 1/2", 2 tubos de 1", 5 bultos de cemento
     bot:     cotizó los tubos de 1/2 y el cemento; el de 1" se perdió
              sin decirlo (la comilla se borraba, "de 1" quedaba ambiguo)
     cliente: dame la proforma de todo
     bot:     confirmó sin los tubos de 1"; el PDF salió sin ellos
     cliente: y los tubos de pvc
     bot:     "¿Qué le cambio?" — le pidió repetir lo de tres mensajes arriba
   Y el primer intento emitía un pedido de MUESTRA que nadie pidió.

   Aquí viven dos cosas y solo dos:

   1. extract(text) — de un mensaje saca TODAS las menciones de producto,
      cada una con cantidad y medida si las trae. Nunca devuelve menos de
      lo que el mensaje nombra: lo que no resuelve lo devuelve igual, como
      ambiguo o sin medida en catálogo, para que la respuesta lo pregunte
      por su nombre. Silencio parcial es el bug.

   2. El carrito — items [{sku, nombre, cantidad, precio_unitario,
      turno_de_entrada}]. Se actualiza, nunca se reconstruye a partir de un
      turno, y nunca se pierde porque un turno no parseó. ARRANCA VACÍO. La
      proforma sale de aquí y de ningún otro lado.

   Los precios se leen de LeyvaOrder.P (paridad con el catálogo asegurada
   por scripts/check-prices.js). Un SKU sin precio no existe en esa tabla,
   así que no puede entrar al carrito.
   ============================================================ */
var LeyvaCart = (function () {
  'use strict';

  var O = (typeof LeyvaOrder !== 'undefined') ? LeyvaOrder
        : (typeof require === 'function' ? require('./leyva-order.js') : null);

  /* ---- vocabulario ----------------------------------------------------- */
  var WN = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
    diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
    dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22, veinticinco: 25, treinta: 30,
    cuarenta: 40, cincuenta: 50, cien: 100 };

  /* Product nouns, after accent stripping. Explicit variants first; a
     one-edit fuzzy match catches the rest (see fuzzyKind). */
  var NOUN = [
    [/^tub(o|os|ito|itos)$|^tuvos$|^tuberias?$|^tubox$/, 'tubo'],
    [/^cod(o|os|ito|itos)$|^codoz$/, 'codo'],
    [/^pegamentos?$/, 'pegamento'],
    [/^cement(o|os)$|^cemeto$|^semento$/, 'cemento'],
    [/^clav(o|os|ito|itos)$/, 'clavo'],
    [/^(gypsum|gypsun|gipsum|gipsun|jipson|jipsum|yipsum|yeso|gybsum|gypsu|gyipsum)$/, 'gypsum'],
    [/^puertas?$/, 'puerta'],
    [/^tablas?$|^madera$/, 'tabla'],
    [/^(bondex|bondeks|bondes)$/, 'bondex'],
    [/^(aceites?|yamalube)$/, 'aceite'],
    [/^(baterias?|bateryas?|kobe)$/, 'bateria'],
    [/^(llantas?|yantas?|neumaticos?)$/, 'llanta']
  ];
  /* Words that measure rather than name. "5 libras de clavo" is ONE
     mention: the measure word joins the noun that follows "de". Alone,
     each implies the only thing the store sells that way — or stays open. */
  var MEASURE = [
    [/^bult(o|os|oz)$/, 'cemento'],
    [/^(bolsas?|sacos?)$/, null],             // cemento or bondex -> needs the noun
    [/^(libras?|lbs?|lb)$/, 'clavo'],
    [/^(laminas?|planchas?)$/, 'lamina'],     // gypsum or revestimiento
    [/^(galon|galones)$/, 'pegamento'],
    [/^litros?$/, 'aceite']
  ];
  var FUZZ = ['tubos', 'codos', 'cemento', 'pegamento', 'clavos', 'gypsum', 'puertas', 'tablas', 'bondex',
              'aceite', 'baterias', 'llantas', 'bultos', 'tubitos', 'coditos', 'clavitos', 'yamalube', 'puerta',
              'bateria', 'llanta', 'metalicas', 'yantas'];
  var FUZZ_KIND = { tubos: 'tubo', codos: 'codo', cemento: 'cemento', pegamento: 'pegamento', clavos: 'clavo',
                    gypsum: 'gypsum', puertas: 'puerta', tablas: 'tabla', bondex: 'bondex', aceite: 'aceite',
                    baterias: 'bateria', llantas: 'llanta', bultos: 'cemento', tubitos: 'tubo', coditos: 'codo',
                    clavitos: 'clavo', yamalube: 'aceite', puerta: 'puerta', bateria: 'bateria', llanta: 'llanta', yantas: 'llanta' };
  // Real words one edit away from a product noun. "dame todos" is not codos.
  var NOT_FUZZ = /^(todos|todas|cuantos|cuantas|puesta|puestas|puerto|puertos|momento|comento|cemente|lamento|siento|ciento|cuenta|cuento|precio|pedido|codigo|tomas|temas|bodega|nombre|lleva|llevan|llena|batea|abierta|cubitos|pepitos|galletas?)$/;

  /* Stocked but unpriced — named, never quoted, never in the cart. */
  var SINPRECIO = [
    [/^taladros?$/, 'el taladro Caterpillar'], [/^sierras?$/, 'la sierra circular Caterpillar'],
    [/^(rotomartillos?|martillos?)$/, 'el martillo giratorio Caterpillar'], [/^lijadoras?$/, 'la lijadora Caterpillar'],
    [/^cortadoras?$/, 'la cortadora Caterpillar'], [/^revestimiento$/, 'la lámina de revestimiento']
  ];

  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* Tokenise KEEPING what carries meaning. The old normaliser turned
     1" into "1" — and a bare "de 1" was then ambiguous, so the 1-inch
     pipes vanished from the order without a word. The inch mark is DATA. */
  function tokens(text) {
    var t = norm(text);
    t = t.replace(/½/g, ' 1/2 ').replace(/¼/g, ' 1/4 ').replace(/¾/g, ' 3/4 ');
    t = t.replace(/(\d)\s*(''|"|”|“|pulgadas?\b|pulg\b\.?|plg\b)/g, '$1 pulg ');
    t = t.replace(/\b(media|una|uno|dos|tres|cuatro)\s+(pulgadas?|pulg)\b/g, '$1 pulg');
    t = t.replace(/pulgadas?|pulg\.?/g, ' pulg ');
    t = t.replace(/["”“]/g, ' pulg ');
    // "tablas de 1 x 12" is a dimension, never a quantity — but "1/2 x5" is
    // a size followed by "times five". Only whole numbers on BOTH sides join.
    // Tablas are the only product with dimensions; anywhere else "2 x25" is a quantity.
    // "1 x 12" is the tabla's dimension, but "tubos de 1 x12" is twelve 1"
    // pipes. Which one it is depends on the product, so it is decided in
    // extract(), per mention — never here.
    t = t.replace(/[\n\r]+/g, ' , ').replace(/[¿?¡!;:()]/g, ' , ').replace(/\+/g, ' , ').replace(/,/g, ' , ');
    t = t.replace(/\.(?!\d)/g, ' , ');                           // 2.75 stays; a sentence period splits
    var tk = [];
    t.split(/\s+/).filter(Boolean).forEach(function (w) {
      var mx = w.match(/^x(\d{1,3})$/);                 // "x5" -> "x 5"
      if (mx) { tk.push('x'); tk.push(mx[1]); } else tk.push(w);
    });
    /* "3 tubos más 2 codos" / "diez bultos más libras de clavo": here "más"
       joins two items. "2 tubos más" (end of clause) is two MORE. Only a
       "más" that closes its clause is an increment. */
    return tk.map(function (w, i) {
      if (w !== 'mas') return w;
      var nx = tk[i + 1];
      return (!nx || SEP[nx] || /^(por|porfa|pues|favor|de)$/.test(nx)) ? w : ',';
    });
  }

  function lev1(a, b) {                     // true if Damerau-Levenshtein(a, b) <= 1
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
    if (la === lb) {
      if (a.slice(i + 1) === b.slice(i + 1)) return true;                        // substitution
      return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);  // transposition
    }
    return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }

  function nounKind(w) {
    for (var i = 0; i < NOUN.length; i++) if (NOUN[i][0].test(w)) return NOUN[i][1];
    /* One edit away from a product noun of 6+ letters: a thumb on a phone
       keyboard ("cemneto", "perta", "yamaalube"). Short nouns (tubo, codo)
       are too close to ordinary words to guess at; their typos are listed
       explicitly above. */
    if (w.length >= 5 && !NOT_FUZZ.test(w)) {
      var s = w.replace(/s$/, '');
      for (var j = 0; j < FUZZ.length; j++) {
        if (FUZZ[j].length < 6 || !FUZZ_KIND[FUZZ[j]]) continue;
        if (lev1(w, FUZZ[j]) || lev1(s, FUZZ[j].replace(/s$/, ''))) return FUZZ_KIND[FUZZ[j]];
      }
    }
    return null;
  }
  function measureKind(w) {
    for (var i = 0; i < MEASURE.length; i++) if (MEASURE[i][0].test(w)) return { kind: MEASURE[i][1] };
    return null;
  }
  function numOf(w) {
    if (/^\d{1,3}$/.test(w)) return parseInt(w, 10);
    return WN[w] !== undefined ? WN[w] : null;
  }

  var SEP = { ',': 1, y: 1, tambien: 1, ademas: 1, e: 1 };

  /* "T" is a letter as often as it is a part. It is the part only when a
     quantity precedes it, or PVC / a size follows it. */
  function isTee(tk, i) {
    var w = tk[i];
    if (!/^(t|te|tee|tees|tes|ts)$/.test(w)) return false;
    var prev = tk[i - 1], next = tk[i + 1], next2 = tk[i + 2];
    if (w === 'te' && !(prev && numOf(prev) !== null)) return false;       // "te doy" is not a part
    if (/^(tees|tes)$/.test(w)) return true;                                // plural: only ever the part here
    if (prev && (numOf(prev) !== null || /^(las|los|la|el|otras?|otros?|cuantos|cuantas|hay|unas|unos|de|tienen|tiene|manejan|maneja|venden|vende)$/.test(prev))) return true;
    if (next === 'pvc') return true;
    if (next === 'de' && next2 && /^(1\/2|media|medio|1|una|uno|2|dos|3\/4|pvc)$/.test(next2)) return true;
    return false;
  }

  /* ---- sizes, per kind ---------------------------------------------------
     Reads the tokens that follow the noun (and, for kinds named by an
     adjective, the ones before it). Returns a catalog size key, or
     {none: label} for a size the store does not carry. */
  function pipeSize(tk) {
    var s = ' ' + tk.join(' ') + ' ';
    s = s.replace(/ de 90 | 90 grados | a 90 /g, ' ');                   // the codo's angle, not a size
    if (/ (1\/2|media|medio) /.test(s)) return '1/2';
    if (/ (3\/4|tres cuartos) /.test(s)) return { none: '3/4' };
    if (/ 1 1\/2 | pulgada y media /.test(s)) return { none: '1 1/2' };
    if (/ (1|una|uno) pulg | de (1|una|uno) /.test(s) || /^ (1|una|uno) /.test(s)) return '1';
    if (/ (2|dos) pulg | de (2|dos) /.test(s) || /^ (2|dos) /.test(s)) return '2';
    if (/ (3|4|6) pulg | de (3|4|6) /.test(s)) { var m = s.match(/ (3|4|6) pulg | de (3|4|6) /); return { none: (m[1] || m[2]) + '"' }; }
    return null;
  }
  function sizeFor(kind, right, left) {
    var r = ' ' + right.join(' ') + ' ', l = ' ' + (left || []).join(' ') + ' ', both = l + r;
    switch (kind) {
      case 'codo':
        // the catalog codo is 90°. A 45° is a different part: refuse it by
        // name, never quote the 90° as if it were the one asked for.
        if (/ (de |a )?45( grados)? /.test(r)) return { none: '45°' };
        return pipeSize(right);
      case 'tubo': case 'tee': return pipeSize(right);
      case 'clavo': {
        var m = r.match(/ (?:de )?(2|3|4|dos|tres|cuatro)(?: pulg)? /);
        if (!m) { var mm = r.match(/ (?:de )?(\d)(?: pulg)? /); return mm ? { none: mm[1] + '"' } : null; }
        return { dos: '2', tres: '3', cuatro: '4' }[m[1]] || m[1];
      }
      case 'pegamento':
        if (/ (1\/8|octavo) /.test(both)) return '1/8';
        if (/ (1\/4|cuarto) /.test(both)) return '1/4';
        return null;
      case 'puerta':
        if (/ caf[e]? | 3 tableros /.test(both)) return '3';
        if (/ blancas? | 6 tableros /.test(both)) return '6';
        if (/ caoba | 5 tableros /.test(both)) return '5';
        if (/ madera | corredizas? /.test(both)) return { none: 'de madera' };
        return null;
      case 'bondex':
        if (/ plus /.test(both)) return 'plus';
        if (/ premium | ceramica /.test(both)) return 'prem';
        return null;
      case 'bateria':
        if (/12n7|12n74|\b74\b| 7-4/.test(both)) return '74';
        if (/12n6|12n65|\b65\b| 6-5/.test(both)) return '65';
        return null;
      case 'llanta': {
        var c = both.match(/\bc ?(\d{3,4}[a-z]?)\b/);
        if (c) return 'c' + c[1];
        var d = both.match(/(\d{2,3}\/\d{2}-\d{2}|\d\.\d{2}-\d{2})/);
        return d ? { dim: d[1] } : null;
      }
      default: return null;
    }
  }

  function prettySize(kind, sz) {
    if (!sz) return '';
    if (kind === 'tubo' || kind === 'codo' || kind === 'tee') return sz === '1' ? '1"' : sz === '2' ? '2"' : sz;
    return sz;
  }

  function resolve(kind, size) {
    if (kind === 'lamina') return { options: O.byKind('gypsum'), lamina: true };
    var opts = O.byKind(kind);
    if (!opts.length) return { options: [] };
    if (size && size.none) return { options: opts, none: size.none };
    if (size && size.dim) {
      var d = opts.filter(function (x) { return x.n.indexOf(size.dim) !== -1; });
      if (d.length === 1) return { sku: d[0].sku };
      return { options: d.length ? d : opts };
    }
    if (opts.length === 1) return { sku: opts[0].sku };
    if (size) {
      var m = opts.filter(function (x) { return x.size === size; });
      if (m.length === 1) return { sku: m[0].sku };
      if (!m.length) return { options: opts, none: size };
    }
    return { options: opts };
  }

  /* ---- extract ---------------------------------------------------------- */
  var REMOVE_RE = /^(quit\w*|quita\w*|saca\w*|saque\w*|elimin\w*|borr\w*|bor|remueva\w*|rebaj\w*)$/;
  var INC_RE = /^(agreg\w*|sumale|sumele|sumeme|anad\w*|otros?|otras?)$/;

  function extract(text) {
    var tk = tokens(text);
    var anchors = [];
    for (var i = 0; i < tk.length; i++) {
      var w = tk[i], k = nounKind(w), mk = null, sp = null;
      if (!k && isTee(tk, i)) k = 'tee';
      if (!k) mk = measureKind(w);
      if (!k && !mk) for (var s = 0; s < SINPRECIO.length; s++) if (SINPRECIO[s][0].test(w)) sp = SINPRECIO[s][1];
      // "pega" is the glue unless it is the verb ("se pega") or the tile adhesive ("pega cerámica")
      if (w === 'pega' && !/^(se|me|te|le|lo|nos|no)$/.test(tk[i - 1] || '') && !/^ceramica/.test(tk[i + 1] || '') && !/^ceramica/.test(tk[i + 2] || '')) { k = 'pegamento'; mk = null; }
      // "pega para tubo", "codos para el tubo de media": the noun after "para" is what it is FOR
      if ((k || mk) && (tk[i - 1] === 'para' || (/^(el|la|los|las)$/.test(tk[i - 1] || '') && tk[i - 2] === 'para')) &&
          anchors.length && !anchors[anchors.length - 1].sinprecio) { continue; }
      if (w === 'pega' && /^ceramica/.test(tk[i + 1] || '')) k = 'bondex';
      if (mk && tk[i + 1] === 'de' && /^[a-z]{3,}$/.test(tk[i + 2] || '') && tk[i + 2] !== 'pvc' &&
          !nounKind(tk[i + 2]) && !/^(revestimiento|marmol|galon|la|las|los|el)$/.test(tk[i + 2])) {
        continue;       // "lámina de zinc", "sacos de arena": a different product, left for the catalog guard
      }
      // "2 pegamentos de 1/8 de galón": the measure word after its own noun is part of it
      if (mk && anchors.length) {
        var pa = anchors[anchors.length - 1];
        var gap0 = tk.slice(pa.end + 1, i);
        if (!pa.measure && pa.kind === mk.kind && !gap0.some(function (g) { return SEP[g]; })) { continue; }
      }
      if (k || mk || sp) anchors.push({ i: i, end: i, kind: k || (mk && mk.kind), measure: !!mk, sinprecio: sp });
    }
    // Merge: measure word + "de" + noun, and same-kind noun pairs ("tablas de madera", "batería kobe").
    var merged = [];
    anchors.forEach(function (a) {
      var p = merged[merged.length - 1];
      if (p && !a.sinprecio && !p.sinprecio) {
        var gap = tk.slice(p.end + 1, a.i);
        var onlyDe = gap.every(function (g) { return g === 'de' || g === 'pvc' || g === 'del'; });
        if (onlyDe && (p.measure || p.kind === a.kind || (p.kind === 'lamina' && a.kind === 'gypsum'))) {
          p.end = a.i;
          if (!a.measure) { p.kind = a.kind; p.measure = false; }
          return;
        }
      }
      merged.push(a);
    });
    // "laminas de revestimiento" is the unpriced sheet, not an open lámina
    merged.forEach(function (a) {
      if (a.kind === 'lamina' && /^(revestimiento|marmol)$/.test(tk[a.end + 2] || '') ) { a.sinprecio = 'la lámina de revestimiento'; a.kind = null; }
    });

    var mentions = [];
    var bound = 0;                 // left limit for the next mention's quantity
    for (var m = 0; m < merged.length; m++) {
      var a = merged[m], nx = merged[m + 1];
      var rightEnd = nx ? nx.i : tk.length;
      // Carve the NEXT mention's quantity off the end of this one's right span.
      var nextQtyAt = -1;
      if (nx) {
        for (var j = nx.i - 1; j > a.end; j--) {
          var tj = tk[j];
          if (SEP[tj]) break;
          if (numOf(tj) !== null && tk[j - 1] !== 'de' && tk[j - 1] !== 'x' && !(tj === 'una' && tk[j - 1] === 'de')) { nextQtyAt = j; break; }
          if (!/^(de|del|pvc|mas|otros?|otras?|unos|unas|como|sean|que|y|me|deme|dame|pongame|le|les|los|las)$/.test(tj)) break;
        }
      }
      var cut = nextQtyAt !== -1 ? nextQtyAt : rightEnd;
      var right = [];
      for (var r = a.end + 1; r < cut; r++) { if (SEP[tk[r]]) break; right.push(tk[r]); }
      // quantity: nearest number to the LEFT, inside this mention's territory
      var qty = null, left = [];
      for (var q = a.i - 1; q >= bound; q--) {
        if (SEP[tk[q]] && tk[q] !== 'y') break;
        if (tk[q] === 'y') break;
        left.unshift(tk[q]);
        var n = numOf(tk[q]);
        if (n !== null && qty === null && tk[q - 1] !== 'de') {
          qty = n;
          if (tk[q - 1] === 'un' && tk[q] === 'par') qty = 2;
        }
      }
      var range = null;
      for (var rq = 0; rq + 2 < left.length; rq++) {
        if (numOf(left[rq]) !== null && left[rq + 1] === 'o' && numOf(left[rq + 2]) !== null) range = [numOf(left[rq]), numOf(left[rq + 2])];
      }
      if (range) qty = null;
      // "un par de codos", "media docena de tubos", "una docena de T"
      var lj = ' ' + left.join(' ') + ' ';
      if (/ (un )?par (de )?$/.test(lj)) qty = 2;
      else if (/ media docena (de )?$/.test(lj)) qty = 6;
      else if (/ (una )?docena (de )?$/.test(lj)) qty = 12;
      // trailing quantity: "de los tubos de media póngame 6", "cámbieme los codos a 10"
      /* The tabla's own dimension ("de 1 x 12", "de 1x12x5") is its name,
         not a size and not a quantity. Anywhere else "x 12" is a quantity. */
      var rightSpan = right.length;            // positions in tk, before any stripping below
      if (a.kind === 'tabla') {
        var rj = right.join(' ');
        var dm = rj.match(/^(de )?(1 x 12( x 5)?|1x12(x5)?)( |$)/);
        if (dm) right = rj.slice(dm[0].length).split(' ').filter(Boolean);
      }
      var trailing = null;
      if (qty === null) {
        for (var tq = right.length - 1; tq >= 0; tq--) {
          var nn = numOf(right[tq]);
          if (nn !== null && /^(a|sean|pongame|deme|dame|son|serian|van|como|unos|unas|ponga|ponme|mande|x|ocupo|quiero|necesito|llevo)$/.test(right[tq - 1] || '')) {
            trailing = nn; right = right.slice(0, tq - 1); break;
          }
        }
        /* "libras de clavo de 2, 5": the quantity as its own clause right
           after the product — ordinary phrasing, and dropping it silently is
           the original bug. */
        if (trailing === null) {
          var after = a.end + 1 + rightSpan, look = [];
          if (tk[after] === ',') {
            for (var la = after + 1; la < tk.length && !SEP[tk[la]]; la++) look.push(tk[la]);
            var lw = look.filter(function (x) { return !/^(como|unos|unas|son|serian|van|me|da|deme|pongame|porfa|pues|por|favor)$/.test(x); });
            if (lw.length === 1 && numOf(lw[0]) !== null) trailing = numOf(lw[0]);
          }
        }
        qty = trailing;
      }
      var refForm = trailing !== null || /^(de|del)$/.test(tk[a.i - 2] || '') && /^(los|las|el|la)$/.test(tk[a.i - 1] || '') && qty === null;
      var markMas = right[right.length - 1] === 'mas';
      if (markMas) right = right.slice(0, -1);

      if (a.sinprecio) {
        mentions.push({ sinprecio: a.sinprecio, start: a.i, end: a.end, qty: qty });
      } else {
        var size = sizeFor(a.kind, right, a.kind === 'pegamento' || a.kind === 'puerta' || a.kind === 'bondex' ||
                                            a.kind === 'bateria' || a.kind === 'llanta' ? left : null);
        var res = a.kind ? resolve(a.kind, size) : { options: [] };
        if (a.kind === null && a.measure) res = { options: O.byKind('cemento').concat(O.byKind('bondex')), bolsa: true };
        mentions.push({ kind: a.kind || 'bolsa', sku: res.sku || null, qty: qty, size: (size && !size.none && !size.dim) ? size : null,
                        none: res.none || null, options: res.options || null, lamina: !!res.lamina,
                        start: a.i, end: a.end + rightSpan, mas: markMas, ref: refForm, range: range,
                        leftWords: left, rightWords: right });
      }
      bound = nextQtyAt !== -1 ? nextQtyAt : Math.min(cut, a.end + 1 + rightSpan);
    }

    /* Ellipsis: "3 tubos de media y 2 de una" — a segment that is a
       quantity and a size with no noun belongs to the kind before it. */
    var segs = [], cur = [], segStart = 0;
    tk.forEach(function (w, idx) {
      if (SEP[w]) { segs.push({ w: cur, s: segStart }); cur = []; segStart = idx + 1; } else cur.push(w);
    });
    segs.push({ w: cur, s: segStart });
    segs.forEach(function (sg) {
      if (!sg.w.length) return;
      var covered = mentions.some(function (mn) { return mn.start >= sg.s && mn.start < sg.s + sg.w.length; });
      if (covered) return;
      // the product NEAREST before this clause, by position — not the last one pushed
      var prevM = null;
      mentions.forEach(function (mn) { if (mn.start < sg.s && mn.kind && !mn.sinprecio && (!prevM || mn.start > prevM.start)) prevM = mn; });
      if (!prevM) return;
      var w = sg.w.filter(function (x) { return !/^(me|deme|dame|pongame|y|otros?|otras?|unos|unas|mas|los|las|el|la)$/.test(x); });
      var eqty = null, rest;
      if (w.length >= 2 && numOf(w[0]) !== null) { eqty = numOf(w[0]); rest = w.slice(1); }
      else if (w.length >= 2 && w[0] === 'de') { rest = w; }           // "y de 3/4": a size, quantity said elsewhere
      else return;
      if (rest[0] !== 'de' && !/^(1\/2|media|pulg|1\/8|1\/4)$/.test(rest[0])) return;
      var sz = sizeFor(prevM.kind, rest, rest);
      if (!sz) return;
      var rs = resolve(prevM.kind, sz);
      mentions.push({ kind: prevM.kind, sku: rs.sku || null, qty: eqty, size: sz.none ? null : sz, none: rs.none || null,
                      options: rs.options || null, start: sg.s, end: sg.s + sg.w.length - 1, ellipsis: true,
                      mas: /(^| )mas( |$)/.test(sg.w.join(' ')), leftWords: [], rightWords: rest });
    });
    mentions.sort(function (x, y) { return x.start - y.start; });
    var cada = (' ' + tk.join(' ') + ' ').match(/ (\S+) (de )?cada (uno|una)s? /);
    if (cada && numOf(cada[1]) !== null) {
      mentions.forEach(function (x) { if (x.qty === null && !x.range && !x.sinprecio) { x.qty = numOf(cada[1]); x.cada = true; } });
    }

    /* Same-message diameter inheritance for fittings: "10 tubos de media y
       5 codos" — the codos are read as 1/2 too, and the reply SAYS so. Only
       when every pipe in the message is the same size; otherwise it is a
       question. */
    var pipeSizes = mentions.filter(function (x) { return x.kind === 'tubo' && x.size; })
                            .map(function (x) { return x.size; })
                            .filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    if (pipeSizes.length === 1) {
      mentions.forEach(function (x) {
        if ((x.kind === 'codo' || x.kind === 'tee') && !x.sku && !x.size && !x.none) {
          var rs = resolve(x.kind, pipeSizes[0]);
          if (rs.sku) { x.sku = rs.sku; x.inferido = pipeSizes[0]; x.options = null; }
        }
      });
    }

    /* Operation per mention, scoped by clause. A removal verb governs the
       mentions after it until an add-verb opens a new clause: "quíteme los
       codos y el cemento" removes both; "quíteme los codos y póngame 5
       tubos" removes one and adds the other. */
    /* An add-verb at the head of the message ("súmele 25 codos de 1 y un
       codo de 1/2") governs every item in it, like a removal verb does.
       "otro"/"otros" is local to the item it precedes. */
    var removeFrom = -1, incFrom = [], incAll = false;
    tk.forEach(function (w, idx) {
      if (removeFrom === -1 && REMOVE_RE.test(w)) removeFrom = idx;
      if (removeFrom === -1 && w === 'sin' && /^(el|la|los|las)$/.test(tk[idx + 1] || '')) removeFrom = idx;   // "mejor sin el cemento"
      if (removeFrom === -1 && w === 'no' && tk[idx - 1] === 'ya' && /^(quiero|ocupo|va|lleve|me)$/.test(tk[idx + 1] || '')) removeFrom = idx + 1;
      if (INC_RE.test(w)) incFrom.push(idx);
      if (idx <= 2 && (/^(agreg\w*|sumale|sumele|anad\w*)$/.test(w) || (w === 'tambien' && /^(pongame|ponga|ponme|deme)$/.test(tk[idx - 1] || '')))) incAll = true;
    });
    // "póngame otro lámina de gypsum": one more
    mentions.forEach(function (x) {
      if (x.qty === null && /^(otro|otra)$/.test(tk[x.start - 1] || '')) { x.qty = 1; x.mas = true; }
    });
    mentions.forEach(function (x) {
      if (removeFrom !== -1 && x.start > removeFrom) {
        var between = tk.slice(removeFrom + 1, x.start);
        var addVerb = between.some(function (b) { return /^(pongame|ponga|ponme|agreg\w*|deme|dame|ocupo|quiero|mande|necesito|anote\w*|apunte\w*)$/.test(b); });
        if (!addVerb) { x.op = 'remove'; return; }
      }
      if (x.mas || incAll || (x.leftWords || []).indexOf('mas') !== -1 ||
          incFrom.some(function (ii) { return ii < x.start && x.start - ii <= 4; })) { x.op = 'inc'; return; }
      x.op = 'set';
    });

    var words = ' ' + tk.join(' ') + ' ';
    return {
      tokens: tk, mentions: mentions,
      change: /\b(mejor|cambi\w*|en vez|en lugar|mejor dicho|que sean)\b/.test(words),
      readd: /\b(vuelva a|otra vez|regres\w*|siempre si|devuelva|de nuevo)\b/.test(words),
      remove: removeFrom !== -1
    };
  }

  /* A message that is only a size — the answer to "¿de qué medida?".
     Returns the raw tokens; the caller reads the size FOR THE KIND it is
     waiting on. A quantity counts only in the shape "5 de media": in
     "de 5 tableros" the 5 is the size. */
  function bareSize(text) {
    var raw = tokens(text).filter(function (w) { return !SEP[w]; });
    var content = raw.filter(function (w) { return !/^(los|las|el|la|que|sean|son|de|mejor|pues|ok|si|va|dale|y|pongame|deme|me|porfa|por|favor)$/.test(w); });
    if (!content.length || content.length > 4) return null;
    var qty = null;
    if (raw.length > 2 && numOf(raw[0]) !== null && raw[1] === 'de') qty = numOf(raw[0]);
    return { qty: qty, raw: raw };
  }

  /* A message that is only a quantity — the answer to "¿cuántos ocupa?". */
  var BAREQTY_RE = /^\s*(?:ah\s+)?(?:y\s+)?(?:tambien\s+)?(?:me\s+)?(?:deme|dame|ponme|pongame|mande|quiero|ocupo|son|serian|como|unos|unas|van|lleveme|que sean|sean)?\s*(\d{1,3}|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|veinticinco|treinta|cuarenta|cincuenta|cien)\s*(por favor|porfa|pues)?\s*$/;
  function bareQty(text) {
    var m = norm(text).replace(/[¿?¡!.,]/g, ' ').replace(/\s+/g, ' ').trim().match(BAREQTY_RE);
    if (!m) return null;
    var n = numOf(m[1]);
    return n > 0 ? n : null;
  }

  /* ---- the cart ----------------------------------------------------------
     A plain store. It knows nothing about conversation; the responder in
     leyva-demo.js decides WHAT to do, and every change goes through here. */
  var items = [];
  var turno = 0;

  function row(sku) { return O.bySku(sku); }
  function find(sku) { for (var i = 0; i < items.length; i++) if (items[i].sku === sku) return items[i]; return null; }

  function set(sku, qty) {
    var r = row(sku); if (!r || !(qty > 0)) return null;
    var it = find(sku);
    if (it) { it.cantidad = qty; return it; }
    it = { sku: sku, nombre: r.n, cantidad: qty, precio_unitario: r.p, turno_de_entrada: turno };
    items.push(it);
    return it;
  }
  function add(sku, qty) { var it = find(sku); return set(sku, (it ? it.cantidad : 0) + qty); }
  function remove(sku) {
    var it = find(sku); if (!it) return null;
    items = items.filter(function (x) { return x !== it; });
    return it;
  }
  function list() {
    return items.map(function (x) {
      return { sku: x.sku, nombre: x.nombre, cantidad: x.cantidad, precio_unitario: x.precio_unitario,
               turno_de_entrada: x.turno_de_entrada, total: x.precio_unitario * x.cantidad };
    });
  }
  function total() { return items.reduce(function (a, x) { return a + x.precio_unitario * x.cantidad; }, 0); }
  function clear() { items = []; turno = 0; }
  function tick() { turno++; return turno; }

  return { extract: extract, bareSize: bareSize, bareQty: bareQty, tokens: tokens, sizeFor: sizeFor, resolve: resolve,
           prettySize: prettySize, nounKind: nounKind,
           set: set, add: add, remove: remove, find: find, list: list, total: total, clear: clear, tick: tick,
           turno: function () { return turno; } };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaCart; }
