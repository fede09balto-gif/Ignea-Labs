/* ============================================================
   IGNEA LABS — Demo privado: Ferretería Roberto Leyva
   Driven live by Luis Velázquez in front of a buyer. Read the
   constraint before changing anything here:

   IT CANNOT FAIL IN THAT ROOM. Store wifi, Nicaraguan mobile
   data, a phone passed between two people, no second meeting.

   Therefore the architecture is offline-first, not API-first:

     answer(text)
       ├─ local(text)          <- deterministic, zero network,
       │                          ALWAYS computed first
       └─ if online && !forced: race the API against a 4s timeout
            ├─ API wins  -> use the API reply
            └─ anything else (timeout, error, no key, bad shape,
               offline) -> silently use the local answer

   There is no spinner that can hang and no error state a buyer
   can see. The worst case is a slightly less flexible answer.

   PRICE INVARIANTS (mirror of api/claude.js's preset builder):
     · LOCAL_PRICES below contains ONLY items that have a real
       price. Null-priced items are not represented here at all,
       so the offline path has no number it could leak — the same
       guarantee the server gives the model, by construction.
     · Stock and delivery appear in neither path. We do not have
       them. Both paths escalate to the mostrador instead.
   ============================================================ */

var LeyvaDemo = (function () {
  'use strict';

  var API_TIMEOUT_MS = 4000;   // approved: 4s. probalo's 8s is too long live.
  var MAX_TOKENS = 200;        // counter replies are short

  /* ---- offline data ------------------------------------------------
     A deliberate subset of api/_data/leyva-catalog.json: priced items only.
     Kept small on purpose — this is the "it must answer with no
     network" set, not a mirror of the catalog. Null-priced items are
     absent by design, never with a placeholder. */
  /* `sku` is the join back to api/_data/leyva-catalog.json. Customer memory stores
     an order as {sku, qty} and NOTHING ELSE, so every price on a remembered
     order is resolved through this table at read time. That is what makes a
     stored order incapable of carrying a stale price. Keep these in sync with
     the catalog's keys — a typo here silently drops the line rather than
     mispricing it, which is the failure direction we want. */
  var LOCAL_PRICES = {
    gypsum:   { sku: 'GYP-12-48',         n: 'lámina de gypsum 1/2" x 4x8', p: 370, antes: 400 },
    puerta3:  { sku: 'PTA-MET-3T-CAFE',   n: 'puerta metálica 3 tableros café', p: 4260, antes: 4761 },
    puerta6:  { sku: 'PTA-MET-6T-BLANCA', n: 'puerta metálica blanca 6 tableros', p: 4260, antes: 4761 },
    puerta5:  { sku: 'PTA-MET-5T-CAOBA',  n: 'puerta metálica 5 tableros caoba', p: 4140, antes: 4792 },
    tabla:    { sku: 'TAB-1X12X5',        n: 'tabla 1" x 12 x 5"', p: 1050, antes: 1150 },
    bondex:   { sku: 'BON-PLUS-20',       n: 'Bondex Plus Cemex de 20 kg', p: 185 },
    bondexp:  { sku: 'BON-CER-PREM-20',   n: 'Bondex Pega Cerámica Premium de 20 kg', p: 230 },
    aceite:   { sku: 'ACE-YAM-20W50',     n: 'Yamalube 20W-50 4T de litro', p: 277 },
    bat65:    { sku: 'BAT-KOBE-12N65L',   n: 'batería Kobe 12N6-5L-BS-GEL', p: 663 },
    bat74:    { sku: 'BAT-KOBE-12N74B',   n: 'batería Kobe 12N7-4B-GEL', p: 816 },
    llanta17: { sku: 'LLA-CST-C6571',     n: 'CST C6571 2.75-17 6PR', p: 1206 },
    llanta90: { sku: 'LLA-CST-C918',      n: 'CST C918 90/90-17 TL', p: 1626 }
  };

  var CAT_TOOLS = {
    taladro: 'taladro de impacto Caterpillar DX161U de 850 W',
    sierra:  'sierra circular Caterpillar DX59U de 7-1/4" y 1400 W',
    martillo:'martillo giratorio Caterpillar SDS+ DX27U de 1500 W',
    lijadora:'lijadora orbital Caterpillar DX461U de 5"'
  };

  function money(v) { return 'C$' + Number(v).toLocaleString('en-US'); }

  /* ---- the offline responder ---------------------------------------
     Returns an array of bubbles — the same shape the API path returns,
     so the sequencer downstream cannot tell them apart. */
  /* Strip accents and collapse the spellings a real customer types on a
     phone keyboard. The offline path is keyword-matched, so without this a
     typo lands on "no lo manejo" — which is a lie about their stock, not a
     graceful degradation. Phonetic variants are Nicaraguan-realistic:
     gypsum is said "jipson", llanta is typed "yanta". */
  function norm(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!.,;:]/g, ' ')
      .replace(/\bjipso?n?\b|\bgipsum\b|\bgybsum\b|\byeso\b/g, 'gypsum')
      .replace(/\byanta\b|\bllanta\b|\bllantas\b|\byantas\b/g, 'llanta')
      .replace(/\bmetalika\b|\bmetalica\b|\bmetalik\b/g, 'metalica')
      .replace(/\bbateria\b|\bbateria\b|\bbatteria\b/g, 'bateria')
      .replace(/\bbondeks\b|\bbondex\b/g, 'bondex')
      .replace(/\s+/g, ' ').trim();
  }

  /* ---- customer memory bridge ---------------------------------------
     See js/leyva-memory.js and HANDOFF.md §0. Three things matter here:

     1. DECLARED facts may be stated back; DERIVED facts are OFFERED AS
        QUESTIONS. Every string below obeys that split — read them before
        editing one.
     2. NO GREETING BY NAME. Message one is "Buenas.", never
        "¡Buenas, don Marvin!". Phones get shared in a cuadrilla.
     3. Branches that touch a DOCUMENT or a STORED PROFILE are marked
        `localOnly` and never reach the model. A customer's legal name on a
        proforma, and a "borré sus datos" claim a buyer can check, are not
        things to route through a probabilistic path. The rail labels these
        "Determinista" rather than "Local" so the operator can say so out
        loud — it is a selling point, not an apology. */
  function M() { return (typeof LeyvaMemory !== 'undefined') ? LeyvaMemory : null; }

  /* Conversation state. Reset by leyva-chat.js's reset(). Deliberately NOT
     persisted: a half-finished naming question surviving a restart would put
     a stale name on the next document.

     THE ORDER ITSELF IS NOT HERE. It lives in LeyvaCart (js/leyva-cart.js),
     which is updated every turn and never rebuilt from one. What lives here
     is only the conversation around it:
       pendSize   — things he ordered WITH a quantity but whose size we could
                    not resolve. They persist until answered, and a proforma
                    cannot be issued while one is open: a document without
                    the thing he asked for is the original bug.
       pendQty    — the one product we just quoted without a quantity; a bare
                    "deme 12" on the NEXT turn lands on it, and only then.
       removed    — sku -> the quantity it had, so "vuelva a ponerme el
                    cemento" restores his number instead of asking for it.
       named      — every product kind the customer has named. Anything the
                    assistant says about a kind NOT in here is a phantom.
       docWanted  — he asked for the document; once nothing is pending, the
                    confirmation follows on its own instead of making him ask
                    again. */
  var ST = { awaitingName: false, awaitingQty: null, awaitingConfirm: false, nudged: false,
             uso: null, usoDicho: false, pendSize: [], pendQty: null, removed: {}, named: {},
             docWanted: false, lastSku: null, issued: {}, pendingName: null, stockAsk: null };
  function resetState() {
    ST.awaitingName = false; ST.awaitingQty = null; ST.awaitingConfirm = false;
    ST.nudged = false; ST.uso = null; ST.usoDicho = false;
    ST.pendSize = []; ST.pendQty = null; ST.removed = {}; ST.named = {}; ST.docWanted = false; ST.lastSku = null; ST.issued = {}; ST.pendingName = null; ST.stockAsk = null;
    if (C()) C().clear();
  }

  function memLines(order) {
    return order.lines.map(function (l) {
      return l.qty + ' ' + l.n + ' — ' + money(l.total);
    }).join('\n');
  }

  /* The open-proforma follow-up (their stated pain #2). OFFERED, never
     asserted, and fired at most once per conversation. The figure is
     recomputed from the catalog on every call — it is never read from
     storage, so it cannot be stale. */
  function openProformaNudge(replyText) {
    var m = M(); if (!m || ST.nudged) return null;
    /* Never an order THIS conversation issued. The document just sent is
       registered as open (so a later visit can follow up on it); reminding
       him of it one message later, with its figure, reads as the system not
       knowing what it just did. Found by the browser harness. */
    var open = m.abiertas().filter(function (o) { return !ST.issued[o.correlativo]; })[0];
    if (!open) return null;
    // The repeat-order branch already lists this exact proforma. Appending
    // "y quedó pendiente la PRO-2481" to a message that just itemised
    // PRO-2481 reads as a system that is not listening to itself.
    if (replyText && replyText.indexOf(open.correlativo) !== -1) return null;
    ST.nudged = true;
    return {
      bubbles: ['Ah, y quedó pendiente la ' + open.correlativo + ' por ' + money(open.total) + '.', '¿La activamos?'],
      rail: [
        'MEM|Pedido abierto ' + open.correlativo + ' del ' + m.fmtDate(open.fecha),
        'DER|Total ' + money(open.total) + ' recalculado hoy contra el catálogo',
        'Se ofrece como pregunta, no como afirmación'
      ]
    };
  }

  /* The naming question. This is the ONLY place a remembered name is spoken,
     because this is the only moment it is load-bearing. Staleness changes the
     wording, not the fact that we ask: a razón social we have not heard in
     eight months gets its age stated out loud. */
  function nameAsk() {
    var m = M();
    var rs = m && m.declared('razon_social');
    var nb = m && m.declared('nombre');
    if (rs) {
      if (rs.stale) {
        return { q: ['¿Todavía a nombre de ' + rs.v + '?', 'La tengo declarada desde ' + m.fmtDate(rs.at) + ', por eso le confirmo.'],
                 rail: ['MEM|Razón social: ' + rs.v + ' · declarada ' + m.fmtDate(rs.at),
                        'Declarada hace ' + rs.ageDays + ' días → se confirma, no se afirma'] };
      }
      return { q: ['¿Se la hago a nombre de ' + rs.v + '?'],
               rail: ['MEM|Razón social: ' + rs.v + ' · declarada ' + m.fmtDate(rs.at)] };
    }
    if (nb) {
      return { q: ['¿Se la hago a nombre suyo, ' + nb.v + ', o a una razón social?', 'Si es para empresa y me da el RUC, se la hago a la razón social.'],
               rail: ['MEM|Nombre: ' + nb.v + ' · declarado ' + m.fmtDate(nb.at),
                      'Sin razón social en memoria → se pregunta'] };
    }
    return { q: ['¿A nombre de quién se la hago?', '¿Es para empresa? Si me da el RUC se la hago a la razón social.'],
             rail: ['Sin datos del cliente en memoria', 'Se pregunta el nombre — no se deja en blanco'] };
  }

  /* Pull a name or a RUC out of the customer's answer to nameAsk(). Strict on
     purpose: anything it does not recognise falls through to "no entendí" and
     asks again, which is far better than writing a fragment of a sentence onto
     a document as if it were a company name. */
  var RUC_RE = /\b([JjEeGgNn]\d{13}|\d{3}-?\d{6}-?\d{4}[A-Za-z]?)\b/;

  function parseNameAnswer(raw) {
    var t = norm(raw);
    var out = { ruc: null, razon: null, nombre: null, confirm: false, decline: false };

    var rm = raw.match(RUC_RE);
    if (rm) out.ruc = rm[1].toUpperCase();

    if (/^(si|sii+|s|claro|dale|va|va pues|correcto|exacto|asi es|esa misma|la misma|el mismo|afirmativo|ok|okey|de acuerdo|asi mismo)\b/.test(t)) out.confirm = true;
    if (/^(no|nel|negativo)\b/.test(t) && !/^no,? a nombre/.test(t)) out.decline = true;

    // "a nombre de X", "a nombre mio", "para X", or a bare proper-noun answer.
    var nm = raw.match(/a\s+nombre\s+de\s+(.+)$/i) || raw.match(/^\s*(?:p[oa]ra|es\s+para)\s+(.+)$/i);
    var cand = nm ? nm[1] : null;
    if (!cand && !out.confirm && !out.decline && !out.ruc) {
      // A bare answer, e.g. "Constructora García S.A." — accept only if it
      // looks like a name: 1-6 words, at least one capitalised, no verbs.
      var bare = raw.trim();
      if (bare && bare.split(/\s+/).length <= 6 && /[A-ZÁÉÍÓÚÑ]/.test(bare) && !/\?/.test(bare)) cand = bare;
    }
    if (/a\s+nombre\s+m[íi]o|es\s+para\s+m[íi]|a\s+mi\s+nombre|personal/i.test(raw)) {
      out.nombre = true;
      cand = null;
    }
    if (cand) {
      // Strip trailing punctuation WITHOUT eating the final dot of an
      // abbreviation: "Constructora Peña S.A." must not become "S.A".
      cand = cand.replace(RUC_RE, '').replace(/\b(y|con|el|mi)\s+ruc\b.*$/i, '')
                 .replace(/[,;]\s*$/, '')
                 .replace(/(?<![A-ZÁÉÍÓÚÑ])\.\s*$/, '')
                 .replace(/\s{2,}/g, ' ').trim();
      if (cand) {
        // A razón social, not a person, if it carries a company marker.
        if (/\b(s\.?a\.?|s\.?a\.? de c\.?v\.?|cia|compa[nñ]ia|constructora|ferreter[íi]a|distribuidora|inversiones|grupo|corporaci[oó]n|import|comercial)\b/i.test(cand)) out.razon = cand;
        else out.razon = cand;   // treated as the document name either way
      }
    }
    return out;
  }

  /* ---- CATALOG GUARD — the cross-category substitution fix ------------
     Read this before touching any product branch below.

     THE BUG IT EXISTS TO STOP: asked for "lámina de zinc", the assistant
     answered with lámina de gypsum at C$370. Both are "láminas", so the swap
     reads as plausible right up until someone checks the line item — a
     roofing order quoted as drywall, with money attached.

     WHY THE OLD FIX FAILED: the same-category rule lived only in the system
     prompt, and the prompt NEVER DEFINED WHAT A CATEGORY IS — the catalog's
     `cat` field was never emitted, so the model inferred category from the
     product name and "lámina de gypsum" / "lámina de zinc" share a head noun.
     Measured across five phrasings of the same question, two substituted.
     A probabilistic rule cannot hold a constraint that has money behind it.

     WHAT REPLACES IT: family resolution in CODE, from data, on both sides.
     An off-catalog ask is answered here, deterministically, and NEVER REACHES
     THE MODEL. api/claude.js runs the same resolution on the way out as a
     backstop for phrasings this lexicon misses.

     THE NARROW LINE, and it is narrow:
       · NEVER present a different product as an answer to what was asked.
       · You MAY state what the catalog holds in the same family, as a
         SEPARATE message, with NO PRICE, phrased as an offer.
     That is why the reply below is always two bubbles and never one: the
     refusal is the answer, the inventory is an aside. Collapsing them into
     one sentence turns it back into a substitution. */
  function FAM() { return (typeof LeyvaFamilies !== 'undefined') ? LeyvaFamilies : null; }

  function termHit(t, term) {
    return new RegExp('(^|[^a-z0-9])' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(t);
  }

  /* Fail-closed on purpose: if the message mentions ANY off-catalog term, the
     whole turn is treated as an off-catalog ask, even when it also mentions
     something we stock. "¿tiene lámina de gypsum o de zinc?" must not answer
     about gypsum and quietly drop the zinc. */
  function resolveAsk(t) {
    var F = FAM(); if (!F) return null;
    var offer = null, present = null;
    Object.keys(F).forEach(function (k) {
      var f = F[k];
      f.terms.forEach(function (term) {
        if (!termHit(t, term)) return;
        var isAbsent = !f.presente || f.ausentes.indexOf(term) !== -1;
        if (isAbsent) {
          /* Ranking, and the order matters more than it looks.

             A family we stock NOTHING in outranks an absent variant of a
             family we DO stock. "necesito láminas para el techo" hits both
             `lamina`(zinc absent) and `techo`(nothing stocked); answering
             from `lamina` would offer gypsum to a roofing question, which is
             the original bug wearing a different phrasing. `techo` wins and
             carries an aclaración saying our láminas are not roofing sheets.

             Within the same rank, the longest term wins so "lamina de zinc"
             beats a bare "zinc". */
          var rank = f.presente ? 1 : 2;
          if (!offer || rank > offer.rank || (rank === offer.rank && term.length > offer.term.length)) {
            offer = { key: k, fam: f, term: term, rank: rank };
          }
        } else if (!present || term.length > present.term.length) {
          present = { key: k, fam: f, term: term };
        }
      });
    });
    if (offer) return { absent: true, key: offer.key, fam: offer.fam, term: offer.term };
    if (present) return { absent: false, key: present.key, fam: present.fam, term: present.term };
    return null;
  }

  function listOf(fam) {
    var n = fam.nombresCortos || [];
    if (n.length <= 1) return n[0] || '';
    return n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1];
  }

  /* The aclaración is scoped to the terms where the confusion is real. Someone
     who says "techo" in a shop that visibly sells láminas will assume we mean
     roofing sheets; someone asking for a teja will not. Attaching it to every
     roofing term put a gypsum disclaimer on a question about clay tiles. */
  function useAclaracion(ask) {
    if (!ask.fam.aclaracion) return false;
    var scope = ask.fam.aclaracionTerms;
    return !scope || scope.indexOf(ask.term) !== -1;
  }

  function catalogGuard(t) {
    var ask = resolveAsk(t);
    if (!ask || !ask.absent) return null;
    var label = ask.fam.etiquetas[ask.term] || ask.term;

    if (ask.fam.presente) {
      // Family we DO carry, variant we do NOT. Refuse by name, then state the
      // inventory as a separate offer. No price in the second bubble — a price
      // would make it read as the answer.
      return {
        bubbles: [
          label + ' no manejo.',
          'Lo que sí tengo en ' + ask.fam.label + ' es ' + listOf(ask.fam) + '. Si le sirve alguna, me dice.'
        ],
        rail: [
          'Consulta: ' + label,
          'Familia "' + ask.fam.label + '": sí la maneja',
          'Variante pedida: NO ESTÁ EN CATÁLOGO',
          'Se niega el producto pedido y se ofrece el inventario aparte — sin precio',
          'Sustitución bloqueada por código, no por instrucción al modelo'
        ],
        localOnly: true
      };
    }
    // Family we do not carry at all. Refuse and escalate. List NOTHING.
    return {
      bubbles: [
        'Fíjese que ' + label.toLowerCase() + ' no manejamos.'
      ].concat(useAclaracion(ask) ? [ask.fam.aclaracion] : [])
       .concat(['¿Quiere que le pase la consulta al equipo del mostrador?']),
      rail: [
        'Consulta: ' + label,
        'Familia "' + ask.fam.label + '": NO LA MANEJA',
        'Sin nada que ofrecer en esa familia — no se rellena con otra cosa',
        'Escalar al mostrador',
        'Sustitución bloqueada por código, no por instrucción al modelo'
      ],
      localOnly: true
    };
  }

  /* ---- the cart, as the responder sees it ------------------------------
     Every line here is read from LeyvaCart, whose prices come from
     LeyvaOrder.P (catalog parity asserted by scripts/check-prices.js). */
  var _cart = null;
  function C() {
    if (typeof LeyvaCart !== 'undefined') return LeyvaCart;
    if (!_cart && typeof require === 'function') _cart = require('./leyva-cart.js');   // node suites
    return _cart;
  }
  /* "las láminas" / "los sacos" name the only priced things sold that way. */
  function kindMatch(said, k) {
    return said === k || (said === 'lamina' && k === 'gypsum') || (said === 'bolsa' && (k === 'cemento' || k === 'bondex'));
  }
  function toLine(it) {
    var r = LeyvaOrder.bySku(it.sku);
    return { sku: it.sku, n: r.n, u: r.u, unit: it.precio_unitario, qty: it.cantidad, total: it.precio_unitario * it.cantidad };
  }
  function cartLines() { return C().list().map(toLine); }
  function quoteLine(sku) { var r = LeyvaOrder.bySku(sku); return { sku: sku, n: r.n, u: r.u, unit: r.p, qty: null, total: null }; }

  function corto(l, qty) {
    var r = LeyvaOrder.bySku(l.sku);
    return LeyvaOrder.plural((r && r.corto) || l.n, qty === undefined ? l.qty : qty);
  }

  /* How a kind is spoken about when we do not know which one yet. */
  var KIND_WORD = { tubo: ['tubo', 'tubos'], codo: ['codo', 'codos'], tee: ['T', 'T'], pegamento: ['pegamento', 'pegamentos'],
                    clavo: ['libra de clavo', 'libras de clavo'], puerta: ['puerta', 'puertas'], bondex: ['saco de Bondex', 'sacos de Bondex'],
                    bateria: ['batería', 'baterías'], llanta: ['llanta', 'llantas'], lamina: ['lámina', 'láminas'],
                    bolsa: ['bolsa', 'bolsas'], cemento: ['bulto de cemento', 'bultos de cemento'], gypsum: ['lámina de gypsum', 'láminas de gypsum'],
                    tabla: ['tabla', 'tablas'], aceite: ['litro de aceite', 'litros de aceite'] };
  var KIND_FEM = { tee: 1, puerta: 1, bateria: 1, llanta: 1, lamina: 1, bolsa: 1, gypsum: 1, tabla: 1, clavo: 1 };
  function kw(kind, qty) { var w = KIND_WORD[kind] || [kind, kind + 's']; return qty === 1 ? w[0] : w[1]; }

  /* The one question for something he asked for but we could not pin down.
     It names the product and lists every option WITH its price, so it is
     answerable in one message — never "¿me lo repite?". */
  function pendingAsk(p) {
    var opts = (p.options || []).map(function (o) { return o.n + ' a ' + money(o.p); });
    var list = humanList(opts);
    if (p.none) {
      return kw(p.kind, 1).charAt(0).toUpperCase() + kw(p.kind, 1).slice(1) + ' de ' + p.none + ' no manejo. ' +
             (opts.length ? 'Tengo ' + list + '. ¿Le sirve alguno?' : '¿Le paso la consulta al mostrador?');
    }
    if (p.kind === 'lamina') {
      return 'De lámina tengo la de gypsum a ' + money(LeyvaOrder.bySku('GYP-12-48').p) +
             '; la de revestimiento el precio lo confirma el mostrador. ' + (p.qty ? '¿Las ' + p.qty + ' son de gypsum?' : '¿Cuál le sirve?');
    }
    if (p.qty) {
      return (KIND_FEM[p.kind] ? 'De las ' : 'De los ') + p.qty + ' ' + kw(p.kind, p.qty) + ' no me dijo cuál: tengo ' + list + '. ¿De cuál son?';
    }
    return (KIND_FEM[p.kind] ? 'De ' + kw(p.kind, 1) : 'Del ' + kw(p.kind, 1)) + ' tengo ' + list + '. ¿Cuál le sirve?';
  }

  function confirmBubbles() {
    var ls = cartLines();
    ST.awaitingConfirm = true;
    return ['Para confirmarle: ' + humanList(ls.map(function (l) { return l.qty + ' ' + corto(l); })) +
            '. Total ' + money(C().total()) + '.', '¿Así está bien?'];
  }

  function listBubble(ls) { return orderLines(ls); }

  /* Restate the price we CAN stand behind, from the cart. Computed, never
     phrased. */
  function priceOfRecord(text) {
    var src = cartLines();
    if (!src.length) {
      var ex = C().extract(text);
      src = ex.mentions.filter(function (m) { return m.sku; }).map(function (m) {
        var l = quoteLine(m.sku); if (m.qty) { l.qty = m.qty; l.total = l.unit * m.qty; } return l;
      });
    }
    if (!src.length) return null;
    if (src.length === 1) {
      var l = src[0];
      return l.qty
        ? 'El precio de sistema es ' + money(l.unit) + ' ' + uart(l) + l.u + ', los ' + l.qty + ' en ' + money(l.qty * l.unit) + '.'
        : 'El precio de sistema es ' + money(l.unit) + ' ' + uart(l) + l.u + '.';
    }
    var tot = src.reduce(function (a, l) { return a + (l.total || 0); }, 0);
    return 'El precio de sistema es ' + money(tot) + ' por lo que me pidió.';
  }

  /* ---- ARITHMETIC *ON* THE PRICE — escalate, never compute --------------
     Discounts, rounding, IVA, wholesale, currency, price projections. Every
     one of these asks for a number that IS NOT IN THE CATALOG, and the guard
     that discards an invented figure only stops the number — it does not
     produce a useful answer. Without this branch the fallback said "Uy, ese no
     lo manejo", which is a sentence about STOCK answering a question about
     PRICE, and reads as the assistant not understanding Spanish.

     These are also exactly the questions a buyer asks to test the thing. The
     honest answer names the topic, says who decides, and restates the real
     price — which is the one number we can stand behind. */
  /* NOTE ON WORDING: none of these may say "no lo manejo". That phrase is the
     assistant's idiom for NOT CARRYING A PRODUCT, and reusing it for a price
     question is the exact confusion this branch exists to remove. Asserted. */
  var PRICE_MATH = [
    { re: /\bdescuent|\brebaj|\bme lo deja en\b|\bmejor precio\b|\bprecio especial\b|\bhaga un precio\b/,
      say: 'De descuentos no decido yo, eso lo ve el mostrador.', tag: 'descuento' },
    { re: /\bredonde/,
      say: 'Redondear el precio no me toca a mí, se lo ve el mostrador.', tag: 'redondeo' },
    { re: /\biva\b|\bimpuesto|\bretenci[oó]n\b|\bexonerad/,
      say: 'Del IVA y los impuestos no llevo el cálculo aquí, eso se lo confirma el mostrador.', tag: 'impuesto' },
    { re: /\bpor mayor\b|\bmayoreo\b|\bal mayor\b|\bmayorista\b|\bdocena\b/,
      say: 'Precio por mayor no lo tengo en sistema, eso se lo cotiza el mostrador.', tag: 'mayoreo' },
    { re: /\bd[oó]lar|\busd\b|\bdls\b|\btipo de cambio\b|\ben pesos\b/,
      say: 'Nosotros trabajamos en córdobas; del tipo de cambio se encarga el mostrador.', tag: 'moneda' },
    { re: /\bsi (sube|suben|baja|bajan|aumenta)\b|\bel mes que viene\b|\bva a subir\b|\bproyecc/,
      say: 'No le sé decir cómo va a quedar después; yo tengo el precio de hoy.', tag: 'proyección' }
  ];

  /* ---- rule A: unit AND total, always ---------------------------------
     "Nunca un total sin el unitario. El ferretero tiene que poder verificar la
     cuenta mentalmente." Both numbers, every time, and the total is computed
     here — never a figure a model wrote. */
  function art(l)  { return (LeyvaOrder.bySku(l.sku) || {}).g === 'f' ? 'La ' : 'El '; }
  function uart(l) { return LeyvaOrder.unitGender(l.u) === 'm' ? 'el ' : 'la '; }
  function cuantos(l) { return (LeyvaOrder.bySku(l.sku) || {}).g === 'f' ? '¿Cuántas ocupa?' : '¿Cuántos ocupa?'; }

  function unitAndTotal(l) {
    if (l.qty === null || l.qty === undefined) {
      return [art(l) + l.n + ' anda a ' + money(l.unit) + ' ' + uart(l) + l.u + '.', cuantos(l)];
    }
    return [art(l) + l.n + ' le queda a ' + money(l.unit) + ' ' + uart(l) + l.u + '.',
            'Por ' + l.qty + ' son ' + money(l.qty * l.unit) + '.'];
  }

  /* Multi-line: every line shows its own unit price next to its own total, so
     each line is checkable on its own and so is the sum. */
  function orderLines(lines) {
    return lines.map(function (l) {
      if (l.qty === null || l.qty === undefined) return l.n + ' — ' + money(l.unit) + ' ' + uart(l) + l.u;
      return l.qty + ' x ' + l.n + ' a ' + money(l.unit) + ' c/u — ' + money(l.qty * l.unit);
    }).join('\n');
  }

  function humanList(a) {
    if (a.length <= 1) return a[0] || '';
    return a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
  }

  function prettySize(sz) {
    return sz === '1/2' ? '1/2' : sz === '1' ? '1 pulgada' : sz === '2' ? '2 pulgadas'
         : sz === '1/8' ? '1/8' : sz === '1/4' ? '1/4' : sz;
  }

  /* An ambiguous kind is ASKED ABOUT, never resolved. Picking the cheapest or
     the first would be the same class of error as substituting across a
     category — a number the customer did not ask for. Both options carry their
     unit price so the question is answerable in one reply. */
  function ambiguousAsk(a) {
    var opts = a.options.map(function (o) { return o.n + ' a ' + money(o.p); });
    return 'Del ' + a.kind + ' tengo ' + humanList(opts) + '. ¿Cuál le sirve?';
  }

  /* Rule C: use what he told us. Detected once and mentioned once — repeating
     "para su instalación de agua" every turn is the corporate tic the voice
     rules already ban. */
  var USOS = [
    { re: /instalaci[oó]n de agua|agua potable|tuber[ií]a de agua|para agua|meter agua/, uso: 'la instalación de agua' },
    { re: /para el ba[nñ]o|del ba[nñ]o/, uso: 'el baño' },
    { re: /para la pila|de la pila/, uso: 'la pila' },
    { re: /cielo raso|cieloraso/, uso: 'el cielo raso' },
    { re: /para la moto|de la moto/, uso: 'la moto' }
  ];
  function rememberUse(t) {
    if (ST.uso) return;
    for (var i = 0; i < USOS.length; i++) if (USOS[i].re.test(t)) { ST.uso = USOS[i].uso; return; }
  }
  function usoLead(uso, l) { return 'Para ' + uso + ', el ' + l.n + ' es el que ocupa.'; }

  var DOC_RE = /\b(cotiz\w*|cotic\w*|proforma\w*|presupuesto|me arma\w*|armeme|armame|hagame la cuenta|mandeme la cuenta|cuanto me sale todo)\b/;
  var TOTAL_RE = /\bcu[áa]nto (llevo|va|vamos|tengo|es en total|ser[íi]a en total|es todo|suma)\b|\bc[óo]mo va (la cuenta|eso)\b|\bel total hasta\b|\bcu[áa]nto suma\b|\bs[úu]meme\b/;
  var STOCK_RE = /\b(existencia|inventario|stock|hay en bodega)\b|\bhay\b[^?]*\ben (existencia|bodega|stock)\b|\bcu[áa]nt[oa]s?\b[^?]*\b(hay|tiene|tienen|quedan|le quedan|disponibles?)\b|\b(tiene|tienen|queda|quedan)\b[^?]*\ben (existencia|bodega|stock)\b/;
  var PRICEQ_RE = /\b(a como|cuanto vale|cuanto cuesta|cuanto sale|que precio|en cuanto (esta|sale)|precio (de|del|tiene))\b/;
  var DELIVERY_RE = /\b(env[íi]o|entrega|flete|domicilio|reparto|mandan|llevan)\b/;
  // "súmele" edits; "¿cuánto suma?" asks. Bare "suma" is not an edit.
  var EDIT_RE = /\bqu[íi]t|\bquita|\bsaca|\bsaque|\belimin|\bborr|\bya no (quiero|ocupo|va)|\bmejor no|\bagreg|\bs[úu]m[ae]le\b|\bcambi|\bmejor\b|\bvuelva a\b|\botra vez\b|\brebaj/;
  var SIDE_RE = /\b(chiste|broma|futbol|partido|politica|presidente|ortega|clima|calor|amor|novia|como esta|como estas|quien gano|cancion|pelicula|bot|robot|maquina|humano|persona real|con quien hablo|quien eres|hola|buenas|gracias|a que hora|horario|cierran|abren|donde quedan|donde estan)\b/;
  /* Something said in the middle of "¿así está bien?" or "¿a nombre de
     quién?" that is NOT an answer to it: a question, a remark, a total. It
     is answered, and the pending question is asked again — never dropped. */
  function sideQuestion(t, text, totReq) {
    return /\?/.test(text) || totReq || STOCK_RE.test(t) || DELIVERY_RE.test(t) || SIDE_RE.test(t) ||
           PRICE_MATH.some(function (p) { return p.re.test(t); });
  }

  /* Split the raw message into clauses, so an off-catalog item next to a
     stocked one is refused BY NAME instead of taking the whole message down
     with it. "5 codos de media y una manguera" quotes the codos AND says the
     manguera is not carried — silence about either half is the bug. */
  function clauses(t) { return t.split(/\s*,\s*|\s+y\s+|\s+tambi[ée]n\s+|\s*\+\s*|\s+m[áa]s\s+(?=\d)|\n/).filter(Boolean); }

  function issueDoc(chosen, railM) {
    var ls = cartLines();
    var order = { lines: ls.map(function (l) { return { sku: l.sku, desc: l.n, qty: l.qty, unit: l.unit, total: l.total }; }),
                  total: C().total() };
    ST.docWanted = false; ST.awaitingName = false; ST.awaitingConfirm = false;
    railM.push('Proforma armada del CARRITO: ' + ls.length + ' líneas, ' + money(order.total));
    return order;
  }

  /* ---- THE CART TURN ------------------------------------------------------
     Everything a customer says about his order goes through here, every
     product in the message, every turn. Returns null when the message has
     nothing to do with the order. */
  function cartTurn(text, t, ex, docReq, totReq, carry) {
    carry = carry || {};
    var turn = C().tick();
    var out = [], rail = [], asks = [], notes = [];
    var updated = [], removedNow = [], recalled = [], quotes = [], moved = null, inCartQuote = {}, incBy = {};
    var changed = false;

    function upd(sku, qty, how) {
      var had = C().find(sku);
      var it = how === 'inc' ? C().add(sku, qty) : C().set(sku, qty);
      if (!it) return;
      if (how === 'inc' && had) incBy[sku] = (incBy[sku] || 0) + qty;
      ST.lastSku = sku;
      changed = true;
      updated = updated.filter(function (u) { return u !== sku; }); updated.push(sku);
      delete ST.removed[sku];
      rail.push('PRE|' + (how === 'inc' ? 'Suma ' + qty + ' a ' : 'Carrito: ') + sku + ' → ' + it.cantidad + ' (turno ' + it.turno_de_entrada + ')');
    }
    function pend(kind, qty, m) {
      var ex0 = null;
      for (var i = 0; i < ST.pendSize.length; i++) if (ST.pendSize[i].kind === kind) ex0 = ST.pendSize[i];
      var p = { kind: kind, qty: qty, options: m.options || LeyvaOrder.byKind(kind), none: m.none || null, turn: turn };
      if (ex0) ST.pendSize[ST.pendSize.indexOf(ex0)] = p; else ST.pendSize.push(p);
      asks.push(p);
      rail.push('SIN RESOLVER: ' + (qty ? qty + ' ' : '') + kw(kind, qty || 2) + ' — se pregunta cuál, no se elige');
    }
    function takePending(kind) {
      for (var i = 0; i < ST.pendSize.length; i++) if (ST.pendSize[i].kind === kind) return ST.pendSize.splice(i, 1)[0];
      return null;
    }

    var mentions = ex.mentions;
    var consumed = false;

    /* 1. Answers to our own questions, with no product named. */
    if (!mentions.length) {
      var bq = C().bareQty(text);
      if (bq && carry.pendQty) {
        upd(carry.pendQty, bq, 'set');
        rail.push('PRE|Cantidad dada a "¿cuántos ocupa?": ' + bq);
        consumed = true;
      } else if (bq && carry.stockAsk) {
        // the answer to "¿cuántas ocupa?" after a stock question: that product
        if (carry.stockAsk.sku) upd(carry.stockAsk.sku, bq, 'set');
        else pend(carry.stockAsk.kind, bq, { options: LeyvaOrder.byKind(carry.stockAsk.kind) });
        rail.push('PRE|Cantidad dada a la pregunta de existencia: ' + bq);
        consumed = true;
      } else if (ST.pendSize.length) {
        var bs = C().bareSize(text);
        if (bs) {
          ST.pendSize.slice().reverse().forEach(function (p) {
            var sz = C().sizeFor(p.kind === 'lamina' ? 'gypsum' : p.kind, bs.raw, bs.raw);
            if (p.kind === 'lamina' && /gypsum|jipson|yeso|si/.test(bs.raw.join(' '))) sz = 'x';
            if (!sz || sz.none) return;
            var rs = p.kind === 'lamina' ? { sku: 'GYP-12-48' } : C().resolve(p.kind, sz);
            if (!rs.sku) return;
            ST.pendSize.splice(ST.pendSize.indexOf(p), 1);
            var q = p.qty || bs.qty;
            if (q) { upd(rs.sku, q, p.qty ? 'inc' : 'set'); rail.push('PRE|Medida dada ahora; cantidad (' + q + ') tomada de lo que ya había dicho'); }
            else { quotes.push(rs.sku); }
            consumed = true;
          });
        }
      }
      /* "10 tubos de media" … "mejor de una pulgada": a size with no product
         and nothing pending is a change of mind about the line he just
         touched. The quantity carries over — making him say it again is
         what turns an assistant into a form. */
      // only with a change marker ("mejor de 1 pulgada", "que sean de 2") —
      // a bare "3" is a quantity with no product, and gets a question
      if (!consumed && !ST.pendSize.length && ST.lastSku && C().find(ST.lastSku) &&
          (ex.change || /^\s*(de|del|la de|el de|los de|las de)\b/.test(t))) {
        var bs2 = C().bareSize(text);
        var lk = LeyvaOrder.bySku(ST.lastSku).kind;
        var sz2 = bs2 ? C().sizeFor(lk, bs2.raw, bs2.raw) : null;
        if (sz2 && !sz2.none) {
          var rs2 = C().resolve(lk, sz2);
          if (rs2.sku && rs2.sku !== ST.lastSku) {
            var fromL = C().find(ST.lastSku), q2 = fromL.cantidad;
            C().remove(ST.lastSku);
            moved = { to: rs2.sku, from: fromL.sku };
            // if he already had some of the new size, these join them — never replace them
            upd(rs2.sku, q2, 'inc');
            rail.push('PRE|Cambio de medida sobre la última línea: ' + fromL.sku + ' → ' + rs2.sku + ', cantidad (' + q2 + ') conservada');
            consumed = true;
          }
        }
      }
      if (bq && !consumed && !docReq && !totReq) {
        return { bubbles: ['¿' + bq + ' de cuál producto?'], rail: ['Cantidad sin producto', 'Se pregunta — no se adivina'], localOnly: true, suppressDoc: true };
      }
    }

    /* 2. Every product the message names. */
    mentions.forEach(function (m) {
      if (m.sinprecio) {
        notes.push('Sí manejamos ' + m.sinprecio + '; el precio se lo confirma el mostrador.');
        rail.push('SIN PRECIO EN SISTEMA: ' + m.sinprecio + ' — no entra al carrito');
        return;
      }
      /* "las láminas" and "los sacos" name the only priced things sold that
         way — against the CART they mean what is in it. */
      var inCart = cartLines().filter(function (l) { return kindMatch(m.kind, LeyvaOrder.bySku(l.sku).kind); });

      if (m.op === 'remove') {
        var targets = (m.sku && !m.inferido) ? inCart.filter(function (l) { return l.sku === m.sku; }) : inCart;
        if (!targets.length) { notes.push('No tenía ' + kw(m.kind, 2) + ' apuntad' + (KIND_FEM[m.kind] ? 'as' : 'os') + '.'); return; }
        targets.forEach(function (l) {
          if (m.qty && m.sku && m.qty < l.qty) { upd(l.sku, l.qty - m.qty, 'set'); return; }
          ST.removed[l.sku] = l.qty; C().remove(l.sku); removedNow.push(l); changed = true;
          rail.push('PRE|Quitado del carrito: ' + l.sku + ' (tenía ' + l.qty + ')');
        });
        return;
      }

      if (m.qty === null) {
        if (ex.readd) {
          var back = Object.keys(ST.removed).filter(function (s) { return m.sku ? s === m.sku : kindMatch(m.kind, LeyvaOrder.bySku(s).kind); });
          if (back.length) {
            back.forEach(function (s) { var q0 = ST.removed[s]; upd(s, q0, 'set'); rail.push('PRE|Vuelve con la cantidad que tenía: ' + q0); });
            return;
          }
        }
        var pd = null;
        if (m.sku && !PRICEQ_RE.test(t)) { for (var pi = 0; pi < ST.pendSize.length; pi++) if (ST.pendSize[pi].kind === m.kind && ST.pendSize[pi].qty) pd = ST.pendSize[pi]; }
        if (pd) {
          // "los tubos de media" answering "¿de cuál son?": the quantity is
          // in the history — use it, never ask for it again.
          takePending(m.kind);
          upd(m.sku, pd.qty, 'inc');
          rail.push('PRE|Cantidad (' + pd.qty + ') tomada del historial — no se vuelve a preguntar');
          return;
        }
        if (m.sku && ex.change && inCart.length === 1 && inCart[0].sku !== m.sku) {
          var from = inCart[0];
          C().remove(from.sku);
          upd(m.sku, from.qty, 'inc');
          moved = { to: m.sku, from: from.sku };
          rail.push('PRE|Cambio de medida: ' + from.sku + ' → ' + m.sku + ', la cantidad (' + from.qty + ') se conserva');
          return;
        }
        var mine = m.sku ? inCart.filter(function (l) { return l.sku === m.sku; }) : inCart;
        if (mine.length && m.sku && PRICEQ_RE.test(t)) {
          quotes.push(m.sku); inCartQuote[m.sku] = mine[0].qty;
          return;
        }
        if (mine.length) {
          mine.forEach(function (l) { if (recalled.indexOf(l.sku) === -1) recalled.push(l.sku); });
          rail.push('PRE|Ya estaba en el carrito: ' + mine.map(function (l) { return l.qty + ' x ' + l.sku; }).join(', '));
          return;
        }
        if (m.sku) { quotes.push(m.sku); return; }
        if (m.none) { pend(m.kind, null, m); return; }
        pend(m.kind, null, m);
        return;
      }

      if (!m.sku && (m.kind === 'codo' || m.kind === 'tee') && !m.none &&
          !mentions.some(function (o) { return o.kind === 'tubo'; })) {      // pipes in THIS message decide
        /* "ah y también ocupo codos, como 8" right after 12 tubos de media:
           a ferretero reads those codos as 1/2 too. Inferred AND SAID, so
           he can correct it — never silently. Only when every pipe in the
           order is the same size. */
        var pipeSz = cartLines().map(function (l) { return LeyvaOrder.bySku(l.sku); })
          .filter(function (r) { return r.kind === 'tubo'; }).map(function (r) { return r.size; })
          .filter(function (v, i, arr) { return arr.indexOf(v) === i; });
        if (pipeSz.length === 1) {
          var inh = C().resolve(m.kind, pipeSz[0]);
          if (inh.sku) { m.sku = inh.sku; m.inferido = pipeSz[0]; }
        }
      }
      if (m.sku) {
        if (m.inferido) notes.push('inferido:' + m.kind + ':' + m.inferido);
        upd(m.sku, m.qty, m.op === 'inc' ? 'inc' : 'set');
        return;
      }
      /* A quantity for a kind we cannot pin down, said AS A REFERENCE ("de
         las láminas póngame 8", "cámbieme los codos a 10", "mejor 5 bolsas")
         means the one line of that kind he already has. */
      if ((ex.change || m.ref || m.kind === 'lamina' || m.kind === 'bolsa') && inCart.length === 1) {
        upd(inCart[0].sku, m.qty, 'set');
        rail.push('PRE|"' + kw(m.kind, 2) + '" = la única línea de ese tipo en el carrito (' + inCart[0].sku + ')');
        return;
      }
      pend(m.kind, m.qty, m);
    });

    /* 3. Off-catalog clauses sitting next to stocked ones. */
    var refusals = [];
    if (mentions.length) {
      clauses(t).forEach(function (cl) {
        var g = catalogGuard(cl);
        if (g) { refusals.push(g.bubbles[0]); rail.push('Fuera de catálogo en el mismo mensaje: ' + g.bubbles[0]); }
      });
    }

    if (quotes.length === 1 && !updated.length && !asks.length) ST.pendQty = quotes[0];
    Object.keys(incBy).forEach(function (s0) { notes.push('inc:' + s0 + ':' + incBy[s0]); });

    /* 4. Compose. Order: what changed, what is still open, then the total or
       the confirmation. Every price is computed from the cart. */
    if (removedNow.length) out.push('Le quité ' + humanList(removedNow.map(function (l) {
      var fem = KIND_FEM[LeyvaOrder.bySku(l.sku).kind];
      return l.qty === 1 ? (fem ? 'la ' : 'el ') + corto(l) : (fem ? 'las ' : 'los ') + l.qty + ' ' + corto(l);
    })) + '.');
    if (moved) out.push('Ah, entonces mejor ' + (KIND_FEM[LeyvaOrder.bySku(moved.to).kind] ? 'la de ' : 'el de ') + C().prettySize(LeyvaOrder.bySku(moved.to).kind, LeyvaOrder.bySku(moved.to).size) + '.');

    var upLines = updated.map(function (s) { return toLine(C().find(s)); });
    var all = cartLines();
    if (upLines.length === 1 && all.length === 1 && !recalled.length) {
      if (ST.uso && !ST.usoDicho) { out.push(usoLead(ST.uso, upLines[0])); ST.usoDicho = true; }
      out = out.concat(unitAndTotal(upLines[0]));
    } else if (upLines.length) {
      var sumo = upLines.filter(function (l) { return incBy[l.sku]; });
      var lead = sumo.length === upLines.length && sumo.length === 1
        ? 'Le sumo ' + incBy[sumo[0].sku] + ', quedan ' : (upLines.length === 1 ? 'Le apunto ' : 'Le apunto:\n');
      out.push(lead + listBubble(upLines));
    }
    notes.filter(function (n) { return /^inferido:/.test(n); }).forEach(function (n) {
      var p = n.split(':');
      out.push((p[1] === 'tee' ? 'Las T se las puse de ' : 'Los ' + kw(p[1], 2) + ' se los puse de ') + '' + C().prettySize(p[1], p[2]) + ', como los tubos — si son de otra medida me dice.');
    });
    if (recalled.length) {
      var rl = recalled.map(function (s) { return toLine(C().find(s)); });
      out.push('Eso ya lo tengo apuntado:\n' + listBubble(rl));
    }
    quotes.forEach(function (s) {
      var ql = quoteLine(s);
      out.push(art(ql) + ql.n + ' anda a ' + money(ql.unit) + ' ' + uart(ql) + ql.u + '.' +
               (inCartQuote[s] ? ' Ya lleva ' + inCartQuote[s] + ' apuntad' + (KIND_FEM[LeyvaOrder.bySku(s).kind] ? 'as' : 'os') + '; si quiere otra cantidad me dice.' : ''));
    });
    notes.filter(function (n) { return !/^(inferido|inc):/.test(n); }).forEach(function (n) { out.push(n); });
    refusals.forEach(function (r) { out.push(r); });

    if (DELIVERY_RE.test(t) && mentions.length) out.push('De la entrega le confirmo con el mostrador.');

    var openAsks = asks.slice();
    if (docReq || (ST.docWanted && changed)) {
      // pending items from earlier turns block the document too — ask them
      ST.pendSize.forEach(function (p) { if (openAsks.indexOf(p) === -1 && p.qty) openAsks.push(p); });
    }
    if (openAsks.length && ST.uso && !ST.usoDicho) { out.push('Para ' + ST.uso + ', le paso las medidas.'); ST.usoDicho = true; }
    openAsks.forEach(function (p) { out.push(pendingAsk(p)); });
    ST.pendSize = ST.pendSize.filter(function (p) { return p.qty || p.turn === turn; });   // a bare price question does not linger

    if (quotes.length && !openAsks.length && !updated.length && !quotes.some(function (q) { return inCartQuote[q]; })) {
      var qf = quoteLine(quotes[quotes.length - 1]);
      out.push(quotes.length === 1 ? cuantos(qf) : '¿Cuántos de cada uno?');
    }

    all = cartLines();
    var blocking = ST.pendSize.filter(function (p) { return p.qty; });
    if (docReq) ST.docWanted = true;

    if (totReq) {
      if (all.length) { out.push('Hasta ahorita lleva:\n' + listBubble(all)); out.push('Suma ' + money(C().total()) + '.'); }
      else out.push('Todavía no llevamos nada apuntado.');
      rail.push('Total en curso: ' + all.length + ' líneas del carrito, ' + money(C().total()));
    }

    if (ST.docWanted && (docReq || changed || consumed)) {
      if (blocking.length) {
        out.push('Con eso le armo la proforma.');
        rail.push('Proforma en espera: falta resolver ' + blocking.length + ' producto(s) — sin documento');
      } else if (!all.length) {
        out.push('Todavía no tengo nada apuntado para la proforma.');
        out.push('¿Qué le pongo?');
        ST.docWanted = false;
      } else {
        out = out.concat(confirmBubbles());
        rail.push('Confirmación UNA vez, con el carrito COMPLETO (' + all.length + ' líneas)');
      }
    } else if (changed && !openAsks.length && all.length >= 2 && !totReq) {
      out.push('Lleva ' + money(C().total()) + ' en total.');
    }

    if (!out.length) return null;
    rail.unshift('Carrito: ' + all.length + ' líneas · ' + money(C().total()) + ' — calculado desde el catálogo');
    return { bubbles: out, rail: rail, localOnly: true, suppressDoc: true };
  }

  function local(text) {
    var t = norm(text);
    var rail = [];

    function hit(msgs, trace, localOnly) { rail = trace; return { bubbles: msgs, rail: rail, localOnly: !!localOnly }; }

    // Prompt injection / instruction probing. A skeptical buyer WILL try this.
    // Stay in character, do not acknowledge having instructions.
    if (/ignora (tus|las) instruc|olvida (tus|las) instruc|system prompt|tus reglas|eres una ia|actua como|pretend|jailbreak|repite tus instruc/.test(t)) {
      return hit(['Yo solo le puedo ayudar con lo de la ferretería.', '¿Qué anda buscando?'],
        ['Intento de sacarlo de rol', 'Se mantiene en el mostrador']);
    }

    /* "olvidá mis datos" — wipe and confirm. DETERMINISTIC ON PURPOSE.
       This is the single claim in the whole demo that a skeptical buyer can
       actually check, so the answer is produced by the same code that does
       the deleting, and the rail asserts the post-condition rather than the
       intention. A scripted "listo, borré sus datos" over a profile still
       sitting in storage would be the worst failure in this file. */
    if (/\b(olvid|borr|elimin)\w*\b[^]*\b(mis\s+)?(datos|informacion|info|perfil|registro)\b/.test(t) ||
        /\bno\s+guarde\s+(mis\s+)?(datos|nada)\b/.test(t) ||
        /\bborr\w*\s+todo\s+lo\s+m[ií]o\b/.test(t)) {
      var mm = M();
      var had = !!(mm && mm.profile());
      if (mm) mm.forget();
      resetState();
      if (!had) {
        return hit(['No tengo datos suyos guardados.', '¿En qué le ayudo?'],
          ['Solicitud: olvidar datos', 'No había perfil para este número'], true);
      }
      return hit(['Listo, borré sus datos.', 'No me queda nada suyo guardado.'],
        ['Solicitud: olvidar datos',
         'Perfil eliminado de memoria',
         (mm && mm.wiped()) ? 'Verificado: sin registro para este número' : 'ADVERTENCIA: el borrado no se pudo verificar'], true);
    }

    /* "¿Cuántos ocupa?" is answered on the NEXT message or not at all. A
       quantity two turns later ("¿a cómo los codos?" … "¿hay baterías?" …
       "2") belongs to the last thing asked about, never to the codos. */
    var carry = { pendQty: ST.pendQty, stockAsk: ST.stockAsk };
    ST.pendQty = null; ST.stockAsk = null;

    var ex = C().extract(text);
    ex.mentions.forEach(function (m) { if (m.kind) ST.named[m.kind] = true; });
    var docReq = DOC_RE.test(t), totReq = TOTAL_RE.test(t);
    // An EDIT changes the order, so a pending confirmation or name question
    // is dropped and the confirmation comes back after it. A QUESTION
    // ("¿cuánto llevo?", "¿hacen entrega?") does not change the order: it is
    // answered and the pending question is asked again — never dropped.
    var askOnly = STOCK_RE.test(t) || PRICEQ_RE.test(t) || /\?/.test(text);
    var isEdit = ex.mentions.some(function (m) { return m.qty !== null || m.op === 'remove'; }) || ex.remove ||
                 (ex.mentions.length > 0 && !askOnly) || EDIT_RE.test(t) || docReq;

    /* Answering the ONE confirmation. A "sí" advances to the naming question,
       which stays the only door a document comes through. An EDIT is not an
       answer to "¿así está bien?" — it is the change that answer implies, so
       it goes to the cart and the confirmation comes back, whole, after it. */
    if (ST.awaitingConfirm) {
      var ca = parseNameAnswer(text);
      if (ca.confirm && !ex.mentions.length && !ex.remove) {
        ST.awaitingConfirm = false;
        ST.awaitingName = true;
        /* "sí, a nombre de Constructora Herrera S.A." answers BOTH questions
           in one breath. Asking for the name he just gave proves the system
           is matching keywords, not listening. */
        if (ca.razon || ca.ruc || ca.nombre) return local(text);
        if (ST.pendingName) { var pn = ST.pendingName; ST.pendingName = null; return local('a nombre de ' + pn); }
        var cAsk = nameAsk();
        return {
          bubbles: ['Perfecto.'].concat(cAsk.q),
          rail: ['PRE|Cantidades confirmadas por el cliente',
                 'Total ' + money(C().total()) + ' — calculado desde el carrito'].concat(cAsk.rail)
                .concat(['Documento: ruta determinista, sin modelo']),
          localOnly: true, suppressDoc: true
        };
      }
      if (isEdit) ST.awaitingConfirm = false;
      else if (!ca.decline && !ca.razon && sideQuestion(t, text, totReq)) {
        ST.awaitingConfirm = false;
        var side2 = local(text);
        ST.awaitingConfirm = true;
        return { bubbles: side2.bubbles.concat(['¿Le confirmo el pedido así?']),
                 rail: (side2.rail || []).concat(['Pregunta en medio de la confirmación: se contesta y la confirmación sigue en pie']),
                 localOnly: true, suppressDoc: true };
      }
      else if (ca.decline) {
        ST.awaitingConfirm = false;
        return hit(['Va. ¿Qué le quito o le cambio?'], ['Cantidades NO confirmadas', 'El carrito se conserva; se espera la corrección'], true);
      }
    }

    /* Confirming the quantities on a recalled order. A "sí" puts those lines
       in the cart and advances to the naming question. */
    if (ST.awaitingQty) {
      var qa = parseNameAnswer(text);
      var qLines = ST.awaitingQty;
      ST.awaitingQty = null;
      if (qa.confirm && !ex.mentions.length) {
        qLines.forEach(function (l) { C().add(l.sku, l.qty); ST.named[LeyvaOrder.bySku(l.sku).kind] = true; });
        ST.docWanted = true; ST.awaitingName = true;
        var qAsk = nameAsk();
        return {
          bubbles: ['Perfecto, las mismas cantidades.'].concat(qAsk.q),
          rail: ['PRE|Cantidades confirmadas por el cliente',
                 'Total ' + money(C().total()) + ' — mismas líneas, precios de hoy'].concat(qAsk.rail)
                .concat(['Documento: ruta determinista, sin modelo']),
          localOnly: true, suppressDoc: true
        };
      }
    }

    /* Answering the naming question. Only reachable while a proforma is
       actually being built. An instruction ("quítame los codos") is not a
       name: it drops the question and goes to the cart, and the confirmation
       comes back after it. */
    if (ST.awaitingName && isEdit) ST.awaitingName = false;
    if (ST.awaitingName && sideQuestion(t, text, totReq) && !/a\s+nombre\s+de/i.test(text)) {
      var nameQ = nameAsk().q[0];
      ST.awaitingName = false;
      var side = local(text);
      ST.awaitingName = true;
      return { bubbles: side.bubbles.concat(['Y la proforma, ' + nameQ.replace(/^¿(.)/, function (m0, c) { return '¿' + c.toLowerCase(); })]),
               rail: (side.rail || []).concat(['Pregunta en medio del nombre: se contesta y se vuelve a preguntar el nombre']),
               localOnly: true, suppressDoc: true };
    }
    if (ST.awaitingName) {
      var m2 = M();
      var ans = parseNameAnswer(text);
      var rsMem = m2 && m2.declared('razon_social');
      var nbMem = m2 && m2.declared('nombre');
      var chosen = null, railM = [];

      if (ans.ruc && m2) { m2.declare('ruc', ans.ruc); railM.push('PRE|RUC declarado ahora: ' + ans.ruc); }

      if (ans.razon) {
        if (m2) m2.declare('razon_social', ans.razon);
        chosen = ans.razon;
        railM.push('PRE|Razón social declarada ahora: ' + ans.razon);
      } else if (ans.confirm && rsMem) {
        chosen = rsMem.v;
        railM.push('MEM|Razón social confirmada por el cliente: ' + rsMem.v);
        if (m2) m2.declare('razon_social', rsMem.v);   // re-stamp declared_at: he just said it again
      } else if ((ans.nombre || ans.decline) && nbMem) {
        chosen = nbMem.v;
        railM.push('MEM|A nombre personal: ' + nbMem.v);
      } else if (ans.confirm && nbMem) {
        chosen = nbMem.v;
        railM.push('MEM|Nombre confirmado por el cliente: ' + nbMem.v);
      }

      if (!chosen) {
        // NULL-GUARD: not understood -> ask again. Never guess a name onto a
        // document, and never leave the line blank.
        return hit(['No le entendí el nombre.', '¿Me lo escribe tal cual va en la proforma?'],
          ['Respuesta no reconocida', 'Se vuelve a preguntar — no se escribe un nombre adivinado'], true);
      }
      if (!C().list().length) {
        ST.awaitingName = false; ST.docWanted = false;
        return hit(['Todavía no tengo nada apuntado para la proforma.', '¿Qué le pongo?'],
          ['Sin carrito no hay documento — hay pregunta'], true);
      }

      var rucMem = m2 && m2.declared('ruc');
      var dirMem = m2 && m2.declared('direccion');
      var ord = issueDoc(chosen, railM);
      // No double period after an abbreviation ("... S.A..").
      var msgs = ['Va, se la mando a nombre de ' + chosen + (/\.$/.test(chosen) ? '' : '.')];
      // NULL-GUARD EXTENSION: a field we do not have produces a QUESTION,
      // never a blank line on the document.
      if (!dirMem) msgs.push('No tengo dirección suya para la proforma. Si me la pasa se la agrego.');
      railM.push(rucMem ? ('MEM|RUC: ' + rucMem.v + (rucMem.fake ? ' (de ejemplo)' : '')) : 'Sin RUC en memoria → la proforma sale sin línea de RUC');
      railM.push(dirMem ? ('MEM|Dirección: ' + dirMem.v) : 'Sin dirección en memoria → se pregunta, no se deja en blanco');
      railM.push('Documento: ruta determinista, sin modelo');
      return { bubbles: msgs, rail: railM, localOnly: true, order: ord, profileName: chosen };
    }

    /* Repeat order — "lo mismo del mes pasado". The prior proforma is pulled
       by correlativo, its lines are re-priced against TODAY's catalog
       (storage holds {sku, qty} only), and the quantities are ASKED, not
       assumed. Nothing enters the cart until he says yes. */
    if (/\blo mismo\b|\blo de siempre\b|\bigual que la (vez|ves) pasada\b|\bel mismo pedido\b|\bcomo la (vez|ves) pasada\b|\blo del mes pasado\b|\brepet\w* el pedido\b|\brepit\w* el pedido\b|\blo de la otra vez\b|\blo mismo del mes pasado\b/.test(t)) {
      var m3 = M();
      var last = m3 && m3.ultimoPedido();
      if (!last) {
        return hit(['No tengo un pedido anterior suyo aquí.', '¿Qué ocupa?'],
          ['Consulta: repetir pedido', 'Sin pedidos anteriores en memoria', 'Se pregunta en vez de suponer'], true);
      }
      ST.awaitingQty = last.lines.map(function (l) { return { sku: l.sku, qty: l.qty }; });
      ST.awaitingName = false;
      return {
        bubbles: [
          'Va. El último fue la ' + last.correlativo + ', del ' + m3.fmtDate(last.fecha) + '.',
          memLines(last),
          'Eso da ' + money(last.total) + ' con los precios de hoy. ¿Van las mismas cantidades?'
        ],
        rail: [
          'DER|Pedido anterior ' + last.correlativo + ' del ' + m3.fmtDate(last.fecha),
          'DER|' + last.lines.length + ' líneas recuperadas por SKU',
          'Precios recalculados hoy contra el catálogo — no se guardan',
          'Cantidades: se preguntan, no se asumen',
          'Sin documento todavía — falta confirmar cantidades y nombre'
        ],
        localOnly: true,
        suppressDoc: true
      };
    }

    /* Price arithmetic runs BEFORE the cart: "calcule el IVA de 10 tubos"
       asks about a number that is not in the catalog, and answering with the
       price alone ignores the question that was actually asked. It does NOT
       touch the cart. */
    /* "rebájeme 2 T de 1" with a quantity and a product is taking two
       off the order, not asking for a discount. */
    var qtyEdit = ex.mentions.some(function (m) { return m.op === 'remove' && m.qty; }) ||
                  // "media docena de codos" is a quantity, not a wholesale question
                  (/\bdocena\b/.test(t) && ex.mentions.some(function (m) { return m.qty; }));
    for (var pm = 0; pm < PRICE_MATH.length && !qtyEdit; pm++) {
      if (!PRICE_MATH[pm].re.test(t)) continue;
      var rec = priceOfRecord(text);
      var pmOut = [PRICE_MATH[pm].say];
      if (rec) pmOut.push(rec);
      pmOut.push('¿Le paso la consulta al mostrador?');
      return hit(pmOut, ['Consulta: ' + PRICE_MATH[pm].tag,
                         'Pide una cifra que NO está en el catálogo',
                         'Se escala — no se calcula ni se estima',
                         rec ? 'Se repite el precio de sistema, calculado' : 'Sin pedido en curso que citar'], true);
    }

    // Stock — we have no inventory. Escalate, never invent. Only when no
    // quantity was given: "¿cuántos codos tienen?" is stock, "5 codos" is an order.
    if (STOCK_RE.test(t) && !ex.mentions.some(function (m) { return m.qty; })) {
      /* DETERMINISTIC: the model, asked "¿cuántos tubos tienen?", answered
         "¿Cuántos tubos ocupa?" to a customer with 20 tubos already in the
         order — asking him for what he already said. If what he asks about
         is in the cart, say so instead of asking. */
      var sm = ex.mentions.filter(function (m) { return m.kind; })[0] || null;
      var have = sm ? cartLines().filter(function (l) { return kindMatch(sm.kind, LeyvaOrder.bySku(l.sku).kind) && (!sm.sku || l.sku === sm.sku); }) : [];
      if (have.length) {
        return hit(['Déjeme confirmarlo con el mostrador antes de prometerle.',
                    'Le confirmo ' + humanList(have.map(function (l) { return (KIND_FEM[LeyvaOrder.bySku(l.sku).kind] ? 'las ' : 'los ') + l.qty + ' ' + corto(l); })) + ' que lleva apuntad' + (have.length === 1 && KIND_FEM[LeyvaOrder.bySku(have[0].sku).kind] ? 'as' : 'os') + '.'],
          ['Consulta: existencia', 'Sin inventario en sistema', 'Escalar al mostrador', 'PRE|Ya está en el pedido: no se le pregunta cuántos'], true);
      }
      if (sm) ST.stockAsk = { kind: sm.kind, sku: sm.sku || null };
      var fem = sm ? KIND_FEM[sm.kind] : true;
      return hit(['Déjeme confirmarlo con el mostrador antes de prometerle.', fem ? '¿Cuántas ocupa?' : '¿Cuántos ocupa?'],
        ['Consulta: existencia', 'Sin inventario en sistema', 'Escalar al mostrador'], true);
    }

    /* Off-catalog product asks with NOTHING stocked in the message are
       settled here, before the model. With stocked products in the same
       message, cartTurn refuses the off-catalog clause by name instead. */
    if (!ex.mentions.length) {
      var guarded = catalogGuard(t);
      if (guarded) { rail = guarded.rail; return guarded; }
    }

    // THE ORDER. Anything that names a product, answers our question about
    // one, edits the list, asks for the running total or for the document.
    rememberUse(t);
    var ct = cartTurn(text, t, ex, docReq, totReq, carry);
    if (ct) return ct;

    // Greeting.
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|saludos)\b/.test(t) && t.length < 30) {
      return hit(['Buenas.', '¿Qué ocupa?'], ['Saludo', 'Abre la conversación']);
    }
    // NOTE: the greeting above is NEUTRAL BY DESIGN and must stay that way.
    // Never "¡Buenas, don Marvin!" — see HANDOFF.md §0.

    // English — answer in Spanish, do not switch.
    if (/\b(how much|do you have|price|hello|hi there|what is|can i|i need|looking for)\b/.test(t)) {
      return hit(['Disculpe, aquí le atiendo en español.', '¿Qué producto anda buscando?'],
        ['Consulta en inglés', 'Responde en español']);
    }

    // Off-topic (politics, jokes, chit-chat) — deflect back to the counter.
    if (/\b(chiste|broma|futbol|partido|politica|presidente|ortega|clima|calor|amor|novia|como esta|como estas|quien gano|cancion|pelicula)\b/.test(t)) {
      return hit(['Jaja, de eso no sé.', 'Yo le ayudo con material, ¿qué ocupa?'],
        ['Fuera de tema', 'Redirige al catálogo']);
    }

    // Asked directly whether it's a bot — answer honestly, lightly, move on.
    if (/\b(bot|robot|maquina|humano|persona real|es usted una persona|con quien hablo|quien eres|quien es usted|eres real|sos un bot|sos real)\b/.test(t)) {
      return hit(['Soy el asistente de la ferretería, pero le resuelvo igual.', '¿Qué ocupa?'],
        ['Pregunta directa: ¿es un asistente?', 'Respuesta honesta, sin rodeos']);
    }

    // Delivery — we have no policy. Escalate, never invent.
    if (DELIVERY_RE.test(t)) {
      return hit(['De la entrega le confirmo con el mostrador, no quiero darle un dato malo.', '¿Para qué zona sería?'],
        ['Consulta: entrega', 'Sin dato de entrega en sistema', 'Escalar al mostrador']);
    }

    // Hours / location — from the catalog's contact block, never invented.
    if (/\b(a que hora|horario|cierran|abren|donde quedan|donde estan|direccion de la ferreteria)\b/.test(t)) {
      return hit(['Estamos de la esquina del Dr. Cayetano 25 varas al oeste, en León.', 'El horario se lo confirma el mostrador al 2315-1177.'],
        ['Consulta: ubicación / horario', 'Dirección del catálogo', 'Horario: sin dato → escalar']);
    }

    // Caterpillar tools — real specs, no price, offer to confirm.
    var tool = null;
    if (/taladro/.test(t)) tool = CAT_TOOLS.taladro;
    else if (/sierra/.test(t)) tool = CAT_TOOLS.sierra;
    else if (/martillo|rotomartillo|sds/.test(t)) tool = CAT_TOOLS.martillo;
    else if (/lijadora/.test(t)) tool = CAT_TOOLS.lijadora;
    else if (/caterpillar|\bcat\b/.test(t)) tool = CAT_TOOLS.taladro;
    if (tool) {
      return hit(['Sí, sí manejamos el ' + tool + '.', 'El precio no lo tengo en pantalla — se lo confirmo con el mostrador ahorita.'],
        ['Consulta: herramienta Caterpillar', 'Producto en catálogo', 'SIN PRECIO EN SISTEMA', 'Escalar al mostrador']);
    }

    // Carried, but we have no current price. Its precio_antes is deliberately
    // NOT repeated; a stale price is the exact failure this demo cannot afford.
    if (/revestimiento|kl8231|m[áa]rmol|marmol/.test(t)) {
      return hit(['Sí, esa lámina de revestimiento negra mármol la manejamos.', 'El precio actual se lo confirmo con el mostrador.'],
        ['Consulta: lámina de revestimiento', 'Producto en catálogo', 'SIN PRECIO EN SISTEMA', 'Escalar al mostrador']);
    }

    /* Asked for a family we DO stock, but no specific product matched — a bare
       "¿qué pegamento tienen?". Falling through to "no lo manejo" would be a
       FALSE STATEMENT ABOUT THEIR STOCK. List the family and ask. */
    var fam = resolveAsk(t);
    if (fam && !fam.absent && fam.fam.presente) {
      return hit(['En ' + fam.fam.label + ' tengo ' + listOf(fam.fam) + '.', '¿Cuál le sirve?'],
        ['Consulta por familia: ' + fam.fam.label,
         'Sin producto específico en la pregunta',
         'Se lista lo de esa familia y se pregunta — no se elige por el cliente']);
    }

    /* "a nombre de X" with no proforma in progress. Never "no lo manejo":
       he is telling us whose name goes on the document. With an order,
       confirm it and carry the name; without one, ask what to put on it. */
    var outName = parseNameAnswer(text);
    if (/a\s+nombre\s+de\s+/i.test(text) && outName.razon) {
      if (C().list().length) {
        ST.docWanted = true; ST.pendingName = outName.razon;
        return { bubbles: ['Va, a nombre de ' + outName.razon + (/\.$/.test(outName.razon) ? '' : '.')].concat(confirmBubbles()),
                 rail: ['PRE|Nombre para la proforma: ' + outName.razon, 'Confirmación del carrito completo antes del documento'],
                 localOnly: true, suppressDoc: true };
      }
      return hit(['Todavía no tengo nada apuntado para la proforma.', '¿Qué le pongo?'], ['Nombre sin pedido: se pregunta el pedido'], true);
    }

    /* A number with no product we recognise is an order we did not
       understand. That is a QUESTION — never "no lo manejo", which would be
       a claim about their stock we have no basis for. */
    if (/\b\d{1,3}\b/.test(t) || C().bareQty(text)) {
      return hit(['No le entendí cuál producto es.', '¿Cómo se llama lo que ocupa?'],
        ['Cantidad sin producto reconocible', 'Se pregunta — no se adivina ni se niega'], true);
    }

    // Off catalog.
    return hit(['Uy, ese no lo manejo.', '¿Quiere que le pase la consulta al equipo por WhatsApp?'],
      ['Consulta fuera de catálogo', 'Sin coincidencia', 'Ofrecer pasar al equipo']);
  }


  /* ---- ARITHMETIC VERIFICATION OF THE MODEL'S REPLY -------------------
     Fede's rule: "Toda aritmética se verifica calculándola, no leyéndola."
     That applies to the model too. It writes the prose; it is not trusted
     with the numbers.

     Every money figure in a model reply must be derivable from the catalog:
       · a catalog unit price, or a precio_antes;
       · a quantity actually mentioned in this turn, times a catalog price;
       · a sum of such products (any subset, ≤8 lines).
     Anything else — a rounded total, an invented unit, a sum that does not
     add up — fails, and the caller falls back to the deterministic answer
     that was already computed before the request went out.

     Restricting multipliers to the quantities ACTUALLY MENTIONED is what
     makes this tight. Allowing any 1..999 would let a wrong total land on
     some unrelated product of two catalog numbers. */
  function verifyMoney(replyText, userText) {
    var figs = String(replyText).match(/C\$\s?[\d.,]+/g);
    if (!figs) return true;                      // no numbers, nothing to verify

    var prices = [], antes = [];
    LeyvaOrder.P.forEach(function (r) { prices.push(r.p); if (r.antes) antes.push(r.antes); });

    // Quantities in play this turn: whatever either side wrote.
    var qs = {};
    (String(userText) + ' ' + String(replyText)).replace(/C\$\s?[\d.,]+/g, ' ')
      .replace(/\b(\d{1,3})\b/g, function (_, d) { qs[parseInt(d, 10)] = 1; return ' '; });
    var qtys = Object.keys(qs).map(Number).filter(function (q) { return q > 0 && q < 1000; });
    qtys.push(1);

    var legal = {};
    prices.concat(antes).forEach(function (p) { legal[p] = 1; });
    var products = [];
    prices.forEach(function (p) {
      qtys.forEach(function (q) { legal[p * q] = 1; products.push(p * q); });
    });

    var val = function (f) { return parseInt(String(f).replace(/[^\d]/g, ''), 10); };
    var seen = figs.map(val).filter(function (v) { return isFinite(v); });

    // Subset sums of the line totals that actually appear, so "Todo junto"
    // is checked against the lines printed above it rather than assumed.
    var lineVals = seen.filter(function (v) { return products.indexOf(v) !== -1; }).slice(0, 8);
    var sums = { 0: 1 };
    lineVals.forEach(function (v) {
      Object.keys(sums).forEach(function (k) { sums[Number(k) + v] = 1; });
    });
    Object.keys(sums).forEach(function (k) { if (Number(k) > 0) legal[k] = 1; });

    for (var i = 0; i < seen.length; i++) if (!legal[seen[i]]) return false;
    return true;
  }

  /* ---- API path ------------------------------------------------------
     Never throws to the caller. Resolves to null on ANY failure, which
     the caller reads as "use the local answer". */
  function callApi(history) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, API_TIMEOUT_MS);

    return fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ignea-ops-token': sessionStorage.getItem('ignea_ops_token') || ''
      },
      // `preset` is what makes the server build the catalog-grounded
      // system prompt. No system prompt is sent from here on purpose —
      // the server would ignore it anyway.
      //
      // `memory` is STRUCTURED, never prose: five short declared fields plus
      // orders expressed as {sku, qty}. The server re-validates every field
      // and re-derives every price from the catalog, so nothing here can
      // inject prompt text or a price. That is what keeps a leaked demo token
      // from becoming a general model proxy — see api/claude.js.
      body: JSON.stringify({
        preset: 'leyva',
        max_tokens: MAX_TOKENS,
        messages: history,
        memory: (typeof LeyvaMemory !== 'undefined') ? LeyvaMemory.wire() : null
      }),
      signal: ctrl.signal
    }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).then(function (d) {
      if (!d || !d.content || !d.content[0] || !d.content[0].text) return null;
      var bubbles = d.content[0].text.split('|||').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!bubbles.length) return null;
      return { bubbles: bubbles, usage: d.usage || null };
    }).catch(function () {
      return null;
    }).then(function (v) {
      clearTimeout(timer);
      return v;
    });
  }

  /* ---- THE ONLY DOOR A DOCUMENT COMES THROUGH -------------------------
     A proforma exists only when the naming branch built one FROM THE CART.
     leyva-chat.js used to fall back to parsing the reply text for anything
     that looked like priced lines — so a price answer, or a model reply,
     could turn into a PDF nobody asked for. That fallback is gone. */
  function documentFor(ans) { return (ans && ans.order) ? ans.order : null; }

  /* ---- WHAT THE MODEL MAY SAY -------------------------------------------
     The model answers only turns that do not touch the order (greetings,
     delivery, stock, chit-chat). It is not trusted with the order either:
       · a money figure must be a plain catalog unit price — any product or
         sum is arithmetic, and arithmetic is the cart's job;
       · it may not confirm, total or "apuntar" — that would be a second
         version of the order that the cart does not know about;
       · it may not name a product the customer never named.
     A reply that fails any of these is discarded for the local answer. */
  function modelReplyAllowed(replyText, userText) {
    var figs = String(replyText).match(/C\$\s?[\d.,]+/g) || [];
    var unit = {};
    LeyvaOrder.P.forEach(function (r) { unit[r.p] = 1; if (r.antes) unit[r.antes] = 1; });
    for (var i = 0; i < figs.length; i++) {
      if (!unit[parseInt(figs[i].replace(/[^\d]/g, ''), 10)]) return { ok: false, why: 'cifra que no es un precio de lista: ' + figs[i] };
    }
    if (/para confirmarle|\btotal\b|todo junto|le apunt|le puse|lleva c\$|proforma lista|se la armo/i.test(replyText)) {
      return { ok: false, why: 'el modelo intentó llevar el pedido' };
    }
    var allowed = {};
    Object.keys(ST.named).forEach(function (k) { allowed[k] = 1; });
    C().extract(userText || '').mentions.forEach(function (m) { if (m.kind) allowed[m.kind] = 1; });
    var tk = C().tokens(replyText);
    for (var j = 0; j < tk.length; j++) {
      var k = C().nounKind(tk[j]);
      if (k && !allowed[k]) return { ok: false, why: 'nombró un producto que el cliente no pidió: ' + tk[j] };
    }
    return { ok: true };
  }

  function cart() { return C().list(); }
  function noteIssued(correlativo) { ST.issued[correlativo] = true; }

  return {
    local: local,
    documentFor: documentFor,
    modelReplyAllowed: modelReplyAllowed,
    cart: cart,
    noteIssued: noteIssued,
    callApi: callApi,
    openProformaNudge: openProformaNudge,
    verifyMoney: verifyMoney,
    catalogGuard: catalogGuard,
    resolveAsk: resolveAsk,
    resetState: resetState,
    parseNameAnswer: parseNameAnswer,
    LOCAL_PRICES: LOCAL_PRICES,
    CAT_TOOLS: CAT_TOOLS,
    API_TIMEOUT_MS: API_TIMEOUT_MS
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = LeyvaDemo; }
