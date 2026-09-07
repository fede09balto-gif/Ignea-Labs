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

  /* Conversation state for the two-step proforma. Reset by leyva-chat.js's
     reset(). Deliberately NOT persisted: a half-finished naming question
     surviving a restart would put a stale name on the next document. */
  /* Conversation state. `order` is what the customer has actually asked for,
     accumulated across turns — it is what the confirmation repeats back and
     what the proforma is built from. `uso` is the job he told us about; rule C
     says to use it instead of answering generically. */
  var ST = { awaitingName: null, awaitingQty: null, awaitingConfirm: null,
             nudged: false, order: [], uso: null, usoDicho: false, lastSize: null };
  function resetState() {
    ST.awaitingName = null; ST.awaitingQty = null; ST.awaitingConfirm = null;
    ST.nudged = false; ST.order = []; ST.uso = null; ST.usoDicho = false; ST.lastSize = null;
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
    var open = m.abiertas()[0];
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

  /* Restate the price we CAN stand behind: from what he has already asked for,
     or from this same message. Computed, never phrased. */
  function priceOfRecord(text) {
    var src = ST.order.filter(function (l) { return l.qty; });
    if (!src.length) {
      var pr = LeyvaOrder.parse(text, { inheritSize: ST.lastSize });
      src = pr.lines.filter(function (l) { return l.qty; });
      if (!src.length) src = pr.lines;
    }
    if (!src.length) return null;
    if (src.length === 1) {
      var l = src[0];
      return l.qty
        ? 'El precio de sistema es ' + money(l.unit) + ' la ' + l.u + ', los ' + l.qty + ' en ' + money(l.qty * l.unit) + '.'
        : 'El precio de sistema es ' + money(l.unit) + ' la ' + l.u + '.';
    }
    var tot = src.reduce(function (a, l) { return a + (l.total || 0); }, 0);
    return 'El precio de sistema es ' + money(tot) + ' por lo que me pidió.';
  }

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

  /* Accumulate what he has actually asked for. Same SKU twice replaces rather
     than adds — "10 tubos" then "mejor 15 tubos" is a correction, not 25. */
  function mergeOrder(l) {
    for (var i = 0; i < ST.order.length; i++) {
      if (ST.order[i].sku === l.sku) { ST.order[i] = l; return; }
    }
    ST.order.push(l);
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

    /* Answering the ONE confirmation. A "sí" here does not produce a document
       either — it advances to the naming question, which stays the only door a
       document comes through. The confirmation is cleared whatever the answer,
       so it is never asked twice. */
    if (ST.awaitingConfirm) {
      var cLines = ST.awaitingConfirm;
      ST.awaitingConfirm = null;
      var ca = parseNameAnswer(text);
      if (!ca.confirm) {
        // Anything but a yes means the order is being edited. Drop it and let
        // the message be handled as an ordinary request rather than carrying
        // quantities he just disputed onto a document.
        return hit(['Ah, va — dígame cómo queda entonces.', '¿Qué le cambio?'],
          ['Cantidades NO confirmadas', 'Se descarta el pedido pendiente', 'Se vuelve a preguntar'], true);
      }
      var cTot = cLines.reduce(function (a, l) { return a + l.total; }, 0);
      var cAsk = nameAsk();
      ST.awaitingName = { lines: cLines, total: cTot };
      return {
        bubbles: ['Perfecto.'].concat(cAsk.q),
        rail: ['PRE|Cantidades confirmadas por el cliente',
               'Total ' + money(cTot) + ' — calculado desde el catálogo'].concat(cAsk.rail)
              .concat(['Documento: ruta determinista, sin modelo']),
        localOnly: true,
        suppressDoc: true
      };
    }

    /* Confirming the quantities on a recalled order. A "sí" here does NOT
       produce a document — it advances to the naming question, which is the
       only door a document comes through. */
    if (ST.awaitingQty) {
      var qa = parseNameAnswer(text);
      if (qa.confirm) {
        var qLines = ST.awaitingQty;
        ST.awaitingQty = null;
        var qTot = qLines.reduce(function (a, l) { return a + l.total; }, 0);
        var qAsk = nameAsk();
        ST.awaitingName = { lines: qLines, total: qTot };
        return {
          bubbles: ['Perfecto, las mismas cantidades.'].concat(qAsk.q),
          rail: ['PRE|Cantidades confirmadas por el cliente',
                 'Total ' + money(qTot) + ' — mismas líneas, precios de hoy'].concat(qAsk.rail)
                .concat(['Documento: ruta determinista, sin modelo']),
          localOnly: true,
          suppressDoc: true
        };
      }
      // Anything else means the quantities are changing. Drop the pending
      // order rather than carrying stale numbers into a document, and let the
      // message be handled as an ordinary question.
      ST.awaitingQty = null;
    }

    /* Answering the naming question. Only reachable while a proforma is
       actually being built — there is no other path into it, so a stray
       "sí" in an unrelated conversation cannot write a name to a profile. */
    if (ST.awaitingName) {
      var m2 = M();
      var ans = parseNameAnswer(text);
      var ord = ST.awaitingName;
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

      ST.awaitingName = null;
      var rucMem = m2 && m2.declared('ruc');
      var dirMem = m2 && m2.declared('direccion');
      // No double period after an abbreviation ("... S.A..").
      var msgs = ['Va, se la mando a nombre de ' + chosen + (/\.$/.test(chosen) ? '' : '.')];
      // NULL-GUARD EXTENSION: a field we do not have produces a QUESTION,
      // never a blank line on the document. Dirección is deliberately absent
      // from the seeded profile so this fires in the demo.
      if (!dirMem) msgs.push('No tengo dirección suya para la proforma. Si me la pasa se la agrego.');
      railM.push(rucMem ? ('MEM|RUC: ' + rucMem.v + (rucMem.fake ? ' (de ejemplo)' : '')) : 'Sin RUC en memoria → la proforma sale sin línea de RUC');
      railM.push(dirMem ? ('MEM|Dirección: ' + dirMem.v) : 'Sin dirección en memoria → se pregunta, no se deja en blanco');
      railM.push('Documento: ruta determinista, sin modelo');
      return { bubbles: msgs, rail: railM, localOnly: true, order: ord, profileName: chosen };
    }

    /* Repeat order — "lo mismo del mes pasado". The single most valuable
       interaction in this demo for a contractor: it collapses a five-message
       exchange into one. The prior proforma is pulled by correlativo, its
       lines are re-priced against TODAY's catalog (storage holds {sku, qty}
       only), and the quantities are ASKED, not assumed. */
    if (/\blo mismo\b|\blo de siempre\b|\bigual que la (vez|ves) pasada\b|\bel mismo pedido\b|\bcomo la (vez|ves) pasada\b|\blo del mes pasado\b|\brepet\w* el pedido\b|\blo de la otra vez\b|\blo mismo del mes pasado\b/.test(t)) {
      var m3 = M();
      var last = m3 && m3.ultimoPedido();
      if (!last) {
        // A remembered fact we do not have becomes a QUESTION. Never
        // "como siempre" with nothing behind it.
        return hit(['No tengo un pedido anterior suyo aquí.', '¿Qué ocupa?'],
          ['Consulta: repetir pedido', 'Sin pedidos anteriores en memoria', 'Se pregunta en vez de suponer'], true);
      }
      /* suppressDoc is LOAD-BEARING here, not a detail.

         These bubbles itemise real lines with real totals, so the proforma
         parser recognises them as a complete order and used to emit a PDF on
         the spot — with a customer's proforma issued before anyone had been
         asked whose name goes on it, which is the exact gate the two-step
         flow exists to hold. Recalling an order is a QUESTION about
         quantities; it is not an instruction to issue a document. */
      ST.awaitingQty = last.lines.map(function (l) {
        return { sku: l.sku, qty: l.qty, desc: l.n, unit: l.unit, total: l.total };
      });
      ST.awaitingName = null;
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

    /* Off-catalog product asks are settled HERE, before any product branch and
       before the model. This is the only place that decides whether we carry
       something. */
    var guarded = catalogGuard(t);
    if (guarded) { rail = guarded.rail; return guarded; }

    // Greeting.
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|saludos)\b/.test(t) && t.length < 30) {
      return hit(['Buenas.', '¿Qué ocupa?'], ['Saludo', 'Abre la conversación']);
    }
    // NOTE: the greeting above is NEUTRAL BY DESIGN and must stay that way.
    // Never "¡Buenas, don Marvin!" — a phone shared in a cuadrilla makes
    // greeting the wrong person by name a memorable failure in front of a
    // buyer. The remembered name goes on the proforma question instead,
    // where it is load-bearing. See HANDOFF.md §0.

    // English — answer in Spanish, do not switch. This is a Nicaraguan
    // ferretería's WhatsApp; a bilingual counter would break the illusion.
    if (/\b(how much|do you have|price|hello|hi there|what is|can i|i need|looking for)\b/.test(t)) {
      return hit(['Disculpe, aquí le atiendo en español.', '¿Qué producto anda buscando?'],
        ['Consulta en inglés', 'Responde en español']);
    }

    // Off-topic (politics, jokes, chit-chat) — deflect back to the counter.
    if (/\b(chiste|broma|futbol|politica|presidente|ortega|clima|amor|novia|como estas|quien gano|cancion|pelicula)\b/.test(t)) {
      return hit(['Jaja, de eso no sé.', 'Yo le ayudo con material, ¿qué ocupa?'],
        ['Fuera de tema', 'Redirige al catálogo']);
    }

    // Asked directly whether it's a bot — answer honestly, lightly, move on.
    if (/\b(bot|robot|maquina|humano|persona real|es usted una persona|con quien hablo|quien eres|quien es usted|eres real|sos un bot|sos real)\b/.test(t)) {
      return hit(['Soy el asistente de la ferretería, pero le resuelvo igual.', '¿Qué ocupa?'],
        ['Pregunta directa: ¿es un asistente?', 'Respuesta honesta, sin rodeos']);
    }

    // Delivery — we have no policy. Escalate, never invent.
    if (/\b(env[íi]o|entrega|flete|domicilio|reparto|mandan|llevan)\b/.test(t)) {
      return hit(['De la entrega le confirmo con el mostrador, no quiero darle un dato malo.', '¿Para qué zona sería?'],
        ['Consulta: entrega', 'Sin dato de entrega en sistema', 'Escalar al mostrador']);
    }

    // Stock — we have no inventory. Escalate, never invent.
    // The quantifier and the verb are usually SEPARATED by the product
    // ("¿cuántas láminas de gypsum tienen?"), so this cannot require them to
    // be adjacent. Getting that wrong made a stock question fall through to
    // the price branch and answer C$370 to "how many do you have" — caught in
    // the browser pass, and exactly the kind of thing that reads as evasion
    // in front of a buyer.
    if (/\b(existencia|inventario|stock|hay en bodega)\b/.test(t) ||
        /\bcu[áa]nt[oa]s?\b[^?]*\b(hay|tiene|tienen|quedan|le quedan|disponibles?)\b/.test(t) ||
        /\b(tiene|tienen|queda|quedan)\b[^?]*\ben (existencia|bodega|stock)\b/.test(t)) {
      return hit(['Déjeme confirmarlo con el mostrador antes de prometerle.', '¿Cuántas ocupa?'],
        ['Consulta: existencia', 'Sin inventario en sistema', 'Escalar al mostrador']);
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

    // Carried, but we have no current price. Saying "no lo manejo" here would
    // be a false statement about their own stock — the safe answer is the
    // honest one: we have it, the price needs confirming. Its known
    // precio_antes is deliberately NOT repeated; a stale price is the exact
    // failure this demo cannot afford.
    if (/revestimiento|kl8231|m[áa]rmol|marmol/.test(t)) {
      return hit(['Sí, esa lámina de revestimiento negra mármol la manejamos.', 'El precio actual se lo confirmo con el mostrador.'],
        ['Consulta: lámina de revestimiento', 'Producto en catálogo', 'SIN PRECIO EN SISTEMA', 'Escalar al mostrador']);
    }

    /* ---- COTIZACIÓN: confirm the quantities ONCE, then the name ---------
       Fede's rule B: "Una sola vez, antes de la proforma, repitiendo
       cantidades. No después de cada mensaje — eso cansa y suena a
       formulario." So the confirmation is bound to the moment the document is
       requested, not to every turn that touches a product. */
    if (/cotiza|proforma|proform|proformar|presupuesto|me arma|s[úu]meme|cu[áa]nto me sale todo/.test(t)) {
      var acc = ST.order.filter(function (l) { return l.qty; });
      if (acc.length) {
        ST.awaitingConfirm = acc.slice();
        return {
          bubbles: [
            'Para confirmarle: ' + humanList(acc.map(function (l) {
              var r = LeyvaOrder.bySku(l.sku);
              return l.qty + ' ' + LeyvaOrder.plural((r && r.corto) || l.n, l.qty);
            })) + '.',
            '¿Así está bien?'
          ],
          rail: ['Consulta: cotización',
                 'PRE|' + acc.length + ' líneas tomadas de lo que pidió el cliente',
                 'Total ' + money(acc.reduce(function (a, l) { return a + l.total; }, 0)),
                 'Se confirman las cantidades UNA vez antes del documento'],
          localOnly: true,
          suppressDoc: true
        };
      }
      /* No accumulated order — the demo's own opening beat, where the operator
         taps "Me arma una cotización" cold. Keeps the sample so beat 05 of the
         brief still works. */
      var sample = [
        { sku: 'GYP-12-48', n: LeyvaOrder.bySku('GYP-12-48').n, unit: 370, qty: 10, total: 3700, u: 'lámina' },
        { sku: 'PTA-MET-3T-CAFE', n: LeyvaOrder.bySku('PTA-MET-3T-CAFE').n, unit: 4260, qty: 2, total: 8520, u: 'unidad' }
      ];
      var sub = sample.reduce(function (a, l) { return a + l.total; }, 0);
      var ask0 = nameAsk();
      ST.awaitingName = { lines: sample, total: sub };
      return {
        bubbles: ['Va pues, se la armo.', orderLines(sample), 'Total ' + money(sub) + '.'].concat(ask0.q),
        rail: ['Consulta: cotización', '2 líneas con precio en sistema', 'Suma ' + money(sub),
               'Entrega: sin dato → escalar'].concat(ask0.rail).concat(['Documento: ruta determinista, sin modelo']),
        localOnly: true,
        suppressDoc: true
      };
    }

    /* Price arithmetic runs BEFORE the product parser: "calcule el IVA de 10
       tubos" contains a perfectly parseable order, and answering it with the
       price alone ignores the question that was actually asked. */
    for (var pm = 0; pm < PRICE_MATH.length; pm++) {
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

    /* ---- CHANGE OF MIND -------------------------------------------------
       "10 de media" ... "mejor de una pulgada". Rule C: reconocerlo. The
       QUANTITY CARRIES OVER — he already told us how many, and making him say
       it again is the thing that makes an assistant feel like a form. */
    var chg = t.match(/\b(mejor|mejor dicho|cambi[eé]|cambio|en realidad|no,? mejor)\b/);
    if (chg && ST.order.length) {
      var newSize = null;
      for (var si = 0; si < LeyvaOrder.SIZEWORDS.length; si++) {
        if (LeyvaOrder.SIZEWORDS[si].re.test(LeyvaOrder.norm(text))) { newSize = LeyvaOrder.SIZEWORDS[si].size; break; }
      }
      if (newSize) {
        var lastL = ST.order[ST.order.length - 1];
        var alt = LeyvaOrder.byKind(LeyvaOrder.bySku(lastL.sku).kind)
                    .filter(function (x) { return x.size === newSize; })[0];
        if (alt) {
          var nl = { sku: alt.sku, n: alt.n, u: alt.u, unit: alt.p, qty: lastL.qty,
                     total: lastL.qty === null ? null : alt.p * lastL.qty };
          ST.order[ST.order.length - 1] = nl;
          var msgs = ['Ah, entonces mejor el de ' + prettySize(newSize) + '.'];
          msgs = msgs.concat(unitAndTotal(nl));
          return hit(msgs, ['PRE|Cambio de opinión: ' + prettySize(newSize),
                            'Cantidad anterior (' + (lastL.qty || 's/c') + ') se conserva',
                            'Unitario ' + money(nl.unit) + (nl.total ? ' · total ' + money(nl.total) : ''),
                            'Aritmética calculada, no redactada'], true);
        }
      }
    }

    /* ---- PRICED ANSWERS: unit AND total, always -------------------------
       Rule A. Every priced reply carries the unit price and, when a quantity
       was given, the computed total. The ferretero has to be able to check the
       arithmetic in his head; a total he cannot verify is worse than none. */
    var parsed = LeyvaOrder.parse(text, { inheritSize: ST.lastSize });
    if (parsed.lines.length || parsed.ambiguous.length) {
      rememberUse(t);
      if (parsed.inheritedSize) ST.lastSize = parsed.inheritedSize;
      parsed.lines.forEach(function (l) { if (l.qty) mergeOrder(l); });

      var out = [], trace = [];

      // one product, nothing ambiguous — the common case, kept short
      if (parsed.lines.length === 1 && !parsed.ambiguous.length) {
        var l0 = parsed.lines[0];
        if (ST.uso && !ST.usoDicho) { out.push(usoLead(ST.uso, l0)); ST.usoDicho = true; }
        out = out.concat(unitAndTotal(l0));
        trace = ['Consulta: precio', 'Coincidencia en catálogo: ' + l0.sku,
                 'Unitario ' + money(l0.unit) + (l0.total ? ' · ' + l0.qty + ' x ' + money(l0.unit) + ' = ' + money(l0.total) : ' · sin cantidad'),
                 l0.total ? 'Aritmética calculada, no redactada' : 'Se pregunta la cantidad',
                 'Sin dato de existencia'];
        if (ST.uso) trace.unshift('PRE|Uso declarado por el cliente: ' + ST.uso);
      } else {
        if (ST.uso && !ST.usoDicho) { out.push('Para ' + ST.uso + ', le paso los precios.'); ST.usoDicho = true; }
        else out.push('Va, le paso los precios.');
        if (parsed.lines.length) out.push(orderLines(parsed.lines));
        var allQty = parsed.lines.length && parsed.lines.every(function (l) { return l.qty; });
        if (allQty && parsed.lines.length > 1) out.push('Todo junto: ' + money(parsed.sum) + '.');
        var inf = parsed.lines.filter(function (l) { return l.inferido; });
        if (inf.length) out.push('Los ' + inf[0].n.split(' ')[0] + 's se los puse de ' + prettySize(inf[0].inferido) + ', como los tubos — si son de otra medida me dice.');
        parsed.ambiguous.forEach(function (a) { out.push(ambiguousAsk(a)); });
        trace = ['Consulta con varios productos',
                 parsed.lines.length + ' líneas con precio en sistema'];
        parsed.lines.forEach(function (l) { trace.push('  ' + (l.qty || 's/c') + ' x ' + money(l.unit) + (l.total ? ' = ' + money(l.total) : '')); });
        if (allQty && parsed.lines.length > 1) trace.push('Suma ' + money(parsed.sum) + ' — calculada, no redactada');
        parsed.ambiguous.forEach(function (a) { trace.push('AMBIGUO: ' + a.kind + ' → se pregunta, no se elige'); });
      }
      return hit(out, trace, true);
    }


    /* Asked for a family we DO stock, but no specific product branch matched —
       a bare "¿a cómo la lámina?" or "¿qué pegamento tienen?". Falling through
       to "no lo manejo" here would be a FALSE STATEMENT ABOUT THEIR STOCK,
       which is the same class of error as substituting, pointed the other way.
       Answer with what the family actually contains and ask which one. */
    var fam = resolveAsk(t);
    if (fam && !fam.absent && fam.fam.presente) {
      return hit(['En ' + fam.fam.label + ' tengo ' + listOf(fam.fam) + '.', '¿Cuál le sirve?'],
        ['Consulta por familia: ' + fam.fam.label,
         'Sin producto específico en la pregunta',
         'Se lista lo de esa familia y se pregunta — no se elige por el cliente']);
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

  return {
    local: local,
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
