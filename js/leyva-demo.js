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
  var ST = { awaitingName: null, awaitingQty: null, nudged: false };
  function resetState() { ST.awaitingName = null; ST.awaitingQty = null; ST.nudged = false; }

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

    /* Cotización — TWO STEPS, deliberately.

       Step 1 (here) quotes the lines and ASKS WHOSE NAME goes on the
       document. Step 2 is the ST.awaitingName branch above, which issues it.
       The split is the rule "ask for the name only when building a proforma,
       because that is when it is genuinely needed" made structural: the name
       is never requested as a greeting, and a document is never produced with
       a name nobody confirmed.

       No document is emitted on this turn — `suppressDoc` tells the chat
       layer not to render a PDF card from these lines yet. */
    if (/cotiza|proforma|proform|proformar|presupuesto|me arma|s[úu]meme|cu[áa]nto me sale todo/.test(t)) {
      var lines = [
        { q: 10, it: LOCAL_PRICES.gypsum },
        { q: 2, it: LOCAL_PRICES.puerta3 }
      ];
      var sub = lines.reduce(function (a, l) { return a + l.q * l.it.p; }, 0);
      var ask = nameAsk();
      ST.awaitingName = {
        lines: lines.map(function (l) { return { sku: l.it.sku, qty: l.q, desc: l.it.n, unit: l.it.p, total: l.q * l.it.p }; }),
        total: sub
      };
      return {
        bubbles: [
          'Va pues, se la armo.',
          lines.map(function (l) { return l.q + ' ' + l.it.n + ' — ' + money(l.q * l.it.p); }).join('\n'),
          'Total ' + money(sub) + '.'
        ].concat(ask.q),
        rail: ['Consulta: cotización', '2 líneas con precio en sistema', 'Suma ' + money(sub),
               'Entrega: sin dato → escalar'].concat(ask.rail)
             .concat(['Documento: ruta determinista, sin modelo']),
        localOnly: true,
        suppressDoc: true
      };
    }

    // Multi-product in one message — quote every priced match, not just the
    // first. "gypsum y una puerta cafe, cuanto sale todo" must not answer
    // about gypsum alone.
    var multi = [];
    if (/gypsum/.test(t)) multi.push(LOCAL_PRICES.gypsum);
    if (/puerta/.test(t)) multi.push(/caoba|5 tablero/.test(t) ? LOCAL_PRICES.puerta5 : (/blanc|6 tablero/.test(t) ? LOCAL_PRICES.puerta6 : LOCAL_PRICES.puerta3));
    if (/tabla|madera/.test(t)) multi.push(LOCAL_PRICES.tabla);
    if (/bondex/.test(t)) multi.push(/premium|ceramica/.test(t) ? LOCAL_PRICES.bondexp : LOCAL_PRICES.bondex);
    if (/llanta/.test(t)) multi.push(/90\/90|17 tl/.test(t) ? LOCAL_PRICES.llanta90 : LOCAL_PRICES.llanta17);
    if (/bateria|kobe/.test(t)) multi.push(/12n7|\b7\b/.test(t) ? LOCAL_PRICES.bat74 : LOCAL_PRICES.bat65);
    if (/aceite|yamalube|20w/.test(t)) multi.push(LOCAL_PRICES.aceite);
    if (multi.length > 1) {
      var tot = multi.reduce(function (a, x) { return a + x.p; }, 0);
      return hit(['Va, le paso los precios.',
        multi.map(function (x) { return x.n + ' — ' + money(x.p); }).join('\n'),
        'Junto le sale ' + money(tot) + ', uno de cada uno. Dígame cantidades y se la afino.'],
        ['Consulta con varios productos', multi.length + ' coincidencias', 'Suma ' + money(tot)]);
    }

    // Vague ask — do not guess a product. Ask what it is for.
    if (/algo para|lo mas barato|lo mas economico|que me recomienda|no se que ocupo|algo que sirva/.test(t)) {
      return hit(['Depende de para qué lo ocupa.', '¿Es para techo, pared, piso o moto?'],
        ['Consulta vaga', 'Pide contexto antes de recomendar']);
    }

    // Priced lookups.
    var key = null;
    if (/gypsum|gipsum|yeso/.test(t)) key = 'gypsum';
    else if (/puerta/.test(t) && /caoba|5 tablero/.test(t)) key = 'puerta5';
    else if (/puerta/.test(t) && /blanc|6 tablero/.test(t)) key = 'puerta6';
    else if (/puerta/.test(t)) key = 'puerta3';
    else if (/tabla|madera/.test(t)) key = 'tabla';
    else if (/bondex/.test(t) && /premium|cer[áa]mica/.test(t)) key = 'bondexp';
    else if (/bondex|pega/.test(t)) key = 'bondex';
    else if (/aceite|yamalube|20w/.test(t)) key = 'aceite';
    else if (/bater[íi]a|kobe/.test(t) && /7|12n7/.test(t)) key = 'bat74';
    else if (/bater[íi]a|kobe/.test(t)) key = 'bat65';
    else if (/llanta|neum[áa]tico|rin/.test(t) && /90\/90|17 tl/.test(t)) key = 'llanta90';
    else if (/llanta|neum[áa]tico|rin/.test(t)) key = 'llanta17';

    if (key) {
      var it = LOCAL_PRICES[key];
      var msgs = ['Fíjese que sí, esa la tenemos.'];
      if (it.antes) {
        msgs.push('Le queda a ' + money(it.p) + ', andaba en ' + money(it.antes) + '.');
        msgs.push('Está en promoción patrias.');
      } else {
        msgs.push('Le queda a ' + money(it.p) + '.');
      }
      return hit(msgs, ['Consulta: precio', 'Coincidencia en catálogo', it.antes ? 'Precio de promoción aplicado' : 'Precio único', 'Sin dato de existencia']);
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
